# ✅ ACTUALIZACIÓN: Modelo Deepgram a nova-3

## Cambio Realizado

**Modelo anterior:** `nova-2`
**Modelo nuevo:** `nova-3`

## Razón

Según la configuración del Voice Agent en Deepgram Playground:
- URL muestra: `listenModel=nova-3`
- Voz: Aura 2 - Agustina (Peninsular, femenina) ✅
- LLM: OpenAI GPT-4o mini ✅
- Idioma: Español ✅

## Archivo Modificado

`src/services/voice-services.js` línea 118
- Antes: `model: 'nova-2'`
- Ahora: `model: 'nova-3'`

## Estado

✅ Código actualizado a `nova-3`
✅ Alineado con configuración de Deepgram Playground
✅ Listo para deploy
