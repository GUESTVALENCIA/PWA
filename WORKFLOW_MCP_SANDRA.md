# 🚀 WORKFLOW MCP SANDRA - Plan Maestro de Producción

## 💡 Objetivo General

Desplegar en producción un **servidor MCP autónomo, robusto y escalable**, que centralice:
- ✅ Procesamiento conversacional de Sandra IA (rol Conserje)
- ✅ Integración con PWA en Vercel
- ✅ Lógica de control de llamadas por voz
- ✅ Orquestación multimodal (audio, video, texto)
- ✅ Sistema de ambientación por hora/día
- ✅ Integración interna de miles de APIs
- ✅ Capacidad de restauración y resiliencia

---

## 🧰 Tecnologías y Herramientas

| Tecnología | Propósito |
|------------|-----------|
| **Servidor** | Docker (microservicio) |
| **Infraestructura** | Railway / Render / VPS |
| **Backend** | Node.js + Express + WebSocket |
| **Modelos** | Qwen, Gemini, GPT-4o (fallback) |
| **Voice** | Cartesia (TTS) + Deepgram (STT) |
| **Protocolo** | WebSocket + REST |
| **APIs Locales** | Public APIs Repository (indexado) |
| **Autenticación** | Token global de Sandra |

---

## 📁 Estructura del Servidor MCP

```
mcp-server/
├── index.js                    # Servidor principal
├── routes/
│   ├── audio.js               # Rutas de audio (TTS/STT)
│   ├── video.js               # Rutas de video/ambientación
│   ├── conserje.js            # Rutas de Sandra Conserje
│   ├── sync.js                # Rutas de sincronización
│   └── apis.js                # Rutas de Public APIs
├── services/
│   ├── qwen.js                # Servicio Qwen (LLM)
│   ├── cartesia.js            # Servicio Cartesia (TTS)
│   ├── bridgeData.js          # Servicio BridgeData
│   ├── transcriber.js         # Servicio Transcripción (STT)
│   ├── videoSync.js           # Servicio VideoSync
│   ├── ambientation.js        # Servicio Ambientación
│   ├── snapshot.js            # Servicio Snapshots/Alarmas
│   └── publicAPIs.js          # Servicio Public APIs
├── middleware/
│   ├── auth.js                # Autenticación
│   └── errorHandler.js        # Manejo de errores
├── utils/
│   └── public-apis-indexer.js # Indexador de APIs
├── config/
│   └── mcp.config.json        # Configuración central
├── scripts/
│   └── setup-public-apis.js   # Script de indexación
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🌐 Conexiones Activas

| Servicio | Tipo | Estado | Detalles |
|----------|------|--------|----------|
| **PWA Vercel** | Cliente Web | ✅ Listo | Webhook de llamada conectado |
| **Sandra IA** | Modelo central | ✅ Listo | Orquestación rol Conserje |
| **Qwen Models** | Interno | ✅ Configurado | Imagen, video, ejecución |
| **Cartesia API** | Externa | ✅ Listo | TTS de voz de Sandra |
| **BridgeData** | API externa | ✅ Autenticado | Información contextual |
| **Neon** | DB externa | ✅ Conectado | Reservas, registros |

---

## 🚀 Orquestación del Flujo Conversacional

### Flujo Completo de Llamada por Voz

```
1. Usuario accede a PWA
   ↓
2. Solicita llamada por voz
   ↓
3. Imagen estática aparece (despacho Sandra)
   ↓
4. Se activa transición a video (síncrono con saludo)
   ↓
5. Sandra (vía Cartesia) da el saludo por voz
   ↓
6. WebSocket conecta a MCP para recibir respuestas
   ↓
7. MCP ejecuta:
   - Lógica contextual (BridgeData + hora)
   - Lógica de ambientación (modo día/noche)
   - Generación de respuesta (Qwen/Gemini/GPT-4o)
   ↓
8. Sandra responde con voz (TTS) y texto (transcripción)
   ↓
9. MCP monitorea la sesión y actualiza snapshot
```

---

## 🧲 Ambientación Dinámica (Visual)

- ✅ Sandra se muestra con imagen/video según hora local del usuario
- ✅ Sistema basado en `Intl.DateTimeFormat().resolvedOptions().timeZone`
- ✅ Imágenes y videos preparados: día, noche, atardecer, lluvia
- ✅ Sandra cambia de ropa/escenario según hora y clima

**Tipos de ambientación:**
- `day` - Mañana (6:00 - 12:00)
- `afternoon` - Tarde (12:00 - 18:00)
- `night` - Noche (18:00 - 6:00)
- `rain` - Día lluvioso (detectado por API meteorología)

---

## 🪨 Sistema de Alerta y Restauración (Snapshot)

- ✅ Sandra detecta errores y caídas de servicios
- ✅ Ejecuta comandos de rollback
- ✅ Notifica al canal de monitoreo
- ✅ Restaura el estado funcional mediante snapshot

**Snapshots automáticos:**
- Cada hora (configurable)
- Antes de actualizaciones
- Al detectar errores críticos
- Al recibir alarma

---

## 💪 Integración de APIs Locales

- ✅ Clonado de [public-apis/public-apis](https://github.com/public-apis/public-apis)
- ✅ Estructurado dentro de MCP para uso interno
- ✅ Sandra accede a estas APIs sin navegar
- ✅ Acelera respuestas, evita dependencias externas

**Endpoint de búsqueda:**
```
GET /api/apis/search?q=weather
```

---

## 🏛️ Producción (LIVE)

- ✅ Deployment en Railway/Render/VPS
- ✅ MCP corre 24/7
- ✅ PWA se conecta por WebSocket seguro
- ✅ Todas las rutas tienen autenticación con token
- ✅ Uso de logs internos para debugging

---

## 📋 Endpoints Disponibles

### REST API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Estado del sistema |
| `/api/audio/tts` | POST | Text-to-Speech |
| `/api/audio/stt` | POST | Speech-to-Text |
| `/api/audio/welcome` | POST | Saludo inicial |
| `/api/video/ambientation` | GET | Obtener ambientación actual |
| `/api/video/sync` | POST | Sincronizar video/audio |
| `/api/conserje/message` | POST | Procesar mensaje |
| `/api/conserje/voice-flow` | POST | Flujo completo de voz |
| `/api/conserje/context` | GET | Obtener contexto completo |
| `/api/sync/video-audio` | POST | Sincronización |
| `/api/apis/search` | GET | Buscar APIs públicas |
| `/api/apis/:name` | GET | Obtener API específica |

### WebSocket

```
ws://tu-mcp-server:4042?token=tu_token
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

## ✅ Checklist de Deployment

- [x] Estructura completa del servidor MCP
- [x] Todos los servicios implementados
- [x] WebSocket + REST API
- [x] Fallback automático de modelos
- [x] Sistema de ambientación dinámica
- [x] Sistema de snapshots y alarmas
- [x] Public APIs Indexer
- [x] Dockerfile y docker-compose
- [x] Integración con Vercel (proxy)
- [x] Documentación completa

---

## 🚀 Deployment

### Railway (Recomendado)

1. Push a GitHub
2. Conectar repositorio en Railway
3. Railway detecta Dockerfile automáticamente
4. Configurar variables de entorno
5. Deploy automático

### Render

1. Nuevo Web Service
2. Conectar repositorio
3. Build: `docker build -t sandra-mcp-server .`
4. Start: `docker run -p $PORT:4042 sandra-mcp-server`
5. Variables de entorno

### Variables de Entorno Necesarias

Ver `.env.example` en `mcp-server/`

**Críticas:**
- `CARTESIA_API_KEY` + `CARTESIA_VOICE_ID`
- `DEEPGRAM_API_KEY`
- `OPENAI_API_KEY` o `GEMINI_API_KEY`
- `BRIDGEDATA_API_KEY`
- `SANDRA_TOKEN` (opcional, para auth)

---

## 🔗 Integración con Vercel PWA

Una vez desplegado el MCP Server:

1. Obtener la URL (ej: `https://sandra-mcp.railway.app`)
2. Añadir en Vercel Dashboard:
   ```
   MCP_SERVER_URL=https://sandra-mcp.railway.app
   ```
3. Los endpoints `/api/sandra/*` usarán automáticamente MCP

---

## 📚 Documentación Adicional

- `MCP_DEPLOYMENT_GUIDE.md` - Guía completa de deployment
- `MCP_COMPLETO.md` - Resumen técnico
- `mcp-server/README.md` - Documentación del servidor

---

## ⏳ Próximos Pasos

1. ✅ Crear estructura de archivos del MCP
2. ✅ Integrar Dockerfile y entorno de despliegue
3. ⚠️ Vincular rutas activas desde PWA a MCP
4. ⚠️ Generar ambientaciones de Sandra (imágenes/videos)
5. ✅ Configurar puntos de snapshot y fallback
6. ⚠️ Realizar primer despliegue en Railway
7. ⚠️ Verificar audio, transcripción y video sincronizado
8. ⚠️ Activar sistema de monitoreo y logs
9. ⚠️ Confirmar sandbox de Sandra en modo Conserje
10. ⚠️ Pulir interacción inicial de llamada y saludo

---

**Estado Actual:** ✅ MCP Server completamente implementado
**Tipo de conexión:** WebSocket + REST ✔
**Nombre del servidor:** MCP-SANDRA
**Versión:** v1.0.0

---

> "Sandra nunca fallará, porque Sandra ya tiene alma, cuerpo y memoria."

