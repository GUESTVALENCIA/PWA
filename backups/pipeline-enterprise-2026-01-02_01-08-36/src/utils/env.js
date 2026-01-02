/**
 * Utilidad para detectar el entorno actual y seleccionar claves/URLs adecuadas.
 * Compatible con Vercel, desarrollo local y entornos intermedios (staging).
 * Soporta tanto Vite (import.meta.env) como proyectos estáticos (process.env/window.location)
 */

// Detectar si estamos en navegador o Node.js
const isBrowser = typeof window !== 'undefined';

// Detectar si estamos en Vite
const isVite = typeof import !== 'undefined' && import.meta && import.meta.env;

/**
 * Obtiene el entorno actual basado en hostname y configuración
 * @returns {string} 'development' | 'staging' | 'production'
 */
export const getEnv = () => {
  // Intentar usar import.meta.env si está disponible (Vite)
  if (isVite) {
    const mode = import.meta.env.MODE || import.meta.env.NODE_ENV || 'development';
    
    // Si hay un modo explícito, usarlo
    if (mode === 'production') return 'production';
    if (mode === 'staging') return 'staging';
  }
  
  // En navegador, usar hostname
  if (isBrowser) {
    const url = window.location.hostname;
    const port = window.location.port;
    
    //  Detectar por nombre de host
    if (url.includes('localhost') || url.includes('127.0.0.1') || port === '4040' || port === '4321') {
      return 'development';
    }
    if (url.includes('staging') || url.includes('preview')) {
      return 'staging';
    }
    if (url.includes('guestsvalencia.com')) {
      return 'production';
    }
    // Vercel preview deployments (staging)
    if (url.includes('.vercel.app') && !url.includes('guestsvalencia')) {
      return 'staging';
    }
  }
  
  // En Node.js (serverless functions), usar NODE_ENV
  if (!isBrowser) {
    const mode = process.env.NODE_ENV || 'development';
    if (mode === 'production') return 'production';
    if (mode === 'staging') return 'staging';
    return 'development';
  }
  
  // Fallback por modo (Vite)
  if (isVite) {
    const mode = import.meta.env.MODE || 'development';
    if (mode === 'production') return 'production';
    if (mode === 'staging') return 'staging';
  }
  
  return 'development';
};

/**
 * Obtiene la API key para un proveedor específico según el entorno
 * @param {string} provider - 'openai' | 'gemini' | 'groq' | 'cartesia' | 'deepgram'
 * @returns {string} API key o string vacío
 */
export const getApiKeyFor = (provider) => {
  const env = getEnv();
  
  // En navegador, las API keys NO deben exponerse - se usan desde el servidor
  if (isBrowser) {
    // Si estamos en Vite, intentar usar import.meta.env (aunque no es recomendado exponer keys)
    if (isVite) {
      const viteKeys = {
        openai: import.meta.env.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '',
        gemini: import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '',
        groq: import.meta.env.GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY || ''
      };
      
      if (viteKeys[provider]) {
        console.warn(` getApiKeyFor('${provider}') exponiendo API key en cliente. No recomendado para producción.`);
        return viteKeys[provider];
      }
    }
    
    console.warn(` getApiKeyFor('${provider}') no disponible en navegador. Las API keys deben estar en el servidor.`);
    return '';
  }
  
  // En serverless functions (Node.js), usar process.env o import.meta.env (Vite SSR)
  const getKey = (key) => {
    if (isVite && import.meta.env[key]) {
      return import.meta.env[key];
    }
    return process.env[key] || '';
  };
  
  const keys = {
    openai: {
      production: getKey('OPENAI_API_KEY'),
      development: getKey('OPENAI_API_KEY'),
      staging: getKey('OPENAI_API_KEY')
    },
    gemini: {
      production: getKey('GEMINI_API_KEY'),
      development: getKey('GEMINI_API_KEY'),
      staging: getKey('GEMINI_API_KEY')
    },
    groq: {
      production: getKey('GROQ_API_KEY'),
      development: getKey('GROQ_API_KEY'),
      staging: getKey('GROQ_API_KEY')
    },
    cartesia: {
      production: getKey('CARTESIA_API_KEY'),
      development: getKey('CARTESIA_API_KEY'),
      staging: getKey('CARTESIA_API_KEY')
    },
    deepgram: {
      production: getKey('DEEPGRAM_API_KEY'),
      development: getKey('DEEPGRAM_API_KEY'),
      staging: getKey('DEEPGRAM_API_KEY')
    },
    anthropic: {
      production: getKey('ANTHROPIC_API_KEY'),
      development: getKey('ANTHROPIC_API_KEY'),
      staging: getKey('ANTHROPIC_API_KEY')
    }
  };
  
  return keys[provider]?.[env] || '';
};

/**
 * Obtiene la URL base de la API según el entorno
 * @returns {string} URL base de la API
 */
export const getBaseUrl = () => {
  const env = getEnv();
  
  if (isBrowser) {
    // En navegador, usar URL relativa o absoluta según entorno
    const url = window.location.hostname;
    const port = window.location.port;
    
    // Desarrollo local - puerto 4040 (server.js) o 4321 (Vite dev server)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      if (port === '4321') {
        return 'http://localhost:4321/api';
      }
      if (port === '4040') {
        return '/api';
      }
      // Si no hay puerto específico, usar ruta relativa
      return '/api';
    }
    
    // Producción/staging - usar ruta relativa (mismo dominio)
    return '/api';
  }
  
  // En Node.js (serverless), usar URLs absolutas
  const urls = {
    development: 'http://localhost:4321/api', // Vite dev server
    staging: 'https://pwa-sandra-staging.vercel.app/api',
    production: 'https://guestsvalencia-site.vercel.app/api' // o tu dominio real
  };
  
  return urls[env] || urls.development;
};

/**
 * Obtiene la URL del WebSocket según el entorno
 * @returns {string|null} URL del WebSocket o null si no está disponible
 */
export const getWebSocketUrl = () => {
  const env = getEnv();
  
  // Solo disponible en desarrollo local (Vercel no soporta WebSocket nativo)
  if (env === 'development') {
    return 'ws://localhost:4041';
  }
  
  // En producción/staging, WebSocket necesita solución externa
  return null;
};

/**
 * AutoSelector de IA por entorno para Sandra
 * Selecciona el modelo de IA por defecto según el entorno
 * @returns {string} Nombre del modelo ('gpt-4o' | 'gemini-pro' | 'mixtral-8x7b')
 */
export const getDefaultModel = () => {
  const env = getEnv();
  
  // Producción: GPT-4o (OpenAI) - mejor calidad, más costoso
  if (env === 'production') return 'gpt-4o';
  
  // Staging: Gemini Pro - buen balance calidad/precio
  if (env === 'staging') return 'gemini-pro';
  
  // Desarrollo: Mixtral 8x7b (Groq) - rápido y gratuito para testing
  return 'mixtral-8x7b';
};

/**
 * Obtiene información completa del modelo seleccionado
 * @returns {object} { name: string, provider: string, cost: string }
 */
export const getModelInfo = () => {
  const model = getDefaultModel();
  
  const models = {
    'gpt-4o': {
      name: 'gpt-4o',
      provider: 'openai',
      cost: 'high',
      description: 'OpenAI GPT-4o - Máxima calidad para producción'
    },
    'gemini-pro': {
      name: 'gemini-pro',
      provider: 'gemini',
      cost: 'medium',
      description: 'Google Gemini Pro - Buen balance calidad/precio'
    },
    'mixtral-8x7b': {
      name: 'mixtral-8x7b',
      provider: 'groq',
      cost: 'low',
      description: 'Groq Mixtral 8x7b - Rápido y gratuito para desarrollo'
    }
  };
  
  return models[model] || models['mixtral-8x7b'];
};

/**
 *  Función para obtener respuesta de Sandra automáticamente
 * Helper que simplifica las llamadas a la API de Sandra
 * @param {string} userMessage - Mensaje del usuario
 * @returns {Promise<string>} Respuesta de Sandra
 */
export const getSandraResponse = async (userMessage) => {
  const model = getDefaultModel();
  const baseUrl = getBaseUrl();
  
  // Construir URL de la API
  let apiUrl;
  if (isBrowser) {
    // En navegador, construir URL correcta
    if (baseUrl.endsWith('/api')) {
      apiUrl = `${baseUrl}/sandra/chat`;
    } else {
      apiUrl = `${baseUrl}/api/sandra/chat`;
    }
  } else {
    // En Node.js, usar la URL completa
    apiUrl = `${baseUrl}/api/sandra/chat`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        model: model // Enviar modelo para referencia (el servidor ya lo detecta automáticamente)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // La respuesta puede venir como 'reply' o 'response'
    return data?.reply || data?.response || '';
  } catch (err) {
    console.error(' Error al obtener respuesta de Sandra:', err);
    return 'Lo siento, ha habido un problema al procesar tu mensaje.';
  }
};

/**
 *  Integración directa con el widget Galaxy
 * Conecta automáticamente el widget Galaxy con Sandra IA
 * @param {object} widget - Instancia del widget Galaxy
 * @param {object} options - Opciones de configuración
 */
export const connectGalaxyToSandra = (widget, options = {}) => {
  if (!widget) {
    console.warn(' connectGalaxyToSandra: Widget no proporcionado');
    return;
  }

  const {
    onUserMessage = null,  // Función callback personalizada
    autoLock = true,       // Bloquear widget durante procesamiento
    showTyping = true,     // Mostrar indicador de typing
    autoSpeak = true       // Reproducir voz automáticamente
  } = options;

  // Función wrapper para manejar mensajes del usuario
  const handleUserMessage = async (userMessage) => {
    try {
      // Bloquear widget si está habilitado
      if (autoLock && typeof widget.lock === 'function') {
        widget.lock();
      }

      // Agregar mensaje del usuario
      if (typeof widget.addMessage === 'function') {
        widget.addMessage({ from: 'user', text: userMessage });
      }

      // Mostrar indicador de typing si está habilitado
      if (showTyping && typeof widget.showTyping === 'function') {
        widget.showTyping(true);
      }

      // Obtener respuesta de Sandra
      const response = await getSandraResponse(userMessage);

      // Ocultar indicador de typing
      if (showTyping && typeof widget.showTyping === 'function') {
        widget.showTyping(false);
      }

      // Agregar respuesta de Sandra
      if (typeof widget.addMessage === 'function') {
        widget.addMessage({ from: 'sandra', text: response });
      }

      // Reproducir voz automáticamente si está habilitado
      if (autoSpeak) {
        speakSandraVoice(response);
      }

      // Desbloquear widget
      if (autoLock && typeof widget.unlock === 'function') {
        widget.unlock();
      }

      // Ejecutar callback personalizado si existe
      if (onUserMessage && typeof onUserMessage === 'function') {
        onUserMessage(userMessage, response);
      }
    } catch (error) {
      console.error(' Error en connectGalaxyToSandra:', error);
      
      // Ocultar indicador de typing en caso de error
      if (showTyping && typeof widget.showTyping === 'function') {
        widget.showTyping(false);
      }

      // Mostrar mensaje de error
      if (typeof widget.addMessage === 'function') {
        widget.addMessage({ 
          from: 'sandra', 
          text: 'Lo siento, ha habido un problema al procesar tu mensaje.' 
        });
      }

      // Desbloquear widget en caso de error
      if (autoLock && typeof widget.unlock === 'function') {
        widget.unlock();
      }
    }
  };

  // Conectar eventos según la estructura del widget
  if (typeof widget.onUserMessage === 'function') {
    // Si el widget tiene método onUserMessage
    widget.onUserMessage(handleUserMessage);
  } else if (typeof widget.addEventListener === 'function') {
    // Si el widget usa eventos estándar
    widget.addEventListener('userMessage', (event) => {
      handleUserMessage(event.detail?.message || event.message);
    });
  } else if (typeof widget.on === 'function') {
    // Si el widget usa patrón de eventos tipo jQuery
    widget.on('userMessage', (userMessage) => {
      handleUserMessage(userMessage);
    });
  } else {
    // Asignar directamente al widget como propiedad
    widget.handleUserMessage = handleUserMessage;
    console.log('ℹ connectGalaxyToSandra: Función asignada como widget.handleUserMessage');
  }

  console.log(' Galaxy widget conectado con Sandra IA');
  
  return widget;
};

/**
 *  Integración con llamadas por voz a Sandra
 * Específicamente diseñada para recibir texto transcrito (STT) y devolver respuesta para TTS
 * @param {string} transcribedText - Texto transcrito del audio del usuario
 * @returns {Promise<string>} Respuesta de Sandra lista para convertir a voz
 */
export const sendVoiceToSandra = async (transcribedText) => {
  const model = getDefaultModel();
  const baseUrl = getBaseUrl();
  
  // Construir URL de la API
  let apiUrl;
  if (isBrowser) {
    if (baseUrl.endsWith('/api')) {
      apiUrl = `${baseUrl}/sandra/chat`;
    } else {
      apiUrl = `${baseUrl}/api/sandra/chat`;
    }
  } else {
    apiUrl = `${baseUrl}/api/sandra/chat`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: transcribedText,
        model: model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // La respuesta puede venir como 'reply' o 'response'
    return data?.reply || data?.response || '';
  } catch (err) {
    console.error(' Error en llamada de voz con Sandra:', err);
    return 'No he podido responder ahora. ¿Puedes repetirlo?';
  }
};

/**
 *  Convertir texto a voz con TTS dinámico según entorno
 * Usa speechSynthesis del navegador como fallback con voz calmada y clara de Sandra
 * @param {string} text - Texto a convertir a voz
 * @param {object} options - Opciones de configuración { rate, pitch, volume, lang }
 */
export const speakSandraVoice = (text, options = {}) => {
  // Verificar que estamos en navegador
  if (!isBrowser || !window.speechSynthesis) {
    console.warn(' speechSynthesis no disponible en este entorno');
    return;
  }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.warn(' speakSandraVoice: Texto vacío o inválido');
    return;
  }

  const {
    rate = 0.92,      // Ritmo calmado (0.1 - 10, default 1)
    pitch = 1,        // Tono natural (0 - 2, default 1)
    volume = 1,       // Volumen completo (0 - 1, default 1)
    lang = 'es-ES',   // Idioma español
    onStart = null,   // Callback cuando empieza a hablar
    onEnd = null,     // Callback cuando termina de hablar
    onError = null    // Callback en caso de error
  } = options;

  // Cancelar cualquier audio anterior
  window.speechSynthesis.cancel();

  // Crear utterance con configuración de Sandra
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  // Callbacks
  utterance.onstart = () => {
    console.log(' Sandra está hablando...');
    if (onStart && typeof onStart === 'function') {
      onStart();
    }
  };

  utterance.onend = () => {
    console.log(' Sandra ha terminado de hablar');
    if (onEnd && typeof onEnd === 'function') {
      onEnd();
    }
  };

  utterance.onerror = (e) => {
    console.error(' Error durante TTS:', e);
    if (onError && typeof onError === 'function') {
      onError(e);
    }
  };

  // Reproducir
  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error(' Error al iniciar speechSynthesis:', error);
  }

  // Retornar utterance para control externo (pausar, cancelar, etc.)
  return utterance;
};

/**
 *  Detener voz de Sandra
 * Cancela cualquier audio de speechSynthesis en reproducción
 */
export const stopSandraVoice = () => {
  if (!isBrowser || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
  console.log(' Voz de Sandra detenida');
};

/**
 * ⏸ Pausar voz de Sandra
 */
export const pauseSandraVoice = () => {
  if (!isBrowser || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.pause();
  console.log('⏸ Voz de Sandra pausada');
};

/**
 * ▶ Reanudar voz de Sandra
 */
export const resumeSandraVoice = () => {
  if (!isBrowser || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.resume();
  console.log('▶ Voz de Sandra reanudada');
};

/**
 *  Función total: flujo completo de voz con transcripción, respuesta y voz
 * Realiza todo el flujo: texto transcrito → respuesta de Sandra → voz
 * @param {string} transcribedText - Texto transcrito del audio del usuario (STT)
 * @returns {Promise<string>} Respuesta de Sandra
 */
export const flujoCompletoSandraVoz = async (transcribedText) => {
  try {
    // 1. Obtener respuesta de Sandra
    const response = await sendVoiceToSandra(transcribedText);
    
    // 2. Reproducir respuesta con voz de Sandra
    speakSandraVoice(response);
    
    return response;
  } catch (err) {
    console.error(' Error en flujo completo de voz:', err);
    
    // Mensaje de error con voz
    speakSandraVoice('Ha habido un problema al procesar tu voz.');
    
    return '';
  }
};

/**
 * Configuración completa del entorno
 */
export const envConfig = {
  getEnv,
  getApiKeyFor,
  getBaseUrl,
  getWebSocketUrl,
  getDefaultModel,
  getModelInfo,
  getSandraResponse,
  sendVoiceToSandra,
  speakSandraVoice,
  stopSandraVoice,
  pauseSandraVoice,
  resumeSandraVoice,
  flujoCompletoSandraVoz,
  connectGalaxyToSandra,
  isProduction: () => getEnv() === 'production',
  isDevelopment: () => getEnv() === 'development',
  isStaging: () => getEnv() === 'staging'
};

