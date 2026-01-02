# 🚀 FASE 1: TTS WebSocket + PCM + AudioWorklet + Audio Nativo

## 🎯 Objetivos de Fase 1

1. ✅ **Implementar TTS WebSocket + PCM** (linear16) - Eliminar MP3 + base64
2. ✅ **Crear AudioWorklet** - Reemplazar `<audio>` element
3. ✅ **Soporte para audio nativo** - `sandra-conversational.wav` para reducir latencia
4. ✅ **Testing principal: Conseguir que salga la voz del widget**

---

## 📋 Plan de Implementación

### 1. Servidor: Deepgram TTS WebSocket Streaming

**Archivo:** `src/services/voice-services.js`

**Nuevo método:** `createTTSStreamingConnection()`

```javascript
/**
 * Create Deepgram TTS WebSocket streaming connection
 * Returns WebSocket for streaming PCM audio (linear16)
 * @param {string} model - Deepgram voice model (aura-2-nestor-es, aura-2-carina-es, etc.)
 * @returns {Promise<WebSocket>} WebSocket connection for TTS streaming
 */
async createTTSStreamingConnection(model = 'aura-2-nestor-es') {
  const WebSocket = (await import('ws')).default;
  
  if (!this.deepgramApiKey) {
    throw new Error('Deepgram API key not configured');
  }

  const ws = new WebSocket('wss://api.deepgram.com/v1/speak', {
    headers: {
      'Authorization': `Token ${this.deepgramApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      // Configure connection for PCM streaming
      ws.send(JSON.stringify({
        type: 'Configure',
        model: model,
        encoding: 'linear16', // PCM 16-bit
        sample_rate: 24000 // 24kHz (optimal for voice)
      }));
      
      logger.info('[TTS] ✅ Deepgram TTS WebSocket connected and configured');
      resolve(ws);
    });

    ws.on('error', (error) => {
      logger.error('[TTS] ❌ WebSocket error:', error);
      reject(error);
    });

    // Set timeout for connection
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error('TTS WebSocket connection timeout'));
      }
    }, 10000);
  });
}

/**
 * Send text to TTS WebSocket for synthesis
 * @param {WebSocket} ttsWs - TTS WebSocket connection
 * @param {string} text - Text to synthesize
 */
sendTextToTTS(ttsWs, text) {
  if (ttsWs.readyState === WebSocket.OPEN) {
    ttsWs.send(JSON.stringify({
      type: 'Speak',
      text: text
    }));
    logger.info(`[TTS] 📤 Sent text to TTS: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  } else {
    logger.error('[TTS] ❌ TTS WebSocket not open');
  }
}

/**
 * Flush TTS buffer to start audio generation
 * @param {WebSocket} ttsWs - TTS WebSocket connection
 */
flushTTS(ttsWs) {
  if (ttsWs.readyState === WebSocket.OPEN) {
    ttsWs.send(JSON.stringify({ type: 'Flush' }));
    logger.info('[TTS] 🔄 Flushed TTS buffer');
  }
}

/**
 * Clear TTS buffer (for barge-in)
 * @param {WebSocket} ttsWs - TTS WebSocket connection
 */
clearTTS(ttsWs) {
  if (ttsWs.readyState === WebSocket.OPEN) {
    ttsWs.send(JSON.stringify({ type: 'Clear' }));
    logger.info('[TTS] 🧹 Cleared TTS buffer');
  }
}
```

**Modificar `generateVoice()` para soportar ambos modos:**

```javascript
/**
 * Generate voice audio - supports both native audio and Deepgram TTS streaming
 * @param {string} text - Text to synthesize (required for TTS)
 * @param {Object} options - Options { useNative: boolean, model: string }
 * @returns {Promise<{type: 'native'|'tts', data: Buffer|WebSocket}>}
 */
async generateVoice(text, options = {}) {
  const { useNative = false, model = 'aura-2-nestor-es' } = options;

  // Option 1: Use native audio file (lowest latency)
  if (useNative && !text) {
    try {
      const nativeAudioPath = path.join(__dirname, '../../assets/audio/sandra-conversational.wav');
      if (fs.existsSync(nativeAudioPath)) {
        const audioBuffer = fs.readFileSync(nativeAudioPath);
        logger.info('[TTS] ✅ Using native audio file (lowest latency)');
        return {
          type: 'native',
          data: audioBuffer,
          format: 'wav',
          sampleRate: 24000
        };
      }
    } catch (error) {
      logger.error('[TTS] ❌ Error loading native audio:', error);
    }
  }

  // Option 2: Deepgram TTS WebSocket streaming (dynamic responses)
  if (!text || text.trim() === '') {
    throw new Error('Text is required for TTS generation');
  }

  logger.info(`[TTS] 🎙️ Creating TTS WebSocket for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  const ttsWs = await this.createTTSStreamingConnection(model);
  
  return {
    type: 'tts',
    ws: ttsWs,
    model: model
  };
}
```

---

### 2. Cliente: AudioWorklet Processor

**Archivo nuevo:** `assets/js/audio-worklet-processor.js`

```javascript
/**
 * AudioWorklet Processor for PCM playback
 * Handles both native audio (WAV) and streaming PCM from TTS
 */
class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.isPlaying = false;
    this.sampleRate = 24000; // Match Deepgram TTS sample rate
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'audio') {
        // Add PCM audio chunk to queue
        if (data instanceof ArrayBuffer) {
          // Convert ArrayBuffer to Float32Array
          const float32Array = new Float32Array(data);
          this.audioQueue.push(float32Array);
          this.isPlaying = true;
        } else if (data instanceof Float32Array) {
          this.audioQueue.push(data);
          this.isPlaying = true;
        }
      } else if (type === 'clear') {
        // Clear audio queue (for barge-in)
        this.audioQueue = [];
        this.isPlaying = false;
      } else if (type === 'native') {
        // Load native audio file (WAV)
        this.loadNativeAudio(data);
      }
    };
  }

  /**
   * Load and decode native WAV audio file
   */
  async loadNativeAudio(audioBuffer) {
    try {
      // Decode WAV file (simple WAV parser for PCM)
      const wavData = this.parseWAV(audioBuffer);
      if (wavData) {
        this.audioQueue.push(wavData.samples);
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('[AudioWorklet] Error loading native audio:', error);
    }
  }

  /**
   * Simple WAV parser for PCM data
   */
  parseWAV(buffer) {
    const view = new DataView(buffer);
    
    // Check RIFF header
    if (view.getUint32(0, true) !== 0x46464952) { // "RIFF"
      return null;
    }
    
    // Check WAVE header
    if (view.getUint32(8, true) !== 0x45564157) { // "WAVE"
      return null;
    }
    
    // Find fmt chunk
    let offset = 12;
    while (offset < buffer.byteLength) {
      const chunkId = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkId === 0x20746d66) { // "fmt "
        const sampleRate = view.getUint32(offset + 12, true);
        const bitsPerSample = view.getUint16(offset + 22, true);
        const numChannels = view.getUint16(offset + 10, true);
        
        // Find data chunk
        let dataOffset = offset + 8 + chunkSize;
        while (dataOffset < buffer.byteLength) {
          const dataChunkId = view.getUint32(dataOffset, true);
          const dataChunkSize = view.getUint32(dataOffset + 4, true);
          
          if (dataChunkId === 0x61746164) { // "data"
            const audioData = new Int16Array(buffer, dataOffset + 8, dataChunkSize / 2);
            // Convert Int16 to Float32 (-1.0 to 1.0)
            const float32Data = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              float32Data[i] = audioData[i] / 32768.0;
            }
            
            return {
              samples: float32Data,
              sampleRate: sampleRate,
              channels: numChannels,
              bitsPerSample: bitsPerSample
            };
          }
          
          dataOffset += 8 + dataChunkSize;
        }
      }
      
      offset += 8 + chunkSize;
    }
    
    return null;
  }

  /**
   * Process audio - called by AudioWorklet
   */
  process(inputs, outputs) {
    const output = outputs[0];
    
    if (output.length > 0 && this.audioQueue.length > 0) {
      const channel = output[0];
      const audioData = this.audioQueue[0];
      
      // Copy audio data to output
      const length = Math.min(channel.length, audioData.length);
      for (let i = 0; i < length; i++) {
        channel[i] = audioData[i];
      }
      
      // Remove processed samples
      if (audioData.length <= channel.length) {
        this.audioQueue.shift();
      } else {
        // Partial consumption
        this.audioQueue[0] = audioData.subarray(channel.length);
      }
      
      // Fill rest with silence if needed
      for (let i = length; i < channel.length; i++) {
        channel[i] = 0;
      }
    } else {
      // No audio data - output silence
      if (output.length > 0) {
        output[0].fill(0);
      }
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('pcm-playback-processor', PCMPlaybackProcessor);
```

---

### 3. Cliente: Integración AudioWorklet en index.html

**Modificar `index.html`:**

```javascript
// Add to SandraWidget class

async setupAudioWorklet() {
  try {
    // Create AudioContext
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 24000 // Match Deepgram TTS
    });
    
    // Load AudioWorklet processor
    await this.audioContext.audioWorklet.addModule('assets/js/audio-worklet-processor.js');
    
    // Create AudioWorkletNode
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'pcm-playback-processor');
    this.audioWorkletNode.connect(this.audioContext.destination);
    
    console.log('[AUDIO] ✅ AudioWorklet initialized');
  } catch (error) {
    console.error('[AUDIO] ❌ Error setting up AudioWorklet:', error);
    throw error;
  }
}

// Modify playAudioResponse to support both native and TTS
async playAudioResponse(audioData, options = {}) {
  const { type = 'tts', isWelcome = false } = options;
  
  if (type === 'native') {
    // Play native audio file
    this.audioWorkletNode.port.postMessage({
      type: 'native',
      data: audioData // ArrayBuffer of WAV file
    });
  } else if (type === 'tts') {
    // Handle TTS WebSocket streaming
    // This will be implemented in socket-server.js integration
  }
}

// Handle TTS WebSocket PCM chunks
handleTTSAudioChunk(pcmChunk) {
  // Convert PCM ArrayBuffer to Float32Array
  const float32Array = new Float32Array(pcmChunk);
  this.audioWorkletNode.port.postMessage({
    type: 'audio',
    data: float32Array.buffer
  });
}

// Clear audio (for barge-in)
clearAudio() {
  this.audioWorkletNode.port.postMessage({ type: 'clear' });
}
```

---

### 4. Servidor: Integración en socket-server.js

**Modificar `socket-server.js` para usar TTS WebSocket:**

```javascript
// In onTranscriptionFinalized or similar handler

async function handleAIResponse(transcript, ws, voiceServices) {
  // Get AI response
  const aiResponse = await voiceServices.ai.processMessage(transcript);
  
  // Create TTS WebSocket connection
  const ttsConnection = await voiceServices.createTTSStreamingConnection('aura-2-nestor-es');
  
  // Set up TTS WebSocket message handler
  ttsConnection.on('message', (data) => {
    if (data instanceof Buffer) {
      // PCM audio data - send to client
      ws.send(JSON.stringify({
        route: 'audio',
        action: 'tts_chunk',
        payload: {
          audio: data.toString('base64'), // Base64 for JSON transport
          format: 'pcm',
          sampleRate: 24000
        }
      }));
    } else {
      // JSON message (status, etc.)
      const message = JSON.parse(data.toString());
      if (message.type === 'Flushed') {
        logger.info('[TTS] ✅ TTS buffer flushed');
      }
    }
  });
  
  // Send text to TTS
  voiceServices.sendTextToTTS(ttsConnection, aiResponse);
  
  // Flush to start audio generation
  voiceServices.flushTTS(ttsConnection);
  
  // Send completion message when done
  ws.send(JSON.stringify({
    route: 'audio',
    action: 'tts_complete',
    payload: {}
  }));
}
```

---

## ✅ Checklist Fase 1

- [ ] Crear `createTTSStreamingConnection()` en `voice-services.js`
- [ ] Crear métodos `sendTextToTTS()`, `flushTTS()`, `clearTTS()`
- [ ] Modificar `generateVoice()` para soportar audio nativo y TTS streaming
- [ ] Crear `assets/js/audio-worklet-processor.js`
- [ ] Implementar parser WAV en AudioWorklet
- [ ] Modificar `index.html` para usar AudioWorklet
- [ ] Integrar TTS WebSocket en `socket-server.js`
- [ ] Testing: **Conseguir que salga la voz del widget**

---

## 🎯 Testing Principal

**Objetivo:** Verificar que la voz sale correctamente del widget

1. ✅ AudioWorklet se inicializa correctamente
2. ✅ Audio nativo (WAV) se reproduce
3. ✅ TTS WebSocket envía PCM chunks
4. ✅ PCM chunks se reproducen en AudioWorklet
5. ✅ No hay cortes ni latencia excesiva
6. ✅ Barge-in funciona (clear audio)

---

## 📝 Notas Importantes

- **Modelo de voz:** Usar `aura-2-nestor-es` o `aura-2-carina-es` (no existe `thalia-es`)
- **Sample rate:** 24kHz para coincidir con Deepgram TTS
- **Audio nativo:** Mantener como opción de baja latencia
- **TTS streaming:** Para respuestas dinámicas del LLM
