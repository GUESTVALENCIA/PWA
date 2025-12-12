/**
 * ============================================
 * SANDRA WIDGET - VERSIÓN INYECTABLE
 * ============================================
 * 
 * Este código puede inyectarse directamente en cualquier plataforma
 * NO requiere archivos externos - Todo está autocontenido
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Copiar TODO este código
 * 2. Inyectarlo en la plataforma donde necesites el widget
 * 3. Ubicación recomendada: Antes del cierre de </body>
 * 4. El widget se auto-inicializa al cargar
 * 
 * CONFIGURACIÓN (ajustar según tu servidor MCP):
 * - window.MCP_SERVER_URL: URL del servidor Galaxy/MCP
 * - window.WIDGET_ENABLED: true/false para activar/desactivar
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN GLOBAL
  // ============================================
  
  // URL del servidor MCP (Galaxy) - AJUSTAR SEGÚN TU SERVIDOR
  window.MCP_SERVER_URL = window.MCP_SERVER_URL || 'https://mcp.sandra-ia.com';
  
  // Habilitar/deshabilitar widget
  window.WIDGET_ENABLED = window.WIDGET_ENABLED !== false;
  
  // Token de autenticación (opcional)
  window.SANDRA_TOKEN = window.SANDRA_TOKEN || '';

  // ============================================
  // CLASE SANDRA WIDGET
  // ============================================

  class SandraWidget {
    constructor() {
      this.isEnabled = this.checkEnabled();
      this.mcpServerUrl = this.getMcpServerUrl();
      this.isCallActive = false;
      this.ws = null;
      this.mediaRecorder = null;
      this.stream = null;
      this.isSpeaking = false;
      this.awaitingResponse = false;
      this.sessionId = null;
      this.callStartTime = null;
      this.inactivityTimer = null;
      this.audioContext = null;
      this.audioSource = null;
      this.currentVideo = null;
      this.currentImage = null;

      this.scriptOrigin = this.getScriptOrigin();
      this.greetingPlayed = false;

      this.audioQueue = [];
      this.audioPlaybackTimer = null;
      this.isAudioPlaybackRunning = false;
      this.currentAudio = null;
      this.audioJitterMs = 300;

      this.recordingSliceMs = 5500;
      this.minRecordedBytes = 6000;
      this.recordingStopTimeout = null;
      this.recordedChunks = [];
      this.responseWatchdogTimeout = null;
      
      if (this.isEnabled) {
        this.init();
      }
    }

    checkEnabled() {
      if (typeof window !== 'undefined') {
        return window.WIDGET_ENABLED !== false && 
               (window.WIDGET_ENABLED === true || 
                !document.querySelector('[data-widget-disabled]'));
      }
      return true;
    }

    getMcpServerUrl() {
      if (typeof window !== 'undefined' && window.MCP_SERVER_URL) {
        return window.MCP_SERVER_URL;
      }
      
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:4042';
      }
      
      return 'https://mcp.sandra-ia.com';
    }

    getScriptOrigin() {
      try {
        const directSrc = document.currentScript && document.currentScript.src;
        const scriptSrc = directSrc || Array.from(document.scripts || [])
          .map(s => s && s.src)
          .filter(Boolean)
          .find(src => src.includes('WIDGET_INYECTABLE')) || '';

        if (scriptSrc) return new URL(scriptSrc).origin;
      } catch (_) {
        // ignore
      }

      return (window.location && window.location.origin) ? window.location.origin : '';
    }

    getGreetingAudioUrl() {
      return `${this.scriptOrigin}/assets/audio/welcome.mp3`;
    }

    async warmup() {
      try {
        await fetch(`${this.mcpServerUrl}/health`, { cache: 'no-store' });
      } catch (_) {
        // ignore warmup failures
      }
    }

    async playGreetingOnce() {
      if (this.greetingPlayed) return;
      this.greetingPlayed = true;

      try {
        await this.playAudioUrl(this.getGreetingAudioUrl());
      } catch (error) {
        console.warn('⚠️ [CALLFLOW] No se pudo reproducir saludo local, usando fallback remoto:', error);
        try {
          await this.playWelcomeMessage();
        } catch (_) {
          // ignore
        }
      }
    }

    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result || '').toString().split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    init() {
      this.ensureVisibility();
      
      if (!document.getElementById('sandra-widget-button-container')) {
        this.mountWidget();
      }
      
      this.attachEventListeners();
      
      console.log('✅ SandraWidget inicializado', {
        enabled: this.isEnabled,
        mcpServerUrl: this.mcpServerUrl
      });
    }

    ensureVisibility() {
      const container = document.getElementById('sandra-widget-root') || 
                        document.getElementById('sandra-widget-container');
      
      if (container) {
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('z-index', '9999', 'important');
      }
      
      const buttonContainer = document.getElementById('sandra-widget-button-container');
      if (buttonContainer) {
        buttonContainer.style.setProperty('display', 'block', 'important');
        buttonContainer.style.setProperty('visibility', 'visible', 'important');
        buttonContainer.style.setProperty('opacity', '1', 'important');
      }
    }

    mountWidget() {
      // Eliminar contenedores duplicados
      const existingIds = ['sandra-widget-root', 'sandra-widget-container', 'sandra-widget-button-container'];
      const existingContainers = existingIds
        .map(id => document.getElementById(id))
        .filter(el => el !== null);
      
      if (existingContainers.length > 1) {
        console.warn('⚠️ Detectados múltiples contenedores del widget. Eliminando duplicados...');
        for (let i = 1; i < existingContainers.length; i++) {
          existingContainers[i].remove();
        }
      }
      
      let container = document.getElementById('sandra-widget-button-container') ||
                      document.getElementById('sandra-widget-root') || 
                      document.getElementById('sandra-widget-container');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'sandra-widget-button-container';
        container.style.cssText = 'position: fixed !important; bottom: 1rem !important; right: 1rem !important; z-index: 99999 !important; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
        document.body.appendChild(container);
      }
      
      if (container) {
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('z-index', '99999', 'important');
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('bottom', '1rem', 'important');
        container.style.setProperty('right', '1rem', 'important');
      }
      
      this.createWidgetUI(container);
    }

    createWidgetUI(container) {
      if (container.querySelector('#sandra-widget-button')) {
        console.warn('⚠️ El botón del widget ya existe. No se creará duplicado.');
        return;
      }
      
      container.innerHTML = `
        <div id="sandra-widget-button" style="width: 4rem; height: 4rem; border-radius: 9999px; background: linear-gradient(to bottom right, #3b82f6, #9333ea); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); cursor: pointer; display: flex !important; align-items: center; justify-content: center; position: relative; transition: all 0.3s; visibility: visible !important; opacity: 1 !important; z-index: 99999;">
          <svg style="width: 2rem; height: 2rem; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span style="position: absolute; top: -0.25rem; right: -0.25rem; width: 0.75rem; height: 0.75rem; background-color: #4ade80; border-radius: 9999px; animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>
        </div>
      `;
      
      // Agregar animación pulse si no existe
      if (!document.getElementById('sandra-widget-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'sandra-widget-pulse-style';
        style.textContent = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }';
        document.head.appendChild(style);
      }
    }

    attachEventListeners() {
      const button = document.getElementById('sandra-widget-button');
      if (button) {
        button.addEventListener('click', () => this.startCall());
      }
    }

    async startCall() {
      if (this.isCallActive) {
        return this.endCall();
      }

      console.log('📞 [CALLFLOW] Iniciando llamada conversacional con Sandra...');
      this.callStartTime = Date.now();
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const warmupPromise = this.warmup();
        const greetingPromise = this.playGreetingOnce();

        await this.transitionToVideo();
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ [CALLFLOW] Micrófono accedido');

        await this.connectWebSocketWithTimeout();
        await this.reserveVoiceChannel();
        await Promise.allSettled([warmupPromise, greetingPromise]);

        this.isCallActive = true;
        this.startTranscription();
        this.updateUI('active');
        this.startInactivityTimer();

        console.log('✅ [CALLFLOW] Llamada iniciada correctamente');

      } catch (error) {
        console.error('❌ [CALLFLOW] Error iniciando llamada:', error);
        this.handleCallError(error);
      }
    }

    async transitionToVideo() {
      const imageElement = document.getElementById('sandra-avatar-image');
      const videoElement = document.getElementById('sandra-avatar-video');
      const interfaceContainer = document.getElementById('sandra-embedded-interface');

      if (imageElement && imageElement.style.display !== 'none') {
        this.currentImage = imageElement;
      }

      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(`${this.mcpServerUrl}/api/video/ambientation?timezone=${timezone}`);
        const data = await response.json();

        if (data.ambientation && data.ambientation.video) {
          if (imageElement) {
            imageElement.style.transition = 'opacity 0.5s ease-out';
            imageElement.style.opacity = '0';
          }

          if (videoElement) {
            videoElement.src = data.ambientation.video;
            videoElement.style.display = 'block';
            videoElement.style.opacity = '0';
            videoElement.load();
            
            videoElement.onloadeddata = () => {
              videoElement.style.transition = 'opacity 0.5s ease-in';
              videoElement.style.opacity = '1';
              videoElement.play();
              this.currentVideo = videoElement;
            };
          }

          console.log('✅ [CALLFLOW] Transición a video completada');
        }
      } catch (error) {
        console.error('Error en transición de video:', error);
      }
    }

    async connectWebSocketWithTimeout() {
      return new Promise((resolve, reject) => {
        const wsUrl = this.mcpServerUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        const token = this.getToken();
        const url = token ? `${wsUrl}?token=${token}` : wsUrl;
        
        this.ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error('WebSocket handshake timeout (5s)'));
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ [CALLFLOW] WebSocket conectado (handshake completado)');
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ [CALLFLOW] Error WebSocket:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parseando mensaje WebSocket:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 [CALLFLOW] WebSocket cerrado');
          if (this.isCallActive) {
            this.endCall();
          }
        };
      });
    }

    async reserveVoiceChannel() {
      try {
        const response = await fetch(`${this.mcpServerUrl}/api/conserje/voice-flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reserve_channel',
            sessionId: this.sessionId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        });

        if (!response.ok) {
          throw new Error(`Error reservando canal: ${response.status}`);
        }

        console.log('✅ [CALLFLOW] Canal de voz reservado');
      } catch (error) {
        console.error('Error reservando canal:', error);
        throw error;
      }
    }

    async playWelcomeMessage() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        console.log('🎤 [CALLFLOW] Solicitando mensaje de bienvenida...');
        const response = await fetch(`${this.mcpServerUrl}/api/audio/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone })
        });

        const data = await response.json();
        
        if (data.audio) {
          this.enqueueAudio(data.audio, 'mp3', { text: data.text, isWelcome: true });
          console.log('✅ [CALLFLOW] Mensaje de bienvenida reproducido');
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            route: 'conserje',
            action: 'welcome_complete',
            payload: { sessionId: this.sessionId }
          }));
        }

      } catch (error) {
        console.error('❌ [CALLFLOW] Error en mensaje de bienvenida:', error);
      }
    }

    async playAudioSync(audioBase64) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        this.currentAudio = audio;
        this.isSpeaking = true;
        
        if (this.currentVideo) {
          this.currentVideo.playbackRate = 1.0;
        }

        audio.onended = () => {
          this.currentAudio = null;
          this.isSpeaking = false;
          console.log('✅ [CALLFLOW] Audio sincronizado completado');
          resolve();
        };
        
        audio.onerror = (error) => {
          this.currentAudio = null;
          this.isSpeaking = false;
          reject(error);
        };

        audio.play().catch(reject);
      });
    }

    playAudioUrl(url) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        this.currentAudio = audio;
        this.isSpeaking = true;

        const cleanup = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          this.isSpeaking = false;
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };

        audio.onerror = (error) => {
          cleanup();
          reject(error);
        };

        const start = () => audio.play().then(() => {}).catch((err) => {
          cleanup();
          reject(err);
        });

        if (audio.readyState >= 3) {
          start();
        } else {
          audio.addEventListener('canplaythrough', start, { once: true });
          audio.load();
        }
      });
    }

    playAudioBase64(audioBase64, format = 'mp3') {
      return new Promise((resolve, reject) => {
        const audio = new Audio(`data:audio/${format};base64,${audioBase64}`);
        this.currentAudio = audio;
        this.isSpeaking = true;

        const cleanup = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
          this.isSpeaking = false;
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };

        audio.onerror = (error) => {
          cleanup();
          reject(error);
        };

        audio.play().catch((err) => {
          cleanup();
          reject(err);
        });
      });
    }

    enqueueAudio(audioBase64, format = 'mp3', meta = {}) {
      this.audioQueue.push({ audioBase64, format, meta });

      if (this.responseWatchdogTimeout) {
        clearTimeout(this.responseWatchdogTimeout);
        this.responseWatchdogTimeout = null;
      }

      if (this.isAudioPlaybackRunning) return;
      if (this.audioPlaybackTimer) return;

      this.audioPlaybackTimer = setTimeout(() => {
        this.audioPlaybackTimer = null;
        this.drainAudioQueue();
      }, this.audioJitterMs);
    }

    async drainAudioQueue() {
      if (this.isAudioPlaybackRunning) return;
      this.isAudioPlaybackRunning = true;

      try {
        while (this.isCallActive && this.audioQueue.length > 0) {
          const item = this.audioQueue.shift();
          await this.playAudioBase64(item.audioBase64, item.format);

          if (item.meta && item.meta.text) {
            this.logInteraction('sandra', item.meta.text);
          }
        }
      } finally {
        this.isAudioPlaybackRunning = false;
        this.awaitingResponse = false;

        if (this.isCallActive) {
          this.startNewRecording();
        }
      }
    }

    startResponseWatchdog() {
      if (this.responseWatchdogTimeout) clearTimeout(this.responseWatchdogTimeout);
      this.responseWatchdogTimeout = setTimeout(() => {
        if (!this.isCallActive) return;
        if (!this.awaitingResponse) return;

        console.warn('[CALLFLOW] Timeout esperando respuesta, reanudando escucha');
        this.awaitingResponse = false;
        this.startNewRecording();
      }, 15000);
    }

    startTranscription() {
      if (!this.stream) {
        console.error('❌ [CALLFLOW] No hay stream de audio para transcripción');
        return;
      }

      console.log('🎙️ [CALLFLOW] Iniciando transcripción automática (Deepgram STT)...');

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const chunks = this.recordedChunks;
        this.recordedChunks = [];

        if (!this.isCallActive) return;
        if (this.isSpeaking || this.awaitingResponse) return;

        if (chunks.length > 0) {
          this.resetInactivityTimer();

          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          if (audioBlob.size >= this.minRecordedBytes) {
            this.awaitingResponse = true;
            await this.sendAudioForProcessing(audioBlob);
            this.startResponseWatchdog();
            return;
          }
        }

        this.startNewRecording();
      };

      this.startNewRecording();
    }

    startNewRecording() {
      if (!this.isCallActive) return;
      if (!this.mediaRecorder || this.isSpeaking || this.awaitingResponse) return;

      try {
        this.mediaRecorder.start();

        if (this.recordingStopTimeout) clearTimeout(this.recordingStopTimeout);
        this.recordingStopTimeout = setTimeout(() => {
          try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          } catch (_) {
            // ignore
          }
        }, this.recordingSliceMs);
        console.log('🎙️ [CALLFLOW] Grabación iniciada');
      } catch (error) {
        console.error('Error iniciando grabación:', error);
      }
    }

    async sendAudioForProcessing(audioBlob) {
      try {
        const base64Audio = await this.blobToBase64(audioBlob);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            route: 'audio',
            action: 'stt',
            payload: {
              audio: base64Audio,
              context: { sessionId: this.sessionId, timezone }
            }
          }));
          return;
        }

        const response = await fetch(`${this.mcpServerUrl}/api/conserje/voice-flow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            sessionId: this.sessionId,
            timezone
          })
        });

        const data = await response.json();

        if (data.flow && data.flow.transcript) {
          this.logInteraction('user', data.flow.transcript);
        }

        if (data.flow && data.flow.audio) {
          this.enqueueAudio(data.flow.audio, 'mp3', { text: data.flow.response });
          return;
        }

        this.awaitingResponse = false;
        this.startNewRecording();
        return;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          
          console.log('📤 [CALLFLOW] Enviando audio para procesamiento (STT → LLM → TTS)...');
          
          const response = await fetch(`${this.mcpServerUrl}/api/conserje/voice-flow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              sessionId: this.sessionId,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          });

          const data = await response.json();
          
          if (data.flow) {
            if (data.flow.transcript) {
              console.log('📝 [CALLFLOW] Transcripción:', data.flow.transcript);
              this.logInteraction('user', data.flow.transcript);
            }

            if (data.flow.audio) {
              await this.playAudioSync(data.flow.audio);
              
              if (data.flow.response) {
                console.log('💬 [CALLFLOW] Respuesta de Sandra:', data.flow.response);
                this.logInteraction('sandra', data.flow.response);
              }
            }

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                route: 'conserje',
                action: 'interaction_complete',
                payload: {
                  sessionId: this.sessionId,
                  transcript: data.flow.transcript,
                  response: data.flow.response
                }
              }));
            }
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error('❌ [CALLFLOW] Error procesando audio:', error);
      }
    }

    handleWebSocketMessage(data) {
      console.log('📩 [CALLFLOW] Mensaje WebSocket recibido:', data);

      if (data.route === 'audio') {
        if (data.action === 'tts' && data.payload && data.payload.audio) {
          this.enqueueAudio(data.payload.audio, data.payload.format || 'mp3', { text: data.payload.text });
          return;
        }

        if (data.action === 'stt') {
          if (data.transcript) this.logInteraction('user', data.transcript);
          return;
        }
      }

      if (data.route === 'conserje') {
        if (data.action === 'message' && data.payload && data.payload.type === 'noSpeech' && data.payload.message) {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              route: 'audio',
              action: 'tts',
              payload: { text: data.payload.message }
            }));
          }
          return;
        }

        if (data.response) {
          this.handleTextResponse(data.response);
        }
      } else if (data.route === 'sync') {
        if (data.sync) {
          this.syncAudioVideo(data.sync);
        }
      }
    }

    handleTextResponse(response) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          route: 'audio',
          action: 'tts',
          payload: { text: response, sessionId: this.sessionId }
        }));
      }
    }

    syncAudioVideo(syncData) {
      if (!syncData || !this.currentVideo) return;

      const latency = syncData.latency || 0;
      
      if (this.currentVideo) {
        if (latency > 700) {
          this.currentVideo.playbackRate = 0.95;
        } else if (latency < 300) {
          this.currentVideo.playbackRate = 1.05;
        } else {
          this.currentVideo.playbackRate = 1.0;
        }
      }

      console.log(`🎬 [CALLFLOW] Sincronización ajustada (latencia: ${latency}ms)`);
    }

    endCall(reason = 'user') {
      if (!this.isCallActive) return;

      console.log(`📞 [CALLFLOW] Finalizando llamada (razón: ${reason})...`);

      this.isCallActive = false;
      this.clearInactivityTimer();

      if (this.audioPlaybackTimer) {
        clearTimeout(this.audioPlaybackTimer);
        this.audioPlaybackTimer = null;
      }
      this.audioQueue = [];
      this.isAudioPlaybackRunning = false;
      this.awaitingResponse = false;

      if (this.responseWatchdogTimeout) {
        clearTimeout(this.responseWatchdogTimeout);
        this.responseWatchdogTimeout = null;
      }

      if (this.recordingStopTimeout) {
        clearTimeout(this.recordingStopTimeout);
        this.recordingStopTimeout = null;
      }

      if (this.currentAudio) {
        try { this.currentAudio.pause(); } catch (_) {}
        this.currentAudio = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.ws) {
        this.ws.send(JSON.stringify({
          route: 'conserje',
          action: 'call_end',
          payload: {
            sessionId: this.sessionId,
            duration: Date.now() - this.callStartTime,
            reason
          }
        }));
        this.ws.close();
        this.ws = null;
      }

      this.transitionToImage();
      this.logCallEnd(reason);
      this.updateUI('inactive');
      console.log('✅ [CALLFLOW] Llamada finalizada');
    }

    transitionToImage() {
      const imageElement = this.currentImage || document.getElementById('sandra-avatar-image');
      const videoElement = this.currentVideo || document.getElementById('sandra-avatar-video');

      if (videoElement) {
        videoElement.style.transition = 'opacity 0.5s ease-out';
        videoElement.style.opacity = '0';
        
        setTimeout(() => {
          videoElement.pause();
          videoElement.style.display = 'none';
        }, 500);
      }

      if (imageElement) {
        imageElement.style.display = 'block';
        imageElement.style.opacity = '0';
        imageElement.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
          imageElement.style.opacity = '1';
        }, 100);
      }
    }

    startInactivityTimer() {
      this.resetInactivityTimer();
    }

    resetInactivityTimer() {
      this.clearInactivityTimer();
      
      this.inactivityTimer = setTimeout(() => {
        console.log('⏰ [CALLFLOW] Inactividad prolongada (90s), finalizando llamada...');
        this.endCall('inactivity');
      }, 90000);
    }

    clearInactivityTimer() {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }
    }

    handleCallError(error) {
      console.error('❌ [CALLFLOW] Error en llamada:', error);
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      if (this.ws) {
        this.ws.close();
      }

      this.transitionToImage();
      alert('Error al iniciar la llamada. Por favor, intenta de nuevo.');
    }

    logInteraction(type, content) {
      const logEntry = {
        sessionId: this.sessionId,
        type,
        content,
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - this.callStartTime
      };

      console.log(`📊 [CALLFLOW] Log:`, logEntry);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          route: 'system',
          action: 'log',
          payload: logEntry
        }));
      }
    }

    logCallEnd(reason) {
      const callLog = {
        sessionId: this.sessionId,
        startTime: new Date(this.callStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.callStartTime,
        reason,
        timestamp: new Date().toISOString()
      };

      console.log(`📊 [CALLFLOW] Log final de llamada:`, callLog);

      fetch(`${this.mcpServerUrl}/api/conserje/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_call',
          data: callLog
        })
      }).catch(error => {
        console.error('Error registrando log:', error);
      });
    }

    updateUI(state) {
      const button = document.getElementById('sandra-widget-button');
      if (!button) return;

      if (state === 'active') {
        button.style.background = '#ef4444';
        button.innerHTML = `
          <svg style="width: 2rem; height: 2rem; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;
      } else {
        button.style.background = 'linear-gradient(to bottom right, #3b82f6, #9333ea)';
        button.innerHTML = `
          <svg style="width: 2rem; height: 2rem; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span style="position: absolute; top: -0.25rem; right: -0.25rem; width: 0.75rem; height: 0.75rem; background-color: #4ade80; border-radius: 9999px; animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>
        `;
      }
    }

    getToken() {
      return window.SANDRA_TOKEN || '';
    }
  }

  // ============================================
  // INICIALIZACIÓN AUTOMÁTICA
  // ============================================

  // Prevenir múltiples inicializaciones
  if (window._sandraWidgetScriptLoaded) {
    console.warn('⚠️ Script sandra-widget.js ya cargado. Evitando duplicación.');
  } else {
    window._sandraWidgetScriptLoaded = true;
    
    if (window.sandraWidgetInstance) {
      console.warn('⚠️ SandraWidget ya está inicializado. Ignorando inicialización duplicada.');
    } else {
      const initWidget = () => {
        if (window.sandraWidgetInstance) {
          console.warn('⚠️ SandraWidget ya inicializado. Limpiando duplicados...');
          return;
        }
        
        // Limpiar duplicados
        const allContainerIds = [
          'sandra-widget-root',
          'sandra-widget-container', 
          'sandra-widget-button-container'
        ];
        
        allContainerIds.forEach(id => {
          const elements = document.querySelectorAll(`#${id}`);
          if (elements.length > 1) {
            console.warn(`⚠️ Encontrados ${elements.length} elementos con id="${id}". Eliminando duplicados...`);
            for (let i = 1; i < elements.length; i++) {
              elements[i].remove();
            }
          }
        });
        
        const allButtons = document.querySelectorAll('#sandra-widget-button');
        if (allButtons.length > 1) {
          console.warn(`⚠️ Encontrados ${allButtons.length} botones del widget. Eliminando duplicados...`);
          for (let i = 1; i < allButtons.length; i++) {
            const buttonContainer = allButtons[i].closest('div') || allButtons[i].parentElement;
            if (buttonContainer) {
              buttonContainer.remove();
            } else {
              allButtons[i].remove();
            }
          }
        }
        
        // Crear instancia única
        window.sandraWidgetInstance = new SandraWidget();
        console.log('✅ SandraWidget inicializado correctamente (instancia única)');
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
      } else {
        initWidget();
      }
    }
  }

  // Exportar para uso global
  window.SandraWidget = SandraWidget;

})(); // IIFE para evitar conflictos de scope
