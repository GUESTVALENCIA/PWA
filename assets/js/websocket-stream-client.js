/**
 * WebSocket Enterprise Stream Client
 * ===================================
 * Frontend system for WebSocket bidirectional streaming
 * - Captures audio using AudioWorklet (raw PCM) for <200ms latency
 * - Sends audio chunks to WebSocket server
 * - Receives transcription and response streaming (AudioBuffer)
 * - Optimized for Mobile (iOS/Android)
 * 
 * CRITICAL: This client ALWAYS connects to MCP server on Render (wss://pwa-imbf.onrender.com)
 */

// CRITICAL: Global validation - block any WebSocket connection to Vercel
(function () {
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    if (typeof url === 'string') {
      if (url.includes('vercel.app') || url.includes('pwa-chi-six') || url.includes('/ws/stream')) {
        console.error('[WEBSOCKET-CLIENT] ❌ BLOQUEO GLOBAL: Intento de conectar a Vercel bloqueado');
        url = 'wss://pwa-imbf.onrender.com';
      }
    }
    return new originalWebSocket(url, protocols);
  };
  Object.setPrototypeOf(window.WebSocket, originalWebSocket);
  Object.getOwnPropertyNames(originalWebSocket).forEach(prop => {
    if (prop !== 'prototype' && prop !== 'length' && prop !== 'name') {
      window.WebSocket[prop] = originalWebSocket[prop];
    }
  });
})();

class WebSocketStreamClient {
  constructor() {
    console.log('[WEBSOCKET-CLIENT] 🚀 Inicializando Enterprise Client...');

    this.ws = null;
    this.audioContext = null;
    this.workletNode = null;
    this.stream = null;
    this.isRecording = false;
    this.isConnected = false;

    // Playback Queue (Double Buffer Strategy)
    this.audioQueue = [];
    this.isPlaying = false;
    this.scheduledTime = 0;
    this.initialBufferTime = 0.1; // 100ms buffering

    // Config
    this.config = {
      wsUrl: null,
      sampleRate: 24000, // Optimized for Cartesia/Deepgram
      bufferSize: 4096
    };

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.shouldReconnect = true;

    this.init();
  }

  async init() {
    try {
      await this.loadConfig();
      await this.setupAudioContext(); // Initialize AC early (needed for mobile unlock)
      await this.connectWebSocket();
    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] Init Error:', err);
    }
  }

  async loadConfig() {
    // Config loader logic - FORCED LOCALHOST FOR DEBUGGING
    try {
      console.log('[WEBSOCKET-CLIENT] 🔧 MODO DEBUG: Forzando conexión a Localhost');
      this.config.wsUrl = 'ws://localhost:4042';
      this.config.mcpToken = null;
      console.log('[WEBSOCKET-CLIENT] Config loaded (FORCED):', this.config.wsUrl);
    } catch (e) {
      console.warn('[WEBSOCKET-CLIENT] Config load failed, using fallback.');
      this.config.wsUrl = 'ws://localhost:4042';
    }
  }

  async setupAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: this.config.sampleRate
    });

    // iOS/Mobile Unlock
    const resumeAudio = async () => {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[WEBSOCKET-CLIENT] AudioContext Resumed');
      }
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
  }

  async connectWebSocket() {
    if (this.ws) this.ws.close();

    console.log('[WEBSOCKET-CLIENT] Connecting to:', this.config.wsUrl);
    this.ws = new WebSocket(this.config.wsUrl);
    this.ws.binaryType = 'arraybuffer'; // CRITICAL for PCM audio

    this.ws.onopen = () => {
      console.log('[WEBSOCKET-CLIENT] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // Send handshake
      this.ws.send(JSON.stringify({
        type: 'config',
        sampleRate: this.config.sampleRate
      }));
    };

    this.ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        // We received raw audio from the server
        await this.handleAudioMessage(event.data);
      } else {
        // String message (control/text)
        try {
          const data = JSON.parse(event.data);
          this.handleControlMessage(data);
        } catch (e) {
          console.error('[WEBSOCKET-CLIENT] Parse error:', e);
        }
      }
    };

    this.ws.onclose = () => {
      console.log('[WEBSOCKET-CLIENT] Disconnected');
      this.isConnected = false;
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = (e) => console.error('[WEBSOCKET-CLIENT] WS Error:', e);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts > this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectWebSocket();
    }, delay);
  }

  /**
   * AUDIO INPUT (Microphone -> AudioWorklet -> WebSocket)
   */
  async startListening() {
    if (this.isRecording) return;
    try {
      await this.audioContext.resume();

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          latency: 0
        }
      });

      const source = this.audioContext.createMediaStreamSource(this.stream);

      // Load Worklet
      try {
        await this.audioContext.audioWorklet.addModule('/assets/js/audio-processor.js');
      } catch (e) {
        console.warn('Worklet load failed, trying absolute path...');
        await this.audioContext.audioWorklet.addModule('assets/js/audio-processor.js');
      }

      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

      this.workletNode.port.onmessage = (event) => {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
          // Convert Float32 to Int16 for Deepgram (bandwidth optimization)
          const float32 = event.data;
          const int16 = this.floatTo16BitPCM(float32);
          this.ws.send(int16);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination); // Keep alive

      this.isRecording = true;
      console.log('[WEBSOCKET-CLIENT] Listening (Low Latency Mode)');

    } catch (err) {
      console.error('[WEBSOCKET-CLIENT] Mic Error:', err);
      // Fallback code could check permission
    }
  }

  async stopListening() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
    }
    this.isRecording = false;
    console.log('[WEBSOCKET-CLIENT] Stopped Listening');
  }

  /**
   * AUDIO OUTPUT (WebSocket -> AudioBuffer -> Speakers)
   */
  async handleAudioMessage(arrayBuffer) {
    // Decode incoming audio (MP3/PCM)
    // Cartesia usually sends raw PCM or containerized audio.
    try {
      // LET'S ASSUME RAW PCM Int16 (S16LE) @ 24kHz (from our blueprint plan)
      // This is efficient. If server sends MP3, we decode via audioContext.decodeAudioData
      // But for pure speed, PCM is better. 
      // We will try to detect or just assume payload format based on header or trust server config.

      // For now, let's try decodeAudioData as it handles most headers (mp3, wav).
      // If it fails, treat as raw PCM.
      try {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0)); // Copy buffer just in case
        this.queueAudio(audioBuffer);
      } catch (decodeErr) {
        // Fallback to RAW PCM assumption if decode fails
        const int16Data = new Int16Array(arrayBuffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0;
        }
        const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
        audioBuffer.copyToChannel(float32Data, 0);
        this.queueAudio(audioBuffer);
      }

    } catch (e) {
      console.error('[WEBSOCKET-CLIENT] Audio Decode Error:', e);
    }
  }

  queueAudio(buffer) {
    this.audioQueue.push(buffer);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.audioQueue.shift();
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Precise Timing
    const currentTime = this.audioContext.currentTime;
    const start = Math.max(currentTime, this.scheduledTime);

    source.start(start);
    this.scheduledTime = start + buffer.duration;

    source.onended = () => {
      if (this.audioQueue.length === 0 && this.audioContext.currentTime >= this.scheduledTime) {
        this.isPlaying = false;
      }
    };

    if (this.audioQueue.length > 0) {
      this.playNext();
    }
  }

  // Util: Convert Float32 (Mic) to Int16 (Server)
  floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  handleControlMessage(data) {
    if (data.type === 'transcript') {
      console.log('[TRANSCRIPT]', data.text);
      if (window.onTranscript) window.onTranscript(data.text, data.role);
    }
  }
}

// Export for global usage
window.WebSocketStreamClient = WebSocketStreamClient;
