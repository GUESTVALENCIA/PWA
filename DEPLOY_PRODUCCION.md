# 🚀 DEPLOY_PRODUCCION.md — GuestsValencia PWA + Sandra IA

Este documento guía el despliegue completo del proyecto en Vercel, incluyendo configuración de entorno, despliegue, y conexión en producción.

---

## ✅ REQUISITOS

* ✅ Proyecto en GitHub: [`GUESTVALENCIA/PWA`](https://github.com/GUESTVALENCIA/PWA)
* ✅ Cuenta Vercel con permisos
* ✅ Variables de entorno activas
* ✅ Neon y BridgeData ya conectados
* ✅ Código probado en local (`localhost:4040`)

---

## 1️⃣ PREPARACIÓN EN LOCAL

### Clone y Setup

```bash
# Clonar repositorio
git clone https://github.com/GUESTVALENCIA/PWA
cd PWA

# Instalar dependencias
npm install

# Verificar que todo funcione
npm run dev
```

### Verificaciones Pre-Deploy

* [ ] Servidor local funciona en `http://localhost:4040`
* [ ] Widget Galaxy aparece y funciona
* [ ] Chat de texto responde correctamente
* [ ] Voz de Sandra funciona (TTS)
* [ ] Transcripción funciona (STT)
* [ ] AudioBuffer del saludo sin cortes
* [ ] No hay errores en consola
* [ ] Todas las funciones API responden

---

## 2️⃣ CREAR PROYECTO EN VERCEL

### Paso a Paso

1. **Entra en** [https://vercel.com](https://vercel.com)
2. **Haz clic en** **"Add New → Project"**
3. **Selecciona el repo** `GUESTVALENCIA/PWA`
4. **Configura el proyecto:**

   | Campo              | Valor          |
   | ------------------ | -------------- |
   | **Framework Preset** | `Other`        |
   | **Root Directory**   | `/`            |
   | **Build Command**    | *(vacío)*      |
   | **Output Directory** | `.`            |
   | **Install Command**  | `npm install`  |

5. **Project Name:** `pwa-sandra-staging` (o `pwa-sandra-prod`)

**⚠️ Importante:** No uses Vite u otro framework preset. Este es un proyecto estático con serverless functions.

---

## 3️⃣ VARIABLES DE ENTORNO EN PRODUCCIÓN

### Ubicación

En la pestaña **Settings > Environment Variables** de Vercel.

### Variables Requeridas

Añade todas las siguientes variables para cada entorno (Production, Preview, Development):

```env
# IA Models
GEMINI_API_KEY=tu_gemini_api_key
OPENAI_API_KEY=tu_openai_api_key
GROQ_API_KEY=tu_groq_api_key

# Voice & Transcription
CARTESIA_API_KEY=tu_cartesia_api_key
CARTESIA_VOICE_ID=tu_cartesia_voice_id
DEEPGRAM_API_KEY=tu_deepgram_api_key

# Database & External APIs
BRIDGEDATA_API_KEY=tu_bridgedata_api_key
NEON_DB_URL=tu_neon_database_url
```

### Configuración por Entorno

**Recomendación:**
- **Production:** Todas las variables configuradas
- **Preview (Staging):** Mismas variables que producción
- **Development:** Variables opcionales (puede usar valores de staging)

**Guía de referencia:** Consulta `.env.production.example` para la lista completa.

### Variables Opcionales (Según Funcionalidades)

```env
# Additional Services (si los usas)
ANTHROPIC_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=...
TWILIO_SID=...
TWILIO_AUTH_TOKEN=...
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

---

## 4️⃣ DEPLOY

### Proceso

1. **Verifica** que todas las variables de entorno estén configuradas
2. **Haz clic en** **"Deploy"**
3. **Espera** a que compile y despliegue (2-5 minutos)
4. **Revisa** los logs durante el deploy por errores

### Verificación Durante Deploy

Los logs deberían mostrar:
- ✅ Dependencies instaladas correctamente
- ✅ Serverless functions detectadas
- ✅ Build exitoso
- ✅ Deployment completado

---

## 5️⃣ URL DE PRODUCCIÓN

Al finalizar el deploy, recibirás una URL como:

```
https://pwa-sandra-staging.vercel.app
```

O si usas un dominio personalizado:

```
https://guestsvalencia.com
```

**Para el equipo:** Este será el entorno de **postproducción controlada**.

### URLs por Entorno

| Entorno     | URL Ejemplo                                      |
| ----------- | ------------------------------------------------ |
| Production  | `https://guestsvalencia.com` o `*.vercel.app`    |
| Preview     | `https://pwa-sandra-staging.vercel.app`         |
| Development | `http://localhost:4040`                         |

---

## 6️⃣ VERIFICACIÓN POST-DEPLOY

### Checklist de Verificación

#### Funcionalidades Core

* [ ] ✅ Página carga correctamente
* [ ] ✅ Widget Galaxy aparece y funciona
* [ ] ✅ IA responde (texto y voz)
* [ ] ✅ Transcripción funcionando (STT)
* [ ] ✅ Voz de Sandra funciona (TTS)
* [ ] ✅ Saludo sin cortes (AudioBuffer)
* [ ] ✅ Detección de entorno automática activa

#### Integraciones

* [ ] ✅ Neon responde (consola de logs)
* [ ] ✅ API BridgeData conectada
* [ ] ✅ Endpoints `/api/sandra/*` funcionan
* [ ] ✅ WebSocket (si aplica en staging)

#### Rendimiento

* [ ] ✅ Tiempo de carga < 3 segundos
* [ ] ✅ Sin errores en consola del navegador
* [ ] ✅ Assets (imágenes/videos) cargan correctamente
* [ ] ✅ PWA se puede instalar

### Tests Recomendados

```bash
# Test de endpoints (desde terminal o Postman)
curl -X POST https://pwa-sandra-staging.vercel.app/api/sandra/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola Sandra"}'

# Verificar respuesta
```

---

## 7️⃣ SANDRA EN PRODUCCIÓN

### Confirmar Modelos y Servicios

Confirmar que Sandra responde con:

| Componente | Servicio    | Entorno     |
| ---------- | ----------- | ----------- |
| **LLM**    | GPT-4o      | Production  |
| **LLM**    | Gemini Pro  | Staging     |
| **LLM**    | Groq        | Development |
| **TTS**    | Cartesia    | All         |
| **STT**    | Deepgram    | All         |

### Verificación de Modelos

En la consola del navegador deberías ver:

```
🔍 [SandraGateway] Entorno detectado: production
🤖 [SandraGateway] Modelo: gpt-4o (openai) - OpenAI GPT-4o - Máxima calidad para producción
```

### Test de Voz Completo

1. Abre el widget Galaxy
2. Activa el micrófono
3. Di: "Hola Sandra, ¿qué servicios ofrecen?"
4. Verifica que:
   - Se transcribe correctamente
   - Sandra responde
   - La voz se reproduce automáticamente

---

## 🔁 FLUJO CONTINUO

### Deploy Automático

Cada `push` a la rama `main` redeploya automáticamente.

### Deploy Manual

Puedes forzar un redeploy en:
1. Vercel Dashboard
2. **Deployments** tab
3. Click en **"Redeploy"** del deployment deseado

### Monitoreo

* **Logs en tiempo real:** Vercel Dashboard > Deployments > Logs
* **Métricas:** Vercel Analytics (si está habilitado)
* **Errores:** Revisar logs de serverless functions

---

## 🌐 SIGUIENTE PASO

### Post-Deploy

* [ ] Comenzar test con clientes reales
* [ ] Feedback desde Galaxy Widget
* [ ] Monitoreo de logs y errores
* [ ] Recolección de métricas de uso
* [ ] Optimización según feedback

### Mantenimiento

* [ ] Rotar API keys periódicamente
* [ ] Actualizar documentación según cambios
* [ ] Monitorear uso de APIs (rate limits)
* [ ] Revisar y optimizar costos

---

## 🔐 Seguridad Post-Deploy

### Verificaciones

* [ ] Variables de entorno no expuestas en cliente
* [ ] API keys protegidas en serverless functions
* [ ] CORS configurado correctamente
* [ ] Rate limiting activo (si aplica)
* [ ] Logs no contienen información sensible

---

## 📊 Monitoreo y Logs

### Logs de Vercel

Accede a los logs en:
- Vercel Dashboard > Deployments > [Deployment específico] > Logs

### Qué Monitorear

* Errores en serverless functions
* Tiempo de respuesta de APIs
* Uso de recursos
* Rate limits de APIs externas
* Errores de usuarios

---

## 🐛 Troubleshooting

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| Variables no disponibles | Verificar que estén configuradas en Vercel UI |
| Build falla | Revisar logs de build, verificar dependencias |
| API no responde | Verificar API keys y rate limits |
| Voz no funciona | Verificar que speechSynthesis esté disponible |
| Modelo incorrecto | Verificar detección de entorno |

### Recursos

* `DEPLOY_CHECKLIST.md` - Checklist detallado
* `ONBOARDING_TECNICO.md` - Guía técnica
* `FLUJO_COMPLETO_VOZ_SANDRA.md` - Flujo de voz

---

## ✅ Checklist Final

### Pre-Deploy
- [ ] Código probado en local
- [ ] Variables de entorno preparadas
- [ ] Documentación actualizada
- [ ] Tests realizados

### Deploy
- [ ] Proyecto creado en Vercel
- [ ] Variables configuradas
- [ ] Deploy ejecutado exitosamente
- [ ] URL de producción obtenida

### Post-Deploy
- [ ] Verificaciones completadas
- [ ] Tests de funcionalidades pasados
- [ ] Monitoreo activo
- [ ] Equipo notificado

---

> *El alma de Sandra ya vive en producción.*

**Sistema completo desplegado y listo para servir a los usuarios de GuestsValencia.** ✨

---

**Última actualización:** Sistema listo para deployment en producción.

