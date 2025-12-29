# 🎉 MCP Orchestrator Universal - Servidor Centralizado

**Sistema de Orquestación Multi-Agente IA para Gobierno Centralizado de Proyectos**

Control centralizado para múltiples agentes IA (Cursor, Claude, ChatGPT, VS Code, etc.) trabajando en los mismos proyectos sin conflictos.

---

## 🏗️ Arquitectura del Servidor MCP Universal

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIOS / CLIENTES                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
   ┌──────────┐     ┌──────────┐   ┌──────────┐
   │Cursor    │     │Claude    │   │ChatGPT   │
   │ Editor   │     │ Desktop  │   │   API    │
   └────┬─────┘     └────┬─────┘   └────┬─────┘
        │                │              │
        └────────────────┼──────────────┘
                         │ MCP Protocol + REST API
                         ↓
    ┌────────────────────────────────────────────┐
    │  MCP ORCHESTRATOR UNIVERSAL SERVER         │
    │  https://pwa-imbf.onrender.com             │
    │  Puerto: 3001 (HTTP/WebSocket)            │
    │  (Render - Production)                    │
    ├────────────────────────────────────────────┤
    │                                            │
    │  CAPAS MIDDLEWARE:                         │
    │  ✅ Authentication (JWT + API Keys)        │
    │  ✅ Project Detection                      │
    │  ✅ Access Control (READ/PROPOSE/IMPLEMENT)│
    │  ✅ Rate Limiting (100 req/min)            │
    │  ✅ Error Handling                         │
    │                                            │
    │  SERVICIOS PRINCIPALES:                    │
    │  ✅ ProposalService      (Crear/Revisar)  │
    │  ✅ ReviewService        (Consenso)       │
    │  ✅ UnificationService   (Merge inteligente)
    │  ✅ ImplementationService (Ejecución)     │
    │  ✅ ContextBuilder       (Contexto compartido)
    │  ✅ NeonService          (Base de datos)  │
    │                                            │
    │  INTEGRACIONES:                            │
    │  ✅ Voice System Integration               │
    │  ✅ WebSocket Real-time Sync               │
    │  ✅ Event Broadcasting (8+ tipos)          │
    │                                            │
    └────────────┬─────────────────────────────┘
                 │
    ┌────────────┴──────────────────┐
    ↓                               ↓
┌──────────────┐         ┌────────────────────┐
│   NEON       │         │ STATE MANAGER      │
│PostgreSQL    │         │ (In-Memory Fallback)
│ Persistencia │         │                    │
│ • projects   │         │ • Lock Status      │
│ • proposals  │         │ • Project Status   │
│ • reviews    │         │ • Proposals Map    │
│ • plans      │         │ • Plans Map        │
│ • impls      │         │ • Implementations  │
│ • logs       │         │                    │
│ • sessions   │         └────────────────────┘
└──────────────┘
```

---

## 🌐 Dominios, Subdomios y Rutas

### Dominio Principal: guestsvalencia.es ✅ ACTIVO

**Estado:** Transferido a Vercel (Proyecto PWA) el 2025-12-29
**Servidor:** https://pwa-imbf.onrender.com
**Registrador:** TBD (Esperar propagación DNS)
**Uso:** Acceso principal centralizado

```bash
# Acceso principal
https://guestsvalencia.es/
  → Redirige a PWA en Vercel
  → Que a su vez conecta al MCP Server
```

---

### Subdomios Consolidados

#### 1. **api.guestsvalencia.es** ⚠️ CONSOLIDADO

**Estado Anterior:** Activo en guestsvalencia-site (Removido)
**Estado Actual:** Rutas API centralizadas en MCP Server
**Uso:** Acceso a endpoints REST del sistema

```bash
# Ahora todas las APIs están en:
https://pwa-imbf.onrender.com/api/*

# Ejemplos:
/api/projects              # Gestión de proyectos
/api/projects/:id/propose  # Crear propuestas
/api/proposals/:id/review  # Revisar propuestas
/api/proposals/unify       # Unificar propuestas
/api/plans/:id/approve     # Aprobar planes
/api/plans/:id/implement   # Implementar planes
/api/voice/*              # Sistema de voz
```

#### 2. **app.guestsvalencia.es** ⚠️ CONSOLIDADO

**Estado Anterior:** Activo en guestsvalencia-site (Removido)
**Estado Actual:** Aplicación PWA en Vercel
**Uso:** Interfaz web de usuario (PWA)

```bash
# Ahora en:
https://pwa-chi-six.vercel.app/

# Conecta automáticamente al MCP Server:
- MCP_SERVER_URL=https://pwa-imbf.onrender.com
- WebSocket: wss://pwa-imbf.onrender.com
```

#### 3. **site.guestsvalencia.es** ⚠️ CONSOLIDADO

**Estado Anterior:** Sitio web estático (Removido)
**Estado Actual:** Documentación y landing page
**Uso:** Información pública del proyecto

```bash
# Podría ser recreado en Vercel apuntando a:
https://guestsvalencia.es/landing
```

#### 4. **sandra.guestsvalencia.es** ⚠️ CONSOLIDADO

**Estado Anterior:** Sistema de voz independiente (Removido)
**Estado Actual:** Integrado en MCP Server
**Uso:** Sistema de voz centralizado

```bash
# Ahora en:
https://pwa-imbf.onrender.com/api/voice/*

# Endpoints:
POST   /api/voice/tts                 # Text to speech
POST   /api/voice/stream              # Streaming en tiempo real
GET    /api/voice/status              # Estado del sistema
GET    /api/voice/agents              # Agentes de voz activos
POST   /api/voice/projects/:id/connect
GET    /api/voice/projects/:id/state
```

#### 5. **www.guestsvalencia.es** ⚠️ CONSOLIDADO

**Estado Anterior:** Alias de dominio principal (Removido)
**Estado Actual:** Manejo mediante certificados SSL en Vercel
**Uso:** Alias para acceso www

```bash
# Automáticamente redirige a:
https://guestsvalencia.es/
```

---

### URLs de Referencia - Servidor MCP

#### Dominio Principal
- **URL:** https://pwa-imbf.onrender.com
- **Puerto:** 3001 (Internal)
- **Protocolo:** HTTPS + WebSocket Secure (WSS)
- **Status:** 🟢 LIVE

#### URLs de Especificación
- **Health Check:** https://pwa-imbf.onrender.com/health
- **Dashboard:** https://dashboard.render.com/web/srv-d4sqhoeuk2gs73f1ba8g
- **Logs:** Render Dashboard → Logs

---

## 📡 Rutas y Endpoints API Completos

### 🔐 Autenticación

**Headers Requeridos:**
```bash
Authorization: Bearer <JWT_TOKEN>
# O
X-API-Key: <API_KEY>
```

**Formatos de Token Soportados:**
```
cursor_<key>        # Para Cursor IDE
claude_<key>        # Para Claude Desktop
chatgpt_<key>       # Para ChatGPT
custom_<key>        # Para agentes personalizados
```

---

### 📊 Proyectos

#### `GET /api/projects`
**Listar todos los proyectos**

```bash
curl https://pwa-imbf.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "success": true,
  "projects": [
    {
      "id": "uuid-project-1",
      "name": "realtime-voice-system",
      "path": "/projects/realtime-voice-system",
      "status": "active",
      "lock_status": "unlocked",
      "created_at": "2025-12-28T23:42:00Z"
    },
    {
      "id": "uuid-project-2",
      "name": "pwa-ecommerce",
      "status": "active",
      "lock_status": "unlocked"
    },
    {
      "id": "uuid-project-3",
      "name": "ia-assistant",
      "status": "active",
      "lock_status": "unlocked"
    }
  ]
}
```

#### `POST /api/projects`
**Crear nuevo proyecto**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nuevo-proyecto",
    "path": "/path/to/project",
    "description": "Descripción del proyecto"
  }'
```

#### `GET /api/projects/:id`
**Obtener detalles de un proyecto**

```bash
curl https://pwa-imbf.onrender.com/api/projects/realtime-voice-system \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 💡 Propuestas

#### `POST /api/projects/:id/propose`
**Crear propuesta de cambios**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/projects/realtime-voice-system/propose \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Agregar autenticación JWT",
    "description": "Implementar sistema de autenticación JWT",
    "reasoning": "Mejora la seguridad del sistema",
    "files": [
      {
        "path": "src/middleware/auth.js",
        "changes": "Agregar middleware JWT",
        "language": "javascript"
      }
    ]
  }'

# Response:
{
  "success": true,
  "proposal": {
    "id": "prop-uuid-1",
    "project_id": "realtime-voice-system",
    "agent_id": "claude_token",
    "title": "Agregar autenticación JWT",
    "status": "pending",
    "created_at": "2025-12-29T00:10:00Z",
    "review_count": 0,
    "approval_score": null
  }
}
```

#### `GET /api/proposals/:id`
**Obtener propuesta con reviews**

```bash
curl https://pwa-imbf.onrender.com/api/proposals/prop-uuid-1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response incluye:
# - Datos de propuesta
# - Todas las reviews
# - Score agregado
# - Status de consenso
```

---

### ⭐ Reviews y Consenso

#### `POST /api/proposals/:id/review`
**Revisar una propuesta (0-10)**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/proposals/prop-uuid-1/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessment": "Muy buena propuesta con mejoras de seguridad",
    "suggestions": [
      "Agregar rate limiting",
      "Implementar refresh tokens"
    ],
    "score": 8.5,
    "status": "approved"
  }'

# Response:
{
  "success": true,
  "review": {
    "id": "review-uuid",
    "proposal_id": "prop-uuid-1",
    "reviewer_agent_id": "cursor_token",
    "score": 8.5,
    "consensus": "approve",
    "created_at": "2025-12-29T00:12:00Z"
  },
  "proposal_status": {
    "total_reviews": 2,
    "average_score": 8.0,
    "consensus": "approve",
    "can_unify": true
  }
}
```

#### `GET /api/proposals/:id/reviews`
**Obtener todas las reviews de una propuesta**

```bash
curl https://pwa-imbf.onrender.com/api/proposals/prop-uuid-1/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"

# Retorna lista de reviews + consenso agregado
```

---

### 🎯 Unificación de Propuestas

#### `POST /api/proposals/unify`
**Unificar múltiples propuestas en un plan**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/proposals/unify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "realtime-voice-system",
    "proposal_ids": ["prop-uuid-1", "prop-uuid-2"],
    "title": "Plan Integrado de Seguridad y Voz",
    "description": "Unifica propuestas de auth y mejoras de voz",
    "strategy": "Implementar JWT primero, luego mejorar voice"
  }'

# Response:
{
  "success": true,
  "plan": {
    "id": "plan-uuid-1",
    "project_id": "realtime-voice-system",
    "proposal_ids": ["prop-uuid-1", "prop-uuid-2"],
    "status": "draft",
    "approval_score": 8.25,
    "consensus": "approve",
    "created_at": "2025-12-29T00:14:00Z"
  }
}
```

#### `GET /api/plans/:id`
**Obtener detalles del plan**

```bash
curl https://pwa-imbf.onrender.com/api/plans/plan-uuid-1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Incluye:
# - Propuestas incluidas
# - Reviews de consenso
# - Score final
# - Status actual
```

---

### ✅ Aprobación e Implementación

#### `POST /api/plans/:id/approve`
**Aprobar plan para implementación**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/plans/plan-uuid-1/approve \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "success": true,
  "plan": {
    "id": "plan-uuid-1",
    "status": "approved",
    "approval_agent_id": "claude_token",
    "approved_at": "2025-12-29T00:15:00Z"
  }
}
```

#### `POST /api/plans/:id/implement`
**Iniciar implementación (BLOQUEA proyecto)**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/plans/plan-uuid-1/implement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "claude_token",
    "timeout_minutes": 30
  }'

# Response:
{
  "success": true,
  "implementation": {
    "id": "impl-uuid-1",
    "plan_id": "plan-uuid-1",
    "project_id": "realtime-voice-system",
    "status": "started",
    "start_time": "2025-12-29T00:16:00Z",
    "lock_expires_at": "2025-12-29T00:46:00Z"
  },
  "lock_info": {
    "project_locked": true,
    "locked_by": "claude_token",
    "lock_expires_in_minutes": 30,
    "message": "Solo claude_token puede implementar cambios ahora"
  }
}
```

#### `POST /api/implementations/:id/complete`
**Completar implementación (DESBLOQUEA proyecto)**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/implementations/impl-uuid-1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "summary": "Se implementó autenticación JWT exitosamente"
  }'

# Response:
{
  "success": true,
  "implementation": {
    "id": "impl-uuid-1",
    "status": "completed",
    "end_time": "2025-12-29T00:35:00Z"
  },
  "project_unlocked": true
}
```

---

### 📡 WebSocket Real-time

#### Conexión WebSocket

```javascript
const ws = new WebSocket('wss://pwa-imbf.onrender.com');

ws.onopen = () => {
  console.log('Conectado al MCP Server');

  // Suscribirse a un proyecto
  ws.send(JSON.stringify({
    type: 'subscribe_project',
    payload: {
      projectId: 'realtime-voice-system',
      agentId: 'claude_token'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Evento:', message.type, message.payload);
};
```

#### Tipos de Eventos WebSocket

```javascript
// Propuesta creada
{ type: 'proposal_created', payload: { proposalId, agentId } }

// Review creada
{ type: 'review_created', payload: { reviewId, proposalId, score } }

// Plan unificado
{ type: 'plan_created', payload: { planId, proposalCount } }

// Plan aprobado
{ type: 'plan_approved', payload: { planId } }

// Implementación iniciada
{ type: 'implementation_started', payload: { implementationId } }

// Implementación completada
{ type: 'implementation_completed', payload: { implementationId } }

// Proyecto bloqueado
{ type: 'project_locked', payload: { projectId, lockedBy } }

// Proyecto desbloqueado
{ type: 'project_unlocked', payload: { projectId } }
```

---

### 🎤 Sistema de Voz

#### `GET /api/voice/status`
**Estado del sistema de voz**

```bash
curl https://pwa-imbf.onrender.com/api/voice/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "status": "operational",
  "active_sessions": 0,
  "supported_formats": ["wav", "mp3", "ogg"],
  "tts_engine": "native"
}
```

#### `POST /api/voice/tts`
**Text to Speech**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/voice/tts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Propuesta de autenticación aprobada",
    "voice": "es-ES",
    "rate": 1.0
  }'

# Response: Audio stream (audio/wav)
```

#### `POST /api/voice/stream`
**Streaming de voz en tiempo real**

```bash
curl -X POST https://pwa-imbf.onrender.com/api/voice/stream \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @audio.wav

# Response: Transcripción + análisis
```

---

### 📚 Contexto Compartido

#### `GET /api/projects/:id/context`
**Obtener contexto completo del proyecto**

```bash
curl https://pwa-imbf.onrender.com/api/projects/realtime-voice-system/context \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response completo incluye:
{
  "project": { ... },
  "proposals": [ ... ],
  "reviews": [ ... ],
  "plans": [ ... ],
  "active_implementation": { ... },
  "lock_status": { ... },
  "shared_memory": { ... },
  "active_agents": [ ... ]
}
```

#### `GET /api/projects/:id/sync`
**Sincronización ligera (cambios desde timestamp)**

```bash
curl "https://pwa-imbf.onrender.com/api/projects/realtime-voice-system/sync?since=2025-12-29T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Retorna solo cambios recientes para reducir ancho de banda
```

---

## 🔄 Workflow Centralizado Completo

### Fase 1: ANÁLISIS (Múltiples Agentes)

```
┌─────────────────────────────────────────┐
│  CURSOR IDE + CLAUDE + CHATGPT          │
│  (Leen proyecto sin modificar código)   │
└──────────────┬──────────────────────────┘
               │
               ↓
       ┌───────────────┐
       │ GET /context  │
       │ GET /projects │
       └───────┬───────┘
               │
               ↓
    ┌──────────────────────┐
    │ ANALIZAR CÓDIGO      │
    │ IDENTIFICAR PROBLEMAS│
    │ PROPONER CAMBIOS     │
    └──────────┬───────────┘
               │
               ↓
         ┌──────────────────┐
         │ POST /propose    │
         │ Enviar propuesta │
         └────────┬─────────┘
                  │
                  ↓
        ✅ PROPUESTA CREADA
           (estado: pending)
           (sin locks, sin cambios)
```

**Acciones Permitidas:**
- ✅ `GET /context` - Leer información completa
- ✅ `GET /projects` - Listar proyectos
- ✅ `POST /propose` - Crear propuesta

---

### Fase 2: REVISIONES (Otros Agentes)

```
┌─────────────────────────────────────┐
│  OTROS AGENTES                      │
│  (Revisan propuestas de Fase 1)     │
└──────────────┬──────────────────────┘
               │
               ↓
       ┌──────────────────┐
       │ GET /proposals   │
       │ Leer propuestas  │
       └────────┬─────────┘
               │
               ↓
    ┌──────────────────────┐
    │ ANALIZAR IMPACTO     │
    │ EVALUAR CALIDAD      │
    │ SUGERIR MEJORAS      │
    │ PUNTUACIÓN 0-10      │
    └──────────┬───────────┘
               │
               ↓
        ┌──────────────────────┐
        │ POST /review         │
        │ Score + Sugerencias  │
        └──────────┬───────────┘
                   │
                   ↓
         ✅ REVIEW CREADA
            (Consenso calculado)
            (Propuesta evaluada)
```

**Acciones Permitidas:**
- ✅ `GET /proposals/:id` - Leer propuesta
- ✅ `POST /review` - Enviar review
- ✅ Sistema calcula `approval_score` automáticamente

**Métricas de Consenso:**
- `approve` - Si score >= 6.0 y reviews >= 2
- `needs_changes` - Si score 4.0-6.0
- `reject` - Si score < 4.0

---

### Fase 3: UNIFICACIÓN (Sistema)

```
┌──────────────────────────────────────┐
│  SISTEMA MCP                         │
│  (Unifica propuestas evaluadas)      │
└───────────────┬──────────────────────┘
                │
                ↓
    ┌───────────────────────┐
    │ VALIDAR PROPUESTAS    │
    │ ✓ Todas tienen reviews│
    │ ✓ Consenso positivo   │
    │ ✓ No hay conflictos   │
    └────────────┬──────────┘
                 │
                 ↓
    ┌─────────────────────────────┐
    │ MERGE INTELIGENTE           │
    │ • Detecta archivos duplicados
    │ • Resuelve conflictos       │
    │ • Optimiza cambios          │
    │ • Crea matriz de dependencias
    └──────────┬──────────────────┘
               │
               ↓
        ┌─────────────────┐
        │ POST /unify     │
        │ Crear PLAN ÚNICO│
        └────────┬────────┘
                 │
                 ↓
     ✅ PLAN UNIFICADO CREADO
        (estado: draft)
        (approval_score calculado)
        (proposal_ids registrados)
```

**Acciones Permitidas:**
- Sistema automáticamente unifica si:
  - 2+ propuestas pendientes
  - Todas con consenso `approve`
  - Sin conflictos irresolubles

---

### Fase 4: APROBACIÓN (Usuario/Admin)

```
┌──────────────────────────────────┐
│  USUARIO / ADMINISTRADOR         │
│  (Revisa plan unificado)         │
└───────────────┬──────────────────┘
                │
                ↓
       ┌────────────────┐
       │ GET /plans/:id │
       │ Revisar PLAN   │
       └────────┬───────┘
                │
                ↓
    ┌───────────────────────┐
    │ VALIDAR ESTRATEGIA    │
    │ REVISAR CAMBIOS       │
    │ VERIFICAR IMPACTO     │
    └────────────┬──────────┘
                 │
                 ↓
        ┌──────────────────┐
        │ POST /approve    │
        │ Aprobar PLAN     │
        └────────┬─────────┘
                 │
                 ↓
    ✅ PLAN APROBADO
       (estado: approved)
       (listo para implementación)
       (timestamps registrados)
```

**Acciones Permitidas:**
- ✅ `GET /plans/:id` - Ver plan completo
- ✅ `POST /approve` - Aprobar plan

---

### Fase 5: IMPLEMENTACIÓN (UN Agente)

```
┌────────────────────────────────────────┐
│  UN SOLO AGENTE (asignado)             │
│  (Implementa el plan aprobado)         │
└───────────────┬────────────────────────┘
                │
                ↓
    ┌──────────────────────────────┐
    │ POST /implement              │
    │ BLOQUEA proyecto por 30 min  │
    │ Otros agentes SOLO PUEDEN    │
    │ LEER Y OBSERVAR via WebSocket│
    └────────────┬─────────────────┘
                 │
                 ↓
      🔒 PROYECTO BLOQUEADO
         (lock_status: locked)
         (locked_by: agent_id)
         (lock_expires_at: +30min)

    ┌────────────────────────────┐
    │ AGENTE IMPLEMENTA CAMBIOS  │
    │ • Modifica archivos        │
    │ • Ejecuta tests            │
    │ • Verifica funcionalidad   │
    │ • Reporta progreso via API │
    └────────────┬───────────────┘
                 │
                 ↓
       ┌──────────────────────┐
       │ POST /progress       │
       │ Registra cambios     │
       │ Envía logs           │
       └──────────┬───────────┘
                  │
                  ↓
      ✅ CAMBIOS IMPLEMENTADOS
         (files_changed logged)
         (test_results stored)

    ┌──────────────────────────────┐
    │ POST /complete               │
    │ DESBLOQUEA proyecto          │
    │ Otros agentes pueden proceder│
    └────────────┬─────────────────┘
                 │
                 ↓
      🔓 PROYECTO DESBLOQUEADO
         (lock_status: unlocked)
         (status: completed)
         (Broadcast a todos via WebSocket)
```

**Acciones Permitidas Durante Implementación:**

El agente que bloquea:
- ✅ `POST /progress` - Reportar avances
- ✅ `POST /complete` - Finalizar

Otros agentes:
- ✅ `GET /context` - Leer solo (WebSocket sync)
- ✅ WebSocket evento `implementation_in_progress`
- ❌ NO PUEDEN proponer ni implementar

---

### Fase 6: CICLO COMPLETO

```
NEW PROPUESTAS PODEM SER CREADAS
        ↓
┌──────────────────────────────┐
│ Vuelve a Fase 1: ANÁLISIS    │
│ (Nuevo ciclo de mejoras)     │
└──────────────────────────────┘
        ↓
   (Infinito)
```

---

## 🔐 Seguridad y Acceso

### Niveles de Acceso

| Acción | READ | PROPOSE | IMPLEMENT |
|--------|------|---------|-----------|
| Ver contexto | ✅ | ✅ | ✅ |
| Ver propuestas | ✅ | ✅ | ✅ |
| Crear propuesta | ❌ | ✅ | ✅ |
| Revisar propuesta | ✅ | ✅ | ✅ |
| Crear plan | ❌ | ✅ | ✅ |
| Aprobar plan | ❌ | ❌ | ✅ |
| Implementar | ❌ | ❌ | ✅ |

### Project Locking

```javascript
// Cuando un agente implementa:
{
  lock_status: 'locked',
  locked_by: 'claude_token',
  locked_at: '2025-12-29T00:16:00Z',
  lock_expires_at: '2025-12-29T00:46:00Z'  // 30 min después
}

// Otros agentes ven:
// ❌ No pueden crear propuestas
// ❌ No pueden crear planes
// ✅ Pueden leer todo
// ✅ Pueden ver cambios en tiempo real
```

### Rate Limiting

```
Límite: 100 requests/minuto por agente
Algoritmo: Sliding window
Reset: Automático después de 60 segundos
```

---

## 📊 Proyectos Cargados

### 1. **realtime-voice-system**
- **Tipo:** Sistema de voz en tiempo real
- **Status:** Activo ✅
- **Función:** Integración de voz con MCP
- **APIs:** `/api/voice/*`

### 2. **pwa-ecommerce**
- **Tipo:** Aplicación PWA de e-commerce
- **Status:** Activo ✅
- **Función:** Interfaz de usuario centralizada
- **URL:** https://pwa-chi-six.vercel.app

### 3. **ia-assistant**
- **Tipo:** Asistente IA
- **Status:** Activo ✅
- **Función:** Procesamiento y análisis
- **APIs:** `/api/projects/ia-assistant/*`

---

## 🗄️ Base de Datos - NEON PostgreSQL

### Tablas Principales

```sql
-- Proyectos
projects (id, name, path, status, lock_status, locked_by, lock_expires_at)

-- Propuestas
proposals (id, project_id, agent_id, title, status, review_count, approval_score)

-- Reviews
proposal_reviews (id, proposal_id, reviewer_agent_id, score, consensus, status)

-- Planes unificados
unified_plans (id, project_id, proposal_ids[], status, approval_score, approval_agent_id)

-- Implementaciones
implementations (id, plan_id, project_id, agent_id, status, start_time, end_time)

-- Logs de cambios
change_logs (id, project_id, entity_type, entity_id, old_values, new_values, changed_by)

-- Sesiones de agentes
agent_sessions (id, agent_id, project_id, status, connected_at, last_activity)

-- Memoria compartida
shared_memory (project_id, key, value, visibility, created_by, updated_at)
```

---

## 🚀 Deployment y Monitoreo

### Servidor en Producción

```
URL: https://pwa-imbf.onrender.com
Plataforma: Render.com
Tipo: Web Service
Región: USA
Instancia: Small (4GB RAM)
Auto-Deploy: Habilitado en main branch
```

### Monitoreo

```bash
# Health Check
curl https://pwa-imbf.onrender.com/health

# Proyectos
curl https://pwa-imbf.onrender.com/api/projects \
  -H "Authorization: Bearer TOKEN"

# Dashboard: https://dashboard.render.com
```

---

## 🎯 Resumen Arquitectónico

```
✅ Múltiples agentes IA coordinados
✅ Propuestas y reviews distribuidas
✅ Unificación automática de cambios
✅ Un único agente implementa (sin conflictos)
✅ WebSocket para sincronización real-time
✅ NEON PostgreSQL para persistencia
✅ Project locking para evitar race conditions
✅ Auditoría completa de cambios
✅ Dominio centralizado (guestsvalencia.es)
✅ Interfaz web (PWA) integrada
✅ Sistema de voz integrado
```

---

**Version:** 1.0.0 (Production)
**Status:** 🟢 LIVE & OPERATIONAL
**Last Updated:** 2025-12-29
**Servidor:** https://pwa-imbf.onrender.com
**Dominio:** guestsvalencia.es (Centralizado)

---

🚀 **MCP ORCHESTRATOR UNIVERSAL - SISTEMA CENTRALIZADO DE GOBIERNO MULTI-AGENTE**
