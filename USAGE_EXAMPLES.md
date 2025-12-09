# 📖 Ejemplos de Uso - Sistema de Utilidades de Entorno

## 🎯 Resumen

El sistema ahora puede hacer automáticamente:
- 🧠 **Detectar el modelo correcto** según entorno (gpt-4o, gemini-pro, mixtral-8x7b)
- 📡 **Detectar la URL correcta** (local, staging, producción)
- 🔁 **Enviar el mensaje** del usuario al endpoint `/api/sandra/chat`
- ✅ **Devolver la respuesta** de Sandra lista para usar

---

## 📦 Uso en Proyecto Actual (Sin Bundler - index.html)

### Opción 1: Usando EnvUtils directamente (recomendado)

```javascript
// En cualquier parte del código dentro de index.html
async function handleSend() {
  try {
    const reply = await EnvUtils.getSandraResponse("Hola Sandra, ¿me puedes ayudar?");
    console.log('🤖 Respuesta:', reply);
    
    // Mostrar la respuesta en el UI
    document.getElementById('response-container').textContent = reply;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Opción 3: Integración con Widget Galaxy (nuevo)

```javascript
// Conectar widget Galaxy automáticamente con Sandra
const galaxyWidget = {
  lock: () => console.log('Widget bloqueado'),
  unlock: () => console.log('Widget desbloqueado'),
  addMessage: (msg) => console.log(`Mensaje: ${msg.from} - ${msg.text}`),
  showTyping: (show) => console.log(`Typing: ${show}`),
  onUserMessage: null // Se asignará automáticamente
};

// Conectar con Sandra
EnvUtils.connectGalaxyToSandra(galaxyWidget, {
  autoLock: true,
  showTyping: true,
  onUserMessage: (userMsg, response) => {
    console.log('Mensaje enviado:', userMsg);
    console.log('Respuesta recibida:', response);
  }
});
```

### Opción 2: Usando SandraGateway (existente)

```javascript
// Ya disponible en el código actual
const gateway = new SandraGateway();
const reply = await gateway.sendMessage("Hola Sandra", 'hospitality');
```

---

## 🚀 Uso en Proyecto con Bundler (Vite/Webpack/etc.)

### Instalación/Import

```javascript
// En cualquier componente
import { getSandraResponse } from '@/utils/env';
// o
import { getSandraResponse } from './src/utils/env.js';
```

### Ejemplo en Componente React/Vue

```javascript
// React Component
import { useState } from 'react';
import { getSandraResponse, connectGalaxyToSandra } from '@/utils/env';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      // Firma simplificada: solo necesita el mensaje
      const reply = await getSandraResponse(message);
      setResponse(reply);
      console.log('🤖 Respuesta:', reply);
    } catch (error) {
      console.error('❌ Error:', error);
      setResponse('Lo siento, hubo un error. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Integrar con widget Galaxy si está disponible
  useEffect(() => {
    if (window.galaxyWidget) {
      connectGalaxyToSandra(window.galaxyWidget);
    }
  }, []);

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

### Ejemplo en Vanilla JS con Módulos ES6

```javascript
// main.js
import { getSandraResponse } from './src/utils/env.js';

async function handleSend() {
  const userMessage = document.getElementById('user-input').value;
  
  if (!userMessage.trim()) {
    alert('Por favor, escribe un mensaje');
    return;
  }

  try {
    // Mostrar loading
    const button = document.getElementById('send-btn');
    button.disabled = true;
    button.textContent = 'Enviando...';

    const reply = await getSandraResponse(userMessage);
    
    // Mostrar respuesta
    document.getElementById('response').textContent = reply;
    console.log('🤖 Respuesta:', reply);
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al enviar mensaje. Verifica la consola para más detalles.');
  } finally {
    // Restaurar botón
    const button = document.getElementById('send-btn');
    button.disabled = false;
    button.textContent = 'Enviar';
  }
}

document.getElementById('send-btn').addEventListener('click', handleSend);
```

---

## 🎨 Ejemplos Avanzados

### 1. Chat con Historial

```javascript
// Con EnvUtils (proyecto actual)
const conversationHistory = [];

async function sendMessage(userMessage) {
  // Agregar mensaje del usuario al historial
  conversationHistory.push({ role: 'user', content: userMessage });
  
  // Obtener respuesta
  const reply = await EnvUtils.getSandraResponse(userMessage);
  
  // Agregar respuesta al historial
  conversationHistory.push({ role: 'assistant', content: reply });
  
  return reply;
}
```

### 2. Múltiples Preguntas

```javascript
// Enviar múltiples preguntas secuencialmente
async function askMultipleQuestions() {
  const questions = [
    "¿Qué alojamientos tienes disponibles?",
    "¿Cuál es el precio por noche?",
    "¿Aceptan mascotas?"
  ];

  for (const question of questions) {
    // Firma simplificada: solo necesita el mensaje
    const reply = await EnvUtils.getSandraResponse(question);
    console.log(`Pregunta: ${question}`);
    console.log(`Respuesta: ${reply}\n`);
    
    // Pequeña pausa entre preguntas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 3. Manejo de Errores Avanzado

```javascript
async function safeGetSandraResponse(message, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Firma simplificada: solo necesita el mensaje
      const reply = await EnvUtils.getSandraResponse(message);
      return { success: true, reply };
    } catch (error) {
      console.error(`Intento ${i + 1} fallido:`, error);
      
      if (i === retries - 1) {
        return { 
          success: false, 
          error: error.message,
          message: 'No se pudo obtener respuesta después de varios intentos'
        };
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Uso
const result = await safeGetSandraResponse("Hola");
if (result.success) {
  console.log('Respuesta:', result.reply);
} else {
  console.error('Error:', result.message);
}
```

### 4. Integración con Widget Galaxy

```javascript
// Ejemplo básico de integración
const galaxyWidget = {
  lock: () => { /* Bloquear UI */ },
  unlock: () => { /* Desbloquear UI */ },
  addMessage: (msg) => { /* Agregar mensaje al chat */ },
  showTyping: (show) => { /* Mostrar/ocultar typing */ },
  onUserMessage: null // Se asignará automáticamente
};

// Conectar con Sandra
EnvUtils.connectGalaxyToSandra(galaxyWidget);

// El widget ahora manejará automáticamente:
// - Bloqueo durante procesamiento
// - Agregar mensajes de usuario y Sandra
// - Mostrar indicador de typing
// - Manejo de errores
```

### 5. Integración con UI del Widget Sandra (custom)

```javascript
// Ejemplo de integración con el widget existente
class CustomSandraIntegration {
  constructor() {
    this.container = document.getElementById('custom-chat-container');
    this.init();
  }

  init() {
    // Crear UI básica
    this.container.innerHTML = `
      <div class="chat-messages" id="custom-messages"></div>
      <div class="chat-input">
        <input type="text" id="custom-input" placeholder="Escribe tu mensaje...">
        <button id="custom-send-btn">Enviar</button>
      </div>
    `;

    // Event listeners
    document.getElementById('custom-send-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('custom-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  async sendMessage() {
    const input = document.getElementById('custom-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Agregar mensaje del usuario
    this.addMessage(message, 'user');
    input.value = '';

    // Mostrar typing indicator
    this.showTyping(true);

    try {
            // Usar EnvUtils para obtener respuesta (firma simplificada)
            const reply = await EnvUtils.getSandraResponse(message);
      
      // Agregar respuesta
      this.addMessage(reply, 'bot');
    } catch (error) {
      this.addMessage('Lo siento, hubo un error. Por favor, intenta de nuevo.', 'bot');
      console.error('Error:', error);
    } finally {
      this.showTyping(false);
    }
  }

  addMessage(text, type) {
    const messagesContainer = document.getElementById('custom-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showTyping(show) {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = show ? 'block' : 'none';
    }
  }
}

// Inicializar
// const customSandra = new CustomSandraIntegration();
```

---

## 🔧 Detección de Entorno y Modelos

### Verificar qué modelo se está usando

```javascript
// En proyecto actual (index.html)
const model = EnvUtils.getDefaultModel();
const modelInfo = EnvUtils.getModelInfo();
const env = EnvUtils.getEnv();

console.log(`Entorno: ${env}`);
console.log(`Modelo: ${model}`);
console.log(`Info:`, modelInfo);
// Output ejemplo:
// Entorno: development
// Modelo: mixtral-8x7b
// Info: { name: 'mixtral-8x7b', provider: 'groq', cost: 'low', description: '...' }
```

### Cambiar comportamiento según entorno

```javascript
async function smartResponse(message) {
  const env = EnvUtils.getEnv();
  
  if (env === 'production') {
    // Comportamiento para producción
    console.log('🚀 Modo producción - Usando GPT-4o');
  } else if (env === 'staging') {
    // Comportamiento para staging
    console.log('🧪 Modo staging - Usando Gemini Pro');
  } else {
    // Comportamiento para desarrollo
    console.log('🔧 Modo desarrollo - Usando Groq');
  }
  
  return await EnvUtils.getSandraResponse(message);
}
```

---

## 🗣️ Llamadas por Voz

### Ejemplo Básico

```javascript
import { sendVoiceToSandra } from '@/utils/env';

// Después de transcribir el audio del usuario (STT)
const transcribedText = '¿Qué servicios ofrecen en el apartamento?';
const respuesta = await sendVoiceToSandra(transcribedText);

// La respuesta está lista para convertir a voz (TTS)
console.log('Respuesta para TTS:', respuesta);
```

### Flujo Completo de Voz

```javascript
// 1. Capturar audio del usuario
const audioBlob = await recordAudio(); // Tu función de grabación

// 2. Transcribir audio (STT)
const transcribedText = await transcribeAudio(audioBlob);
console.log('Usuario dijo:', transcribedText);

// 3. Obtener respuesta de Sandra
const respuesta = await sendVoiceToSandra(transcribedText);
console.log('Sandra responde:', respuesta);

// 4. Convertir respuesta a voz (TTS)
const audioResponse = await textToSpeech(respuesta);

// 5. Reproducir audio
playAudio(audioResponse);
```

### Integración con WebSocket (Llamadas Conversacionales)

```javascript
// En el handler de audio recibido del WebSocket
websocket.on('audio', async (audioData) => {
  // 1. Transcribir audio recibido
  const transcribedText = await transcribeAudio(audioData);
  
  // 2. Obtener respuesta de Sandra
  const respuesta = await sendVoiceToSandra(transcribedText);
  
  // 3. Convertir a audio y enviar de vuelta
  const audioResponse = await textToSpeech(respuesta);
  websocket.send('audio', audioResponse);
});
```

### Diferencias entre getSandraResponse() y sendVoiceToSandra()

| Función | Uso | Mensaje de Error |
|---------|-----|------------------|
| `getSandraResponse()` | Chat de texto | "Lo siento, ha habido un problema..." |
| `sendVoiceToSandra()` | Llamadas de voz | "No he podido responder ahora. ¿Puedes repetirlo?" |

**Nota:** Ambas funciones hacen lo mismo internamente, pero `sendVoiceToSandra()` tiene un mensaje de error más apropiado para contexto de voz.

### 🗣️ Texto a Voz (TTS) con Sandra

```javascript
import { speakSandraVoice } from '@/utils/env';

// Uso básico
speakSandraVoice('Hola, bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?');
```

### Flujo Completo: Respuesta + Voz

```javascript
import { getSandraResponse, speakSandraVoice } from '@/utils/env';

// 1. Obtener respuesta de Sandra
const respuesta = await getSandraResponse('¿Qué servicios ofrecen?');

// 2. Reproducir respuesta con voz de Sandra
speakSandraVoice(respuesta);
```

### Flujo Completo: Voz → Texto → Respuesta → Voz

```javascript
import { sendVoiceToSandra, speakSandraVoice } from '@/utils/env';

// 1. Transcribir audio del usuario (STT)
const transcribedText = '¿Qué servicios ofrecen en el apartamento?';

// 2. Obtener respuesta de Sandra
const respuesta = await sendVoiceToSandra(transcribedText);

// 3. Reproducir respuesta con voz de Sandra
speakSandraVoice(respuesta);
```

### Opciones Avanzadas de Voz

```javascript
import { speakSandraVoice } from '@/utils/env';

speakSandraVoice('Bienvenido a GuestsValencia', {
  rate: 0.92,        // Ritmo calmado (default: 0.92)
  pitch: 1,          // Tono natural (default: 1)
  volume: 1,         // Volumen completo (default: 1)
  lang: 'es-ES',     // Idioma español (default: 'es-ES')
  onStart: () => {
    console.log('Sandra empezó a hablar');
    // Mostrar indicador visual de que está hablando
  },
  onEnd: () => {
    console.log('Sandra terminó de hablar');
    // Ocultar indicador visual
  },
  onError: (error) => {
    console.error('Error en TTS:', error);
    // Manejar error
  }
});
```

### Control de Voz

```javascript
import { speakSandraVoice, stopSandraVoice, pauseSandraVoice, resumeSandraVoice } from '@/utils/env';

// Iniciar voz
const utterance = speakSandraVoice('Este es un mensaje largo que puede durar varios segundos...');

// Pausar (si es necesario)
pauseSandraVoice();

// Reanudar
resumeSandraVoice();
```

### 🌟 Flujo Completo de Voz (Todo-en-Uno)

Para automatizar todo el proceso de voz en una sola función:

```javascript
import { flujoCompletoSandraVoz } from '@/utils/env';

// Después de transcribir el audio (STT)
const transcribedText = 'Hola Sandra, ¿qué disponibilidad hay para este finde?';
const respuesta = await flujoCompletoSandraVoz(transcribedText);

// ✅ Hace TODO automáticamente:
// 1. Llama a Sandra con el texto transcrito
// 2. Obtiene respuesta según entorno y modelo (GPT-4o, Gemini, Groq)
// 3. Reproduce la voz con tono calmado, dulce y preciso
```

**Ejemplo completo con captura de audio:**

```javascript
import { flujoCompletoSandraVoz } from '@/utils/env';

// 1. Capturar audio del usuario
const audioBlob = await recordAudio();

// 2. Transcribir audio (STT) - usar tu función de STT
const transcribedText = await transcribeAudio(audioBlob);

// 3. Flujo completo: respuesta + voz (todo en uno)
await flujoCompletoSandraVoz(transcribedText);
```

### Integración con Widget Galaxy (con Voz Automática)

El widget Galaxy ahora reproduce voz automáticamente:

```javascript
import { connectGalaxyToSandra } from '@/utils/env';

connectGalaxyToSandra(widgetGalaxy, {
  autoSpeak: true  // Reproducir voz automáticamente (default: true)
});

// Ahora cuando el usuario envía un mensaje:
// 1. Se obtiene respuesta de Sandra
// 2. Se muestra en el chat
// 3. Se reproduce automáticamente con voz de Sandra ✨
```

// Detener completamente
stopSandraVoice();
```

---

## 📚 Recursos Adicionales

- `ONBOARDING_TECNICO.md` - **Guía de onboarding para nuevos desarrolladores** ⭐
- `FLUJO_COMPLETO_VOZ_SANDRA.md` - Documentación completa del flujo de voz
- `ENV_UTILS_GUIDE.md` - Guía completa de utilidades de entorno
- `QUICK_START.md` - Inicio rápido
- `DEPLOY_CHECKLIST.md` - Checklist para deployment
- `ENV_VARIABLES_GUIDE.md` - Variables de entorno requeridas

---

## ⚠️ Notas Importantes

1. **API Keys**: Las API keys deben estar configuradas en el servidor (serverless functions), nunca en el cliente.

2. **Modelo Automático**: El modelo se selecciona automáticamente según el entorno. No es necesario especificarlo manualmente.

3. **URLs**: Las URLs se detectan automáticamente. En desarrollo local usa `/api`, en Vercel también usa rutas relativas.

4. **Errores**: La función maneja errores automáticamente y devuelve mensajes amigables según el entorno.

5. **Async/Await**: Siempre usa `async/await` o `.then()` ya que `getSandraResponse()` es asíncrona.

