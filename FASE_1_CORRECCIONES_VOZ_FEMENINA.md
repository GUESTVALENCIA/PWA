# ✅ FASE 1: Voz Cambiada a Femenina

## 🔧 Cambios Aplicados

**Modelo cambiado:** `aura-2-nestor-es` (masculino) → `aura-2-carina-es` (femenino)

### Archivos Modificados:

1. ✅ `src/services/voice-services.js`
   - Default model en `generateVoice()`: `aura-2-carina-es`
   - Default model en `createTTSStreamingConnection()`: `aura-2-carina-es`
   - Default model en `_generateDeepgramTTS()`: `aura-2-carina-es`
   - Legacy call signature: `aura-2-carina-es`

2. ✅ `src/websocket/socket-server.js`
   - `handleInitialGreeting()`: `aura-2-carina-es`
   - `onTranscriptionFinalized` (respuestas): `aura-2-carina-es`
   - `handleAudioTTS()`: `aura-2-carina-es`
   - `handleGreetingFallback()`: `aura-2-carina-es`
   - `handleTTSFallback()`: `aura-2-carina-es`

## ✅ Resultado

Sandra ahora usará voz **femenina** (`aura-2-carina-es`) en todas las respuestas.

## ⚠️ Problema STT Pendiente

El error "STT streaming error" sigue apareciendo. Necesita investigación adicional en los logs del servidor.

## 🎯 Próximo Paso

**Hacer deploy** del código actualizado para que Sandra use voz femenina.
