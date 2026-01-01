/**
 * Voice Services Integration
 * Wraps Deepgram (STT Streaming), Native Local Voice (no TTS latency), AI (Groq/OpenAI), and Welcome Audio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
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
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.preferredProvider = (process.env.PREFERRED_AI_PROVIDER || 'groq').toLowerCase();
    
    // Log configured providers for debugging
    const configuredProviders = [];
    if (this.groqApiKey) configuredProviders.push('Groq');
    if (this.openaiApiKey) configuredProviders.push('OpenAI');
    if (this.geminiApiKey) configuredProviders.push('Gemini');
    
    logger.info('[VOICE-SERVICES] AI Providers status:', {
      configured: configuredProviders.length > 0 ? configuredProviders.join(', ') : 'NONE',
      groq: this.groqApiKey ? `✅ (${this.groqApiKey.length} chars)` : '❌',
      openai: this.openaiApiKey ? `✅ (${this.openaiApiKey.length} chars)` : '❌',
      gemini: this.geminiApiKey ? `✅ (${this.geminiApiKey.length} chars)` : '❌',
      preferred: this.preferredProvider
    });
    
    if (configuredProviders.length === 0) {
      logger.error('[VOICE-SERVICES] ⚠️ WARNING: No AI providers configured!');
      logger.error('[VOICE-SERVICES] Configure at least one: GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY');
    }
    
    // Initialize Deepgram SDK instance (v3 format)
    if (this.deepgramApiKey) {
      try {
        this.deepgram = createClient(this.deepgramApiKey);
        logger.info('[VOICE-SERVICES] ✅ Deepgram SDK initialized successfully (v3)');
      } catch (error) {
        logger.error('[VOICE-SERVICES] ❌ Failed to initialize Deepgram SDK:', error);
        this.deepgram = null;
        // Don't throw - allow service to initialize with null deepgram for graceful degradation
      }
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
      logger.error('[VOICE-SERVICES] createStreamingConnection called but Deepgram SDK not initialized');
      throw new Error('Deepgram SDK not initialized - check DEEPGRAM_API_KEY');
    }

    const {
      language = 'es',
      encoding = null,
      sampleRate = null,
      channels = null,
      idleTimeoutMs = 1200,
      onTranscriptionFinalized = null,
      onTranscriptionUpdated = null,
      onError = null,
      onClose = null
    } = options;

    logger.info('[DEEPGRAM] 🔌 Creating streaming connection...');

    const liveOptions = {
      model: 'nova-2',
      language: language,
      punctuate: true,
      smart_format: true,
      interim_results: true, // CRITICAL: Partial results in real-time
      endpointing: 300, // CRITICAL: Detect 300ms of silence = end of phrase
      vad_events: true, // CRITICAL: Voice Activity Detection
      // Enable utterance segmentation (helps reliably fire UtteranceEnd events)
      utterances: true,
      utterance_end_ms: Math.max(300, Math.min(2000, Number(idleTimeoutMs) || 1200))
    };

    if (encoding) liveOptions.encoding = encoding;
    if (sampleRate) liveOptions.sample_rate = sampleRate;
    if (channels) liveOptions.channels = channels;

    const connection = this.deepgram.listen.live(liveOptions);

    let finalizedUtterance = '';
    let interimUtterance = '';
    let lastMessage = null;
    let idleTimer = null;

    const clearIdleTimer = () => {
      if (!idleTimer) return;
      clearTimeout(idleTimer);
      idleTimer = null;
    };

    const buildUtterance = () => `${finalizedUtterance} ${interimUtterance}`.trim();

    const flushFinalizedUtterance = (reason, message) => {
      if (!onTranscriptionFinalized) return;
      const transcript = buildUtterance();
      if (!transcript) return;

      clearIdleTimer();
      finalizedUtterance = '';
      interimUtterance = '';

      logger.info(`[DEEPGRAM] ✅ Utterance finalized (${reason}): "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
      onTranscriptionFinalized(transcript, message);
    };

    const scheduleIdleFlush = () => {
      if (!onTranscriptionFinalized) return;
      clearIdleTimer();
      idleTimer = setTimeout(() => {
        try {
          flushFinalizedUtterance('idle_timeout', lastMessage);
        } catch (error) {
          logger.error('[DEEPGRAM] Error flushing idle utterance:', error);
        }
      }, Math.max(400, Number(idleTimeoutMs) || 1200));
    };

    // Set up event handlers (Deepgram JS SDK v3)
    connection.on(LiveTranscriptionEvents.Transcript, (message) => {
      const transcript = message?.channel?.alternatives?.[0]?.transcript || '';
      if (!transcript) return;

      lastMessage = message;

      if (message?.is_final) {
        finalizedUtterance = `${finalizedUtterance} ${transcript}`.trim();
        interimUtterance = '';
        if (message?.speech_final) {
          flushFinalizedUtterance('speech_final', message);
          return;
        }
        scheduleIdleFlush();
        return;
      }

      interimUtterance = transcript;
      if (onTranscriptionUpdated) {
        onTranscriptionUpdated(transcript, message);
      }
      scheduleIdleFlush();
    });

    if (onTranscriptionFinalized) {
      connection.on(LiveTranscriptionEvents.UtteranceEnd, (message) => {
        lastMessage = message;
        flushFinalizedUtterance('utterance_end', message);
      });
    }

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      clearIdleTimer();
      logger.error('[DEEPGRAM] ❌ Connection error:', error);
      logger.error('[DEEPGRAM] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 200)
      });

      if (onError) {
        onError(error);
      }
    });

    if (onClose) {
      connection.on(LiveTranscriptionEvents.Close, () => {
        clearIdleTimer();
        logger.info('[DEEPGRAM] 🔌 Connection closed');
        onClose();
      });
    }

    const connectionSummary = {
      encoding: encoding || 'auto',
      sampleRate: sampleRate || 'auto',
      channels: channels || 'auto',
      idleTimeoutMs: Math.max(400, Number(idleTimeoutMs) || 1200)
    };

    logger.info('[DEEPGRAM] ✅ Streaming connection created', connectionSummary);
    
    // Log connection state for debugging
    if (connection.getReadyState) {
      logger.info(`[DEEPGRAM] Connection ready state: ${connection.getReadyState()}`);
    }
    
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
  /**
   * Generate TTS audio from text using Cartesia API (real-time TTS)
   * Falls back to native voice file if Cartesia is not available
   */
  async generateVoice(text, voiceId = null) {
    if (!text || text.trim() === '') {
      // If no text provided, return welcome audio file (for initial greeting)
      return await this.getWelcomeAudio();
    }

    // USE NATIVE VOICE FILE FIRST (to eliminate TTS latency)
    // This is a purchased native audio file, not generated by TTS APIs
    const nativeVoicePath = path.join(__dirname, '../../assets/audio/sandra-conversational.wav');
    
    // Try alternative paths if the first doesn't work
    const possiblePaths = [
      nativeVoicePath,
      path.join(process.cwd(), 'assets/audio/sandra-conversational.wav'),
      path.join(__dirname, '../../../assets/audio/sandra-conversational.wav')
    ];

    for (const voicePath of possiblePaths) {
      if (fs.existsSync(voicePath)) {
        logger.info(`[VOICE] 📁 Using native voice file (purchased audio - no TTS latency): ${voicePath}`);
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
        logger.info(`[VOICE] 📁 Using welcome audio as fallback: ${welcomePath}`);
        const audioBuffer = fs.readFileSync(welcomePath);
        return audioBuffer.toString('base64');
      }
    }

    throw new Error('Native voice audio file not found. Expected: assets/audio/sandra-conversational.wav or assets/audio/welcome.mp3');
  }

  /**
   * Generate TTS audio using Deepgram API
   * @private
   */
  async _generateDeepgramTTS(text, model = 'aura-2-thalia-es') {
    // Deepgram TTS models for Spanish: aura-2-thalia-es, aura-2-luna-es, etc.
    // Specify encoding and sample_rate for consistent audio output
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

    try {
      // Deepgram TTS endpoint - usar encoding mp3 sin especificar sample_rate para evitar problemas de velocidad
      // Si se especifica sample_rate incorrecto puede causar audio acelerado
      const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram TTS API Error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      logger.info('[TTS] ✅ Audio generated successfully with Deepgram (MP3)');
      return audioBase64;
    } catch (error) {
      logger.error('[TTS] Deepgram TTS error:', error);
      throw error;
    }
  }

  /**
   * Generate TTS audio using Cartesia API
   * @private
   */
  async _generateCartesiaTTS(text, voiceId) {
    const url = 'https://api.cartesia.ai/tts/bytes';
    const payload = {
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId
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
    const audioBuffer = Buffer.from(arrayBuffer);
    return audioBuffer.toString('base64');
  }

  /**
   * Process message with AI (Groq preferred, OpenAI and Gemini as fallbacks)
   */
  async processMessage(userMessage) {
    const systemPrompt = `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.`;

    const errors = [];

    // Try preferred provider first
    if (this.preferredProvider === 'groq' && this.groqApiKey) {
      try {
        logger.info('[AI] Attempting Groq (preferred)...');
        return await this._callGroq(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'Groq', error: error.message });
        logger.warn('[AI] Groq failed:', error.message);
      }
    } else if (this.preferredProvider === 'openai' && this.openaiApiKey) {
      try {
        logger.info('[AI] Attempting OpenAI (preferred)...');
        return await this._callOpenAI(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'OpenAI', error: error.message });
        logger.warn('[AI] OpenAI failed:', error.message);
      }
    } else if (this.preferredProvider === 'gemini' && this.geminiApiKey) {
      try {
        logger.info('[AI] Attempting Gemini (preferred)...');
        return await this._callGemini(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'Gemini', error: error.message });
        logger.warn('[AI] Gemini failed:', error.message);
      }
    }

    // Try all other providers as fallbacks
    if (this.preferredProvider !== 'groq' && this.groqApiKey) {
      try {
        logger.info('[AI] Attempting Groq (fallback)...');
        return await this._callGroq(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'Groq', error: error.message });
        logger.warn('[AI] Groq fallback failed:', error.message);
      }
    }

    if (this.preferredProvider !== 'openai' && this.openaiApiKey) {
      try {
        logger.info('[AI] Attempting OpenAI (fallback)...');
        return await this._callOpenAI(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'OpenAI', error: error.message });
        logger.warn('[AI] OpenAI fallback failed:', error.message);
      }
    }

    if (this.preferredProvider !== 'gemini' && this.geminiApiKey) {
      try {
        logger.info('[AI] Attempting Gemini (fallback)...');
        return await this._callGemini(userMessage, systemPrompt);
      } catch (error) {
        errors.push({ provider: 'Gemini', error: error.message });
        logger.warn('[AI] Gemini fallback failed:', error.message);
      }
    }

    // All providers failed
    if (errors.length === 0) {
      // No providers configured at all
      const configured = [];
      if (this.groqApiKey) configured.push('Groq');
      if (this.openaiApiKey) configured.push('OpenAI');
      if (this.geminiApiKey) configured.push('Gemini');
      
      if (configured.length === 0) {
        const errorMsg = 'No AI providers configured. Configure at least one: GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in Render Dashboard.';
        logger.error('[AI] ' + errorMsg);
        throw new Error(errorMsg);
      } else {
        const errorMsg = `All configured AI providers failed. Configured: ${configured.join(', ')}. Check API keys in Render Dashboard.`;
        logger.error('[AI] ' + errorMsg);
        throw new Error(errorMsg);
      }
    } else {
      const errorMessage = `All AI providers failed. Errors: ${errors.map(e => `${e.provider}: ${e.error.substring(0, 100)}`).join('; ')}`;
      logger.error('[AI] All providers failed:', errors);
      throw new Error(errorMessage);
    }
  }

  async _callOpenAI(userMessage, systemPrompt) {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
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
          temperature: 0.7,
          max_tokens: 200
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = errorText.length > 200 ? errorText.substring(0, 200) : errorText;
        throw new Error(`OpenAI Error ${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('OpenAI: Invalid response format');
      }
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('OpenAI: Request timeout (30s)');
      }
      throw error;
    }
  }

  async _callGroq(userMessage, systemPrompt) {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
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
          temperature: 0.7,
          max_tokens: 200
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = errorText.length > 200 ? errorText.substring(0, 200) : errorText;
        throw new Error(`Groq Error ${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Groq: Invalid response format');
      }
      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Groq: Request timeout (30s)');
      }
      throw error;
    }
  }

  async _callGemini(userMessage, systemPrompt) {
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUsuario: ${userMessage}\n\nSandra:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = errorText.length > 200 ? errorText.substring(0, 200) : errorText;
        throw new Error(`Gemini Error ${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Gemini: Invalid response format');
      }
      
      const text = data.candidates[0].content.parts[0]?.text;
      if (!text) {
        throw new Error('Gemini: No text in response');
      }
      
      return text.trim();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Gemini: Request timeout (30s)');
      }
      throw error;
    }
  }

  /**
   * Get welcome audio (pre-recorded file)
   * Uses the same conversational voice file for consistent tone
   */
  async getWelcomeAudio() {
    // Use the same conversational voice file for welcome message (same tone, no latency)
    const nativeVoicePath = path.join(__dirname, '../../assets/audio/sandra-conversational.wav');
    
    const possiblePaths = [
      nativeVoicePath,
      path.join(process.cwd(), 'assets/audio/sandra-conversational.wav'),
      path.join(__dirname, '../../../assets/audio/sandra-conversational.wav')
    ];

    for (const voicePath of possiblePaths) {
      if (fs.existsSync(voicePath)) {
        logger.info(`📁 Using conversational voice for welcome (same tone, no latency): ${voicePath}`);
        const audioBuffer = fs.readFileSync(voicePath);
        return audioBuffer.toString('base64');
      }
    }

    // Fallback: try welcome.mp3 if conversational.wav not found
    logger.warn('⚠️ Conversational voice file not found, trying welcome.mp3 as fallback');
    const welcomePaths = [
      path.join(__dirname, '../../assets/audio/welcome.mp3'),
      path.join(process.cwd(), 'assets/audio/welcome.mp3'),
      path.join(__dirname, '../../../assets/audio/welcome.mp3')
    ];

    for (const welcomePath of welcomePaths) {
      if (fs.existsSync(welcomePath)) {
        logger.info(`📁 Using welcome.mp3 as fallback: ${welcomePath}`);
        const audioBuffer = fs.readFileSync(welcomePath);
        return audioBuffer.toString('base64');
      }
    }

    throw new Error('Welcome audio file not found. Expected: assets/audio/sandra-conversational.wav or assets/audio/welcome.mp3');
  }
}

// Create singleton instance
let voiceServicesInstance = null;
try {
  voiceServicesInstance = new VoiceServices();
  logger.info('[VOICE-SERVICES] ✅ VoiceServices instance created successfully');
  logger.info('[VOICE-SERVICES] Instance structure:', {
    hasDeepgram: !!voiceServicesInstance.deepgram,
    hasGenerateVoice: typeof voiceServicesInstance.generateVoice === 'function',
    hasAI: !!voiceServicesInstance.ai,
    hasGetWelcomeAudio: typeof voiceServicesInstance.getWelcomeAudio === 'function'
  });
} catch (error) {
  logger.error('[VOICE-SERVICES] ❌ Failed to create VoiceServices instance:', error);
  logger.error('[VOICE-SERVICES] Error details:', {
    message: error.message,
    stack: error.stack?.substring(0, 300)
  });
  // Create a minimal instance to prevent module import failure
  // This will cause server.js validation to fail, which is correct behavior
  voiceServicesInstance = {
    deepgram: null,
    generateVoice: () => Promise.reject(new Error('VoiceServices not initialized')),
    ai: { processMessage: () => Promise.reject(new Error('VoiceServices not initialized')) },
    getWelcomeAudio: () => Promise.reject(new Error('VoiceServices not initialized'))
  };
}

const deepgramConfigured = !!voiceServicesInstance?.deepgram;

// Export service methods as an object for use in WebSocket handler
const exportedServices = {
  deepgram: {
    isConfigured: deepgramConfigured,
    createStreamingConnection: (options) => voiceServicesInstance.createStreamingConnection(options),
    transcribeAudio: (audio, format) => voiceServicesInstance.transcribeAudio(audio, format) // Deprecated - use createStreamingConnection
  },
  generateVoice: (text, voiceId) => voiceServicesInstance.generateVoice(text, voiceId), // Directly expose generateVoice (native local voice, not Cartesia)
  ai: {
    processMessage: (message) => voiceServicesInstance.processMessage(message)
  },
  getWelcomeAudio: () => voiceServicesInstance.getWelcomeAudio(),
  capabilities: {
    stt: deepgramConfigured
  }
};

// Log export structure for debugging
logger.info('[VOICE-SERVICES] Export structure:', {
  hasDeepgram: !!exportedServices.deepgram,
  hasGenerateVoice: typeof exportedServices.generateVoice === 'function',
  hasAI: !!exportedServices.ai,
  hasGetWelcomeAudio: typeof exportedServices.getWelcomeAudio === 'function',
  exportKeys: Object.keys(exportedServices)
});

export default exportedServices;
