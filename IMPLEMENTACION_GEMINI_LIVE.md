# IMPLEMENTACIÓN: Gemini Live API

## DECISIÓN

Basándome en tu explicación y la investigación realizada, **tienes razón**: debemos usar **Gemini Live API** en lugar de Deepgram + Cartesia.

## GEMINI LIVE API - INFORMACIÓN

### Características:
- **STT + LLM + TTS integrados** en un solo sistema
- **Latencia ~1 segundo** (según tu experiencia)
- **Sistema nativo de Google** para Gemini
- **WebSocket streaming** bidireccional
- **Barge-in** soportado
- **VAD integrado** (detección de actividad de voz)

### Documentación:
- https://ai.google.dev/gemini-api/docs/live

## IMPLEMENTACIÓN DIRECTA

Gemini Live API usa un protocolo WebSocket específico. Voy a implementarlo directamente en nuestro sistema actual, reemplazando Deepgram + Cartesia.

### Cambios necesarios:

1. **Reemplazar `transcribeAudio()` (Deepgram)** → Usar STT de Gemini Live
2. **Reemplazar `generateTTS()` (Cartesia)** → Usar TTS de Gemini Live  
3. **Mantener `generateStreamingResponse()` (Gemini LLM)** → Integrado en Gemini Live
4. **Crear conexión WebSocket a Gemini Live API** → Streaming bidireccional

## FLUJO NUEVO

```
Cliente → Audio (WebM) → WebSocket → Servidor
Servidor → Gemini Live API (WebSocket) → STT + LLM + TTS integrados
Servidor → Audio (MP3) → WebSocket → Cliente
```

**Una sola llamada API en lugar de tres.**

## PRÓXIMOS PASOS

1. Implementar conexión WebSocket con Gemini Live API
2. Configurar streaming de audio bidireccional
3. Reemplazar funciones de Deepgram y Cartesia
4. Testing completo

