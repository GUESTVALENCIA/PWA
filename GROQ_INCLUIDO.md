# ✅ GROQ INCLUIDO

## Estado Actual

✅ **Groq ya estaba incluido** y es el proveedor preferido por defecto.

## Cambio Realizado

✅ **Modelo actualizado**: Cambiado de `qwen2.5-72b-instruct` a `gpt-oss-20b` (según imagen Deepgram)

## Configuración

- **Proveedor Preferido**: Groq (por defecto, configurable via `PREFERRED_AI_PROVIDER`)
- **Modelo Groq**: `gpt-oss-20b` (GPT OSS 20B)
- **Fallbacks**: OpenAI, Gemini

## Código

- Archivo: `src/services/voice-services.js`
- Método: `_callGroq()`
- Modelo: `gpt-oss-20b`

## Nota

Si el modelo `gpt-oss-20b` no funciona, puede ser que el nombre en la API sea diferente. En ese caso, sería necesario verificar el nombre exacto del modelo en la documentación de Groq.
