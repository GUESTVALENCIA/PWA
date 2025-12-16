# Sistema Galaxy - Configuración Local

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor Local

```bash
node server.js
```

El servidor se iniciará en `http://localhost:4040`

### 2. Abrir la PWA

Abre `index.html` en tu navegador. El widget de Sandra se conectará automáticamente al servidor local.

## 📡 Endpoints de la API

- **Chat:** `POST http://localhost:4040/api/sandra/chat`
- **Voice (TTS):** `POST http://localhost:4040/api/sandra/voice`

## 🔑 API Keys Configuradas

- ✅ **Gemini API:** Configurada
- ✅ **Cartesia API:** Configurada (Voice ID: `a34aec03-0f17-4fff-903f-d9458a8a92a6`)
- ⚠️ **DeepGram:** No configurado (usando Gemini Live para STT/TTS)

## 📝 Notas

- El servidor solo funciona en desarrollo local
- Las API keys están hardcodeadas en `server.js` (solo para desarrollo)
- En producción, usar variables de entorno

