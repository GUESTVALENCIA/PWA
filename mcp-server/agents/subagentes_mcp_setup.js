/**
 * Activador automático de subagentes para MCP-SANDRA
 * Escucha en tiempo real eventos de texto y audio
 * Detecta triggers y activa automáticamente los subagentes especializados
 */

const eventBus = require('../utils/event_bus');
const fs = require('fs');
const path = require('path');

// Cargar configuración de triggers desde JSON
let triggersConfig = null;
try {
  const configPath = path.join(__dirname, '../subagents/config/triggers.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  triggersConfig = JSON.parse(configData);
} catch (error) {
  console.warn('[⚠️ SUBAGENTES] No se pudo cargar triggers.json, usando configuración por defecto');
  triggersConfig = {
    triggers: {
      deploy: ["hay problemas de deploy", "problemas de deploy", "bloqueo de vercel"],
      code: ["código muerto", "código duplicado", "problemas con el index"],
      bottleneck: ["cuello de botella", "lentitud"],
      widget: ["widget roto", "errores constantes en el widget"]
    },
    agents: {}
  };
}

// Importar handlers de agentes
const AgentDeployFixer = require('../subagents/handlers/AgentDeployFixer');
const AgentCodeCleaner = require('../subagents/handlers/AgentCodeCleaner');
const AgentWatcher = require('../subagents/handlers/AgentWatcher');

// Instanciar agentes
const agentes = {
  AgentDeployFixer: new AgentDeployFixer(),
  AgentCodeCleaner: new AgentCodeCleaner(),
  AgentWatcher: new AgentWatcher()
};

// Obtener todos los triggers de la configuración
function obtenerTodosLosTriggers() {
  const todos = [];
  if (triggersConfig && triggersConfig.triggers) {
    Object.values(triggersConfig.triggers).forEach(categoria => {
      todos.push(...categoria);
    });
  }
  return todos;
}

const TRIGGERS_ACTIVACION = obtenerTodosLosTriggers();

/**
 * Detecta si un texto contiene algún trigger y retorna la categoría
 */
function detectarTrigger(texto) {
  if (!texto || typeof texto !== 'string') return null;
  
  const textoLower = texto.toLowerCase();
  
  // Buscar en cada categoría de triggers
  if (triggersConfig && triggersConfig.triggers) {
    for (const [categoria, triggers] of Object.entries(triggersConfig.triggers)) {
      for (const trigger of triggers) {
        if (textoLower.includes(trigger.toLowerCase())) {
          return { trigger, categoria };
        }
      }
    }
  }
  
  // Fallback: buscar en lista plana
  for (const trigger of TRIGGERS_ACTIVACION) {
    if (textoLower.includes(trigger.toLowerCase())) {
      return { trigger, categoria: 'general' };
    }
  }
  
  return null;
}

/**
 * Activa los subagentes según el trigger detectado
 */
async function activarSubagentes(triggerInfo, context = {}) {
  const trigger = triggerInfo.trigger || triggerInfo;
  const categoria = triggerInfo.categoria || 'general';
  
  console.log(`\n[🔁 SUBAGENTES] Activando subagentes por trigger: '${trigger}'`);
  console.log(`[🔁 SUBAGENTES] Categoría: ${categoria}`);
  console.log(`[🔁 SUBAGENTES] Timestamp: ${new Date().toISOString()}\n`);
  
  // Determinar qué agentes activar según la categoría
  const agentesAActivar = [];
  
  if (triggersConfig && triggersConfig.agents) {
    for (const [nombreAgente, configAgente] of Object.entries(triggersConfig.agents)) {
      if (configAgente.triggers && configAgente.triggers.includes(categoria)) {
        agentesAActivar.push(nombreAgente);
      }
    }
  }
  
  // Si no hay configuración específica, activar todos
  if (agentesAActivar.length === 0) {
    agentesAActivar.push('AgentDeployFixer', 'AgentCodeCleaner', 'AgentWatcher');
  }
  
  // Activar cada agente
  for (const nombreAgente of agentesAActivar) {
    const agente = agentes[nombreAgente];
    if (agente) {
      console.log(`  → Activando ${nombreAgente}...`);
      try {
        await agente.activate(trigger, { categoria, ...context });
      } catch (error) {
        console.error(`  ❌ Error activando ${nombreAgente}:`, error);
      }
    } else {
      console.warn(`  ⚠️ Agente ${nombreAgente} no encontrado`);
    }
  }
  
  // Emitir evento general
  eventBus.emit('subagent.activate', {
    trigger,
    categoria,
    agentes: agentesAActivar,
    timestamp: new Date().toISOString()
  });
  
  console.log(`\n[✅ SUBAGENTES] Activación completada\n`);
}

/**
 * Escucha eventos de texto del sistema
 */
function escucharTexto() {
  console.log('[👂 SUBAGENTES] Escuchando eventos de texto...');
  
  eventBus.on('text.message', async (event) => {
    const contenido = event.data?.message || event.data?.text || '';
    const triggerInfo = detectarTrigger(contenido);
    
    if (triggerInfo) {
      console.log(`[📝 ACTIVADOR TEXTO] Trigger detectado: '${triggerInfo.trigger}' (${triggerInfo.categoria})`);
      await activarSubagentes(triggerInfo, { source: 'text', event });
    }
  });
  
  // También escuchar mensajes de chat/conserje
  eventBus.on('conserje.message', async (event) => {
    const contenido = event.data?.message || event.data?.transcript || '';
    const triggerInfo = detectarTrigger(contenido);
    
    if (triggerInfo) {
      console.log(`[💬 ACTIVADOR CONVERSA] Trigger detectado: '${triggerInfo.trigger}' (${triggerInfo.categoria})`);
      await activarSubagentes(triggerInfo, { source: 'conserje', event });
    }
  });
}

/**
 * Escucha transcripciones de audio en tiempo real
 */
function escucharAudio() {
  console.log('[🎤 SUBAGENTES] Escuchando transcripciones de audio...');
  
  eventBus.on('audio.transcribed', async (event) => {
    const transcript = event.data?.transcript || event.data?.text || '';
    const triggerInfo = detectarTrigger(transcript);
    
    if (triggerInfo) {
      console.log(`[🎙️ ACTIVADOR VOZ] Trigger detectado: '${triggerInfo.trigger}' (${triggerInfo.categoria})`);
      await activarSubagentes(triggerInfo, { source: 'audio', event });
    }
  });
  
  // Escuchar flujo de voz conversacional
  eventBus.on('voice.flow', async (event) => {
    const transcript = event.data?.transcript || '';
    const triggerInfo = detectarTrigger(transcript);
    
    if (triggerInfo) {
      console.log(`[📞 ACTIVADOR LLAMADA] Trigger detectado: '${triggerInfo.trigger}' (${triggerInfo.categoria})`);
      await activarSubagentes(triggerInfo, { source: 'voice_flow', event });
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
  eventBus.on('system.error', async (event) => {
    const errorMsg = event.data?.message || event.data?.error || '';
    const triggerInfo = detectarTrigger(errorMsg);
    
    if (triggerInfo) {
      console.log(`[⚠️ ACTIVADOR ERROR] Trigger detectado: '${triggerInfo.trigger}' (${triggerInfo.categoria})`);
      await activarSubagentes(triggerInfo, { source: 'system_error', event });
    }
  });
  
  console.log('[✅ SUBAGENTES ACTIVOS] Esperando triggers de texto o voz...\n');
  console.log(`[📋 TRIGGERS CONFIGURADOS] ${TRIGGERS_ACTIVACION.length} triggers activos\n`);
}

/**
 * Obtener estado del sistema de subagentes
 */
function obtenerEstado() {
  const estadoAgentes = {};
  for (const [nombre, agente] of Object.entries(agentes)) {
    estadoAgentes[nombre] = agente.getStatus();
  }
  
  return {
    activo: true,
    triggers: TRIGGERS_ACTIVACION,
    triggersConfig: triggersConfig ? Object.keys(triggersConfig.triggers || {}) : [],
    agentes: estadoAgentes,
    timestamp: new Date().toISOString()
  };
}

/**
 * Agregar trigger personalizado a una categoría
 */
function agregarTrigger(trigger, categoria = 'general') {
  if (!triggersConfig) {
    triggersConfig = { triggers: {}, agents: {} };
  }
  
  if (!triggersConfig.triggers[categoria]) {
    triggersConfig.triggers[categoria] = [];
  }
  
  if (!triggersConfig.triggers[categoria].includes(trigger)) {
    triggersConfig.triggers[categoria].push(trigger);
    TRIGGERS_ACTIVACION.push(trigger);
    
    // Guardar en archivo
    try {
      const configPath = path.join(__dirname, '../subagents/config/triggers.json');
      fs.writeFileSync(configPath, JSON.stringify(triggersConfig, null, 2), 'utf8');
      console.log(`[➕ TRIGGER] Agregado: '${trigger}' a categoría '${categoria}'`);
    } catch (error) {
      console.warn(`[⚠️ TRIGGER] No se pudo guardar en archivo:`, error);
    }
  }
}

/**
 * Remover trigger
 */
function removerTrigger(trigger, categoria = null) {
  if (categoria && triggersConfig && triggersConfig.triggers[categoria]) {
    const index = triggersConfig.triggers[categoria].indexOf(trigger);
    if (index > -1) {
      triggersConfig.triggers[categoria].splice(index, 1);
      console.log(`[➖ TRIGGER] Removido: '${trigger}' de categoría '${categoria}'`);
    }
  } else {
    // Buscar en todas las categorías
    if (triggersConfig && triggersConfig.triggers) {
      for (const [cat, triggers] of Object.entries(triggersConfig.triggers)) {
        const index = triggers.indexOf(trigger);
        if (index > -1) {
          triggers.splice(index, 1);
          console.log(`[➖ TRIGGER] Removido: '${trigger}' de categoría '${cat}'`);
          break;
        }
      }
    }
  }
  
  const index = TRIGGERS_ACTIVACION.indexOf(trigger);
  if (index > -1) {
    TRIGGERS_ACTIVACION.splice(index, 1);
  }
}

module.exports = {
  inicializar,
  activarSubagentes,
  detectarTrigger,
  obtenerEstado,
  agregarTrigger,
  removerTrigger,
  agentes,
  TRIGGERS_ACTIVACION
};

