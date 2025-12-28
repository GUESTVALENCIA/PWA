# 🚀 MCP ORCHESTRATOR - ESPECIFICACIÓN PROFESIONAL COMPLETA

**Versión**: 2.0.0 PRO
**Status**: 📋 Especificación Completa (Listo para implementación con CloudeCode + Sonnet 4.5)
**Objetivo**: Sistema de orquestación multi-IA que previene conflictos y centraliza gobierno de proyectos

---

## 📑 ÍNDICE EJECUTIVO

```
1. ARQUITECTURA DEL SISTEMA
   1.1 Visión General
   1.2 Componentes Principales
   1.3 Stack Tecnológico

2. SERVIDOR MCP CENTRAL
   2.1 Estructura de Directorios
   2.2 Dependencias
   2.3 Configuración Inicial
   2.4 Esquema NEON

3. SKILLS PARA EDITORES
   3.1 Skill Universal MCP
   3.2 Integración Cursor
   3.3 Integración VS Code
   3.4 Integración Claude Desktop

4. API REST COMPLETA
   4.1 Autenticación
   4.2 Endpoints de Proyectos
   4.3 Endpoints de Propuestas
   4.4 Endpoints de Revisiones
   4.5 Endpoints de Unificación
   4.6 Endpoints de Implementación

5. WORKFLOW DE IMPLEMENTACIÓN
   5.1 Flujo Paso a Paso
   5.2 Casos de Uso Detallados
   5.3 Manejo de Conflictos

6. GUÍA DE DEPLOYMENT
   6.1 Local (Desarrollo)
   6.2 Render (Producción)
   6.3 Sincronización Multi-Agente

7. CHECKLIST DE IMPLEMENTACIÓN
   7.1 Componentes a Crear
   7.2 Validación
   7.3 Testing
```

---

# 1. ARQUITECTURA DEL SISTEMA

## 1.1 Visión General

El MCP Orchestrator es un **sistema de control central** que gestiona múltiples agentes IA (Cursor, Claude, ChatGPT, VS Code, etc.) trabajando sobre los mismos proyectos, previniendo conflictos y garantizando coherencia.

### Principios Core

✅ **Centralización**: Un servidor controla TODO
✅ **Gobernanza**: Reglas claras de qué puede hacer cada agente
✅ **Trazabilidad**: TODO se registra en NEON
✅ **Prevención de Conflictos**: Solo 1 agente implementa a la vez
✅ **Memoria Compartida**: Todos los agentes ven el mismo contexto
✅ **Escalabilidad**: Desde 1 proyecto hasta 100+

## 1.2 Componentes Principales

```
┌──────────────────────────────────────────────────────┐
│           CAPA DE AGENTES IA                         │
│  Cursor | VS Code | Claude | ChatGPT | Gemini       │
└──────────────────┬───────────────────────────────────┘
                   │ MCP Protocol + REST
                   ▼
┌──────────────────────────────────────────────────────┐
│         SERVIDOR MCP LOCAL (3000)                    │
│  • Router de peticiones                              │
│  • Control de acceso                                 │
│  • Gestión de estado                                 │
│  • Validación de cambios                             │
└──────────────────┬───────────────────────────────────┘
                   │ Sync HTTP/WebSocket
                   ▼
┌──────────────────────────────────────────────────────┐
│         RENDER CLOUD (Producción)                    │
│  • API REST Gateway                                  │
│  • NEON PostgreSQL (Memoria)                        │
│  • WebSocket Real-time                              │
│  • Redis Cache (Opcional)                           │
└──────────────────────────────────────────────────────┘
```

## 1.3 Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|-----------|------------|---------|----------|
| **Backend** | Node.js | 20+ | Servidor MCP |
| **Framework** | Express.js | 4.18+ | API REST |
| **DB Principal** | Neon PostgreSQL | Serverless | Memoria persistente |
| **Cache** | Redis | Opcional | Colas y caché |
| **Comunicación** | MCP Protocol | 1.0 | Agentes locales |
| **Sync Real-time** | WebSocket | WS 8.14+ | Actualizaciones vivas |
| **Seguridad** | JWT | 9.0+ | Autenticación |
| **Deployment** | Render | - | Producción |

---

# 2. SERVIDOR MCP CENTRAL

## 2.1 Estructura de Directorios

```
mcp-orchestrator/
│
├── server.js                          ← Punto de entrada principal
├── package.json                       ← Dependencias
├── .env                              ← Variables de entorno (NO en git)
├── .env.example                      ← Ejemplo para setup
├── .gitignore                        ← Archivos ignorados
│
├── config/
│   ├── database.js                   ← Conexión NEON
│   ├── projects-registry.json        ← Registro de proyectos locales
│   ├── agents-config.json            ← Configuración de agentes
│   └── mcp-server-config.json        ← Config protocolo MCP
│
├── src/
│   ├── core/
│   │   ├── mcp-server.js             ← Servidor MCP principal
│   │   ├── project-manager.js        ← Gestión de proyectos
│   │   ├── state-manager.js          ← Estado global compartido
│   │   └── event-emitter.js          ← Sistema de eventos
│   │
│   ├── middleware/
│   │   ├── auth.js                   ← Validación API keys
│   │   ├── project-detector.js       ← Detecta proyecto actual
│   │   ├── access-control.js         ← Control de permisos READ/PROPOSE/IMPLEMENT
│   │   ├── rate-limiter.js           ← Rate limiting (100 req/min)
│   │   └── error-handler.js          ← Manejo centralizado errores
│   │
│   ├── routes/
│   │   ├── index.js                  ← Router principal
│   │   ├── projects.js               ← GET /api/projects
│   │   ├── read.js                   ← GET /api/projects/:id/read
│   │   ├── propose.js                ← POST /api/projects/:id/propose
│   │   ├── review.js                 ← POST /api/proposals/:id/review
│   │   ├── unify.js                  ← POST /api/proposals/unify
│   │   ├── implement.js              ← POST /api/plans/:id/implement
│   │   └── context.js                ← GET /api/projects/:id/context
│   │
│   ├── services/
│   │   ├── neon-service.js           ← Operaciones NEON DB
│   │   ├── proposal-service.js       ← Crear/gestionar propuestas
│   │   ├── review-service.js         ← Procesar revisiones
│   │   ├── unification-service.js    ← Unificar propuestas en plan
│   │   ├── implementation-service.js ← Ejecutar implementaciones
│   │   ├── context-builder.js        ← Construir contexto compartido
│   │   ├── file-watcher.js           ← Vigilar cambios en archivos
│   │   └── sync-service.js           ← Sincronización con Render
│   │
│   ├── models/
│   │   ├── Project.js                ← Modelo Proyecto
│   │   ├── Proposal.js               ← Modelo Propuesta
│   │   ├── Review.js                 ← Modelo Revisión
│   │   ├── Plan.js                   ← Modelo Plan Unificado
│   │   └── Implementation.js         ← Modelo Implementación
│   │
│   ├── utils/
│   │   ├── logger.js                 ← Sistema de logs
│   │   ├── diff-generator.js         ← Generar diffs entre archivos
│   │   ├── code-analyzer.js          ← Analizar cambios de código
│   │   ├── validators.js             ← Validaciones de datos
│   │   └── constants.js              ← Constantes globales
│   │
│   └── websocket/
│       ├── socket-server.js          ← Servidor WebSocket
│       └── handlers.js               ← Manejadores de eventos WS
│
├── skills/
│   ├── universal-mcp-skill/
│   │   ├── index.js                  ← Skill base universal
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── cursor-integration/
│   │   ├── .cursor/mcp.json          ← Config Cursor
│   │   └── install.sh
│   │
│   ├── vscode-integration/
│   │   ├── extension.js              ← Extension VS Code
│   │   └── package.json
│   │
│   └── claude-desktop-integration/
│       └── mcp-config.json           ← Config Claude Desktop
│
├── database/
│   ├── schema.sql                    ← Esquema NEON completo
│   ├── migrations/
│   │   └── 001-initial-schema.sql
│   └── seed.sql                      ← Datos iniciales
│
├── scripts/
│   ├── setup.js                      ← Setup inicial
│   ├── create-project.js             ← Crear nuevo proyecto
│   ├── sync-to-render.js             ← Deploy a Render
│   └── test-connection.js            ← Probar conexiones
│
├── tests/
│   ├── unit/
│   │   ├── proposal-service.test.js
│   │   ├── unification-service.test.js
│   │   └── access-control.test.js
│   ├── integration/
│   │   └── workflow.test.js
│   └── e2e/
│       └── full-scenario.test.js
│
├── logs/
│   └── mcp-orchestrator.log          ← Logs de ejecución
│
└── README.md                         ← Documentación proyecto
```

## 2.2 Dependencias

### package.json

```json
{
  "name": "mcp-orchestrator",
  "version": "1.0.0",
  "description": "Sistema de orquestación multi-agente IA para gobierno de proyectos",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "setup": "node scripts/setup.js",
    "migrate": "node database/migrate.js",
    "deploy": "bash scripts/deploy.sh",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "lint": "eslint src/ --fix",
    "format": "prettier --write src/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@neondatabase/serverless": "^0.9.0",
    "ws": "^8.14.2",
    "uuid": "^9.0.1",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "diff": "^5.1.0",
    "chokidar": "^3.5.3",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/node": "^20.10.5",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

## 2.3 Configuración Inicial

### .env.example

```bash
# ========== SERVIDOR LOCAL ==========
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=info

# ========== BASE DE DATOS NEON ==========
NEON_DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/mcp_orchestrator?sslmode=require
NEON_PROJECT_ID=proj_xxxxx

# ========== RENDER PRODUCCIÓN ==========
RENDER_SERVICE_URL=https://mcp-orch.render.com
RENDER_API_KEY=rnd_xxxxxxxxxxxxxx

# ========== SEGURIDAD ==========
JWT_SECRET=tu-super-secreto-jwt-muy-largo-y-seguro-min-32-chars
API_KEYS_SALT=tu-salt-para-hashing-api-keys

# ========== API KEYS AGENTES (auto-generadas en setup) ==========
API_KEY_CURSOR=cursor_sk_live_xxxxxxxxxxxxxxxx
API_KEY_CLAUDE=claude_sk_live_xxxxxxxxxxxxxxxx
API_KEY_CHATGPT=chatgpt_sk_live_xxxxxxxxxxxxxxxx
API_KEY_QWEN=qwen_sk_live_xxxxxxxxxxxxxxxx
API_KEY_GEMINI=gemini_sk_live_xxxxxxxxxxxxxxxx

# ========== RATE LIMITING ==========
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# ========== WEBSOCKET ==========
WS_PORT=3001
WS_PATH=/ws

# ========== PATHS LOCALES ==========
PROJECTS_BASE_PATH=C:/Users/TuUsuario/Projects
REGISTRY_PATH=./config/projects-registry.json

# ========== VARIAS (MCP + NEON) ==========
VARIABLES_FILE_PATH=C:/Users/clayt/Desktop/VARIABLESFULL.txt
SYNC_INTERVAL=300000
```

## 2.4 Esquema NEON PostgreSQL

### database/schema.sql

```sql
-- ========== PROYECTOS ==========
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  path TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, archived, locked
  lock_status VARCHAR(50) DEFAULT 'unlocked', -- unlocked, locked_by_agent
  locked_by_agent VARCHAR(100),
  locked_at TIMESTAMP,
  current_context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== PROPUESTAS DE CAMBIO ==========
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  files_changed JSONB, -- [{path, current_code, proposed_code, diff}]
  reasoning TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, approved, implemented, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== REVISIONES DE PROPUESTAS ==========
CREATE TABLE proposal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  reviewer_agent VARCHAR(100) NOT NULL,
  assessment TEXT NOT NULL,
  suggestions JSONB, -- Array de sugerencias
  score INTEGER, -- 0-10
  conflicts JSONB,
  improvements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== PLANES UNIFICADOS ==========
CREATE TABLE unified_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_ids UUID[] NOT NULL,
  final_plan JSONB NOT NULL, -- Plan completo unificado
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  approved_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, implemented, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== IMPLEMENTACIONES ==========
CREATE TABLE implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES unified_plans(id) ON DELETE CASCADE,
  implemented_by VARCHAR(100) NOT NULL,
  files_changed TEXT[], -- Array de archivos modificados
  changes_summary TEXT,
  tests_pass BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== MEMORIA COMPARTIDA (CONTEXTO) ==========
CREATE TABLE shared_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB,
  last_updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, key)
);

-- ========== LOGS DE CAMBIOS ==========
CREATE TABLE change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  agent_name VARCHAR(100),
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== ÍNDICES PARA PERFORMANCE ==========
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_reviews_proposal ON proposal_reviews(proposal_id);
CREATE INDEX idx_unified_plans_project ON unified_plans(project_id);
CREATE INDEX idx_shared_memory_project ON shared_memory(project_id);
CREATE INDEX idx_change_logs_project ON change_logs(project_id);
```

---

# 3. SKILLS PARA EDITORES

## 3.1 Skill Universal MCP

### skills/universal-mcp-skill/index.js

Este skill es la base que se adapta para cada editor (Cursor, VS Code, Claude Desktop).

```javascript
/**
 * Universal MCP Skill
 * Se ejecuta antes de CUALQUIER operación de archivo
 * Intercepta reads/writes y consulta el servidor MCP
 */

class ProjectOrchestratorSkill {
  constructor(mcpServerUrl = 'http://localhost:3000') {
    this.mcpServerUrl = mcpServerUrl;
    this.projectId = null;
    this.agentName = null;
    this.permissions = { read: false, propose: false, implement: false };
  }

  /**
   * Detecta proyecto desde el path del archivo
   */
  detectProjectFromPath(filePath) {
    // Lógica para extraer project ID del path
    // C:/Projects/pwa-ecommerce/src/... → "pwa-ecommerce"
    const match = filePath.match(/Projects[\\\/]([^\\\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * INTERCEPTOR: Antes de LEER archivo
   */
  async beforeFileRead(filePath) {
    this.projectId = this.detectProjectFromPath(filePath);

    if (!this.projectId) {
      throw new Error('❌ No se puede detectar el proyecto del path');
    }

    try {
      // Consulta permisos al servidor MCP
      const response = await fetch(
        `${this.mcpServerUrl}/api/projects/${this.projectId}/permissions`,
        {
          method: 'GET',
          headers: { 'X-Agent': this.agentName }
        }
      );

      if (!response.ok) {
        throw new Error(`Servidor MCP: ${response.statusText}`);
      }

      this.permissions = await response.json();

      if (!this.permissions.read) {
        throw new Error('❌ Lectura bloqueada en este proyecto');
      }

      return {
        allowed: true,
        message: `✅ Leyendo desde ${this.projectId}`
      };
    } catch (error) {
      console.error('Error al consultar permisos:', error);
      throw error;
    }
  }

  /**
   * INTERCEPTOR: Antes de ESCRIBIR archivo
   * ⚠️ Bloquea escritura directa y redirige a propuesta
   */
  async beforeFileWrite(filePath, content) {
    this.projectId = this.detectProjectFromPath(filePath);

    // Primero verifica si puede escribir
    const canImplement = await this.checkImplementationPermission();

    if (!canImplement) {
      // NO puede escribir, debe crear propuesta
      const proposal = await this.createProposal(filePath, content);

      return {
        blocked: true,
        message: `📋 Propuesta #${proposal.id} creada en lugar de escritura directa`,
        proposalUrl: `${this.mcpServerUrl}/proposals/${proposal.id}`,
        action: 'REDIRECT_TO_PROPOSAL'
      };
    }

    // Si tiene permisos de implementación, permite escritura
    return {
      allowed: true,
      message: `✅ Implementando según plan aprobado`
    };
  }

  /**
   * Verifica si el agente actual puede implementar
   */
  async checkImplementationPermission() {
    try {
      const response = await fetch(
        `${this.mcpServerUrl}/api/projects/${this.projectId}/can-implement`,
        {
          method: 'POST',
          headers: {
            'X-Agent': this.agentName,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.ok && (await response.json()).allowed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Crea una propuesta de cambio en servidor MCP
   */
  async createProposal(filePath, proposedContent) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/projects/${this.projectId}/propose`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent': this.agentName
        },
        body: JSON.stringify({
          title: `Cambio en ${filePath}`,
          files: [{
            path: filePath,
            proposedContent: proposedContent
          }],
          reasoning: `Propuesta de ${this.agentName} para modificar ${filePath}`
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Error creando propuesta: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * MCP Tool: Leer proyecto
   */
  async tool_project_read({ projectId, filePath }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/projects/${projectId}/read`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Crear propuesta
   */
  async tool_project_propose({ projectId, title, files, reasoning }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/projects/${projectId}/propose`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, files, reasoning })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Revisar propuesta
   */
  async tool_proposal_review({ proposalId, assessment, suggestions, score }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/proposals/${proposalId}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment, suggestions, score })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Unificar propuestas
   */
  async tool_plan_unify({ proposalIds, strategy }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/proposals/unify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalIds, strategy })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Implementar plan
   */
  async tool_plan_implement({ planId, agentId }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/plans/${planId}/implement`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      }
    );
    return response.json();
  }
}

export { ProjectOrchestratorSkill };
```

## 3.2 Integración Cursor

### skills/cursor-integration/.cursor/mcp.json

```json
{
  "mcpServers": {
    "project-orchestrator": {
      "command": "node",
      "args": ["../universal-mcp-skill/index.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "AGENT_NAME": "cursor",
        "AUTO_PROPOSE": "true",
        "LOG_LEVEL": "info"
      }
    }
  },
  "tools": {
    "before_file_access": "project-orchestrator",
    "before_file_write": "project-orchestrator"
  }
}
```

## 3.3 Integración VS Code

### skills/vscode-integration/extension.js

```javascript
// Extensión VS Code que actúa como cliente MCP
import * as vscode from 'vscode';
import { ProjectOrchestratorSkill } from '../universal-mcp-skill/index.js';

let skill;

export function activate(context) {
  skill = new ProjectOrchestratorSkill();
  skill.agentName = 'vscode';

  // Interceptar cambios en archivos
  vscode.workspace.onDidChangeTextDocument((event) => {
    handleFileChange(event);
  });

  // Interceptar guardados
  vscode.workspace.onWillSaveTextDocument((event) => {
    event.waitUntil(handleFileSave(event));
  });

  console.log('✅ Project Orchestrator VS Code extension activated');
}

async function handleFileChange(event) {
  const filePath = event.document.fileName;

  try {
    const permission = await skill.beforeFileRead(filePath);
    if (!permission.allowed) {
      vscode.window.showWarningMessage(`⚠️ ${permission.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`❌ ${error.message}`);
  }
}

async function handleFileSave(event) {
  const filePath = event.document.fileName;
  const content = event.document.getText();

  try {
    const result = await skill.beforeFileWrite(filePath, content);

    if (result.blocked) {
      event.waitUntil(
        vscode.window.showInformationMessage(
          `📋 ${result.message}`,
          'Ver Propuesta'
        ).then((choice) => {
          if (choice === 'Ver Propuesta') {
            vscode.commands.executeCommand('vscode.open',
              vscode.Uri.parse(result.proposalUrl)
            );
          }
        })
      );

      // Revert document
      event.document.save = false;
    }
  } catch (error) {
    vscode.window.showErrorMessage(`❌ ${error.message}`);
    event.document.save = false;
  }
}

export function deactivate() {}
```

## 3.4 Integración Claude Desktop

### skills/claude-desktop-integration/mcp-config.json

```json
{
  "mcpServers": {
    "project-orchestrator": {
      "command": "npx",
      "args": ["@anthropic-sdk/mcp", "--port", "3000"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "AGENT_NAME": "claude-desktop",
        "ENABLE_TOOLS": "true"
      }
    }
  },
  "resources": [
    {
      "uri": "project://projects",
      "name": "Proyectos"
    }
  ],
  "tools": [
    {
      "name": "project_read",
      "description": "Lee archivos de un proyecto"
    },
    {
      "name": "project_propose",
      "description": "Crea una propuesta de cambios"
    },
    {
      "name": "proposal_review",
      "description": "Revisa propuesta de otro agente"
    },
    {
      "name": "plan_unify",
      "description": "Unifica propuestas en un plan"
    },
    {
      "name": "plan_implement",
      "description": "Implementa plan aprobado"
    }
  ]
}
```

---

# 4. API REST COMPLETA

## 4.1 Autenticación

Todas las peticiones deben incluir header:
```
Authorization: Bearer <API_KEY>
```

API Keys se generan durante setup y se guardan en .env

## 4.2 Endpoints de Proyectos

### GET /api/projects

Lista todos los proyectos registrados

**Request**:
```bash
curl -H "Authorization: Bearer cursor_sk_live_xxx" \
  http://localhost:3000/api/projects
```

**Response**:
```json
{
  "projects": [
    {
      "id": "uuid-123",
      "name": "pwa-ecommerce",
      "status": "active",
      "lock_status": "unlocked",
      "last_change": "2025-01-01T10:00:00Z",
      "context": {
        "lastAgentToModify": "claude",
        "lastImplementation": {
          "planId": "plan-42",
          "files": ["src/auth/login.tsx"],
          "timestamp": "2025-01-01T09:30:00Z"
        }
      }
    }
  ]
}
```

### GET /api/projects/:projectId/context

Obtiene contexto compartido del proyecto

**Response**:
```json
{
  "projectId": "pwa-ecommerce",
  "currentState": "available",
  "lastChanges": {
    "date": "2025-01-01T10:00:00Z",
    "files": ["src/auth/login.tsx", "src/auth/validators.ts"],
    "implementedBy": "claude",
    "summary": "Se añadió validación de email..."
  },
  "activePlan": null,
  "permissions": {
    "read": true,
    "propose": true,
    "implement": false
  }
}
```

## 4.3 Endpoints de Propuestas

### POST /api/projects/:projectId/propose

Crea una propuesta de cambios

**Request**:
```json
{
  "title": "Validación de email en login",
  "description": "Mejorar seguridad validando formato de email",
  "files": [
    {
      "path": "src/auth/login.tsx",
      "currentCode": "// código actual",
      "proposedCode": "// código propuesto",
      "diff": "--- a/src/auth/login.tsx\n+++ b/src/auth/login.tsx"
    }
  ],
  "reasoning": "Previene errores de input inválido"
}
```

**Response**:
```json
{
  "id": "prop-42",
  "projectId": "pwa-ecommerce",
  "agentName": "cursor",
  "status": "pending",
  "createdAt": "2025-01-01T10:15:00Z",
  "viewUrl": "http://localhost:3000/proposals/prop-42"
}
```

### GET /api/proposals/:proposalId

Obtiene detalles de una propuesta

**Response**:
```json
{
  "id": "prop-42",
  "projectId": "pwa-ecommerce",
  "agentName": "cursor",
  "title": "Validación de email en login",
  "status": "reviewed",
  "files": [...],
  "reviews": [
    {
      "agent": "claude",
      "assessment": "Buena idea pero...",
      "suggestions": [
        "Usar validator.js",
        "Añadir tests"
      ],
      "score": 8
    },
    {
      "agent": "chatgpt",
      "assessment": "Coincido con Claude",
      "score": 9
    }
  ],
  "createdAt": "2025-01-01T10:15:00Z"
}
```

## 4.4 Endpoints de Revisiones

### POST /api/proposals/:proposalId/review

Un agente revisa una propuesta

**Request**:
```json
{
  "assessment": "Buena idea pero falta sanitización XSS",
  "suggestions": [
    "Validar dominio del email",
    "Sanitizar inputs",
    "Añadir rate limiting"
  ],
  "score": 8,
  "conflicts": [],
  "improvements": "Considerar usar validator.js library"
}
```

**Response**:
```json
{
  "reviewId": "rev-123",
  "proposalId": "prop-42",
  "reviewerAgent": "claude",
  "status": "recorded",
  "proposal_status": "reviewed",
  "message": "✅ Revisión registrada"
}
```

## 4.5 Endpoints de Unificación

### POST /api/proposals/unify

Unifica múltiples propuestas en un plan único

**Request**:
```json
{
  "projectId": "pwa-ecommerce",
  "proposalIds": ["prop-42"],
  "strategy": "merge_best_practices"
}
```

**Response**:
```json
{
  "planId": "plan-42",
  "projectId": "pwa-ecommerce",
  "status": "pending_approval",
  "unifiedPlan": {
    "files": [
      {
        "path": "src/auth/login.tsx",
        "changes": [
          "Validar email (Cursor)",
          "Validar dominio (Claude)",
          "Sanitizar XSS (Claude)",
          "Usar validator.js (ChatGPT)"
        ],
        "finalCode": "..."
      },
      {
        "path": "src/auth/validators.ts",
        "type": "new",
        "content": "..."
      }
    ]
  },
  "reviewUrl": "http://localhost:3000/plans/plan-42"
}
```

### POST /api/plans/:planId/approve

Aprueba un plan para implementación

**Request**:
```json
{
  "approvedBy": "user"
}
```

**Response**:
```json
{
  "planId": "plan-42",
  "status": "approved",
  "message": "✅ Plan aprobado. Listo para implementación."
}
```

## 4.6 Endpoints de Implementación

### POST /api/plans/:planId/implement

Un agente implementa un plan aprobado

**Request**:
```json
{
  "agentId": "claude"
}
```

**Response**:
```json
{
  "implementationId": "impl-123",
  "planId": "plan-42",
  "status": "implementing",
  "message": "🔒 Proyecto bloqueado para Claude. Implementando...",
  "unlockUrl": "http://localhost:3000/implementations/impl-123/unlock"
}
```

### POST /api/implementations/:implementationId/complete

Marca una implementación como completada

**Request**:
```json
{
  "filesChanged": ["src/auth/login.tsx", "src/auth/validators.ts"],
  "testsPassed": true,
  "summary": "Se añadió validación de email, dominio y XSS protection"
}
```

**Response**:
```json
{
  "implementationId": "impl-123",
  "status": "completed",
  "message": "✅ Implementación completada. Proyecto desbloqueado.",
  "changesSync": "Sincronizando con NEON...",
  "notifyAgents": "Notificando a todos los agentes..."
}
```

---

# 5. WORKFLOW DE IMPLEMENTACIÓN

## 5.1 Flujo Paso a Paso

### Escenario: Múltiples IAs mejorando un sistema de autenticación

```
FASE 1: ANÁLISIS
─────────────────

1. TÚ en Cursor: "Mejora validación de login"
   ↓
   Cursor conecta a MCP local (3000)
   ↓
   Detecta proyecto: "pwa-ecommerce"
   ↓
   MCP consulta estado en NEON
   ↓
   Cursor lee código (permisos: READ ✅, PROPOSE ✅, IMPLEMENT ❌)

2. Cursor intenta escribir código
   ↓
   INTERCEPTADO por beforeFileWrite hook
   ↓
   Cursor crea PROPUESTA #42

FASE 2: REVISIONES
──────────────────

3. TÚ con Claude: "Revisa propuesta de Cursor"
   ↓
   Claude accede: GET /api/proposals/42
   ↓
   Claude analiza y deja revisión:
   - Score: 8/10
   - Sugerencias: sanitización XSS, rate limiting

4. TÚ con ChatGPT: "También revisa"
   ↓
   ChatGPT revisa:
   - Score: 9/10
   - Sugerencias: usar validator.js, tests unitarios

FASE 3: UNIFICACIÓN
───────────────────

5. TÚ: "Unifica las ideas"
   ↓
   Claude actúa como orquestador
   ↓
   POST /api/proposals/42/unify
   ↓
   Se genera PLAN UNIFICADO que combina:
   - Idea de Cursor
   - Sugerencias de Claude
   - Sugerencias de ChatGPT

FASE 4: APROBACIÓN
──────────────────

6. TÚ: "Aprueba el plan"
   ↓
   POST /api/plans/42/approve
   ↓
   Plan estado = "approved"

FASE 5: IMPLEMENTACIÓN
──────────────────────

7. TÚ con Claude: "Implementa el plan"
   ↓
   Claude solicita: POST /api/plans/42/implement
   ↓
   MCP:
   - 🔒 BLOQUEA proyecto SOLO para Claude
   - Cambia estado a "IMPLEMENTING by Claude"
   - Inicia timer (30 min máx)

8. Claude implementa:
   - Modifica src/auth/login.tsx
   - Crea src/auth/validators.ts
   - Crea tests
   - Ejecuta tests

9. Claude completa:
   ↓
   POST /api/implementations/123/complete
   ↓
   MCP:
   - 🗝️ DESBLOQUEA proyecto
   - Actualiza contexto en NEON
   - 📢 Notifica a Cursor, ChatGPT (vía WebSocket)

RESULTADO
─────────
✅ Proyecto mejorado
✅ TODO registrado en NEON
✅ Todos los agentes saben qué pasó
✅ Ningún conflicto
✅ Trazabilidad total
```

## 5.2 Casos de Uso Detallados

### Caso 1: Nuevo agente entra a proyecto con cambios recientes

```
1. TÚ en VS Code (nuevo agente):
   "Optimiza componente de checkout"

2. VS Code detecta proyecto "pwa-ecommerce"

3. MCP responde con contexto:
   {
     "lastChanges": {
       "date": "2025-01-01T10:00:00Z",
       "files": ["src/auth/login.tsx"],
       "implementedBy": "claude",
       "summary": "Añadida validación de email..."
     },
     "permission": "propose"
   }

4. VS Code muestra al usuario:
   "ℹ️ Última actualización hace 2 horas por Claude
   Se mejoraron validaciones de login."

5. Ahora VS Code no interfiere con cambios de Claude ✅
```

### Caso 2: Conflicto detectado durante propuesta

```
1. Cursor propone: cambiar auth en login.tsx

2. MCP detecta:
   - Claude ya implementó cambios en login.tsx hace 30 min
   - La propuesta de Cursor entra en conflicto

3. MCP responde a Cursor:
   {
     "status": "conflict_detected",
     "conflict": {
       "file": "src/auth/login.tsx",
       "modifiedBy": "claude",
       "when": "30 min ago",
       "suggestion": "Coordina con Claude o combina cambios"
     }
   }

4. Cursor puede:
   - Esperar a que se complete el cambio de Claude
   - Combinar cambios manualmente
   - Crear propuesta que merge ambos cambios
```

### Caso 3: Implementación falla, rollback

```
1. Claude implementa plan #42

2. Tests fallan

3. Claude reporta:
   POST /api/implementations/123/fail
   {
     "reason": "Tests failed",
     "errors": [...]
   }

4. MCP:
   - 🔓 Desbloquea proyecto
   - Mantiene cambios en staging
   - Status = "failed"
   - Notifica a otros agentes

5. Agentes pueden:
   - Revisar el error
   - Crear nueva propuesta mejorando el plan
```

---

# 6. GUÍA DE DEPLOYMENT

## 6.1 Local (Desarrollo)

```bash
# 1. Crear carpeta proyecto
mkdir mcp-orchestrator
cd mcp-orchestrator

# 2. Clonar este documento y estructura
git init
npm init -y

# 3. Instalar dependencias
npm install express dotenv ws uuid joi jsonwebtoken

# 4. Crear .env desde .env.example
cp .env.example .env
# Editar .env con:
# - NEON_DATABASE_URL
# - JWT_SECRET
# - API_KEYS

# 5. Setup inicial
node scripts/setup.js

# 6. Iniciar servidor MCP local
npm run dev
# Output: ✅ MCP Server running on http://localhost:3000

# 7. Verificar conexión
node scripts/test-connection.js
```

## 6.2 Render (Producción)

```bash
# 1. Crear cuenta en render.com

# 2. Conectar repositorio Git

# 3. Crear Web Service en Render:
   - Build command: npm install
   - Start command: npm start
   - Environment variables:
     • NODE_ENV=production
     • PORT=10000
     • NEON_DATABASE_URL=...
     • JWT_SECRET=...

# 4. Deploy automático en cada git push

# 5. URL pública: https://mcp-orch.render.com
```

## 6.3 Sincronización Multi-Agente

```
LOCAL MCP SERVER (tu máquina)
    ↓ Sync HTTP
RENDER CLOUD SERVER (producción)
    ↓ Read/Write
NEON DATABASE (memoria persistente)
    ↓ WebSocket
AGENTES IA (Cursor, Claude, ChatGPT, etc.)

Beneficios:
✅ Desarrollo offline en local
✅ Sincronización automática a Render
✅ NEON siempre actualizada
✅ Todos los agentes ven cambios
```

---

# 7. CHECKLIST DE IMPLEMENTACIÓN

## 7.1 Componentes a Crear

```
PHASE 1: CORE INFRASTRUCTURE
────────────────────────────
[ ] Crear estructura de directorios
[ ] Configurar .env y package.json
[ ] Setup inicial (scripts/setup.js)
[ ] Esquema NEON (database/schema.sql)
[ ] Conexión NEON (config/database.js)
[ ] Logger centralizado (src/utils/logger.js)
[ ] Error handler (src/middleware/error-handler.js)

PHASE 2: SERVER CORE
───────────────────
[ ] Servidor Express base (server.js)
[ ] MCP Server principal (src/core/mcp-server.js)
[ ] Project Manager (src/core/project-manager.js)
[ ] State Manager (src/core/state-manager.js)
[ ] Event Emitter (src/core/event-emitter.js)

PHASE 3: MIDDLEWARE
──────────────────
[ ] Autenticación JWT (src/middleware/auth.js)
[ ] Project Detector (src/middleware/project-detector.js)
[ ] Access Control (src/middleware/access-control.js)
[ ] Rate Limiter (src/middleware/rate-limiter.js)

PHASE 4: ROUTES & API
────────────────────
[ ] Router principal (src/routes/index.js)
[ ] Rutas proyectos (src/routes/projects.js)
[ ] Rutas lectura (src/routes/read.js)
[ ] Rutas propuestas (src/routes/propose.js)
[ ] Rutas revisiones (src/routes/review.js)
[ ] Rutas unificación (src/routes/unify.js)
[ ] Rutas implementación (src/routes/implement.js)
[ ] Rutas contexto (src/routes/context.js)

PHASE 5: SERVICES
─────────────────
[ ] NEON Service (src/services/neon-service.js)
[ ] Proposal Service (src/services/proposal-service.js)
[ ] Review Service (src/services/review-service.js)
[ ] Unification Service (src/services/unification-service.js)
[ ] Implementation Service (src/services/implementation-service.js)
[ ] Context Builder (src/services/context-builder.js)
[ ] File Watcher (src/services/file-watcher.js)
[ ] Sync Service (src/services/sync-service.js)

PHASE 6: MODELS & UTILS
───────────────────────
[ ] Model Project (src/models/Project.js)
[ ] Model Proposal (src/models/Proposal.js)
[ ] Model Review (src/models/Review.js)
[ ] Model Plan (src/models/Plan.js)
[ ] Model Implementation (src/models/Implementation.js)
[ ] Diff Generator (src/utils/diff-generator.js)
[ ] Code Analyzer (src/utils/code-analyzer.js)
[ ] Validators (src/utils/validators.js)

PHASE 7: WEBSOCKET & REAL-TIME
──────────────────────────────
[ ] Socket Server (src/websocket/socket-server.js)
[ ] Event Handlers (src/websocket/handlers.js)
[ ] WebSocket Sync

PHASE 8: SKILLS & INTEGRATIONS
───────────────────────────────
[ ] Universal Skill (skills/universal-mcp-skill/index.js)
[ ] Cursor Integration (skills/cursor-integration/.cursor/mcp.json)
[ ] VS Code Extension (skills/vscode-integration/extension.js)
[ ] Claude Desktop Config (skills/claude-desktop-integration/mcp-config.json)

PHASE 9: DEPLOYMENT & SCRIPTS
─────────────────────────────
[ ] Setup Script (scripts/setup.js)
[ ] Create Project Script (scripts/create-project.js)
[ ] Deploy Script (scripts/deploy.sh)
[ ] Test Connection (scripts/test-connection.js)
[ ] Render Deploy Config

PHASE 10: TESTING & DOCUMENTATION
─────────────────────────────────
[ ] Unit Tests (tests/unit/)
[ ] Integration Tests (tests/integration/)
[ ] E2E Tests (tests/e2e/)
[ ] README.md
[ ] API Docs
[ ] Setup Guide
```

## 7.2 Validación

```
Después de cada fase, validar:

✅ El servidor inicia sin errores
✅ Conexión a NEON funciona
✅ Endpoints responden correctamente
✅ Skills se conectan al servidor
✅ Flujo completo funciona sin errores
✅ NEON tiene datos correctos
✅ WebSocket transmite updates
✅ Todos los agentes ven cambios
```

## 7.3 Testing

```
Test Coverage:
✅ Creación de proyectos
✅ Creación de propuestas
✅ Revisiones de propuestas
✅ Unificación de planes
✅ Bloqueo/desbloqueo de proyectos
✅ Control de acceso
✅ Rate limiting
✅ Sincronización NEON
✅ WebSocket updates
✅ Errores y excepciones
```

---

# 8. PRÓXIMOS PASOS PARA CLOUDECODE

## Orden Recomendado de Implementación

1. **Infraestructura Base** (Sem 1)
   - Proyecto Node.js + estructura
   - NEON Database + schema
   - Servidor Express base
   - Middleware de autenticación

2. **API REST Core** (Sem 2)
   - Endpoints de proyectos
   - Endpoints de propuestas
   - Endpoints de revisiones
   - Control de acceso

3. **Lógica de Unificación** (Sem 2-3)
   - Service de unificación
   - Análisis de conflictos
   - Merge inteligente

4. **Skills & Integración** (Sem 3-4)
   - Skill universal
   - Integración Cursor
   - Integración VS Code
   - Integración Claude

5. **WebSocket & Real-time** (Sem 4)
   - Sincronización en vivo
   - Notificaciones
   - Actualizaciones contexto

6. **Testing & Deploy** (Sem 5)
   - Tests completos
   - Deploy a Render
   - Documentación
   - Training

---

**Este documento es la especificación COMPLETA pro-nivel. CloudeCode tiene TODO lo que necesita para implementar. SIN DUDAS, SIN PREGUNTAS.**

Versión: 2.0.0 PRO ✅
Status: 📋 Listo para Implementación
Entrega: Para CloudeCode + Sonnet 4.5

🚀 **LET'S GO BUILD THIS**
