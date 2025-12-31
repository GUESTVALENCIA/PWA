# 🔍 ESTUDIO: Configuración de Voz Nativa con Deepgram

## Problema Identificado

Deepgram está devolviendo error 400: "Bad Request: failed to process audio: corrupt or unsupported data"

**ERROR NO ES:** Problema de API key (ya corregido)
**ERROR REAL:** Formato/configuración de audio incompatible con Deepgram

---

## Análisis del Flujo Actual

### 1. Cliente → Servidor (Audio del Usuario)

**Formato enviado:**
- **MIME Type:** `audio/webm;codecs=opus`
- **Container:** WebM
- **Codec:** Opus
- **Chunks:** 250ms slices (streaming)
- **Encoding:** Base64 string en JSON

**Código cliente (index.html):**
```javascript
MediaRecorder con mimeType: 'audio/webm;codecs=opus'
Chunks enviados cada 250ms como base64 en JSON
```

### 2. Servidor → Deepgram API

**Código actual (voice-services.js):**
```javascript
// URL con encoding=opus para WebM
let url = `https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true&encoding=opus`;

// Headers sin Content-Type (auto-detect)
headers: {
  'Authorization': `Token ${this.deepgramApiKey}`
}

// Body: Buffer directo del base64 decodificado
body: audioBuffer
```

**PROBLEMA POTENCIAL:**
- Deepgram puede no aceptar chunks de 250ms WebM/Opus directamente
- El encoding `opus` puede no ser suficiente
- Puede necesitar `container=webm` además de `encoding=opus`

---

## Investigación: Requisitos de Deepgram para WebM/Opus

### Formatos Soportados por Deepgram

Según documentación de Deepgram:

1. **Streaming Audio (Real-time):**
   - Opus (WebM container)
   - PCM/LPCM (linear16)
   - MP3
   - FLAC

2. **Parámetros Requeridos:**
   - `encoding`: Codec de audio (opus, linear16, mp3, flac)
   - `sample_rate`: Frecuencia de muestreo (opcional, auto-detect)
   - `channels`: Mono/Stereo (opcional, default mono)

3. **Para WebM/Opus específicamente:**
   - `encoding=opus` ✅ (ya tenemos)
   - `sample_rate=48000` ⚠️ (Opus default, puede ser necesario especificar)
   - `container` NO es parámetro de URL (Deepgram lo detecta del payload)

### Posibles Soluciones

#### Opción 1: Especificar sample_rate explícitamente

```javascript
// Para WebM/Opus, especificar sample rate
if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000';
}
```

#### Opción 2: Cambiar a linear16 (PCM) - Más Compatible

```javascript
// Convertir WebM/Opus a PCM antes de enviar a Deepgram
// Requiere ffmpeg o similar en el servidor
```

#### Opción 3: Enviar chunks más grandes

```javascript
// En lugar de 250ms, enviar 1-2 segundos para mejor compatibilidad
this.mediaRecorder.start(1000); // 1 segundo
```

#### Opción 4: Usar Deepgram Streaming API

```javascript
// En lugar de REST API, usar WebSocket Streaming
// Mejor para chunks pequeños en tiempo real
```

---

## Análisis del Error "Corrupt or Unsupported Data"

### Causas Posibles:

1. **Chunks demasiado pequeños (250ms):**
   - WebM container tiene overhead
   - 250ms puede ser insuficiente para header válido
   - Deepgram puede rechazar chunks incompletos

2. **Formato WebM/Opus no completamente compatible:**
   - Deepgram puede tener problemas con ciertos perfiles de Opus
   - Container WebM puede tener estructura no esperada

3. **Falta de metadatos de audio:**
   - Deepgram puede necesitar sample_rate explícito
   - Channels (mono/stereo) puede ser necesario

4. **Buffer corrupto durante decodificación:**
   - Base64 → Buffer puede tener problemas
   - Encoding/decoding incorrecto

---

## Solución Propuesta: Configuración Correcta

### Cambio 1: Aumentar tamaño de chunks

**En index.html:**
```javascript
// Cambiar de 250ms a 1000ms (1 segundo)
this.mediaRecorder.start(1000);
```

### Cambio 2: Agregar sample_rate explícito

**En voice-services.js:**
```javascript
let url = `https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true&smart_format=true`;

if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000';
}
```

### Cambio 3: Validar chunks completos

**En voice-services.js:**
```javascript
// Validar que el chunk tenga tamaño mínimo razonable
if (audioBuffer.length < 500) { // 500 bytes mínimo
  logger.warn('Audio chunk too small, skipping');
  return '';
}
```

### Cambio 4: Usar Deepgram Streaming (Alternativa)

Si REST API sigue fallando, considerar WebSocket Streaming API de Deepgram para mejor compatibilidad con chunks pequeños.

---

## Próximos Pasos

1. ✅ Verificar conexión Groq API
2. ✅ Implementar cambios propuestos
3. ✅ Probar con chunks de 1 segundo
4. ✅ Agregar sample_rate=48000
5. ✅ Validar tamaño mínimo de chunks
6. ✅ Test completo end-to-end

---

## Referencias

- Deepgram API Docs: https://developers.deepgram.com
- WebM/Opus encoding specs
- MediaRecorder API documentation
