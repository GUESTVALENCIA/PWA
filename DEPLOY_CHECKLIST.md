# ✅ DEPLOY_CHECKLIST.md — GuestsValencia PWA + Sandra IA

Checklist final para desplegar el sistema completo en producción con Sandra IA, Galaxy Widget y backend multicanal.

---

## 🚀 1. Requisitos Previos

* [x] Repositorio en GitHub actualizado (`GUESTVALENCIA/PWA`)
* [x] Código limpio y probado en local (`localhost:4040`)
* [x] Variables `.env.production` preparadas y validadas
* [x] Proyecto conectado con Vercel

---

## 🌐 2. Configuración Vercel

* **Proyecto:** `pwa-sandra-staging` (o `pwa-sandra-prod` en final)
* **Framework Preset:** `Other`
* **Root Directory:** `/`
* **Build Command:** *(vacío o `npm install`)*
* **Output Directory:** `.`

### 🔐 Variables de Entorno (en Vercel UI)

| Nombre               | Requerida | Descripción                      | Entornos         |
| -------------------- | --------- | -------------------------------- | ---------------- |
| `GEMINI_API_KEY`     | ✅         | API Key de Gemini (staging/dev)  | All              |
| `OPENAI_API_KEY`     | ✅         | API Key para GPT-4o (producción) | Production       |
| `GROQ_API_KEY`       | ✅         | API Key para Groq (local/dev)    | Development      |
| `DEEPGRAM_API_KEY`   | ✅         | Transcripción de voz a texto     | All              |
| `CARTESIA_API_KEY`   | ✅         | TTS Cartesia (voz Sandra)        | All              |
| `CARTESIA_VOICE_ID`  | ✅         | ID de voz para TTS de Sandra     | All              |
| `BRIDGEDATA_API_KEY` | ⏳         | (Próxima integración de Booking) | Future           |
| `NEON_DB_URL`        | ⏳         | (Próxima integración con BBDD)   | Future           |

**Nota:** Las variables marcadas con ✅ son requeridas para el funcionamiento actual. Las marcadas con ⏳ son para futuras integraciones.

---

## 🧠 3. IA y Enrutamiento Dinámico

El entorno y modelo se detectan automáticamente con:

* `getEnv()` - Detecta entorno (dev/staging/prod)
* `getDefaultModel()` - Selecciona modelo según entorno
* `getBaseUrl()` - Construye URL base dinámicamente

**Modelos IA según entorno:**

| Entorno       | Modelo           | Proveedor | Archivo              |
| ------------- | ---------------- | --------- | -------------------- |
| `development` | `mixtral-8x7b`   | Groq      | `src/utils/env.js`   |
| `staging`     | `gemini-pro`     | Google    | `src/utils/env.js`   |
| `production`  | `gpt-4o`         | OpenAI    | `src/utils/env.js`   |

**Funciones clave:**
- `getSandraResponse(message)` - Chat de texto
- `sendVoiceToSandra(transcribedText)` - Llamadas de voz
- `flujoCompletoSandraVoz(transcribedText)` - Flujo completo voz
- `connectGalaxyToSandra(widget)` - Integración con widget

---

## 🗣️ 4. Voz de Sandra

### Funcionalidades Implementadas

* ✅ Flujo completo en `flujoCompletoSandraVoz()`
* ✅ TTS funciona 100% en navegador (speechSynthesis)
* ✅ Tono calmado y cálido (`rate: 0.92`, `pitch: 1`)
* ✅ Idioma español (`es-ES`)
* ✅ Fallback automático si TTS falla
* ✅ Control de voz (pausar, reanudar, detener)

### Integración

```javascript
import { flujoCompletoSandraVoz, connectGalaxyToSandra } from '@/utils/env';

// Flujo completo de voz
await flujoCompletoSandraVoz('¿Qué servicios ofrecen?');

// Integración con widget (voz automática)
connectGalaxyToSandra(widgetInstance, { autoSpeak: true });
```

---

## 🧪 5. Test Final

Antes de activar producción:

### Tests de API

* [ ] Verificar `chat`, `voice`, `transcribe` en `/api/sandra/`
* [ ] Probar cada endpoint con Postman o curl
* [ ] Validar respuestas JSON correctas
* [ ] Verificar códigos de estado HTTP

### Tests de Voz

* [ ] Probar voz de Sandra desde el widget Galaxy
* [ ] Verificar reproducción de audio en diferentes navegadores
* [ ] Test con modelos: Groq (dev), Gemini (staging), OpenAI (prod)
* [ ] Validar TTS y STT en dispositivos móviles
* [ ] Verificar integración con latencia: saludo sin cortes (AudioBuffer)

### Tests de Entorno

* [ ] Verificar detección automática de entorno
* [ ] Comprobar selección correcta de modelo por entorno
* [ ] Validar URLs base dinámicas
* [ ] Probar fallback entre modelos

### Tests de Integración

* [ ] Verificar widget Galaxy funciona correctamente
* [ ] Probar chat de texto end-to-end
* [ ] Probar llamadas de voz end-to-end
* [ ] Validar manejo de errores
* [ ] Verificar logging y debugging

---

## 🏁 6. Lanzamiento

### Pasos Pre-Deploy

* [ ] Revisar código final en branch `main`
* [ ] Verificar que todas las variables de entorno estén configuradas
* [ ] Confirmar que los tests pasan en staging
* [ ] Revisar logs de errores en Vercel

### Pasos Deploy

* [ ] Dominio final: `guestsvalencia.com` (pendiente conectar en Vercel)
* [ ] Activar entorno `production` en Vercel
* [ ] Verificar deployment exitoso
* [ ] Comprobar que el sitio carga correctamente

### Pasos Post-Deploy

* [ ] Rotar claves API si es necesario (post-deploy)
* [ ] Confirmar feedback con equipo QA
* [ ] Monitorear logs de producción
* [ ] Verificar métricas de uso
* [ ] Documentar cualquier incidencia

---

## 👨‍💻 7. Mantenimiento

### Arquitectura

* ✅ Toda lógica IA está centralizada en `src/utils/env.js`
* ✅ Variables rotatorias se gestionarán en `.env` + Vercel UI
* ✅ Serverless functions en `api/sandra/` (chat, voice, transcribe)
* ✅ Widget Galaxy integrado con Sandra automáticamente

### Documentación Técnica

Mantenida en:

* `ONBOARDING_TECNICO.md` - **Guía de onboarding para nuevos desarrolladores** ⭐
* `DEPLOY_PRODUCCION.md` - **Guía completa de deployment a producción** ⭐
* `FLUJO_COMPLETO_VOZ_SANDRA.md` - Flujo de voz completo
* `QUICK_START.md` - Inicio rápido
* `USAGE_EXAMPLES.md` - Ejemplos prácticos
* `ENV_UTILS_GUIDE.md` - Guía técnica completa
* `ENV_VARIABLES_GUIDE.md` - Variables de entorno
* `DEPLOY_CHECKLIST.md` - Checklist técnico (este documento)

### Monitoreo

* Monitorear logs de Vercel Functions
* Verificar uso de APIs (rate limits)
* Revisar errores de usuarios
* Mantener actualizadas las API keys

---

## 💎 8. Supervisión Técnica

### Responsabilidades

* **Desarrollo:** Mantener código actualizado en `src/utils/env.js`
* **DevOps:** Gestionar variables de entorno en Vercel
* **QA:** Validar funcionalidades antes de producción
* **Soporte:** Monitorear logs y resolver incidencias

### Contactos

* **Equipo IA Central:** Coordinación para cambios mayores
* **Vercel Support:** Para temas de deployment
* **API Providers:** Para temas de rate limits o keys

### Reglas Importantes

⚠️ **NO alterar el flujo** si no es imprescindible  
⚠️ **Coordinación requerida** con equipo de IA central antes de cambios mayores  
⚠️ **Testing obligatorio** en staging antes de producción  
⚠️ **Variables de entorno** deben estar configuradas correctamente

---

## 🎯 Checklist Resumen

### Pre-Deploy ✅
- [x] Código probado en local
- [x] Variables de entorno preparadas
- [x] Documentación actualizada
- [x] Tests realizados en staging

### Deploy 🚀
- [ ] Configuración Vercel completa
- [ ] Variables de entorno configuradas
- [ ] Tests finales pasados
- [ ] Deploy a producción ejecutado

### Post-Deploy 📊
- [ ] Verificación de funcionamiento
- [ ] Monitoreo activo
- [ ] Feedback de QA recibido
- [ ] Documentación de incidencias

---

**Última actualización:** Sistema completo implementado y listo para producción ✨

**Sandra IA está completa con detección automática de entorno, selección inteligente de modelos, y flujo completo de voz integrado.**
