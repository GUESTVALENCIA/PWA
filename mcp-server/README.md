#  MCP-SANDRA Server v1.0.0

**Model Context Protocol - Orquestador Central para Sandra IA**

Servidor autónomo, robusto y escalable que centraliza todas las capacidades de Sandra IA: procesamiento conversacional, voz, video, multimodalidad y gestión de APIs.

---

##  Inicio Rápido

### Local (Desarrollo)

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.production.example .env
# Editar .env con tus claves API

# Desarrollo
npm run dev

# Producción local
npm start
```

### Docker

```bash
# Construir
docker build -t sandra-mcp-server .

# Ejecutar
docker run -p 4042:4042 --env-file .env sandra-mcp-server

# O con Docker Compose
docker-compose up -d
```

---

##  Endpoints

### REST API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Estado del sistema |
| `/api/audio/tts` | POST | Text-to-Speech |
| `/api/audio/stt` | POST | Speech-to-Text |
| `/api/audio/welcome` | POST | Saludo inicial |
| `/api/video/ambientation` | GET | Ambientación actual |
| `/api/video/sync` | POST | Sincronizar video/audio |
| `/api/conserje/message` | POST | Procesar mensaje |
| `/api/conserje/voice-flow` | POST | Flujo completo de voz |
| `/api/conserje/context` | GET | Contexto completo |
| `/api/sync/video-audio` | POST | Sincronización |
| `/api/apis/search` | GET | Buscar APIs públicas |

### WebSocket

```
ws://localhost:4042?token=tu_token
```

**Mensaje:**
```json
{
  "route": "conserje|audio|video|sync|apis",
  "action": "message|tts|stt|sync|search",
  "payload": { ... }
}
```

---

##  Configuración

### Variables de Entorno Críticas

Ver `.env.production.example` para lista completa.

**Mínimas:**
- `CARTESIA_API_KEY` - Text-to-Speech
- `DEEPGRAM_API_KEY` - Speech-to-Text
- `OPENAI_API_KEY` o `GEMINI_API_KEY` - LLM
- `SANDRA_TOKEN` - Autenticación (opcional)

---

##  Documentación

- `WORKFLOW_MCP_SANDRA.md` - Plan maestro y flujo completo
- `DEPLOY_PRODUCCION.md` - Guía de deployment a producción
- `MCP_DEPLOYMENT_GUIDE.md` - Guía técnica detallada

---

##  Estructura

```
mcp-server/
├── index.js              # Servidor principal
├── routes/               # Rutas REST
├── services/             # Servicios (Qwen, Cartesia, etc.)
├── middleware/           # Auth, error handling
├── utils/                # Utilidades
├── config/               # Configuración
└── scripts/              # Scripts de setup
```

---

##  Features

-  Procesamiento conversacional (rol Conserje)
-  TTS/STT completo
-  Ambientación dinámica (hora/clima)
-  VideoSync (sincronización video/audio)
-  Public APIs indexadas localmente
-  Snapshots y sistema de alarmas
-  Fallback automático de modelos
-  WebSocket + REST
-  Autenticación con tokens

---

##  Deployment

Ver `DEPLOY_PRODUCCION.md` para guía completa.

**Plataformas soportadas:**
- Railway (recomendado)
- Render
- VPS (Docker)

---

##  Licencia

MIT

---

**"Sandra nunca fallará, porque Sandra ya tiene alma, cuerpo y memoria."**
