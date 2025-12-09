# 🚀 Guía de Deployment MCP Server - Sandra IA

## 📋 Índice

1. [Preparación](#preparación)
2. [Deployment Local con Docker](#deployment-local-con-docker)
3. [Deployment en Railway/Render](#deployment-en-railwayrender)
4. [Integración con Vercel PWA](#integración-con-vercel-pwa)
5. [Configuración y Variables](#configuración-y-variables)
6. [Verificación y Testing](#verificación-y-testing)

---

## ✅ Preparación

### Requisitos

- ✅ Node.js 18+
- ✅ Docker (para deployment containerizado)
- ✅ Variables de entorno configuradas
- ✅ Cuenta en Railway/Render (opcional, para deployment cloud)

### Estructura del Proyecto

```
mcp-server/
├── server.js              # Servidor principal
├── router/
│   └── mcp-router.js     # Gateway de control
├── services/
│   ├── chat.js           # Servicio de chat
│   ├── voice.js          # Servicio de voz
│   ├── vision.js         # Servicio de visión
│   ├── commands.js       # Servicio de comandos
│   └── scheduler.js      # Servicio de scheduler
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env.example
```

---

## 🐳 Deployment Local con Docker

### Paso 1: Preparar Variables de Entorno

```bash
cd mcp-server
cp .env.example .env
# Editar .env con tus claves API
```

### Paso 2: Construir y Ejecutar

```bash
# Opción A: Docker Compose (Recomendado)
docker-compose up -d

# Opción B: Docker directo
docker build -t sandra-mcp-server .
docker run -d -p 4042:4042 --env-file .env --name sandra-mcp sandra-mcp-server
```

### Paso 3: Verificar

```bash
# Health check
curl http://localhost:4042/health

# Status
curl http://localhost:4042/mcp-router/status
```

---

## ☁️ Deployment en Railway/Render

### Railway

1. **Crear proyecto nuevo** en Railway
2. **Conectar repositorio** GitHub
3. **Configurar variables de entorno** en Railway Dashboard
4. **Railway detectará automáticamente** el Dockerfile
5. **Deploy automático** en cada push

**Railway detectará:**
- Puerto: 4042 (configurar en Railway)
- Health check: `/health`
- Build: Dockerfile

### Render

1. **Nuevo Web Service** en Render
2. **Conectar repositorio** GitHub
3. **Configuración:**
   - Build Command: `docker build -t sandra-mcp-server .`
   - Start Command: `docker run -p $PORT:4042 sandra-mcp-server`
   - Environment: Variables de entorno
4. **Deploy**

### Variables de Entorno Necesarias

```
MCP_PORT=4042
MCP_HOST=0.0.0.0

# API Keys
DEEPSEEK_API_KEY=...
QWEN_API_KEY=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
DEEPGRAM_API_KEY=...
BRIDGEDATA_API_KEY=...
NEON_DB_URL=...
```

---

## 🔗 Integración con Vercel PWA

### Paso 1: Configurar Variable en Vercel

En Vercel Dashboard > Settings > Environment Variables:

```
MCP_SERVER_URL=https://tu-mcp-server.railway.app
```

O si es Render:

```
MCP_SERVER_URL=https://sandra-mcp-server.onrender.com
```

### Paso 2: Actualizar Endpoints en Vercel

Los endpoints `/api/sandra/*` automáticamente intentarán usar MCP si está disponible.

### Paso 3: Verificar Conexión

```bash
# Desde Vercel (serverless function)
curl https://tu-pwa.vercel.app/api/sandra/mcp/status
```

---

## ⚙️ Configuración y Variables

### Variables Críticas

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `MCP_PORT` | Puerto del servidor | Sí |
| `DEEPSEEK_API_KEY` | API Key DeepSeek | Recomendada |
| `OPENAI_API_KEY` | API Key OpenAI (fallback) | Sí |
| `CARTESIA_API_KEY` | API Key Cartesia (TTS) | Sí |
| `DEEPGRAM_API_KEY` | API Key Deepgram (STT) | Sí |

### Configuración de Modelos

El sistema tiene fallback automático:

1. **Primary**: DeepSeek R1
2. **Secondary**: Qwen
3. **Fallback**: GPT-4o (OpenAI)

---

## ✅ Verificación y Testing

### Health Check

```bash
curl http://tu-mcp-server/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "services": {
    "chat": true,
    "voice": true,
    "vision": true,
    "commands": true,
    "scheduler": true
  }
}
```

### Probar Chat

```bash
curl -X POST http://tu-mcp-server/mcp-router/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola Sandra",
    "context": "Eres Sandra IA, asistente de GuestsValencia"
  }'
```

### Probar Voice (TTS)

```bash
curl -X POST http://tu-mcp-server/mcp-router/voice/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hola, soy Sandra",
    "voiceId": "a34aec03-0f17-4fff-903f-d9458a8a92a6"
  }'
```

### WebSocket Test

```javascript
const ws = new WebSocket('ws://tu-mcp-server');
ws.on('open', () => {
  ws.send(JSON.stringify({
    service: 'chat',
    action: 'message',
    payload: {
      message: 'Hola Sandra',
      options: {}
    }
  }));
});

ws.on('message', (data) => {
  console.log('Respuesta:', JSON.parse(data));
});
```

---

## 🔄 Flujo Completo

```
PWA (Vercel) 
  ↓
/api/sandra/chat.js (Serverless Function)
  ↓
MCP Proxy (/api/sandra/mcp-proxy.js)
  ↓
MCP Server (Railway/Render)
  ↓
Chat Service → DeepSeek/Qwen/GPT-4o
  ↓
Respuesta → PWA
```

---

## 🐛 Troubleshooting

### MCP Server no responde

1. Verificar que el servidor está corriendo
2. Verificar variables de entorno
3. Revisar logs: `docker logs sandra-mcp`

### Error de conexión desde Vercel

1. Verificar `MCP_SERVER_URL` en Vercel
2. Verificar que MCP Server acepta conexiones externas
3. Verificar CORS en MCP Server

### Modelos no responden

1. Verificar API keys en `.env`
2. Revisar fallback automático en logs
3. Verificar límites de rate limiting

---

## 📊 Monitoreo

### Logs en Docker

```bash
docker logs -f sandra-mcp
```

### Snapshots

El scheduler crea snapshots automáticamente. Ver en:

```bash
ls mcp-server/snapshots/
```

---

**✨ MCP Server listo para orquestar Sandra IA en producción!**

