# 🔧 CAMBIOS EN RENDER - PASO A PASO

## 📍 ACCESO:
URL de tu servicio: https://dashboard.render.com/web/srv-d4sqhoeuk2gs73f1ba8g

## ⚙️ CAMBIOS NECESARIOS:

### 1. Ve a SETTINGS (Configuración)
En la barra lateral izquierda, click en "Settings"

### 2. Sección "Build & Deploy":

#### Root Directory:
- **Campo actual:** (probablemente vacío o `/`)
- **Cambiar a:** `mcp-server`

#### Start Command:
- **Campo actual:** `node server.js`
- **Cambiar a:** `node index.js`

#### Build Command:
- **Dejar como está:** `npm install` (o vacío)

### 3. Sección "Environment":

Verifica que tengas estas variables configuradas:
- ✅ OPENAI_API_KEY
- ✅ GROQ_API_KEY
- ✅ GEMINI_API_KEY
- ✅ CARTESIA_API_KEY
- ✅ CARTESIA_VOICE_ID
- ✅ DEEPGRAM_API_KEY
- ✅ BRIGHTDATA_PROXY_URL
- ✅ BRIDGEDATA_API_KEY
- ✅ NEON_DB_URL
- ✅ DATABASE_URL
- ✅ MCP_PORT=4042
- ✅ MCP_HOST=0.0.0.0
- ✅ NODE_ENV=production
- ✅ ALLOWED_ORIGINS=*
- ✅ SANDRA_TOKEN
- ✅ REQUIRE_AUTH=false

### 4. Sección "Networking" o "Port":

#### Port:
- **Cambiar de:** `4040`
- **A:** `4042`

## ✅ DESPUÉS DE HACER LOS CAMBIOS:

1. **Click en:** "Save Changes" o "Update"
2. **Ve a:** "Deploys" (en la barra lateral)
3. **Click en:** "Manual Deploy" > "Deploy latest commit"
4. **Espera** a que termine el deploy

## 🔍 VERIFICAR EN LOGS:

Después del deploy, deberías ver en los logs:
```
🚀 MCP-SANDRA Server v1.0.0
MCP Server iniciado en 0.0.0.0:4042
```

**NO deberías ver:**
```
Servidor Galaxy local corriendo en http://localhost:4040
```

## 📋 RESUMEN:

| Configuración | ANTES | DESPUÉS |
|---------------|-------|---------|
| **Root Directory** | (vacío) | `mcp-server` |
| **Start Command** | `node server.js` | `node index.js` |
| **Port** | `4040` | `4042` |

