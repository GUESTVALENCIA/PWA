# ✅ VARIABLES FINALES PARA RENDER - SERVIDOR MCP

## Variables que YA TIENES configuradas ✅

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

## ⚠️ ACCIÓN REQUERIDA: Renombrar/Añadir BrightData

**Tienes:** `BRIDGHTDATA`

**El servidor MCP necesita:**

### Opción 1: Renombrar
- Renombra `BRIDGHTDATA` a `BRIGHTDATA_PROXY_URL` (si contiene la URL completa)
- O renombra a `BRIDGEDATA_API_KEY` (si contiene solo credenciales)

### Opción 2: Añadir ambas (RECOMENDADO)
Añade estas dos variables:

**Variable 1:**
- Nombre: `BRIGHTDATA_PROXY_URL`
- Valor: `wss://brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4@brd.superproxy.io:9222`

**Variable 2:**
- Nombre: `BRIDGEDATA_API_KEY`
- Valor: `brd-customer-hl_c4b3455e-zone-mcp_booking_airbnb:rsxgwjh411m4`

## ✅ DESPUÉS DE CORREGIR BRIGHTDATA:

**TODAS las variables del servidor MCP estarán configuradas correctamente.**

Puedes hacer el deploy.

