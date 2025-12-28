/**
 * WebSocket Enterprise Stream Client
 * ===================================
 * Frontend system for WebSocket bidirectional streaming
 * - Captures audio from microphone (MediaRecorder)
 * - Sends audio chunks to WebSocket server
 * - Receives transcription and response streaming
 * - Integrates with voice library manager for Sandra voice
 * 
 * CRITICAL: This client ALWAYS connects to MCP server on Render (wss://pwa-imbf.onrender.com)
 * NEVER connects to Vercel - Vercel does not support WebSocket
 */

// CRITICAL: Global validation - block any WebSocket connection to Vercel
(function() {
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string') {
      if (url.includes('vercel.app') || url.includes('pwa-chi-six') || url.includes('/ws/stream')) {
        console.error('[WEBSOCKET-CLIENT] ❌ BLOQUEO GLOBAL: Intento de conectar a Vercel bloqueado');
        console.error('[WEBSOCKET-CLIENT] ❌ URL bloqueada:', url);
        console.error('[WEBSOCKET-CLIENT] ✅ Redirigiendo a servidor MCP en Render');
        url = 'wss://pwa-imbf.onrender.com';
      }
    }
    return new originalWebSocket(url, protocols);
  };
  // Copy static properties
  Object.setPrototypeOf(window.WebSocket, originalWebSocket);
  Object.getOwnPropertyNames(originalWebSocket).forEach(prop => {
    if (prop !== 'prototype' && prop !== 'length' && prop !== 'name') {
      window.WebSocket[prop] = originalWebSocket[prop];
    }
  });
})();

class WebSocketStreamClient {
  constructor() {
    // CRITICAL: Block any attempt to use Vercel URL immediately
    console.log('[WEBSOCKET-CLIENT] 🚀 Inicializando cliente WebSocket...');
    console.log('[WEBSOCKET-CLIENT] ⚠️  NUNCA usar window.location para WebSocket');
    
    this.ws = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isConnected = false;
    this.language = localStorage.getItem('sandra_language') || 'es';
    this.llmProvider = localStorage.getItem('llm_provider') || 'openai';
    this.availableProviders = [];
    this.conversationHistory = [];
    this.currentResponse = '';
    this.currentResponseType = 'general';

    // Reconnection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.reconnectTimeout = null;
    this.isReconnecting = false;
    this.shouldReconnect = true;
    this.configLoaded = false; // Flag to prevent init before config

    // Configuration - will be loaded from API
    // CRITICAL: wsUrl MUST be null initially and loaded from /api/config
    this.config = {
      wsUrl: null, // CRITICAL: Must be loaded from /api/config, NEVER use window.location
      audioMimeType: 'audio/webm;codecs=opus',
      audioSampleRate: 48000,
      audioChannels: 1,
      chunkDuration: 100 // ms between chunks
    };

    // CRITICAL: Load config FIRST, then initialize
    // DO NOT attempt connection until config is loaded
    // This is the ONLY way to get the WebSocket URL
    this.loadConfigAndInit().catch(err => {
      console.error('[WEBSOCKET-CLIENT] ❌ Error fatal en inicialización:', err);
      // Even on error, use Render fallback, NEVER Vercel
      this.config.wsUrl = 'wss://pwa-imbf.onrender.com';
      this.configLoaded = true;
    this.init();
    });
  }
  
  /**
   * CRITICAL: Override any attempt to set incorrect URL
   * This method blocks setting wsUrl to Vercel or incorrect values
   */
  setWsUrl(url) {
    if (!url) {
      this.config.wsUrl = null;
      return;
    }
    
    // Block Vercel URLs
    if (url.includes('vercel.app') || url.includes('pwa-chi-six') || url.includes('/ws/stream')) {
      console.error('[WEBSOCKET-CLIENT] ❌ BLOQUEADO: Intento de establecer URL incorrecta:', url);
      console.error('[WEBSOCKET-CLIENT] ❌ Usando servidor MCP en Render en su lugar');
      this.config.wsUrl = 'wss://pwa-imbf.onrender.com';
      return;
    }
    
    this.config.wsUrl = url;
  }

  /**
   * Load configuration from API and initialize WebSocket
   * CRITICAL: This MUST complete before any connection attempt
   */
  async loadConfigAndInit() {
    try {
      console.log('[WEBSOCKET-CLIENT] 📡 Cargando configuración del servidor MCP...');
      
      // Fetch configuration from API
      // En localhost, usar el servidor MCP directamente
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const configUrl = isLocalhost ? 'http://localhost:4042/api/config' : '/api/config';
      
      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // Prevent caching
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se pudo cargar la configuración`);
      }
      
      const config = await response.json();
      
      // Validate MCP_SERVER_URL
      if (!config.MCP_SERVER_URL) {
        throw new Error('MCP_SERVER_URL no está en la respuesta del servidor');
      }
      
      const mcpServerUrl = config.MCP_SERVER_URL.trim().replace(/\/$/, ''); // Remove trailing slash
      
      // CRITICAL: Convert HTTP/HTTPS URL to WebSocket URL
      // NEVER use window.location.host - always use the MCP server URL
      const wsUrl = this.convertToWebSocketUrl(mcpServerUrl);
      
      // Validate the WebSocket URL
      if (!wsUrl || !wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        throw new Error(`URL WebSocket inválida: ${wsUrl}`);
      }
      
      // Use setter to ensure validation
      this.setWsUrl(wsUrl);
      this.config.mcpToken = config.MCP_TOKEN || null;
      this.configLoaded = true;
      
      console.log('[WEBSOCKET-CLIENT] ✅ Configuración cargada correctamente:');
      console.log('[WEBSOCKET-CLIENT]   - MCP Server:', mcpServerUrl);
      console.log('[WEBSOCKET-CLIENT]   - WebSocket URL:', wsUrl);
      console.log('[WEBSOCKET-CLIENT]   - Token:', this.config.mcpToken ? 'Configurado' : 'No requerido');

      // NOW initialize WebSocket connection
      await this.init();
      
    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error cargando configuración:', err);
      console.error('[WEBSOCKET-CLIENT] Stack:', err.stack);
      
      // Fallback to default MCP server (Render) - NEVER Vercel
      const defaultUrl = 'wss://pwa-imbf.onrender.com';
      this.setWsUrl(defaultUrl);
      this.config.mcpToken = null;
      this.configLoaded = true;
      
      console.warn('[WEBSOCKET-CLIENT] ⚠️  Usando URL por defecto (Render):', defaultUrl);
      console.warn('[WEBSOCKET-CLIENT] ⚠️  Esto puede indicar un problema con /api/config');
      
      // Try to initialize with fallback
      await this.init();
    }
  }

  /**
   * Convert HTTP/HTTPS URL to WebSocket URL
   */
  convertToWebSocketUrl(httpUrl) {
    try {
      // Remove trailing slash if present
      const cleanUrl = httpUrl.replace(/\/$/, '');
      const url = new URL(cleanUrl);
      
      // Render uses WebSocket on the same domain, no port needed
      // For localhost, use ws://localhost:4042
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `ws://${url.hostname}:4042`;
      }
      // For production (Render), use wss:// with same hostname
      return `wss://${url.hostname}`;
    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] Error convirtiendo URL:', err);
      return 'wss://pwa-imbf.onrender.com';
    }
  }

  /**
   * Initialize WebSocket connection
   * CRITICAL: Only called after config is loaded
   */
  async init() {
    // CRITICAL CHECK: Config must be loaded first
    if (!this.configLoaded) {
      console.error('[WEBSOCKET-CLIENT] ❌ Intento de conexión antes de cargar configuración');
      console.error('[WEBSOCKET-CLIENT] ❌ Esto NO debería pasar - cargando configuración ahora...');
      await this.loadConfigAndInit();
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isReconnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[WEBSOCKET-CLIENT] ⏸️  Ya hay una conexión en progreso, esperando...');
      return;
    }

    // Don't reconnect if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WEBSOCKET-CLIENT] ❌ Máximo de intentos de reconexión alcanzado');
      this.shouldReconnect = false;
      this.showError('No se pudo conectar al servidor. Por favor, recarga la página.');
      return;
    }

    // CRITICAL: Validate WebSocket URL
    if (!this.config.wsUrl) {
      console.error('[WEBSOCKET-CLIENT] ❌ URL de WebSocket no configurada');
      console.error('[WEBSOCKET-CLIENT] ❌ Esto indica un error en la carga de configuración');
      return;
    }

    // CRITICAL: Permitir localhost y Render, bloquear solo Vercel
    const isLocalhost = this.config.wsUrl && (this.config.wsUrl.includes('localhost') || this.config.wsUrl.includes('127.0.0.1'));
    const isRender = this.config.wsUrl && this.config.wsUrl.includes('pwa-imbf.onrender.com');
    const isVercel = this.config.wsUrl && (this.config.wsUrl.includes('vercel.app') || this.config.wsUrl.includes('vercel.com'));
    
    // Solo bloquear si es Vercel y NO es localhost ni Render
    if (isVercel && !isLocalhost && !isRender) {
      console.error('[WEBSOCKET-CLIENT] ❌ ERROR CRÍTICO: URL incorrecta detectada');
      console.error('[WEBSOCKET-CLIENT] ❌ URL:', this.config.wsUrl);
      console.error('[WEBSOCKET-CLIENT] ❌ Vercel no soporta WebSocket - debe usar servidor MCP');
      this.showError('Error de configuración: URL WebSocket incorrecta');
      return;
    }

    try {
      this.isReconnecting = true;
      console.log('[WEBSOCKET-CLIENT] 🔌 Inicializando conexión WebSocket...');
      console.log('[WEBSOCKET-CLIENT] URL:', this.config.wsUrl);
      console.log('[WEBSOCKET-CLIENT] Intento:', this.reconnectAttempts + 1, '/', this.maxReconnectAttempts);

      // Close existing connection if any
      if (this.ws) {
        try {
          this.ws.close();
        } catch (_) {}
      }

      // Build WebSocket URL with token if available
      let wsUrl = this.config.wsUrl;
      
      // CRITICAL: Final validation - NEVER connect to Vercel or use /ws/stream path
      // This is the LAST line of defense - if URL is wrong, FORCE correct one
      const blockedPatterns = [
        'vercel.app',
        'pwa-chi-six',
        '/ws/stream',
        window.location.hostname + '/ws',
        window.location.host + '/ws'
      ];
      
      const isBlocked = blockedPatterns.some(pattern => wsUrl && wsUrl.includes(pattern));
      
      if (isBlocked || !wsUrl || wsUrl.includes('vercel')) {
        console.error('[WEBSOCKET-CLIENT] ❌ ERROR CRÍTICO: URL bloqueada detectada');
        console.error('[WEBSOCKET-CLIENT] ❌ URL detectada:', wsUrl);
        console.error('[WEBSOCKET-CLIENT] ❌ Vercel no soporta WebSocket - FORZANDO servidor MCP en Render');
        
        // FORCE correct URL immediately - don't wait for reload
        wsUrl = 'wss://pwa-imbf.onrender.com';
        this.config.wsUrl = wsUrl;
        this.setWsUrl(wsUrl);
        
        console.error('[WEBSOCKET-CLIENT] ✅ URL corregida a:', wsUrl);
        
        // Don't reload config if we already have the correct URL
        // Just continue with the corrected URL
      }
      
      // Validate that URL points to Render MCP server
      if (!wsUrl.includes('pwa-imbf.onrender.com') && !wsUrl.includes('localhost')) {
        console.warn('[WEBSOCKET-CLIENT] ⚠️  URL no es el servidor MCP esperado:', wsUrl);
        console.warn('[WEBSOCKET-CLIENT] ⚠️  Esperado: wss://pwa-imbf.onrender.com');
      }
      
      if (this.config.mcpToken) {
        wsUrl += `?token=${encodeURIComponent(this.config.mcpToken)}`;
      }

      console.log('[WEBSOCKET-CLIENT] 🔌 Conectando a servidor MCP:', wsUrl);
      console.log('[WEBSOCKET-CLIENT] ✅ URL validada correctamente');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WEBSOCKET-CLIENT] ✅ Conectado al servidor WebSocket');
        this.isConnected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0; // Reset on successful connection
        this.reconnectDelay = 1000; // Reset delay

        // Wait for connection message from server before sending config
        // The server will send a 'connected' message first
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[WEBSOCKET-CLIENT] ❌ Error parseando mensaje:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WEBSOCKET-CLIENT] ❌ WebSocket error:', err);
        this.isConnected = false;
      };

      this.ws.onclose = (event) => {
        console.log('[WEBSOCKET-CLIENT] ⚠️  Desconectado del servidor', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.isConnected = false;
        this.isReconnecting = false;

        // Only reconnect if we should and it wasn't a clean close
        if (this.shouldReconnect && !event.wasClean) {
          this.scheduleReconnect();
        }
      };

      // Expose globally for testing
      window.speechToChatSystem = this;
      window.websocketStreamClient = this;

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error inicializando:', err);
      this.isReconnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[WEBSOCKET-CLIENT] 🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect) {
        this.init();
      }
    }, delay);
  }

  /**
   * Stop reconnection attempts
   */
  stopReconnecting() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(data) {
    console.log('[WEBSOCKET-CLIENT] 📨 Mensaje recibido:', data);

    // Handle MCP format: {route, action, ...}
    if (data.route && data.action) {
      this.handleMCPMessage(data);
      return;
    }

    // Handle legacy format: {type, ...}
    if (data.type) {
      this.handleLegacyMessage(data);
      return;
    }

    console.warn('[WEBSOCKET-CLIENT] Formato de mensaje desconocido:', data);
  }

  /**
   * Handle MCP format messages
   */
  handleMCPMessage(data) {
    const { route, action, ...payload } = data;

    switch (route) {
      case 'system':
        if (action === 'connected') {
          console.log('[WEBSOCKET-CLIENT] ✅ Confirmación de conexión:', payload.clientId);
          if (payload.availableProviders) {
            this.availableProviders = payload.availableProviders;
            console.log('[WEBSOCKET-CLIENT] 🔄 Proveedores disponibles:', this.availableProviders.join(', '));
          }
          // Send initial configuration after connection
          this.sendMCP('conserje', 'setLanguage', { language: this.language });
          if (this.llmProvider && this.llmProvider !== 'openai') {
            this.setProvider(this.llmProvider);
          }
        }
        break;

      case 'conserje':
        if (action === 'transcription') {
          this.handleTranscription(payload);
        } else if (action === 'response_chunk') {
          this.handleResponseChunk(payload);
        } else if (action === 'response_complete') {
          this.handleResponseComplete(payload);
        } else if (action === 'providerSet') {
          this.llmProvider = payload.provider;
          localStorage.setItem('llm_provider', payload.provider);
          console.log('[WEBSOCKET-CLIENT] 🔄 Proveedor cambiado a:', payload.provider);
        }
        break;

      case 'audio':
        if (action === 'tts') {
          this.handleAudioResponse(payload);
        } else if (action === 'stt') {
          // STT response (transcription result)
          if (payload.transcript) {
            this.handleTranscription({ text: payload.transcript });
          }
        }
        break;

      case 'error':
        console.error('[WEBSOCKET-CLIENT] ❌ Error del servidor:', payload.message || payload.error);
        this.showError(payload.message || payload.error || 'Error desconocido');
        break;

      default:
        console.log('[WEBSOCKET-CLIENT] Mensaje MCP:', { route, action, payload });
    }
  }

  /**
   * Handle legacy format messages (for backward compatibility)
   */
  handleLegacyMessage(data) {
    switch (data.type) {
      case 'connection':
        console.log('[WEBSOCKET-CLIENT] Confirmación de conexión:', data.clientId);
        if (data.availableProviders) {
          this.availableProviders = data.availableProviders;
          console.log('[WEBSOCKET-CLIENT] 🔄 Proveedores disponibles:', this.availableProviders.join(', '));
        }
        if (this.llmProvider !== 'openai') {
          this.setProvider(this.llmProvider);
        }
        break;

      case 'providerSet':
        this.llmProvider = data.provider;
        localStorage.setItem('llm_provider', data.provider);
        console.log('[WEBSOCKET-CLIENT] 🔄 Proveedor cambiado a:', data.provider);
        break;

      case 'transcription':
        this.handleTranscription(data);
        break;

      case 'response_chunk':
        this.handleResponseChunk(data);
        break;

      case 'response_complete':
        this.handleResponseComplete(data);
        break;

      case 'error':
        console.error('[WEBSOCKET-CLIENT] ❌ Error del servidor:', data.message);
        this.showError(data.message);
        break;

      case 'status':
        console.log('[WEBSOCKET-CLIENT] Estado:', data);
        break;

      default:
        console.warn('[WEBSOCKET-CLIENT] Tipo de mensaje desconocido:', data.type);
    }
  }

  /**
   * Handle transcription from server
   */
  handleTranscription(data) {
    const text = data.text || data.transcription || data.message;
    console.log('[WEBSOCKET-CLIENT] 📝 Transcripción:', text);

    if (!text) {
      console.warn('[WEBSOCKET-CLIENT] Transcripción vacía');
      return;
    }

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: new Date()
    });

    // Display in UI if available
    this.displayTranscription(text);
  }

  /**
   * Handle streaming response chunks
   */
  handleResponseChunk(data) {
    const text = data.text || data.chunk || data.message;
    const sequence = data.sequence || data.index || 0;
    console.log('[WEBSOCKET-CLIENT] 📊 Chunk #' + sequence + ':', text);

    if (text) {
      this.currentResponse += text;
    // Display streaming text in real-time
      this.displayResponseStreaming(text);
    }
  }

  /**
   * Handle completed response
   */
  async handleResponseComplete(data) {
    const text = data.text || data.response || data.message;
    const responseType = data.responseType || data.type || 'general';
    
    console.log('[WEBSOCKET-CLIENT] ✅ Respuesta completada');
    console.log('[WEBSOCKET-CLIENT] Tipo de respuesta:', responseType);

    if (!text) {
      console.warn('[WEBSOCKET-CLIENT] Respuesta vacía');
      return;
    }

    this.currentResponse = text;
    this.currentResponseType = responseType;

    // Add to conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: text,
      type: responseType,
      timestamp: new Date()
    });

    // Play voice response
    await this.playVoiceResponse(text, responseType);

    // Display final response
    this.displayResponseComplete(text);
  }

  /**
   * Start recording audio
   */
  async startListening() {
    try {
      console.log('[WEBSOCKET-CLIENT] 🎙️  Iniciando grabación de audio...');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.audioSampleRate
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.config.audioMimeType
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (err) => {
        console.error('[WEBSOCKET-CLIENT] ❌ Error en MediaRecorder:', err);
      };

      this.mediaRecorder.start(this.config.chunkDuration);
      this.isRecording = true;

      console.log('[WEBSOCKET-CLIENT] ✅ Grabación iniciada');

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error al acceder al micrófono:', err);
      this.showError('No se puede acceder al micrófono: ' + err.message);
    }
  }

  /**
   * Stop recording and send audio to server
   */
  async stopListening() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('[WEBSOCKET-CLIENT] Grabación no está activa');
      return;
    }

    console.log('[WEBSOCKET-CLIENT] ⏹️  Deteniendo grabación...');

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        try {
          this.isRecording = false;

          // Create blob from chunks
          const audioBlob = new Blob(this.audioChunks, {
            type: this.config.audioMimeType
          });

          console.log('[WEBSOCKET-CLIENT] 📤 Audio capturado:', audioBlob.size, 'bytes');

          // Send to server only if we have audio data
          if (audioBlob.size > 0 && this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Convert Blob to base64 and send as MCP message
            const base64Audio = await this.blobToBase64(audioBlob);
            
            // Send as MCP format message
            this.sendMCP('audio', 'stt', {
              audio: base64Audio,
              format: 'webm',
              mimeType: this.config.audioMimeType
            });
            
            console.log('[WEBSOCKET-CLIENT] ✅ Audio enviado al servidor (MCP format)');
          } else {
            if (audioBlob.size === 0) {
              console.log('[WEBSOCKET-CLIENT] ⚠️  No hay audio para enviar');
            } else {
              console.warn('[WEBSOCKET-CLIENT] ⚠️  WebSocket no conectado, audio no enviado');
            }
          }

          // Stop all tracks
          if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => {
              track.stop();
              console.log('[WEBSOCKET-CLIENT] 🛑 Track detenido:', track.kind);
            });
          }

          // Clear mediaRecorder
          this.mediaRecorder = null;
          this.audioChunks = [];

          resolve();
        } catch (err) {
          console.error('[WEBSOCKET-CLIENT] ❌ Error enviando audio:', err);
          resolve();
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert Blob to base64 string
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix (data:audio/webm;base64,)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Disconnect WebSocket and stop all recording
   * Used when hanging up a call
   */
  async disconnect() {
    console.log('[WEBSOCKET-CLIENT] 🔌 Desconectando...');
    
    // Stop recording first
    if (this.isRecording) {
      await this.stopListening();
    }
    
    // Close WebSocket connection
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, 'Call ended');
          console.log('[WEBSOCKET-CLIENT] ✅ WebSocket cerrado');
        }
      } catch (err) {
        console.error('[WEBSOCKET-CLIENT] ❌ Error cerrando WebSocket:', err);
      }
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isRecording = false;
    
    // Stop reconnection attempts
    this.stopReconnecting();
    
    console.log('[WEBSOCKET-CLIENT] ✅ Desconexión completada');
  }

  /**
   * Handle audio response from server (base64 audio)
   */
  async handleAudioResponse(payload) {
    try {
      const audioBase64 = payload.audio || payload.payload?.audio;
      const text = payload.text || payload.payload?.text;
      const isWelcome = payload.isWelcome || payload.payload?.isWelcome || false;
      const format = payload.format || payload.payload?.format || 'mp3';

      if (!audioBase64) {
        console.error('[WEBSOCKET-CLIENT] ❌ Audio base64 no encontrado en payload');
        return;
      }

      console.log('[WEBSOCKET-CLIENT] 🎵 Recibido audio del servidor:', {
        format,
        isWelcome,
        textLength: text?.length || 0,
        audioLength: audioBase64.length
      });

      // Reproducir audio base64
      await this.playBase64Audio(audioBase64, format, isWelcome);

      // Si hay texto, también mostrarlo
      if (text) {
        this.displayResponseComplete(text);
        // Agregar a historial
        this.conversationHistory.push({
          role: 'assistant',
          content: text,
          timestamp: new Date()
        });
      }

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error manejando respuesta de audio:', err);
    }
  }

  /**
   * Play base64 audio using HTML5 Audio element
   */
  async playBase64Audio(base64Audio, format = 'mp3', isWelcome = false) {
    return new Promise((resolve, reject) => {
      try {
        // Convert base64 to blob
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);

        // Create audio element
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.volume = 1.0;

        // For welcome audio, wait for buffer to be ready
        if (isWelcome) {
          audio.addEventListener('canplaythrough', () => {
            console.log('[WEBSOCKET-CLIENT] ✅ Audio buffer cargado, reproduciendo...');
            audio.play().then(() => {
              console.log('[WEBSOCKET-CLIENT] ✅ Audio de bienvenida reproduciéndose');
            }).catch(err => {
              console.error('[WEBSOCKET-CLIENT] ❌ Error reproduciendo audio:', err);
              reject(err);
            });
          }, { once: true });

          audio.addEventListener('error', (err) => {
            console.error('[WEBSOCKET-CLIENT] ❌ Error cargando audio:', err);
            URL.revokeObjectURL(audioUrl);
            reject(err);
          });
        } else {
          // For regular audio, play immediately
          audio.play().then(() => {
            console.log('[WEBSOCKET-CLIENT] ✅ Audio reproduciéndose');
          }).catch(err => {
            console.error('[WEBSOCKET-CLIENT] ❌ Error reproduciendo audio:', err);
            reject(err);
          });
        }

        // Clean up when done
        audio.addEventListener('ended', () => {
          console.log('[WEBSOCKET-CLIENT] ✅ Audio terminado');
          URL.revokeObjectURL(audioUrl);
          resolve();
        }, { once: true });

        audio.addEventListener('error', (err) => {
          console.error('[WEBSOCKET-CLIENT] ❌ Error en audio:', err);
          URL.revokeObjectURL(audioUrl);
          reject(err);
        }, { once: true });

      } catch (err) {
        console.error('[WEBSOCKET-CLIENT] ❌ Error procesando audio base64:', err);
        reject(err);
      }
    });
  }

  /**
   * Play voice response using voice library manager
   */
  async playVoiceResponse(text, responseType = 'general') {
    try {
      console.log('[WEBSOCKET-CLIENT] 🎤 Reproduciendo respuesta de Sandra...');

      if (window.voiceLibraryManager && window.voiceLibraryManager.initialized) {
        const result = await window.voiceLibraryManager.playVoice(responseType, text);

        if (result) {
          console.log('[WEBSOCKET-CLIENT] ✅ Voz reproducida correctamente');
          return true;
        } else {
          console.warn('[WEBSOCKET-CLIENT] ⚠️  Voice Library no pudo reproducir, usando fallback');
          return this.playFallbackVoice(text);
        }
      } else {
        console.warn('[WEBSOCKET-CLIENT] Voice Library no está disponible');
        return this.playFallbackVoice(text);
      }

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error reproduciendo voz:', err);
      return this.playFallbackVoice(text);
    }
  }

  /**
   * Fallback voice playback using browser Speech Synthesis API
   */
  playFallbackVoice(text) {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn('[WEBSOCKET-CLIENT] Speech Synthesis no disponible');
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
      console.log('[WEBSOCKET-CLIENT] ✅ Usando fallback de síntesis de voz');
      return true;

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error en fallback voice:', err);
      return false;
    }
  }

  /**
   * Set language for transcription and response
   */
  setLanguage(language) {
    this.language = language;
    localStorage.setItem('sandra_language', language);

    console.log('[WEBSOCKET-CLIENT] 🌐 Idioma establecido:', language);

    if (this.isConnected && this.ws) {
      this.sendMCP('conserje', 'setLanguage', { language });
    }
  }

  /**
   * Set LLM provider (openai, groq, anthropic, gemini)
   */
  setProvider(provider) {
    if (!this.availableProviders.includes(provider)) {
      console.warn('[WEBSOCKET-CLIENT] ⚠️  Proveedor no disponible:', provider);
      console.warn('[WEBSOCKET-CLIENT] Proveedores disponibles:', this.availableProviders.join(', '));
      return;
    }

    this.llmProvider = provider;
    localStorage.setItem('llm_provider', provider);

    console.log('[WEBSOCKET-CLIENT] 🔄 Proveedor LLM establecido:', provider);

    if (this.isConnected && this.ws) {
      this.sendMCP('conserje', 'setProvider', { provider });
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.currentResponse = '';
    console.log('[WEBSOCKET-CLIENT] 🗑️  Historial borrado');

    if (this.isConnected && this.ws) {
      this.sendMCP('conserje', 'clearHistory', {});
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isRecording: this.isRecording,
      language: this.language,
      llmProvider: this.llmProvider,
      availableProviders: this.availableProviders,
      historyLength: this.conversationHistory.length,
      currentResponse: this.currentResponse.substring(0, 50) + '...'
    };
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Send message to server (MCP format)
   */
  sendMCP(route, action, payload = {}) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        route,
        action,
        payload
      };
      this.ws.send(JSON.stringify(message));
      console.log('[WEBSOCKET-CLIENT] 📤 Enviado:', { route, action });
    } else {
      console.warn('[WEBSOCKET-CLIENT] ⚠️  No se puede enviar: WebSocket no conectado');
    }
  }

  /**
   * Send message to server (legacy format for backward compatibility)
   */
  send(data) {
    // If data already has route/action, send as-is
    if (data.route && data.action) {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
      return;
    }

    // Convert legacy format to MCP format
    if (data.type) {
      const routeMap = {
        'setLanguage': { route: 'conserje', action: 'setLanguage' },
        'setProvider': { route: 'conserje', action: 'setProvider' },
        'clearHistory': { route: 'conserje', action: 'clearHistory' }
      };

      const mapping = routeMap[data.type];
      if (mapping) {
        this.sendMCP(mapping.route, mapping.action, { ...data, type: undefined });
      } else {
        // Fallback: send as legacy format
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      }
    } else {
      // Send as-is
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
    }
  }

  /**
   * UI Display Methods
   */

  displayTranscription(text) {
    const container = document.getElementById('sandra-messages');
    if (!container) return;

    const html = `
      <div class="flex gap-2 flex-row-reverse">
        <div class="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-none shadow-sm text-xs max-w-[85%]">
          <p>${text}</p>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
  }

  displayResponseStreaming(chunk) {
    const container = document.getElementById('sandra-messages');
    if (!container) return;

    // Find or create response message
    let responseDiv = container.querySelector('[data-type="response"]');

    if (!responseDiv) {
      const html = `
        <div class="flex gap-2" data-type="response">
          <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">S</div>
          <div class="bg-white border border-slate-100 text-slate-700 p-2.5 rounded-xl rounded-tl-none shadow-sm text-xs max-w-[85%]">
            <p></p>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      responseDiv = container.querySelector('[data-type="response"]');
    }

    // Update response text
    const textDiv = responseDiv.querySelector('p');
    if (textDiv) {
      textDiv.textContent += chunk;
    }

    container.scrollTop = container.scrollHeight;
  }

  displayResponseComplete(text) {
    // Response is already displayed through streaming
    console.log('[WEBSOCKET-CLIENT] Respuesta visible en pantalla');
  }

  showError(message) {
    console.error('[WEBSOCKET-CLIENT] ❌', message);

    const container = document.getElementById('sandra-messages');
    if (!container) return;

    const html = `
      <div class="flex gap-2">
        <div class="w-6 h-6 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">⚠️</div>
        <div class="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl rounded-tl-none shadow-sm text-xs max-w-[85%]">
          <p>${message}</p>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
  }
}

// Initialize on page load (only once)
(function() {
  let initialized = false;

  function initialize() {
    if (initialized || window.websocketStreamClient) {
      console.log('[WEBSOCKET-CLIENT] ⏸️  Ya inicializado, omitiendo...');
      return;
    }

    initialized = true;
    console.log('[WEBSOCKET-CLIENT] 📄 Inicializando sistema...');

    try {
      window.websocketStreamClient = new WebSocketStreamClient();
  // Also expose as speechToChatSystem for compatibility
  window.speechToChatSystem = window.websocketStreamClient;
      console.log('[WEBSOCKET-CLIENT] ✅ Script cargado correctamente');
    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error inicializando:', err);
      initialized = false;
    }
  }

  // Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM already loaded
    initialize();
  }
})();
