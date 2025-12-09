# 👨‍💻 ONBOARDING_TECNICO.md — GuestsValencia PWA + Sandra IA

Bienvenido/a al sistema de voz e inteligencia artificial de GuestsValencia.

Este documento te guía para integrarte al proyecto con claridad, sin romper la estructura ya establecida.

---

## 📦 Requisitos Previos

* ✅ Node.js ≥ 18 instalado
* ✅ Cuenta en GitHub (acceso al repo: `GUESTVALENCIA/PWA`)
* ✅ Acceso a Vercel (proyecto `pwa-sandra-staging`)
* ✅ Claves API (proporcionadas por el creador)
* ✅ Editor de código (VS Code recomendado)

---

## 📁 Estructura del Proyecto

```
/
├── api/
│   ├── sandra/
│   │   ├── chat.js          → IA (LLM)
│   │   ├── voice.js         → Voz (TTS)
│   │   └── transcribe.js    → Transcripción (STT)
│   ├── db/
│   │   └── query.js         → Conexión a base de datos Neon
│   └── bridge/
│       └── index.js         → API BridgeData
├── public/
│   ├── assets/
│   │   ├── images/
│   │   ├── videos/
│   │   └── js/
│   └── manifest.webmanifest → PWA manifest
├── src/
│   ├── utils/
│   │   └── env.js           → Detección de entorno / rutas IA
├── .env.production.example  → Variables necesarias
├── vercel.json              → Configuración Vercel
├── package.json             → Dependencies y scripts
└── index.html               → UI principal (Galaxy Widget)
```

---

## 🔐 Variables de Entorno

Guárdalas en Vercel o en `.env.local` para desarrollo:

### Variables Requeridas

```env
# IA Models
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=

# Voice & Transcription
CARTESIA_API_KEY=
CARTESIA_VOICE_ID=
DEEPGRAM_API_KEY=

# Database & External APIs
BRIDGEDATA_API_KEY=
NEON_DB_URL=
```

### Variables Opcionales

```env
# Additional Services
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=
TWILIO_SID=
TWILIO_AUTH_TOKEN=
LIVEKIT_URL=
LIVEKIT_API_KEY=
```

**⚠️ Importante:**
- No compartas las claves
- Las variables pueden rotarse periódicamente
- Usa `.env.local` para desarrollo (está en `.gitignore`)
- En producción, configura en Vercel UI

---

## 🧠 IA Multimodelo

Sandra detecta automáticamente el entorno y elige el modelo:

| Entorno       | Modelo IA    | Proveedor | Archivo              |
| ------------- | ------------ | --------- | -------------------- |
| `development` | mixtral-8x7b | Groq      | `src/utils/env.js`   |
| `staging`     | gemini-pro   | Google    | `src/utils/env.js`   |
| `production`  | gpt-4o       | OpenAI    | `src/utils/env.js`   |

**Funciones clave en `src/utils/env.js`:**

```javascript
getEnv()              // Detecta entorno automáticamente
getDefaultModel()     // Selecciona modelo según entorno
getBaseUrl()          // Construye URL base dinámicamente
getSandraResponse()   // Chat de texto
sendVoiceToSandra()   // Llamadas de voz
flujoCompletoSandraVoz()  // Flujo completo voz
```

---

## 🗣️ Flujo de Voz

### Función Maestra

**`flujoCompletoSandraVoz(transcribedText)`**

Proceso completo:

1. **Transcribe** (STT vía Deepgram) → Texto del usuario
2. **Procesa la intención** (IA según entorno) → Respuesta de Sandra
3. **Responde por voz** (TTS vía Cartesia o speechSynthesis) → Audio

### Uso

```javascript
import { flujoCompletoSandraVoz } from '@/utils/env';

// Después de transcribir audio del usuario
await flujoCompletoSandraVoz('¿Qué servicios ofrecen en el apartamento?');
```

### Integración con Widget Galaxy

```javascript
import { connectGalaxyToSandra } from '@/utils/env';

connectGalaxyToSandra(widgetInstance, {
  autoSpeak: true  // Reproduce voz automáticamente
});
```

**Ver documentación completa en:** `FLUJO_COMPLETO_VOZ_SANDRA.md`

---

## 🗃️ Conexión a Base de Datos (Neon)

**Archivo:** `/api/db/query.js`

### Características

* Usa `pg` (PostgreSQL) para conectar a Neon usando `NEON_DB_URL`
* Toda petición pasa por función `handler(req, res)`
* Se puede usar tanto desde cliente como desde backend
* Protegido contra SQL injection
* Manejo de errores robusto

### Ejemplo de Uso

```javascript
// Desde el cliente
const response = await fetch('/api/db/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sql: 'SELECT * FROM reservas WHERE estado = $1',
    params: ['confirmada']
  })
});

const data = await response.json();
console.log(data.rows);
```

### Estructura de Respuesta

```json
{
  "success": true,
  "rows": [...],
  "rowCount": 10
}
```

---

## 🔗 Conexión a BridgeData API

**Archivo:** `/api/bridge/index.js`

### Características

* Usa `BRIDGEDATA_API_KEY` para autenticación
* Rutas protegidas contra abuso
* Timeout automático configurado
* Cacheo de respuestas cuando es apropiado

### Rutas Disponibles

| Ruta                              | Método | Descripción                    |
| --------------------------------- | ------ | ------------------------------ |
| `/api/bridge/property/:id`        | GET    | Obtener información de propiedad |
| `/api/bridge/availability/:id`    | GET    | Disponibilidad de propiedad    |
| `/api/bridge/search`              | GET    | Búsqueda de propiedades        |
| `/api/bridge/booking`             | POST   | Crear reserva                  |

### Ejemplo de Uso

```javascript
// Obtener información de propiedad
const response = await fetch('/api/bridge/property/123');
const property = await response.json();

// Buscar propiedades
const searchResponse = await fetch('/api/bridge/search?city=Valencia&guests=2');
const properties = await searchResponse.json();
```

---

## 🧪 Testing Local

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone https://github.com/GUESTVALENCIA/PWA
cd PWA

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.production.example .env.local
# Editar .env.local con tus claves API

# 4. Iniciar servidor local
npm run dev
# O si tienes scripts personalizados:
node server.js        # Servidor HTTP (puerto 4040)
node server-websocket.js  # Servidor WebSocket (puerto 4041)
```

### Acceso

* **HTTP:** `http://localhost:4040`
* **WebSocket:** `ws://localhost:4041` (solo desarrollo)

### Tests a Realizar

1. ✅ Página carga correctamente
2. ✅ Widget Galaxy aparece y funciona
3. ✅ Chat de texto responde
4. ✅ Voz de Sandra funciona (TTS)
5. ✅ Transcripción de audio funciona (STT)
6. ✅ AudioBuffer del saludo sin cortes
7. ✅ PWA se puede instalar

---

## 📦 Despliegue en Vercel

Vercel detecta funciones en `/api/*` automáticamente.

### Pasos Rápidos

1. Push a GitHub
2. Conectar repositorio en Vercel
3. Configurar variables de entorno
4. Deploy

**Ver guías completas en:**
* `DEPLOY_PRODUCCION.md` - **Guía completa de deployment a producción** ⭐
* `DEPLOY_CHECKLIST.md` - Checklist técnico detallado

### Configuración Vercel

* **Framework Preset:** `Other`
* **Root Directory:** `/`
* **Build Command:** *(vacío)*
* **Output Directory:** `.`

---

## 🔧 Scripts Disponibles

```json
{
  "dev": "node server.js",
  "websocket": "node server-websocket.js",
  "build": "echo 'No build needed - static project'",
  "preview": "node server.js"
}
```

---

## 📚 Documentación Importante

### Documentos Principales

1. **`FLUJO_COMPLETO_VOZ_SANDRA.md`** ⭐
   - Flujo completo de voz documentado
   - Funciones y ejemplos

2. **`QUICK_START.md`**
   - Inicio rápido del sistema
   - Ejemplos básicos

3. **`USAGE_EXAMPLES.md`**
   - Ejemplos prácticos completos
   - Casos de uso reales

4. **`ENV_UTILS_GUIDE.md`**
   - Guía técnica completa
   - Todas las funciones documentadas

5. **`DEPLOY_CHECKLIST.md`**
   - Checklist de deployment
   - Configuración Vercel

6. **`ENV_VARIABLES_GUIDE.md`**
   - Variables de entorno requeridas
   - Configuración por entorno

---

## ⚠️ Normas Técnicas

### ❌ NO Hacer

* **NO edites directamente `src/utils/env.js` sin revisión**
  - Es el corazón del sistema
  - Requiere coordinación con el equipo

* **NO modifiques `index.html` si no sabes cómo funciona Galaxy**
  - La estructura del widget está protegida
  - Consulta antes de hacer cambios

* **NO subas `.env` o `.env.local` al repo**
  - Está en `.gitignore`
  - Las claves son sensibles

* **NO cambies el flujo de voz sin coordinación**
  - `flujoCompletoSandraVoz()` es crítico
  - Requiere testing exhaustivo

* **NO despliegues a producción sin pasar por staging**
  - Siempre prueba primero en staging
  - Valida todos los tests

### ✅ Hacer

* ✅ Usar branches para nuevas features
* ✅ Hacer PRs para revisión
* ✅ Probar en local antes de commit
* ✅ Documentar cambios importantes
* ✅ Seguir la estructura existente
* ✅ Coordinar cambios mayores con el equipo

---

## 🐛 Debugging

### Logs en Consola

El sistema incluye logging detallado:

```javascript
🔍 [SandraGateway] Entorno detectado: development
🤖 [SandraGateway] Modelo: mixtral-8x7b (groq)
🔊 Sandra está hablando...
✅ Sandra ha terminado de hablar
```

### Errores Comunes

| Error | Solución |
|-------|----------|
| `API key no configurada` | Verificar variables en `.env.local` o Vercel |
| `speechSynthesis no disponible` | Verificar que estés en navegador (no Node.js) |
| `WebSocket no disponible` | Solo funciona en desarrollo local |
| `Modelo no soportado` | Verificar entorno y API keys correspondientes |

---

## 🎯 Áreas de Trabajo

### Seguras para Modificar

* ✏️ UI/UX del widget (con cuidado)
* ✏️ Estilos CSS
* ✏️ Contenido de páginas
* ✏️ Nuevas funcionalidades en `api/`

### Requieren Coordinación

* ⚠️ Lógica de IA en `src/utils/env.js`
* ⚠️ Flujo de voz completo
* ⚠️ Integración con BridgeData
* ⚠️ Cambios en estructura de base de datos
* ⚠️ Variables de entorno nuevas

---

## 📞 Contacto Técnico

### Equipo

* **Desarrollo Principal:** [Tu nombre]
* **Equipo IA Central:** Coordinación para cambios mayores
* **DevOps:** Gestión de Vercel y variables

### Recursos

* **Repositorio:** `GUESTVALENCIA/PWA`
* **Vercel Dashboard:** https://vercel.com/dashboard
* **Documentación:** Ver sección "Documentación Importante"

---

## 🎓 Aprendizaje Recomendado

Para entender mejor el sistema:

1. Lee `FLUJO_COMPLETO_VOZ_SANDRA.md` completo
2. Revisa `src/utils/env.js` y sus funciones
3. Prueba los ejemplos en `USAGE_EXAMPLES.md`
4. Explora las serverless functions en `api/sandra/`
5. Experimenta con el widget Galaxy en local

---

## 💎 Filosofía del Proyecto

> *"Aquí no se improvisa. Aquí se honra el alma del sistema."*

### Principios

* **Consistencia:** Mantener estructura establecida
* **Simplicidad:** Soluciones claras y mantenibles
* **Detección Automática:** El sistema se adapta solo
* **Documentación:** Todo debe estar documentado
* **Testing:** Probar antes de desplegar

---

## ✅ Checklist de Onboarding

- [ ] Node.js ≥ 18 instalado y funcionando
- [ ] Repositorio clonado y configurado
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Servidor local funcionando (`localhost:4040`)
- [ ] Widget Galaxy probado y funcionando
- [ ] Chat de texto probado
- [ ] Voz de Sandra probada (TTS)
- [ ] Documentación principal leída
- [ ] Acceso a Vercel obtenido
- [ ] Entendimiento del flujo de voz completo

---

**Bienvenido/a al equipo. Trabajemos juntos para mantener la excelencia de Sandra IA.** ✨

**Última actualización:** Sistema completo implementado y documentado.

