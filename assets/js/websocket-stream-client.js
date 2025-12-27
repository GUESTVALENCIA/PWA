/**
 * WebSocket Enterprise Stream Client
 * ===================================
 * Frontend system for WebSocket bidirectional streaming
 * - Captures audio from microphone (MediaRecorder)
 * - Sends audio chunks to WebSocket server
 * - Receives transcription and response streaming
 * - Integrates with voice library manager for Sandra voice
 */

class WebSocketStreamClient {
  constructor() {
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

    // Configuration
    this.config = {
      wsUrl: this.determineWSUrl(),
      audioMimeType: 'audio/webm;codecs=opus',
      audioSampleRate: 48000,
      audioChannels: 1,
      chunkDuration: 100 // ms between chunks
    };

    // Auto-initialize
    this.init();
  }

  /**
   * Determine WebSocket URL based on current location
   */
  determineWSUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/stream`;
  }

  /**
   * Initialize WebSocket connection
   */
  async init() {
    try {
      console.log('[WEBSOCKET-CLIENT] 🔌 Inicializando conexión WebSocket...');
      console.log('[WEBSOCKET-CLIENT] URL:', this.config.wsUrl);

      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        console.log('[WEBSOCKET-CLIENT] ✅ Conectado al servidor WebSocket');
        this.isConnected = true;

        // Send initial configuration
        this.send({
          type: 'setLanguage',
          language: this.language
        });
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (err) => {
        console.error('[WEBSOCKET-CLIENT] ❌ WebSocket error:', err);
      };

      this.ws.onclose = () => {
        console.log('[WEBSOCKET-CLIENT] ⚠️  Desconectado del servidor');
        this.isConnected = false;
        // Attempt reconnection after 3 seconds
        setTimeout(() => this.init(), 3000);
      };

      // Wait for connection
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.isConnected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        setTimeout(() => clearInterval(checkConnection), 5000);
      });

      console.log('[WEBSOCKET-CLIENT] ✅ Sistema inicializado correctamente');
      window.speechToChatSystem = this; // Expose globally for testing

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] ❌ Error inicializando:', err);
      setTimeout(() => this.init(), 3000);
    }
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(data) {
    console.log('[WEBSOCKET-CLIENT] 📨 Mensaje recibido:', data.type);

    switch (data.type) {
      case 'connection':
        console.log('[WEBSOCKET-CLIENT] Confirmación de conexión:', data.clientId);
        if (data.availableProviders) {
          this.availableProviders = data.availableProviders;
          console.log('[WEBSOCKET-CLIENT] 🔄 Proveedores disponibles:', this.availableProviders.join(', '));
        }
        // Send provider preference if set
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
    console.log('[WEBSOCKET-CLIENT] 📝 Transcripción:', data.text);

    if (!data.text) {
      console.warn('[WEBSOCKET-CLIENT] Transcripción vacía');
      return;
    }

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: data.text,
      timestamp: new Date()
    });

    // Display in UI if available
    this.displayTranscription(data.text);
  }

  /**
   * Handle streaming response chunks
   */
  handleResponseChunk(data) {
    console.log('[WEBSOCKET-CLIENT] 📊 Chunk #' + data.sequence + ':', data.text);

    this.currentResponse += data.text;

    // Display streaming text in real-time
    this.displayResponseStreaming(data.text);
  }

  /**
   * Handle completed response
   */
  async handleResponseComplete(data) {
    console.log('[WEBSOCKET-CLIENT] ✅ Respuesta completada');
    console.log('[WEBSOCKET-CLIENT] Tipo de respuesta:', data.responseType);

    this.currentResponse = data.text;
    this.currentResponseType = data.responseType;

    // Add to conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: data.text,
      type: data.responseType,
      timestamp: new Date()
    });

    // Play voice response
    await this.playVoiceResponse(data.text, data.responseType);

    // Display final response
    this.displayResponseComplete(data.text);
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

          // Send to server
          if (this.isConnected && this.ws) {
            this.ws.send(audioBlob);
            console.log('[WEBSOCKET-CLIENT] ✅ Audio enviado al servidor');
          } else {
            console.error('[WEBSOCKET-CLIENT] ❌ WebSocket no conectado');
            this.showError('No hay conexión con el servidor');
          }

          // Stop all tracks
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

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
      this.send({
        type: 'setLanguage',
        language: language
      });
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
      this.send({
        type: 'setProvider',
        provider: provider
      });
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
      this.send({
        type: 'clearHistory'
      });
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
   * Send message to server
   */
  send(data) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WEBSOCKET-CLIENT] ⚠️  No se puede enviar: WebSocket no conectado');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[WEBSOCKET-CLIENT] 📄 DOM cargado, inicializando sistema...');

  // Create global instance
  if (!window.websocketStreamClient) {
    window.websocketStreamClient = new WebSocketStreamClient();
  }

  // Also expose as speechToChatSystem for compatibility
  window.speechToChatSystem = window.websocketStreamClient;
});

// Auto-initialize if script loaded after DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[WEBSOCKET-CLIENT] 📄 DOM already loaded');
  });
} else {
  console.log('[WEBSOCKET-CLIENT] 📄 DOM already loaded, creating instance...');
  if (!window.websocketStreamClient) {
    window.websocketStreamClient = new WebSocketStreamClient();
  }
  window.speechToChatSystem = window.websocketStreamClient;
}

console.log('[WEBSOCKET-CLIENT] ✅ Script cargado correctamente');
