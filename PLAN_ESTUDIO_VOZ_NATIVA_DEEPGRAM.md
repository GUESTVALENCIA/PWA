# 📋 PLAN DE ESTUDIO: Configuración Voz Nativa con Deepgram

## ⚠️ PROBLEMA ACTUAL

Deepgram devuelve error **400: "Bad Request: failed to process audio: corrupt or unsupported data"**

**El usuario indica:**
- ❌ NO es problema de API key (ya corregido)
- ✅ Es problema de cómo Deepgram procesa "voz nativa"
- ✅ Necesita configuración específica para archivos de audio locales
- ✅ NO es una API de TTS - es archivo WAV local

---

## 🎯 OBJETIVOS DEL ESTUDIO

1. ✅ **Verificar conexión Groq API** (REQUISITO CRÍTICO - sin esto no continuar)
2. 🔍 Entender cómo Deepgram procesa audio WebM/Opus en chunks pequeños
3. 🔍 Investigar configuración correcta para "voz nativa" (archivos locales)
4. 🔍 Analizar formato de audio que se envía actualmente
5. 📝 Documentar solución completa
6. ✅ Implementar solo después de confirmación del usuario

---

## 📊 ANÁLISIS ACTUAL

### Flujo de Audio Actual

```
Usuario habla → MediaRecorder (WebM/Opus) → Chunks 250ms → Base64 → WebSocket → 
Servidor → Decodifica Base64 → Buffer → Deepgram STT → ❌ ERROR 400
```

### Formato de Audio Enviado

**Desde Cliente (index.html):**
- **MIME Type:** `audio/webm;codecs=opus`
- **Chunk Size:** 250ms (muy pequeño)
- **Encoding:** Base64 en JSON
- **Container:** WebM
- **Codec:** Opus

**A Deepgram (voice-services.js):**
- **URL:** `https://api.deepgram.com/v1/listen?model=nova-2&language=es&encoding=opus`
- **Body:** Buffer binario directo
- **Headers:** Solo Authorization (sin Content-Type)

### Problema Identificado

**Chunks de 250ms WebM/Opus pueden ser problemáticos:**
1. WebM tiene overhead de container
2. 250ms puede no tener suficiente data válida
3. Deepgram puede rechazar chunks incompletos
4. Opus necesita frames completos para decodificar

---

## 🔬 INVESTIGACIÓN REQUERIDA

### Pregunta 1: ¿Deepgram acepta chunks pequeños WebM/Opus?

**Necesito verificar:**
- ¿Deepgram REST API soporta streaming chunks pequeños?
- ¿Necesita chunks mínimos de cierto tamaño?
- ¿Funciona mejor con archivos completos vs chunks?

### Pregunta 2: ¿Qué formato es más compatible?

**Opciones:**
- **WebM/Opus con chunks más grandes (1-2 segundos)**
- **PCM/linear16 (más compatible, pero más ancho de banda)**
- **MP3 (menos común en navegadores)**
- **Deepgram Streaming API (WebSocket en lugar de REST)**

### Pregunta 3: ¿Configuración específica para "voz nativa"?

El usuario menciona "voz nativa" - esto puede referirse a:
- Usar formato PCM/linear16 (voz sin compresión)
- Especificar sample_rate explícitamente
- Usar configuración diferente para archivos locales vs streaming

---

## 🧪 PRUEBAS NECESARIAS

### Test 1: Verificar Groq API ✅ (PRIMERO)

```javascript
// Debe responder correctamente
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'qwen2.5-72b-instruct',
    messages: [{ role: 'user', content: 'Test' }]
  })
});
```

### Test 2: Probar Deepgram con chunk más grande

**Cambio propuesto:**
```javascript
// En index.html, cambiar de 250ms a 1000ms
this.mediaRecorder.start(1000); // 1 segundo en lugar de 250ms
```

### Test 3: Agregar sample_rate explícito

**Cambio propuesto:**
```javascript
// En voice-services.js
if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000'; // Opus default
}
```

### Test 4: Validar tamaño mínimo de chunk

**Cambio propuesto:**
```javascript
// En voice-services.js, antes de enviar a Deepgram
if (audioBuffer.length < 1000) { // 1KB mínimo
  logger.warn('Chunk too small, skipping');
  return '';
}
```

---

## 💡 SOLUCIONES PROPUESTAS

### Solución 1: Aumentar tamaño de chunks (MÁS PROBABLE)

**Ventajas:**
- WebM containers más completos
- Menos overhead relativo
- Frames Opus más completos

**Desventajas:**
- Mayor latencia (1 segundo vs 250ms)
- Más datos por chunk

**Implementación:**
```javascript
// index.html línea ~1438
this.mediaRecorder.start(1000); // Cambiar de 250 a 1000
```

### Solución 2: Agregar sample_rate explícito

**Ventajas:**
- Deepgram sabe exactamente qué esperar
- Elimina ambigüedad

**Implementación:**
```javascript
// voice-services.js línea ~56
if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000';
}
```

### Solución 3: Validar chunks antes de enviar

**Ventajas:**
- Evita enviar datos inválidos
- Mejor logging para debugging

**Implementación:**
```javascript
// voice-services.js después de Buffer.from
if (audioBuffer.length < 1000) {
  logger.warn(`Chunk too small: ${audioBuffer.length} bytes`);
  return '';
}
```

### Solución 4: Usar Deepgram Streaming API (ALTERNATIVA)

Si REST API sigue fallando, considerar WebSocket Streaming API de Deepgram que está diseñado específicamente para streaming en tiempo real.

---

## 📝 PLAN DE IMPLEMENTACIÓN

### Fase 1: Verificación Groq ✅

1. ✅ Crear script de test Groq
2. ✅ Ejecutar test
3. ✅ Confirmar que funciona
4. ⚠️ **NO CONTINUAR si Groq no funciona**

### Fase 2: Implementar Cambios (Solo si Groq OK)

1. ✅ Cambiar chunk size a 1000ms
2. ✅ Agregar sample_rate=48000
3. ✅ Agregar validación de tamaño mínimo
4. ✅ Deploy y test

### Fase 3: Verificación

1. ✅ Test completo end-to-end
2. ✅ Verificar que Deepgram acepta audio
3. ✅ Verificar que Groq procesa correctamente
4. ✅ Verificar que voz nativa se reproduce

---

## ⚠️ NOTAS IMPORTANTES

1. **NO implementar sin confirmación del usuario**
2. **Groq DEBE funcionar primero** (requisito explícito)
3. **Voz nativa = archivo WAV local**, no API TTS
4. **El problema es STT (transcripción)**, no TTS (generación de voz)

---

## 📚 REFERENCIAS

- Deepgram API Docs: https://developers.deepgram.com
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- WebM/Opus specs: https://www.webmproject.org/docs/
- Groq API Docs: https://console.groq.com/docs
