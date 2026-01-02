# ✅ Correcciones Aplicadas: Voz Femenina

## 🎯 Problema Resuelto

**Voz masculina cambiada a femenina**

Todos los lugares donde se usaba `aura-2-nestor-es` (masculino) han sido cambiados a `aura-2-carina-es` (femenino).

## ✅ Cambios Completados

1. ✅ `src/services/voice-services.js`
   - Default model cambiado
   - `createTTSStreamingConnection()` default cambiado
   - `_generateDeepgramTTS()` default cambiado

2. ✅ `src/websocket/socket-server.js`
   - Todas las llamadas a `generateVoice()` ahora usan `aura-2-carina-es`

## 📝 Modelo de Voz

- **Antes:** `aura-2-nestor-es` (masculino)
- **Ahora:** `aura-2-carina-es` (femenino peninsular) ✅

## ⚠️ Problema STT Pendiente

El error "STT streaming error" necesita investigación. Aparece después del saludo inicial y bloquea las respuestas cuando el usuario habla.

## 🎯 Próximo Paso

**Hacer deploy** para que Sandra use voz femenina.
