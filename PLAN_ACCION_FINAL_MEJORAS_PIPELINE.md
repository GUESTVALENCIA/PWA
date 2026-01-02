# 🎯 PLAN DE ACCIÓN FINAL: Mejoras Pipeline Enterprise

## 📋 DECISIONES TOMADAS

Basado en el análisis de recomendaciones ChatGPT y nuestra realidad:

### ✅ IMPLEMENTAR (Alto ROI, Esfuerzo Razonable)

1. **TTS WebSocket + PCM (linear16)** - Prioridad #1
2. **AudioWorklet** - Prioridad #2  
3. **Pipeline Paralelo + Chunking** - Prioridad #3
4. **Barge-in Real** - Prioridad #4
5. **Turn Detection Mejorado** - Prioridad #5

### ⚠️ EVALUAR DESPUÉS

1. **Separar WebSockets** (beneficio limitado vs complejidad)
2. **Migrar a LiveKit** (si calidad no es suficiente después de optimizaciones)

---

## 🚀 FASE 1: TTS WebSocket + PCM + AudioWorklet (Día 1-2)

### Objetivo: Eliminar MP3 + base64 + <audio>

### 1.1. Servidor: Deepgram TTS WebSocket Streaming

**Archivo:** `src/services/voice-services.js`

**Cambios:**
- ✅ Crear método `createTTSStreamingConnection()`
- ✅ Usar WebSocket `wss://api.deepgram.com/v1/speak`
- ✅ Configurar `encoding=linear16`, `sample_rate=24000`
- ✅ Modelo: `aura-2-nestor-es` o `aura-2-carina-es` (no existe thalia-es)
- ✅ Implementar Speak/Flush/Clear/Close

**Código base:**
```javascript
async createTTSStreamingConnection(model = 'aura-2-nestor-es') {
  const WebSocket = (await import('ws')).default;
  
  const ws = new WebSocket('wss://api.deepgram.com/v1/speak', {
    headers: {
      'Authorization': `Token ${this.deepgramApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      // Configurar conexión
      ws.send(JSON.stringify({
        type: 'Configure',
        model: model,
        encoding: 'linear16',
        sample_rate: 24000
      }));
      resolve(ws);
    });

    ws.on('error', reject);
  });
}
```

### 1.2. Cliente: AudioWorklet para PCM

**Archivos nuevos:**
- `assets/js/audio-worklet-processor.js` (nuevo)
- Modificar `index.html` para usar AudioWorklet

**Implementación:**
```javascript
// assets/js/audio-worklet-processor.js
class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.port.onmessage = (event) => {
      if (event.data.type === 'audio') {
        this.audioQueue.push(new Float32Array(event.data.data));
      } else if (event.data.type === 'clear') {
        this.audioQueue = [];
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output.length > 0 && this.audioQueue.length > 0) {
      const channel = output[0];
      const audioData = this.audioQueue.shift();
      const length = Math.min(channel.length, audioData.length);
      for (let i = 0; i < length; i++) {
        channel[i] = audioData[i];
      }
    }
    return true;
  }
}

registerProcessor('pcm-playback-processor', PCMPlaybackProcessor);
```

**En index.html:**
```javascript
// Reemplazar playAudioResponse con AudioWorklet
async setupAudioWorklet() {
  this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  await this.audioContext.audioWorklet.addModule('assets/js/audio-worklet-processor.js');
  this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'pcm-playback-processor');
  this.audioWorkletNode.connect(this.audioContext.destination);
}

// Recibir PCM del WebSocket
onTTSAudioChunk(pcmData) {
  // Convertir ArrayBuffer a Float32Array
  const float32Array = new Float32Array(pcmData);
  this.audioWorkletNode.port.postMessage({
    type: 'audio',
    data: float32Array.buffer
  });
}
```

**Impacto esperado:** -300-800ms

---

## 🚀 FASE 2: Pipeline Paralelo + Chunking (Día 2-3)

### Objetivo: Primer audio mucho antes

### 2.1. Buffer Inteligente de Texto LLM

**Archivo:** `src/websocket/socket-server.js`

**Cambios:**
- ✅ Acumular tokens del LLM en buffer
- ✅ Detectar fin de frase (`.`, `?`, `!`)
- ✅ Chunking: 50-100 caracteres o fin de frase
- ✅ Enviar Speak + Flush moderado

**Código:**
```javascript
let textBuffer = '';
let firstChunk = true;

onLLMChunk(chunk) {
  textBuffer += chunk;
  
  // Detectar fin de frase o límite de tamaño
  const hasSentenceEnd = /[.?!]\s*$/.test(textBuffer);
  const exceedsLimit = textBuffer.length >= 80;
  
  if (hasSentenceEnd || exceedsLimit) {
    // Enviar chunk a TTS
    ttsStream.send({
      type: 'Speak',
      text: textBuffer
    });
    
    // Flush para arrancar audio pronto (solo primera vez)
    if (firstChunk) {
      ttsStream.send({ type: 'Flush' });
      firstChunk = false;
    }
    
    textBuffer = '';
  }
}

onLLMComplete() {
  // Enviar resto del buffer
  if (textBuffer) {
    ttsStream.send({ type: 'Speak', text: textBuffer });
    ttsStream.send({ type: 'Flush' }); // Flush final
  }
}
```

**Impacto esperado:** -400-600ms

---

## 🚀 FASE 3: Barge-in Real + Turn Detection (Día 3)

### 3.1. Barge-in Real

**Archivo:** `src/websocket/socket-server.js` + `index.html`

**Cambios:**
- ✅ Detectar VAD/SpeechStarted
- ✅ Abort LLM stream
- ✅ Clear en Deepgram TTS
- ✅ Vaciar cola AudioWorklet

**Código:**
```javascript
onUserSpeechDetected() {
  // 1. Abort LLM
  if (llmStream) {
    llmStream.abort();
  }
  
  // 2. Clear Deepgram TTS
  if (ttsStream) {
    ttsStream.send({ type: 'Clear' });
  }
  
  // 3. Vaciar cola AudioWorklet (cliente)
  ws.send(JSON.stringify({
    route: 'audio',
    action: 'clear'
  }));
}
```

**En cliente (index.html):**
```javascript
onMessage({ route, action, payload }) {
  if (route === 'audio' && action === 'clear') {
    this.audioWorkletNode.port.postMessage({ type: 'clear' });
  }
}
```

### 3.2. Turn Detection Mejorado

**Archivo:** `src/services/voice-services.js`

**Cambios:**
- ✅ Usar `is_final` + `speech_final`
- ✅ Preparar LLM antes de utterance_end
- ✅ Disparar respuesta con speech_final

**Código:**
```javascript
connection.on(LiveTranscriptionEvents.Transcript, (message) => {
  const transcript = message?.channel?.alternatives?.[0]?.transcript || '';
  const isFinal = message?.is_final || false;
  const speechFinal = message?.speech_final || false;
  
  if (isFinal && speechFinal) {
    // Disparar respuesta inmediatamente
    onTranscriptionFinalized(transcript, message);
  } else if (isFinal && transcript.length > 40) {
    // Preparar LLM (empezar a procesar)
    prepareLLM(transcript);
  }
});
```

**Impacto esperado:** -300-500ms

---

## 📊 RESUMEN DE IMPACTO TOTAL

| Fase | Mejora | Latencia Reducida |
|------|--------|-------------------|
| Fase 1 | TTS WebSocket + PCM + AudioWorklet | -300-800ms |
| Fase 2 | Pipeline paralelo + chunking | -400-600ms |
| Fase 3 | Barge-in real + turn detection | -300-500ms |
| **TOTAL** | | **-1000-1900ms** |

**Latencia actual estimada:** ~2750ms  
**Latencia objetivo:** ~850-1750ms (cercano a WebRTC ~700-1400ms)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: TTS WebSocket + PCM + AudioWorklet
- [ ] Crear `createTTSStreamingConnection()` en `voice-services.js`
- [ ] Cambiar modelo a `aura-2-nestor-es` o `aura-2-carina-es`
- [ ] Configurar `encoding=linear16`, `sample_rate=24000`
- [ ] Crear `audio-worklet-processor.js`
- [ ] Modificar `index.html` para usar AudioWorklet
- [ ] Eliminar `<audio>` element y base64
- [ ] Testing y validación

### Fase 2: Pipeline Paralelo
- [ ] Buffer inteligente de texto LLM
- [ ] Detección de fin de frase
- [ ] Chunking (50-100 chars)
- [ ] Implementar Speak + Flush
- [ ] Testing y validación

### Fase 3: Barge-in + Turn Detection
- [ ] Detectar VAD/SpeechStarted
- [ ] Abort LLM stream
- [ ] Clear en Deepgram TTS
- [ ] Vaciar cola AudioWorklet
- [ ] Usar `is_final` + `speech_final`
- [ ] Preparar LLM antes
- [ ] Testing y validación

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Crear backup** del código actual
2. **Empezar Fase 1** (TTS WebSocket + PCM)
3. **Testing** después de cada fase
4. **Evaluar** si necesitamos LiveKit después de Fase 3

---

## ⚠️ NOTAS IMPORTANTES

1. **Modelo de voz:** ChatGPT indica que NO existe `aura-2-thalia-es`. Usar:
   - `aura-2-nestor-es` (masculina peninsular)
   - `aura-2-carina-es` (femenina peninsular)
   - `aura-2-silvia-es` (femenina)

2. **Sample rate:** 24kHz es suficiente para voz humana y reduce ancho de banda

3. **Chunking:** 50-100 caracteres o fin de frase. No hacer Flush por cada palabra.

4. **LiveKit:** Evaluar después de optimizaciones WebSocket. Si calidad no es suficiente, considerar migración.
