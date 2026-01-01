/**
 * Voice Services Integration
 * Wraps Deepgram (STT Streaming), Native Local Voice (no TTS latency), AI (Groq/OpenAI), and Welcome Audio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Deepgram } from '@deepgram/sdk';
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
    
    // Initialize Deepgram SDK instance
    if (this.deepgramApiKey) {
      this.deepgram = new Deepgram(this.deepgramApiKey);
    } else {
      logger.warn('⚠️ Deepgram API Key not configured');
      this.deepgram = null;
    }
  }

  /**
   * Create Deepgram Streaming connection for a client
   * Returns a connection object with event handlers
   */
  createStreamingConnection(options = {}) {
    if (!this.deepgram) {
      throw new Error('Deepgram SDK not initialized - check DEEPGRAM_API_KEY');
    }

    const {
      language = 'es',
      onTranscriptionFinalized = null,
      onTranscriptionUpdated = null,
      onError = null,
      onClose = null
    } = options;

    logger.info('[DEEPGRAM] 🔌 Creating streaming connection...');

    const connection = this.deepgram.transcription.live({
      model: 'nova-2',
      language: language,
      punctuate: true,
      smart_format: true,
      interim_results: true, // CRITICAL: Partial results in real-time
      endpointing: 300, // CRITICAL: Detect 300ms of silence = end of phrase
      vad_events: true, // CRITICAL: Voice Activity Detection
      encoding: 'opus', // For WebM/Opus
      sample_rate: 48000 // Opus default sample rate
    });

    // Set up event handlers
    if (onTranscriptionFinalized) {
      connection.on('transcriptionFinalized', (message) => {
        const transcript = message.channel?.alternatives?.[0]?.transcript || '';
        if (transcript) {
          logger.info(`[DEEPGRAM] ✅ Transcription finalized: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
          onTranscriptionFinalized(transcript, message);
        }
      });
    }

    if (onTranscriptionUpdated) {
      connection.on('transcriptionUpdated', (message) => {
        const interim = message.channel?.alternatives?.[0]?.transcript || '';
        if (interim) {
          onTranscriptionUpdated(interim, message);
        }
      });
    }

    if (onError) {
      connection.on('error', (error) => {
        logger.error('[DEEPGRAM] ❌ Connection error:', error);
        onError(error);
      });
    }

    if (onClose) {
      connection.on('close', () => {
        logger.info('[DEEPGRAM] 🔌 Connection closed');
        onClose();
      });
    }

    logger.info('[DEEPGRAM] ✅ Streaming connection created');
    return connection;
  }

  /**
   * Transcribe audio using Deepgram (DEPRECATED - Use createStreamingConnection instead)
   * Kept for backward compatibility but should not be used for streaming chunks
   */
  async transcribeAudio(audioBase64, format = 'webm') {
    logger.warn('[DEEPGRAM] ⚠️ Using deprecated REST API - migrate to Streaming API');
    throw new Error('REST API deprecated - use createStreamingConnection for streaming audio');
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
    createStreamingConnection: (options) => voiceServices.createStreamingConnection(options),
    transcribeAudio: (audio, format) => voiceServices.transcribeAudio(audio, format) // Deprecated - use createStreamingConnection
  },
  cartesia: {
    generateVoice: (text, voiceId) => voiceServices.generateVoice(text, voiceId)
  },
  ai: {
    processMessage: (message) => voiceServices.processMessage(message)
  },
  getWelcomeAudio: () => voiceServices.getWelcomeAudio()
};
