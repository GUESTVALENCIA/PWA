# 🔁 Sistema de Subagentes Automáticos - MCP-SANDRA

## 📋 Descripción

Sistema de activación automática de subagentes especializados que escucha en tiempo real eventos de texto y audio, detecta triggers específicos y activa automáticamente los subagentes correspondientes.

**Este sistema está activado y en escucha pasiva en todos los repositorios MCP**, incluyendo:

- `GuestsValencia-Site`
- `GuestsValencia-PWA`
- `MCP-SANDRA`

## 🎯 Funcionalidad

### Activación por Comandos

Los subagentes pueden activarse de dos formas:

#### 1. Por comandos de texto

Se activa al detectar expresiones como:

- "hay problemas con el index"
- "problemas de deploy"
- "cuello de botella en Vercel"
- "código muerto en el repo"
- "widget roto"
- "errores constantes en el widget"

#### 2. Por comandos de voz

Gracias a la multimodalidad de Sandra, se analiza la transcripción de voz mediante STT (Speech-To-Text) integrada con Deepgram, y se detectan las mismas frases de activación.

### Acciones Automáticas

Al detectarse una frase clave:

1. **Se identifican los agentes asignados según el tipo de error**:
   - `AgentDeployFixer`: para errores en Vercel o Railway
   - `AgentCodeCleaner`: para limpiar código muerto, corregir líneas
   - `AgentWatcher`: para detectar futuros errores en logs

2. **Se ejecuta la acción correspondiente automáticamente** sin necesidad de validación manual.

3. **Se notifica a Sandra** y queda registro en los logs.

## 📁 Estructura de Archivos

```text
mcp-server/
├── agents/
│   └── subagentes_mcp_setup.js    # Sistema principal de subagentes
├── subagents/
│   ├── config/
│   │   └── triggers.json          # Configuración de triggers por categoría
│   └── handlers/
│       ├── AgentDeployFixer.js     # Handler para problemas de deploy
│       ├── AgentCodeCleaner.js     # Handler para limpieza de código
│       └── AgentWatcher.js         # Handler para monitoreo y alertas
├── utils/
│   └── event_bus.js                # Sistema de eventos (Event Bus)
└── routes/
    └── conserje.js                 # Integrado para emitir eventos
```

## 🚀 Integración

El sistema se inicializa automáticamente cuando el servidor MCP arranca:

```javascript
// En mcp-server/index.js
const subagentesSystem = require('./agents/subagentes_mcp_setup');

async function start() {
  await initializeServices();
  subagentesSystem.inicializar(); // ← Se activa aquí
  // ...
}
```

## 📡 Eventos que Escucha

El sistema escucha los siguientes eventos del Event Bus:

1. **`text.message`** - Mensajes de texto
2. **`conserje.message`** - Mensajes del conserje
3. **`audio.transcribed`** - Transcripciones de audio
4. **`voice.flow`** - Flujo de voz conversacional
5. **`system.error`** - Errores del sistema

## 🎛️ Configuración de Triggers

Los triggers se configuran en `subagents/config/triggers.json`:

```json
{
  "triggers": {
    "deploy": ["hay problemas de deploy", "bloqueo de vercel"],
    "code": ["código muerto", "código duplicado"],
    "bottleneck": ["cuello de botella", "lentitud"],
    "widget": ["widget roto", "errores constantes en el widget"]
  },
  "agents": {
    "AgentDeployFixer": {
      "triggers": ["deploy", "bottleneck"],
      "actions": ["vercel.redeploy_and_clean"]
    }
  }
}
```

**Es posible agregar nuevas frases en `subagents/config/triggers.json`** sin modificar código.

## 🔧 Uso Manual

También puedes activar los subagentes manualmente:

```javascript
const subagentesSystem = require('./agents/subagentes_mcp_setup');

// Activar todos los subagentes
await subagentesSystem.activarSubagentes({ trigger: 'problemas de deploy', categoria: 'deploy' });

// Agregar trigger personalizado
subagentesSystem.agregarTrigger('mi trigger personalizado', 'general');

// Obtener estado
const estado = subagentesSystem.obtenerEstado();
```

## 📊 Eventos Emitidos

Cuando se activan los subagentes, se emiten estos eventos:

- `subagent.activate` - Evento general de activación
- `agent.action` - Acciones realizadas por cada agente
- `agent.error` - Errores en la ejecución de agentes
- `vercel.redeploy_and_clean` - Acción de AgentDeployFixer
- `code.refactor` - Acción de AgentCodeCleaner
- `monitor.report` - Acción de AgentWatcher

## ✅ Ejemplo de Uso

**Texto:**
> "Sandra, hay problemas de deploy en Vercel."

**Voz:**
> Usuario dicta por micrófono del chat: "Sandra, hay problemas con el índice de código."

**Resultado:** Se activa el subagente correspondiente, limpia el deploy o corrige el archivo afectado, se reporta acción a Sandra y queda registrado en logs.

## ⚠️ Notas Importantes

- ✅ **No se requiere reactivación manual** de los subagentes
- ✅ **Los subagentes están siempre en escucha pasiva**
- ✅ **Solo ejecutan tareas si detectan las frases exactas** por voz o texto
- ✅ **Es posible agregar nuevas frases** en `subagents/config/triggers.json`
- 🚫 **No modificar la carpeta `subagents` ni el archivo de lógica sin autorización** del equipo técnico o de Sandra IA

## 📆 Próximas Mejoras (Backlog)

- Soporte para comandos multilingües
- Integración con agentes en GitHub Actions directamente
- Feedback visual en la PWA al activarse un agente

## ✨ Estado Actual

**Activado y en escucha pasiva en todos los MCP.** Puede integrarse en entornos como Cursor y otros IDEs siempre que se ejecute con Sandra activa.

---

## Fin del documento
