#  MEMORIA PERSISTENTE - Proyecto GuestsValencia PWA

##  REGLAS CRÍTICAS - NO VIOLAR

### 1. SALUDO INICIAL DE SANDRA - GRABADO, NO TTS  IMPLEMENTADO

** CRÍTICO:** El saludo inicial de Sandra es un **archivo de audio GRABADO**, NO se genera en tiempo real con TTS (Text-to-Speech).

- **NO** usar `cartesia.textToSpeech()` para el saludo inicial
- **SÍ** usar un archivo de audio pre-grabado
- El archivo está en: `mcp-server/assets/audio/welcome.mp3`
- Formato: MP3, 44.1kHz, Mono, ~50KB
- El servidor MCP lee este archivo directamente desde disco

**Ubicación del archivo (IMPLEMENTADO):**
- `mcp-server/assets/audio/welcome.mp3` 
- Script de generación: `scripts/generar-audio-bienvenida.js`

**Implementación actual (CORRECTA):**
```javascript
// En mcp-server/index.js, función handleConserjeRoute:
const welcomeAudioPath = path.join(__dirname, 'assets/audio/welcome.mp3');
const welcomeAudioBuffer = fs.readFileSync(welcomeAudioPath);
const welcomeAudio = welcomeAudioBuffer.toString('base64');
```

**INCORRECTO (YA NO SE USA):**
```javascript
//  ESTO YA NO SE HACE - FUE REEMPLAZADO
const welcomeAudio = await services.cartesia.textToSpeech(welcomeText);
```

---

## 2. CONFIGURACIÓN DE APIS - PRIORIDADES

### Producción:
1. **Gemini** - Prioritario siempre
2. **GPT-4o (OpenAI)** - Fallback 1
3. **Groq (Qwen)** - Fallback 2
4. **Groq (DeepSeek)** - Fallback 3

### Local:
1. **Gemini** - Prioritario siempre
2. **GPT-4o (OpenAI)** - Fallback 1
3. **Groq (Qwen)** - Fallback 2

---

## 3. SERVICIOS Y ENDPOINTS

### Servidor MCP (Render):
- **URL:** `https://pwa-imbf.onrender.com`
- **Puerto WebSocket:** 4042 (pero Render lo maneja automáticamente)
- **Health Check:** `/health`
- **WebSocket:** `wss://pwa-imbf.onrender.com`

### Vercel PWA:
- **URL:** `https://pwa-chi-six.vercel.app`
- **API Routes:** `/api/*`
- **Config Endpoint:** `/api/config`

---

## 4. FLUJO DE LLAMADA CONVERSACIONAL

1. Usuario inicia llamada
2. Cliente conecta WebSocket a MCP Server
3. Cliente solicita acceso a micrófono
4. Cliente envía: `{route: 'conserje', action: 'message', payload: {type: 'ready'}}`
5. **Servidor MCP debe:**
   - Leer archivo de audio grabado del saludo
   - Convertir a base64
   - Enviar: `{route: 'audio', action: 'tts', payload: {audio: base64Audio, isWelcome: true}}`
6. Cliente reproduce saludo grabado
7. Cliente inicia grabación después del saludo
8. Usuario habla → STT → IA → TTS → Audio respuesta

---

## 5. VARIABLES DE ENTORNO CRÍTICAS

### Vercel:
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `PREFERRED_AI_PROVIDER=gemini`
- `DEEPGRAM_API_KEY`
- `CARTESIA_API_KEY`
- `CARTESIA_VOICE_ID`
- `MCP_SERVER_URL`
- `MCP_TOKEN`

### Render (MCP Server):
- Todas las de Vercel +
- `BRIGHTDATA_PROXY_URL`
- `BRIDGEDATA_API_KEY`
- `NEON_DB_URL`
- `DATABASE_URL`
- `MCP_PORT=4042`
- `MCP_HOST=0.0.0.0`

---

## 6. FORMATO DE MENSAJES WEBSOCKET

### Cliente → Servidor:
```json
{
  "route": "audio|conserje|video|sync|apis",
  "action": "stt|tts|message|sync|search",
  "payload": { ... }
}
```

### Servidor → Cliente (Saludo inicial):
```json
{
  "route": "audio",
  "action": "tts",
  "payload": {
    "audio": "base64AudioFromFile",
    "format": "mp3",
    "text": "¡Hola! Soy Sandra...",
    "isWelcome": true
  }
}
```

### Servidor → Cliente (Respuesta conversacional):
```json
{
  "route": "audio",
  "action": "tts",
  "payload": {
    "audio": "base64AudioFromTTS",
    "format": "mp3",
    "text": "Respuesta de Sandra",
    "isWelcome": false
  }
}
```

---

## 7. ARCHIVOS Y ESTRUCTURA

### Archivos de audio:
- **Saludo inicial:** `assets/audio/welcome.mp3` (GRABADO)
- **Videos hero:** `assets/videos/sandra-call-1.mp4`, `sandra-call-2.mp4`

### Archivos principales:
- **Frontend:** `index.html` (widget integrado)
- **MCP Server:** `mcp-server/index.js`
- **API Gateway:** `api/api-gateway.js`
- **Assistant:** `api/sandra/assistant.js`

---

## 8. NOTAS IMPORTANTES

- El widget está autocontenido en `index.html`
- El WebSocket se conecta dinámicamente usando `/api/config`
- El video del hero se sincroniza con el saludo inicial
- La grabación se detiene automáticamente cuando Sandra habla (barge-in)
- El saludo inicial **NUNCA** se genera con TTS, siempre es un archivo grabado

---

## 9. PROPTECH OS V14.8 (Elite)

- Panel de Propietario: tabs de rendimiento, calendario, activos, marketing y finanzas. Incluye negociacion de comision y liquidacion/payout.
- Panel de Huesped: tabs de reservas, inbox y perfil. Chat directo con Sandra integrado.
- Chatbot de ventas: panel dedicado para disponibilidad y precios con contexto de propiedades (Gemini + fallback local).
- Pago por voz (VPOS PayPal): formulario seguro simulado en modal de pago con validaciones y flujo PCI-DSS.
- Busqueda IA: filtrado semantico en el hero usando Gemini cuando esta disponible.
- WhatsApp Business (stub): confirmaciones de reserva enviadas via `GVSandraOps.sendWhatsAppConfirmation`.
- QA Diagnostico: `window.GVQA.run()` + boton oculto `#qa-trigger` (debug) para pruebas rapidas.
- AI Studio: eliminado del index comercial; todo laboratorio va en subdominio independiente.

---

##  Última actualización: 10 de Diciembre, 2025

**Recordar siempre:** El saludo inicial de Sandra es un archivo de audio GRABADO, no se genera en tiempo real.

---

##  UBICACIÓN DEL AUDIO GRABADO DEL SALUDO

### Servidor Local (puertos 4040 y 4041):
- **`server-websocket.js`** (puerto 4041): Actualmente usa `preGenerateWelcomeAudio()` con TTS, pero **debe usar un archivo grabado**
- **`server.js`** (puerto 4040): Servidor HTTP local

### Archivo esperado:
El archivo de audio grabado del saludo debe estar en:
- `assets/audio/welcome.mp3` (o similar)
- O referenciado en el código del servidor local

**IMPORTANTE:** El servidor MCP en producción (`mcp-server/index.js`) también debe usar este mismo archivo grabado, NO generar con TTS.

---

##  NOTAS ADICIONALES DEL USUARIO

- El usuario ha trabajado 72+ horas en este proyecto
- La frustración viene de que el saludo se sigue generando con TTS en lugar de usar el archivo grabado
- Los servidores locales (4040, 4041) tienen la referencia correcta al audio grabado
- El saludo debe reproducirse directamente desde archivo, sin latencia de API

