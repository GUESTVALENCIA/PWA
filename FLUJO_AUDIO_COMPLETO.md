#  FLUJO COMPLETO DE AUDIO - Widget Sandra

##  Problema Identificado

El servidor MCP solo transcribía el audio pero **NO generaba ni enviaba la respuesta de audio de Sandra**.

##  Solución Implementada

### Flujo Completo Corregido:

1. **Cliente graba audio del usuario**
   - MediaRecorder captura audio del micrófono
   - Se envía como base64 en formato WebM

2. **Cliente envía al servidor MCP**
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

3. **Servidor MCP procesa** (CORREGIDO):
   -  Transcribe audio → Obtiene texto del usuario
   -  Procesa con IA (Qwen/Conserje) → Obtiene respuesta de texto
   -  Genera audio con TTS (Cartesia) → Convierte respuesta a audio
   -  Envía audio de vuelta al cliente

4. **Servidor MCP envía respuesta**:
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

5. **Cliente recibe y reproduce**
   - Detecta `route: 'audio', action: 'tts'`
   - Extrae `payload.audio`
   - Llama a `playAudioResponse(payload.audio, payload.isWelcome)`
   - Reproduce audio de Sandra

##  Cambios Realizados

### `mcp-server/index.js` - Función `handleAudioRoute`

**ANTES:**
```javascript
case 'stt':
  const transcript = await services.transcriber.transcribe(payload.audio);
  return { transcript }; //  Solo devolvía texto, NO audio
```

**DESPUÉS:**
```javascript
case 'stt':
  // 1. Transcribir
  const transcript = await services.transcriber.transcribe(payload.audio);
  
  // 2. Procesar con IA
  const aiResponse = await services.qwen.processMessage(transcript, {...});
  
  // 3. Generar audio (TTS)
  const responseAudio = await services.cartesia.textToSpeech(aiResponse);
  
  // 4. Enviar audio directamente por WebSocket
  ws.send(JSON.stringify({
    route: 'audio',
    action: 'tts',
    payload: {
      audio: responseAudio,
      format: 'mp3',
      text: aiResponse,
      isWelcome: payload.isWelcome || false
    }
  }));
  
  return { transcript, text: aiResponse, audioSent: true };
```

##  Flujo Completo de la Conversación

```
Usuario habla
    ↓
[MediaRecorder] Graba audio (WebM)
    ↓
[Cliente] Envía {route: 'audio', action: 'stt', payload: {audio: base64}}
    ↓
[MCP Server] handleAudioRoute('stt', payload)
    ↓
    ├─→ [Transcriber] Transcribe audio → "Hola Sandra"
    ↓
    ├─→ [Qwen/IA] Procesa texto → "¡Hola! ¿En qué puedo ayudarte?"
    ↓
    ├─→ [Cartesia/TTS] Genera audio → base64Audio
    ↓
    └─→ [WebSocket] Envía {route: 'audio', action: 'tts', payload: {audio: base64Audio}}
         ↓
[Cliente] ws.onmessage recibe mensaje
    ↓
[Cliente] Detecta route='audio' && action='tts'
    ↓
[Cliente] Extrae payload.audio
    ↓
[Cliente] playAudioResponse(payload.audio)
    ↓
[Cliente] Crea Audio element y reproduce
    ↓
Usuario escucha respuesta de Sandra
```

##  Notas Importantes

1. **Saludo inicial**: Cuando es el primer mensaje, el servidor debe enviar `isWelcome: true` para que el cliente sincronice el video del hero correctamente.

2. **No speech**: Si no hay transcripción válida, el servidor envía un mensaje de tipo `noSpeech` en lugar de audio.

3. **Barge-in**: El cliente detiene la grabación cuando Sandra empieza a hablar para evitar feedback loops.

4. **Formato**: 
   - Audio enviado por cliente: WebM (opus codec)
   - Audio recibido por cliente: MP3 (generado por Cartesia)

##  Próximos Pasos

1. Probar el flujo completo en producción
2. Verificar que el audio se reproduce correctamente
3. Asegurar que el saludo inicial funciona con sincronización de video
4. Probar casos edge: silencio, errores de transcripción, errores de TTS

