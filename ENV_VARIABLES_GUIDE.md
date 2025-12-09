# 🔐 Guía Completa de Variables de Entorno - Sandra PWA

## 📋 Resumen

Este proyecto requiere variables de entorno configuradas para funcionar correctamente. Usa `.env.production.example` como plantilla.

**⚠️ NUNCA subas archivos `.env` con valores reales al repositorio.**

---

## ✅ Variables Mínimas Requeridas

Para funcionalidad básica de Sandra:

```env
GEMINI_API_KEY=          # Para LLM (Gemini)
CARTESIA_API_KEY=        # Para TTS (voz de Sandra)
CARTESIA_VOICE_ID=       # ID de voz en Cartesia
DEEPGRAM_API_KEY=        # Para STT (transcripción)
```

---

## 🌐 Modelos de IA

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `GEMINI_API_KEY` | Gemini para LLM (desarrollo) | ✅ Sí |
| `OPENAI_API_KEY` | GPT-4o para producción | ⚠️ Opcional |
| `OPENAI_MODEL_DEFAULT` | Modelo por defecto (gpt-4o) | ⚠️ Opcional |
| `OPENAI_MODEL_GUEST` | Modelo para huéspedes | ⚠️ Opcional |
| `OPENAI_MODEL_VISITOR` | Modelo para visitantes | ⚠️ Opcional |
| `GROQ_API_KEY` | Groq para LLM rápido | ⚠️ Opcional |
| `ANTHROPIC_API_KEY` | Claude (Anthropic) | ⚠️ Opcional |

---

## 🗣️ Voz / TTS (Text-to-Speech)

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `CARTESIA_API_KEY` | Cartesia TTS (voz principal) | ✅ Sí |
| `CARTESIA_VOICE_ID` | ID de voz Sandra en Cartesia | ✅ Sí |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (alternativo) | ⚠️ Opcional |
| `ELEVENLABS_VOICE_ID` | ID de voz en ElevenLabs | ⚠️ Opcional |
| `HEYGEN_API_KEY` | Heygen para avatares de video | ⚠️ Opcional |
| `HEYGEN_AVATAR_ID` | ID de avatar en Heygen | ⚠️ Opcional |
| `ID_VIDEO_AVATAR` | ID de video avatar | ⚠️ Opcional |

---

## 🎙️ Audio / STT (Speech-to-Text)

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `DEEPGRAM_API_KEY` | Deepgram para transcripción | ✅ Sí |

---

## 🛰️ Brightdata Proxy

Para web scraping y navegación IA:

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `BRIGHTDATA_PROXY_URL` | WebSocket proxy | ⚠️ Opcional |
| `BRIGHTDATA_HTTP_PROXY` | HTTP proxy | ⚠️ Opcional |

---

## 🗄️ Base de Datos

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `NEON_DATABASE_URL` | PostgreSQL (Neon) | ⚠️ Opcional |
| `SUPABASE_API_KEY` | Supabase | ⚠️ Opcional |

---

## 💬 Mensajería

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `TWILIO_SID` | Twilio Account SID | ⚠️ Opcional |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ⚠️ Opcional |
| `TWILIO_PHONE_NUMBER` | Número de teléfono Twilio | ⚠️ Opcional |
| `WHATSAPP_SANDRA` | Número de WhatsApp | ⚠️ Opcional |
| `META_ACCESS_TOKEN` | Meta API Token | ⚠️ Opcional |
| `META_PHONE_NUMBER_ID` | Meta Phone Number ID | ⚠️ Opcional |

---

## 💳 Pasarelas de Pago

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `PAYPAL_CLIENT_ID` | PayPal Client ID | ⚠️ Opcional |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | ⚠️ Opcional |
| `PAYPAL_MODE` | sandbox o production | ⚠️ Opcional |

---

## 🔒 Seguridad

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `ADMIN_SECRET_KEY` | Clave secreta admin | ⚠️ Opcional |
| `TRAINING_API_KEY` | API key para training | ⚠️ Opcional |

---

## 🎥 LiveKit

Para streaming y media real-time:

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `LIVEKIT_URL` | URL del servidor LiveKit | ⚠️ Opcional |
| `LIVEKIT_API_KEY` | API Key de LiveKit | ⚠️ Opcional |
| `LIVEKIT_API_SECRET` | API Secret de LiveKit | ⚠️ Opcional |

---

## ☁️ Vercel Deploy

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `VERCEL_PROJECT_ID` | ID del proyecto Vercel | ⚠️ Opcional |
| `VERCEL_API_TOKEN` | Token de API de Vercel | ⚠️ Opcional |

---

## 🚀 Cómo Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** > **Environment Variables**
3. Añade cada variable manualmente
4. Selecciona ambientes: Production, Preview, Development
5. Guarda

---

## 🔁 Rotación de Claves

**Recomendado:** Rotar claves sensibles cada 30-60 días

1. Genera nuevas claves
2. Actualiza en Vercel
3. Verifica funcionamiento
4. Elimina claves antiguas

---

## 📝 Notas de Seguridad

- ✅ Usa `.env.production.example` como plantilla
- ❌ NUNCA subas `.env` reales al repositorio
- ✅ Usa GitHub Secrets o 1Password para backups
- ✅ Separa entornos: `.env.production`, `.env.development`, `.env.staging`
- ✅ Rota claves regularmente

---

**Ver `.env.production.example` para la lista completa de variables.**

