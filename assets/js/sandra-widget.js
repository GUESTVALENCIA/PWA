/**
 * SandraWidget - Widget conversacional de Sandra IA
 * Widget conversacional que se conecta con el servidor MCP
 * Flujo completo de llamada conversacional según CALLFLOW.md
 */

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
    
    return process.env.MCP_SERVER_URL || 'https://mcp.sandra-ia.com';
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
    
    // También asegurar que el contenedor del botón sea visible
    const buttonContainer = document.getElementById('sandra-widget-button-container');
    if (buttonContainer) {
      buttonContainer.style.setProperty('display', 'block', 'important');
      buttonContainer.style.setProperty('visibility', 'visible', 'important');
      buttonContainer.style.setProperty('opacity', '1', 'important');
    }
  }

  mountWidget() {
    // Intentar usar contenedor existente primero
    let container = document.getElementById('sandra-widget-root') || 
                    document.getElementById('sandra-widget-container') ||
                    document.getElementById('sandra-widget-button-container');
    
    if (!container) {
      // Crear nuevo contenedor si no existe
      container = document.createElement('div');
      container.id = 'sandra-widget-button-container';
      container.className = 'fixed bottom-4 right-4 z-[9999]';
      container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; z-index: 9999 !important; position: fixed !important; bottom: 1rem !important; right: 1rem !important;';
      document.body.appendChild(container);
    }
    
    // Si el contenedor existe pero está oculto, forzar visibilidad
    if (container) {
      container.style.setProperty('display', 'block', 'important');
      container.style.setProperty('visibility', 'visible', 'important');
      container.style.setProperty('opacity', '1', 'important');
      container.style.setProperty('z-index', '9999', 'important');
      container.style.setProperty('position', 'fixed', 'important');
      container.style.setProperty('bottom', '1rem', 'important');
      container.style.setProperty('right', '1rem', 'important');
    }
    
    this.createWidgetUI(container);
  }

  createWidgetUI(container) {
    container.innerHTML = `
      <div id="sandra-widget-button" class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg cursor-pointer hover:shadow-xl transition-all flex items-center justify-center group" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </div>
    `;
  }

  attachEventListeners() {
    const button = document.getElementById('sandra-widget-button');
    if (button) {
      button.addEventListener('click', () => this.startCall());
    }
  }

  // === 1. ACTIVACIÓN DEL WIDGET ===
  async startCall() {
    if (this.isCallActive) {
      return this.endCall();
    }

    console.log('📞 [CALLFLOW] Iniciando llamada conversacional con Sandra...');
    this.callStartTime = Date.now();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 1.1 Transición visual: Imagen estática → Video animado
      await this.transitionToVideo();

      // 1.2 Solicitar acceso al micrófono
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ [CALLFLOW] Micrófono accedido');

      // 1.3 Conectar WebSocket (handshake con timeout de 5s)
      await this.connectWebSocketWithTimeout();

      // 1.4 Reservar canal de voz en MCP
      await this.reserveVoiceChannel();

      // 2. INICIO DE LLAMADA - Mensaje de bienvenida
      await this.playWelcomeMessage();

      // 3. PROCESO CONVERSACIONAL - Iniciar transcripción
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

  // Transición visual: Imagen estática → Video
  async transitionToVideo() {
    const imageElement = document.getElementById('sandra-avatar-image');
    const videoElement = document.getElementById('sandra-avatar-video');
    const interfaceContainer = document.getElementById('sandra-embedded-interface');

    // Guardar referencia de imagen actual
    if (imageElement && imageElement.style.display !== 'none') {
      this.currentImage = imageElement;
    }

    // Obtener ambientación y video
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`${this.mcpServerUrl}/api/video/ambientation?timezone=${timezone}`);
      const data = await response.json();

      if (data.ambientation && data.ambientation.video) {
        // Desvanecer imagen
        if (imageElement) {
          imageElement.style.transition = 'opacity 0.5s ease-out';
          imageElement.style.opacity = '0';
        }

        // Mostrar video
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

  // === 2. PROTOCOLO DE COMUNICACIÓN (WebSocket con timeout) ===
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
      }, 5000); // Timeout de 5s

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

  // Reservar canal de voz en MCP
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

  // === 3. INICIO DE LLAMADA - Mensaje de bienvenida ===
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
        // Reproducir audio sincronizado con video
        await this.playAudioSync(data.audio);
        console.log('✅ [CALLFLOW] Mensaje de bienvenida reproducido');
      }

      // Notificar al servidor que el saludo se completó
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

  // Reproducir audio sincronizado con video
  async playAudioSync(audioBase64) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      this.isSpeaking = true;
      
      // Sincronizar con video si está disponible
      if (this.currentVideo) {
        // Ajustar velocidad de video si es necesario
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

      // Reproducir audio
      audio.play().catch(reject);
    });
  }

  // === 3. PROCESO CONVERSACIONAL - Transcripción automática ===
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
        // Resetear timer de inactividad
        this.resetInactivityTimer();
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await this.sendAudioForProcessing(audioBlob);
      }

      // Reiniciar grabación si la llamada sigue activa
      if (this.isCallActive && !this.isSpeaking) {
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.startNewRecording();
          }
        }, 100);
      }
    };

    // Iniciar grabación
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

  // === 4. PROCESO CONVERSACIONAL - Enviar audio para procesamiento ===
  async sendAudioForProcessing(audioBlob) {
    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        console.log('📤 [CALLFLOW] Enviando audio para procesamiento (STT → LLM → TTS)...');
        
        // Enviar al MCP para procesamiento completo
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
          // Log de transcripción
          if (data.flow.transcript) {
            console.log('📝 [CALLFLOW] Transcripción:', data.flow.transcript);
            this.logInteraction('user', data.flow.transcript);
          }

          // Reproducir respuesta de Sandra
          if (data.flow.audio) {
            await this.playAudioSync(data.flow.audio);
            
            // Log de respuesta
            if (data.flow.response) {
              console.log('💬 [CALLFLOW] Respuesta de Sandra:', data.flow.response);
              this.logInteraction('sandra', data.flow.response);
            }
          }

          // Notificar al servidor que la interacción se completó
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
      // Procesar mensajes del conserje
      if (data.response) {
        // Respuesta de texto desde WebSocket
        this.handleTextResponse(data.response);
      }
    } else if (data.route === 'sync') {
      // Sincronización audiovisual
      if (data.sync) {
        this.syncAudioVideo(data.sync);
      }
    }
  }

  handleTextResponse(response) {
    // Si recibimos respuesta de texto, convertir a TTS
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        route: 'audio',
        action: 'tts',
        payload: { text: response, sessionId: this.sessionId }
      }));
    }
  }

  // === 5. SINCRONIZACIÓN AUDIOVISUAL ===
  syncAudioVideo(syncData) {
    if (!syncData || !this.currentVideo) return;

    // Ajustar latencia automática desde el MCP
    const latency = syncData.latency || 0;
    
    if (this.currentVideo) {
      // Ajustar velocidad de reproducción para sincronización
      if (latency > 700) {
        this.currentVideo.playbackRate = 0.95; // Ralentizar ligeramente
      } else if (latency < 300) {
        this.currentVideo.playbackRate = 1.05; // Acelerar ligeramente
      } else {
        this.currentVideo.playbackRate = 1.0; // Normal
      }
    }

    console.log(`🎬 [CALLFLOW] Sincronización ajustada (latencia: ${latency}ms)`);
  }

  // === 6. FINALIZACIÓN DE LLAMADA ===
  endCall(reason = 'user') {
    if (!this.isCallActive) return;

    console.log(`📞 [CALLFLOW] Finalizando llamada (razón: ${reason})...`);

    this.isCallActive = false;
    this.clearInactivityTimer();

    // Detener grabación
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Cerrar stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Cerrar WebSocket
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

    // Transición visual: Video → Imagen estática
    this.transitionToImage();

    // Log final
    this.logCallEnd(reason);

    this.updateUI('inactive');
    console.log('✅ [CALLFLOW] Llamada finalizada');
  }

  transitionToImage() {
    const imageElement = this.currentImage || document.getElementById('sandra-avatar-image');
    const videoElement = this.currentVideo || document.getElementById('sandra-avatar-video');

    // Desvanecer video
    if (videoElement) {
      videoElement.style.transition = 'opacity 0.5s ease-out';
      videoElement.style.opacity = '0';
      
      setTimeout(() => {
        videoElement.pause();
        videoElement.style.display = 'none';
      }, 500);
    }

    // Mostrar imagen estática
    if (imageElement) {
      imageElement.style.display = 'block';
      imageElement.style.opacity = '0';
      imageElement.style.transition = 'opacity 0.5s ease-in';
      
      setTimeout(() => {
        imageElement.style.opacity = '1';
      }, 100);
    }
  }

  // Timer de inactividad (90 segundos)
  startInactivityTimer() {
    this.resetInactivityTimer();
  }

  resetInactivityTimer() {
    this.clearInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      console.log('⏰ [CALLFLOW] Inactividad prolongada (90s), finalizando llamada...');
      this.endCall('inactivity');
    }, 90000); // 90 segundos
  }

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  handleCallError(error) {
    console.error('❌ [CALLFLOW] Error en llamada:', error);
    
    // Limpiar recursos
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.ws) {
      this.ws.close();
    }

    // Revertir transición visual
    this.transitionToImage();

    // Mostrar error al usuario
    alert('Error al iniciar la llamada. Por favor, intenta de nuevo.');
  }

  // === 7. LOGS Y MONITOREO ===
  logInteraction(type, content) {
    const logEntry = {
      sessionId: this.sessionId,
      type, // 'user' o 'sandra'
      content,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - this.callStartTime
    };

    console.log(`📊 [CALLFLOW] Log:`, logEntry);

    // Enviar log al servidor MCP
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

    // Registrar en servidor MCP
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
      button.classList.remove('from-blue-500', 'to-purple-600');
      button.classList.add('bg-red-500');
      button.innerHTML = `
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;
    } else {
      button.classList.remove('bg-red-500');
      button.classList.add('from-blue-500', 'to-purple-600');
      button.innerHTML = `
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      `;
    }
  }

  getToken() {
    return window.SANDRA_TOKEN || '';
  }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.sandraWidgetInstance) {
      window.sandraWidgetInstance = new SandraWidget();
    }
  });
} else {
  if (!window.sandraWidgetInstance) {
    window.sandraWidgetInstance = new SandraWidget();
  }
}

// Exportar para uso global
window.SandraWidget = SandraWidget;
