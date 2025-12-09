# Guía de Utilidades de Entorno

## 📋 Resumen

Se ha integrado un sistema de detección automática de entorno que permite al proyecto adaptarse a diferentes entornos (desarrollo, staging, producción) sin cambios manuales en el código.

## 🗂️ Estructura

### `src/utils/env.js`
Utilidades ES6 para proyectos con bundler (Vite, Webpack, etc.). Adaptado para proyectos estáticos sin módulos.

### Integración en `index.html`
Las utilidades están integradas como `EnvUtils` inline en el HTML principal.

## 🔧 Funcionalidades

### 1. Detección de Entorno

```javascript
EnvUtils.getEnv() // → 'development' | 'staging' | 'production'
```

**Lógica de detección:**
- **Development**: `localhost`, `127.0.0.1`, puerto `4040`
- **Staging**: URLs que contienen `staging`, `preview`, o `.vercel.app` (sin `guestsvalencia.com`)
- **Production**: URLs que contienen `guestsvalencia.com`

### 2. URLs Base

```javascript
EnvUtils.getBaseUrl() // → '/api' | 'http://localhost:4040/api'
```

- **Development**: Ruta relativa `/api` o `http://localhost:4040/api` si es `file://`
- **Staging/Production**: Ruta relativa `/api` (mismo dominio)

### 3. WebSocket URL

```javascript
EnvUtils.getWebSocketUrl() // → 'ws://localhost:4041' | null
```

- **Development**: `ws://localhost:4041`
- **Staging/Production**: `null` (requiere solución externa)

### 4. Helpers

```javascript
EnvUtils.isProduction()   // → boolean
EnvUtils.isDevelopment()  // → boolean
EnvUtils.isStaging()      // → boolean
```

### 5. Función Helper para Sandra

```javascript
// Obtener respuesta de Sandra automáticamente (firma simplificada)
const response = await EnvUtils.getSandraResponse(
  'Hola, ¿qué alojamientos tienes disponibles?'
);
// → Promise<string> con la respuesta de Sandra

// Características:
// - Manejo automático de URLs base
// - Manejo de errores mejorado
// - Mensajes de error contextuales por entorno
// - Selección automática de modelo según entorno
```

### 6. Llamadas por Voz

```javascript
// Función específica para llamadas de voz
const respuesta = await EnvUtils.sendVoiceToSandra('¿Qué servicios ofrecen?');
// → Respuesta lista para convertir a voz (TTS)

// Flujo completo:
// 1. Usuario habla → STT (transcripción)
// 2. sendVoiceToSandra(transcribedText) → Respuesta de Sandra
// 3. Respuesta → TTS (texto a voz)
// 4. Audio reproducido al usuario
```

### 7. Texto a Voz (TTS) - Voz de Sandra

```javascript
// Reproducir texto con voz de Sandra
EnvUtils.speakSandraVoice('Hola, bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?');

// Con opciones personalizadas
EnvUtils.speakSandraVoice('Mensaje', {
  rate: 0.92,      // Ritmo calmado
  pitch: 1,        // Tono natural
  volume: 1,       // Volumen completo
  lang: 'es-ES',   // Idioma español
  onStart: () => console.log('Empezó a hablar'),
  onEnd: () => console.log('Terminó de hablar'),
  onError: (e) => console.error('Error:', e)
});

// Control de reproducción
EnvUtils.stopSandraVoice();    // Detener
EnvUtils.pauseSandraVoice();   // Pausar
EnvUtils.resumeSandraVoice();  // Reanudar
```

**Flujo completo texto + voz:**
```javascript
// 1. Obtener respuesta
const respuesta = await EnvUtils.getSandraResponse('¿Qué servicios ofrecen?');

// 2. Reproducir con voz
EnvUtils.speakSandraVoice(respuesta);
```

### 8. Flujo Completo de Voz (Todo-en-Uno)

```javascript
// Función que hace todo el flujo automáticamente
const respuesta = await EnvUtils.flujoCompletoSandraVoz('Hola Sandra, ¿qué disponibilidad hay?');

// ✅ Hace TODO:
// 1. Llama a Sandra con el texto transcrito
// 2. Obtiene respuesta según entorno y modelo
// 3. Reproduce la voz automáticamente
```

**Ideal para:**
- Flujos de voz completos
- Después de transcribir audio del usuario (STT)
- Cuando quieres respuesta + voz en una sola llamada

### 9. Integración con Widget Galaxy (con Voz Automática)

```javascript
// Conectar widget Galaxy automáticamente con Sandra
const galaxyWidget = {
  lock: () => { /* Bloquear UI */ },
  unlock: () => { /* Desbloquear UI */ },
  addMessage: (msg) => { /* Agregar mensaje */ },
  showTyping: (show) => { /* Mostrar typing */ },
  onUserMessage: null // Se asignará automáticamente
};

EnvUtils.connectGalaxyToSandra(galaxyWidget, {
  autoLock: true,      // Bloquear durante procesamiento
  showTyping: true,    // Mostrar indicador de typing
  autoSpeak: true,     // Reproducir voz automáticamente (default: true)
  onUserMessage: (userMsg, response) => {
    // Callback personalizado (opcional)
    console.log('Mensaje:', userMsg);
    console.log('Respuesta:', response);
  }
});

// Ahora el widget automáticamente:
// 1. Obtiene respuesta de Sandra
// 2. Muestra en el chat
// 3. Reproduce con voz de Sandra ✨

// Soporta múltiples estructuras de widget:
// - widget.onUserMessage(callback)
// - widget.addEventListener('userMessage', ...)
// - widget.on('userMessage', ...)
// - widget.handleUserMessage (asignación directa)
```

## 📝 Uso en el Código

### Cliente (index.html)

```javascript
// En SandraGateway
constructor() {
  this.baseUrl = EnvUtils.getBaseUrl();
  this.env = EnvUtils.getEnv();
  console.log(`Entorno: ${this.env}, Base URL: ${this.baseUrl}`);
}

// En conexión WebSocket
const wsUrl = EnvUtils.getWebSocketUrl();
if (!wsUrl) {
  // Manejar caso sin WebSocket
}

// 🧠 Función simplificada para obtener respuesta de Sandra
const response = await EnvUtils.getSandraResponse('Hola, ¿qué alojamientos tienes disponibles?');
console.log(response); // Respuesta de Sandra

// 📦 Integración con Widget Galaxy
EnvUtils.connectGalaxyToSandra(galaxyWidget, {
  autoLock: true,
  showTyping: true
});
```

### Servidor (Serverless Functions)

Las funciones en `api/sandra/*` incluyen validaciones de API keys:

```javascript
if (!process.env.GEMINI_API_KEY) {
  return res.status(500).json({ 
    error: 'GEMINI_API_KEY no está configurada' 
  });
}
```

## 🌍 Entornos Soportados

### Development
- **Detectado por**: `localhost`, `127.0.0.1`, puerto `4040`
- **API URL**: `/api` o `http://localhost:4040/api`
- **WebSocket**: `ws://localhost:4041` ✅
- **Variables**: `.env` local

### Staging (Vercel Preview)
- **Detectado por**: URLs con `staging`, `preview`, o `.vercel.app`
- **API URL**: `/api` (ruta relativa)
- **WebSocket**: `null` ❌ (requiere solución externa)
- **Variables**: Vercel Environment Variables (Preview)

### Production
- **Detectado por**: URLs con `guestsvalencia.com`
- **API URL**: `/api` (ruta relativa)
- **WebSocket**: `null` ❌ (requiere solución externa)
- **Variables**: Vercel Environment Variables (Production)

## 🔐 Variables de Entorno Requeridas

Ver `ENV_VARIABLES_GUIDE.md` para la lista completa.

**Por Entorno:**

### Production
- `OPENAI_API_KEY` (requerido para GPT-4o)
- `CARTESIA_API_KEY` + `CARTESIA_VOICE_ID` (TTS)
- `DEEPGRAM_API_KEY` (STT)

### Staging
- `GEMINI_API_KEY` (requerido para Gemini Pro)
- `CARTESIA_API_KEY` + `CARTESIA_VOICE_ID` (TTS)
- `DEEPGRAM_API_KEY` (STT)

### Development
- `GROQ_API_KEY` (requerido para Mixtral 8x7b)
- `CARTESIA_API_KEY` + `CARTESIA_VOICE_ID` (TTS - opcional)
- `DEEPGRAM_API_KEY` (STT - opcional)

**Nota:** El sistema intentará fallback a Gemini si el modelo principal falla, por lo que `GEMINI_API_KEY` es recomendable en todos los entornos.

## 🚀 Configuración en Vercel

1. Ir a **Project Settings** → **Environment Variables**
2. Agregar variables para cada entorno:
   - **Production**: Variables para `guestsvalencia.com`
   - **Preview**: Variables para deployments de staging
   - **Development**: Variables locales (`.env`)

## 📊 Logging

El sistema incluye logging automático:

```javascript
🔍 [SandraGateway] Entorno detectado: development, Base URL: /api
🔌 Iniciando conexión WebSocket a ws://localhost:4041 (entorno: development)
```

## ⚠️ Notas Importantes

1. **WebSocket en Producción**: Vercel no soporta WebSocket nativo. Se requiere solución externa (LiveKit, Ably, etc.).

2. **API Keys en Cliente**: Las API keys **NUNCA** deben exponerse en el cliente. Las validaciones en `getApiKeyFor()` devuelven strings vacíos en el navegador.

3. **Detección por Hostname**: El sistema detecta el entorno basándose en `window.location.hostname`, por lo que funciona automáticamente en diferentes deployments.

4. **Fallback**: Si no se puede detectar el entorno, se asume `development`.

## 🤖 Selección Automática de Modelos IA

El sistema ahora selecciona automáticamente el modelo de IA según el entorno:

```javascript
// En cliente (index.html)
const model = EnvUtils.getDefaultModel();
// → 'gpt-4o' | 'gemini-pro' | 'mixtral-8x7b'

const modelInfo = EnvUtils.getModelInfo();
// → { name, provider, cost, description }
```

**Modelos por Entorno:**
- **Production**: `gpt-4o` (OpenAI) - Máxima calidad
- **Staging**: `gemini-pro` (Google) - Buen balance calidad/precio
- **Development**: `mixtral-8x7b` (Groq) - Rápido y gratuito

**En Serverless Functions:**
El endpoint `/api/sandra/chat` automáticamente:
1. Detecta el entorno
2. Selecciona el modelo apropiado
3. Valida que la API key esté configurada
4. Usa fallback a Gemini si falla el modelo principal

## 🔄 Migración desde Código Hardcodeado

**Antes:**
```javascript
const baseUrl = window.location.hostname === 'localhost' 
  ? '/api' 
  : '/api';
```

**Después:**
```javascript
const baseUrl = EnvUtils.getBaseUrl();
```

## 📚 Referencias

- `ONBOARDING_TECNICO.md` - **Guía de onboarding para nuevos desarrolladores** ⭐
- `FLUJO_COMPLETO_VOZ_SANDRA.md` - Documentación completa del flujo de voz
- `src/utils/env.js` - Implementación completa
- `index.html` - Integración en cliente
- `api/sandra/*.js` - Ejemplos en serverless functions
- `USAGE_EXAMPLES.md` - Ejemplos prácticos de uso completos
- `QUICK_START.md` - Inicio rápido
- `ENV_VARIABLES_GUIDE.md` - Lista de variables requeridas
- `DEPLOY_CHECKLIST.md` - Proceso de deployment

