# PLAN DE IMPLEMENTACIÓN: Gemini Live API Directo + Cartesia TTS

## INFORMACIÓN CLAVE ENCONTRADA

### Gemini Live API - Configuración con TTS Externo:

Según la documentación oficial, Gemini Live API permite:
- **STT + LLM integrados** en una sola llamada
- **TTS externo** configurando `modalities: ["TEXT"]`
- **WebSocket streaming** bidireccional para audio en tiempo real

### Protocolo WebSocket:

1. **Conexión WebSocket** a Gemini Live API
2. **Mensaje de configuración inicial** con:
   - Modelo: `gemini-2.0-flash-exp` o `gemini-2.5-flash-native-audio-preview-09-2025`
   - `responseModalities: ["TEXT"]` (para usar TTS externo)
   - `systemInstruction`: Reglas conversacionales
3. **Streaming de audio** del usuario
4. **Recibir texto** de respuesta
5. **Enviar texto a Cartesia TTS** para generar audio con voz de Sandra

## ARQUITECTURA FINAL

```
Cliente → Audio (WebM) → WebSocket → Servidor
Servidor → Gemini Live API WebSocket (STT + LLM) → Texto
Servidor → Cartesia TTS → Audio (MP3) → Cliente
```

## IMPLEMENTACIÓN

### Paso 1: Crear función para Gemini Live API WebSocket
- Conectar a WebSocket de Gemini Live
- Enviar configuración inicial con `responseModalities: ["TEXT"]`
- Stream audio del usuario
- Recibir texto de respuesta

### Paso 2: Mantener Cartesia TTS
- Usar función `generateTTS()` existente
- Mantener voz de Sandra (`CARTESIA_VOICE_ID`)

### Paso 3: Eliminar Deepgram
- Remover función `transcribeAudio()`
- Actualizar flujo para usar Gemini Live directamente

## PRÓXIMOS PASOS

1. Investigar endpoint exacto de Gemini Live API WebSocket
2. Implementar conexión WebSocket directa
3. Configurar `responseModalities: ["TEXT"]`
4. Integrar con Cartesia TTS
5. Testing completo

