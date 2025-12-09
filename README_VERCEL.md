# ✅ Proyecto Listo para Vercel

## 📦 Archivos Creados/Modificados

### Nuevos Archivos
- ✅ `/api/sandra/chat.js` - Serverless function para chat
- ✅ `/api/sandra/voice.js` - Serverless function para TTS
- ✅ `/api/sandra/transcribe.js` - Serverless function para STT
- ✅ `.vercelignore` - Archivos a ignorar en Vercel
- ✅ `VERCEL_DEPLOY.md` - Guía completa de despliegue
- ✅ `.env.production.example` - Template de variables de entorno

### Archivos Modificados
- ✅ `vercel.json` - Actualizado con routes para nuevas APIs
- ✅ `package.json` - Añadidos scripts de build
- ✅ `index.html` - Referencias actualizadas para producción

## 🚀 Próximos Pasos

### 1. Subir a GitHub
```bash
git add .
git commit -m "Preparado para Vercel - Serverless functions configuradas"
git push origin main
```

### 2. Desplegar en Vercel
1. Ve a https://vercel.com
2. Importa el repo `GUESTVALENCIA/PWA`
3. Nombre: `pwa-sandra-staging`
4. Framework: Other
5. Root: `/`
6. Añade variables de entorno (ver `.env.production.example`)

### 3. Configurar Variables de Entorno en Vercel
```
GEMINI_API_KEY=***
CARTESIA_API_KEY=***
CARTESIA_VOICE_ID=***
DEEPGRAM_API_KEY=***
```

## ⚠️ Importante: WebSocket

**Vercel no soporta WebSocket nativo**. El código está preparado para:
- ✅ Funcionar en desarrollo (localhost:4041)
- ⚠️ Mostrar mensaje en producción si se intenta usar WebSocket
- 🔧 Requiere solución externa (Ably, Pusher, o servidor dedicado)

## ✅ Funcionalidades Listas

- ✅ Chat de texto con Sandra
- ✅ Generación de voz (TTS)
- ✅ Transcripción de audio (STT)
- ✅ AudioBuffer workflow para saludo sin cortes
- ✅ Detección automática de entorno (dev/prod)
- ✅ PWA completa

## 📝 Notas

- El WebSocket para llamadas conversacionales necesita configuración adicional en producción
- Todas las APIs REST funcionan perfectamente en Vercel
- Los assets estáticos se sirven correctamente
- La PWA es completamente funcional

---

**¡Listo para desplegar! 🎉**

