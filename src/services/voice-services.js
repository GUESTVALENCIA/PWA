/**
 * Voice Services Integration
 * Wraps Deepgram (STT), Native Local Voice (no TTS latency), AI (Groq/OpenAI), and Welcome Audio
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
      // Validate minimum buffer size (at least 100 bytes for valid audio)
      if (audioBuffer.length < 100) {
        throw new Error(`Audio buffer too small: ${audioBuffer.length} bytes (minimum 100 bytes)`);
      }
    } catch (error) {
      throw new Error(`Failed to decode audio base64: ${error.message}`);
    }

    // Deepgram API: For WebM/Opus, we need to specify encoding in URL parameters
    // This is critical for proper audio processing
    let url = `https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true`;
    
    // Add encoding parameter for WebM/Opus format
    if (format === 'webm') {
      url += '&encoding=opus';
    } else if (format === 'mp3') {
      url += '&encoding=mp3';
    } else if (format === 'wav') {
      url += '&encoding=linear16';
    }
    
    logger.info(`🎤 Sending audio to Deepgram: ${audioBuffer.length} bytes, format: ${format}, url: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.deepgramApiKey}`,
        // Don't set Content-Type - let Deepgram auto-detect from binary data
        // This allows Deepgram to properly detect WebM/Opus format
      },
      body: audioBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Deepgram API error: ${response.status}`, { 
        status: response.status, 
        error: errorText,
        bufferSize: audioBuffer.length,
        format: format
      });
      throw new Error(`Deepgram Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    if (transcript) {
      logger.info(`✅ Deepgram transcription: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
    } else {
      logger.warn('⚠️ Deepgram returned empty transcript');
    }

    return transcript;
  }

  /**
   * Generate voice using native local audio file (eliminates Cartesia latency)
   */
  async generateVoice(text, voiceId = null) {
    // Use native local voice file instead of Cartesia API
    const nativeVoicePath = path.join(__dirname, '../../assets/audio/sandra-conversational.wav');
    
    // Try alternative paths if the first doesn't work
    const possiblePaths = [
      nativeVoicePath,
      path.join(process.cwd(), 'assets/audio/sandra-conversational.wav'),
      path.join(__dirname, '../../../assets/audio/sandra-conversational.wav')
    ];

    for (const voicePath of possiblePaths) {
      if (fs.existsSync(voicePath)) {
        logger.info(`📁 Using native voice file: ${voicePath}`);
        const audioBuffer = fs.readFileSync(voicePath);
        return audioBuffer.toString('base64');
      }
    }

    // Fallback: try welcome.mp3 if conversational.wav not found
    logger.warn('⚠️ Native conversational voice not found, trying welcome.mp3 as fallback');
    const welcomePaths = [
      path.join(__dirname, '../../assets/audio/welcome.mp3'),
      path.join(process.cwd(), 'assets/audio/welcome.mp3'),
      path.join(__dirname, '../../../assets/audio/welcome.mp3')
    ];

    for (const welcomePath of welcomePaths) {
      if (fs.existsSync(welcomePath)) {
        logger.info(`📁 Using welcome audio as fallback: ${welcomePath}`);
        const audioBuffer = fs.readFileSync(welcomePath);
        return audioBuffer.toString('base64');
      }
    }

    throw new Error('Native voice audio file not found. Expected: assets/audio/sandra-conversational.wav or assets/audio/welcome.mp3');
  }

  /**
   * Process message with AI (Groq preferred, OpenAI as fallback)
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
        logger.warn('Groq failed, trying OpenAI fallback:', error.message);
      }
    }

    // Try OpenAI as fallback
    if (this.openaiApiKey) {
      try {
        return await this._callOpenAI(userMessage, systemPrompt);
      } catch (error) {
        logger.error('All AI providers failed:', error);
        throw new Error('All AI providers failed');
      }
    }

    throw new Error('No AI API keys configured (Groq or OpenAI required)');
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

    // If file not found, try using conversational voice as fallback
    logger.warn('⚠️ Welcome audio file not found, using conversational voice as fallback');
    return await this.generateVoice(''); // Will use sandra-conversational.wav
  }
}

// Create singleton instance
const voiceServices = new VoiceServices();

// Export service methods as an object for use in WebSocket handler
export default {
  deepgram: {
    transcribeAudio: (audio, format) => voiceServices.transcribeAudio(audio, format)
  },
  cartesia: {
    generateVoice: (text, voiceId) => voiceServices.generateVoice(text, voiceId)
  },
  ai: {
    processMessage: (message) => voiceServices.processMessage(message)
  },
  getWelcomeAudio: () => voiceServices.getWelcomeAudio()
};
