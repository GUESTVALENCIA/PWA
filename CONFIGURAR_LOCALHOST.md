# 🖥️ CONFIGURACIÓN PARA LOCALHOST

## ✅ Estado Actual

- ✅ Puerto **4042** está **LIBRE** (disponible)
- ⚠️ Puerto **3000** está ocupado por proceso 9540 (puede ser otro servidor)

## 🚀 Iniciar Servidor MCP Local

### Opción 1: Script Automático (Recomendado)

```bash
node start-localhost-server.js
```

Este script:
- ✅ Verifica que el puerto 4042 esté libre
- ✅ Instala dependencias si es necesario
- ✅ Inicia el servidor MCP en `localhost:4042`

### Opción 2: Manual

```bash
cd mcp-server
npm install  # Solo si es la primera vez
npm start    # Inicia en puerto 4042
```

## 🔧 Configuración Automática

El sistema detecta automáticamente si estás en localhost:

- **Cliente (`api/config.js`)**: Detecta `localhost` en el host y usa `http://localhost:4042`
- **WebSocket Client**: Convierte automáticamente `http://localhost:4042` → `ws://localhost:4042`

## 📡 Endpoints Locales

Una vez iniciado el servidor:

- **WebSocket**: `ws://localhost:4042`
- **HTTP**: `http://localhost:4042`
- **Health Check**: `http://localhost:4042/health`
- **API Status**: `http://localhost:4042/api/status`

## 🧪 Probar Conexión

1. Inicia el servidor: `node start-localhost-server.js`
2. Abre el navegador en: `http://localhost:3000` (o el puerto que uses para el frontend)
3. Abre la consola del navegador
4. Verifica que veas: `✅ WebSocket conectado` y `MCP Server: http://localhost:4042`

## ⚠️ Variables de Entorno

El servidor MCP necesita estas variables en `mcp-server/.env`:

```env
# LLM APIs (al menos una)
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Voice APIs
CARTESIA_API_KEY=sk_car_...
CARTESIA_VOICE_ID=2d5b0e6cf361460aa7fc47e3cee4b30c
DEEPGRAM_API_KEY=53202ecf825c59e8ea498f7cf68c4822c2466005

# Database (opcional)
NEON_DB_URL=postgresql://...
```

## 🛑 Detener Servidor

Presiona `Ctrl+C` en la terminal donde está corriendo el servidor.

## 🔍 Verificar Procesos

```powershell
# Ver qué está usando el puerto 4042
netstat -ano | findstr ":4042"

# Ver procesos Node.js
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

## 📝 Notas

- El servidor MCP corre en el puerto **4042** (no 3000)
- El frontend puede correr en cualquier puerto (3000, 8080, etc.)
- La detección de localhost es automática basada en el `host` header

