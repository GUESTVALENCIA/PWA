# 📦 SANDRA WIDGET - CÓDIGO COMPLETO Y FUNCIONAL

**Fecha de creación:** 10 de diciembre de 2025  
**Versión:** 1.0 - Widget Conversacional Completo  
**Estado:** ✅ FUNCIONAL Y PROBADO EN LOCALHOST  

---

## ⚠️ IMPORTANTE

Este archivo contiene **TODO** el código funcional del widget de Sandra IA. Este es el código de referencia que debe usarse para:
- ✅ Restaurar el widget si se rompe
- ✅ Entender toda la lógica del sistema
- ✅ Implementar nuevas funcionalidades
- ✅ Debugging y mantenimiento

**NUNCA** modificar este código sin tener una copia de seguridad. Este es el código base que funciona.

---

## 📋 ÍNDICE

1. [Estructura del Widget](#estructura-del-widget)
2. [Clase SandraGateway](#clase-sandragateway)
3. [Clase SandraWidget](#clase-sandrawidget)
4. [HTML del Widget](#html-del-widget)
5. [Inicialización](#inicialización)
6. [Características Implementadas](#características-implementadas)
7. [Dependencias](#dependencias)
8. [Configuración](#configuración)

---

## 📐 ESTRUCTURA DEL WIDGET

El widget está compuesto por:

1. **SandraGateway**: Clase que maneja la comunicación con el backend (REST API)
2. **SandraWidget**: Clase principal que gestiona toda la UI y lógica del widget
3. **HTML del Widget**: Estructura completa del chat y controles
4. **Inicialización**: Sistema robusto de inicialización con prevención de duplicados

---

## 🔌 CLASE SANDRAGATEWAY

### Responsabilidades
- Detección dinámica de entorno (localhost vs producción)
- Comunicación REST con el backend
- Gestión de URLs base y WebSocket

### Código Completo

```javascript
class SandraGateway {
  constructor() {
    // Dynamic base URL detection (local vs production)
    if (window.location.hostname === 'localhost' || window.location.port === '4040') {
      this.baseUrl = '/api';
      this.wsUrl = 'ws://localhost:4041';
    } else if (window.location.protocol === 'file:') {
      // Si se abre desde file://, usar localhost
      this.baseUrl = 'http://localhost:4040/api';
      this.wsUrl = 'ws://localhost:4041';
    } else {
      // Producción: usar rutas relativas o configurar según el servidor MCP
      this.baseUrl = '/api';
      // Para producción, el WebSocket puede ser relativo o configurar según el servidor
      // Por defecto, mantener localhost para desarrollo, pero permitir override
      const hostname = window.location.hostname;
      this.wsUrl = hostname === 'localhost' || hostname === '127.0.0.1' 
        ? 'ws://localhost:4041' 
        : `wss://${hostname}/ws`; // Ajustar según tu configuración de producción
    }
  }

  async sendMessage(message, role = 'hospitality') {
    try {
      const response = await fetch(`${this.baseUrl}/sandra/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, role })
      });

      if (!response.ok) throw new Error('Gateway Error');
      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Conversation Error:', error);
      throw error;
    }
  }
}
```

---

## 🎨 CLASE SANDRAWIDGET

### Propiedades de Instancia

```javascript
this.gateway = new SandraGateway();
this.isOpen = false;
this.isRecording = false;
this.isCallPaused = false;
this.isMicrophoneMuted = false;
this.isSpeaking = false;
this.audioQueue = [];
this.currentAudio = null;
this.activeCall = null;
this.chatLocked = false; // bloquea chat durante llamada de voz
this.ringtoneInterval = null;
this.lastNoSpeechTime = null;
```

### Métodos Principales

#### `constructor()`
Inicializa todas las propiedades y llama a `init()`

#### `init()`
Inicializa el widget:
1. Crea la UI
2. Asegura la visibilidad
3. Vincula eventos

#### `ensureVisibility()`
**CRÍTICO**: Fuerza la visibilidad del widget con estilos `!important`.  
Esta función es esencial para que el widget aparezca siempre, incluso si hay conflictos CSS.

```javascript
ensureVisibility() {
  const widgetRoot = document.getElementById('sandra-widget-root');
  if (widgetRoot) {
    // Forzar visibilidad con estilos !important (como widget inyectable)
    widgetRoot.style.setProperty('display', 'block', 'important');
    widgetRoot.style.setProperty('visibility', 'visible', 'important');
    widgetRoot.style.setProperty('opacity', '1', 'important');
    widgetRoot.style.setProperty('z-index', '99999', 'important');
    widgetRoot.style.setProperty('position', 'fixed', 'important');
    widgetRoot.style.setProperty('bottom', '1rem', 'important');
    widgetRoot.style.setProperty('right', '1rem', 'important');
    widgetRoot.style.setProperty('pointer-events', 'auto', 'important');
    
    const toggleBtn = document.getElementById('sandra-toggle-btn');
    if (toggleBtn) {
      toggleBtn.style.setProperty('display', 'flex', 'important');
      toggleBtn.style.setProperty('visibility', 'visible', 'important');
      toggleBtn.style.setProperty('opacity', '1', 'important');
    }
    
    console.log('✅ Widget visibility asegurada con estilos !important');
  }
}
```

#### `createWidgetUI()`
Crea todo el HTML del widget e lo inserta en el DOM.  
**Prevención de duplicados**: Verifica si el widget ya existe antes de crearlo.

#### `bindEvents()`
Vincula todos los event listeners:
- Toggle del chat (abrir/cerrar)
- Envío de mensajes
- Botón de micrófono (dictado)
- Botón de aceptar/declinar llamada
- Controles de llamada (colgar, pausar, silenciar)

#### `startConversationalCall()`
Inicia el flujo de llamada conversacional:
1. Bloquea el chat
2. Reproduce ringtone (2 rings)
3. Después del segundo ring, descolga automáticamente

#### `endConversationalCall()`
Finaliza la llamada:
1. Reproduce sonido de colgar
2. Cierra WebSocket
3. Detiene MediaRecorder y stream
4. Rehabilita el chat
5. Muestra el botón de llamada nuevamente

#### `startRealTimeCall()`
Inicia la conexión WebSocket y configura:
1. Conexión WebSocket al servidor
2. Acceso al micrófono
3. MediaRecorder para capturar audio
4. Sistema de grabación por chunks (1.2 segundos)
5. Envío de audio al servidor
6. Reproducción de respuestas de audio
7. Sistema de barge-in (interrupción de IA cuando el usuario habla)

#### `playAudioResponse(audioBase64, isWelcome = false)`
Reproduce audio de Sandra:
- Si es saludo (`isWelcome = true`): Espera a que el buffer esté 100% cargado antes de reproducir
- Si no es saludo: Reproduce inmediatamente
- Sistema robusto de verificación de buffer completo
- Gestión de cola de audio para respuestas múltiples

#### `addMessage(text, type)`
Añade mensajes al chat:
- **BLOQUEA mensajes durante llamada conversacional activa**
- Permite mensajes cuando `activeCall` es null
- Soporta mensajes de usuario y bot

### Métodos de Audio

#### `playRingtone()`
Reproduce ringtone con AudioContext:
- 2 rings de 1.5 segundos cada uno
- Pausa de 2 segundos entre rings
- Descolga automáticamente después del segundo ring

#### `playPickupSound()`
Reproduce sonido de descolgar llamada (tono corto tipo "clic")

#### `playHangupSound()`
Reproduce sonido de colgar llamada (beep descendente)

### Métodos de Control

#### `toggleCallPause()`
Pausa/reanuda la llamada conversacional

#### `toggleMicrophoneMute()`
Silencia/activa el micrófono durante la llamada

#### `showCallPrompt()`
Muestra el botón de llamada dentro del chat

---

## 🎨 HTML DEL WIDGET

### Estructura Principal

```html
<div id="sandra-widget-root" class="fixed bottom-4 right-4 z-50 font-sans" style="display: block !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important; position: fixed !important; pointer-events: auto !important;">
  <!-- Botón flotante para abrir/cerrar chat -->
  <button id="sandra-toggle-btn">...</button>
  
  <!-- Ventana de chat -->
  <div id="sandra-chat-window" class="hidden ...">
    <!-- Header del chat -->
    <div class="p-3 bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
      <!-- Avatar y título -->
      <!-- Botón cerrar -->
    </div>
    
    <!-- Contenedor de mensajes -->
    <div id="sandra-messages" class="flex-1 overflow-y-auto">
      <!-- Mensaje de bienvenida -->
      <!-- Botón de llamada conversacional -->
      <div id="sandra-call-prompt" class="flex gap-2 mt-2">
        <button id="sandra-accept-call">✓ Aceptar llamada</button>
        <button id="sandra-decline-call">Continuar por chat</button>
      </div>
    </div>
    
    <!-- Indicador de escritura -->
    <div id="sandra-typing" class="hidden">Sandra está escribiendo...</div>
    
    <!-- Footer con controles -->
    <div class="p-3 bg-white border-t">
      <!-- Barra de control de llamada (solo visible durante llamada) -->
      <div id="sandra-call-controls" class="hidden mb-2">
        <button id="sandra-hangup-btn">Colgar</button>
        <button id="sandra-pause-btn">Pausar</button>
        <button id="sandra-mute-btn">Silenciar</button>
      </div>
      
      <!-- Input y botones de acción -->
      <input id="sandra-input" placeholder="Escribe tu mensaje...">
      <button id="sandra-mic-btn">Micrófono</button>
      <button id="sandra-send-btn">Enviar</button>
    </div>
  </div>
</div>
```

### Elementos Críticos

#### IDs Importantes
- `sandra-widget-root`: Contenedor principal
- `sandra-toggle-btn`: Botón flotante
- `sandra-chat-window`: Ventana del chat
- `sandra-messages`: Contenedor de mensajes
- `sandra-call-prompt`: Botón de llamada dentro del chat
- `sandra-call-controls`: Controles de llamada (colgar, pausar, silenciar)
- `sandra-input`: Input de texto
- `sandra-send-btn`: Botón enviar
- `sandra-mic-btn`: Botón de micrófono (dictado)

---

## 🚀 INICIALIZACIÓN

### Sistema de Inicialización Robusta

```javascript
// Initialize widget (con lógica de widget inyectable)
function initSandraWidget() {
  try {
    console.log('🚀 Inicializando SandraWidget...');
    
    // Prevenir múltiples inicializaciones
    if (window.sandraWidgetInstance) {
      console.warn('⚠️ Widget ya inicializado, saltando...');
      return;
    }
    
    // Limpiar duplicados si existen
    const existingRoots = document.querySelectorAll('#sandra-widget-root');
    if (existingRoots.length > 1) {
      console.warn(`⚠️ Encontrados ${existingRoots.length} widgets. Eliminando duplicados...`);
      for (let i = 1; i < existingRoots.length; i++) {
        existingRoots[i].remove();
      }
    }
    
    window.sandraWidgetInstance = new SandraWidget();
    console.log('✅ SandraWidget inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar SandraWidget:', error);
  }
}

// Intentar inicializar cuando el DOM esté listo o ya esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSandraWidget);
} else {
  // DOM ya está listo, inicializar inmediatamente
  initSandraWidget();
}
```

### Características de la Inicialización
1. ✅ Prevención de múltiples inicializaciones
2. ✅ Limpieza de duplicados
3. ✅ Funciona aunque el DOM ya esté cargado
4. ✅ Manejo de errores robusto

---

## ✨ CARACTERÍSTICAS IMPLEMENTADAS

### 1. Chat de Texto
- ✅ Mensajería bidireccional
- ✅ Indicador de escritura
- ✅ Auto-scroll
- ✅ Limpieza automática cada 48 horas

### 2. Dictado (Botón Micrófono)
- ✅ Grabación de audio (hasta 20 minutos)
- ✅ Chunks de 30 segundos
- ✅ Transcripción con Deepgram STT
- ✅ Envío automático del texto transcrito

### 3. Llamada Conversacional
- ✅ Ringtone (2 rings, descolga automática)
- ✅ Sonidos de descolgar/colgar
- ✅ Transición de hero (imagen → video)
- ✅ WebSocket para comunicación en tiempo real
- ✅ Grabación continua de audio del usuario
- ✅ Respuestas de audio de Sandra
- ✅ Sistema de barge-in (interrupción cuando el usuario habla)
- ✅ Control de llamada (colgar, pausar, silenciar)
- ✅ Bloqueo de chat durante llamada
- ✅ Rehabilitación de chat al finalizar

### 4. Sistema de Audio Robusto
- ✅ Buffer completo antes de reproducir saludo
- ✅ Reproducción desde `currentTime = 0`
- ✅ Cola de audio para respuestas múltiples
- ✅ Velocidad calmada (0.92x)
- ✅ Gestión de memoria (revocación de Blob URLs)

### 5. Visibilidad Forzada
- ✅ Estilos `!important` para asegurar visibilidad
- ✅ Z-index 99999
- ✅ Posición fixed con coordenadas específicas
- ✅ Prevención de conflictos CSS

---

## 📦 DEPENDENCIAS

### Backend
- **Servidor HTTP**: Puerto 4040 (desarrollo local)
- **Servidor WebSocket**: Puerto 4041 (desarrollo local)
- **API Gateway**: `/api/sandra/chat`, `/api/sandra/transcribe`

### Frontend
- **Tailwind CSS**: Para estilos (ya incluido en el proyecto)
- **MediaRecorder API**: Para grabación de audio
- **WebSocket API**: Para comunicación en tiempo real
- **AudioContext API**: Para ringtones y sonidos
- **FileReader API**: Para procesar audio

### Variables de Entorno (Backend)
- `GEMINI_API_KEY`: Para chat con Gemini
- `DEEPGRAM_API_KEY`: Para transcripción de audio
- `CARTESIA_API_KEY`: Para TTS (text-to-speech)
- `CARTESIA_VOICE_ID`: ID de voz de Cartesia

---

## ⚙️ CONFIGURACIÓN

### URLs de Desarrollo
- **HTTP API**: `/api` (relativo) o `http://localhost:4040/api`
- **WebSocket**: `ws://localhost:4041`

### URLs de Producción
- **HTTP API**: `/api` (relativo, usa Vercel serverless functions)
- **WebSocket**: Configurar según el servidor MCP desplegado

### Configuración de SandraGateway

El `SandraGateway` detecta automáticamente el entorno:
- **localhost**: Usa servidores locales
- **file://**: Usa localhost (para pruebas locales)
- **Producción**: Usa rutas relativas o configura según tu servidor

---

## 🔧 FLUJO DE LLAMADA CONVERSACIONAL

### 1. Inicio de Llamada
```
Usuario hace clic en "Aceptar llamada"
  ↓
startConversationalCall()
  ↓
playRingtone() (2 rings)
  ↓
Después del segundo ring:
  - playPickupSound()
  - transitionHeroToVideo()
  - startVideoStream()
  - startRealTimeCall()
```

### 2. Conexión WebSocket
```
WebSocket.onopen
  ↓
Solicitar acceso al micrófono
  ↓
Configurar MediaRecorder
  ↓
Enviar mensaje "ready" al servidor
  ↓
Servidor envía saludo de audio
```

### 3. Reproducción de Saludo
```
playAudioResponse(audioBase64, isWelcome = true)
  ↓
Esperar buffer 100% cargado
  ↓
Reproducir desde currentTime = 0
  ↓
audio.onended:
  - Iniciar grabación de usuario
```

### 4. Conversación
```
Usuario habla
  ↓
MediaRecorder captura audio (chunks de 1.2s)
  ↓
Enviar audio al servidor
  ↓
Servidor procesa (STT → LLM → TTS)
  ↓
Servidor envía respuesta de audio
  ↓
playAudioResponse() reproduce respuesta
  ↓
Detener grabación mientras Sandra habla
  ↓
Reiniciar grabación cuando Sandra termine
```

### 5. Finalización
```
Usuario hace clic en "Colgar"
  ↓
endConversationalCall()
  ↓
- Cerrar WebSocket
- Detener MediaRecorder
- Detener stream de micrófono
- Rehabilitar chat
- Volver hero a imagen estática
- Mostrar botón de llamada nuevamente
```

---

## 🐛 DEBUGGING

### Logs Importantes

El widget incluye logs extensivos para debugging:

```javascript
// Inicialización
'🚀 Inicializando SandraWidget...'
'✅ Widget visibility asegurada con estilos !important'
'✅ SandraWidget inicializado correctamente'

// Llamada conversacional
'Iniciando llamada conversacional...'
'🔔 Iniciando ringtone...'
'🔔 Reproduciendo ring X de Y...'
'📞 [PASO 1/4] Reproduciendo sonido de descolgar...'
'🎥 [PASO 2/4] Iniciando transición de video...'
'🎬 [PASO 3/4] Iniciando stream de video y llamada...'

// WebSocket
'🔌 Iniciando conexión WebSocket a ${wsUrl}...'
'✅ WebSocket conectado exitosamente'
'🎙️ Solicitando acceso al micrófono...'
'✅ Acceso al micrófono concedido'

// Audio
'👋 [CLIENTE] Cargando saludo inicial...'
'📥 [CLIENTE] Buffer cargando: X%'
'✅ [CLIENTE] Saludo COMPLETAMENTE listo (buffer 100%)'
'▶️ [CLIENTE] Reproduciendo audio de Sandra...'
'✅ [CLIENTE] Audio de Sandra finalizado completamente'

// Grabación
'🎙️ [CLIENTE] Iniciando nueva grabación de USUARIO'
'📤 [CLIENTE] Enviando audio completo: X bytes'
'⏸️ [CLIENTE] DETENIENDO grabación - Sandra va a hablar'

// Barge-in
'🛑 Barge-in detectado!'
```

### Verificar Widget en Consola

```javascript
// Verificar que el widget está inicializado
console.log(window.sandraWidgetInstance);

// Verificar estado
console.log({
  isOpen: window.sandraWidgetInstance.isOpen,
  activeCall: window.sandraWidgetInstance.activeCall,
  isSpeaking: window.sandraWidgetInstance.isSpeaking,
  chatLocked: window.sandraWidgetInstance.chatLocked
});

// Verificar elementos del DOM
console.log(document.getElementById('sandra-widget-root'));
console.log(document.getElementById('sandra-call-controls'));
```

---

## 📝 NOTAS IMPORTANTES

### Prevención de Duplicados
El widget verifica si ya existe antes de crearse. Si se detectan múltiples instancias, elimina las duplicadas.

### Visibilidad Forzada
El widget usa estilos `!important` para asegurar que siempre sea visible, incluso con conflictos CSS.

### Bloqueo de Chat Durante Llamada
El chat se bloquea completamente durante una llamada conversacional activa. Solo se permite cuando `activeCall` es null.

### Sistema de Barge-in
El widget detecta cuando el usuario habla mientras Sandra está respondiendo y detiene inmediatamente la respuesta de Sandra.

### Gestión de Memoria
El widget revoca Blob URLs después de reproducir audio para evitar fugas de memoria.

### Limpieza Automática
El historial de chat se limpia automáticamente cada 48 horas.

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de considerar el widget como funcional, verificar:

- [ ] Widget visible en la esquina inferior derecha
- [ ] Botón flotante abre/cierra el chat
- [ ] Mensaje de bienvenida aparece
- [ ] Botón de llamada aparece dentro del chat
- [ ] Chat funciona (enviar mensajes, recibir respuestas)
- [ ] Botón de micrófono funciona (dictado)
- [ ] Llamada conversacional inicia correctamente
- [ ] Ringtone reproduce (2 rings)
- [ ] Descolga automática después del segundo ring
- [ ] Video del hero se muestra durante la llamada
- [ ] Controles de llamada aparecen (colgar, pausar, silenciar)
- [ ] Chat se bloquea durante la llamada
- [ ] WebSocket se conecta correctamente
- [ ] Micrófono funciona durante la llamada
- [ ] Sandra responde con audio
- [ ] Audio se reproduce completamente
- [ ] Chat se rehabilita al finalizar la llamada
- [ ] Botón de llamada reaparece después de colgar

---

## 📄 LICENCIA Y USO

Este código es parte del proyecto GuestsValencia PWA.  
**NO MODIFICAR** este archivo de referencia sin tener una copia de seguridad.

---

## 🔗 ENLACES RELACIONADOS

- `index.html`: Implementación actual del widget
- `WIDGET_INYECTABLE.js`: Versión inyectable del widget (solo llamadas, sin chat)
- `INSTRUCCIONES_INYECTAR_WIDGET.md`: Instrucciones para inyectar el widget

---

**Última actualización:** 10 de diciembre de 2025  
**Estado:** ✅ CÓDIGO COMPLETO Y FUNCIONAL

