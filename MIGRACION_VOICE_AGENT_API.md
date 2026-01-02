# 🚀 MIGRACIÓN: Deepgram Voice Agent API

## Objetivo

Migrar del sistema actual (STT + LLM + TTS separados) a **Deepgram Voice Agent API** para:
- ✅ Latencia mínima (~400-600ms vs ~800-1200ms)
- ✅ Calidad enterprise
- ✅ Barge-in nativo
- ✅ Pipeline integrado optimizado

## Configuración

- **LLM**: GPT-4o-mini (preferido), GPT-4o (fallback)
- **Voz TTS**: aura-2-agustina-es (Spanish Peninsular female)
- **STT**: nova-2-phonecall (optimizado para llamadas)

## Cambios Requeridos

1. ✅ Crear `VoiceAgentService` para manejar Voice Agent API
2. ✅ Reemplazar `handleAudioSTT` con Voice Agent connection
3. ✅ Eliminar llamadas separadas a LLM y TTS
4. ✅ Manejar eventos de Voice Agent (Audio, ConversationText, etc.)
5. ✅ Configurar saludo inicial en Settings message

## Arquitectura Nueva

```
Cliente → WebSocket → Servidor → Deepgram Voice Agent API
                                           ↓
                                    Pipeline Integrado:
                                    - Listen (STT)
                                    - Think (GPT-4o-mini)
                                    - Speak (TTS Agustina)
                                           ↓
                                    Cliente (Audio PCM Stream)
```

## Estado

- ✅ Estudio completado
- ⏳ Implementación en progreso
