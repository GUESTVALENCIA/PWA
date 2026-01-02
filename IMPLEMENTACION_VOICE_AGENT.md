# 🚀 IMPLEMENTACIÓN: Migración a Voice Agent API

## Estado Actual
✅ Servicio Voice Agent creado (`voice-agent-service.js`)
✅ Configurado: GPT-4o-mini, voz Agustina, modelo nova-2-phonecall

## Próximos Pasos

### 1. Modificar server.js
- Importar VoiceAgentService
- Inicializar VoiceAgentService además de VoiceServices (temporalmente para migración gradual)

### 2. Modificar socket-server.js
- Reemplazar `handleAudioSTT` con `handleVoiceAgentAudio`
- Crear conexión Voice Agent por cliente
- Reenviar audio del cliente → Voice Agent
- Reenviar audio del Voice Agent → cliente

### 3. Flujo Nuevo
```
Cliente (WebSocket) → Servidor → Voice Agent API
                          ↓
                     Audio PCM
                          ↓
Cliente ← Servidor ← Voice Agent API
```

## Nota Importante
Voice Agent API maneja TODO (STT + LLM + TTS) en una sola conexión.
No necesitamos handleAudioSTT, processMessage, ni generateVoice separados.
