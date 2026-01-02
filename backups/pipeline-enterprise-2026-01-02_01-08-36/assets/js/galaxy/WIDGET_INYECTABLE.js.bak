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



  // URL del servidor MCP (Galaxy) - por defecto el Render de GuestsValencia
  // Se puede sobreescribir desde index.html con window.MCP_SERVER_URL o vía /api/config
  const __DEFAULT_MCP_SERVER_URL__ = 'https://pwa-imbf.onrender.com';
  window.MCP_SERVER_URL = String(window.MCP_SERVER_URL || __DEFAULT_MCP_SERVER_URL__).trim().replace(/\/+$/, '');



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

      this.scriptOrigin = this.getScriptOrigin();
      this.apiOrigin = this.getApiOrigin();

      this.mcpServerUrl = this.getMcpServerUrl();

      this.chatApiUrl = this.resolveApiUrl(window.SANDRA_CHAT_API_URL, '/api/sandra/chat');

      this.transcribeApiUrl = this.resolveApiUrl(window.SANDRA_TRANSCRIBE_API_URL, '/api/sandra/transcribe');

      this.voiceApiUrl = this.resolveApiUrl(window.SANDRA_VOICE_API_URL, '/api/sandra/voice');

      this.voiceCallApiUrl = this.resolveApiUrl(window.SANDRA_VOICE_CALL_API_URL, '/api/sandra/voice-call');

      this.realtimeTokenApiUrl = this.resolveApiUrl(
        window.SANDRA_REALTIME_TOKEN_API_URL || window.SANDRA_REALTIME_TOKEN_URL,
        '/api/sandra/realtime-token'
      );

      this.chatRoleStorageKey = 'SANDRA_ROLE';

      this.isChatOpen = false;

      this.chatLocked = false;

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

      // Config remota (/api/config) para fijar MCP_SERVER_URL correcto por entorno
      this.configLoaded = false;
      this.configPromise = null;

      this.greetingPlayed = false;



      this.audioQueue = [];

      this.audioPlaybackTimer = null;

      this.isAudioPlaybackRunning = false;

      this.currentAudio = null;

      this.audioJitterMs = 300;

      // Selector de modelo/proveedor de IA
      this.selectedProvider = this.safeGetStorage('SANDRA_PROVIDER') || 'gemini'; // 'gpt4', 'gemini', 'groq'
      this.conversationHistory = []; // Historial para llamadas conversacionales

      // Conversation buffer limits - prevenir memory leaks en llamadas largas
      this.maxConversationMessages = 50; // Mantener últimos 50 mensajes
      this.maxConversationMemoryMB = 100; // Máximo 100MB de memoria para history


      this.recordingSliceMs = 5500;

      this.minRecordedBytes = 6000;

      this.recordingStopTimeout = null;

      this.recordedChunks = [];

      this.responseWatchdogTimeout = null;

      // OpenAI Realtime (WebRTC)
      this.realtimePC = null;
      this.realtimeAudio = null;

      // Reconnection Management
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectTimer = null;
      this.baseReconnectDelay = 1000; // 1s initial backoff
      this.lastReconnectReason = null;

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

        return String(window.MCP_SERVER_URL || '').trim().replace(/\/+$/, '');

      }



      const hostname = window.location.hostname;

      if (hostname === 'localhost' || hostname === '127.0.0.1') {

        return 'http://localhost:4042';

      }



      return 'https://pwa-imbf.onrender.com';

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



    // FUNCIÓN ELIMINADA: getGreetingAudioUrl()
    // Ya no se usa audio pregrabado
    getApiOrigin() {
      const explicit = String(window.SANDRA_API_ORIGIN || window.SANDRA_API_BASE_URL || '').trim();
      if (explicit) return explicit.replace(/\/+$/, '');

      const fromScript = String(this.scriptOrigin || '').trim();
      if (fromScript) return fromScript.replace(/\/+$/, '');

      return (window.location && window.location.origin) ? window.location.origin : '';
    }

    resolveApiUrl(urlOrPath, fallbackPath) {
      const value = String(urlOrPath || fallbackPath || '').trim();
      if (!value) return '';

      try {
        const base = this.apiOrigin || this.scriptOrigin || (window.location && window.location.origin) || undefined;
        return new URL(value, base).toString();
      } catch (_) {
        return value;
      }
    }

    waitForIceGatheringComplete(pc, timeoutMs = 3000) {
      try {
        if (!pc || pc.iceGatheringState === 'complete') return Promise.resolve();
      } catch (_) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        let settled = false;
        let timeout = null;

        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
          try { pc.removeEventListener('icegatheringstatechange', onState); } catch (_) {}
          try { pc.removeEventListener('icecandidate', onCandidate); } catch (_) {}
        };

        const done = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };

        const onState = () => {
          try {
            if (pc.iceGatheringState === 'complete') done();
          } catch (_) {
            done();
          }
        };

        const onCandidate = (event) => {
          if (!event || !event.candidate) done();
        };

        timeout = setTimeout(done, timeoutMs);
        try { pc.addEventListener('icegatheringstatechange', onState); } catch (_) {}
        try { pc.addEventListener('icecandidate', onCandidate); } catch (_) {}
      });
    }

    getGreetingAudioUrl() {
      return null; // Audio pregrabado deshabilitado
    }

    /**
     * Tracker para monitorear latencia y telemetría de llamadas
     */
    initLatencyTracker() {
      this.latencyMetrics = {
        startTime: Date.now(),
        sessionId: this.sessionId,
        iceGatheringTime: null,
        offerCreationTime: null,
        answerReceptionTime: null,
        connectionEstablishedTime: null,
        measurements: []
      };
    }

    /**
     * Registra una medida de latencia
     */
    recordLatency(eventName, duration) {
      if (!this.latencyMetrics) return;

      this.latencyMetrics.measurements.push({
        event: eventName,
        duration: duration,
        timestamp: Date.now()
      });

      // Log console para debug
      if (duration > 500) {
        console.warn(` [LATENCY] 🔴 HIGH: ${eventName} took ${duration}ms`);
      } else if (duration > 200) {
        console.warn(` [LATENCY] 🟡 MEDIUM: ${eventName} took ${duration}ms`);
      } else {
        console.log(` [LATENCY] 🟢 GOOD: ${eventName} took ${duration}ms`);
      }

      // Enviar a backend cada 10 mediciones
      if (this.latencyMetrics.measurements.length % 10 === 0) {
        this.sendLatencyMetricsToBackend();
      }
    }

    /**
     * Envía métricas de latencia al backend para análisis
     */
    async sendLatencyMetricsToBackend() {
      try {
        if (!this.latencyMetrics || !this.latencyMetrics.measurements.length) return;

        const metricsUrl = this.apiOrigin
          ? `${this.apiOrigin}/api/sandra/metrics`
          : `${window.location.origin}/api/sandra/metrics`;

        // Cálculos de estadísticas
        const durations = this.latencyMetrics.measurements
          .filter(m => m.event === 'openai_latency')
          .map(m => m.duration);

        if (!durations.length) return;

        const stats = {
          count: durations.length,
          avg: Math.round(durations.reduce((a, b) => a + b) / durations.length),
          min: Math.min(...durations),
          max: Math.max(...durations),
          p95: this.calculatePercentile(durations, 0.95),
          p99: this.calculatePercentile(durations, 0.99)
        };

        await fetch(metricsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'realtime_latency',
            sessionId: this.latencyMetrics.sessionId,
            timestamp: new Date().toISOString(),
            metrics: stats,
            rawMeasurements: this.latencyMetrics.measurements.slice(-20) // Últimas 20
          })
        }).catch(e => console.error(' [LATENCY] Failed to send metrics:', e));

      } catch (error) {
        console.error(' [LATENCY] Error sending metrics:', error);
      }
    }

    /**
     * Calcula percentil de un array de números
     */
    calculatePercentile(arr, percentile) {
      const sorted = arr.sort((a, b) => a - b);
      const index = Math.ceil(sorted.length * percentile) - 1;
      return sorted[Math.max(0, index)];
    }

    /**
     * Agrega un mensaje al historial de conversación con límites de memoria
     */
    addToConversationHistory(role, content) {
      this.conversationHistory.push({
        role: role,
        content: content,
        timestamp: Date.now()
      });

      // FIFO cleanup - si excedemos max mensajes
      if (this.conversationHistory.length > this.maxConversationMessages) {
        const removed = this.conversationHistory.shift();
        console.log(` [HISTORY] Removed oldest message to stay within limit. History now: ${this.conversationHistory.length}/${this.maxConversationMessages}`);
      }

      // Memory pressure cleanup - si excedemos límite de memoria
      const memoryUsage = this.getConversationMemoryUsage();
      if (memoryUsage > this.maxConversationMemoryMB) {
        console.warn(` [HISTORY] ⚠️ Memory pressure detected (${memoryUsage}MB). Trimming history to last 30 messages.`);
        this.conversationHistory = this.conversationHistory.slice(-30);
      }
    }

    /**
     * Obtiene el uso de memoria del historial en MB
     */
    getConversationMemoryUsage() {
      const jsonSize = JSON.stringify(this.conversationHistory).length;
      return jsonSize / 1024 / 1024;
    }

    /**
     * Limpia el historial de conversación
     */
    clearConversationHistory() {
      const oldSize = this.conversationHistory.length;
      this.conversationHistory = [];
      console.log(` [HISTORY] Cleared ${oldSize} messages from history`);
    }

    /**
     * Intenta reconectar con exponential backoff
     * Reintenta hasta maxReconnectAttempts veces
     */
    async attemptReconnect(reason = 'unknown') {
      if (!this.isCallActive) return;

      this.lastReconnectReason = reason;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(' [REALTIME] ❌ Max reconnection attempts reached. Ending call.', reason);
        this.endCall(`reconnect_failed_${reason}`);
        return;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(
        this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
        30000 // Max 30s
      );

      this.reconnectAttempts++;

      console.warn(` [REALTIME] 🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}. Retrying in ${delay}ms. Reason: ${reason}`);

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

      this.reconnectTimer = setTimeout(async () => {
        try {
          console.log(` [REALTIME] 🔌 Attempting reconnect...`);
          await this.startRealtimeCall();
          console.log(` [REALTIME] ✅ Reconnection successful!`);
          this.reconnectAttempts = 0; // Reset on success
        } catch (error) {
          console.error(` [REALTIME] Reconnection attempt failed:`, error);
          if (this.isCallActive) {
            this.attemptReconnect(`error_${error.message}`);
          }
        }
      }, delay);
    }

    /**
     * Cargar configuración remota desde /api/config (misma origin) para fijar MCP_SERVER_URL correcto.
     * No falla si el endpoint no existe; simplemente mantiene el valor por defecto.
     */
    async loadConfigFromApi() {
      if (this.configLoaded) return;
      if (this.configPromise) return this.configPromise;

      this.configPromise = (async () => {
        try {
          const url = `${this.apiOrigin || this.scriptOrigin}/api/config`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return;

          const cfg = await res.json().catch(() => ({}));
          const mcpUrl = String(cfg?.MCP_SERVER_URL || '').trim().replace(/\/+$/, '');

          if (mcpUrl) {
            window.MCP_SERVER_URL = mcpUrl;
            this.mcpServerUrl = mcpUrl;
          }
        } catch (_) {
          // ignore
        } finally {
          this.configLoaded = true;
        }
      })();

      return this.configPromise;
    }


    async warmup() {

      try {

        await fetch(`${this.mcpServerUrl}/health`, { cache: 'no-store' });

      } catch (_) {

        // ignore warmup failures

      }

    }



    // FUNCIÓN ELIMINADA: playCallCenterRingtone()
    // Ya no se usa ringtone - Realtime WebRTC inicia directamente
    async playCallCenterRingtone() {
      // Suprimido - sin ringtone pregrabado
      return Promise.resolve();
    }
    
    /**
     * [DEPRECATED] Reproducir ringtone estilo call center (2 tonos largos → descolgar)
     * Ya no se usa - WebRTC inicia directamente
     */
    async _playCallCenterRingtone_DEPRECATED() {
      return new Promise((resolve) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // La nota musical
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        // Tono 1: 1 segundo
        oscillator.start(audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        // Silencio: 0.5 segundos
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          
          oscillator2.type = 'sine';
          oscillator2.frequency.value = 440;
          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          // Tono 2: 1 segundo
          oscillator2.start(audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
          
          // Después del segundo tono, esperar 0.3s y descolgar
          setTimeout(() => {
            // Sonido de descolgar (click suave)
            const clickOsc = audioContext.createOscillator();
            const clickGain = audioContext.createGain();
            
            clickOsc.connect(clickGain);
            clickGain.connect(audioContext.destination);
            
            clickOsc.type = 'sine';
            clickOsc.frequency.value = 800;
            clickGain.gain.setValueAtTime(0.1, audioContext.currentTime);
            clickGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            clickOsc.start(audioContext.currentTime);
            clickOsc.stop(audioContext.currentTime + 0.1);
            
            // Resolver después de 0.5s del descolgar
            setTimeout(() => {
              resolve();
            }, 500);
          }, 1000);
        }, 1500);
      });
    }

    // FUNCIÓN ELIMINADA: playGreetingOnce()
    // Ya no se usa audio pregrabado - Realtime WebRTC inicia directamente
    async playGreetingOnce() {
      // Suprimido - sin audio pregrabado ni ringtone
      return Promise.resolve();
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

      // Intentar cargar configuración de /api/config (no bloquea)
      this.loadConfigFromApi();

      this.ensureVisibility();



      if (!document.getElementById('sandra-widget-button-container')) {

        this.mountWidget();

      }



      this.attachEventListeners();



      console.log(' SandraWidget inicializado', {

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

        console.warn(' Detectados múltiples contenedores del widget. Eliminando duplicados...');

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

        console.warn(' El botón del widget ya existe. No se creará duplicado.');

        return;

      }



      container.innerHTML = `

        <div id="sandra-widget-shell" style="position: relative; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';">

          <!-- Floating Toggle -->

          <button id="sandra-widget-button" type="button" aria-label="Abrir chat de Sandra" style="width: 4rem; height: 4rem; border-radius: 9999px; background: linear-gradient(to bottom right, #2563eb, #7c3aed); box-shadow: 0 14px 30px rgba(0,0,0,0.18); cursor: pointer; display: flex !important; align-items: center; justify-content: center; position: relative; transition: transform 0.15s ease; visibility: visible !important; opacity: 1 !important; z-index: 99999; border: 2px solid rgba(255,255,255,0.2);">

            <span style="display:flex; align-items:center; justify-content:center; width: 100%; height: 100%;">

              <svg style="width: 1.75rem; height: 1.75rem; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m-6 7l-1.5-1.5A2.5 2.5 0 014 17.5V6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5H8z"/>

              </svg>

            </span>

            <span id="sandra-status-dot" style="position: absolute; top: -0.25rem; right: -0.25rem; width: 0.75rem; height: 0.75rem; background-color: #4ade80; border-radius: 9999px; animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; border: 2px solid rgba(255,255,255,0.95);"></span>

          </button>



          <!-- Chat Window -->

          <div id="sandra-chat-window" class="sandra-chat-window" aria-hidden="true">

            <div class="sandra-header">

              <div class="sandra-header-left">

                <div class="sandra-avatar">

                  <span class="sandra-avatar-letter">S</span>

                  <span class="sandra-avatar-dot"></span>

                </div>

                <div>

                  <div class="sandra-title">Sandra IA</div>

                  <div class="sandra-subtitle">Asistente Virtual 24/7</div>

                </div>

              </div>

              <button id="sandra-close-btn" type="button" class="sandra-close" aria-label="Cerrar">×</button>

            </div>



            <div class="sandra-mode">

              <span class="sandra-mode-label">Modo:</span>

              <select id="sandra-role-select" class="sandra-mode-select" aria-label="Modo Sandra">

                <option value="hospitality">Hospitality</option>

                <option value="luxury">Concierge Lujo</option>

                <option value="support">Soporte Técnico</option>

              </select>

            </div>

            <div class="sandra-mode" style="border-top: 1px solid rgba(79,70,229,0.1);">

              <span class="sandra-mode-label">Modelo:</span>

              <select id="sandra-provider-select" class="sandra-mode-select" aria-label="Proveedor de IA">

                <option value="gemini">Gemini</option>

                <option value="gpt4">GPT-4o</option>

                <option value="groq">Groq/Qwen</option>

              </select>

            </div>



            <div id="sandra-messages" class="sandra-messages" aria-live="polite" aria-relevant="additions">

              <div class="sandra-row sandra-row-bot">

                <div class="sandra-avatar sandra-avatar-small"><span class="sandra-avatar-letter">S</span></div>

                <div class="sandra-bubble sandra-bubble-bot">¡Hola! Soy Sandra. Bienvenid@ a GuestsValencia. ¿En qué puedo ayudarte hoy?</div>

              </div>

            </div>



            <div id="sandra-typing" class="sandra-typing" style="display:none;">Sandra está escribiendo…</div>



            <div class="sandra-input-wrap">

              <input id="sandra-input" class="sandra-input" type="text" placeholder="Escribe tu mensaje…" autocomplete="off" />



              <button id="sandra-call-btn" type="button" class="sandra-btn sandra-btn-call" aria-label="Iniciar llamada" title="Iniciar llamada">

                <svg class="sandra-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5.5A2.5 2.5 0 015.5 3h1A2.5 2.5 0 019 5.5v13A2.5 2.5 0 016.5 21h-1A2.5 2.5 0 013 18.5v-13zM14 7.5a3.5 3.5 0 010 7m0-7a3.5 3.5 0 013.5 3.5M14 7.5V6a4 4 0 014 4v4a4 4 0 01-4 4v-1.5" />

                </svg>

              </button>



              <button id="sandra-send-btn" type="button" class="sandra-btn sandra-btn-send" aria-label="Enviar">

                <svg class="sandra-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />

                </svg>

              </button>

            </div>

            <div class="sandra-powered">Powered by Gemini &amp; GPT-4o</div>

          </div>

        </div>

      `;



      // Agregar animación pulse si no existe

      if (!document.getElementById('sandra-widget-pulse-style')) {

        const style = document.createElement('style');

        style.id = 'sandra-widget-pulse-style';

        style.textContent = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }';

        document.head.appendChild(style);

      }



      this.injectWidgetStyles();

    }



    injectWidgetStyles() {

      if (document.getElementById('sandra-widget-ui-style')) return;



      const style = document.createElement('style');

      style.id = 'sandra-widget-ui-style';

      style.textContent = `

        #sandra-widget-button:hover { transform: scale(1.05); }

        .sandra-chat-window{

          position: absolute;

          right: 0;

          bottom: 4.75rem;

          width: 340px;

          max-width: calc(100vw - 2rem);

          height: 480px;

          max-height: calc(100vh - 8rem);

          background: #ffffff;

          border-radius: 14px;

          overflow: hidden;

          box-shadow: 0 30px 70px rgba(0,0,0,0.22);

          border: 1px solid rgba(15,23,42,0.10);

          transform: scale(.96);

          opacity: 0;

          pointer-events: none;

          visibility: hidden;

          transition: transform 160ms ease, opacity 160ms ease, visibility 160ms ease;

          z-index: 99999;

          display: flex;

          flex-direction: column;

        }

        .sandra-chat-window.sandra-open{

          transform: scale(1);

          opacity: 1;

          pointer-events: auto;

          visibility: visible;

        }

        .sandra-header{

          padding: 10px 12px;

          background: linear-gradient(90deg, #0F172A, #1E293B);

          color: #fff;

          display:flex;

          align-items:center;

          justify-content:space-between;

          gap: 10px;

        }

        .sandra-header-left{ display:flex; align-items:center; gap:10px; }

        .sandra-title{ font-weight: 800; font-size: 12px; line-height: 1.1; }

        .sandra-subtitle{ font-size: 10px; opacity: .85; margin-top: 1px; }

        .sandra-close{

          border: 0;

          background: transparent;

          color: rgba(255,255,255,0.7);

          font-size: 18px;

          line-height: 1;

          cursor: pointer;

        }

        .sandra-close:hover{ color: #fff; }

        .sandra-avatar{

          width: 32px;

          height: 32px;

          border-radius: 9999px;

          background: linear-gradient(135deg, #60a5fa, #a855f7);

          display:flex;

          align-items:center;

          justify-content:center;

          position:relative;

          flex: 0 0 auto;

        }

        .sandra-avatar-small{ width: 24px; height: 24px; }

        .sandra-avatar-letter{ font-weight: 800; font-size: 12px; color: #fff; }

        .sandra-avatar-dot{

          position:absolute;

          right: -1px;

          bottom: -1px;

          width: 10px;

          height: 10px;

          border-radius: 9999px;

          background: #4ade80;

          border: 2px solid #0F172A;

          animation: pulse 1.8s ease-in-out infinite;

        }

        .sandra-mode{

          padding: 8px 12px;

          background: #eef2ff;

          border-bottom: 1px solid rgba(79,70,229,0.15);

          display:flex;

          align-items:center;

          gap: 8px;

        }

        .sandra-mode-label{

          font-size: 10px;

          font-weight: 800;

          letter-spacing: .08em;

          text-transform: uppercase;

          color: #3730a3;

        }

        .sandra-mode-select{

          background: transparent;

          border: 0;

          font-size: 12px;

          font-weight: 700;

          color: #111827;

          outline: none;

          cursor: pointer;

        }

        .sandra-messages{

          flex: 1;

          padding: 12px;

          overflow-y: auto;

          background: #f8fafc;

          display:flex;

          flex-direction: column;

          gap: 10px;

        }

        .sandra-row{ display:flex; gap: 8px; align-items:flex-start; }

        .sandra-row-user{ justify-content:flex-end; }

        .sandra-row-bot{ justify-content:flex-start; }

        .sandra-bubble{

          max-width: 85%;

          padding: 10px 12px;

          border-radius: 14px;

          font-size: 12px;

          line-height: 1.35;

          white-space: pre-wrap;

          word-break: break-word;

        }

        .sandra-bubble-bot{

          background: #ffffff;

          border: 1px solid rgba(15,23,42,0.06);

          color: #334155;

          border-top-left-radius: 6px;

        }

        .sandra-bubble-user{

          background: #2563eb;

          color: #ffffff;

          border-top-right-radius: 6px;

        }

        .sandra-typing{

          padding: 6px 12px;

          font-size: 10px;

          color: #64748b;

          font-style: italic;

          background: #fff;

        }

        .sandra-input-wrap{

          display:flex;

          align-items:center;

          gap: 8px;

          padding: 10px 12px;

          border-top: 1px solid rgba(15,23,42,0.08);

          background: #fff;

        }

        .sandra-input{

          flex: 1;

          border: 0;

          outline: none;

          background: #f1f5f9;

          border-radius: 9999px;

          padding: 10px 12px;

          font-size: 12px;

        }

        .sandra-input:disabled{ opacity: .65; cursor: not-allowed; }

        .sandra-btn{

          width: 36px;

          height: 36px;

          border-radius: 9999px;

          border: 0;

          cursor: pointer;

          display:flex;

          align-items:center;

          justify-content:center;

        }

        .sandra-btn:disabled{ opacity: .5; cursor: not-allowed; }

        .sandra-btn-call{ background: #22c55e; color: #0b1220; }

        .sandra-btn-call:hover{ filter: brightness(0.95); }

        .sandra-btn-send{ background: #2563eb; color: #fff; box-shadow: 0 10px 20px rgba(37,99,235,0.22); }

        .sandra-btn-send:hover{ filter: brightness(0.95); }

        .sandra-icon{ width: 18px; height: 18px; }

        .sandra-powered{

          padding: 6px 12px 10px;

          font-size: 9px;

          color: #94a3b8;

          text-align: center;

          background: #fff;

        }

      `;

      document.head.appendChild(style);

    }



    safeGetStorage(key) {

      try {

        return (window.localStorage && window.localStorage.getItem(key)) || '';

      } catch (_) {

        return '';

      }

    }



    safeSetStorage(key, value) {

      try {

        if (window.localStorage) window.localStorage.setItem(key, String(value));

      } catch (_) {

        // ignore

      }

    }



    toggleChat(forceState) {

      const chatWindow = document.getElementById('sandra-chat-window');

      if (!chatWindow) return;



      const shouldOpen =

        typeof forceState === 'boolean'

          ? forceState

          : !chatWindow.classList.contains('sandra-open');



      this.isChatOpen = shouldOpen;

      chatWindow.classList.toggle('sandra-open', shouldOpen);

      chatWindow.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');



      if (shouldOpen) {

        setTimeout(() => document.getElementById('sandra-input')?.focus?.(), 50);

      }

    }



    setChatLocked(locked) {

      this.chatLocked = Boolean(locked);

      const input = document.getElementById('sandra-input');

      const sendBtn = document.getElementById('sandra-send-btn');

      if (input) {

        input.disabled = this.chatLocked;

        input.setAttribute('placeholder', this.chatLocked ? 'Llamada activa…' : 'Escribe tu mensaje…');

      }

      if (sendBtn) sendBtn.disabled = this.chatLocked;

    }



    showTyping(show) {

      const typing = document.getElementById('sandra-typing');

      if (!typing) return;

      typing.style.display = show ? 'block' : 'none';

    }



    addChatMessage(text, type = 'bot') {

      const container = document.getElementById('sandra-messages');

      if (!container) return;



      const row = document.createElement('div');

      row.className = `sandra-row ${type === 'user' ? 'sandra-row-user' : 'sandra-row-bot'}`;



      if (type !== 'user') {

        const avatar = document.createElement('div');

        avatar.className = 'sandra-avatar sandra-avatar-small';

        const letter = document.createElement('span');

        letter.className = 'sandra-avatar-letter';

        letter.textContent = 'S';

        avatar.appendChild(letter);

        row.appendChild(avatar);

      }



      const bubble = document.createElement('div');

      bubble.className = `sandra-bubble ${type === 'user' ? 'sandra-bubble-user' : 'sandra-bubble-bot'}`;

      bubble.textContent = String(text || '');

      row.appendChild(bubble);



      container.appendChild(row);

      container.scrollTop = container.scrollHeight;

    }



    getSelectedRole() {

      const roleSelect = document.getElementById('sandra-role-select');

      const selected = String(roleSelect?.value || '').trim();

      if (selected) return selected;

      return this.safeGetStorage(this.chatRoleStorageKey) || 'hospitality';

    }



    async sendChatMessage(text) {

      const payload = {

        message: String(text || '').trim(),

        role: this.getSelectedRole(),

        provider: this.selectedProvider || 'gpt4' // Usar proveedor seleccionado para chat también

      };



      const response = await fetch(this.chatApiUrl, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

      });



      const data = await response.json().catch(() => ({}));

      if (!response.ok) {

        const message = data?.error ? String(data.error) : `HTTP ${response.status}`;

        throw new Error(message);

      }



      const reply = data?.reply;

      if (!reply) throw new Error('Respuesta vacía del servidor');

      return String(reply);

    }



    async transcribeAudioBase64(base64Audio, mimeType = 'audio/webm') {

      const payload = {

        audio: String(base64Audio || ''),

        mimeType: String(mimeType || 'audio/webm')

      };



      const response = await fetch(this.transcribeApiUrl, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

      });



      const data = await response.json().catch(() => ({}));

      if (!response.ok) {

        const message = data?.error ? String(data.error) : `HTTP ${response.status}`;

        throw new Error(message);

      }



      return String(data?.text || data?.transcript || '').trim();

    }



    async generateVoiceAudio(text) {

      const payload = { text: String(text || '') };



      const response = await fetch(this.voiceApiUrl, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

      });



      const data = await response.json().catch(() => ({}));

      if (!response.ok) {

        const message = data?.error ? String(data.error) : `HTTP ${response.status}`;

        throw new Error(message);

      }



      const audio = data?.audioContent || data?.audio || data?.audioBase64;

      if (!audio) throw new Error('Audio vacío del servidor');

      return String(audio);

    }



    async handleChatSend() {

      if (this.chatLocked) return;

      const input = document.getElementById('sandra-input');

      const text = String(input?.value || '').trim();

      if (!text) return;



      this.addChatMessage(text, 'user');

      if (input) input.value = '';

      this.showTyping(true);



      try {

        const reply = await this.sendChatMessage(text);

        this.showTyping(false);

        this.addChatMessage(reply, 'bot');

        this.emitSandraMessage(reply);

      } catch (error) {

        this.showTyping(false);

        this.addChatMessage('Lo siento, tuve un problema de conexión. Inténtalo de nuevo.', 'bot');

        console.error('[SandraWidget] Chat error:', error);

      }

    }



    emitSandraMessage(message) {

      try {

        window.dispatchEvent(new CustomEvent('sandra-message', { detail: { message: String(message || '') } }));

      } catch (_) {

        // ignore

      }

    }



    attachEventListeners() {

      const toggleBtn = document.getElementById('sandra-widget-button');

      const closeBtn = document.getElementById('sandra-close-btn');

      const sendBtn = document.getElementById('sandra-send-btn');

      const input = document.getElementById('sandra-input');

      const callBtn = document.getElementById('sandra-call-btn');

      const roleSelect = document.getElementById('sandra-role-select');

      const providerSelect = document.getElementById('sandra-provider-select');



      const savedRole = this.safeGetStorage(this.chatRoleStorageKey) || 'hospitality';

      if (roleSelect) roleSelect.value = savedRole;

      const savedProvider = this.safeGetStorage('SANDRA_PROVIDER') || 'gemini';

      if (providerSelect) providerSelect.value = savedProvider;

      this.selectedProvider = savedProvider;



      toggleBtn?.addEventListener('click', () => this.toggleChat());

      closeBtn?.addEventListener('click', () => this.toggleChat(false));



      const send = () => this.handleChatSend();

      sendBtn?.addEventListener('click', send);

      input?.addEventListener('keypress', (e) => {

        if (e.key === 'Enter') send();

      });



      // Botón de llamada/colgar: toggle según estado
      callBtn?.addEventListener('click', () => {
        if (this.isCallActive) {
          console.log(' [CALLFLOW] Usuario presionó botón de colgar');
          this.endCall('user_hangup');
        } else {
          console.log(' [CALLFLOW] Usuario presionó botón de llamar');
          this.startCall();
        }
      });



      roleSelect?.addEventListener('change', () => {

        const next = String(roleSelect.value || '').trim() || 'hospitality';

        this.safeSetStorage(this.chatRoleStorageKey, next);

      });

      providerSelect?.addEventListener('change', () => {

        const next = String(providerSelect.value || '').trim() || 'gemini';

        this.safeSetStorage('SANDRA_PROVIDER', next);

        this.selectedProvider = next;

        console.log(`[SandraWidget] Proveedor cambiado a: ${next}`);

      });

    }



    async startCall() {
      if (this.isCallActive) {
        console.log(' [CALLFLOW] Llamada ya activa, finalizando...');
        return this.endCall('user_hangup');
      }

      console.log(' [CALLFLOW] Iniciando llamada conversacional con WebSocket Enterprise Stream...');

      // Verificar que el cliente WebSocket esté disponible
      if (!window.websocketStreamClient) {
        console.error(' [CALLFLOW] ❌ WebSocket client no está disponible');
        this.addChatMessage('Error: Sistema de llamadas no disponible', 'bot');
        return;
      }

      const wsClient = window.websocketStreamClient;

      // Verificar conexión
      if (!wsClient.isConnected) {
        console.log(' [CALLFLOW] ⏳ Esperando conexión WebSocket...');
        let attempts = 0;
        while (!wsClient.isConnected && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!wsClient.isConnected) {
          console.error(' [CALLFLOW] ❌ No se pudo conectar al servidor WebSocket');
          this.addChatMessage('Error: No se pudo conectar al servidor', 'bot');
          return;
        }
      }

      try {
        this.toggleChat(true);
        this.callStartTime = Date.now();
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.isCallActive = true;
        this.setChatLocked(true);
        this.updateUI('active');

        // Iniciar grabación de audio con WebSocket
        console.log(' [CALLFLOW] Iniciando grabación de audio...');
        await wsClient.startListening();

        // Enviar mensaje "ready" para recibir saludo inicial
        wsClient.sendMCP('conserje', 'message', {
          type: 'ready',
          message: 'Cliente listo para recibir saludo'
        });

        this.startInactivityTimer();
        console.log(' [CALLFLOW] ✅ Llamada WebSocket iniciada correctamente');

      } catch (error) {
        console.error(' [CALLFLOW] ❌ Error iniciando llamada:', error);
        this.isCallActive = false;
        this.setChatLocked(false);
        this.addChatMessage('Error iniciando llamada: ' + error.message, 'bot');
      }
    }

    /**
     * Iniciar llamada con OpenAI Realtime API (WebRTC)
     * Conexión directa bidireccional de audio en tiempo real
     */
    async startRealtimeCall() {
      try {
        // Inicializar tracking de latencia
        this.initLatencyTracker();

        // 1. Obtener token efímero del servidor
        console.log(' [REALTIME] Obteniendo token efímero...');
        const tokenStart = Date.now();
        const tokenResponse = await fetch(this.realtimeTokenApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!tokenResponse.ok) {
          throw new Error(`Error obteniendo token: ${tokenResponse.status}`);
        }

        const { token, session_id } = await tokenResponse.json();
        this.recordLatency('token_acquisition', Date.now() - tokenStart);
        console.log(' [REALTIME] Token obtenido, sesión:', session_id);

        // 2. Obtener stream de micrófono
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000
          }
        });
        console.log(' [REALTIME] Micrófono accedido');

        // 3. Crear RTCPeerConnection con múltiples servidores STUN/TURN para mejorar NAT traversal
        const iceServers = [
          // STUN Servers (sin autenticación) - para NAT mapping
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stunserver.org:3478' },
          { urls: 'stun:stun.stunprotocol.org:3478' }
        ];

        // TURN Server (si está configurado) - para NAT restrictivo
        const turnUsername = window.SANDRA_TURN_USERNAME || process.env.REACT_APP_TURN_USERNAME;
        const turnPassword = window.SANDRA_TURN_PASSWORD || process.env.REACT_APP_TURN_PASSWORD;
        const turnServer = window.SANDRA_TURN_SERVER || process.env.REACT_APP_TURN_SERVER;

        if (turnServer && turnUsername && turnPassword) {
          iceServers.push({
            urls: [
              `turn:${turnServer}:3478?transport=udp`,
              `turn:${turnServer}:3478?transport=tcp`,
              `turns:${turnServer}:5349?transport=tcp`
            ],
            username: turnUsername,
            credential: turnPassword
          });
          console.log(' [REALTIME] TURN server configurado');
        }

        const pc = new RTCPeerConnection({
          iceServers: iceServers,
          iceCandidatePoolSize: 10,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        });

        this.realtimePC = pc;

        // 4. Agregar track de audio local
        this.stream.getTracks().forEach(track => {
          pc.addTrack(track, this.stream);
        });

        // 5. Manejar audio remoto (respuesta de Sandra)
        const remoteAudio = document.createElement('audio');
        remoteAudio.autoplay = true;
        remoteAudio.style.display = 'none';
        document.body.appendChild(remoteAudio);
        this.realtimeAudio = remoteAudio;

        pc.ontrack = (event) => {
          console.log(' [REALTIME] Audio remoto recibido');
          remoteAudio.srcObject = event.streams[0];
        };

        // 6. Crear oferta SDP
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);
        await this.waitForIceGatheringComplete(pc);
        const localSdp = (pc.localDescription && pc.localDescription.sdp) ? pc.localDescription.sdp : offer.sdp;

        // 7. Enviar oferta a OpenAI Realtime API (endpoint de llamadas WebRTC)
        console.log(' [REALTIME] Enviando oferta SDP a OpenAI...');
        const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/sdp',
            'OpenAI-Beta': 'realtime=v1'
          },
          body: localSdp
        });

        if (!sdpResponse.ok) {
          const errorText = await sdpResponse.text();
          throw new Error(`OpenAI Realtime error: ${sdpResponse.status} - ${errorText}`);
        }

        // 8. Establecer respuesta SDP
        const answerSdp = await sdpResponse.text();
        const answer = {
          type: 'answer',
          sdp: answerSdp
        };
        await pc.setRemoteDescription(answer);

        console.log(' [REALTIME] Conexión WebRTC establecida');

        // 9. Manejar eventos de conexión
        pc.oniceconnectionstatechange = () => {
          console.log(' [REALTIME] ICE state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            if (this.isCallActive) {
              console.warn(' [REALTIME] ICE connection failed - attempting reconnect');
              this.attemptReconnect('ice_failed');
            }
          } else if (pc.iceConnectionState === 'disconnected') {
            if (this.isCallActive && this.reconnectAttempts === 0) {
              console.warn(' [REALTIME] ICE disconnected - attempting reconnect');
              this.attemptReconnect('ice_disconnected');
            }
          }
        };

        pc.onconnectionstatechange = () => {
          console.log(' [REALTIME] Connection state:', pc.connectionState);
          if (pc.connectionState === 'failed') {
            if (this.isCallActive) {
              console.warn(' [REALTIME] Peer connection failed - attempting reconnect');
              this.attemptReconnect('peer_connection_failed');
            }
          } else if (pc.connectionState === 'disconnected') {
            if (this.isCallActive && this.reconnectAttempts === 0) {
              console.warn(' [REALTIME] Peer connection disconnected - attempting reconnect');
              this.attemptReconnect('peer_connection_disconnected');
            }
          } else if (pc.connectionState === 'connected') {
            // Reset reconnection counter on successful connection
            this.reconnectAttempts = 0;
          }
        };

      } catch (error) {
        console.error(' [REALTIME] Error en conexión WebRTC:', error);
        throw error;
      }
    }



    async transitionToVideo() {

      // No fallar si los elementos no existen (no crítico para la llamada)
      try {
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



          console.log(' [CALLFLOW] Transición a video completada');

        }

      } catch (error) {

        console.error('Error en transición de video:', error);

      }
      
      } catch (error) {
        // Si los elementos no existen, no es crítico - solo log
        console.warn(' [CALLFLOW] Elementos de video no encontrados, continuando sin transición:', error);
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

          console.log(' [CALLFLOW] WebSocket conectado (handshake completado)');

          resolve();

        };



        this.ws.onerror = (error) => {

          clearTimeout(timeout);

          console.error(' [CALLFLOW] Error WebSocket:', error);

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

          console.log(' [CALLFLOW] WebSocket cerrado');

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



        console.log(' [CALLFLOW] Canal de voz reservado');

      } catch (error) {

        console.error('Error reservando canal:', error);

        throw error;

      }

    }



    // FUNCIÓN ELIMINADA: playWelcomeMessage()
    // Ya no se usa mensaje de bienvenida pregrabado
    async playWelcomeMessage() {
      // Suprimido - sin mensajes pregrabados
      return Promise.resolve();
    }



    async playAudioSync(audioBase64) {

      return new Promise((resolve, reject) => {

        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);

        this.currentAudio = audio;

        this.isSpeaking = true;



        if (this.currentVideo) {

          this.currentVideo.playbackRate = 1.0;

        }



        audio.onended = () => {

          this.currentAudio = null;

          this.isSpeaking = false;

          console.log(' [CALLFLOW] Audio sincronizado completado');

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

        console.error(' [CALLFLOW] No hay stream de audio para transcripción');

        return;

      }



      console.log(' [CALLFLOW] Iniciando transcripción automática (Deepgram STT)...');



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

        console.log(' [CALLFLOW] Grabación iniciada');

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



        // Usar endpoint /api/sandra/voice-call que pasa por servidor MCP
        // Siempre usar GPT-4o para llamadas conversacionales (pasa por MCP)
        console.log(` [CALLFLOW] Procesando audio a través de servidor MCP con GPT-4o...`);
        
        const mimeType = (audioBlob && audioBlob.type) ? audioBlob.type : 'audio/webm';
        
        const response = await fetch(this.voiceCallApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            provider: 'gpt4', // Siempre GPT-4o para voz (pasa por MCP)
            conversationHistory: this.conversationHistory
          })
        });

        if (!response.ok) {
          throw new Error(`Voice call API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Actualizar historial de conversación
        if (data.transcription) {
          this.conversationHistory.push({
            role: 'user',
            content: data.transcription
          });
          this.logInteraction('user', data.transcription);
          this.addChatMessage(data.transcription, 'user');
        }

        if (data.reply) {
          this.conversationHistory.push({
            role: 'assistant',
            content: data.reply
          });
          this.logInteraction('sandra', data.reply);
          this.addChatMessage(data.reply, 'bot');
          this.emitSandraMessage(data.reply);
        }

        // Reproducir audio si está disponible
        if (data.audio) {
          this.enqueueAudio(data.audio, 'mp3', { text: data.reply });
        } else {
          // Fallback: generar TTS si no viene en la respuesta
          const audio = await this.generateVoiceAudio(data.reply || '');
          if (audio) {
            this.enqueueAudio(audio, 'mp3', { text: data.reply });
          }
        }

        this.awaitingResponse = false;
        if (this.isCallActive) {
          this.startNewRecording();
        }
        
        return;

      } catch (error) {
        console.error(' [CALLFLOW] Error procesando audio:', error);
        
        // Mostrar error al usuario en el chat
        if (this.isCallActive) {
          this.addChatMessage('Lo siento, hubo un problema procesando tu mensaje. ¿Puedes repetirlo?', 'bot');
        }
        
        this.awaitingResponse = false;
        
        // Solo continuar grabando si la llamada sigue activa y no hay error crítico
        if (this.isCallActive && !error.message?.includes('API error')) {
          this.startNewRecording();
        } else if (error.message?.includes('API error')) {
          // Error de API, terminar llamada
          this.endCall('api_error');
        }
      }
    }

    // CÓDIGO ANTIGUO - Fallback HTTP alternativo (comentado por ahora)
    /*
    async sendAudioForProcessingOld(audioBlob) {
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

          this.addChatMessage(data.flow.transcript, 'user');

        }



        if (data.flow && data.flow.audio) {

          if (data.flow.response) {

            this.addChatMessage(data.flow.response, 'bot');

            this.emitSandraMessage(data.flow.response);

          }

          this.enqueueAudio(data.flow.audio, 'mp3', { text: data.flow.response });

          return;

        }



        this.awaitingResponse = false;

        this.startNewRecording();

        return;



        const reader = new FileReader();

        reader.onloadend = async () => {

          const base64Audio = reader.result.split(',')[1];



          console.log(' [CALLFLOW] Enviando audio para procesamiento (STT → LLM → TTS)...');



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

              console.log(' [CALLFLOW] Transcripción:', data.flow.transcript);

              this.logInteraction('user', data.flow.transcript);

            }



            if (data.flow.audio) {

              await this.playAudioSync(data.flow.audio);



              if (data.flow.response) {

                console.log(' [CALLFLOW] Respuesta de Sandra:', data.flow.response);

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

        console.error(' [CALLFLOW] Error procesando audio:', error);

        this.awaitingResponse = false;

        if (this.isCallActive) this.startNewRecording();

      }

    }
    */

    handleWebSocketMessage(data) {

      console.log(' [CALLFLOW] Mensaje WebSocket recibido:', data);



      if (data.route === 'audio') {

        if (data.action === 'tts' && data.payload && data.payload.audio) {

          this.enqueueAudio(data.payload.audio, data.payload.format || 'mp3', { text: data.payload.text });

          return;

        }



        if (data.action === 'stt') {

          if (data.transcript) {

            this.logInteraction('user', data.transcript);

            this.addChatMessage(data.transcript, 'user');

          }

          return;

        }

      }



      if (data.route === 'conserje') {

        if (data.action === 'message' && data.payload && data.payload.type === 'noSpeech' && data.payload.message) {

          this.addChatMessage(data.payload.message, 'bot');

          this.emitSandraMessage(data.payload.message);

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

          this.addChatMessage(data.response, 'bot');

          this.emitSandraMessage(data.response);

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



      console.log(` [CALLFLOW] Sincronización ajustada (latencia: ${latency}ms)`);

    }



    async endCall(reason = 'user') {

      if (!this.isCallActive) return;



      console.log(` [CALLFLOW] Finalizando llamada (razón: ${reason})...`);



      this.isCallActive = false;

      this.setChatLocked(false);

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

      if (this.reconnectTimer) {

        clearTimeout(this.reconnectTimer);

        this.reconnectTimer = null;

      }

      this.reconnectAttempts = 0;



      if (this.currentAudio) {

        try { this.currentAudio.pause(); } catch (_) {}

        this.currentAudio = null;

      }



      // Cerrar WebSocket Enterprise Stream
      if (window.websocketStreamClient) {
        const wsClient = window.websocketStreamClient;
        try {
          console.log(' [CALLFLOW] Cerrando WebSocket Enterprise Stream...');
          await wsClient.disconnect();
          console.log(' [CALLFLOW] ✅ WebSocket cerrado correctamente');
        } catch (err) {
          console.error(' [CALLFLOW] ❌ Error cerrando WebSocket:', err);
        }
      }

      // Limpiar MediaRecorder legacy si existe
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }



      if (this.ws && this.ws.readyState === WebSocket.OPEN) {

        try {
          this.ws.send(JSON.stringify({

            route: 'conserje',

            action: 'call_end',

            payload: {

              sessionId: this.sessionId,

              duration: Date.now() - this.callStartTime,

              reason

            }

          }));
        } catch (error) {
          console.warn(' [CALLFLOW] Error enviando mensaje de fin de llamada:', error);
        }

      }

      // Cerrar conexión WebRTC de Realtime si está activa
      if (this.realtimePC) {
        try {
          this.realtimePC.getSenders().forEach(sender => {
            if (sender.track) sender.track.stop();
          });
          this.realtimePC.getReceivers().forEach(receiver => {
            if (receiver.track) receiver.track.stop();
          });
          this.realtimePC.close();
        } catch (_) {}
        this.realtimePC = null;
      }

      // Limpiar audio remoto de Realtime
      if (this.realtimeAudio) {
        try {
          this.realtimeAudio.pause();
          this.realtimeAudio.srcObject = null;
          if (this.realtimeAudio.parentNode) {
            this.realtimeAudio.parentNode.removeChild(this.realtimeAudio);
          }
        } catch (_) {}
        this.realtimeAudio = null;
      }

      // Cerrar WebSocket si está abierto (fallback)
      if (this.ws) {
        try {
          if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
          }
        } catch (_) {}
        this.ws = null;
      }



      this.transitionToImage();

      this.logCallEnd(reason);

      this.updateUI('inactive');

      console.log(' [CALLFLOW] Llamada finalizada');

    }



    transitionToImage() {

      try {
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
      
      } catch (error) {
        // Si los elementos no existen, no es crítico - solo log
        console.warn(' [CALLFLOW] Elementos de imagen no encontrados:', error);
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

      console.error(' [CALLFLOW] Error en llamada:', error);

      // Usar endCall() para limpiar TODO correctamente (incluye Realtime)
      this.endCall('error');

      // Mensaje de error solo si no fue un cuelgue del usuario
      if (error && !error.message?.includes('user') && !error.message?.includes('cancel')) {
        this.addChatMessage('Lo siento, hubo un error al conectar. Por favor, intenta de nuevo.', 'bot');
      }
      
      console.error(' [CALLFLOW] Error detalles:', error.message || error);

    }



    logInteraction(type, content) {

      const logEntry = {

        sessionId: this.sessionId,

        type,

        content,

        timestamp: new Date().toISOString(),

        elapsed: Date.now() - this.callStartTime

      };



      console.log(` [CALLFLOW] Log:`, logEntry);



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



      console.log(` [CALLFLOW] Log final de llamada:`, callLog);



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

      const callBtn = document.getElementById('sandra-call-btn');

      const dot = document.getElementById('sandra-status-dot');



      if (dot) {

        dot.style.backgroundColor = state === 'active' ? '#ef4444' : '#4ade80';

      }



      if (!callBtn) return;



      if (state === 'active') {

        callBtn.style.background = '#ef4444';

        callBtn.setAttribute('aria-label', 'Finalizar llamada');

        callBtn.setAttribute('title', 'Finalizar llamada');

        callBtn.innerHTML = `

          <svg class="sandra-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />

          </svg>

        `;

      } else {

        callBtn.style.background = '#22c55e';

        callBtn.setAttribute('aria-label', 'Iniciar llamada');

        callBtn.setAttribute('title', 'Iniciar llamada');

        callBtn.innerHTML = `

          <svg class="sandra-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5.5A2.5 2.5 0 015.5 3h1A2.5 2.5 0 019 5.5v13A2.5 2.5 0 016.5 21h-1A2.5 2.5 0 013 18.5v-13zM14 7.5a3.5 3.5 0 010 7m0-7a3.5 3.5 0 013.5 3.5M14 7.5V6a4 4 0 014 4v4a4 4 0 01-4 4v-1.5" />

          </svg>

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

    console.warn(' Script sandra-widget.js ya cargado. Evitando duplicación.');

  } else {

    window._sandraWidgetScriptLoaded = true;



    if (window.sandraWidgetInstance) {

      console.warn(' SandraWidget ya está inicializado. Ignorando inicialización duplicada.');

    } else {

      const initWidget = () => {

        if (window.sandraWidgetInstance) {

          console.warn(' SandraWidget ya inicializado. Limpiando duplicados...');

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

            console.warn(` Encontrados ${elements.length} elementos con id="${id}". Eliminando duplicados...`);

            for (let i = 1; i < elements.length; i++) {

              elements[i].remove();

            }

          }

        });



        const allButtons = document.querySelectorAll('#sandra-widget-button');

        if (allButtons.length > 1) {

          console.warn(` Encontrados ${allButtons.length} botones del widget. Eliminando duplicados...`);

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

        console.log(' SandraWidget inicializado correctamente (instancia única)');

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

