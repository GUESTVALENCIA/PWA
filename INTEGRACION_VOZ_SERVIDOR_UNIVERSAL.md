# 🎤 INTEGRACIÓN DEL SISTEMA DE VOZ AL SERVIDOR UNIVERSAL MCP

## ✅ Cambios Realizados

### 1. **Actualizado `src/websocket/socket-server.js`**

- ✅ Agregado soporte para mensajes con formato `route`/`action` (sistema de voz)
- ✅ Mantenido soporte para formato `type` (orquestación existente)
- ✅ Implementadas funciones:
  - `handleVoiceMessage()` - Router principal para mensajes de voz
  - `handleAudioSTT()` - Procesa audio del usuario (STT → IA → TTS)
  - `handleAudioTTS()` - Genera audio desde texto
  - `handleWelcomeMessage()` - Envía saludo inicial grabado

### 2. **Creado `src/services/voice-services.js`**

Servicio completo que integra:
- ✅ **Deepgram** - Speech-to-Text (STT)
- ✅ **Cartesia** - Text-to-Speech (TTS)
- ✅ **Gemini/GPT-4/Groq** - Procesamiento de IA (con fallbacks)
- ✅ **Welcome Audio** - Manejo del archivo de saludo grabado

### 3. **Actualizado `server.js`**

- ✅ Inicialización de servicios de voz
- ✅ Paso de servicios de voz al WebSocket handler

## 📋 Formato de Mensajes Soportados

### Cliente → Servidor (Audio STT):
```json
{
  "route": "audio",
  "action": "stt",
  "payload": {
    "audio": "base64Audio...",
    "format": "webm",
    "mimeType": "audio/webm;codecs=opus"
  }
}
```

### Cliente → Servidor (Ready):
```json
{
  "route": "conserje",
  "action": "message",
  "payload": {
    "type": "ready",
    "message": "Cliente listo para recibir saludo"
  }
}
```

### Servidor → Cliente (Audio TTS):
```json
{
  "route": "audio",
  "action": "tts",
  "payload": {
    "audio": "base64AudioResponse...",
    "format": "mp3",
    "text": "Respuesta de Sandra",
    "isWelcome": false
  }
}
```

## 🔄 Flujo Completo

1. **Usuario inicia llamada** → Widget conecta WebSocket
2. **Cliente envía `ready`** → `{route: 'conserje', action: 'message', payload: {type: 'ready'}}`
3. **Servidor envía saludo** → Audio grabado (welcome.mp3) o TTS
4. **Usuario habla** → Audio capturado y enviado
5. **Servidor procesa**:
   - STT (Deepgram) → Transcribe audio
   - IA (Gemini/GPT-4) → Genera respuesta
   - TTS (Cartesia) → Convierte respuesta a audio
6. **Servidor envía audio** → Cliente reproduce respuesta

## 📦 Variables de Entorno Requeridas

```bash
# STT (Deepgram)
DEEPGRAM_API_KEY=...

# TTS (Cartesia)
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=sandra

# IA (al menos una)
GEMINI_API_KEY=...
OPENAI_API_KEY=...
GROQ_API_KEY=...
PREFERRED_AI_PROVIDER=gemini  # gemini, openai, o groq
```

## 🚀 Próximos Pasos

1. **Commit y Push a GitHub**:
   ```bash
   git add .
   git commit -m "feat: Integrar sistema de voz al servidor universal MCP"
   git push origin main
   ```

2. **Render auto-desplegará** (si auto-deploy está habilitado)

3. **Verificar variables de entorno en Render**:
   - Dashboard → PWA service → Environment
   - Asegurar que todas las API keys estén configuradas

4. **Probar la conexión**:
   - El widget debería conectarse sin errores "Unknown message type"
   - El flujo completo de voz debería funcionar

## 📝 Notas

- El servidor ahora soporta **AMBOS** formatos de mensaje:
  - `{type, payload}` → Para orquestación multi-agente
  - `{route, action, payload}` → Para sistema de voz
  
- Si falta `welcome.mp3`, se usa TTS como fallback automático

- Los servicios de voz se inicializan de forma opcional (no bloquean el servidor si fallan)

- El sistema tiene fallbacks automáticos para IA:
  1. Gemini (preferido)
  2. OpenAI GPT-4o
  3. Groq Qwen 2.5

## ✅ Estado

**Código completado y listo para deployment**

El cliente (widget) ya está preparado y funcionando. Una vez desplegado, el servidor procesará correctamente los mensajes de voz.
