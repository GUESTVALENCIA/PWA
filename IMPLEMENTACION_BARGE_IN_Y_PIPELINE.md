# 🚀 PLAN DE IMPLEMENTACIÓN: BARGE-IN AVANZADO Y PIPELINE MEJORADO

## ✅ CAMBIOS APLICADOS

1. **PlaybackRate diferenciado**: Welcome = 1.0, Voz conversacional = 0.5
2. **Optimizaciones Deepgram**: Modelo nova-2-phonecall, endpointing 250ms, filler_words, numerals
3. **Optimizaciones WebSocket**: perMessageDeflate: false, maxPayload optimizado

---

## 🎯 IMPLEMENTACIÓN PENDIENTE

### FASE 1: BARGE-IN AVANZADO (Crítico - Prioridad #1)

**Objetivo:** Bajar volumen cuando usuario habla (NO cortar como walkie-talkie)

**Implementación en cliente (index.html):**

```javascript
// 1. Añadir variables de estado para barge-in
constructor() {
  // ... código existente ...
  this.bargeInAnalyser = null;
  this.bargeInCheckInterval = null;
  this.audioVolumeBeforeBargeIn = 1.0;
  this.isUserSpeaking = false;
}

// 2. Crear AnalyserNode para monitorear nivel de audio del micrófono
setupBargeInDetection(audioContext, stream) {
  if (!stream || !audioContext) return;
  
  // Crear AnalyserNode para detectar nivel de audio
  this.bargeInAnalyser = audioContext.createAnalyser();
  this.bargeInAnalyser.fftSize = 2048;
  this.bargeInAnalyser.smoothingTimeConstant = 0.8;
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(this.bargeInAnalyser);
  
  // Monitorear nivel de audio cada 50ms
  const dataArray = new Uint8Array(this.bargeInAnalyser.frequencyBinCount);
  
  this.bargeInCheckInterval = setInterval(() => {
    if (!this.currentAudio || !this.isSpeaking) return;
    
    this.bargeInAnalyser.getByteTimeDomainData(dataArray);
    
    // Calcular nivel promedio de audio
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] / 128.0) - 1.0;
      sum += Math.abs(normalized);
    }
    const average = sum / dataArray.length;
    
    // Umbral ajustable (0.15 = usuario hablando claramente)
    const SPEAKING_THRESHOLD = 0.15;
    
    if (average > SPEAKING_THRESHOLD && this.isSpeaking) {
      // Usuario está hablando mientras Sandra habla
      if (!this.isUserSpeaking) {
        this.isUserSpeaking = true;
        // 🎯 BAJAR VOLUMEN (no pausar) - estilo OpenAI Realtime
        if (this.currentAudio) {
          this.audioVolumeBeforeBargeIn = this.currentAudio.volume;
          this.currentAudio.volume = 0.2; // Bajar a 20% del volumen original
          console.log('[BARGE-IN] 🔇 Usuario habla, bajando volumen de Sandra a', this.currentAudio.volume);
        }
      }
    } else {
      // Usuario dejó de hablar
      if (this.isUserSpeaking && this.currentAudio) {
        this.isUserSpeaking = false;
        // Restaurar volumen original
        this.currentAudio.volume = this.audioVolumeBeforeBargeIn;
        console.log('[BARGE-IN] 🔊 Usuario calló, restaurando volumen de Sandra');
      }
    }
  }, 50); // Check cada 50ms (20 veces por segundo)
}

// 3. Limpiar cuando se cierra la llamada
cleanupBargeIn() {
  if (this.bargeInCheckInterval) {
    clearInterval(this.bargeInCheckInterval);
    this.bargeInCheckInterval = null;
  }
  this.bargeInAnalyser = null;
  this.isUserSpeaking = false;
}

// 4. Llamar setupBargeInDetection después de crear el stream
// En startMicrophoneCapture, después de obtener el stream:
this.stream = stream;
this.setupBargeInDetection(this.pcmAudioContext || this.audioCtx, stream);

// 5. Llamar cleanupBargeIn en hangupCall y stopAudioCapture
```

---

### FASE 2: DETECCIÓN DE FIN DE FRASE MEJORADA

**Objetivo:** Procesar ANTES de que el usuario termine de hablar (detectando puntuación)

**Implementación en servidor (src/services/voice-services.js):**

```javascript
// Modificar el handler de Transcript para detectar puntuación en interim_results
connection.on(LiveTranscriptionEvents.Transcript, (message) => {
  const transcript = message?.channel?.alternatives?.[0]?.transcript || '';
  if (!transcript) return;

  lastMessage = message;

  if (message?.is_final) {
    finalizedUtterance = `${finalizedUtterance} ${transcript}`.trim();
    interimUtterance = '';
    if (message?.speech_final) {
      flushFinalizedUtterance('speech_final', message);
      return;
    }
    scheduleIdleFlush();
    return;
  }

  // 🚀 NUEVO: Detección temprana de fin de frase en interim_results
  interimUtterance = transcript;
  const fullText = buildUtterance();
  
  // Detectar puntuación que indica fin de frase
  // Regex para detectar: punto, interrogación, exclamación al final
  const sentenceEndRegex = /[.?!]\s*$/;
  
  if (sentenceEndRegex.test(transcript) && fullText.length > 10) {
    // 🎯 FIN DE FRASE DETECTADO EN INTERIM - procesar inmediatamente
    logger.info(`[DEEPGRAM] 🚀 Early sentence end detected in interim: "${transcript}"`);
    
    // Acumular texto actual y procesar
    const textToProcess = finalizedUtterance + ' ' + transcript;
    finalizedUtterance = '';
    interimUtterance = '';
    
    // Disparar procesamiento ANTES de que termine de hablar
    clearIdleTimer();
    if (onTranscriptionFinalized) {
      onTranscriptionFinalized(textToProcess.trim(), message);
    }
    return;
  }
  
  if (onTranscriptionUpdated) {
    onTranscriptionUpdated(transcript, message);
  }
  scheduleIdleFlush();
});
```

---

### FASE 3: BUFFER INTELIGENTE PARA PIPELINE PARALELO

**Objetivo:** Permitir que el usuario siga hablando mientras se procesa la respuesta anterior

**Implementación en servidor (src/websocket/socket-server.js):**

```javascript
// Añadir buffer de texto acumulativo
deepgramData = {
  connection: null,
  isProcessing: false,
  pendingAudio: [],
  lastInterimSentAt: 0,
  lastInterimText: '',
  textBuffer: '', // 🚀 NUEVO: Buffer para acumular texto
  isProcessingLLM: false // 🚀 NUEVO: Flag para pipeline paralelo
};

// Modificar onTranscriptionFinalized para usar buffer
onTranscriptionFinalized: async (transcript, message) => {
  if (deepgramData && (deepgramData.isProcessing || deepgramData.isProcessingLLM)) {
    // 🚀 Si ya está procesando, acumular en buffer (pipeline paralelo)
    deepgramData.textBuffer += ' ' + transcript;
    logger.info(`[PIPELINE] 📝 Texto acumulado en buffer mientras se procesa: "${deepgramData.textBuffer.substring(0, 50)}..."`);
    return;
  }
  
  // ... resto del código existente ...
  
  // Al finalizar procesamiento, verificar si hay texto en buffer
  if (deepgramData && deepgramData.textBuffer.trim()) {
    const bufferedText = deepgramData.textBuffer.trim();
    deepgramData.textBuffer = '';
    // Procesar texto acumulado
    setTimeout(() => {
      // Llamar recursivamente para procesar buffer
      onTranscriptionFinalized(bufferedText, null);
    }, 100);
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Fase 1: Barge-in Avanzado
- [ ] Añadir variables de estado (bargeInAnalyser, isUserSpeaking, etc.)
- [ ] Crear función setupBargeInDetection()
- [ ] Implementar monitoreo de nivel de audio (AnalyserNode)
- [ ] Implementar lógica de bajar/restaurar volumen
- [ ] Llamar setupBargeInDetection después de crear stream
- [ ] Llamar cleanupBargeIn en hangupCall y stopAudioCapture

### ✅ Fase 2: Detección de Fin de Frase
- [ ] Modificar handler de Transcript en voice-services.js
- [ ] Añadir detección de puntuación en interim_results
- [ ] Probar con diferentes tipos de frases

### ✅ Fase 3: Buffer Inteligente
- [ ] Añadir textBuffer a deepgramData
- [ ] Modificar onTranscriptionFinalized para acumular texto
- [ ] Implementar procesamiento de buffer después de respuesta

---

## 🎯 RESULTADOS ESPERADOS

| Mejora | Antes | Después |
|--------|-------|---------|
| Barge-in latencia | 500ms+ | <50ms |
| Barge-in comportamiento | Corta audio (walkie-talkie) | Baja volumen (natural) |
| Detección fin de frase | Espera completo | Procesa en puntuación |
| Pipeline | Secuencial | Parcialmente paralelo |
| Latencia total | 1000-1300ms | 400-700ms |

---

## 🔧 CONFIGURACIONES AJUSTABLES

```javascript
// Barge-in
const SPEAKING_THRESHOLD = 0.15; // Ajustar según sensibilidad deseada
const BARGE_IN_VOLUME = 0.2; // Volumen cuando usuario habla (20%)
const BARGE_IN_CHECK_INTERVAL = 50; // ms (20 checks/segundo)

// Detección de fin de frase
const MIN_SENTENCE_LENGTH = 10; // Caracteres mínimos antes de procesar
const SENTENCE_END_REGEX = /[.?!]\s*$/; // Regex para detectar fin de frase
```
