/**
 * 🎯 CONFIGURACIÓN DE AGENTE DEEPGRAM - CALL CENTER
 * 
 * Plantilla de configuración para agente de voz conversacional tipo Call Center
 * Basado en mejores prácticas de Deepgram y sistemas de atención al cliente
 * 
 * Incluye:
 * - Configuración de feedback para duplicados
 * - Modo calmado (calm mode)
 * - Configuración de agente de atención al cliente
 * - Manejo robusto de transcripciones duplicadas
 */

export const DEEPGRAM_AGENT_CONFIG = {
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN BASE - STT (Speech-to-Text)
  // ═══════════════════════════════════════════════════════════════
  stt: {
    // Modelo de transcripción
    model: 'nova-2', // ✅ Mejor balance calidad/latencia para call center
    
    // Configuración de audio
    encoding: 'linear16',
    sampleRate: 48000,
    channels: 1,
    
    // ⚠️ CRITICAL: Timeout para detectar fin de frase
    // 600ms = balance óptimo para call center (no muy corto, no muy largo)
    idleTimeoutMs: 600,
    
    // Configuración de lenguaje
    language: 'es',
    
    // ═══════════════════════════════════════════════════════════════
    // FEEDBACK Y CONFIGURACIÓN DE AGENTE
    // ═══════════════════════════════════════════════════════════════
    
    // 🔇 Modo calmado (reduce interrupciones)
    // Deepgram puede configurarse para ser menos agresivo con finalizaciones
    // Esto reduce falsos positivos de "frase finalizada"
    smartFormat: true,
    
    // 📊 Feedback de calidad de transcripción
    // Deepgram proporciona métricas de confianza que podemos usar
    punctuate: true,
    diarize: false, // Solo una persona habla (cliente)
    
    // 🎯 Configuración específica para call center
    // Reducir sensibilidad a ruido de fondo
    vadEvents: true, // Voice Activity Detection events
    
    // ═══════════════════════════════════════════════════════════════
    // MANEJO DE DUPLICADOS (FEEDBACK INTEGRADO)
    // ═══════════════════════════════════════════════════════════════
    
    // Deepgram envía múltiples eventos para la misma transcripción:
    // - idle_timeout: cuando el usuario deja de hablar
    // - Results: transcripción final
    // - speech_final: marcador de finalización
    
    // ⚙️ Configuración para reducir eventos duplicados:
    endpointing: 300, // ms de silencio antes de finalizar (reduce eventos múltiples)
    
    // 🔄 Estrategia de deduplicación (implementada en nuestro código):
    // 1. Verificar si es exactamente la misma transcripción (comparación exacta)
    // 2. Verificar ventana de tiempo (3 segundos)
    // 3. Verificar si ya está procesando (isProcessing flag)
    // 4. Permitir transcripciones nuevas aunque haya una en proceso
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN TTS (Text-to-Speech)
  // ═══════════════════════════════════════════════════════════════
  tts: {
    // Modelo de voz peninsular (España)
    model: 'aura-2-agustina-es', // ✅ Peninsular, calmada, profesional
    
    // Formato de audio
    encoding: 'linear16',
    sampleRate: 24000, // ✅ Requerido por Deepgram para TTS streaming
    
    // Configuración de calidad
    container: 'none', // Sin contenedor para streaming
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE AGENTE - CALL CENTER
  // ═══════════════════════════════════════════════════════════════
  agent: {
    // 🎭 Personalidad del agente
    personality: 'calm', // 'calm' | 'professional' | 'friendly' | 'energetic'
    
    // 🗣️ Estilo de conversación
    conversationStyle: 'customer_service', // 'customer_service' | 'sales' | 'support'
    
    // ⏱️ Tiempos de respuesta
    responseTiming: {
      minDelay: 200, // ms mínimo antes de responder (evita interrupciones)
      maxDelay: 2000, // ms máximo de espera (evita silencios largos)
    },
    
    // 🔄 Manejo de duplicados
    duplicateHandling: {
      enabled: true,
      windowMs: 3000, // Ventana de tiempo para considerar duplicado (3 segundos)
      exactMatch: true, // Solo bloquear transcripciones exactamente iguales
      allowNewWhileProcessing: true, // Permitir nueva transcripción aunque haya una en proceso
    },
    
    // 📊 Feedback y métricas
    feedback: {
      logTranscriptions: true, // Log todas las transcripciones para análisis
      logDuplicates: true, // Log transcripciones duplicadas detectadas
      trackLatency: true, // Trackear latencia de respuestas
    },
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE CALIDAD Y RENDIMIENTO
  // ═══════════════════════════════════════════════════════════════
  performance: {
    // 🚀 Optimizaciones para call center
    enableBargeIn: true, // Permitir que el usuario interrumpa al agente
    enableInterruptions: true, // Detectar cuando el usuario habla mientras el agente responde
    
    // 📈 Métricas de calidad
    trackMetrics: {
      transcriptionAccuracy: true,
      responseLatency: true,
      duplicateRate: true, // Tasa de duplicados detectados
      userSatisfaction: false, // Requiere integración adicional
    },
  },
};

/**
 * 🎯 CONFIGURACIÓN ESPECÍFICA POR TIPO DE AGENTE
 */
export const AGENT_PROFILES = {
  // Agente de atención al cliente estándar
  customer_service: {
    ...DEEPGRAM_AGENT_CONFIG,
    agent: {
      ...DEEPGRAM_AGENT_CONFIG.agent,
      personality: 'calm',
      conversationStyle: 'customer_service',
    },
    stt: {
      ...DEEPGRAM_AGENT_CONFIG.stt,
      idleTimeoutMs: 600, // Balance óptimo
    },
  },
  
  // Agente de ventas (más rápido, más enérgico)
  sales: {
    ...DEEPGRAM_AGENT_CONFIG,
    agent: {
      ...DEEPGRAM_AGENT_CONFIG.agent,
      personality: 'energetic',
      conversationStyle: 'sales',
    },
    stt: {
      ...DEEPGRAM_AGENT_CONFIG.stt,
      idleTimeoutMs: 400, // Más rápido para ventas
    },
  },
  
  // Agente de soporte técnico (más paciente, más detallado)
  support: {
    ...DEEPGRAM_AGENT_CONFIG,
    agent: {
      ...DEEPGRAM_AGENT_CONFIG.agent,
      personality: 'professional',
      conversationStyle: 'support',
    },
    stt: {
      ...DEEPGRAM_AGENT_CONFIG.stt,
      idleTimeoutMs: 800, // Más tiempo para explicaciones técnicas
    },
  },
};

/**
 * 🔧 Función helper para obtener configuración de agente
 * @param {string} profile - Perfil del agente ('customer_service' | 'sales' | 'support')
 * @returns {object} Configuración completa del agente
 */
export function getAgentConfig(profile = 'customer_service') {
  return AGENT_PROFILES[profile] || AGENT_PROFILES.customer_service;
}

/**
 * 📊 Función helper para crear opciones de Deepgram STT con feedback de duplicados
 * @param {object} overrides - Configuraciones personalizadas
 * @returns {object} Opciones para createStreamingConnection
 */
export function createSTTOptions(overrides = {}) {
  const baseConfig = DEEPGRAM_AGENT_CONFIG.stt;
  return {
    ...baseConfig,
    ...overrides,
    // Feedback integrado para duplicados
    // Deepgram no tiene configuración nativa, pero podemos usar:
    // - endpointing para reducir eventos múltiples
    // - vadEvents para mejor detección de voz
    // - Nuestra lógica de deduplicación en el código
  };
}

/**
 * 🎙️ Función helper para crear opciones de Deepgram TTS
 * @param {object} overrides - Configuraciones personalizadas
 * @returns {object} Opciones para TTS
 */
export function createTTSOptions(overrides = {}) {
  const baseConfig = DEEPGRAM_AGENT_CONFIG.tts;
  return {
    ...baseConfig,
    ...overrides,
  };
}

/**
 * 📝 NOTAS IMPORTANTES:
 * 
 * 1. **Deepgram no tiene configuración nativa de "modo calmado" o "agente de atención al cliente"**
 *    - Estas configuraciones se implementan a nivel de aplicación
 *    - Usamos `idleTimeoutMs`, `endpointing`, y `vadEvents` para simular comportamiento calmado
 * 
 * 2. **Manejo de duplicados:**
 *    - Deepgram envía múltiples eventos (idle_timeout, Results, speech_final)
 *    - Implementamos lógica de deduplicación en `socket-server.js`
 *    - Ventana de tiempo: 3 segundos
 *    - Comparación exacta de transcripciones
 * 
 * 3. **Feedback de calidad:**
 *    - Deepgram proporciona métricas de confianza en las transcripciones
 *    - Podemos usar `punctuate: true` para mejor calidad
 *    - `smartFormat: true` mejora la legibilidad
 * 
 * 4. **Configuración de agente:**
 *    - La "personalidad" y "estilo" se implementan en el prompt del LLM
 *    - Deepgram solo maneja STT/TTS, no la lógica del agente
 *    - Usamos estas configuraciones como guía para nuestro código
 */
