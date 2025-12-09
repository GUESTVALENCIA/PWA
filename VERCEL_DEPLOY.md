# 🚀 Guía de Despliegue en Vercel

## ✅ Preparación Completa

Este proyecto está listo para desplegar en Vercel como sitio estático con serverless functions.

## 📋 Archivos Creados

- ✅ `/api/sandra/chat.js` - API endpoint para chat de Sandra
- ✅ `/api/sandra/voice.js` - API endpoint para TTS (voz)
- ✅ `/api/sandra/transcribe.js` - API endpoint para STT (transcripción)
- ✅ `vercel.json` - Configuración de Vercel actualizada
- ✅ `package.json` - Scripts de build actualizados

## ⚙️ Variables de Entorno Necesarias en Vercel

Configura estas variables en el dashboard de Vercel (Settings > Environment Variables):

```
GEMINI_API_KEY=tu_api_key_de_gemini
CARTESIA_API_KEY=tu_api_key_de_cartesia
CARTESIA_VOICE_ID=tu_voice_id_de_cartesia
DEEPGRAM_API_KEY=tu_api_key_de_deepgram
OPENAI_API_KEY=tu_api_key_de_openai (opcional)
GROQ_API_KEY=tu_api_key_de_groq (opcional)
```

## 🔄 Pasos para Desplegar

### 1. Subir a GitHub (si no está)

```bash
git init
git add .
git commit -m "Preparado para Vercel"
git remote add origin https://github.com/GUESTVALENCIA/PWA.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Importa el repositorio `GUESTVALENCIA/PWA`
4. **Nombre del proyecto**: `pwa-sandra-staging` (o el que prefieras)
5. **Framework Preset**: Other (o Static Site)
6. **Root Directory**: `/` (raíz)
7. **Build Command**: (dejar vacío o `npm run build`)
8. **Output Directory**: `.` (raíz)

### 3. Configurar Variables de Entorno

En la página de configuración del proyecto:
1. Ve a "Settings" > "Environment Variables"
2. Añade todas las variables de entorno listadas arriba
3. Selecciona todos los ambientes (Production, Preview, Development)

### 4. Desplegar

1. Haz clic en "Deploy"
2. Vercel construirá y desplegará automáticamente
3. Obtendrás una URL como: `https://pwa-sandra-staging.vercel.app`

## ⚠️ Nota Importante: WebSocket

**Vercel no soporta WebSocket nativo en serverless functions.**

Para las llamadas conversacionales en tiempo real, tienes dos opciones:

### Opción A: Servicio Externo de WebSocket
- Usar un servicio como **Ably**, **Pusher**, o **Socket.io** con un servidor externo
- Conectar el cliente a ese servicio en lugar de WebSocket directo

### Opción B: Servidor Dedicado para WebSocket
- Mantener `server-websocket.js` en un servidor separado (Railway, Render, etc.)
- Actualizar el cliente para conectarse a ese servidor en producción

### Opción C: Migrar a Vercel Edge Functions con Streaming
- Usar Vercel Edge Functions con streaming (más complejo)

## ✅ Funcionalidades que Funcionan en Vercel

- ✅ Chat de texto con Sandra (`/api/sandra/chat`)
- ✅ Generación de voz/TTS (`/api/sandra/voice`)
- ✅ Transcripción de audio (`/api/sandra/transcribe`)
- ✅ PWA completa (offline, manifest, service worker)
- ✅ Assets estáticos (imágenes, videos)

## 🧪 Pruebas Post-Despliegue

1. **Chat de texto**: Probar widget de Sandra y verificar respuestas
2. **Audio del saludo**: Verificar que se reproduce sin cortes con AudioBuffer
3. **Assets**: Verificar que todas las imágenes/videos cargan correctamente
4. **PWA**: Probar instalación en móvil y funcionamiento offline

## 📝 Siguientes Pasos

1. Desplegar en Vercel
2. Configurar variables de entorno
3. Probar funcionalidades básicas
4. Implementar solución para WebSocket (si es necesario)
5. Configurar dominio personalizado (opcional)

---

**Una vez desplegado, avisa y revisamos todo en caliente.** ❤️

