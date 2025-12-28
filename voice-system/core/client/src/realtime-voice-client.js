/**
 * Universal Realtime Voice Client
 * Works in Browser, React Native, Electron, Node.js
 *
 * Features:
 * - WebSocket connection management with automatic reconnection
 * - Audio capture (microphone input)
 * - Audio playback (speaker output)
 * - Message routing (text, transcription, audio, control)
 * - State management
 * - Event system
 * - Graceful error handling
 *
 * Usage (Browser):
 * const client = new RealtimeVoiceClient({
 *   serverUrl: 'ws://localhost:4042',
 *   apiToken: 'your-token',
 *   language: 'es'
 * });
 * await client.connect();
 * client.on('transcription', (text) => console.log(text));
 * client.on('text', (chunk) => console.log(chunk));
 * await client.startListening();
 */

class RealtimeVoiceClient {
  constructor(config = {}) {
    // Configuration
    this.config = {
      serverUrl: config.serverUrl || 'ws://localhost:4042',
      language: config.language || 'es',
      sampleRate: config.sampleRate || 16000,
      channels: config.channels || 1,
      encoding: config.encoding || 'linear16',
      autoReconnect: config.autoReconnect !== false,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      debug: config.debug || false,
      ...config
    };

    // State
    this.state = {
      connected: false,
      listening: false,
      processing: false,
      reconnectAttempts: 0
    };

    // WebSocket
    this.ws = null;
    this.clientId = null;
    this.token = null;

    // Audio
    this.audioContext = null;
    this.mediaStream = null;
    this.audioProcessor = null;
    this.audioPlayback = null;

    // Event handlers
    this.eventHandlers = new Map();

    // Message queue for offline sending
    this.messageQueue = [];

    // Timeouts
    this.reconnectTimeout = null;
    this.pingInterval = null;
  }

  /**
   * Connect to WebSocket server
   */
  async connect() {
    return new Promise(async (resolve, reject) => {
      try {
        // Get token if not already obtained
        if (!this.token) {
          this.token = await this.getToken();
        }

        const wsUrl = `${this.config.serverUrl}/ws/stream?token=${this.token}`;

        if (this.config.debug) {
          console.log('[RVC] Connecting to:', wsUrl);
        }

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          this.state.connected = true;
          this.state.reconnectAttempts = 0;

          if (this.config.debug) {
            console.log('[RVC] WebSocket connected');
          }

          // Start ping interval to keep connection alive
          this.startPingInterval();

          // Process queued messages
          this.processMessageQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[RVC] WebSocket error:', error);
          this.emit('error', {
            type: 'connection_error',
            message: error.message
          });
        };

        this.ws.onclose = () => {
          this.state.connected = false;

          if (this.config.debug) {
            console.log('[RVC] WebSocket closed');
          }

          this.stopPingInterval();

          // Attempt reconnection if enabled
          if (this.config.autoReconnect && this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }

          this.emit('disconnected', {
            reconnectAttempts: this.state.reconnectAttempts,
            maxAttempts: this.config.maxReconnectAttempts
          });
        };

        // Set connection timeout
        setTimeout(() => {
          if (!this.state.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);

      } catch (error) {
        console.error('[RVC] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Get token from server
   */
  async getToken() {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: this.generateClientId()
        })
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.clientId = data.clientId;
      return data.token.token;
    } catch (error) {
      console.error('[RVC] Failed to get token:', error);
      throw error;
    }
  }

  /**
   * Get WebSocket config from server
   */
  async getConfig() {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/config`);
      if (!response.ok) {
        throw new Error(`Config request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[RVC] Failed to get config:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages from server
   */
  handleMessage(data) {
    // Binary data = audio chunks
    if (data instanceof ArrayBuffer || (typeof data === 'object' && data instanceof Uint8Array)) {
      this.handleAudioMessage(data);
      return;
    }

    // Text data = JSON messages
    try {
      const message = JSON.parse(data.toString());
      this.handleControlMessage(message);
    } catch (error) {
      console.error('[RVC] Failed to parse message:', error);
    }
  }

  /**
   * Handle binary audio messages
   */
  handleAudioMessage(audioData) {
    this.emit('audio', audioData);

    // Auto-play if audio playback is configured
    if (this.audioPlayback) {
      this.audioPlayback.play(audioData);
    }
  }

  /**
   * Handle control messages
   */
  handleControlMessage(message) {
    if (this.config.debug) {
      console.log('[RVC] Message:', message.type);
    }

    switch (message.type) {
      case 'connected':
        this.clientId = message.clientId;
        this.emit('ready', message);
        break;

      case 'transcription':
        this.emit('transcription', message.text);
        break;

      case 'text':
        this.emit('text', message.content);
        break;

      case 'response_complete':
        this.emit('response_complete', message);
        this.state.processing = false;
        break;

      case 'error':
        this.emit('error', message);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        this.emit('message', message);
    }
  }

  /**
   * Start listening to microphone
   */
  async startListening() {
    try {
      if (this.state.listening) {
        console.warn('[RVC] Already listening');
        return;
      }

      if (!this.state.connected) {
        throw new Error('Not connected to server');
      }

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Initialize audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create audio processor
      this.audioProcessor = new AudioProcessor(this.audioContext, {
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        bufferSize: 4096,
        onAudioData: (audioData) => this.sendAudio(audioData)
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.audioProcessor.node);
      this.audioProcessor.node.connect(this.audioContext.destination);

      this.state.listening = true;
      this.emit('listening_started');

      if (this.config.debug) {
        console.log('[RVC] Listening started');
      }

    } catch (error) {
      console.error('[RVC] Failed to start listening:', error);
      this.emit('error', {
        type: 'audio_capture_error',
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Stop listening to microphone
   */
  stopListening() {
    if (!this.state.listening) {
      return;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.stop();
      this.audioProcessor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.state.listening = false;
    this.emit('listening_stopped');

    if (this.config.debug) {
      console.log('[RVC] Listening stopped');
    }
  }

  /**
   * Send audio data to server
   */
  sendAudio(audioData) {
    if (!this.state.connected) {
      return;
    }

    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(audioData);
      }
    } catch (error) {
      console.error('[RVC] Failed to send audio:', error);
    }
  }

  /**
   * Send control message
   */
  sendMessage(message) {
    if (!this.state.connected) {
      this.messageQueue.push(message);
      return;
    }

    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('[RVC] Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Set language
   */
  setLanguage(language) {
    this.config.language = language;
    this.sendMessage({
      type: 'setLanguage',
      language
    });
  }

  /**
   * Set LLM provider
   */
  setLLMProvider(provider) {
    this.sendMessage({
      type: 'setProvider',
      provider
    });
  }

  /**
   * Reset conversation
   */
  reset() {
    this.sendMessage({
      type: 'reset'
    });
    this.emit('conversation_reset');
  }

  /**
   * Enable audio playback
   */
  enableAudioPlayback() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    this.audioPlayback = new AudioPlayback(audioContext, {
      sampleRate: this.config.sampleRate
    });

    this.emit('audio_playback_enabled');
  }

  /**
   * Disable audio playback
   */
  disableAudioPlayback() {
    if (this.audioPlayback) {
      this.audioPlayback.stop();
      this.audioPlayback = null;
    }
    this.emit('audio_playback_disabled');
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RVC] Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.stopListening();
    this.disableAudioPlayback();
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.state.connected = false;
    this.emit('disconnected');

    if (this.config.debug) {
      console.log('[RVC] Disconnected');
    }
  }

  /**
   * Ping interval to keep connection alive
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000);
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    this.state.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    if (this.config.debug) {
      console.log(`[RVC] Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts})`);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[RVC] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Process queued messages
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Audio Processor - Captures microphone input
 */
class AudioProcessor {
  constructor(audioContext, config = {}) {
    this.audioContext = audioContext;
    this.config = {
      sampleRate: config.sampleRate || 16000,
      channels: config.channels || 1,
      bufferSize: config.bufferSize || 4096,
      onAudioData: config.onAudioData || (() => {})
    };

    const bufferSize = this.config.bufferSize;
    const channels = this.config.channels;
    const sampleRate = this.config.sampleRate;

    // Create ScriptProcessor
    this.node = audioContext.createScriptProcessor(bufferSize, channels, channels);

    this.node.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);

      // Convert float32 to int16
      const pcmData = this.floatTo16BitPCM(inputData);

      // Call callback with audio data
      this.config.onAudioData(pcmData);
    };
  }

  /**
   * Convert float32 audio to int16 PCM
   */
  floatTo16BitPCM(float32Data) {
    const length = float32Data.length;
    const int16Data = new Int16Array(length);

    for (let i = 0; i < length; i++) {
      const sample = float32Data[i];
      const s = Math.max(-1, Math.min(1, sample));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return int16Data.buffer;
  }

  stop() {
    if (this.node) {
      this.node.disconnect();
    }
  }
}

/**
 * Audio Playback - Plays server audio responses
 */
class AudioPlayback {
  constructor(audioContext, config = {}) {
    this.audioContext = audioContext;
    this.config = {
      sampleRate: config.sampleRate || 16000,
      ...config
    };

    this.queue = [];
    this.isPlaying = false;
  }

  /**
   * Queue audio data for playback
   */
  play(audioData) {
    this.queue.push(audioData);

    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process audio queue
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift();

    try {
      // Convert int16 to float32
      const float32Data = this.int16ToFloat32(new Int16Array(audioData));

      // Create audio buffer
      const audioBuffer = this.audioContext.createAudioBuffer(
        1,
        float32Data.length,
        this.config.sampleRate
      );

      audioBuffer.getChannelData(0).set(float32Data);

      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      // Schedule next chunk
      source.onended = () => {
        this.processQueue();
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      this.processQueue();
    }
  }

  /**
   * Convert int16 to float32
   */
  int16ToFloat32(int16Data) {
    const float32Data = new Float32Array(int16Data.length);

    for (let i = 0; i < int16Data.length; i++) {
      const sample = int16Data[i];
      float32Data[i] = sample < 0 ? sample / 0x8000 : sample / 0x7FFF;
    }

    return float32Data;
  }

  stop() {
    this.queue = [];
    this.isPlaying = false;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealtimeVoiceClient, AudioProcessor, AudioPlayback };
}

if (typeof window !== 'undefined') {
  window.RealtimeVoiceClient = RealtimeVoiceClient;
}
