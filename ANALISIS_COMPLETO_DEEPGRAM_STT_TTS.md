# ANÁLISIS COMPLETO: PROBLEMA DEEPGRAM STT/TTS
## Sistema Galaxy - Llamada Conversacional en Tiempo Real

---

## 1. ANÁLISIS DEL SISTEMA ACTUAL

### 1.1 Arquitectura del Proyecto

#### **Estructura de Archivos:**
```
GUESTVALENCIAPWA/
├── server.js              # Servidor HTTP (puerto 4040) - API REST
├── server-websocket.js     # Servidor WebSocket (puerto 4041) - Llamada conversacional
├── index.html             # Cliente PWA con widget de Sandra
├── api/
│   └── api-gateway.js     # Sistema Galaxy original (referencia)
├── assets/
│   ├── js/
│   │   ├── sandra-gateway.js
│   │   └── sandra-widget-integrated.js
│   └── images/
└── .env                   # Variables de entorno (API keys)
```

### 1.2 Flujo Actual de Llamada Conversacional

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (index.html)                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuario hace clic en "Llamada conversacional"           │
│ 2. startConversationalCall()                                │
│ 3. WebSocket.connect('ws://localhost:4041')                 │
│ 4. navigator.mediaDevices.getUserMedia({ audio: true })     │
│ 5. MediaRecorder (audio/webm;codecs=opus)                  │
│ 6. mediaRecorder.start(100) - chunks cada 100ms             │
│ 7. mediaRecorder.onstop()                                   │
│ 8. Blob → FileReader → base64                               │
│ 9. ws.send({ type: 'audio', audio: base64Audio })           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVIDOR WEBSOCKET (server-websocket.js)                   │
├─────────────────────────────────────────────────────────────┤
│ 1. ws.on('message') → data.type === 'audio'                │
│ 2. transcribeAudio(data.audio)                              │
│    ├─ Buffer.from(base64, 'base64')                         │
│    ├─ https.request → api.deepgram.com/v1/listen           │
│    └─ Parse JSON → transcript                               │
│ 3. generateStreamingResponse(userText, history)             │
│    └─ callGeminiStreaming() / callGPT4oStreaming()          │
│ 4. generateTTS(response)                                    │
│    └─ Cartesia API → audio base64                           │
│ 5. ws.send({ type: 'text', text: response })               │
│ 6. ws.send({ type: 'audio', audio: audioBase64 })          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (index.html)                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. ws.onmessage → data.type === 'text'                      │
│ 2. addMessage(data.text, 'bot')                             │
│ 3. ws.onmessage → data.type === 'audio'                     │
│ 4. playAudioResponse(data.audio)                            │
│ 5. Loop: volver a capturar audio                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Sistema Galaxy Original

#### **Componentes del Sistema Galaxy:**
- **AIOrchestrator**: Clase principal que gestiona IA (Gemini, OpenAI)
- **TTS (Cartesia)**: Implementado y funcionando
- **STT (Deepgram)**: Referenciado pero no completamente implementado en el original
- **Endpoints REST**: `/api/sandra/chat`, `/api/sandra/voice`

#### **Diferencias con Implementación Actual:**
- El sistema original NO tenía llamada conversacional en tiempo real
- Solo tenía TTS para respuestas de voz
- STT estaba referenciado pero no implementado para llamadas en tiempo real

---

## 2. DIAGNÓSTICO DEL PROBLEMA ACTUAL

### 2.1 Síntoma Principal

**Deepgram responde con HTTP 200 OK, pero devuelve transcript vacío:**
```json
{
  "results": {
    "channels": [{
      "alternatives": [{
        "transcript": "",
        "confidence": 0,
        "words": [],
        "paragraphs": {
          "transcript": "\n",
          "paragraphs": []
        }
      }]
    }]
  }
}
```

### 2.2 Análisis del Flujo de Audio

#### **Cliente → Servidor:**
1. **Captura**: `MediaRecorder` con `mimeType: 'audio/webm;codecs=opus'`
2. **Chunks**: Cada 100ms (muy cortos para Deepgram)
3. **Conversión**: `Blob` → `FileReader.readAsDataURL()` → base64
4. **Envío**: WebSocket con `{ type: 'audio', audio: base64Audio }`

#### **Servidor → Deepgram:**
1. **Decodificación**: `Buffer.from(audioBase64, 'base64')`
2. **Request**: `POST /v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true`
3. **Headers**: 
   - `Authorization: Token ${DEEPGRAM_API_KEY}`
   - `Content-Type: audio/webm`
   - `Content-Length: audioBuffer.length`
4. **Body**: Buffer raw del audio

### 2.3 Posibles Causas del Problema

#### **A) Formato de Audio**
- **Problema potencial**: Deepgram puede no reconocer correctamente `audio/webm;codecs=opus`
- **Solución**: Especificar encoding en query params o convertir a formato más compatible

#### **B) Tamaño de Chunks**
- **Problema actual**: Chunks de 100ms son demasiado cortos
- **Deepgram mínimo**: Requiere ~500ms-1s de audio para transcribir
- **Solución**: Acumular chunks hasta tener mínimo 1-2 segundos

#### **C) Calidad del Audio**
- **Problema potencial**: Audio puede estar silencioso o con ruido
- **Solución**: Validar nivel de audio antes de enviar

#### **D) Configuración de Deepgram**
- **Problema potencial**: Parámetros de query string pueden ser incorrectos
- **Solución**: Revisar documentación y ajustar parámetros

#### **E) Conversión Base64**
- **Problema potencial**: Prefijo `data:audio/webm;base64,` puede estar presente
- **Solución**: Ya implementado (remover prefijo), pero verificar

---

## 3. ANÁLISIS DEL CÓDIGO ACTUAL

### 3.1 Cliente (index.html) - Captura de Audio

**Ubicación**: Líneas ~2104-2163

**Problemas identificados:**
1. ✅ Chunks muy cortos (100ms) - **PROBLEMA CRÍTICO**
2. ✅ Validación de tamaño mínimo implementada
3. ✅ Limpieza de prefijo base64 implementada
4. ⚠️ No hay validación de nivel de audio (silence detection)

**Código actual:**
```javascript
mediaRecorder.start(100); // Chunks cada 100ms - MUY CORTO
```

### 3.2 Servidor (server-websocket.js) - Transcripción

**Ubicación**: Líneas ~158-269

**Problemas identificados:**
1. ✅ Manejo de transcript vacío mejorado (resuelve con string vacío)
2. ✅ Logs detallados implementados
3. ⚠️ Query params pueden necesitar ajuste
4. ⚠️ No hay validación de calidad de audio antes de enviar

**Código actual:**
```javascript
const queryParams = new URLSearchParams({
  model: 'nova-2',
  language: 'es',
  punctuate: 'true',
  smart_format: 'true'
});
```

### 3.3 TTS (Cartesia) - Generación de Voz

**Ubicación**: Líneas ~471-516

**Estado**: ✅ Funcionando correctamente
- Formato: MP3, 24000 Hz
- API: Cartesia v2024-06-10
- Voice ID: Configurado desde .env

---

## 4. PLAN DE SOLUCIÓN DETALLADO

### FASE 1: CORRECCIÓN DEL STT (Deepgram)

#### **Paso 1.1: Acumular Chunks de Audio**
**Problema**: Chunks de 100ms son demasiado cortos para Deepgram
**Solución**: Acumular chunks hasta tener mínimo 1-2 segundos antes de enviar

**Implementación:**
```javascript
// En index.html, startRealTimeCall()
let audioChunks = [];
let lastSendTime = Date.now();
const MIN_AUDIO_DURATION = 1500; // 1.5 segundos mínimo

mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunks.push(event.data);
    
    // Acumular hasta tener suficiente duración
    const elapsed = Date.now() - lastSendTime;
    if (elapsed >= MIN_AUDIO_DURATION && audioChunks.length > 0) {
      // Enviar chunk acumulado
      sendAudioChunk();
      audioChunks = [];
      lastSendTime = Date.now();
    }
  }
};
```

#### **Paso 1.2: Mejorar Configuración de Deepgram**
**Problema**: Parámetros pueden no ser óptimos
**Solución**: Ajustar según documentación oficial

**Implementación:**
```javascript
// En server-websocket.js, transcribeAudio()
const queryParams = new URLSearchParams({
  model: 'nova-2',           // Modelo más preciso
  language: 'es',            // Idioma español
  punctuate: 'true',          // Puntuación
  smart_format: 'true',      // Formato inteligente
  diarize: 'false',          // No diarización (una sola voz)
  multichannel: 'false',     // Mono channel
  interim_results: 'false'   // Solo resultados finales
});
```

#### **Paso 1.3: Validar Calidad de Audio**
**Problema**: Audio puede estar silencioso
**Solución**: Validar nivel de audio antes de enviar

**Implementación:**
```javascript
// En cliente, antes de enviar
function validateAudioLevel(audioBlob) {
  return new Promise((resolve) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const arrayBuffer = reader.result;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      // Calcular RMS (Root Mean Square) para detectar silencio
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      
      // Si RMS es muy bajo, es silencio
      resolve(rms > 0.01); // Threshold ajustable
    };
    
    reader.readAsArrayBuffer(audioBlob);
  });
}
```

#### **Paso 1.4: Debug de Audio**
**Problema**: No sabemos si el audio es válido
**Solución**: Guardar audio para verificación

**Implementación:**
```javascript
// En server-websocket.js (solo para debug)
const fs = require('fs');
fs.writeFileSync(`debug-audio-${Date.now()}.webm`, audioBuffer);
console.log('💾 Audio guardado para debug');
```

### FASE 2: OPTIMIZACIÓN DEL FLUJO

#### **Paso 2.1: Streaming Continuo**
**Mejora**: Enviar audio de forma continua sin esperar chunks completos

**Implementación:**
- Acumular chunks en buffer
- Enviar cada 1.5-2 segundos
- Procesar en paralelo mientras se captura más audio

#### **Paso 2.2: Manejo de Errores Mejorado**
**Mejora**: Reintentos automáticos y fallbacks

**Implementación:**
```javascript
async function transcribeAudioWithRetry(audioBase64, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await transcribeAudio(audioBase64);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### FASE 3: TESTING Y VALIDACIÓN

#### **Tests a Realizar:**
1. ✅ Audio se captura correctamente
2. ✅ Audio se acumula hasta tener duración mínima
3. ⚠️ Audio se envía a Deepgram con formato correcto
4. ⚠️ Deepgram transcribe correctamente
5. ✅ Respuesta de IA se genera
6. ✅ Audio TTS se genera
7. ✅ Audio se reproduce en cliente
8. ⚠️ Flujo completo funciona sin errores

---

## 5. ORDEN DE IMPLEMENTACIÓN

### **PRIORIDAD ALTA (Resolver primero)**

1. **Acumular chunks de audio** (Paso 1.1)
   - Cambiar de 100ms a acumular 1.5-2 segundos
   - Implementar buffer de acumulación
   - **Archivo**: `index.html` líneas ~2104-2163

2. **Ajustar configuración Deepgram** (Paso 1.2)
   - Revisar parámetros según documentación
   - Agregar parámetros faltantes si es necesario
   - **Archivo**: `server-websocket.js` líneas ~189-194

3. **Validar calidad de audio** (Paso 1.3)
   - Implementar detección de silencio
   - No enviar audio silencioso
   - **Archivo**: `index.html` antes de enviar audio

### **PRIORIDAD MEDIA (Mejoras)**

4. **Debug de audio** (Paso 1.4)
   - Guardar archivos de audio para verificación
   - Solo en desarrollo, comentar en producción

5. **Streaming continuo** (Paso 2.1)
   - Optimizar flujo para menor latencia

6. **Reintentos automáticos** (Paso 2.2)
   - Manejar errores temporales de red

---

## 6. ARCHIVOS A MODIFICAR

### 6.1 `index.html`
**Cambios necesarios:**
- Líneas ~2104-2163: Modificar captura de audio para acumular chunks
- Agregar función `validateAudioLevel()` antes de enviar
- Modificar `mediaRecorder.start()` para usar tiempos más largos

### 6.2 `server-websocket.js`
**Cambios necesarios:**
- Líneas ~189-194: Ajustar query params de Deepgram
- Líneas ~158-269: Mejorar validación de audio recibido
- Agregar función de debug (guardar audio) - opcional

### 6.3 `.env`
**Verificar:**
- `DEEPGRAM_API_KEY` está configurada y es válida
- Formato correcto (sin espacios, sin comillas)

---

## 7. CHECKLIST DE IMPLEMENTACIÓN

### **Pre-Implementación:**
- [ ] Revisar documentación oficial de Deepgram API
- [ ] Verificar que API key de Deepgram es válida
- [ ] Probar endpoint de Deepgram con curl/Postman

### **Implementación:**
- [ ] Modificar acumulación de chunks en cliente
- [ ] Ajustar configuración de Deepgram
- [ ] Implementar validación de nivel de audio
- [ ] Agregar logs detallados
- [ ] Implementar debug de audio (opcional)

### **Testing:**
- [ ] Probar con audio claro y fuerte
- [ ] Probar con audio bajo
- [ ] Probar con silencio
- [ ] Verificar transcripción correcta
- [ ] Verificar flujo completo STT → IA → TTS

### **Post-Implementación:**
- [ ] Remover código de debug
- [ ] Optimizar para producción
- [ ] Documentar cambios

---

## 8. REFERENCIAS Y DOCUMENTACIÓN

### **Deepgram API:**
- Documentación: https://developers.deepgram.com/
- Endpoint: `POST /v1/listen`
- Modelos: `nova-2`, `general`, `enhanced`
- Formatos soportados: `webm`, `wav`, `mp3`, `ogg`

### **MediaRecorder API:**
- Documentación: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- Formatos: `audio/webm`, `audio/webm;codecs=opus`
- Chunks: Configurables con `start(timeslice)`

### **Cartesia API:**
- Documentación: https://docs.cartesia.ai/
- Endpoint: `POST /tts/bytes`
- Formatos: `mp3`, `wav`, `webm`
- Sample rates: 16000, 24000, 44100, 48000

---

## 9. CONCLUSIÓN

### **Problema Principal Identificado:**
Los chunks de audio de 100ms son demasiado cortos para que Deepgram pueda transcribir correctamente. Deepgram necesita mínimo 500ms-1s de audio para procesar.

### **Solución Principal:**
Acumular chunks de audio hasta tener mínimo 1.5-2 segundos antes de enviar a Deepgram.

### **Mejoras Adicionales:**
1. Ajustar parámetros de Deepgram según documentación
2. Validar nivel de audio antes de enviar
3. Implementar debug para verificar calidad de audio

### **Próximos Pasos:**
1. Implementar acumulación de chunks (PRIORIDAD 1)
2. Ajustar configuración Deepgram (PRIORIDAD 2)
3. Agregar validación de audio (PRIORIDAD 3)
4. Testing completo del flujo

---

**Fecha de Análisis**: 2025-12-07
**Analista**: Codex (AI Assistant)
**Estado**: Listo para implementación

