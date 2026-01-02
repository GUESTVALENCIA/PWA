/**
 * Voice Services Integration
 * Wraps Deepgram (STT Streaming), Native Local Voice (no TTS latency), AI (Groq/OpenAI), and Welcome Audio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import logger from '../utils/logger.js';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceServices {
  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    // 🚫 CARTESIA DESHABILITADO: No usar API de Cartesia - solo voz nativa
    // this.cartesiaApiKey = process.env.CARTESIA_API_KEY; // NO USAR
    // this.cartesiaVoiceId = process.env.CARTESIA_VOICE_ID || 'sandra'; // NO USAR
    this.cartesiaApiKey = null; // Forzado a null para asegurar que NO se use
    this.cartesiaVoiceId = null; // Forzado a null
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
      idleTimeoutMs = 600, // 🚀 ENTERPRISE MAX: Default reducido a 600ms para latencia mínima
      onTranscriptionFinalized = null,
      onTranscriptionUpdated = null,
      onError = null,
      onClose = null
    } = options;

    logger.info('[DEEPGRAM] 🔌 Creating streaming connection...');

    const liveOptions = {
      // 🚀 ENTERPRISE MAX: Modelo optimizado para llamadas telefónicas de alta calidad
      model: 'nova-2-phonecall', // Optimizado específicamente para llamadas conversacionales
      
      // 🚀 ENTERPRISE MAX: Configuración de idioma
      language: language,
      
      // 🚀 ENTERPRISE MAX: Formateo inteligente para mejor legibilidad
      punctuate: true,
      smart_format: true,
      
      // 🚀 ENTERPRISE MAX: Resultados parciales en tiempo real (latencia mínima)
      interim_results: true,
      
      // 🚀 ENTERPRISE MAX: Endpointing optimizado para detección rápida de fin de frase
      endpointing: 250, // 250ms - latencia mínima para enterprise (default: 300ms)
      
      // 🚀 ENTERPRISE MAX: Voice Activity Detection (detecta cuando usuario habla/calla)
      vad_events: true,
      
      // 🚀 ENTERPRISE MAX: Segmentación de utterances (detecta fin de frase natural)
      utterances: true,
      
      // 🚀 ENTERPRISE MAX: Tiempo de espera optimizado para balance latencia/precisión
      utterance_end_ms: Math.max(300, Math.min(600, Number(idleTimeoutMs) || 600)),
      
      // 🚀 ENTERPRISE MAX: Elimina palabras de relleno para llamadas profesionales
      filler_words: false,
      
      // 🚀 ENTERPRISE MAX: Reconocimiento mejorado de números en español
      numerals: true,
      
      // 🚀 ENTERPRISE MAX: Detección de múltiples hablantes (diarización)
      // diarize: false, // Desactivado por defecto (solo un hablante: usuario)
      
      // 🚀 ENTERPRISE MAX: Corrección automática de transcripciones comunes
      // replace: [], // Array opcional de reemplazos personalizados
      
      // 🚀 ENTERPRISE MAX: Keywords para mejor reconocimiento de términos específicos
      // keywords: [], // Array opcional de palabras clave para mejorar precisión
      
      // 🚀 ENTERPRISE MAX: Búsqueda en transcripciones (útil para análisis)
      // search: [], // Array opcional de términos para buscar
      
      // 🚀 ENTERPRISE MAX: Redacción de información sensible (privacidad)
      // redact: false, // Desactivado por defecto (activar si se requiere privacidad extrema)
      
      // 🚀 ENTERPRISE MAX: Tier de calidad (mejora precisión a costa de latencia)
      // tier: 'nova', // Opciones: 'base', 'enhanced', 'nova' (mejor calidad)
      
      // 🚀 ENTERPRISE MAX: Profundidad de contexto para mejor precisión
      // tier: 'nova' ya está incluido en 'nova-2-phonecall'
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
      }, Math.max(300, Number(idleTimeoutMs) || 600)); // 🚀 ENTERPRISE MAX: Reducido a 600ms
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
   * Generate voice audio - supports both native audio and Deepgram TTS streaming
   * @param {string} text - Text to synthesize (required for TTS, optional for native)
   * @param {Object} options - Options { useNative: boolean, model: string, streaming: boolean }
   * @returns {Promise<{type: 'native'|'tts'|'streaming', data: Buffer|string|WebSocket}>}
   */
  async generateVoice(text, options = {}) {
    // Handle legacy call signature (text, voiceId)
    if (typeof options === 'string' || options === null) {
      options = { streaming: true, model: 'aura-2-carina-es' };
    }

    const { useNative = false, model = 'aura-2-carina-es', streaming = true } = options;

    // Option 1: Use native audio file (lowest latency)
    if (useNative) {
      try {
        const nativeAudioPath = path.join(__dirname, '../../assets/audio/sandra-conversational.wav');
        if (fs.existsSync(nativeAudioPath)) {
          const audioBuffer = fs.readFileSync(nativeAudioPath);
          logger.info('[TTS] ✅ Using native audio file (lowest latency)');
          return {
            type: 'native',
            data: audioBuffer,
            format: 'wav',
            sampleRate: 24000
          };
        } else {
          logger.warn('[TTS] ⚠️ Native audio file not found, falling back to TTS');
        }
      } catch (error) {
        logger.error('[TTS] ❌ Error loading native audio:', error);
      }
    }

    // Option 2: Deepgram TTS WebSocket streaming (dynamic responses, lowest latency)
    if (streaming && text && text.trim() !== '') {
      logger.info(`[TTS] 🎙️ Creating TTS WebSocket streaming for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      try {
        const ttsWs = await this.createTTSStreamingConnection(model);
        return {
          type: 'streaming',
          ws: ttsWs,
          model: model,
          text: text // Store text for later use
        };
      } catch (error) {
        logger.error('[TTS] ❌ Error creating TTS WebSocket, falling back to REST:', error);
        // Fall through to REST API
      }
    }

    // Option 3: Deepgram TTS REST API (fallback, MP3 + base64)
    if (!text || text.trim() === '') {
      throw new Error('Text is required for TTS generation');
    }

    logger.info(`[TTS] 🎙️ Generating audio with Deepgram TTS REST API for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // Use Deepgram TTS REST API with Spanish voice model
    // Note: aura-2-thalia-es doesn't exist, using nestor-es or carina-es
    const audioBase64 = await this._generateDeepgramTTS(text, model);
    
    logger.info('[TTS] ✅ Audio generated successfully with Deepgram TTS REST API');
    return {
      type: 'tts',
      data: audioBase64,
      format: 'mp3'
    };
  }

  /**
   * Create Deepgram TTS WebSocket streaming connection
   * Returns WebSocket for streaming PCM audio (linear16)
   * @param {string} model - Deepgram voice model (aura-2-nestor-es, aura-2-carina-es, etc.)
   * @returns {Promise<WebSocket>} WebSocket connection for TTS streaming
   */
  async createTTSStreamingConnection(model = 'aura-2-carina-es') {
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://api.deepgram.com/v1/speak', {
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      ws.on('open', () => {
        // Configure connection for PCM streaming
        ws.send(JSON.stringify({
          type: 'Configure',
          model: model,
          encoding: 'linear16', // PCM 16-bit
          sample_rate: 24000 // 24kHz (optimal for voice)
        }));
        
        logger.info(`[TTS] ✅ Deepgram TTS WebSocket connected and configured (model: ${model})`);
        resolve(ws);
      });

      ws.on('error', (error) => {
        logger.error('[TTS] ❌ TTS WebSocket error:', error);
        reject(error);
      });

      // Set timeout for connection
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('TTS WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Send text to TTS WebSocket for synthesis
   * @param {WebSocket} ttsWs - TTS WebSocket connection
   * @param {string} text - Text to synthesize
   */
  sendTextToTTS(ttsWs, text) {
    if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
      ttsWs.send(JSON.stringify({
        type: 'Speak',
        text: text
      }));
      logger.info(`[TTS] 📤 Sent text to TTS: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    } else {
      logger.error('[TTS] ❌ TTS WebSocket not open');
    }
  }

  /**
   * Flush TTS buffer to start audio generation
   * @param {WebSocket} ttsWs - TTS WebSocket connection
   */
  flushTTS(ttsWs) {
    if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
      ttsWs.send(JSON.stringify({ type: 'Flush' }));
      logger.info('[TTS] 🔄 Flushed TTS buffer');
    }
  }

  /**
   * Clear TTS buffer (for barge-in)
   * @param {WebSocket} ttsWs - TTS WebSocket connection
   */
  clearTTS(ttsWs) {
    if (ttsWs && ttsWs.readyState === WebSocket.OPEN) {
      ttsWs.send(JSON.stringify({ type: 'Clear' }));
      logger.info('[TTS] 🧹 Cleared TTS buffer');
    }
  }

  /**
   * Generate TTS audio using Deepgram REST API (fallback)
   * @private
   */
  async _generateDeepgramTTS(text, model = 'aura-2-carina-es') {
    // Deepgram TTS models for Spanish: aura-2-nestor-es, aura-2-carina-es, aura-2-silvia-es
    // Note: aura-2-thalia-es does NOT exist - using nestor-es (masculine) or carina-es (feminine)
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

    try {
      // Deepgram TTS REST endpoint - fallback when WebSocket streaming is not available
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
      logger.info('[TTS] ✅ Audio generated successfully with Deepgram REST API (MP3)');
      return audioBase64;
    } catch (error) {
      logger.error('[TTS] Deepgram TTS REST API error:', error);
      throw error;
    }
  }

  /**
   * Generate TTS audio using Cartesia API
   * @private
   * ⚠️ DESHABILITADO: No se usa Cartesia - solo voz nativa (archivo WAV)
   * Este método existe pero NO debe ser llamado
   */
  async _generateCartesiaTTS(text, voiceId) {
    // 🚫 BLOQUEADO: Cartesia deshabilitado - usar solo voz nativa
    logger.error('[CARTESIA] ❌ ERROR: Intento de usar Cartesia TTS - está DESHABILITADO');
    logger.error('[CARTESIA] ❌ Solo se debe usar voz nativa (sandra-conversational.wav)');
    throw new Error('Cartesia TTS está DESHABILITADO. Usar solo voz nativa (sandra-conversational.wav).');
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
   * Get welcome audio - DEPRECATED: Now uses Deepgram TTS dynamically
   * ⚠️ ESTE MÉTODO YA NO SE DEBE USAR - Todo audio debe generarse con Deepgram TTS
   */
  async getWelcomeAudio() {
    logger.error('[TTS] ❌ ERROR: getWelcomeAudio() llamado - Este método está DESHABILITADO');
    logger.error('[TTS] ❌ Todos los audios deben generarse con Deepgram TTS usando generateVoice(text)');
    throw new Error('getWelcomeAudio() está DESHABILITADO. Usar generateVoice(text) con Deepgram TTS en su lugar.');
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
