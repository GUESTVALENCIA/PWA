/**
 * Activador automático de subagentes para MCP-SANDRA
 * Escucha en tiempo real eventos de texto y audio
 * Detecta triggers y activa automáticamente los subagentes especializados
 */

const eventBus = require('../utils/event_bus');
const TranscriberService = require('../services/transcriber');

// Triggers por texto o voz que activan automáticamente los subagentes
const TRIGGERS_ACTIVACION = [
  "hay problemas de deploy",
  "problemas con el index",
  "problemas de cuello de botella",
  "código muerto detectado",
  "código basura",
  "bloqueo de vercel",
  "sandra detecta lentitud",
  "errores constantes en el widget",
  "widget roto",
  "código duplicado",
  "archivos duplicados"
];

// Subagentes disponibles
const SUBAGENTES = {
  "AgenteGitHub": {
    name: "AgenteGitHub",
    description: "Limpia código y elimina basura en repositorios",
    action: "github.scan_and_fix"
  },
  "AgenteVercel": {
    name: "AgenteVercel",
    description: "Reinicia deploys y monitoriza errores",
    action: "vercel.redeploy_and_clean"
  },
  "AgenteRefactor": {
    name: "AgenteRefactor",
    description: "Corrige líneas muertas o código obsoleto",
    action: "code.refactor"
  },
  "AgenteObservador": {
    name: "AgenteObservador",
    description: "Envía reportes o activa alertas",
    action: "monitor.report"
  }
};

/**
 * Detecta si un texto contiene algún trigger
 */
function detectarTrigger(texto) {
  if (!texto || typeof texto !== 'string') return null;
  
  const textoLower = texto.toLowerCase();
  
  for (const trigger of TRIGGERS_ACTIVACION) {
    if (textoLower.includes(trigger)) {
      return trigger;
    }
  }
  
  return null;
}

/**
 * Activa todos los subagentes
 */
function activarSubagentes(triggerDetectado) {
  console.log(`\n[🔁 SUBAGENTES] Activando subagentes por trigger: '${triggerDetectado}'`);
  console.log(`[🔁 SUBAGENTES] Timestamp: ${new Date().toISOString()}\n`);
  
  for (const [nombre, agente] of Object.entries(SUBAGENTES)) {
    console.log(`  → Activando ${nombre}...`);
    console.log(`    Descripción: ${agente.description}`);
    
    // Emitir evento de acción
    eventBus.emit('subagent.activate', {
      agent: nombre,
      action: agente.action,
      trigger: triggerDetectado,
      timestamp: new Date().toISOString()
    });
    
    // Emitir acción específica
    eventBus.emit(agente.action, {
      agent: nombre,
      trigger: triggerDetectado
    });
  }
  
  console.log(`\n[✅ SUBAGENTES] Todos los subagentes activados\n`);
}

/**
 * Escucha eventos de texto del sistema
 */
function escucharTexto() {
  console.log('[👂 SUBAGENTES] Escuchando eventos de texto...');
  
  eventBus.on('text.message', (event) => {
    const contenido = event.data?.message || event.data?.text || '';
    const trigger = detectarTrigger(contenido);
    
    if (trigger) {
      console.log(`[📝 ACTIVADOR TEXTO] Trigger detectado: '${trigger}'`);
      activarSubagentes(trigger);
    }
  });
  
  // También escuchar mensajes de chat/conserje
  eventBus.on('conserje.message', (event) => {
    const contenido = event.data?.message || event.data?.transcript || '';
    const trigger = detectarTrigger(contenido);
    
    if (trigger) {
      console.log(`[💬 ACTIVADOR CONVERSA] Trigger detectado: '${trigger}'`);
      activarSubagentes(trigger);
    }
  });
}

/**
 * Escucha transcripciones de audio en tiempo real
 */
function escucharAudio() {
  console.log('[🎤 SUBAGENTES] Escuchando transcripciones de audio...');
  
  eventBus.on('audio.transcribed', (event) => {
    const transcript = event.data?.transcript || event.data?.text || '';
    const trigger = detectarTrigger(transcript);
    
    if (trigger) {
      console.log(`[🎙️ ACTIVADOR VOZ] Trigger detectado: '${trigger}'`);
      activarSubagentes(trigger);
    }
  });
  
  // Escuchar flujo de voz conversacional
  eventBus.on('voice.flow', (event) => {
    const transcript = event.data?.transcript || '';
    const trigger = detectarTrigger(transcript);
    
    if (trigger) {
      console.log(`[📞 ACTIVADOR LLAMADA] Trigger detectado: '${trigger}'`);
      activarSubagentes(trigger);
    }
  });
}

/**
 * Inicializar el sistema de activación de subagentes
 */
function inicializar() {
  console.log('\n[🚀 SUBAGENTES MCP] Inicializando sistema de activación automática...\n');
  
  // Activar listeners
  escucharTexto();
  escucharAudio();
  
  // Escuchar eventos de sistema (errores, warnings, etc.)
  eventBus.on('system.error', (event) => {
    const errorMsg = event.data?.message || event.data?.error || '';
    const trigger = detectarTrigger(errorMsg);
    
    if (trigger) {
      console.log(`[⚠️ ACTIVADOR ERROR] Trigger detectado: '${trigger}'`);
      activarSubagentes(trigger);
    }
  });
  
  console.log('[✅ SUBAGENTES ACTIVOS] Esperando triggers de texto o voz...\n');
  console.log(`[📋 TRIGGERS CONFIGURADOS] ${TRIGGERS_ACTIVACION.length} triggers activos\n`);
}

/**
 * Obtener estado del sistema de subagentes
 */
function obtenerEstado() {
  return {
    activo: true,
    triggers: TRIGGERS_ACTIVACION,
    subagentes: Object.keys(SUBAGENTES),
    timestamp: new Date().toISOString()
  };
}

/**
 * Agregar trigger personalizado
 */
function agregarTrigger(trigger) {
  if (!TRIGGERS_ACTIVACION.includes(trigger)) {
    TRIGGERS_ACTIVACION.push(trigger);
    console.log(`[➕ TRIGGER] Agregado: '${trigger}'`);
  }
}

/**
 * Remover trigger
 */
function removerTrigger(trigger) {
  const index = TRIGGERS_ACTIVACION.indexOf(trigger);
  if (index > -1) {
    TRIGGERS_ACTIVACION.splice(index, 1);
    console.log(`[➖ TRIGGER] Removido: '${trigger}'`);
  }
}

module.exports = {
  inicializar,
  activarSubagentes,
  detectarTrigger,
  obtenerEstado,
  agregarTrigger,
  removerTrigger,
  SUBAGENTES,
  TRIGGERS_ACTIVACION
};

