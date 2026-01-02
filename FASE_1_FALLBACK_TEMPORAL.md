# ⚠️ FASE 1: Fallback Temporal a REST API

## 🔧 Cambio Temporal Aplicado

He deshabilitado temporalmente el TTS WebSocket streaming y habilitado REST API como método principal hasta que el streaming esté completamente funcional.

**Razón:** El servidor está enviando objetos WebSocket al cliente en lugar de chunks PCM, causando errores.

## 📝 Cambios Realizados

### 1. `handleInitialGreeting`
- ✅ Cambiado `streaming: true` → `streaming: false`
- ✅ Ahora usa REST API (MP3 + base64) que funciona correctamente

### 2. `onTranscriptionFinalized` (respuestas conversacionales)
- ✅ Cambiado `streaming: true` → `streaming: false`
- ✅ Ahora usa REST API (MP3 + base64) que funciona correctamente

## ✅ Ventajas del Fallback

1. **Funciona inmediatamente** - REST API está probada y funciona
2. **Sin errores** - No envía objetos WebSocket al cliente
3. **Audio reproduce correctamente** - El cliente puede reproducir MP3

## ⚠️ Desventajas Temporales

1. **Mayor latencia** - MP3 + base64 tiene más overhead que PCM streaming
2. **Espera respuesta completa** - No streaming incremental
3. **No es la solución final** - Solo hasta que streaming funcione

## 🎯 Próximos Pasos

1. **Verificar que funcione** - El audio debería reproducirse ahora
2. **Revisar logs del servidor** - Ver qué está pasando con streaming
3. **Habilitar streaming cuando esté listo** - Cambiar `streaming: false` → `streaming: true`

## 📝 Nota

El código de streaming está implementado y correcto, pero necesita debugging en el servidor para funcionar correctamente. Este fallback permite que el sistema funcione mientras se corrige el streaming.
