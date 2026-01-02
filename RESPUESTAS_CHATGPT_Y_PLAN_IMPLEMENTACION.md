# 🎯 RESPUESTAS A CHATGPT 5.2 THINKING + PLAN DE IMPLEMENTACIÓN

## 📋 RESPUESTAS A LAS PREGUNTAS DE CHATGPT

### 1. ¿Tu TTS de Deepgram ahora mismo lo llamas por REST o ya tienes Speak WebSocket?

**RESPUESTA: REST API (NO WebSocket)**

```javascript
// ACTUAL (src/services/voice-services.js línea 305):
const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3`, {
  method: 'POST',
  headers: {
    'Authorization': `Token ${this.deepgramApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ text })
});

// Problemas:
// ❌ MP3 encoding (tiempo de codificación)
// ❌ Base64 encoding (33% overhead)
// ❌ Espera respuesta completa
// ❌ No streaming
```

**Necesitamos:** Migrar a Deepgram TTS WebSocket streaming con `encoding=linear16` (PCM directo)

---

### 2. ¿En cliente estás dispuesto a pasar de <audio> a AudioWorklet (sí/no)?

**RESPUESTA: SÍ, estamos dispuestos**

**Estado actual:**
- ❌ Usamos `<audio>` element con base64 → Blob → URL
- ❌ Esperamos `canplaythrough` (latencia alta)
- ❌ Usamos `ScriptProcessorNode` (deprecated) para captura
- ❌ Buffer manual, sin control fino

**Necesitamos:** Migrar a AudioWorklet para:
- ✅ Reproducción PCM directa
- ✅ Cola mínima
- ✅ Start rápido
- ✅ Clear inmediato (barge-in real)

---

## 🔴 LOS 2 "ELEFANTES" QUE MATAN LA LATENCIA

### Elefante #1: MP3 + Base64 + <audio>
**Impacto:** -300-800ms de latencia percibida

**Problemas:**
1. MP3 requiere codificación en servidor
2. Base64 añade 33% de overhead
3. Decodificación en cliente (atob + Blob)
4. `<audio>` bufferiza más de lo necesario
5. `canplaythrough` espera buffer completo

**Solución:** Deepgram TTS WebSocket + PCM (linear16) + AudioWorklet

### Elefante #2: Pipeline "por turnos"
**Impacto:** -400-600ms de latencia

**Problema actual:**
```
STT (completo) → espera → LLM (completo) → espera → TTS (completo) → Audio
```

**Solución:** Pipeline paralelo con streaming incremental

---

## 🚀 PLAN DE IMPLEMENTACIÓN (ORDEN EXACTO DE CHATGPT)

### FASE 1: Deepgram TTS WebSocket + PCM (PRIORIDAD #1)

**Objetivo:** Eliminar MP3 + base64 + <audio>

**Implementación:**

#### 1.1. Servidor: Deepgram TTS WebSocket Streaming

```javascript
// Nuevo método en voice-services.js
async createTTSStreamingConnection(text, options = {}) {
  const ws = new WebSocket('wss://api.deepgram.com/v1/speak', {
    headers: {
      'Authorization': `Token ${this.deepgramApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  ws.on('open', () => {
    // Enviar configuración
    ws.send(JSON.stringify({
      type: 'Configure',
      model: 'aura-2-thalia-es',
      encoding: 'linear16', // PCM directo (no MP3)
      sample_rate: 24000
    }));

    // Enviar texto en chunks
    this.sendTextChunks(ws, text);
  });

  return ws; // Retornar WebSocket para streaming
}
```

#### 1.2. Cliente: AudioWorklet para Reproducción PCM

```javascript
// Nuevo: audio-worklet-processor.js
class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.sampleRate = 24000;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output.length > 0 && this.audioQueue.length > 0) {
      const channel = output[0];
      const audioData = this.audioQueue.shift();
      // Reproducir PCM directamente
      for (let i = 0; i < Math.min(channel.length, audioData.length); i++) {
        channel[i] = audioData[i];
      }
    }
    return true;
  }
}

registerProcessor('pcm-playback-processor', PCMPlaybackProcessor);
```

**Beneficio esperado:** -300-800ms de latencia percibida

---

### FASE 2: Separar Media Plane y Control Plane

**Objetivo:** Reducir bloqueo por colas internas

**Implementación:**

```javascript
// Servidor: 3 WebSockets separados
// WS #1: Audio Input (binario, prioridad máxima)
// WS #2: Audio Output (binario PCM, prioridad máxima)
// WS #3: Control/Eventos (JSON, prioridad normal)
```

**Beneficio esperado:** Mejor regularidad, menos bloqueos

---

### FASE 3: TTS Incremental con Chunking

**Objetivo:** Primer audio mucho antes

**Implementación:**

```javascript
// Buffer inteligente de texto del LLM
let textBuffer = '';
let chunkSize = 60-120; // caracteres

// Cuando LLM genera texto:
onLLMChunk(chunk) {
  textBuffer += chunk;
  
  // Detectar fin de frase o límite de tamaño
  if (/[.?!]\s*$/.test(textBuffer) || textBuffer.length >= chunkSize) {
    // Enviar chunk a Deepgram TTS
    ttsStream.send({
      type: 'Speak',
      text: textBuffer
    });
    
    // Flush para arrancar audio pronto
    if (firstChunk) {
      ttsStream.send({ type: 'Flush' });
    }
    
    textBuffer = '';
  }
}

// Al final de respuesta LLM:
onLLMComplete() {
  if (textBuffer) {
    ttsStream.send({ type: 'Speak', text: textBuffer });
    ttsStream.send({ type: 'Flush' }); // Flush final
  }
}
```

**Beneficio esperado:** Primer audio 200-400ms antes

---

### FASE 4: Barge-in Real

**Objetivo:** Corte duro cuando usuario habla

**Implementación:**

```javascript
// Cuando detectamos VAD/SpeechStarted:
onUserSpeechDetected() {
  // 1. Abort LLM stream
  llmStream.abort();
  
  // 2. Clear Deepgram TTS buffer
  ttsStream.send({ type: 'Clear' });
  
  // 3. Vaciar cola de AudioWorklet
  audioWorkletNode.port.postMessage({ type: 'clear' });
}
```

**Beneficio esperado:** Sensación "en llamada" vs "en reproducción"

---

### FASE 5: Turn Detection Mejorado

**Objetivo:** Empezar antes, sin esperar utterance_end completo

**Implementación:**

```javascript
// Usar is_final y speech_final en lugar de solo utterance_end
onTranscriptionResult(message) {
  if (message.is_final && message.speech_final) {
    // Disparar respuesta inmediatamente
    startLLMProcessing(message.transcript);
  } else if (message.is_final && message.transcript.length > 40) {
    // Preparar LLM (empezar a procesar)
    prepareLLM(message.transcript);
  }
}
```

**Beneficio esperado:** -100-200ms en turn detection

---

### FASE 6: Ajustes Finos

1. **Input chunks:** 250ms → 100ms (después de arreglar audio-out)
2. **TCP_NODELAY:** `ws.setNoDelay(true)` en servidor
3. **Sample rate:** Fijar a 24000Hz para evitar resample

---

## 📊 IMPACTO ESPERADO TOTAL

| Mejora | Latencia Reducida |
|--------|-------------------|
| TTS WebSocket + PCM + AudioWorklet | -300-800ms |
| Pipeline paralelo + chunking | -400-600ms |
| Barge-in real | -200-300ms |
| Turn detection mejorado | -100-200ms |
| Separar media/control plane | -50-100ms |
| Ajustes finos | -50-100ms |
| **TOTAL** | **-1100-2100ms** |

**Latencia objetivo:** ~650-1650ms (cercano a WebRTC ~700-1400ms)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: TTS WebSocket + PCM (CRÍTICO)
- [ ] Implementar `createTTSStreamingConnection()` en servidor
- [ ] Cambiar encoding a `linear16` (PCM)
- [ ] Crear AudioWorklet processor para PCM
- [ ] Migrar cliente de `<audio>` a AudioWorklet
- [ ] Eliminar base64 encoding

### Fase 2: Separar WebSockets
- [ ] Crear WS #1: Audio Input (binario)
- [ ] Crear WS #2: Audio Output (binario PCM)
- [ ] Mantener WS #3: Control (JSON)

### Fase 3: TTS Incremental
- [ ] Buffer inteligente de texto LLM
- [ ] Chunking (60-120 chars / fin de frase)
- [ ] Implementar Speak + Flush moderado

### Fase 4: Barge-in Real
- [ ] Detectar VAD/SpeechStarted
- [ ] Abort LLM stream
- [ ] Clear Deepgram TTS
- [ ] Vaciar cola AudioWorklet

### Fase 5: Turn Detection
- [ ] Usar `is_final` + `speech_final`
- [ ] Preparar LLM antes de utterance_end

### Fase 6: Ajustes Finos
- [ ] Chunks input: 250ms → 100ms
- [ ] TCP_NODELAY
- [ ] Sample rate fijo

---

## 🎯 PRÓXIMOS PASOS

1. **Crear backup** del código actual
2. **Implementar Fase 1** (TTS WebSocket + PCM) - Mayor impacto
3. **Testing** y validación
4. **Continuar con fases siguientes**
