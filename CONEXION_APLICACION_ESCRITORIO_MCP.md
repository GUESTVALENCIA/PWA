# 🔌 CONEXIÓN APLICACIÓN DE ESCRITORIO CON SERVIDOR MCP

## ✅ EXTENSIÓN VECTOR CREADA

La extensión `vector` (pgvector) ha sido creada exitosamente en Neon DB:
- **Versión**: 0.8.0
- **Estado**: ✅ Activa y lista para usar
- **Base de datos**: `neondb` en Neon

El adaptador Neon de IA-SANDRA ahora puede usar búsqueda semántica con vectores.

---

## 🖥️ INTEGRACIÓN APLICACIÓN DE ESCRITORIO

Se han creado dos módulos para conectar la aplicación de escritorio con el servidor MCP en Render:

### 1. **MCPClient** (`mcp-client.js`)
Cliente WebSocket que maneja la conexión directa con el servidor MCP.

**Características:**
- ✅ Conexión WebSocket automática
- ✅ Reconexión automática en caso de desconexión
- ✅ Cola de mensajes para mensajes enviados antes de conectar
- ✅ Sistema de eventos (open, close, message, error)
- ✅ Métodos para enviar audio (STT) y mensajes de texto
- ✅ Soporte para iniciar llamadas conversacionales
- ✅ Reanudación de sesiones

### 2. **MCPIntegration** (`mcp-integration.js`)
Capa de integración que facilita el uso del cliente MCP desde la aplicación.

**Características:**
- ✅ Inicialización automática del cliente
- ✅ Manejo de mensajes del servidor (audio TTS, transcripciones, etc.)
- ✅ Gestión de sesiones
- ✅ Sistema de eventos simplificado
- ✅ Integración con el sistema de voz existente

---

## 📋 CONFIGURACIÓN

### Variables de Entorno

La aplicación de escritorio puede usar estas variables de entorno (opcionales):

```bash
# URL del servidor MCP (HTTP)
MCP_SERVER_URL=https://pwa-imbf.onrender.com

# URL del servidor MCP (WebSocket)
MCP_WS_URL=wss://pwa-imbf.onrender.com

# Token de autenticación (opcional)
MCP_TOKEN=tu_token_aqui
```

**Nota:** Si no se configuran, se usan los valores por defecto:
- `MCP_SERVER_URL`: `https://pwa-imbf.onrender.com`
- `MCP_WS_URL`: `wss://pwa-imbf.onrender.com`
- `MCP_TOKEN`: `null` (sin autenticación)

---

## 🚀 USO EN LA APLICACIÓN

### Inicialización Automática

La integración MCP se carga automáticamente en `main.js`:

```javascript
// Ya está integrado en main.js
window.mcpIntegration = require('./mcp-integration.js');
```

### Ejemplo de Uso

```javascript
// 1. Inicializar y conectar
await window.mcpIntegration.initialize();

// 2. Iniciar llamada conversacional
await window.mcpIntegration.startCall();

// 3. Enviar audio (STT)
const audioData = /* ... datos de audio ... */;
window.mcpIntegration.sendAudio(audioData, 'linear16', 48000);

// 4. Escuchar eventos
window.mcpIntegration.on('audio', (data) => {
  // Reproducir audio TTS recibido
  console.log('Audio recibido:', data);
});

window.mcpIntegration.on('transcription', (data) => {
  // Procesar transcripción final
  console.log('Transcripción:', data.text);
});

// 5. Verificar estado
const status = window.mcpIntegration.getStatus();
console.log('Estado MCP:', status);
```

---

## 🔗 CONEXIÓN CON EL SISTEMA EXISTENTE

### Integración con Voz

La integración MCP puede conectarse con el sistema de voz existente:

```javascript
// En tools/voice/orchestration-voice.js o similar
const { mcpIntegration } = window;

// Cuando se captura audio
voiceEngine.on('audio', (audioData) => {
  mcpIntegration.sendAudio(audioData);
});

// Cuando se recibe audio TTS
mcpIntegration.on('audio', (data) => {
  voiceEngine.playAudio(data.audio);
});
```

### Integración con Orquestación

```javascript
// En auto-orchestration-engine.js
const { mcpIntegration } = window;

// Iniciar llamada cuando se necesita
orchestrationEngine.on('startCall', async () => {
  await mcpIntegration.startCall();
});
```

---

## 📡 PROTOCOLO DE MENSAJES

### Cliente → Servidor

**Iniciar llamada:**
```json
{
  "route": "conserje",
  "action": "message",
  "payload": {
    "type": "ready",
    "sessionId": "session_1234567890_abc123"
  }
}
```

**Enviar audio (STT):**
```json
{
  "route": "conserje",
  "action": "audio",
  "payload": {
    "audio": "base64AudioData",
    "format": "linear16",
    "sampleRate": 48000
  }
}
```

**Enviar mensaje de texto:**
```json
{
  "route": "conserje",
  "action": "message",
  "payload": {
    "text": "Hola, necesito una habitación",
    "timestamp": "2026-01-04T12:00:00.000Z"
  }
}
```

### Servidor → Cliente

**Audio TTS:**
```json
{
  "route": "audio",
  "action": "tts",
  "payload": {
    "audio": "base64AudioData",
    "format": "mp3",
    "text": "Hola, ¿en qué puedo ayudarte?",
    "isWelcome": false
  }
}
```

**Transcripción:**
```json
{
  "route": "conserje",
  "action": "message",
  "payload": {
    "type": "transcription_final",
    "text": "Necesito una habitación para el sábado",
    "language": "es"
  }
}
```

---

## ✅ ESTADO ACTUAL

- ✅ Extensión `vector` creada en Neon DB
- ✅ Módulo `MCPClient` creado
- ✅ Módulo `MCPIntegration` creado
- ✅ Integración en `main.js` completada
- ⏳ Pendiente: Conectar con sistema de voz existente
- ⏳ Pendiente: Probar conexión end-to-end

---

## 🔧 PRÓXIMOS PASOS

1. **Probar conexión:**
   ```javascript
   // En la consola de la aplicación
   await window.mcpIntegration.initialize();
   await window.mcpIntegration.startCall();
   ```

2. **Integrar con sistema de voz:**
   - Conectar captura de audio con `sendAudio()`
   - Conectar reproducción de audio TTS recibido

3. **Integrar con orquestación:**
   - Usar MCP para llamadas conversacionales
   - Mantener sesiones persistentes

---

## 📝 NOTAS

- El servidor MCP está en Render: `https://pwa-imbf.onrender.com`
- La conexión WebSocket se establece automáticamente
- La reconexión es automática en caso de desconexión
- Las sesiones se mantienen persistentes usando `sessionId`
