# 🔁 Sistema de Subagentes Automáticos - MCP-SANDRA

## 📋 Descripción

Sistema de activación automática de subagentes especializados que escucha en tiempo real eventos de texto y audio, detecta triggers específicos y activa automáticamente los subagentes correspondientes.

## 🎯 Funcionalidad

El sistema detecta automáticamente frases clave como:
- "hay problemas de deploy"
- "problemas con el index"
- "código muerto detectado"
- "bloqueo de vercel"
- "errores constantes en el widget"
- Y más...

Cuando detecta un trigger, activa automáticamente:
- **AgenteGitHub**: Limpia código y elimina basura en repositorios
- **AgenteVercel**: Reinicia deploys y monitoriza errores
- **AgenteRefactor**: Corrige líneas muertas o código obsoleto
- **AgenteObservador**: Envía reportes o activa alertas

## 📁 Estructura de Archivos

```
mcp-server/
├── agents/
│   └── subagentes_mcp_setup.js    # Sistema principal de subagentes
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

## 🔧 Uso Manual

También puedes activar los subagentes manualmente:

```javascript
const subagentesSystem = require('./agents/subagentes_mcp_setup');

// Activar todos los subagentes
subagentesSystem.activarSubagentes('trigger personalizado');

// Agregar trigger personalizado
subagentesSystem.agregarTrigger('mi trigger personalizado');

// Obtener estado
const estado = subagentesSystem.obtenerEstado();
```

## 🎛️ Configuración

Los triggers se pueden modificar en `subagentes_mcp_setup.js`:

```javascript
const TRIGGERS_ACTIVACION = [
  "hay problemas de deploy",
  "código muerto detectado",
  // ... agregar más triggers
];
```

## 📊 Eventos Emitidos

Cuando se activan los subagentes, se emiten estos eventos:

- `subagent.activate` - Evento general de activación
- `github.scan_and_fix` - Acción de AgenteGitHub
- `vercel.redeploy_and_clean` - Acción de AgenteVercel
- `code.refactor` - Acción de AgenteRefactor
- `monitor.report` - Acción de AgenteObservador

## ✅ Estado

El sistema está completamente integrado y funcionando. Se activa automáticamente al iniciar el servidor MCP.

