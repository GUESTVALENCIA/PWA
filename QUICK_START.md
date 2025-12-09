# 🚀 Quick Start - Integración Galaxy + Sandra IA

## ✨ Sistema Completo Funcional

El widget Galaxy ahora está completamente conectado con Sandra IA de forma automática:

✅ **Detección automática de entorno** (dev/staging/prod)  
✅ **Selección automática de modelo** (GPT-4o/Gemini/Groq)  
✅ **Envío/recepción desde `/api/sandra/chat`**  
✅ **Respuestas en tiempo real en el frontend**

---

## 📦 Uso Básico

### En proyecto con Bundler (Vite/Webpack/etc.)

```javascript
import { connectGalaxyToSandra } from '@/utils/env';

// Conectar widget Galaxy con Sandra
connectGalaxyToSandra(widgetGalaxy);
```

**¡Eso es todo!** El widget ahora maneja automáticamente:
- Bloqueo/desbloqueo durante procesamiento
- Agregar mensajes de usuario y Sandra
- Indicador de typing
- Manejo de errores

### En proyecto sin Bundler (index.html)

```javascript
// EnvUtils ya está disponible globalmente en index.html
EnvUtils.connectGalaxyToSandra(widgetGalaxy);
```

---

## 🔧 Configuración del Widget Galaxy

El widget debe implementar estos métodos (opcional, según estructura):

```javascript
const widgetGalaxy = {
  // Método principal para recibir mensajes del usuario
  onUserMessage: (callback) => {
    // Asignar callback para cuando el usuario envía mensaje
  },
  
  // O usar eventos estándar
  addEventListener: (event, handler) => {
    // Evento 'userMessage' con event.detail.message
  },
  
  // Métodos opcionales para UI (se llaman automáticamente si existen)
  lock: () => {
    // Bloquear UI durante procesamiento
  },
  
  unlock: () => {
    // Desbloquear UI después de respuesta
  },
  
  addMessage: (msg) => {
    // msg.from: 'user' | 'sandra'
    // msg.text: string
  },
  
  showTyping: (show) => {
    // show: boolean - Mostrar/ocultar indicador de typing
  }
};
```

---

## 🎯 Opciones Avanzadas

```javascript
connectGalaxyToSandra(widgetGalaxy, {
  autoLock: true,      // Bloquear widget durante procesamiento (default: true)
  showTyping: true,    // Mostrar indicador de typing (default: true)
  onUserMessage: (userMsg, response) => {
    // Callback personalizado después de recibir respuesta
    console.log('Usuario:', userMsg);
    console.log('Sandra:', response);
  }
});
```

---

## 📡 Cómo Funciona Internamente

1. **Usuario envía mensaje** → Widget llama a `onUserMessage` o dispara evento
2. **Widget se bloquea** → `widget.lock()` (si existe)
3. **Se muestra typing** → `widget.showTyping(true)` (si existe)
4. **Mensaje se envía** → `getSandraResponse()` detecta entorno y modelo automáticamente
5. **API llamada** → `/api/sandra/chat` con modelo correcto
6. **Respuesta recibida** → Se agrega al widget
7. **Widget se desbloquea** → `widget.unlock()` (si existe)

---

## 🔍 Detección Automática

### Entorno → Modelo

| Entorno | Modelo | Proveedor |
|---------|--------|-----------|
| **Production** | `gpt-4o` | OpenAI |
| **Staging** | `gemini-pro` | Google |
| **Development** | `mixtral-8x7b` | Groq |

### Detección de Entorno

- **Development**: `localhost`, `127.0.0.1`, puerto `4040` o `4321`
- **Staging**: URLs con `staging`, `preview`, o `.vercel.app` (sin `guestsvalencia.com`)
- **Production**: URLs con `guestsvalencia.com`

---

## 💡 Ejemplo Completo

```javascript
// 1. Importar función
import { connectGalaxyToSandra } from '@/utils/env';

// 2. Definir widget (ejemplo)
const widgetGalaxy = {
  messages: [],
  
  onUserMessage(callback) {
    // Simular recepción de mensaje
    this.messageHandler = callback;
  },
  
  lock() {
    console.log('🔒 Widget bloqueado');
    document.getElementById('widget').style.pointerEvents = 'none';
  },
  
  unlock() {
    console.log('🔓 Widget desbloqueado');
    document.getElementById('widget').style.pointerEvents = 'auto';
  },
  
  addMessage(msg) {
    this.messages.push(msg);
    console.log(`💬 ${msg.from}: ${msg.text}`);
    // Renderizar en UI...
  },
  
  showTyping(show) {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = show ? 'block' : 'none';
  }
};

// 3. Conectar con Sandra
connectGalaxyToSandra(widgetGalaxy);

// 4. Simular mensaje de usuario (en tu código real, esto viene del widget)
widgetGalaxy.messageHandler("Hola Sandra, ¿qué alojamientos tienes?");
// → Automáticamente se procesa y responde
```

---

## ⚠️ Requisitos

### Variables de Entorno (en Vercel o .env)

**Production:**
- `OPENAI_API_KEY` (para GPT-4o)

**Staging:**
- `GEMINI_API_KEY` (para Gemini Pro)

**Development:**
- `GROQ_API_KEY` (para Mixtral 8x7b)

**Recomendado en todos:**
- `GEMINI_API_KEY` (para fallback automático)

---

## 🐛 Troubleshooting

### El widget no responde
- Verifica que el widget tenga `onUserMessage` o dispare eventos `userMessage`
- Revisa la consola para errores de conexión
- Verifica que las API keys estén configuradas

### Error "Modelo no disponible"
- Verifica que la API key correspondiente esté configurada
- El sistema intentará fallback automático a Gemini

### Mensajes no aparecen
- Verifica que el widget tenga método `addMessage(msg)`
- Revisa que `msg.from` y `msg.text` estén correctos

---

## 📚 Recursos Adicionales

- `ONBOARDING_TECNICO.md` - **Guía de onboarding para nuevos desarrolladores** ⭐
- `FLUJO_COMPLETO_VOZ_SANDRA.md` - Documentación completa del flujo de voz
- `USAGE_EXAMPLES.md` - Ejemplos detallados de uso
- `ENV_UTILS_GUIDE.md` - Guía técnica completa
- `DEPLOY_CHECKLIST.md` - Checklist para deployment
- `ENV_VARIABLES_GUIDE.md` - Variables de entorno requeridas

---

## 🗣️ Llamadas por Voz

Sandra también está preparada para recibir mensajes por voz:

```javascript
import { sendVoiceToSandra } from '@/utils/env';

// Después de transcribir el audio del usuario (STT)
const transcribedText = '¿Qué servicios ofrecen en el apartamento?';
const respuesta = await sendVoiceToSandra(transcribedText);

// La respuesta está lista para convertir a voz (TTS)
console.log('Respuesta para TTS:', respuesta);
```

**Flujo completo de voz:**
1. Usuario habla → STT (Speech-to-Text)
2. Texto transcrito → `sendVoiceToSandra(transcribedText)`
3. Respuesta de Sandra → TTS (Text-to-Speech)
4. Audio reproducido al usuario

**Características:**
- ✅ Detecta entorno automáticamente
- ✅ Usa el modelo correcto según entorno
- ✅ Mensaje de error específico para voz
- ✅ Respuesta optimizada para TTS

### 🗣️ Reproducir Respuesta con Voz de Sandra

Después de obtener la respuesta, puedes reproducirla con la voz de Sandra:

```javascript
import { getSandraResponse, speakSandraVoice } from '@/utils/env';

// Obtener respuesta
const respuesta = await getSandraResponse('¿Qué servicios ofrecen?');

// Reproducir con voz de Sandra (voz calmada y clara)
speakSandraVoice(respuesta);
```

**Características de la voz:**
- ✅ Voz calmada y clara (rate 0.92, pitch 1)
- ✅ Idioma español (es-ES)
- ✅ Callbacks para control (onStart, onEnd, onError)
- ✅ Control de reproducción (pausar, reanudar, detener)

**Funciones de control:**
```javascript
import { speakSandraVoice, stopSandraVoice, pauseSandraVoice, resumeSandraVoice } from '@/utils/env';

speakSandraVoice('Mensaje de Sandra');
pauseSandraVoice();   // Pausar
resumeSandraVoice();  // Reanudar
stopSandraVoice();    // Detener
```

---

## ✅ Checklist de Implementación

- [ ] Widget Galaxy implementado con métodos requeridos
- [ ] Variables de entorno configuradas según entorno
- [ ] `connectGalaxyToSandra()` llamado al inicializar widget
- [ ] `sendVoiceToSandra()` integrado en flujo de voz (opcional)
- [ ] Endpoint `/api/sandra/chat` desplegado y funcionando
- [ ] Probar en desarrollo, staging y producción

---

## 🌟 Flujo Completo de Voz

Para un flujo completo de voz (texto transcrito → respuesta → voz) en una sola función:

```javascript
import { flujoCompletoSandraVoz } from '@/utils/env';

// Después de transcribir el audio (STT)
const transcribedText = 'Hola Sandra, ¿qué disponibilidad hay para este finde?';
const respuesta = await flujoCompletoSandraVoz(transcribedText);

// ✅ Hace TODO automáticamente:
// 1. Llama a Sandra con el texto
// 2. Obtiene respuesta según entorno y modelo (GPT-4o, Gemini, Groq)
// 3. Reproduce la voz con tono calmado, dulce y preciso
```

**Características:**
- ✅ Una sola función para todo el flujo
- ✅ Manejo automático de errores con voz
- ✅ Detección automática de entorno y modelo

---

**🎉 ¡Listo! El widget Galaxy ahora está conectado con Sandra IA (texto y voz). Sandra está completa y lista para producción.**

