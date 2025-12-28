# 🧠 MEMORIA PERSISTENTE - COMPOSER1
## Proyecto: GUESTVALENCIAPWA

**Última actualización:** 2025-01-28
**Proyecto:** GuestsValencia PWA - Sistema Conversacional con Sandra IA

---

## 📋 CONFIGURACIÓN CRÍTICA DEL PROYECTO

### **Stack Tecnológico**
- **Frontend:** PWA (Progressive Web App) en Vercel
- **Backend:** MCP Server en Render (`https://pwa-imbf.onrender.com`)
- **WebSocket:** Conexión directa al servidor MCP en Render
- **Dominio oficial:** `guestsvalencia.es` (configurado en proyecto `guestsvalencia-site`)

### **Modelos LLM Configurados (4 modelos con selector)**
1. **Groq (Qwen 2.5 72B)** - **DEFAULT** ✅ (Gratis para producción)
   - Modelo: `qwen/qwen-2.5-72b-instruct`
   - API: `https://api.groq.com/openai/v1/chat/completions`
   - Variable: `GROQ_API_KEY`

2. **OpenAI (GPT-4o)**
   - Modelo: `gpt-4o`
   - API: `https://api.openai.com/v1/chat/completions`
   - Variable: `OPENAI_API_KEY`

3. **Anthropic (Claude 3.5 Sonnet)**
   - Modelo: `claude-3-5-sonnet-20241022`
   - API: `https://api.anthropic.com/v1/messages`
   - Variable: `ANTHROPIC_API_KEY`

4. **Google Gemini (Gemini 1.5 Pro)**
   - Modelo: `gemini-1.5-pro`
   - API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
   - Variable: `GEMINI_API_KEY`

### **Uso del Selector de Modelos**
```javascript
// Por defecto usa Groq (gratis)
await gateway.sendMessage('hola');

// Seleccionar modelo específico
await gateway.sendMessage('hola', 'hospitality', 'groq');    // Groq (default)
await gateway.sendMessage('hola', 'hospitality', 'openai');   // OpenAI
await gateway.sendMessage('hola', 'hospitality', 'anthropic'); // Anthropic
await gateway.sendMessage('hola', 'hospitality', 'gemini');   // Gemini
```

---

## 🔌 ENDPOINTS Y RUTAS CRÍTICAS

### **Frontend (Vercel)**
- **URL Producción:** `https://guestsvalencia.es` o `https://pwa-chi-six.vercel.app`
- **Config API:** `/api/config` - Expone `MCP_SERVER_URL` y `MCP_TOKEN`
- **Chat API:** `/api/sandra/chat` - POST con `{message, role, model}`

### **Backend MCP Server (Render)**
- **URL:** `https://pwa-imbf.onrender.com`
- **WebSocket:** `wss://pwa-imbf.onrender.com`
- **Health Check:** `/health` o `/healthz`
- **Status:** `/api/status`

### **Rutas del Chat**
- **POST `/api/sandra/chat`**
  - Body: `{message: string, role?: string, model?: 'groq'|'openai'|'anthropic'|'gemini'}`
  - Response: `{reply: string, model: string}`
  - **Default model: 'groq'** (gratis para producción)

### **Rutas WebSocket**
- **Route: `conserje`**
  - Action: `message` con `type: 'ready'` → Genera saludo inicial
- **Route: `audio`**
  - Action: `stt` → Envía audio, recibe transcripción + respuesta TTS
  - Action: `tts` → Recibe audio de respuesta

---

## 🎯 FLUJOS DE TRABAJO CRÍTICOS

### **1. Chat de Texto**
```
Usuario escribe → sendMessage() → POST /api/sandra/chat
→ Servidor procesa con modelo seleccionado (default: Groq)
→ Respuesta en {reply}
```

### **2. Llamada Conversacional (WebSocket)**
```
1. Usuario acepta llamada → startConversationalCall()
2. Reproduce ringtones (2 rings largos, 425 Hz, sonido "clac")
3. Conecta WebSocket a wss://pwa-imbf.onrender.com
4. Envía mensaje "ready" → Servidor envía saludo inicial (TTS)
5. Usuario habla → MediaRecorder captura audio
6. Envía audio (route: 'audio', action: 'stt')
7. Servidor procesa: STT → LLM (Groq) → TTS
8. Servidor envía respuesta (route: 'audio', action: 'tts')
9. Cliente reproduce audio de Sandra
```

### **3. Formato de Mensajes WebSocket**
```javascript
// Cliente → Servidor
{
  route: 'conserje',
  action: 'message',
  payload: { type: 'ready', message: 'Cliente listo para recibir saludo' }
}

// Audio STT
{
  route: 'audio',
  action: 'stt',
  payload: {
    audio: 'base64Audio...',  // Sin prefijo data:audio/webm;base64,
    format: 'webm',
    mimeType: 'audio/webm;codecs=opus',
    context: { timezone, destination, guests, nights }
  }
}

// Servidor → Cliente (TTS)
{
  route: 'audio',
  action: 'tts',
  payload: {
    audio: 'base64AudioResponse...',
    format: 'mp3',
    text: 'Respuesta de Sandra',
    isWelcome: true/false
  }
}
```

---

## 🔧 ARCHIVOS CRÍTICOS

### **Frontend**
- `index.html` - PWA principal con widget Sandra
- `assets/js/websocket-stream-client.js` - Cliente WebSocket MCP
- `api/config.js` - Serverless function para config MCP
- `manifest.webmanifest` - PWA manifest

### **Backend**
- `mcp-server/index.js` - Servidor principal MCP
- `mcp-server/routes/sandra.js` - Rutas del chat (4 modelos)
- `mcp-server/routes/conserje.js` - Rutas del conserje
- `mcp-server/services/qwen.js` - Servicio Groq/Qwen
- `mcp-server/index.js` - Handlers WebSocket (handleAudioRoute, handleConserjeRoute)

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### **1. Chat no funciona**
- **Causa:** Modelo por defecto no configurado o API key faltante
- **Solución:** Verificar `GROQ_API_KEY` en Render (es el default, gratis)
- **Verificar:** POST a `/api/sandra/chat` con `{message: 'hola', model: 'groq'}`

### **2. WebSocket no conecta**
- **Causa:** URL incorrecta o servidor MCP caído
- **Solución:** Verificar que `MCP_SERVER_URL` apunte a `https://pwa-imbf.onrender.com`
- **Verificar:** `/api/config` debe devolver la URL correcta

### **3. Audio no se reproduce**
- **Causa:** Formato incorrecto del audio base64 o falta de manejo de `route: 'audio', action: 'tts'`
- **Solución:** Verificar que el cliente maneje `data.payload.audio` y use `playAudioResponse()`
- **Verificar:** Logs en consola deben mostrar `[MCP] Recibida respuesta de audio TTS`

### **4. Ringtones incorrectos**
- **Causa:** Commit incorrecto restaurado
- **Solución:** Usar commit `36071e6` que tiene los ringtones correctos (425 Hz, 2 rings largos, sonido "clac")
- **Verificar:** `playRingtone()` debe usar `AudioContext` con `scheduleRing()` y `scheduleClac()`

### **5. Modelo no responde**
- **Causa:** API key faltante o modelo incorrecto
- **Solución:** 
  - Groq (default): Verificar `GROQ_API_KEY`
  - Otros modelos: Verificar API keys correspondientes
- **Verificar:** Logs del servidor deben mostrar el modelo usado

---

## 🚨 REGLAS CRÍTICAS

1. **SIEMPRE usar Groq como default** - Es gratis para producción
2. **NUNCA conectar WebSocket a Vercel** - Solo a Render (`wss://pwa-imbf.onrender.com`)
3. **SIEMPRE validar formato de audio** - Base64 sin prefijo `data:audio/webm;base64,`
4. **SIEMPRE verificar logs** - Console del navegador y logs del servidor Render
5. **NUNCA cambiar ringtones sin confirmación** - Usar los del commit `36071e6`
6. **SIEMPRE probar POST antes de decir que funciona** - Usar `fetch()` o `curl`

---

## 📝 VARIABLES DE ENTORNO CRÍTICAS

### **Render (MCP Server)**
```bash
GROQ_API_KEY=gsk_...          # REQUERIDA (default, gratis)
OPENAI_API_KEY=sk-...         # Opcional
ANTHROPIC_API_KEY=sk-ant-...  # Opcional
GEMINI_API_KEY=AIzaSy...      # Opcional
CARTESIA_API_KEY=...          # TTS
DEEPGRAM_API_KEY=...          # STT
SANDRA_TOKEN=...              # WebSocket auth (opcional)
REQUIRE_AUTH=false            # Desactivar auth para desarrollo
```

### **Vercel (Frontend)**
```bash
MCP_SERVER_URL=https://pwa-imbf.onrender.com
MCP_TOKEN=                     # Opcional si REQUIRE_AUTH=false
```

---

## 🎨 ESTRUCTURA DEL WIDGET

### **Clase SandraWidget**
- `gateway: SandraGateway` - Cliente HTTP para chat
- `activeCall: WebSocket` - Conexión WebSocket activa
- `mediaRecorder: MediaRecorder` - Captura de audio
- `currentAudio: Audio` - Audio actual reproduciéndose
- `isSpeaking: boolean` - Si Sandra está hablando
- `awaitingResponse: boolean` - Si espera respuesta del servidor

### **Métodos Críticos**
- `startConversationalCall()` - Inicia llamada con ringtones
- `playRingtone()` - Reproduce 2 rings (425 Hz) + "clac"
- `startRealTimeCall()` - Conecta WebSocket y configura audio
- `playAudioResponse(audioBase64, isWelcome)` - Reproduce audio de Sandra
- `sendMessage(text)` - Envía mensaje de texto al chat

---

## 🔍 COMANDOS ÚTILES

### **Verificar conexión WebSocket**
```bash
node test-websocket-conexion.js
```

### **Verificar configuración**
```bash
node verificar-websocket-config.js
```

### **Probar chat POST**
```bash
curl -X POST https://pwa-imbf.onrender.com/api/sandra/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hola","model":"groq"}'
```

---

## 📌 NOTAS IMPORTANTES

1. **El dominio `guestsvalencia.es` está en otro proyecto** (`guestsvalencia-site`), no en `pwa`
2. **Groq es GRATIS** - Usar siempre como default para producción
3. **Los ringtones correctos están en commit `36071e6`**
4. **El widget debe estar limpio** - Solo un widget activo, sin duplicados
5. **El selector de modelos está en el cliente** - Se pasa como tercer parámetro a `sendMessage()`

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

1. Crear selector de modelo en UI (dropdown en el widget)
2. Agregar indicador visual del modelo activo
3. Implementar fallback automático si un modelo falla
4. Agregar métricas de uso por modelo
5. Optimizar manejo de errores en WebSocket

---

**FIN DE MEMORIA PERSISTENTE**

