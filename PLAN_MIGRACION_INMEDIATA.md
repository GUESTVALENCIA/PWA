# 🚨 PLAN: Migración Inmediata a Voice Agent API

## ⚠️ IMPORTANTE
El usuario quiere migrar **AHORA**. Necesito implementar esto rápidamente.

## Estrategia Rápida

### Opción 1: Reemplazo Directo (Más Rápido)
- ✅ Modificar `handleAudioSTT` para usar Voice Agent API
- ✅ Eliminar llamadas a LLM y TTS separadas
- ✅ Voice Agent maneja todo

### Opción 2: Coexistencia Temporal (Más Seguro)
- ✅ Mantener código actual
- ✅ Agregar Voice Agent como opción alternativa
- ✅ Switch por variable de entorno

## Decisión: Opción 1 - Reemplazo Directo

**Razones**:
- Usuario quiere migración inmediata
- Voice Agent API es mejor en todos los aspectos
- Código más simple (menos complejidad)

## Implementación

1. ✅ Importar VoiceAgentService en socket-server.js
2. ✅ Reemplazar deepgramConnections con voiceAgentConnections
3. ✅ Modificar handleAudioSTT → handleVoiceAgentAudio
4. ✅ Eliminar handleInitialGreeting (Voice Agent maneja saludo)
5. ✅ Eliminar llamadas a processMessage y generateVoice

## Flujo Nuevo

```
Cliente envía audio (base64) → handleVoiceAgentAudio
  → Voice Agent API (STT + LLM + TTS)
  → Audio PCM chunks → Cliente
```

## Cambios en Cliente
El cliente NO necesita cambios - sigue enviando audio base64 igual.
El servidor envía audio PCM igual que antes.
