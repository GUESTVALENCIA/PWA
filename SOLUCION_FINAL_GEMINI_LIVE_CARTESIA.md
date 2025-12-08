# SOLUCIÓN FINAL: Gemini Live API + Cartesia TTS

## ✅ CONFIRMACIÓN

**Gemini Live API SÍ permite usar TTS externo** configurando `modalities: ['TEXT']`:

- **STT + LLM**: Gemini Live API (sistema nativo de Google)
- **TTS**: Cartesia (voz de Sandra con acento español/valenciano)

## ARQUITECTURA OPTIMIZADA

### Flujo Actual (3 APIs):
```
Cliente → Audio → Deepgram STT → Texto → Gemini LLM → Texto → Cartesia TTS → Audio
```

### Flujo Nuevo (2 APIs):
```
Cliente → Audio → Gemini Live API (STT + LLM) → Texto → Cartesia TTS → Audio
```

**Reducción: De 3 llamadas API a 2 llamadas API**

## VENTAJAS

1. ✅ **Mantiene voz de Sandra**: Cartesia con acento español/valenciano
2. ✅ **Reduce complejidad**: Elimina Deepgram
3. ✅ **Latencia mejorada**: Gemini Live es más rápido
4. ✅ **Sistema nativo**: Gemini Live es oficial de Google
5. ✅ **Sin conflictos**: No hay problemas entre servicios

## IMPLEMENTACIÓN

### Paso 1: Gemini Live API (STT + LLM)
- Configurar `modalities: ['TEXT']` para solo STT + LLM
- Usar WebSocket streaming para audio de entrada
- Recibir texto de respuesta (no audio)

### Paso 2: Mantener Cartesia TTS
- Usar voz existente de Sandra (`CARTESIA_VOICE_ID`)
- Convertir texto de Gemini Live a audio
- Enviar audio al cliente

### Paso 3: Investigar Google AI Studio (Futuro)
- Explorar creación de voces personalizadas
- Ver si se puede clonar la voz de Cartesia/Eleven Labs
- Evaluar migración futura si es viable

## CÓDIGO DE IMPLEMENTACIÓN

### Cambios en `server-websocket.js`:

1. **Eliminar `transcribeAudio()` (Deepgram)**
2. **Crear `callGeminiLiveSTT()`** - Usar Gemini Live para STT + LLM
3. **Mantener `generateTTS()` (Cartesia)** - Para voz de Sandra
4. **Actualizar flujo WebSocket** para usar Gemini Live

## PRÓXIMOS PASOS

1. ✅ Implementar Gemini Live API con modo TEXT
2. ✅ Mantener Cartesia TTS
3. ✅ Eliminar Deepgram
4. 🔍 Investigar Google AI Studio para clonación de voz
