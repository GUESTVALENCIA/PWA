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
      this.sessionId = null;
      this.callStartTime = null;
      this.inactivityTimer = null;
      this.audioContext = null;
      this.audioSource = null;
      this.currentVideo = null;
      this.currentImage = null;
      
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
        await this.transitionToVideo();
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ [CALLFLOW] Micrófono accedido');

        await this.connectWebSocketWithTimeout();
        await this.reserveVoiceChannel();
        await this.playWelcomeMessage();
        this.startTranscription();

        this.isCallActive = true;
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
          await this.playAudioSync(data.audio);
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
        this.isSpeaking = true;
        
        if (this.currentVideo) {
          this.currentVideo.playbackRate = 1.0;
        }

        audio.onended = () => {
          this.isSpeaking = false;
          console.log('✅ [CALLFLOW] Audio sincronizado completado');
          resolve();
        };
        
        audio.onerror = (error) => {
          this.isSpeaking = false;
          reject(error);
        };

        audio.play().catch(reject);
      });
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

      const audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (!this.isSpeaking && audioChunks.length > 0) {
          this.resetInactivityTimer();
          
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await this.sendAudioForProcessing(audioBlob);
        }

        if (this.isCallActive && !this.isSpeaking) {
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
              this.startNewRecording();
            }
          }, 100);
        }
      };

      this.startNewRecording();
    }

    startNewRecording() {
      if (!this.mediaRecorder || this.isSpeaking) return;

      try {
        this.mediaRecorder.start();
        console.log('🎙️ [CALLFLOW] Grabación iniciada');
      } catch (error) {
        console.error('Error iniciando grabación:', error);
      }
    }

    async sendAudioForProcessing(audioBlob) {
      try {
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

      if (data.route === 'conserje') {
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

