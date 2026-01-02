# 🎯 LÓGICA DE ENTORNO: Producción vs Desarrollo

## Configuración

### Producción (NODE_ENV = production)
- **Proveedor Principal**: OpenAI GPT-4o-mini
- **Fallback**: Gemini (si OpenAI falla)
- **Groq**: NO usado (reservado para desarrollo)

### Desarrollo (NODE_ENV = development o no configurado)
- **Proveedor Principal**: Groq (GPT OSS 20B)
- **Fallback**: OpenAI, Gemini
- **Propósito**: Desarrollo local sin gastar tokens de OpenAI

## Detección Automática

El sistema detecta automáticamente el entorno:
- **Producción**: `NODE_ENV=production`
- **Desarrollo**: `NODE_ENV=development`, `NODE_ENV=dev`, o no configurado

## Override Manual

Si se configura `PREFERRED_AI_PROVIDER`, se respeta esa configuración y se ignora la lógica automática.

## Prioridad Actual

**AHORA**: OpenAI GPT-4o-mini como principal (producción)
**DESPUÉS**: Una vez configurado Voice Agent API, Groq quedará para desarrollo
