# 🔧 DÓNDE CONFIGURAR LAS VARIABLES DEL SERVIDOR MCP

## ⚠️ PROBLEMA IDENTIFICADO

Hay **DOS lugares** donde se configuran las variables:

1. ✅ **Vercel** - Ya están configuradas (hace 3 días)
   - Para las funciones serverless: `/api/sandra/chat` y `/api/sandra/assistant`
   - Variables: `OPENAI_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`

2. ❌ **Servidor MCP** - **AQUÍ ES DONDE FALTAN**
   - Para las llamadas conversacionales (WebSocket)
   - El servidor MCP necesita las mismas variables pero en su propio despliegue

## 🔍 VERIFICAR DÓNDE ESTÁ DESPLEGADO EL SERVIDOR MCP

El servidor MCP debería estar en `https://mcp.sandra-ia.com`, pero no está accesible.

### Opción 1: Railway
1. Ve a Railway Dashboard
2. Busca el proyecto "sandra-mcp-server" o similar
3. Settings > Variables
4. Configura las variables allí

### Opción 2: Render
1. Ve a Render Dashboard
2. Busca el servicio "mcp-server" o similar
3. Environment > Environment Variables
4. Configura las variables allí

### Opción 3: VPS
1. SSH al servidor
2. Edita el archivo `.env` en el directorio del servidor MCP
3. O configura las variables en el sistema

## 📋 VARIABLES QUE NECESITA EL SERVIDOR MCP

```bash
# LLM (al menos uno)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# Voice
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...

# STT
DEEPGRAM_API_KEY=...

# Seguridad (opcional)
SANDRA_TOKEN=...
REQUIRE_AUTH=false
```

## 🔧 VERIFICAR CONEXIÓN AL SERVIDOR MCP

Ejecuta:
```bash
node verificar-servidor-mcp.js
```

Esto te dirá:
- Si el servidor MCP está accesible
- Qué variables están configuradas en el servidor MCP
- Qué modelo está usando (GPT-4o, Groq, Gemini)

## 🚨 ACCIÓN INMEDIATA

1. **Identifica dónde está desplegado el servidor MCP**
   - Railway, Render, VPS, o algún otro servicio

2. **Configura las variables allí**
   - Usa las MISMAS keys que configuraste en Vercel
   - Especialmente: `OPENAI_API_KEY`, `GROQ_API_KEY`

3. **Reinicia el servidor MCP** después de configurar las variables

4. **Verifica** con `node verificar-servidor-mcp.js`

## 💡 IMPORTANTE

- Las variables en Vercel son para las funciones serverless (chat/assistant)
- Las variables en el servidor MCP son para las llamadas conversacionales (WebSocket)
- **AMBAS necesitan las mismas variables configuradas**
- El servidor MCP es donde SANDRA realmente procesa las llamadas de voz

