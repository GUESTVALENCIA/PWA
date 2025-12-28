# 🌐 SERVIDOR UNIVERSAL MCP ORCHESTRATOR

**El único servidor centralizado que gobierna todo el ecosistema**

## 📋 ¿Qué es?

Este es el **Servidor Universal MCP Orchestrator v2.0**, que consolida y centraliza:

- ✅ **MCP Orchestrator Core** - Orquestación multi-agente IA
- ✅ **Realtime Voice System** - Sistema de voz conversacional integrado
- ✅ **Todos los proyectos** - PWA, Mobile, Tablet, otros
- ✅ **Un único workflow centralizado** - Análisis → Propuestas → Revisiones → Unificación → Implementación

## 🏗️ Arquitectura Unificada

```
┌─────────────────────────────────────────────────────────┐
│         SERVIDOR UNIVERSAL - MCP ORCHESTRATOR           │
└─────────────────────────────────────────────────────────┘
         │
         ├─ CORE LAYER (Port 3000)
         │  ├── Express.js HTTP Server
         │  ├── WebSocket Real-time Sync
         │  ├── NEON PostgreSQL Database
         │  └── JWT + API Key Auth
         │
         ├─ SERVICE LAYER
         │  ├── Proposal Service
         │  ├── Review Service
         │  ├── Unification Service
         │  ├── Implementation Service
         │  ├── Context Builder
         │  └── Voice Integration Service
         │
         ├─ API ROUTES
         │  ├── /api/projects/* - Project management
         │  ├── /api/proposals/* - Proposal workflow
         │  ├── /api/plans/* - Plan unification & approval
         │  ├── /api/implementations/* - Implementation control
         │  ├── /api/voice/* - Voice system integration
         │  └── /api/context/* - Shared context
         │
         ├─ WEBSOCKET (Real-time)
         │  ├── subscribe_project
         │  ├── proposal_created
         │  ├── review_created
         │  ├── plan_created
         │  ├── implementation_started/completed
         │  └── agent_disconnected
         │
         └─ SUBSYSTEMS
            ├── Voice System (integrated)
            ├── Project Registry
            └── Shared Memory
```

## 🚀 Endpoints Principales

### Proyectos
```bash
GET    /api/projects              # Listar todos
POST   /api/projects              # Crear nuevo
GET    /api/projects/:id          # Detalles
```

### Propuestas (Flujo completo)
```bash
POST   /api/projects/:id/propose  # Crear propuesta
GET    /api/proposals/:id         # Obtener propuesta
POST   /api/proposals/:id/review  # Hacer revisión
```

### Planes (Unificación & Aprobación)
```bash
POST   /api/proposals/unify       # Unificar propuestas
GET    /api/plans/:id             # Detalles del plan
POST   /api/plans/:id/approve     # Aprobar plan
```

### Implementación (Control)
```bash
POST   /api/plans/:id/implement   # Iniciar implementación
POST   /api/implementations/:id/progress  # Registrar progreso
POST   /api/implementations/:id/complete  # Completar
GET    /api/implementations/:id   # Estado
```

### Sistema de Voz Integrado ⭐
```bash
GET    /api/voice/status          # Estado del sistema
POST   /api/voice/tts             # Text to Speech
POST   /api/voice/stream          # Real-time streaming
GET    /api/voice/agents          # Agentes de voz activos
POST   /api/voice/projects/:id/connect   # Conectar a proyecto
```

### Contexto & Sincronización
```bash
GET    /api/projects/:id/context  # Contexto compartido
GET    /api/projects/:id/sync     # Sincronización
```

## 📊 Flujo de Trabajo Unificado

### Fase 1: ANÁLISIS
```
Múltiples agentes LEEN proyecto
├─ GET /api/projects/:id/read
├─ GET /api/projects/:id/context
└─ GET /api/projects/:id/sync
```

### Fase 2: PROPUESTAS
```
Agentes CREAN propuestas
├─ POST /api/projects/:id/propose
├─ GET /api/proposals/:id
└─ WebSocket: proposal_created
```

### Fase 3: REVISIONES
```
Otros agentes REVISAN propuestas
├─ POST /api/proposals/:id/review
├─ GET /api/proposals/:id/reviews
└─ WebSocket: review_created
```

### Fase 4: UNIFICACIÓN
```
Sistema UNIFICA propuestas inteligentemente
├─ POST /api/proposals/unify
├─ GET /api/plans/:id
└─ WebSocket: plan_created
```

### Fase 5: APROBACIÓN
```
Usuario/Agente APRUEBA plan
├─ POST /api/plans/:id/approve
└─ WebSocket: plan_approved
```

### Fase 6: IMPLEMENTACIÓN
```
UN AGENTE implementa (proyecto BLOQUEADO)
├─ POST /api/plans/:id/implement (bloquea proyecto)
├─ POST /api/implementations/:id/progress
├─ POST /api/implementations/:id/complete (desbloquea)
└─ WebSocket: implementation_started/completed
```

### Fase 7: VOZ INTEGRADA
```
Sistema de voz conectado todo el tiempo
├─ POST /api/voice/projects/:id/connect
├─ POST /api/voice/tts (generate speech)
├─ POST /api/voice/stream (real-time)
└─ WebSocket: voice_state_changed
```

## 🗄️ Base de Datos (NEON PostgreSQL)

```
TABLAS PRINCIPALES:
├── projects (id, name, path, lock_status, locked_by, locked_at)
├── proposals (id, project_id, agent_id, title, status, files, approval_score)
├── proposal_reviews (id, proposal_id, reviewer_agent_id, assessment, score, status)
├── unified_plans (id, project_id, proposal_ids, title, status, approval_agent_id)
├── implementations (id, plan_id, project_id, agent_id, status, files_changed, test_results)
├── shared_memory (id, project_id, key, value, visibility)
├── change_logs (id, project_id, entity_type, action, agent_id, new_values)
└── agent_sessions (id, agent_id, project_id, status, last_activity)

TRIGGERS AUTOMÁTICOS:
├── update_updated_at_column (todas las tablas)
└── log_change (proposals, plans, implementations)
```

## 🔐 Seguridad

```
Autenticación:
├── JWT Tokens (req.agent.id)
├── API Keys (bearer token)
└── Rate Limiting (100 req/min por agente)

Control de Acceso:
├── READ: Siempre permitido
├── PROPOSE: Si proyecto no está bloqueado
└── IMPLEMENT: Solo si agente tiene lock

Bloqueo de Proyecto:
├── Timeout: 30 minutos
├── Solo UN agente puede implementar
└── Automáticamente se desbloquea al completar
```

## 📡 WebSocket Real-time

```
SUSCRIPCIONES:
{
  "type": "subscribe_project",
  "payload": { "projectId": "uuid" }
}

EVENTOS TRANSMITIDOS:
├── proposal_created
├── review_created
├── plan_created
├── plan_approved
├── implementation_started
├── implementation_completed
├── implementation_failed
├── agent_disconnected
└── project_sync
```

## 🎤 Sistema de Voz Integrado

El Voice System ahora forma parte de la orquestación centralizada:

```
Voice Integration Points:
├── POST /api/voice/tts - Text to Speech
├── POST /api/voice/stream - Real-time voice
├── POST /api/voice/projects/:id/connect - Conectar proyecto
├── GET /api/voice/agents - Agentes de voz
└── GET /api/voice/projects/:id/state - Estado de voz en proyecto

Cómo funciona:
1. Agente se conecta: POST /api/voice/projects/:id/connect
2. Sistema registra sesión en BD
3. WebSocket transmite cambios en tiempo real
4. Voz fluye a través del servidor centralizado
5. Contexto compartido actualiza automáticamente
```

## 🚀 Deployment en Render

```bash
# 1. Render detecta server.js en raíz
# 2. npm install
# 3. npm start (ejecuta: node server.js)
# 4. Servicio vivo en: https://pwa-imbf.onrender.com

# Variables de entorno necesarias:
NEON_DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto
API_KEYS_SALT=salt
PORT=3000
NODE_ENV=production
```

## 📊 Estructura de Directorios

```
.
├── server.js                 # Punto de entrada (SERVIDOR UNIVERSAL)
├── package.json              # Dependencias
├── src/
│   ├── core/                 # Núcleo del sistema
│   │   ├── mcp-server.js
│   │   ├── state-manager.js
│   │   ├── project-manager.js
│   │   ├── event-emitter.js
│   │   └── ...
│   ├── services/             # Capa de servicios (6 servicios)
│   │   ├── neon-service.js
│   │   ├── proposal-service.js
│   │   ├── review-service.js
│   │   ├── unification-service.js
│   │   ├── implementation-service.js
│   │   └── context-builder.js
│   ├── routes/               # Rutas API (7 rutas)
│   │   ├── projects.js
│   │   ├── propose.js
│   │   ├── review.js
│   │   ├── unify.js
│   │   ├── implement.js
│   │   ├── context.js
│   │   ├── read.js
│   │   └── voice-integration.js  ⭐ NUEVA
│   ├── middleware/           # Middleware de seguridad
│   ├── websocket/            # WebSocket real-time
│   └── utils/                # Utilidades
├── voice-system/             # Sistema de voz integrado
│   ├── core/
│   ├── server/
│   └── ...
├── database/
│   └── schema.sql
├── config/
│   ├── projects-registry.json
│   └── mcp-server-config.json
└── skills/
    └── universal-skill.js
```

## 🔄 Cómo los Agentes Interactúan

```
┌─────────────────────────────────────────┐
│  AGENTES (Cursor, Claude, VS Code, etc) │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
      REST API  WebSocket    MCP
        │          │          │
        └──────────┼──────────┘
                   │
    ┌──────────────▼──────────────┐
    │  SERVIDOR UNIVERSAL (Puerto 3000)
    │  - Autenticación
    │  - Validación
    │  - Control de acceso
    │  - Rate limiting
    └──────────────┬──────────────┘
                   │
        ┌──────────┼──────────────┐
        │          │              │
        ▼          ▼              ▼
    Services  WebSocket      NEON BD
    - Proposal  - Broadcast  - State
    - Review    - Subscribe  - History
    - Unify     - Sync       - Audit
    - Implement - Events
```

## ✅ Estado del Sistema

```
COMPONENTES COMPLETADOS:
✅ Core MCP Orchestrator
✅ NEON PostgreSQL Schema
✅ 6 Servicios principales
✅ 7 Rutas API principales
✅ WebSocket real-time
✅ Voice System Integration
✅ Middleware de seguridad
✅ Error handling
✅ Logging centralizado

DEPLOYMENT:
✅ En Render (https://pwa-imbf.onrender.com)
✅ Auto-deploy en push a GitHub
✅ Node.js v25.2.1
✅ npm packages up to date

PRÓXIMOS PASOS:
→ Monitoreo en producción
→ Métricas y analytics
→ Escalado horizontal si es necesario
```

## 🎯 Resumen Ejecutivo

**Este es un servidor único que:**
1. ✅ Recibe peticiones de múltiples agentes
2. ✅ Orquesta el flujo de trabajo centralizado
3. ✅ Sincroniza en tiempo real via WebSocket
4. ✅ Gestiona permisos y bloqueos automáticamente
5. ✅ Almacena todo en NEON PostgreSQL
6. ✅ Integra sistema de voz conversacional
7. ✅ Brinda contexto compartido a todos
8. ✅ Registra y audita todo automáticamente

**Un servidor para gobernarlos a todos. 👑**

---

**Último actualizado:** 2025-12-28
**Versión:** 2.0 - Universal
**Status:** Production Ready 🚀
