# 🔐 VARIABLES DE ENTORNO COMPLETAS - Deployment Vercel

Lista completa de todas las variables de entorno necesarias para el sistema completo.

---

## ✅ VARIABLES CRÍTICAS (OBLIGATORIAS)

Estas variables **DEBEN** estar configuradas para que el sistema funcione:

```env
# IA Models - Core
GEMINI_API_KEY=tu_gemini_api_key_aqui
OPENAI_API_KEY=tu_openai_api_key_aqui
GROQ_API_KEY=tu_groq_api_key_aqui

# Voice & Transcription
CARTESIA_API_KEY=tu_cartesia_api_key_aqui
CARTESIA_VOICE_ID=tu_cartesia_voice_id_aqui
DEEPGRAM_API_KEY=tu_deepgram_api_key_aqui

# Database & Booking
BRIDGEDATA_API_KEY=tu_bridgedata_api_key_aqui
NEON_DB_URL=postgresql://usuario:password@host:5432/database
```

---

## ⚠️ VARIABLES OPCIONALES

Estas variables mejoran funcionalidades pero el sistema puede funcionar sin ellas:

### Servicios de IA Adicionales

```env
ANTHROPIC_API_KEY=tu_anthropic_api_key_aqui
```

### Voz Alternativa

```env
ELEVENLABS_API_KEY=tu_elevenlabs_api_key_aqui
ELEVENLABS_VOICE_ID=tu_elevenlabs_voice_id_aqui
```

### Avatares de Video

```env
HEYGEN_API_KEY=tu_heygen_api_key_aqui
HEYGEN_AVATAR_ID=tu_heygen_avatar_id_aqui
ID_VIDEO_AVATAR=tu_video_avatar_id_aqui
```

### Proxy y Red

```env
BRIGHTDATA_PROXY_URL=tu_brightdata_proxy_url_aqui
BRIGHTDATA_HTTP_PROXY=tu_brightdata_http_proxy_aqui
```

### Base de Datos Adicional

```env
SUPABASE_API_KEY=tu_supabase_api_key_aqui
```

### Comunicaciones

```env
TWILIO_SID=tu_twilio_sid_aqui
TWILIO_AUTH_TOKEN=tu_twilio_auth_token_aqui
TWILIO_PHONE_NUMBER=tu_twilio_phone_number_aqui
WHATSAPP_SANDRA=tu_whatsapp_number_aqui
```

### Meta / WhatsApp Business

```env
META_ACCESS_TOKEN=tu_meta_access_token_aqui
META_PHONE_NUMBER_ID=tu_meta_phone_number_id_aqui
```

### Pagos

```env
PAYPAL_CLIENT_ID=tu_paypal_client_id_aqui
PAYPAL_CLIENT_SECRET=tu_paypal_client_secret_aqui
PAYPAL_MODE=sandbox
```

### Seguridad

```env
ADMIN_SECRET_KEY=tu_admin_secret_key_aqui
TRAINING_API_KEY=tu_training_api_key_aqui
```

### LiveKit (Video/Voz)

```env
LIVEKIT_URL=wss://tu-livekit-server.com
LIVEKIT_API_KEY=tu_livekit_api_key_aqui
LIVEKIT_API_SECRET=tu_livekit_api_secret_aqui
```

---

## 📋 CONFIGURACIÓN EN VERCEL

### Opción 1: Script Automático

```bash
# PowerShell
.\deploy-complete.ps1

# Node.js
node deploy-vercel.js
```

### Opción 2: Manual en Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings > Environment Variables**
4. Añade cada variable:
   - **Name**: `GEMINI_API_KEY` (ejemplo)
   - **Value**: `tu_clave_aqui`
   - **Environments**: Selecciona Production, Preview, Development
5. Repite para todas las variables

### Opción 3: Vercel CLI

```bash
# Para cada variable (ejemplo):
echo "tu_clave_aqui" | vercel env add GEMINI_API_KEY production
echo "tu_clave_aqui" | vercel env add GEMINI_API_KEY preview
echo "tu_clave_aqui" | vercel env add GEMINI_API_KEY development
```

---

## 🔍 VERIFICACIÓN POST-CONFIGURACIÓN

Después de configurar las variables, verifica:

1. **En Vercel Dashboard:**
   - Settings > Environment Variables
   - Todas las variables críticas deben estar presentes

2. **En el código:**
   - Las serverless functions pueden acceder a `process.env.VARIABLE_NAME`

3. **Después del deploy:**
   - Verifica los logs en Vercel Dashboard
   - Prueba los endpoints `/api/sandra/*`

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **NUNCA** commits las claves API al repositorio
- ✅ Usa `.env.local` para desarrollo local (está en `.gitignore`)
- ✅ En producción, configura solo en Vercel UI
- 🔄 Rota las claves periódicamente por seguridad
- 🔒 Usa diferentes claves para staging y production si es posible

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Missing API Key"

1. Verifica que la variable esté configurada en Vercel
2. Verifica que el nombre sea exacto (case-sensitive)
3. Reinicia el deployment después de añadir variables

### Variables no disponibles en código

1. Asegúrate de que estén configuradas para el entorno correcto
2. Verifica que el deployment sea reciente (después de añadir variables)
3. Revisa los logs de la serverless function

---

**Última actualización:** Sistema completo con todas las integraciones.

