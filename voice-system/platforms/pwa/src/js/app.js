/**
 * PWA Realtime Voice System - Main Application Controller
 * Works on Desktop, iOS (via Safari), and Android
 * Universal client integration with responsive UI
 */

// ===== STATE MANAGEMENT =====

const AppState = {
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  currentLanguage: 'es',
  currentLLM: 'gemini',
  currentTTS: 'elevenlabs',
  clientId: null,
  serverStatus: 'offline',
  metrics: {
    latency: 0,
    messagesCount: 0,
    uptime: 0,
  },
  voiceClient: null,
};

// ===== DOM ELEMENT CACHE =====

const DOMElements = {
  // Buttons
  startCallBtn: null,
  endCallBtn: null,
  resetBtn: null,

  // Status
  statusDot: null,
  statusText: null,
  serverStatus: null,
  connectionStatus: null,
  clientId: null,

  // Conversation
  conversation: null,
  latencyDisplay: null,

  // Settings
  languageSelect: null,
  llmSelect: null,
  ttsSelect: null,

  // Audio
  visualizer: null,
  visualizerCtx: null,
  volumeBar: null,
};

// ===== INITIALIZATION =====

/**
 * Cache all DOM elements for performance
 */
function cacheDOM() {
  DOMElements.startCallBtn = document.getElementById('startCall');
  DOMElements.endCallBtn = document.getElementById('endCall');
  DOMElements.resetBtn = document.getElementById('resetBtn');

  DOMElements.statusDot = document.querySelector('.status-dot');
  DOMElements.statusText = document.querySelector('.status-text');
  DOMElements.serverStatus = document.getElementById('serverStatus');
  DOMElements.connectionStatus = document.getElementById('connectionStatus');
  DOMElements.clientId = document.getElementById('clientId');

  DOMElements.conversation = document.getElementById('conversation');
  DOMElements.latencyDisplay = document.getElementById('latencyDisplay');

  DOMElements.languageSelect = document.getElementById('languageSelect');
  DOMElements.llmSelect = document.getElementById('llmSelect');
  DOMElements.ttsSelect = document.getElementById('ttsSelect');

  DOMElements.visualizer = document.getElementById('visualizer');
  DOMElements.visualizerCtx = DOMElements.visualizer?.getContext('2d');
  DOMElements.volumeBar = document.getElementById('volumeBar');

  // Restore saved preferences from localStorage
  restorePreferences();
}

/**
 * Initialize event listeners
 */
function bindEvents() {
  // Button events
  DOMElements.startCallBtn.addEventListener('click', handleStartCall);
  DOMElements.endCallBtn.addEventListener('click', handleEndCall);
  DOMElements.resetBtn.addEventListener('click', handleReset);

  // Settings changes
  DOMElements.languageSelect.addEventListener('change', handleLanguageChange);
  DOMElements.llmSelect.addEventListener('change', handleLLMChange);
  DOMElements.ttsSelect.addEventListener('change', handleTTSChange);

  // Page visibility (pause when minimized)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Unload handler
  window.addEventListener('beforeunload', handlePageUnload);
}

/**
 * Initialize RealtimeVoiceClient and set up listeners
 */
async function initializeClient() {
  if (!window.RealtimeVoiceClient) {
    console.error('❌ RealtimeVoiceClient not found. Ensure realtime-voice-client.js is loaded.');
    showError('El cliente de voz no se cargó correctamente.');
    return;
  }

  try {
    AppState.voiceClient = new window.RealtimeVoiceClient({
      serverUrl: await getServerURL(),
      autoReconnect: true,
      debug: true,
    });

    // Client event listeners
    AppState.voiceClient.on('connected', handleClientConnected);
    AppState.voiceClient.on('disconnected', handleClientDisconnected);
    AppState.voiceClient.on('error', handleClientError);
    AppState.voiceClient.on('transcript', handleTranscript);
    AppState.voiceClient.on('response', handleResponse);
    AppState.voiceClient.on('audio', handleAudio);
    AppState.voiceClient.on('metrics', handleMetrics);
    AppState.voiceClient.on('listening', handleListeningState);
    AppState.voiceClient.on('speaking', handleSpeakingState);

    // Get initial client ID
    const config = await AppState.voiceClient.getConfig();
    AppState.clientId = config.clientId;
    updateClientInfo();

    console.log('✅ RealtimeVoiceClient initialized');
  } catch (error) {
    console.error('❌ Failed to initialize client:', error);
    showError(`Error al inicializar: ${error.message}`);
  }
}

/**
 * Dynamically determine server URL based on environment
 */
async function getServerURL() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // Check if this is a local development environment
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `${protocol}//localhost:8080`;
  }

  // Check if we're on Render or production
  if (host.includes('render.com') || host.includes('production')) {
    return `${protocol}//${host}`;
  }

  // Default: use same host
  return `${protocol}//${host}`;
}

/**
 * Application startup
 */
async function initializeApp() {
  console.log('🚀 Initializing PWA Realtime Voice System...');

  // Cache DOM elements
  cacheDOM();

  // Bind event listeners
  bindEvents();

  // Initialize voice client
  await initializeClient();

  // Initialize audio visualizer
  initializeVisualizer();

  // Setup service worker for PWA offline support
  registerServiceWorker();

  // Auto-connect to server
  autoConnect();

  console.log('✅ App initialization complete');
}

// ===== BUTTON HANDLERS =====

/**
 * Start call handler
 */
async function handleStartCall() {
  if (AppState.isListening) return;

  try {
    DOMElements.startCallBtn.disabled = true;
    addMessage('system', '🎤 Iniciando conversación...');

    // Connect if not already connected
    if (!AppState.isConnected) {
      await AppState.voiceClient.connect();
    }

    // Start listening for audio
    await AppState.voiceClient.startListening();
    AppState.isListening = true;

    // Update UI
    DOMElements.endCallBtn.disabled = false;
    DOMElements.resetBtn.disabled = false;
    updateButtonStates();

    addMessage('system', '✅ Micrófono activo. Habla cuando estés listo.');
  } catch (error) {
    console.error('❌ Failed to start call:', error);
    showError(`Error al iniciar llamada: ${error.message}`);
    DOMElements.startCallBtn.disabled = false;
  }
}

/**
 * End call handler
 */
async function handleEndCall() {
  try {
    DOMElements.endCallBtn.disabled = true;
    addMessage('system', '📴 Finalizando llamada...');

    await AppState.voiceClient.stopListening();
    AppState.isListening = false;

    // Update UI
    DOMElements.startCallBtn.disabled = false;
    updateButtonStates();

    addMessage('system', '✅ Llamada finalizada.');
  } catch (error) {
    console.error('❌ Failed to end call:', error);
    showError(`Error al finalizar: ${error.message}`);
  }
}

/**
 * Reset conversation handler
 */
async function handleReset() {
  try {
    DOMElements.resetBtn.disabled = true;
    addMessage('system', '🔄 Reiniciando conversación...');

    await AppState.voiceClient.reset();
    AppState.metrics.messagesCount = 0;

    // Clear conversation display
    DOMElements.conversation.innerHTML = '';
    addMessage('system', '✅ Conversación reiniciada.');

    DOMElements.resetBtn.disabled = false;
  } catch (error) {
    console.error('❌ Failed to reset:', error);
    showError(`Error al reiniciar: ${error.message}`);
  }
}

// ===== SETTINGS HANDLERS =====

/**
 * Language change handler
 */
async function handleLanguageChange(event) {
  const language = event.target.value;
  AppState.currentLanguage = language;
  localStorage.setItem('preferredLanguage', language);

  try {
    await AppState.voiceClient.setLanguage(language);
    addMessage('system', `🌐 Idioma cambiado a ${getLanguageName(language)}`);
  } catch (error) {
    console.error('❌ Failed to change language:', error);
    showError(`Error al cambiar idioma: ${error.message}`);
  }
}

/**
 * LLM provider change handler
 */
async function handleLLMChange(event) {
  const provider = event.target.value;
  AppState.currentLLM = provider;
  localStorage.setItem('preferredLLM', provider);

  try {
    await AppState.voiceClient.setLLMProvider(provider);
    addMessage('system', `🤖 Modelo IA cambiado a ${getProviderName(provider, 'llm')}`);
  } catch (error) {
    console.error('❌ Failed to change LLM:', error);
    showError(`Error al cambiar modelo: ${error.message}`);
  }
}

/**
 * TTS provider change handler
 */
async function handleTTSChange(event) {
  const provider = event.target.value;
  AppState.currentTTS = provider;
  localStorage.setItem('preferredTTS', provider);

  try {
    await AppState.voiceClient.setTTSProvider(provider);
    addMessage('system', `🔊 Voz cambiada a ${getProviderName(provider, 'tts')}`);
  } catch (error) {
    console.error('❌ Failed to change TTS:', error);
    showError(`Error al cambiar voz: ${error.message}`);
  }
}

// ===== CLIENT EVENT HANDLERS =====

/**
 * Handle client connected event
 */
function handleClientConnected(event) {
  AppState.isConnected = true;
  updateConnectionStatus('connected', '✅ Conectado');
  updateServerStatus('online', '🟢 En línea');
  addMessage('system', '📡 Conectado al servidor.');
}

/**
 * Handle client disconnected event
 */
function handleClientDisconnected(event) {
  AppState.isConnected = false;
  AppState.isListening = false;
  updateConnectionStatus('disconnected', '❌ Desconectado');
  updateServerStatus('offline', '🔴 Fuera de línea');
  DOMElements.startCallBtn.disabled = false;
  DOMElements.endCallBtn.disabled = true;
  updateButtonStates();
  addMessage('system', '📡 Desconectado del servidor.');
}

/**
 * Handle client error event
 */
function handleClientError(error) {
  console.error('❌ Client error:', error);
  showError(`Error: ${error.message}`);
  addMessage('system', `⚠️ Error: ${error.message}`);
}

/**
 * Handle transcript from STT
 */
function handleTranscript(transcript) {
  console.log('📝 Transcript:', transcript);
  addMessage('user', transcript);
  AppState.metrics.messagesCount++;
}

/**
 * Handle response from LLM
 */
function handleResponse(text) {
  console.log('💬 Response:', text);
  // Response is streamed, so we add to last message or create new one
  addMessage('ai', text);
}

/**
 * Handle audio data (for visualization)
 */
function handleAudio(audioData) {
  // Audio data for visualization
  updateVisualizer(audioData);
}

/**
 * Handle metrics update
 */
function handleMetrics(metrics) {
  AppState.metrics.latency = metrics.latency || 0;
  DOMElements.latencyDisplay.textContent = `Latencia: ${AppState.metrics.latency}ms`;
}

/**
 * Handle listening state change
 */
function handleListeningState(isListening) {
  AppState.isListening = isListening;
  updateButtonStates();

  if (isListening) {
    DOMElements.statusDot.classList.add('connected');
    DOMElements.statusText.textContent = 'Escuchando...';
  } else {
    DOMElements.statusDot.classList.remove('connected');
    DOMElements.statusText.textContent = 'Desconectado';
  }
}

/**
 * Handle speaking state change
 */
function handleSpeakingState(isSpeaking) {
  AppState.isSpeaking = isSpeaking;

  if (isSpeaking) {
    DOMElements.statusText.textContent = 'Reproduciendo...';
  }
}

// ===== PAGE VISIBILITY HANDLERS =====

/**
 * Handle page visibility changes (pause when minimized)
 */
function handleVisibilityChange() {
  if (document.hidden) {
    console.log('📱 App minimized, pausing...');
    if (AppState.isListening) {
      AppState.voiceClient.stopListening().catch(console.error);
    }
  } else {
    console.log('📱 App restored');
  }
}

/**
 * Handle page unload (cleanup)
 */
async function handlePageUnload() {
  if (AppState.voiceClient && AppState.isConnected) {
    await AppState.voiceClient.disconnect().catch(console.error);
  }
}

// ===== UI UPDATE FUNCTIONS =====

/**
 * Add message to conversation display
 */
function addMessage(type, content) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;

  const spanEl = document.createElement('span');
  spanEl.textContent = content;

  messageEl.appendChild(spanEl);
  DOMElements.conversation.appendChild(messageEl);

  // Scroll to bottom
  DOMElements.conversation.scrollTop = DOMElements.conversation.scrollHeight;
}

/**
 * Update connection status display
 */
function updateConnectionStatus(status, text) {
  DOMElements.connectionStatus.textContent = text;
  DOMElements.connectionStatus.className = status;
}

/**
 * Update server status display
 */
function updateServerStatus(status, text) {
  DOMElements.serverStatus.textContent = text;
  DOMElements.serverStatus.className = status;
}

/**
 * Update client info display
 */
function updateClientInfo() {
  DOMElements.clientId.textContent = AppState.clientId || '-';
}

/**
 * Update button states
 */
function updateButtonStates() {
  if (AppState.isListening) {
    DOMElements.startCallBtn.disabled = true;
    DOMElements.endCallBtn.disabled = false;
    DOMElements.resetBtn.disabled = false;
  } else if (AppState.isConnected) {
    DOMElements.startCallBtn.disabled = false;
    DOMElements.endCallBtn.disabled = true;
    DOMElements.resetBtn.disabled = true;
  } else {
    DOMElements.startCallBtn.disabled = true;
    DOMElements.endCallBtn.disabled = true;
    DOMElements.resetBtn.disabled = true;
  }
}

/**
 * Show error message to user
 */
function showError(message) {
  addMessage('system', `❌ ${message}`);
  console.error('Error:', message);
}

// ===== VISUALIZER FUNCTIONS =====

/**
 * Initialize audio visualizer
 */
function initializeVisualizer() {
  if (!DOMElements.visualizerCtx) return;

  const canvas = DOMElements.visualizer;
  const width = canvas.width;
  const height = canvas.height;
  const ctx = DOMElements.visualizerCtx;

  // Initial draw
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

/**
 * Update visualizer with audio data
 */
function updateVisualizer(audioData) {
  if (!DOMElements.visualizerCtx) return;

  const canvas = DOMElements.visualizer;
  const ctx = DOMElements.visualizerCtx;
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, width, height);

  // Draw audio waveform
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const sliceWidth = width / audioData.length;
  let x = 0;

  for (let i = 0; i < audioData.length; i++) {
    const v = audioData[i] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();

  // Update volume bar
  const average = audioData.reduce((a, b) => a + Math.abs(b), 0) / audioData.length;
  const volumePercent = (average / 128) * 100;
  updateVolumeBar(volumePercent);
}

/**
 * Update volume bar display
 */
function updateVolumeBar(percent) {
  const bar = DOMElements.volumeBar.querySelector('::after') || DOMElements.volumeBar;
  const element = DOMElements.volumeBar.querySelector(':after') || DOMElements.volumeBar;

  // Update volume using CSS custom property for style
  DOMElements.volumeBar.style.setProperty('--volume', `${Math.min(percent, 100)}%`);
}

// ===== HELPER FUNCTIONS =====

/**
 * Get language name from code
 */
function getLanguageName(code) {
  const languages = {
    es: 'Español',
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
  };
  return languages[code] || code;
}

/**
 * Get provider display name
 */
function getProviderName(provider, type) {
  if (type === 'llm') {
    const llms = {
      gemini: 'Gemini 2.0 Flash',
      claude: 'Claude 3.5 Sonnet',
      openai: 'GPT-4o-mini',
    };
    return llms[provider] || provider;
  } else if (type === 'tts') {
    const ttses = {
      elevenlabs: 'ElevenLabs',
      cartesia: 'Cartesia',
      mivoz: 'MiVoz',
    };
    return ttses[provider] || provider;
  }
  return provider;
}

/**
 * Restore saved preferences from localStorage
 */
function restorePreferences() {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  const savedLLM = localStorage.getItem('preferredLLM');
  const savedTTS = localStorage.getItem('preferredTTS');

  if (savedLanguage) {
    DOMElements.languageSelect.value = savedLanguage;
    AppState.currentLanguage = savedLanguage;
  }

  if (savedLLM) {
    DOMElements.llmSelect.value = savedLLM;
    AppState.currentLLM = savedLLM;
  }

  if (savedTTS) {
    DOMElements.ttsSelect.value = savedTTS;
    AppState.currentTTS = savedTTS;
  }
}

/**
 * Auto-connect to server on app load
 */
async function autoConnect() {
  try {
    await AppState.voiceClient.connect();
  } catch (error) {
    console.warn('⚠️ Auto-connect failed, user can manually connect:', error.message);
    addMessage('system', '⚠️ Reconectar manualmente cuando esté listo.');
  }
}

/**
 * Register Service Worker for PWA offline support
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers not supported');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('service-worker.js');
    console.log('✅ Service Worker registered:', reg);

    // Handle updates
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          console.log('🔄 New Service Worker available');
          addMessage('system', '🔄 Nueva versión disponible. Recarga para actualizar.');
        }
      });
    });
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
}

// ===== PWA INSTALLATION PROMPT =====

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('📲 App can be installed');
});

/**
 * Handle PWA installation
 */
async function installApp() {
  if (!deferredPrompt) {
    console.log('App is already installed or not installable');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;
}

// ===== APP STARTUP =====

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
window.AppState = AppState;
window.installApp = installApp;

console.log('📱 PWA Realtime Voice System loaded');
