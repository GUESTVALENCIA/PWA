/**
 * Sandra IA - Widget inyectable (Chat + Llamada)
 *
 * Configuracion opcional:
 * - window.MCP_SERVER_URL (default: https://mcp.sandra-ia.com)
 * - window.WIDGET_ENABLED (default: true)
 * - window.SANDRA_TOKEN (default: '')
 * - window.SANDRA_CHAT_API_URL (default: /api/sandra/chat)
 * - window.SANDRA_TRANSCRIBE_API_URL (default: /api/sandra/transcribe)
 * - window.SANDRA_VOICE_API_URL (default: /api/sandra/voice)
 */

(function () {
  'use strict';

  const DEFAULT_MCP_SERVER_URL = 'https://mcp.sandra-ia.com';

  window.MCP_SERVER_URL = window.MCP_SERVER_URL || DEFAULT_MCP_SERVER_URL;
  window.WIDGET_ENABLED = window.WIDGET_ENABLED !== false;
  window.SANDRA_TOKEN = window.SANDRA_TOKEN || '';

  class SandraWidget {
    constructor() {
      this.isEnabled = this.checkEnabled();
      this.mcpServerUrl = this.getMcpServerUrl();

      this.chatApiUrl = window.SANDRA_CHAT_API_URL || '/api/sandra/chat';
      this.transcribeApiUrl = window.SANDRA_TRANSCRIBE_API_URL || '/api/sandra/transcribe';
      this.voiceApiUrl = window.SANDRA_VOICE_API_URL || '/api/sandra/voice';
      this.chatRoleStorageKey = 'SANDRA_ROLE';

      this.isChatOpen = false;
      this.chatLocked = false;

      this.isCallActive = false;
      this.ws = null;
      this.mediaRecorder = null;
      this.stream = null;
      this.awaitingResponse = false;
      this.sessionId = null;
      this.callStartTime = null;
      this.inactivityTimer = null;

      this.audioQueue = [];
      this.isAudioPlaybackRunning = false;
      this.currentAudio = null;
      this.audioPlaybackTimer = null;
      this.audioJitterMs = 250;

      this.recordingSliceMs = 5500;
      this.minRecordedBytes = 6000;
      this.recordingStopTimeout = null;
      this.recordedChunks = [];
      this.responseWatchdogTimeout = null;

      this.currentVideo = null;
      this.currentImage = null;

      this.scriptOrigin = this.getScriptOrigin();
      this.greetingPlayed = false;

      if (this.isEnabled) this.init();
    }

    checkEnabled() {
      if (typeof window === 'undefined') return true;
      if (window.WIDGET_ENABLED === false) return false;
      if (document.querySelector('[data-widget-disabled]')) return false;
      return true;
    }

    getMcpServerUrl() {
      if (typeof window !== 'undefined' && window.MCP_SERVER_URL) {
        return String(window.MCP_SERVER_URL).trim() || DEFAULT_MCP_SERVER_URL;
      }
      return DEFAULT_MCP_SERVER_URL;
    }

    getToken() {
      return window.SANDRA_TOKEN || '';
    }

    getScriptOrigin() {
      try {
        const directSrc = document.currentScript && document.currentScript.src;
        const scriptSrc =
          directSrc ||
          Array.from(document.scripts || [])
            .map((s) => (s ? s.src : ''))
            .filter(Boolean)
            .find((src) => src.includes('WIDGET_INYECTABLE')) ||
          '';

        if (scriptSrc) return new URL(scriptSrc).origin;
      } catch (_) {
        // ignore
      }
      return window.location && window.location.origin ? window.location.origin : '';
    }

    init() {
      const container = this.ensureContainer();
      this.injectStyles();
      this.render(container);
      this.bindEvents();
      this.setChatLocked(false);
      this.updateUI();
    }

    ensureContainer() {
      const ids = ['sandra-widget-root', 'sandra-widget-container', 'sandra-widget-button-container'];
      ids.forEach((id) => {
        const nodes = document.querySelectorAll(`#${id}`);
        if (nodes.length > 1) {
          for (let i = 1; i < nodes.length; i++) nodes[i].remove();
        }
      });

      let container =
        document.getElementById('sandra-widget-button-container') ||
        document.getElementById('sandra-widget-root') ||
        document.getElementById('sandra-widget-container');

      if (!container) {
        container = document.createElement('div');
        container.id = 'sandra-widget-root';
        document.body.appendChild(container);
      }

      container.classList.remove('hidden');
      container.style.setProperty('position', 'fixed', 'important');
      container.style.setProperty('bottom', '1rem', 'important');
      container.style.setProperty('right', '1rem', 'important');
      container.style.setProperty('z-index', '99999', 'important');
      container.style.setProperty('display', 'block', 'important');
      container.style.setProperty('visibility', 'visible', 'important');
      container.style.setProperty('opacity', '1', 'important');
      container.style.setProperty('pointer-events', 'auto', 'important');

      return container;
    }

    injectStyles() {
      if (document.getElementById('sandra-widget-css')) return;

      const style = document.createElement('style');
      style.id = 'sandra-widget-css';
      style.textContent = `
@keyframes sandraPulse{0%,100%{opacity:1}50%{opacity:.5}}
#sandra-widget-root{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
#sandra-widget-root .sandra-fab{width:56px;height:56px;border-radius:9999px;border:0;background:linear-gradient(135deg,#3b82f6,#9333ea);box-shadow:0 10px 18px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:transform 120ms ease;padding:0}
#sandra-widget-root .sandra-fab:hover{transform:scale(1.04)}
#sandra-widget-root .sandra-status{position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:9999px;border:2px solid rgba(255,255,255,.95);background:#22c55e;animation:sandraPulse 2s cubic-bezier(.4,0,.6,1) infinite}
#sandra-widget-root .sandra-status.call{background:#ef4444}
#sandra-widget-root .sandra-chat{position:absolute;bottom:68px;right:0;width:320px;height:450px;background:#fff;border-radius:14px;box-shadow:0 18px 40px rgba(2,6,23,.25);border:1px solid rgba(15,23,42,.12);overflow:hidden;display:none;flex-direction:column}
#sandra-widget-root .sandra-chat.open{display:flex}
#sandra-widget-root .sandra-header{padding:10px 12px;background:linear-gradient(90deg,#0f172a,#1e293b);color:#fff;display:flex;align-items:center;justify-content:space-between}
#sandra-widget-root .sandra-header .left{display:flex;align-items:center;gap:10px}
#sandra-widget-root .sandra-avatar{width:34px;height:34px;border-radius:9999px;background:linear-gradient(135deg,#60a5fa,#a78bfa);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
#sandra-widget-root .sandra-title{line-height:1.1}
#sandra-widget-root .sandra-name{font-weight:800;font-size:12px}
#sandra-widget-root .sandra-sub{font-size:10px;color:rgba(191,219,254,.95)}
#sandra-widget-root .sandra-close{background:transparent;border:0;color:rgba(255,255,255,.75);font-size:20px;line-height:1;cursor:pointer;padding:0 6px}
#sandra-widget-root .sandra-role{background:#eef2ff;padding:6px 10px;border-bottom:1px solid #e0e7ff;display:flex;align-items:center;gap:8px}
#sandra-widget-root .sandra-role label{font-size:10px;font-weight:800;color:#312e81;text-transform:uppercase;letter-spacing:.08em}
#sandra-widget-root .sandra-role select{flex:1;background:transparent;border:0;outline:none;font-size:12px;font-weight:700;color:#1e1b4b;cursor:pointer}
#sandra-widget-root .sandra-messages{flex:1;overflow-y:auto;padding:12px;background:#f8fafc}
#sandra-widget-root .sandra-typing{display:none;padding:6px 12px;font-size:11px;color:#64748b;font-style:italic}
#sandra-widget-root .sandra-typing.show{display:block}
#sandra-widget-root .sandra-inputbar{padding:10px;background:#fff;border-top:1px solid #e2e8f0}
#sandra-widget-root .sandra-row{display:flex;align-items:center;gap:8px}
#sandra-widget-root .sandra-input{flex:1;border:1px solid #e2e8f0;background:#f1f5f9;border-radius:9999px;padding:10px 12px;font-size:12px;outline:none}
#sandra-widget-root .sandra-btn{width:36px;height:36px;border-radius:9999px;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer}
#sandra-widget-root .sandra-btn:disabled{cursor:not-allowed;opacity:.6}
#sandra-widget-root .sandra-btn.mic{background:#e2e8f0;color:#334155}
#sandra-widget-root .sandra-btn.mic.muted{background:#f59e0b;color:#fff}
#sandra-widget-root .sandra-btn.call{background:#22c55e;color:#fff}
#sandra-widget-root .sandra-btn.call.active{background:#ef4444}
#sandra-widget-root .sandra-btn.send{background:#2563eb;color:#fff;box-shadow:0 8px 16px rgba(37,99,235,.25)}
#sandra-widget-root .sandra-footer{margin-top:6px;font-size:9px;text-align:center;color:#94a3b8}
#sandra-widget-root .msg{display:flex;gap:8px;margin:0 0 10px 0}
#sandra-widget-root .msg.user{justify-content:flex-end}
#sandra-widget-root .avatar{width:24px;height:24px;border-radius:9999px;background:linear-gradient(135deg,#60a5fa,#a78bfa);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#fff;flex-shrink:0}
#sandra-widget-root .bubble{max-width:85%;padding:10px 12px;border-radius:12px 12px 12px 4px;background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.08);box-shadow:0 1px 2px rgba(0,0,0,.04);font-size:12px;line-height:1.35;white-space:pre-wrap}
#sandra-widget-root .msg.user .bubble{border-radius:12px 12px 4px 12px;background:#2563eb;color:#fff;border:none}
      `.trim();
      document.head.appendChild(style);
    }

    render(container) {
      if (container.querySelector('#sandra-widget-button')) return;

      container.innerHTML = `
        <div style="position:relative;width:56px;height:56px;">
          <button id="sandra-widget-button" class="sandra-fab" type="button" aria-label="Abrir chat con Sandra">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"></path>
              <path d="M8 9h8M8 13h5"></path>
            </svg>
            <span id="sandra-status-dot" class="sandra-status"></span>
          </button>

          <div id="sandra-chat-window" class="sandra-chat" role="dialog" aria-label="Chat de Sandra">
            <div class="sandra-header">
              <div class="left">
                <div class="sandra-avatar">S</div>
                <div class="sandra-title">
                  <div class="sandra-name">Sandra IA</div>
                  <div class="sandra-sub">Asistente Virtual 24/7</div>
                </div>
              </div>
              <button id="sandra-chat-close" class="sandra-close" type="button" aria-label="Cerrar chat">×</button>
            </div>

            <div class="sandra-role">
              <label>Modo:</label>
              <select id="sandra-role-select">
                <option value="hospitality">Hospitality</option>
                <option value="luxury">Concierge Lujo</option>
                <option value="support">Soporte Tecnico</option>
              </select>
            </div>

            <div id="sandra-messages" class="sandra-messages"></div>
            <div id="sandra-typing" class="sandra-typing">Sandra esta escribiendo...</div>

            <div class="sandra-inputbar">
              <div class="sandra-row">
                <input id="sandra-input" class="sandra-input" type="text" placeholder="Escribe tu mensaje..." />

                <button id="sandra-mic-btn" class="sandra-btn mic" type="button" aria-label="Silenciar microfono" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 1a3 3 0 013 3v8a3 3 0 11-6 0V4a3 3 0 013-3z"></path>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"></path>
                    <path d="M12 19v4m-4 0h8"></path>
                  </svg>
                </button>

                <button id="sandra-call-btn" class="sandra-btn call" type="button" aria-label="Iniciar llamada">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 6.5C2 5.12 3.12 4 4.5 4h1.1c.66 0 1.24.4 1.46 1.02l.9 2.56c.18.52.04 1.1-.36 1.48l-1.1 1.1a14.6 14.6 0 006.44 6.44l1.1-1.1c.38-.4.96-.54 1.48-.36l2.56.9c.62.22 1.02.8 1.02 1.46v1.1c0 1.38-1.12 2.5-2.5 2.5H18C9.16 22 2 14.84 2 6v.5z"></path>
                  </svg>
                </button>

                <button id="sandra-send-btn" class="sandra-btn send" type="button" aria-label="Enviar mensaje">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0V11"></path>
                  </svg>
                </button>
              </div>
              <div class="sandra-footer">Powered by Sandra IA</div>
            </div>
          </div>
        </div>
      `;

      const roleSelect = document.getElementById('sandra-role-select');
      if (roleSelect) roleSelect.value = this.getSelectedRole();

      const messages = document.getElementById('sandra-messages');
      if (messages && messages.childElementCount === 0) {
        this.appendChatMessage('sandra', 'Hola! Soy Sandra. Bienvenido/a a GuestsValencia. En que puedo ayudarte hoy?');
      }
    }

    bindEvents() {
      const toggleBtn = document.getElementById('sandra-widget-button');
      const closeBtn = document.getElementById('sandra-chat-close');
      const sendBtn = document.getElementById('sandra-send-btn');
      const input = document.getElementById('sandra-input');
      const callBtn = document.getElementById('sandra-call-btn');
      const micBtn = document.getElementById('sandra-mic-btn');
      const roleSelect = document.getElementById('sandra-role-select');

      if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleChat());
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
      if (sendBtn) sendBtn.addEventListener('click', () => this.sendChatMessage());

      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.sendChatMessage();
        });
      }

      if (callBtn) callBtn.addEventListener('click', () => this.startCall());
      if (micBtn) micBtn.addEventListener('click', () => (this.isCallActive ? this.toggleMicMute() : null));
      if (roleSelect) roleSelect.addEventListener('change', () => this.persistRole(roleSelect.value));
    }

    toggleChat(force) {
      const next = typeof force === 'boolean' ? force : !this.isChatOpen;
      this.isChatOpen = next;

      const chatWindow = document.getElementById('sandra-chat-window');
      if (!chatWindow) return;

      chatWindow.classList.toggle('open', next);

      if (next) {
        const input = document.getElementById('sandra-input');
        if (input && !this.chatLocked) setTimeout(() => input.focus(), 0);
      }
    }

    openChat() {
      this.toggleChat(true);
    }

    closeChat() {
      this.toggleChat(false);
    }

    setChatLocked(locked) {
      this.chatLocked = !!locked;

      const input = document.getElementById('sandra-input');
      const sendBtn = document.getElementById('sandra-send-btn');
      const roleSelect = document.getElementById('sandra-role-select');

      if (input) {
        input.disabled = this.chatLocked;
        input.placeholder = this.chatLocked ? 'Llamada activa... (usa tu voz)' : 'Escribe tu mensaje...';
      }
      if (sendBtn) sendBtn.disabled = this.chatLocked;
      if (roleSelect) roleSelect.disabled = this.chatLocked;
    }

    getSelectedRole() {
      try {
        const saved = localStorage.getItem(this.chatRoleStorageKey);
        if (saved) return saved;
      } catch (_) {
        // ignore
      }
      return 'hospitality';
    }

    persistRole(role) {
      const allowed = ['hospitality', 'luxury', 'support'];
      const next = allowed.includes(role) ? role : 'hospitality';
      try {
        localStorage.setItem(this.chatRoleStorageKey, next);
      } catch (_) {
        // ignore
      }
    }

    appendChatMessage(type, text) {
      if (!text) return;
      const messages = document.getElementById('sandra-messages');
      if (!messages) return;

      const safeText = String(text);
      const isUser = type === 'user';

      const row = document.createElement('div');
      row.className = `msg${isUser ? ' user' : ''}`;

      if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = 'S';
        row.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = safeText;
      row.appendChild(bubble);

      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
    }

    setTyping(show) {
      const typing = document.getElementById('sandra-typing');
      if (!typing) return;
      typing.classList.toggle('show', !!show);
    }

    dispatchSandraMessage(message) {
      try {
        window.dispatchEvent(new CustomEvent('sandra-message', { detail: { message } }));
      } catch (_) {
        // ignore
      }
    }

    async sendChatMessage() {
      if (this.chatLocked) return;

      const input = document.getElementById('sandra-input');
      if (!input) return;
      const text = String(input.value || '').trim();
      if (!text) return;

      input.value = '';
      this.appendChatMessage('user', text);
      this.setTyping(true);

      const roleSelect = document.getElementById('sandra-role-select');
      const role = roleSelect && roleSelect.value ? roleSelect.value : this.getSelectedRole();
      this.persistRole(role);

      try {
        const response = await fetch(this.chatApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, role })
        });

        const data = await response.json().catch(() => null);
        const reply = data && (data.reply || data.text || data.response) ? data.reply || data.text || data.response : '';

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        this.setTyping(false);
        if (reply) {
          this.appendChatMessage('sandra', reply);
          this.dispatchSandraMessage(reply);
        } else {
          this.appendChatMessage('sandra', 'No pude generar una respuesta ahora mismo.');
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        this.setTyping(false);
        this.appendChatMessage('sandra', 'Lo siento, tuve un problema de conexion. Intenta de nuevo.');
      }
    }

    updateUI() {
      const statusDot = document.getElementById('sandra-status-dot');
      const callBtn = document.getElementById('sandra-call-btn');
      const micBtn = document.getElementById('sandra-mic-btn');

      if (statusDot) statusDot.classList.toggle('call', this.isCallActive);
      if (callBtn) {
        callBtn.classList.toggle('active', this.isCallActive);
        callBtn.setAttribute('aria-label', this.isCallActive ? 'Finalizar llamada' : 'Iniciar llamada');
      }
      if (micBtn) micBtn.disabled = !this.isCallActive;
    }

    toggleMicMute() {
      if (!this.stream) return;
      const tracks = this.stream.getAudioTracks ? this.stream.getAudioTracks() : [];
      if (!tracks || tracks.length === 0) return;

      const nextEnabled = !tracks[0].enabled;
      tracks.forEach((t) => {
        t.enabled = nextEnabled;
      });

      const micBtn = document.getElementById('sandra-mic-btn');
      if (micBtn) micBtn.classList.toggle('muted', !nextEnabled);
    }

    async warmup() {
      try {
        await fetch(`${this.mcpServerUrl}/health`, { cache: 'no-store' });
      } catch (_) {
        // ignore
      }
    }

    getGreetingAudioUrl() {
      return `${this.scriptOrigin}/assets/audio/welcome.mp3`;
    }

    async playGreetingOnce() {
      if (this.greetingPlayed) return;
      this.greetingPlayed = true;
      try {
        await this.playAudioUrl(this.getGreetingAudioUrl());
      } catch (error) {
        console.warn('[CALLFLOW] No se pudo reproducir saludo local:', error);
        await this.playWelcomeMessage().catch(() => {});
      }
    }

    async transitionToVideo() {
      const imageElement = document.getElementById('sandra-avatar-image');
      const videoElement = document.getElementById('sandra-avatar-video');

      if (imageElement && imageElement.style.display !== 'none') this.currentImage = imageElement;

      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(`${this.mcpServerUrl}/api/video/ambientation?timezone=${encodeURIComponent(timezone)}`);
        const data = await response.json().catch(() => null);
        if (!data || !data.ambientation || !data.ambientation.video) return;

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
            videoElement.play().catch(() => {});
            this.currentVideo = videoElement;
          };
        }
      } catch (error) {
        console.error('Error en transicion de video:', error);
      }
    }

    transitionToImage() {
      const imageElement = this.currentImage || document.getElementById('sandra-avatar-image');
      const videoElement = this.currentVideo || document.getElementById('sandra-avatar-video');

      if (videoElement) {
        videoElement.style.transition = 'opacity 0.5s ease-out';
        videoElement.style.opacity = '0';
        setTimeout(() => {
          try {
            videoElement.pause();
          } catch (_) {
            // ignore
          }
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

    async connectWebSocketWithTimeout(timeoutMs = 5000) {
      return new Promise((resolve, reject) => {
        const wsUrl = String(this.mcpServerUrl).replace('http://', 'ws://').replace('https://', 'wss://');
        const token = this.getToken();
        const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

        const ws = new WebSocket(url);
        this.ws = ws;

        const timeout = setTimeout(() => {
          try {
            if (ws.readyState !== WebSocket.OPEN) ws.close();
          } catch (_) {
            // ignore
          }
          reject(new Error(`WebSocket handshake timeout (${timeoutMs}ms)`));
        }, timeoutMs);

        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
        ws.onmessage = (event) => {
          try {
            this.handleWebSocketMessage(JSON.parse(event.data));
          } catch (_) {
            // ignore
          }
        };
        ws.onclose = () => {
          if (this.isCallActive) this.endCall('ws_closed');
        };
      });
    }

    async reserveVoiceChannel() {
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
    }

    async startCall() {
      if (this.isCallActive) {
        this.endCall('user');
        return;
      }

      this.openChat();
      this.setChatLocked(true);

      this.callStartTime = Date.now();
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      try {
        const warmupPromise = this.warmup();
        const greetingPromise = this.playGreetingOnce();

        await this.transitionToVideo();
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        try {
          await this.connectWebSocketWithTimeout(5000);
        } catch (wsError) {
          console.warn('[CALLFLOW] WebSocket no disponible, continuando sin WS:', wsError);
          this.ws = null;
        }

        try {
          await this.reserveVoiceChannel();
        } catch (reserveError) {
          console.warn('[CALLFLOW] No se pudo reservar canal de voz:', reserveError);
        }

        await Promise.allSettled([warmupPromise, greetingPromise]);

        this.isCallActive = true;
        this.updateUI();
        this.startInactivityTimer();
        this.startTranscription();
      } catch (error) {
        this.handleCallError(error);
      }
    }

    endCall(reason = 'user') {
      if (!this.isCallActive) {
        this.setChatLocked(false);
        this.updateUI();
        return;
      }

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
        try {
          this.currentAudio.pause();
        } catch (_) {
          // ignore
        }
        this.currentAudio = null;
      }

      try {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
      } catch (_) {
        // ignore
      }

      if (this.stream) {
        try {
          this.stream.getTracks().forEach((track) => track.stop());
        } catch (_) {
          // ignore
        }
        this.stream = null;
      }

      if (this.ws) {
        try {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(
              JSON.stringify({
                route: 'conserje',
                action: 'call_end',
                payload: {
                  sessionId: this.sessionId,
                  duration: Date.now() - this.callStartTime,
                  reason
                }
              })
            );
          }
        } catch (_) {
          // ignore
        }

        try {
          this.ws.close();
        } catch (_) {
          // ignore
        }
        this.ws = null;
      }

      this.transitionToImage();
      this.logCallEnd(reason);
      this.setChatLocked(false);
      this.updateUI();
    }

    handleCallError(error) {
      console.error('[CALLFLOW] Error en llamada:', error);

      try {
        if (this.stream) this.stream.getTracks().forEach((track) => track.stop());
      } catch (_) {
        // ignore
      }

      try {
        if (this.ws) this.ws.close();
      } catch (_) {
        // ignore
      }

      this.stream = null;
      this.ws = null;
      this.isCallActive = false;
      this.clearInactivityTimer();
      this.transitionToImage();
      this.setChatLocked(false);
      this.updateUI();

      this.appendChatMessage('sandra', 'No pude iniciar la llamada. Revisa permisos de microfono y vuelve a intentar.');
    }

    startInactivityTimer() {
      this.resetInactivityTimer();
    }

    resetInactivityTimer() {
      this.clearInactivityTimer();
      this.inactivityTimer = setTimeout(() => {
        this.endCall('inactivity');
      }, 90000);
    }

    clearInactivityTimer() {
      if (!this.inactivityTimer) return;
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    startResponseWatchdog() {
      if (this.responseWatchdogTimeout) clearTimeout(this.responseWatchdogTimeout);
      this.responseWatchdogTimeout = setTimeout(() => {
        if (!this.isCallActive) return;
        if (!this.awaitingResponse) return;
        this.awaitingResponse = false;
        this.startNewRecording();
      }, 15000);
    }

    startTranscription() {
      if (!this.stream) return;

      let options = undefined;
      const preferred = 'audio/webm;codecs=opus';
      try {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(preferred)) {
          options = { mimeType: preferred };
        }
      } catch (_) {
        // ignore
      }

      this.mediaRecorder = options ? new MediaRecorder(this.stream, options) : new MediaRecorder(this.stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) this.recordedChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const chunks = this.recordedChunks;
        this.recordedChunks = [];

        if (!this.isCallActive) return;
        if (this.awaitingResponse || this.isAudioPlaybackRunning) return;

        if (chunks && chunks.length > 0) {
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
      if (!this.mediaRecorder) return;
      if (this.isAudioPlaybackRunning || this.awaitingResponse) return;

      try {
        this.mediaRecorder.start();
        if (this.recordingStopTimeout) clearTimeout(this.recordingStopTimeout);
        this.recordingStopTimeout = setTimeout(() => {
          try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop();
          } catch (_) {
            // ignore
          }
        }, this.recordingSliceMs);
      } catch (error) {
        console.error('Error iniciando grabacion:', error);
      }
    }

    playAudioUrl(url) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        this.currentAudio = audio;

        const cleanup = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
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

    playAudioBase64(audioBase64, format = 'mp3') {
      return new Promise((resolve, reject) => {
        const audio = new Audio(`data:audio/${format};base64,${audioBase64}`);
        this.currentAudio = audio;

        const cleanup = () => {
          if (this.currentAudio === audio) this.currentAudio = null;
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
          if (item.meta && item.meta.text) this.logInteraction('sandra', item.meta.text);
        }
      } finally {
        this.isAudioPlaybackRunning = false;
        this.awaitingResponse = false;
        if (this.isCallActive) this.startNewRecording();
      }
    }

    async playWelcomeMessage() {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(`${this.mcpServerUrl}/api/audio/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone })
        });

        const data = await response.json().catch(() => null);
        if (data && data.audio) this.enqueueAudio(data.audio, 'mp3', { text: data.text, isWelcome: true });
      } catch (error) {
        console.error('[CALLFLOW] Error en mensaje de bienvenida:', error);
      }
    }

    async sendAudioForProcessing(audioBlob) {
      try {
        const base64Audio = await this.blobToBase64(audioBlob);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              route: 'audio',
              action: 'stt',
              payload: { audio: base64Audio, context: { sessionId: this.sessionId, timezone } }
            })
          );
          return;
        }

        try {
          const response = await fetch(`${this.mcpServerUrl}/api/conserje/voice-flow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio, sessionId: this.sessionId, timezone })
          });

          if (response.ok) {
            const data = await response.json().catch(() => null);
            if (data && data.flow) {
              if (data.flow.transcript) this.logInteraction('user', data.flow.transcript);
              if (data.flow.audio) {
                this.enqueueAudio(data.flow.audio, 'mp3', { text: data.flow.response });
                return;
              }
            }
          }
        } catch (flowError) {
          console.warn('[CALLFLOW] voice-flow fallo, usando fallback:', flowError);
        }

        const transcript = await this.transcribeViaGateway(base64Audio, audioBlob.type || 'audio/webm');
        if (!transcript) {
          this.awaitingResponse = false;
          this.startNewRecording();
          return;
        }

        this.logInteraction('user', transcript);

        const reply = await this.chatViaGateway(transcript);
        if (!reply) {
          this.awaitingResponse = false;
          this.startNewRecording();
          return;
        }

        const audioBase64 = await this.voiceViaGateway(reply);
        if (audioBase64) {
          this.enqueueAudio(audioBase64, 'mp3', { text: reply });
          return;
        }

        this.logInteraction('sandra', reply);
        this.awaitingResponse = false;
        this.startNewRecording();
      } catch (error) {
        console.error('[CALLFLOW] Error procesando audio:', error);
        this.awaitingResponse = false;
        this.startNewRecording();
      }
    }

    async transcribeViaGateway(base64Audio, mimeType) {
      try {
        const response = await fetch(this.transcribeApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio, mimeType })
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) return '';
        return data && (data.text || data.transcript) ? String(data.text || data.transcript) : '';
      } catch (_) {
        return '';
      }
    }

    async chatViaGateway(message) {
      const roleSelect = document.getElementById('sandra-role-select');
      const role = roleSelect && roleSelect.value ? roleSelect.value : this.getSelectedRole();
      this.persistRole(role);

      const response = await fetch(this.chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, role })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) return '';
      return data && (data.reply || data.text || data.response) ? String(data.reply || data.text || data.response) : '';
    }

    async voiceViaGateway(text) {
      try {
        const response = await fetch(this.voiceApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) return '';
        return data && (data.audioContent || data.audio) ? String(data.audioContent || data.audio) : '';
      } catch (_) {
        return '';
      }
    }

    handleWebSocketMessage(data) {
      if (!data) return;

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
            this.ws.send(JSON.stringify({ route: 'audio', action: 'tts', payload: { text: data.payload.message } }));
          }
          return;
        }

        if (data.response) this.handleTextResponse(data.response);
      } else if (data.route === 'sync') {
        if (data.sync) this.syncAudioVideo(data.sync);
      }
    }

    handleTextResponse(response) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ route: 'audio', action: 'tts', payload: { text: response, sessionId: this.sessionId } }));
      }
    }

    syncAudioVideo(syncData) {
      if (!syncData || !this.currentVideo) return;
      const latency = syncData.latency || 0;
      if (latency > 700) this.currentVideo.playbackRate = 0.95;
      else if (latency < 300) this.currentVideo.playbackRate = 1.05;
      else this.currentVideo.playbackRate = 1.0;
    }

    logInteraction(type, content) {
      if (!content) return;

      if (type === 'user') this.appendChatMessage('user', content);
      if (type === 'sandra') {
        this.appendChatMessage('sandra', content);
        this.dispatchSandraMessage(String(content));
      }

      const logEntry = {
        sessionId: this.sessionId,
        type,
        content,
        timestamp: new Date().toISOString(),
        elapsed: this.callStartTime ? Date.now() - this.callStartTime : 0
      };

      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ route: 'system', action: 'log', payload: logEntry }));
        }
      } catch (_) {
        // ignore
      }
    }

    logCallEnd(reason) {
      if (!this.callStartTime) return;
      const callLog = {
        sessionId: this.sessionId,
        startTime: new Date(this.callStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.callStartTime,
        reason,
        timestamp: new Date().toISOString()
      };

      fetch(`${this.mcpServerUrl}/api/conserje/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'log_call', data: callLog })
      }).catch(() => {});
    }
  }

  if (window._sandraWidgetScriptLoaded) {
    console.warn('[SandraWidget] Script ya cargado. Evitando duplicacion.');
    return;
  }
  window._sandraWidgetScriptLoaded = true;

  if (window.sandraWidgetInstance) {
    console.warn('[SandraWidget] Ya inicializado. Evitando duplicacion.');
    return;
  }

  const initWidget = () => {
    if (window.sandraWidgetInstance) return;
    window.sandraWidgetInstance = new SandraWidget();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  window.SandraWidget = SandraWidget;
})();
