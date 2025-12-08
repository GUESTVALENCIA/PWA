# IMPLEMENTACIÓN COMPLETA: Gemini Live API + Cartesia TTS

## ✅ CAMBIOS REALIZADOS

### 1. Nueva Función: `callGeminiLiveSTTAndLLM()`
- **Reemplaza**: `transcribeAudio()` (Deepgram) + `generateStreamingResponse()` (Gemini REST)
- **Funcionalidad**: Procesa audio directamente con Gemini API
- **Ventaja**: STT + LLM en una sola llamada API

### 2. Flujo Optimizado:
```
Cliente → Audio (WebM base64) → WebSocket → Servidor
Servidor → Gemini API (audio → STT + LLM) → Texto
Servidor → Cartesia TTS → Audio (MP3) → Cliente
```

**Reducción: De 3 llamadas API a 2 llamadas API**

### 3. Mantiene Cartesia TTS
- ✅ Voz de Sandra preservada
- ✅ Acento español/valenciano mantenido
- ✅ Función `generateTTS()` sin cambios

## PRÓXIMOS PASOS

1. **Testing**: Probar la implementación actual
2. **Optimización**: Investigar WebSocket directo de Gemini Live API para streaming en tiempo real
3. **Google AI Studio**: Investigar clonación de voz para migración futura

## NOTAS TÉCNICAS

- Gemini API REST soporta audio directamente en `inlineData`
- MimeType: `audio/webm;codecs=opus`
- El historial de conversación se mantiene para contexto
- Cartesia TTS se mantiene para la voz de Sandra

