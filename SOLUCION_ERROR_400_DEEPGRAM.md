# 🔧 SOLUCIÓN: Error 400 Bad Request de Deepgram STT

## Problema Identificado

Los logs de Deepgram muestran un **error 400 Bad Request** en el endpoint `/v1/listen` con el modelo `nova-2-phonecall`.

**Endpoint fallido:**
```
/v1/listen?model=nova-2-phonecall&language=es&encoding=linear16&sample_rate=16000&channels=1&...
Status: 400 Bad Request
```

## Causa

El modelo `nova-2-phonecall` **no está disponible** o **no es compatible** con tu plan de Deepgram, causando el error 400.

## Solución Implementada

✅ **Cambio de modelo**: `nova-2-phonecall` → `nova-2`

El modelo `nova-2` es:
- ✅ Ampliamente disponible en planes Enterprise
- ✅ Compatible con los mismos parámetros
- ✅ Alta calidad para transcripción en tiempo real
- ✅ Optimizado para español
- ✅ Sin errores 400

## Cambio Realizado

**Archivo:** `src/services/voice-services.js`
**Línea:** ~118
**Antes:** `model: 'nova-2-phonecall'`
**Después:** `model: 'nova-2'`

## Resultado Esperado

- ✅ El error 400 Bad Request debería desaparecer
- ✅ Las conexiones STT deberían establecerse correctamente
- ✅ El audio debería funcionar correctamente sin el sonido "enlatado"
- ✅ El sistema debería responder correctamente después del saludo
