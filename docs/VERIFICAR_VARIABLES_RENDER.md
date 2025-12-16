# ✅ VERIFICACIÓN DE VARIABLES EN RENDER

## Variables REQUERIDAS para el Servidor MCP

### ✅ Variables que YA TIENES configuradas:
- ✅ OPENAI_API_KEY
- ✅ GROQ_API_KEY  
- ✅ GEMINI_API_KEY
- ✅ CARTESIA_API_KEY
- ✅ CARTESIA_VOICE_ID
- ✅ DEEPGRAM_API_KEY
- ✅ MCP_PORT
- ✅ MCP_HOST
- ✅ NODE_ENV
- ✅ ALLOWED_ORIGINS
- ✅ SANDRA_TOKEN
- ✅ REQUIRE_AUTH

### ⚠️ PROBLEMA DETECTADO:

**BRIDGHTDATA** está configurada, pero el servidor MCP busca:
- **BRIGHTDATA_PROXY_URL** (con la URL completa WebSocket)
- **BRIDGEDATA_API_KEY** (con las credenciales)

## 🔧 SOLUCIÓN:

Tienes que RENOMBRAR o AÑADIR estas variables:

1. **BRIGHTDATA_PROXY_URL**
   - Valor: `wss://brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4@brd.superproxy.io:9222`

2. **BRIDGEDATA_API_KEY**
   - Valor: `brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4`

O si "BRIDGHTDATA" ya tiene la URL completa, renómbrala a **BRIGHTDATA_PROXY_URL**

## ✅ DESPUÉS DE AÑADIR/RENOMBRAR:

El servidor MCP estará listo para hacer deploy.

