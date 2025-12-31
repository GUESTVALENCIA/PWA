/**
 * Voice Services Integration
 * Wraps Deepgram (STT), Cartesia (TTS), AI (Gemini/GPT-4), and Welcome Audio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceServices {
  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    this.cartesiaApiKey = process.env.CARTESIA_API_KEY;
    this.cartesiaVoiceId = process.env.CARTESIA_VOICE_ID || 'sandra';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.preferredProvider = (process.env.PREFERRED_AI_PROVIDER || 'groq').toLowerCase();
  }

  /**
   * Transcribe audio using Deepgram
   */
  async transcribeAudio(audioBase64, format = 'webm') {
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API Key not configured');
    }

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      throw new Error('Invalid audio data: expected base64 string');
    }

    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
      if (audioBuffer.length === 0) {
        throw new Error('Empty audio buffer after decoding');
      }
    } catch (error) {
      throw new Error(`Failed to decode audio base64: ${error.message}`);
    }

    // Determinar Content-Type basado en el formato
    const contentType = format === 'webm' ? 'audio/webm' : 
                        format === 'mp3' ? 'audio/mpeg' :
                        format === 'wav' ? 'audio/wav' : 'audio/webm';

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': contentType,
        },
        body: audioBuffer
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepgram Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return transcript;
  }

  /**
   * Generate voice using Cartesia
   */
  async generateVoice(text, voiceId = null) {
    if (!this.cartesiaApiKey) {
      throw new Error('Cartesia API Key not configured');
    }

    const selectedVoice = voiceId || this.cartesiaVoiceId;
    const url = 'https://api.cartesia.ai/tts/bytes';
    const payload = {
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: selectedVoice
      },
      output_format: {
        container: 'mp3',
        sample_rate: 24000
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': this.cartesiaApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cartesia API Error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  /**
   * Process message with AI (Groq, Gemini, or GPT-4)
   */
  async processMessage(userMessage) {
    const systemPrompt = `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.`;

    // Try Groq first (preferred for this project)
    if ((this.preferredProvider === 'groq' || !this.preferredProvider) && this.groqApiKey) {
      try {
        return await this._callGroq(userMessage, systemPrompt);
      } catch (error) {
        logger.warn('Groq failed, trying fallback:', error.message);
      }
    }

    // Try Gemini as fallback
    if (this.geminiApiKey) {
      try {
        return await this._callGemini(userMessage, systemPrompt);
      } catch (error) {
        logger.warn('Gemini failed, trying OpenAI:', error.message);
      }
    }

    // Try OpenAI as last resort
    if (this.openaiApiKey) {
      try {
        return await this._callOpenAI(userMessage, systemPrompt);
      } catch (error) {
        logger.error('All AI providers failed:', error);
        throw new Error('All AI providers failed');
      }
    }

    throw new Error('No AI API keys configured');
  }

  async _callGemini(userMessage, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`;
    
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content) {
      throw new Error('Invalid response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async _callOpenAI(userMessage, systemPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async _callGroq(userMessage, systemPrompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen2.5-72b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Get welcome audio (pre-recorded file)
   */
  async getWelcomeAudio() {
    // Try to find welcome.mp3 in assets/audio/ (relative to project root)
    const possiblePaths = [
      path.join(__dirname, '../../assets/audio/welcome.mp3'),
      path.join(__dirname, '../../../assets/audio/welcome.mp3'),
      path.join(process.cwd(), 'assets/audio/welcome.mp3')
    ];

    for (const welcomePath of possiblePaths) {
      if (fs.existsSync(welcomePath)) {
        logger.info(`📁 Found welcome audio at: ${welcomePath}`);
        const audioBuffer = fs.readFileSync(welcomePath);
        return audioBuffer.toString('base64');
      }
    }

    // If file not found, generate a welcome message with TTS as fallback
    logger.warn('⚠️ Welcome audio file not found, using TTS fallback');
    const welcomeText = '¡Hola! Soy Sandra, tu asistente virtual de Guests Valencia. ¿En qué puedo ayudarte?';
    return await this.generateVoice(welcomeText);
  }
}

// Create singleton instance
const voiceServices = new VoiceServices();

// Export service methods as an object for use in WebSocket handler
export default {
  deepgram: {
    transcribeAudio: (audio) => voiceServices.transcribeAudio(audio)
  },
  cartesia: {
    generateVoice: (text, voiceId) => voiceServices.generateVoice(text, voiceId)
  },
  ai: {
    processMessage: (message) => voiceServices.processMessage(message)
  },
  getWelcomeAudio: () => voiceServices.getWelcomeAudio()
};
