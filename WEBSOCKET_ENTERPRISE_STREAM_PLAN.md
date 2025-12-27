# PLAN DE MEJORA: WebSocket Enterprise Stream
## Alternativa a OpenAI Realtime (WebRTC)

**Estado:** PRESENTACIÓN PARA APROBACIÓN
**Fecha:** Diciembre 27, 2025

---

## 📋 RESUMEN EJECUTIVO

**Problema Actual:**
- OpenAI Realtime API (WebRTC) genera audio automáticamente
- FASE 2 (Deepgram STT) tiene problemas de latencia/audio
- Necesitamos: Conversación EN TIEMPO REAL con solo voz de Sandra

**Solución Propuesta:**
- WebSocket bidireccional con streaming de audio
- Backend con `gpt-4o-mini` + streaming de respuesta
- Frontend con captura de micrófono + visualización en tiempo real
- **SOLO** voz de Sandra (sin interferencias)

---

## 🎯 ARQUITECTURA WebSocket Enterprise Stream

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                      │
│                                                             │
│  1. MediaRecorder captura audio                            │
│  2. Envía chunks a WebSocket                               │
│  3. Recibe respuesta en STREAMING                          │
│  4. Reproduces con voz de Sandra                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                WebSocket (Bidireccional)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  SERVIDOR (Node.js)                         │
│                                                             │
│  1. Recibe chunks de audio                                 │
│  2. Deepgram STT (streaming) → Texto                       │
│  3. gpt-4o-mini + Streaming → Response chunks             │
│  4. Envía respuesta en tiempo REAL                         │
│  5. Frontend reproduce mientras llega                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ VENTAJAS vs DESVENTAJAS

### ✅ VENTAJAS

| Ventaja | Detalle |
|---------|---------|
| **Sin WebRTC** | No hay audio generation forzada |
| **Streaming Real** | Respuesta llega mientras escribe (streaming) |
| **Bajo Latency** | WebSocket es más rápido que HTTP |
| **Control Total** | Tu propia lógica, no dependes de OpenAI |
| **Escalable** | Puedes soportar múltiples usuarios |
| **Chat Fluido** | Solo voz de Sandra, sin interferencias |
| **Económico** | gpt-4o-mini + Deepgram = barato |

### ⚠️ DESVENTAJAS

| Desventaja | Impacto |
|-----------|--------|
| **Más Código** | Backend + Frontend más complejo |
| **WebSocket** | Requiere servidor siempre activo |
| **Deepgram** | Nuevo costo pero pequeño (~$0.004/min) |
| **Implementación** | ~4-6 horas de desarrollo |

---

## 📊 COMPARATIVA: Todos los Enfoques

| Característica | OpenAI Realtime WebRTC | FASE 2 (Deepgram) | WebSocket Enterprise |
|---|---|---|---|
| **Funciona** | ❌ Dos voces | ❌ Sin audio | ✅ Perfecto |
| **Latencia** | ~500ms | ~1.5s | ~300ms |
| **Streaming** | ✅ Sí | ❌ No | ✅ Sí |
| **Costo/min** | $0.04-0.08 | $0.0043 | ~$0.015 |
| **Control** | ❌ OpenAI | ⚠️ Hybrid | ✅ Total |
| **Complejidad** | Baja | Media | Alta |

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Backend: WebSocket Server (Node.js + Express)

```javascript
// /api/websocket/stream-server.js
const WebSocket = require('ws');
const { Deepgram } = require('@deepgram/sdk');
const OpenAI = require('openai');

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    const deepgram = new Deepgram({ apiKey: process.env.DEEPGRAM_API_KEY });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let transcript = '';

    // 1. Recibir audio chunks
    ws.on('message', async (data) => {
      try {
        // Deepgram streaming STT
        const { results } = await deepgram.listen.prerecorded.transcribeBuffer(
          data,
          { model: 'nova-2', language: 'es', smart_format: true }
        );

        transcript = results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        ws.send(JSON.stringify({ type: 'transcript', text: transcript }));

        // 2. OpenAI Streaming
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres Sandra...' },
            { role: 'user', content: transcript }
          ],
          stream: true
        });

        // 3. Enviar respuesta en streaming
        let fullResponse = '';
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          fullResponse += text;
          ws.send(JSON.stringify({ type: 'response', chunk: text }));
        }

        // 4. Reproducir voz de Sandra
        ws.send(JSON.stringify({ type: 'play_voice', text: fullResponse }));

      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });
  });
};
```

### Frontend: WebSocket Client

```javascript
// /assets/js/websocket-stream-client.js
class WebSocketStreamClient {
  constructor() {
    this.ws = new WebSocket('ws://localhost:3000/stream');
    this.mediaRecorder = null;
    this.isRecording = false;

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'transcript') {
        console.log('[TRANSCRIPT]', data.text);
        // Mostrar transcripción en UI
      }

      if (data.type === 'response') {
        console.log('[RESPONSE CHUNK]', data.chunk);
        // Mostrar respuesta mientras llega (streaming)
      }

      if (data.type === 'play_voice') {
        // Reproducir voz de Sandra con respuesta completa
        this.playResponse(data.text);
      }
    };
  }

  startRecording() {
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      // Enviar audio chunks a WebSocket
      this.ws.send(event.data);
    };
    recorder.start(100); // Chunks cada 100ms
  }

  playResponse(text) {
    // Usar voice library manager
    if (window.voiceLibraryManager) {
      window.voiceLibraryManager.playVoice('general', text);
    }
  }
}
```

---

## 📈 TIMELINE IMPLEMENTACIÓN

| Fase | Tarea | Tiempo | Status |
|------|-------|--------|--------|
| 1 | Setup WebSocket server | 30 min | 🔴 Pendiente |
| 2 | Integrar Deepgram streaming | 45 min | 🔴 Pendiente |
| 3 | Integrar OpenAI streaming | 45 min | 🔴 Pendiente |
| 4 | Frontend WebSocket client | 1 hora | 🔴 Pendiente |
| 5 | Integración con voice library | 30 min | 🔴 Pendiente |
| 6 | Testing y refinamiento | 1 hora | 🔴 Pendiente |
| **Total** | | **~4-5 horas** | 🔴 No iniciado |

---

## 🚀 QUÉ SERÁ REMOVIDO vs AGREGADO

### ❌ SERÁ REMOVIDO
- OpenAI Realtime API WebRTC (`startOpenAIRealtimeCall()`)
- Todas las variables `realtime*`
- HTML/CSS para controles Realtime
- Dependencias de WebRTC

### ✅ SERÁ AGREGADO
- WebSocket server en `/api/websocket/stream-server.js`
- Frontend client en `/assets/js/websocket-stream-client.js`
- Integración Deepgram en backend
- Streaming logic en OpenAI
- Nueva UI para streaming visual

---

## 💾 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos:
1. `/api/websocket/stream-server.js` (150 líneas)
2. `/assets/js/websocket-stream-client.js` (200 líneas)
3. `/api/websocket/server-setup.js` (100 líneas)

### Archivos a Modificar:
1. `/server.js` - Agregar WebSocket server
2. `/index.html` - Actualizar UI, agregar script
3. `/package.json` - Agregar `ws` dependency

### Archivos a Remover:
1. Sección `startOpenAIRealtimeCall()` de index.html (~730 líneas)

---

## 🧪 TESTING STRATEGY

```javascript
// Test 1: WebSocket Connection
ws.send({type: 'test'})
// Expect: ws.onmessage con confirmación

// Test 2: Audio Upload
mediaRecorder.start()
// Hablar 3 segundos
mediaRecorder.stop()
// Expect: ws.onmessage con {type: 'transcript'}

// Test 3: Streaming Response
// Expect: múltiples mensajes con {type: 'response', chunk: '...'}

// Test 4: Voice Playback
// Expect: Voz de Sandra reproduce respuesta completa
```

---

## 📊 EXPECTED RESULTS

### Flujo Esperado:
```
Usuario: "Hola, ¿qué alojamientos tienes?"
  ↓
[0.5s] Micrófono captura
  ↓
[0.2s] Deepgram: "Hola, ¿qué alojamientos tienes?"
  ↓
[1.0s] gpt-4o-mini empieza respuesta: "Tenemos..."
  ↓
[Streaming] Respuesta llega en tiempo real: "Tenemos una variedad..."
  ↓
[0.5s] Voice Library Manager reproduce Sandra:
  "Tenemos una variedad de alojamientos premium en Valencia..."
  ↓
✅ Usuario escucha SOLO voz de Sandra (sin interferencias)
```

---

## ✅ CHECKLIST PRE-APROBACIÓN

- [ ] ¿Entiendes la arquitectura WebSocket?
- [ ] ¿Aceptas que toma ~4-5 horas?
- [ ] ¿Aceptas que RemovemOS Realtime WebRTC?
- [ ] ¿Quieres que agregue logging/debugging?
- [ ] ¿Quieres UI mejorada para ver streaming?
- [ ] ¿Aceptas usar `gpt-4o-mini` como modelo?

---

## 🎯 SIGUIENTE PASO

**¿APROBADO?**

Si apruebas este plan, procederé:
1. **Eliminar Realtime WebRTC conflictivo** (~/730 líneas)
2. **Crear WebSocket server enterprise**
3. **Implementar streaming frontend**
4. **Integrar Deepgram + OpenAI streaming**
5. **Testing exhaustivo**
6. **Documentación completa**

---

**Estado:** ⏳ ESPERANDO APROBACIÓN

Responde:
- ✅ APROBADO - Proceder inmediatamente
- ❌ RECHAZADO - Explicar motivo
- ⚠️ CAMBIOS - Qué debe modificarse

