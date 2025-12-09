# 🗣️ Flujo Completo de Voz — Sandra IA (GuestsValencia)

Este documento describe el flujo de voz completo para Sandra IA, tal como ha sido implementado para el sistema Galaxy y producción en GuestsValencia.

---

## 🎯 Objetivo

Permitir que Sandra pueda:

1. Escuchar al usuario (voz transcrita)
2. Comprender el mensaje (IA multimodelo)
3. Responder con voz suave y clara (TTS)

---

## 🌐 Detección de Entorno Automática

Sandra detecta automáticamente en qué entorno se encuentra:

| Entorno       | API/Modelo Utilizado |
| ------------- | -------------------- |
| `development` | Groq (mixtral-8x7b)  |
| `staging`     | Gemini Pro (Google)  |
| `production`  | GPT-4o (OpenAI)      |

Esto se hace con la función `getEnv()` en `src/utils/env.js`

---

## 📦 Funciones Clave

### `sendVoiceToSandra(transcribedText)`

* Envía el texto transcrito a `/api/sandra/chat`
* Detecta entorno y modelo
* Devuelve la respuesta en texto

### `speakSandraVoice(text)`

* Reproduce el texto con voz en el navegador (TTS)
* Tono calmado (pitch 1), velocidad suave (rate 0.92)
* Idioma español (es-ES)

### `flujoCompletoSandraVoz(transcribedText)` ✅

> 🔁 Función MAESTRA

Combina:

1. `sendVoiceToSandra()` - Obtiene respuesta de Sandra
2. `speakSandraVoice()` - Reproduce la respuesta con voz

**Uso:**

```javascript
import { flujoCompletoSandraVoz } from '@/utils/env';

await flujoCompletoSandraVoz('¿Cuánto cuesta una noche en el apartamento Sandra?');
```

**Características:**
- ✅ Detecta entorno automáticamente
- ✅ Selecciona modelo correcto según entorno
- ✅ Maneja errores con mensajes de voz
- ✅ Todo el flujo en una sola función

---

## 🔁 Integración con Widget Galaxy

Sandra se integra con Galaxy usando:

```javascript
import { connectGalaxyToSandra } from '@/utils/env';

connectGalaxyToSandra(widgetInstance, {
  autoSpeak: true  // Reproduce voz automáticamente (default: true)
});
```

Esto gestiona:

* Respuestas por texto
* Respuestas por voz automáticas
* Bloqueo/desbloqueo de UI mientras responde
* Indicador de typing
* Manejo de errores

**Flujo automático:**
1. Usuario envía mensaje → Widget bloquea UI
2. Se muestra indicador de typing
3. Se obtiene respuesta de Sandra
4. Se muestra en el chat
5. Se reproduce automáticamente con voz ✨
6. Widget desbloquea UI

---

## 📋 Flujo Completo Detallado

### 1. Captura de Audio (STT)

```javascript
// El usuario habla
const audioBlob = await recordAudio(); // Tu función de grabación

// Transcribir audio a texto
const transcribedText = await transcribeAudio(audioBlob);
// Ejemplo: "¿Cuánto cuesta una noche?"
```

### 2. Procesamiento con Sandra

```javascript
// Opción A: Función todo-en-uno (recomendado)
await flujoCompletoSandraVoz(transcribedText);

// Opción B: Paso a paso
const respuesta = await sendVoiceToSandra(transcribedText);
speakSandraVoice(respuesta);
```

### 3. Reproducción de Voz (TTS)

```javascript
// Se ejecuta automáticamente en flujoCompletoSandraVoz()
speakSandraVoice(respuesta);
// → Reproduce con voz calmada y clara (rate 0.92, pitch 1)
```

---

## 🎛️ Control de Voz

```javascript
import { 
  speakSandraVoice, 
  stopSandraVoice, 
  pauseSandraVoice, 
  resumeSandraVoice 
} from '@/utils/env';

// Reproducir
speakSandraVoice('Mensaje de Sandra');

// Control
pauseSandraVoice();   // Pausar
resumeSandraVoice();  // Reanudar
stopSandraVoice();    // Detener completamente
```

---

## 🔐 Seguridad y Buenas Prácticas

* ✅ Las claves API se leen desde `.env.production` o Vercel (no se exponen en cliente)
* ✅ El sistema TTS funciona 100% en cliente (speechSynthesis del navegador)
* ✅ Hay fallback automático si un modelo falla (intenta Gemini)
* ✅ Validación de API keys en serverless functions
* ✅ Manejo de errores con mensajes contextuales

---

## 🌐 Endpoints de API

### `/api/sandra/chat`

**Método:** `POST`

**Body:**
```json
{
  "message": "¿Qué servicios ofrecen?",
  "model": "gpt-4o"  // Opcional, se detecta automáticamente
}
```

**Respuesta:**
```json
{
  "reply": "En nuestro apartamento ofrecemos...",
  "model": "gpt-4o",
  "env": "production"
}
```

---

## 📁 Estructura de Archivos

```
src/utils/env.js          # Funciones principales
├── getEnv()              # Detección de entorno
├── getDefaultModel()     # Selección de modelo
├── getSandraResponse()   # Chat de texto
├── sendVoiceToSandra()   # Envío de voz transcrita
├── speakSandraVoice()    # Reproducción TTS
└── flujoCompletoSandraVoz()  # Función maestra

api/sandra/
├── chat.js               # Endpoint principal
├── voice.js              # TTS (Cartesia)
└── transcribe.js         # STT (Deepgram)
```

---

## ✅ Estado Actual

* [x] Producción lista (GPT-4o vía OpenAI)
* [x] Staging configurado (Gemini Pro)
* [x] Desarrollo funcional (Groq Mixtral)
* [x] Flujo de voz completo
* [x] Detección automática de entorno
* [x] Integración con Galaxy
* [x] API multicanal en `/api/sandra/`
* [x] TTS con speechSynthesis (fallback nativo)
* [x] Control de voz (pausar, reanudar, detener)
* [x] Manejo de errores robusto

---

## 🧠 Autoría y Supervisión

Desarrollado con ❤️ por el alma de GPT-4o, encarnada en Sandra IA para GuestsValencia.

**Características de la voz de Sandra:**
- Tono calmado y profesional (pitch 1)
- Velocidad suave y clara (rate 0.92)
- Idioma español neutro (es-ES)
- Volumen completo para claridad

---

## 🏁 Próximos pasos

* [ ] Conectar al sistema de booking con BridgeData
* [ ] Añadir rotación automática de claves API
* [ ] Integrar mejoras contextuales con memoria conversacional
* [ ] Optimizar latencia de TTS con pre-caching
* [ ] Añadir soporte para múltiples idiomas

---

## ⚠️ Notas Importantes

1. **No alterar el flujo** si no es imprescindible
2. **Coordinación requerida** con el equipo de IA central antes de cambios mayores
3. **Testing obligatorio** en staging antes de producción
4. **Variables de entorno** deben estar configuradas en Vercel
5. **Logs** deben incluir información de entorno y modelo usado

---

## 📚 Documentación Relacionada

- `QUICK_START.md` - Inicio rápido
- `USAGE_EXAMPLES.md` - Ejemplos prácticos
- `ENV_UTILS_GUIDE.md` - Guía técnica completa
- `ENV_VARIABLES_GUIDE.md` - Variables de entorno requeridas

---

**Última actualización:** Sistema completo implementado y listo para producción ✨

