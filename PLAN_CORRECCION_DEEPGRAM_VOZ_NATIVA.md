# 📋 PLAN DE CORRECCIÓN: Deepgram Streaming + Voz Nativa

## 🎯 Problemas Identificados

1. **STT de Deepgram mal utilizado**: Usando `prerecorded.transcribeBuffer()` para chunks de streaming
2. **Voz nativa mal conectada**: No está en el pipeline correcto, se intenta usar `generateVoice()` en servidor

## ✅ Soluciones a Implementar

### 1. Migrar a Deepgram Streaming API
- Usar `deepgram.transcription.live()` como en `stream-server-v2.js`
- Configurar VAD y endpointing
- Enviar audio como Buffer binario, no Base64 string

### 2. Corregir Flujo de Voz Nativa
- Servidor envía **texto** al cliente después de LLM
- Cliente reproduce audio nativo local (`sandra-conversational.wav`)
- Pre-cargar audio en el cliente con `voiceLibraryManager`

### 3. Eliminar generateVoice() del Servidor
- Después de LLM, solo enviar texto
- No generar audio en servidor para respuestas conversacionales

## 📝 Cambios Específicos

### Archivo: `src/websocket/socket-server.js`
- Modificar `handleAudioSTT()` para usar Deepgram Streaming API
- Cambiar para enviar texto en lugar de audio después de LLM
- Eliminar llamada a `voiceServices.generateVoice()`

### Archivo: `index.html`
- Implementar `voiceLibraryManager` para pre-cargar `sandra-conversational.wav`
- Modificar `ws.onmessage` para manejar mensajes de tipo `response_complete` con texto
- Reproducir audio nativo cuando se recibe texto

### Archivo: `src/services/voice-services.js`
- Mantener solo para welcome audio (si es necesario)
- No usar para respuestas conversacionales
