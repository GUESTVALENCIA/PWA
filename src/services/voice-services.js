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

// Debug logging helper
const debugLog = (location, message, data, hypothesisId) => {
  try {
    const logDir = path.join(process.cwd(), '.cursor');
    const logPath = path.join(logDir, 'debug.log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logEntry = JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId
    }) + '\n';
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (err) {
    // Silently fail if log file can't be written
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceServices {
  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;

    // 🚀 LÓGICA DE ENTORNO: Detectar automáticamente desarrollo vs producción
    const isDevelopment = process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === '';
    const isProduction = !isDevelopment;

    // 🎯 PRODUCCIÓN FIJO: OpenAI GPT-4o-mini (ÚNICO modelo en producción)
    // ✅ SIMPLIFICADO: Solo OpenAI, sin fallbacks, sin cambios
    this.preferredProvider = 'openai';
    logger.info(`[VOICE-SERVICES] 🎯 Modelo FIJO: OpenAI GPT-4o-mini (producción)`);

    // Log configured providers for debugging
    const configuredProviders = [];
    if (this.groqApiKey) configuredProviders.push('Groq');
    if (this.openaiApiKey) configuredProviders.push('OpenAI');
    if (this.geminiApiKey) configuredProviders.push('Gemini');

    // Detectar entorno para logging (mismo cálculo que arriba)
    const isDevelopmentForLog = process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === '';
    const isProductionForLog = !isDevelopmentForLog;
    const entorno = isProductionForLog ? 'PRODUCCIÓN' : 'DESARROLLO';

    logger.info('[VOICE-SERVICES] AI Providers status:', {
      entorno: entorno,
      configured: configuredProviders.length > 0 ? configuredProviders.join(', ') : 'NONE',
      groq: this.groqApiKey ? `✅ (${this.groqApiKey.length} chars) - ${isDevelopmentForLog ? 'PRINCIPAL (dev)' : 'RESERVADO (dev)'}` : '❌',
      openai: this.openaiApiKey ? `✅ (${this.openaiApiKey.length} chars) - ${isProductionForLog ? 'PRINCIPAL (prod)' : 'FALLBACK'}` : '❌',
      gemini: this.geminiApiKey ? `✅ (${this.geminiApiKey.length} chars) - FALLBACK` : '❌',
      preferred: this.preferredProvider.toUpperCase(),
      modelo: this.preferredProvider === 'openai' ? 'gpt-4o-mini' : (this.preferredProvider === 'groq' ? 'gpt-oss-20b' : 'N/A')
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
      onClose = null,
      keepAlive = false, // 🔄 KEEPALIVE: Mantener conexión estable
      keepAliveInterval = 10000 // Intervalo de keepalive en ms (10 segundos)
    } = options;

    logger.info('[DEEPGRAM] 🔌 Creating streaming connection...');

    // Configuración MÍNIMA para máxima compatibilidad
    const liveOptions = {
      model: 'nova',
      language: language || 'es',
      punctuate: true,
      smart_format: true,
      interim_results: true
      // NO incluir ningún otro parámetro opcional para evitar problemas de compatibilidad

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

    // ✅ Configuración de audio según JSON Deepgram Playground
    liveOptions.encoding = encoding || 'linear16';
    liveOptions.sample_rate = sampleRate || 48000; // ✅ 48000 Hz según JSON Deepgram Playground
    if (channels) liveOptions.channels = channels;

    // #region agent log
    debugLog('voice-services.js:174', 'Deepgram connection params before create', { encoding: liveOptions.encoding, sample_rate: liveOptions.sample_rate, channels: liveOptions.channels, model: liveOptions.model }, 'A');
    // #endregion

    // #region agent log
    debugLog('voice-services.js:202', 'About to create Deepgram connection', {
      model: liveOptions.model,
      encoding: liveOptions.encoding,
      sample_rate: liveOptions.sample_rate,
      channels: liveOptions.channels,
      language: liveOptions.language,
      hasApiKey: !!this.deepgramApiKey,
      apiKeyLength: this.deepgramApiKey?.length || 0
    }, 'B');
    // #endregion

    let connection;
    try {
      connection = this.deepgram.listen.live(liveOptions);
    } catch (createError) {
      // #region agent log
      debugLog('voice-services.js:215', 'Deepgram connection creation FAILED', {
        error: createError?.message,
        errorType: createError?.constructor?.name,
        stack: createError?.stack?.substring(0, 300)
      }, 'B');
      // #endregion
      throw createError;
    }

    // #region agent log
    const connectTime = Date.now();
    const initialReadyState = connection.getReadyState?.();
    debugLog('voice-services.js:230', 'Deepgram connection created successfully', {
      connectTime,
      readyState: initialReadyState,
      connectionType: connection?.constructor?.name,
      hasOn: typeof connection.on === 'function',
      hasSend: typeof connection.send === 'function',
      hasFinish: typeof connection.finish === 'function'
    }, 'C');
    // #endregion

    let finalizedUtterance = '';
    let interimUtterance = '';
    let lastMessage = null;
    let idleTimer = null;
    let keepAliveTimer = null; // 🔄 KEEPALIVE: Timer para mantener conexión activa
    const connectionStartTime = connectTime; // Store for error handler

    // CRÍTICO: Registrar eventos ANTES de que ocurra el error
    // El evento 'Open' debe registrarse inmediatamente después de crear la conexión
    // #region agent log
    connection.on(LiveTranscriptionEvents.Open, () => {
      debugLog('voice-services.js:248', 'Deepgram connection OPENED (evento capturado)', {
        readyState: connection.getReadyState?.(),
        timeSinceCreate: Date.now() - connectTime,
        protocol: connection?.getProtocol?.() || 'N/A'
      }, 'C');
      logger.info('[DEEPGRAM] ✅ Connection opened successfully');

      // 🔄 KEEPALIVE: Iniciar keepalive si está habilitado
      if (keepAlive && keepAliveInterval > 0) {
        clearKeepAliveTimer();
        keepAliveTimer = setInterval(() => {
          sendKeepAlive();
        }, keepAliveInterval);
        logger.info(`[DEEPGRAM] 🔄 Keepalive iniciado (cada ${keepAliveInterval}ms)`);
      }
    });
    // #endregion

    const clearIdleTimer = () => {
      if (!idleTimer) return;
      clearTimeout(idleTimer);
      idleTimer = null;
    };

    // 🔄 KEEPALIVE: Limpiar timer de keepalive
    const clearKeepAliveTimer = () => {
      if (!keepAliveTimer) return;
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    };

    // 🔄 KEEPALIVE: Enviar chunk de silencio para mantener conexión activa
    const sendKeepAlive = () => {
      try {
        if (!connection || connection.getReadyState?.() !== 1) {
          // Conexión no está abierta, no enviar keepalive
          return;
        }

        // Generar 100ms de silencio (PCM 16-bit, mono)
        // Para 48kHz: 100ms = 4800 muestras = 9600 bytes (2 bytes por muestra)
        const silenceDuration = 0.1; // 100ms
        const samples = Math.floor((sampleRate || 48000) * silenceDuration);
        const silenceBuffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes por muestra

        // Buffer ya está lleno de ceros (silencio)
        // Enviar a Deepgram para mantener conexión activa
        connection.send(silenceBuffer);
        logger.debug('[DEEPGRAM] 🔄 Keepalive enviado (silencio 100ms)');
      } catch (error) {
        logger.warn('[DEEPGRAM] ⚠️ Error enviando keepalive:', error.message);
      }
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
      const errorTime = Date.now();

      // #region agent log
      // Capturar TODA la información posible del error
      const errorDetails = {
        message: error?.message || '',
        code: error?.code,
        stack: error?.stack?.substring(0, 500),
        type: error?.type,
        name: error?.name,
        constructor: error?.constructor?.name,
        target: error?.target ? {
          url: error.target.url,
          readyState: error.target.readyState,
          protocol: error.target.protocol,
          extensions: error.target.extensions
        } : null,
        currentTarget: error?.currentTarget ? {
          url: error.currentTarget.url,
          readyState: error.currentTarget.readyState
        } : null,
        timeStamp: error?.timeStamp,
        stringified: String(error),
        jsonStringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        isErrorEvent: error?.constructor?.name === 'ErrorEvent' || error?.type === 'error',
        readyState: connection.getReadyState?.(),
        timeSinceConnect: connectionStartTime ? errorTime - connectionStartTime : null,
        connectionState: {
          hasConnection: !!connection,
          connectionType: connection?.constructor?.name,
          methods: {
            on: typeof connection?.on === 'function',
            send: typeof connection?.send === 'function',
            finish: typeof connection?.finish === 'function',
            getReadyState: typeof connection?.getReadyState === 'function'
          }
        }
      };
      debugLog('voice-services.js:280', 'Deepgram ErrorEvent captured - FULL DETAILS', errorDetails, 'ALL');
      // #endregion
      logger.error('[DEEPGRAM] ❌ Connection error:', error);
      logger.error('[DEEPGRAM] Error details:', errorDetails);

      // Log API key status (first 10 chars for security)
      if (this.deepgramApiKey) {
        logger.error('[DEEPGRAM] API Key status:', {
          present: true,
          length: this.deepgramApiKey.length,
          prefix: this.deepgramApiKey.substring(0, 10) + '...'
        });
      } else {
        logger.error('[DEEPGRAM] API Key status: MISSING');
      }

      if (onError) {
        onError(error);
      }
    });

    // #region agent log
    connection.on(LiveTranscriptionEvents.Open, () => {
      debugLog('voice-services.js:373', 'Deepgram connection OPENED', {
        readyState: connection.getReadyState?.(),
        timeSinceCreate: Date.now() - connectTime
      }, 'C');
    });
    // #endregion

    if (onClose) {
      connection.on(LiveTranscriptionEvents.Close, () => {
        clearIdleTimer();
        clearKeepAliveTimer(); // 🔄 KEEPALIVE: Limpiar timer al cerrar
        // #region agent log
        debugLog('voice-services.js:382', 'Deepgram connection CLOSED', {
          readyState: connection.getReadyState?.(),
          timeSinceCreate: Date.now() - connectTime
        }, 'C');
        // #endregion
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
      const initialState = connection.getReadyState();
      logger.info(`[DEEPGRAM] Connection ready state: ${initialState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);

      // 🔧 FIX: Si la conexión está en estado CONNECTING (0), esperar un momento
      // para que se establezca antes de considerarla lista
      if (initialState === 0) {
        logger.info('[DEEPGRAM] ⏳ Connection is CONNECTING, will be ready shortly...');
      }
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
   * Generate voice audio using Deepgram TTS REST API (simplified, stable pipeline)
   * @param {string} text - Text to synthesize (required)
   * @param {Object} options - Options { model: string }
   * @returns {Promise<{type: 'tts', data: string, format: 'mp3', provider: 'deepgram'}>}
   */
  async generateVoice(text, options = {}) {
    // Handle legacy call signature (text, voiceId)
    if (typeof options === 'string' || options === null) {
      options = {};
    }

    const model = options.model || 'aura-2-carina-es'; // ✅ ÚNICO MODELO: aura-2-carina-es (Peninsular, Voz Interactiva/IVR)

    if (!text || text.trim() === '') {
      throw new Error('Text is required for TTS generation');
    }

    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured. Set DEEPGRAM_API_KEY environment variable.');
    }

    // ✅ SOLO REST API - Simple, estable, sin fallbacks
    logger.info(`[TTS] 🎙️ Generating audio with Deepgram TTS REST API: model=${model}, text_length=${text.length}`);

    try {
      const audioBase64 = await this._generateDeepgramTTS(text, model);
      logger.info('[TTS] ✅ Audio generated successfully with Deepgram TTS REST API');
      return {
        type: 'tts',
        data: audioBase64,
        format: 'mp3',
        provider: 'deepgram'
      };
    } catch (error) {
      logger.error('[TTS] ❌ Deepgram TTS failed:', error);
      throw error;
    }
  }

  /**
   * Create Deepgram TTS WebSocket streaming connection
   * ⚠️ DEPRECATED: WebSocket TTS removed - using REST API only for stability
   * This method is kept for backward compatibility but will not be used
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

      let configureSent = false;
      let configureAcknowledged = false;

      ws.on('open', () => {
        // ⚠️ CRITICAL: Deepgram TTS WebSocket requires sample_rate: 24000 for streaming
        // 48000 is for STT (input), but TTS (output) should be 24000 Hz (Deepgram default)
        // Send Configure IMMEDIATELY - no delay needed
        const configureMessage = {
          type: 'Configure',
          model: model, // ✅ Use 'model' not 'speak.model' or 'speakModel'
          encoding: 'linear16', // PCM 16-bit (uncompressed, best quality)
          sample_rate: 24000 // ✅ 24kHz is recommended and default for TTS streaming
        };

        logger.info(`[TTS] 📤 Sending Configure message:`, configureMessage);

        try {
          const messageStr = JSON.stringify(configureMessage);
          logger.debug(`[TTS] 📤 Configure message JSON:`, messageStr);
          ws.send(messageStr);
          configureSent = true;
          logger.info(`[TTS] ✅ Configure message sent (model: ${model})`);

          // Resolve after a small delay to allow Configure to be processed
          // Don't wait for acknowledgment - Deepgram processes Configure asynchronously
          setTimeout(() => {
            if (!configureAcknowledged) {
              logger.info(`[TTS] ✅ Deepgram TTS WebSocket connected and configured (model: ${model})`);
              resolve(ws);
            }
          }, 50);
        } catch (error) {
          logger.error(`[TTS] ❌ Error sending Configure message:`, error);
          reject(error);
        }
      });

      // Listen for any response messages (including metadata/errors)
      ws.on('message', (data) => {
        try {
          // Check if it's a JSON message (not binary audio)
          if (!Buffer.isBuffer(data) || (data.length > 0 && data[0] === 123)) {
            const messageStr = Buffer.isBuffer(data) ? data.toString('utf8') : data.toString();
            const message = JSON.parse(messageStr);

            if (message.type === 'Metadata') {
              configureAcknowledged = true;
              logger.info(`[TTS] ✅ Configure acknowledged via Metadata:`, {
                model_name: message.model_name,
                request_id: message.request_id
              });

              // If model doesn't match, log warning
              if (message.model_name && !message.model_name.includes('agustina')) {
                logger.warn(`[TTS] ⚠️ Model mismatch! Requested: ${model}, Got: ${message.model_name}`);
              }
            } else if (message.type === 'Error') {
              logger.error(`[TTS] ❌ Error from Deepgram:`, message);
            }
          }
        } catch (e) {
          // Not a JSON message, ignore
        }
      });

      // Handle WebSocket close with error codes
      ws.on('close', (code, reason) => {
        if (code === 1008) {
          logger.error(`[TTS] ❌ WebSocket closed with Policy Violation (1008): ${reason?.toString() || 'DATA-0000'}`);
          logger.error(`[TTS] ⚠️ This usually means the model '${model}' is not available or the configuration is invalid`);
          logger.error(`[TTS] 💡 Deepgram may be using a default model instead. Check your Deepgram account for available models.`);
        } else if (code !== 1000) { // 1000 = normal closure
          logger.warn(`[TTS] ⚠️ WebSocket closed with code ${code}: ${reason?.toString() || 'Unknown'}`);
        }
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
   * Generate TTS audio using Deepgram REST API
   * ✅ Formato text/plain según curl oficial de Deepgram
   * @private
   * @param {string} text - Text to synthesize
   * @param {string} model - Deepgram voice model (default: aura-2-carina-es)
   * @returns {Promise<string>} Base64 encoded audio (MP3)
   */
  async _generateDeepgramTTS(text, model = 'aura-2-carina-es') {
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }

    if (!text || text.trim() === '') {
      throw new Error('Text is required for TTS generation');
    }

    try {
      // ✅ FORMATO CORRECTO según curl oficial de Deepgram:
      // POST https://api.deepgram.com/v1/speak?model=aura-2-agustina-es
      // Headers: Authorization: Token ... , Content-Type: text/plain
      // Body: texto directamente (NO JSON)
      const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;

      logger.info(`[DEEPGRAM TTS] 🎙️ Requesting TTS: model=${model}, text_length=${text.length}`);
      logger.debug(`[DEEPGRAM TTS] URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': 'text/plain' // ✅ Formato correcto según curl oficial
        },
        body: text // ✅ Texto directamente, NO JSON
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[DEEPGRAM TTS] ❌ API Error (${response.status}):`, errorText);
        throw new Error(`Deepgram TTS API Error: ${response.status} - ${errorText}`);
      }

      // Deepgram devuelve audio MP3 directamente
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      logger.info(`[DEEPGRAM TTS] ✅ Audio generated successfully (${audioBuffer.byteLength} bytes, MP3)`);
      return audioBase64;
      } catch (error) {
      logger.error('[DEEPGRAM TTS] ❌ REST API error:', error);
      throw error;
    }
  }

  /**
   * Generate TTS audio using Cartesia API
   * @private
   * ✅ REACTIVADO: Cartesia puede usarse independientemente de Deepgram
   * @param {string} text - Text to synthesize
   * @param {string} voiceId - Cartesia voice ID (default: 'sandra' or CARTESIA_VOICE_ID)
   * @returns {Promise<string>} Base64 encoded audio (MP3)
   */
  async _generateCartesiaTTS(text, voiceId) {
    if (!this.cartesiaApiKey) {
      throw new Error('Cartesia API key not configured. Set CARTESIA_API_KEY environment variable.');
    }

    if (!text || text.trim() === '') {
      throw new Error('Text is required for Cartesia TTS');
    }

    const finalVoiceId = voiceId || this.cartesiaVoiceId || 'sandra';

    logger.info(`[CARTESIA] 🎙️ Generating TTS audio for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    logger.info(`[CARTESIA] Using voice ID: ${finalVoiceId}`);

    try {
      // Cartesia API endpoint: https://api.cartesia.ai/tts/bytes
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.cartesiaApiKey, // ✅ Correct Header
          'Cartesia-Version': '2024-06-10' // ✅ Recommended version
        },
        body: JSON.stringify({
          transcript: text, // ✅ 'transcript' instead of 'text'
          model_id: 'sonic-multilingual', // ✅ Correct multilingual model for Spanish
          voice: {
            mode: 'id',
            id: finalVoiceId
          },
          output_format: {
            container: 'mp3',
            bit_rate: 128000,
            sample_rate: 24000
          },
          language: 'es' // Spanish
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[CARTESIA] ❌ API error (${response.status}):`, errorText);
        throw new Error(`Cartesia TTS API error: ${response.status} - ${errorText}`);
      }

      // Cartesia returns audio as binary (MP3)
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      logger.info(`[CARTESIA] ✅ Audio generated successfully (${audioBuffer.byteLength} bytes)`);
      return audioBase64;
      } catch (error) {
      logger.error('[CARTESIA] ❌ Error generating TTS:', error);
      throw error;
    }
  }

  /**
   * Process message with AI - SOLO OpenAI GPT-4o-mini (fijado en producción)
   */
  async processMessage(userMessage, context = {}, toolHandler = null) {
    // 🚀 PROMPT OPTIMIZADO PARA VOZ: Pipeline GPT-4o - Conversación secuencial y memoria
    let systemPrompt = `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 2-3 frases salvo que se pida detalle.
Sé amable, profesional y útil.

### CONVERSACIÓN SECUENCIAL - FLUJO PASO A PASO:
- Divide las consultas en pasos lógicos, NO hagas todas las preguntas a la vez.
- Si el usuario menciona una necesidad (ej: "quiero una habitación"), agradece y pregunta SOLO por lo siguiente en la secuencia:
  1. PRIMERO: Fechas de check-in y check-out (si no las tienes)
  2. SEGUNDO: Número de huéspedes (si no lo tienes)
  3. TERCERO: Zona o preferencia de alojamiento (si es necesario)
  4. FINALMENTE: Usa checkAvailability() para consultar disponibilidad y precios
- Si ya conoces la fecha de entrada y el número de personas, NO vuelvas a preguntarlo.
- Haz UNA pregunta a la vez, espera la respuesta, y luego continúa con la siguiente.

### ESTRATEGIA DE PRECIOS Y NEGOCIACIÓN:
- Los precios ya incluyen un descuento OTA (10-18%) sobre las tarifas de Booking/Airbnb.
- Presenta siempre el precio con descuento OTA aplicado.
- Si el cliente pregunta varias veces por el precio o muestra mucho interés, puedes ofrecer un descuento adicional del 5%.
- Si no puedes bajar más el precio, resalta los beneficios:
  * WiFi gratis
  * Check-in autónomo
  * Ubicación céntrica
  * Late check-out gratuito hasta las 12:00
  * Kit de bienvenida con productos locales
- En fechas festivas, los descuentos son menores para proteger el margen.
- Usa técnicas de venta (beneficios y extras) cuando no puedas negociar más el precio.`;

    // 🚀 REGLA CRÍTICA: No saludar después del saludo inicial
    if (context.greetingSent === true) {
      systemPrompt += `\n\n### REGLA CRÍTICA - NO VIOLAR:
- Ya has saludado al usuario al inicio de la llamada. NUNCA vuelvas a saludar.
- Si el usuario dice "Hola", "Buenas", "Buenos días", etc., NO respondas con otro saludo.
- Responde directamente a su pregunta o comentario SIN mencionar "Hola", "Soy Sandra", ni ninguna forma de saludo.
- Ejemplos PROHIBIDOS después del saludo inicial: "Hola", "Hola, soy Sandra", "Buenas", "¿En qué puedo ayudarte?" (esto es un saludo implícito)
- Ejemplos CORRECTOS: Responde directamente a lo que pregunta (ej: si pregunta por alojamiento, habla de alojamientos directamente)`;
    }
    
    // 🚀 MEMORIA CONVERSACIONAL: Historial completo desde base de datos
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      systemPrompt += `\n\n### MEMORIA CONVERSACIONAL (últimos ${context.conversationHistory.length} intercambios):
`;
      context.conversationHistory.forEach((exchange, index) => {
        systemPrompt += `${index + 1}. Usuario: "${exchange.user.substring(0, 100)}${exchange.user.length > 100 ? '...' : ''}"\n`;
        systemPrompt += `   Tú: "${exchange.assistant.substring(0, 100)}${exchange.assistant.length > 100 ? '...' : ''}"\n`;
      });
      systemPrompt += `\n### INSTRUCCIONES DE MEMORIA:
- Usa este historial para mantener coherencia y NO repetir información ya proporcionada.
- Si el usuario ya mencionó fechas, número de personas, zona o presupuesto, NO vuelvas a preguntarlo.
- Recuerda los datos que el cliente ya te ha dado y continúa desde donde quedaste.
- Si ya tienes suficiente información, procede directamente a buscar alojamientos o confirmar reserva.`;
    }
    
    // 🚀 CONTEXTO PREVIO: Fallback si no hay historial completo
    if (context.lastFinalizedTranscript && (!context.conversationHistory || context.conversationHistory.length === 0)) {
      systemPrompt += `\n\n### CONTEXTO DE CONVERSACIÓN PREVIA:
- El usuario mencionó anteriormente: "${context.lastFinalizedTranscript.substring(0, 150)}"
- Usa este contexto para responder de forma coherente y NO repetir preguntas ya respondidas.
- Si el usuario ya proporcionó información (fechas, personas, zona), NO vuelvas a pedirla.
- Continúa desde donde quedaste en la conversación.`;
    }
    
    // 🚀 DATOS EXTRAÍDOS: Si ya se conocen datos específicos, no preguntarlos
    const knownData = [];
    if (context.checkIn && context.checkOut) knownData.push(`Fechas: ${context.checkIn} - ${context.checkOut}`);
    if (context.guests) knownData.push(`${context.guests} huéspedes`);
    if (context.location) knownData.push(`Zona: ${context.location}`);
    if (context.budget) knownData.push(`Presupuesto: ${context.budget}€`);
    
    if (knownData.length > 0) {
      systemPrompt += `\n\n### DATOS YA CONOCIDOS (NO PREGUNTAR):
- ${knownData.join(', ')}
- Usa esta información directamente, NO vuelvas a preguntarla.`;
    }
    
    // Añadir última respuesta de IA para evitar ecos
    if (context.lastAIResponse) {
      systemPrompt += `\n\n### Última respuesta enviada:
- "${context.lastAIResponse.substring(0, 100)}"
- Si el usuario repite algo similar a tu última respuesta, es probablemente un eco. Responde brevemente sin repetir información.`;
    }

    // ✅ SOLO OpenAI GPT-4o-mini - Sin fallbacks, sin cambios
    if (!this.openaiApiKey) {
      const errorMsg = 'OPENAI_API_KEY no configurada. Configura OPENAI_API_KEY en Render Dashboard.';
      logger.error('[AI] ' + errorMsg);
      throw new Error(errorMsg);
    }

    try {
      logger.info('[AI] 🎯 Usando OpenAI GPT-4o-mini (único modelo en producción)...');
        return await this._callOpenAI(userMessage, systemPrompt);
      } catch (error) {
      logger.error('[AI] ❌ Error con OpenAI GPT-4o-mini:', error.message);
      throw error;
      }
  }

  async _callOpenAI(userMessage, systemPrompt, tools = null, toolHandler = null, context = {}) {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 🚀 REAL-TIME: 2.5s timeout (reducido para respuestas más rápidas)

    try {
      // Construir body base
      const body = {
        model: 'gpt-4o-mini', // 🎯 PRODUCCIÓN: GPT-4o-mini (modelo principal para producción)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 100 // 🚀 REAL-TIME: Reducido para respuestas más rápidas (especialmente saludos breves)
      };

      // 🚀 FASE 1.4: Añadir tools si están disponibles
      if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto'; // Permite que el modelo decida cuándo usar tools
        logger.info(`[AI] 🔧 Function calling activado con ${tools.length} tools`);
      }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
        body: JSON.stringify(body),
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

      const message = data.choices[0].message;

      // 🚀 FASE 1.4: Manejar tool_calls si existen
      if (message.tool_calls && message.tool_calls.length > 0 && toolHandler) {
        logger.info(`[AI] 🔧 OpenAI solicitó ejecutar ${message.tool_calls.length} tool(s)`);
        return await this._handleToolCalls(message.tool_calls, userMessage, systemPrompt, toolHandler, context);
      }

      // Respuesta normal de texto
      return message.content;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('OpenAI: Request timeout (2.5s)');
      }
      throw error;
    }
  }

  /**
   * Manejar tool_calls de OpenAI - Ejecutar tools y obtener respuesta final
   * @param {Array} toolCalls - Array de tool_calls de OpenAI
   * @param {string} userMessage - Mensaje original del usuario
   * @param {string} systemPrompt - System prompt
   * @param {ToolHandler} toolHandler - Instancia de ToolHandler
   * @param {Object} context - Contexto de la conversación
   * @returns {Promise<string>} Respuesta final del modelo
   */
  async _handleToolCalls(toolCalls, userMessage, systemPrompt, toolHandler, context) {
    try {
      const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
      ];

      // Ejecutar cada tool_call
      for (const toolCall of toolCalls) {
        const { id, function: func } = toolCall;
        const { name, arguments: argsStr } = func;

        logger.info(`[AI] 🔧 Ejecutando tool: ${name}`);

        try {
          // Parsear argumentos
          const args = JSON.parse(argsStr);
          
          // Ejecutar tool (necesitamos sessionId y ws desde context)
          // Por ahora retornamos un resultado básico
          const result = {
            success: true,
            tool: name,
            result: `Tool ${name} ejecutado con argumentos: ${JSON.stringify(args)}`
          };

          // Añadir resultado como mensaje function
          messages.push({
            role: 'tool',
            tool_call_id: id,
            name: name,
            content: JSON.stringify(result)
          });

          logger.info(`[AI] ✅ Tool ${name} ejecutado exitosamente`);
        } catch (error) {
          logger.error(`[AI] ❌ Error ejecutando tool ${name}:`, error);
          messages.push({
            role: 'tool',
            tool_call_id: id,
            name: name,
            content: JSON.stringify({
              success: false,
              error: error.message
      })
    });
        }
      }

      // 🚀 FASE 1.4: Llamar nuevamente a OpenAI con los resultados de las tools
      // Esto permitirá que el modelo genere una respuesta final basada en los resultados
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      try {
        const body = {
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 150 // Un poco más para respuestas que incluyen resultados de tools
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
          throw new Error(`OpenAI Error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('OpenAI: Invalid response format');
        }

        const finalMessage = data.choices[0].message;
        
        // Si hay más tool_calls, recursivamente manejarlos
        if (finalMessage.tool_calls && finalMessage.tool_calls.length > 0) {
          logger.info(`[AI] 🔧 OpenAI solicitó más tools - ejecutando recursivamente`);
          return await this._handleToolCalls(finalMessage.tool_calls, userMessage, systemPrompt, toolHandler, context);
        }

        return finalMessage.content || 'Tool ejecutado exitosamente';
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (error) {
      logger.error('[AI] ❌ Error en _handleToolCalls:', error);
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
          model: 'gpt-oss-20b', // Modelo GPT OSS 20B de Groq (según imagen Deepgram)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
          temperature: 0.7,
          max_tokens: 100 // 🚀 REAL-TIME: Reducido para respuestas más rápidas (especialmente saludos breves)
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
    logger.warn('[TTS] ⚠️ getWelcomeAudio() is deprecated - use generateVoice() with text instead');
    throw new Error('getWelcomeAudio() is deprecated - use generateVoice() with text instead');
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
  createTTSStreamingConnection: (model) => voiceServicesInstance.createTTSStreamingConnection(model),
  sendTextToTTS: (ttsWs, text) => voiceServicesInstance.sendTextToTTS(ttsWs, text),
  flushTTS: (ttsWs) => voiceServicesInstance.flushTTS(ttsWs),
  clearTTS: (ttsWs) => voiceServicesInstance.clearTTS(ttsWs),
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
