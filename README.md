# 🚀 MCP Orchestrator

**Sistema de Orquestación Multi-Agente IA para Gobierno de Proyectos**

Control centralizado para múltiples agentes IA (Cursor, Claude, ChatGPT, VS Code, etc.) trabajando en los mismos proyectos sin conflictos.

## ⚡ Quick Start

```bash
# 1. Setup inicial
npm install
node scripts/setup.js

# 2. Editar .env con tus credenciales
# NEON_DATABASE_URL, JWT_SECRET, API_KEYS, etc.

# 3. Iniciar servidor local
npm run dev

# Acceder en: http://localhost:3000
```

## 🏗️ Arquitectura

```
┌─ Agentes IA (Cursor, Claude, VS Code, etc.)
│       ↓ MCP Protocol + REST API
├─ Servidor MCP Local (3000)
│       ├── Control de acceso (READ/PROPOSE/IMPLEMENT)
│       ├── Gestión de proyectos
│       ├── Cola de propuestas
│       └── WebSocket (sync real-time)
│       ↓ HTTP/WebSocket
└─ NEON PostgreSQL (Memoria Persistente)
```

## 📋 Workflow Principal

### Fase 1: ANÁLISIS
```
Múltiples agentes LEEN el proyecto → Crean PROPUESTAS de cambios
(Ninguno modifica código aún)
```

### Fase 2: REVISIONES
```
Otros agentes REVISAN propuestas → Dejan sugerencias
```

### Fase 3: UNIFICACIÓN
```
Sistema unifica propuestas → Genera PLAN ÚNICO óptimo
```

### Fase 4: APROBACIÓN
```
Usuario aprueba plan → Sistema genera PLAN FINAL
```

### Fase 5: IMPLEMENTACIÓN
```
UN SOLO agente implementa → Sistema BLOQUEA proyecto
(Otros agentes ven cambios en tiempo real via WebSocket)
```

## 🎯 Endpoints Principales

### Proyectos
```bash
GET    /api/projects              # Listar todos
POST   /api/projects              # Crear nuevo
GET    /api/projects/:id          # Detalles
```

### Propuestas
```bash
POST   /api/projects/:id/propose  # Crear propuesta
GET    /api/proposals/:id         # Obtener propuesta
POST   /api/proposals/:id/review  # Revisar propuesta
```

### Planes
```bash
POST   /api/proposals/unify       # Unificar propuestas
POST   /api/plans/:id/approve     # Aprobar plan
POST   /api/plans/:id/implement   # Implementar
```

### Contexto
```bash
GET    /api/projects/:id/context  # Contexto compartido
GET    /api/projects/:id/read     # Modo lectura
```

## 🔧 Variables de Entorno

```bash
# Base de datos
NEON_DATABASE_URL=postgresql://...

# Seguridad
JWT_SECRET=tu-secreto-super-seguro
API_KEYS_SALT=salt-para-hashing

# Proyectos
PROJECTS_BASE_PATH=/Users/tu-usuario/Projects
REGISTRY_PATH=./config/projects-registry.json

# Render (Producción)
RENDER_SERVICE_URL=https://mcp-orch.render.com
RENDER_API_KEY=...
```

## 📦 Dependencias Principales

- **Express.js** - Framework HTTP
- **WebSocket (ws)** - Comunicación real-time
- **Neon PostgreSQL** - Base de datos serverless
- **JWT** - Autenticación
- **dotenv** - Gestión de variables

## 🚀 Deployment

### Local
```bash
npm run dev
```

### Render
1. Conectar repositorio GitHub
2. Crear Web Service en Render
3. Configurar variables de entorno
4. Deploy automático en cada push

## 📚 Documentación Completa

Ver `MCP_ORCHESTRATOR_PRO.md` para documentación técnica exhaustiva:
- Arquitectura detallada
- Schema NEON
- APIs completas
- Skills para editores
- Casos de uso
- Troubleshooting

## 🛠️ Scripts

```bash
npm start              # Iniciar servidor
npm run dev            # Desarrollo con nodemon
npm run setup          # Setup inicial
npm test               # Tests
```

## 🤝 Agentes Soportados

- ✅ Cursor
- ✅ VS Code
- ✅ Claude Desktop
- ✅ ChatGPT (vía API)
- ✅ Gemini
- ✅ QWEN
- ✅ Cualquier agente con MCP Protocol

## ⚙️ Configuración por Agente

Cada agente se conecta via:

```json
{
  "mcpServers": {
    "project-orchestrator": {
      "command": "node",
      "args": ["path/to/universal-skill.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "AGENT_NAME": "cursor"
      }
    }
  }
}
```

## 🔒 Seguridad

- ✅ JWT token-based auth
- ✅ API keys por agente
- ✅ Rate limiting (100 req/min)
- ✅ HTTPS/WSS en producción
- ✅ No almacena credenciales en client

## 📊 Monitoreo

```bash
GET /health          # Health check
GET /api/projects    # Status de todos los proyectos
```

## 🐛 Debugging

```bash
LOG_LEVEL=debug npm run dev
```

Logs en: `./logs/mcp-orchestrator.log`

## 📞 Support

- 📖 Documentación: Ver `MCP_ORCHESTRATOR_PRO.md`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Tu servidor]

---

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-01-01

🚀 **LET'S GO BUILD AMAZING THINGS WITH MULTI-AGENT AI**
