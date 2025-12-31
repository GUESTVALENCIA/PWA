# 🔗 CONEXIÓN AL SERVIDOR UNIVERSAL MCP

## Problema Identificado

El widget está enviando mensajes con formato `{route, action, payload}` pero el Universal MCP Orchestrator espera formato `{type, payload}` en su WebSocket handler principal.

## Estado Actual

### Cliente (Widget):
```json
{
  "route": "audio",
  "action": "stt",
  "payload": {
    "audio": "base64...",
    "format": "webm"
  }
}
```

### Servidor Universal MCP Orchestrator espera:
```json
{
  "type": "subscribe_project",
  "payload": { ... }
}
```

## Solución Requerida

El servidor Universal MCP Orchestrator necesita actualizar su WebSocket handler para soportar AMBOS formatos:

1. **Formato existente** (para orquestación):
   ```json
   { "type": "subscribe_project", "payload": {...} }
   ```

2. **Formato de voz** (para sistema de voz):
   ```json
   { "route": "audio", "action": "stt", "payload": {...} }
   ```

## Cambios Necesarios en el Servidor

El handler WebSocket (`src/websocket/socket-server.js` o equivalente) necesita:

```javascript
function handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter) {
  // Soporte para formato route/action (sistema de voz)
  if (data.route && data.action) {
    return handleVoiceMessage(data, ws, wss);
  }
  
  // Formato existente type/payload (orquestación)
  const { type, payload } = data;
  switch (type) {
    case 'subscribe_project':
      // ... código existente
  }
}

function handleVoiceMessage(data, ws, wss) {
  const { route, action, payload } = data;
  
  switch (route) {
    case 'audio':
      if (action === 'stt') {
        // Procesar audio STT
        // Transcribir → IA → TTS → Enviar respuesta
        handleAudioSTT(payload, ws);
      }
      break;
    case 'conserje':
      if (action === 'message' && payload.type === 'ready') {
        // Enviar saludo inicial
        handleWelcomeMessage(ws);
      }
      break;
  }
}
```

## Formato de Mensajes de Voz

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

### Servidor → Cliente (Saludo Inicial):
```json
{
  "route": "audio",
  "action": "tts",
  "payload": {
    "audio": "base64WelcomeAudio...",
    "format": "mp3",
    "text": "¡Hola! Soy Sandra...",
    "isWelcome": true
  }
}
```

## Pasos para Implementar

1. **Actualizar handler WebSocket del servidor** para soportar `route`/`action`
2. **Implementar handlers de voz** (`handleAudioSTT`, `handleWelcomeMessage`)
3. **Integrar servicios de voz** (Deepgram STT, Gemini/GPT-4 IA, Cartesia TTS)
4. **Probar flujo completo** de conexión → saludo → conversación

## Estado del Cliente

✅ El widget está correctamente configurado y enviando el formato esperado
✅ El widget está preparado para recibir respuestas en el formato correcto
⏳ **Pendiente**: Actualizar servidor para procesar mensajes `route`/`action`

## Notas

- El servidor Universal MCP Orchestrator ya tiene endpoints REST para voz (`/api/voice/*`)
- El WebSocket handler necesita ser extendido para soportar voz en tiempo real
- Una vez implementado, el flujo completo de voz funcionará a través del servidor universal
