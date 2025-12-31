# 🔬 ESTUDIO COMPLETO: Configuración Voz Nativa con Deepgram STT

## 🎯 OBJETIVO

Resolver error **400: "Bad Request: failed to process audio: corrupt or unsupported data"** de Deepgram cuando procesa audio del usuario para STT (Speech-to-Text).

---

## 📊 ANÁLISIS DEL PROBLEMA ACTUAL

### Error Observado

```
Deepgram Error: 400 - {
  "err_code": "Bad Request",
  "err_msg": "Bad Request: failed to process audio: corrupt or unsupported data"
}
```

### Flujo Actual (QUE FALLA)

```
1. Usuario habla → MediaRecorder captura audio
2. MediaRecorder genera chunks WebM/Opus cada 250ms
3. Chunk se convierte a Base64
4. Base64 se envía por WebSocket al servidor
5. Servidor decodifica Base64 → Buffer binario
6. Buffer se envía a Deepgram REST API
7. ❌ Deepgram rechaza: "corrupt or unsupported data"
```

### Formato de Audio Actual

**Cliente (index.html línea ~1381):**
- **MIME Type:** `audio/webm;codecs=opus`
- **Chunk Size:** **250ms** (MUY PEQUEÑO)
- **Encoding:** Base64 string en JSON
- **Container:** WebM
- **Codec:** Opus

**Servidor (voice-services.js línea ~52):**
- **Deepgram URL:** `https://api.deepgram.com/v1/listen?model=nova-2&language=es&encoding=opus`
- **Body:** Buffer binario directo
- **Headers:** Solo `Authorization: Token ${API_KEY}` (sin Content-Type)

---

## 🔍 INVESTIGACIÓN: Por Qué Falla

### Problema Principal: Chunks Demasiado Pequeños

**WebM Container Overhead:**
- WebM tiene headers/metadata en cada chunk
- 250ms de audio ≈ ~12KB (con overhead puede ser ~15-20KB)
- Si el overhead es grande, el audio real puede ser < 100 bytes
- Deepgram necesita frames Opus válidos y completos

**Opus Codec Requirements:**
- Opus codifica en frames de ~20-60ms
- 250ms = ~4-12 frames Opus
- Cada frame necesita headers válidos
- Chunks pequeños pueden tener frames incompletos

**Deepgram Expectations:**
- Deepgram espera audio válido y decodificable
- Chunks muy pequeños pueden parecer corruptos
- Sin Content-Type, Deepgram debe auto-detectar (puede fallar)

---

## 💡 SOLUCIONES PROPUESTAS

### Solución 1: Aumentar Tamaño de Chunks ⭐ (MÁS PROBABLE)

**Cambio:** De 250ms a **1000ms (1 segundo)**

**Justificación:**
- 1 segundo = ~48KB de audio Opus
- Suficiente para frames Opus completos
- WebM overhead es porcentualmente menor
- Deepgram puede procesar chunks de 1 segundo sin problemas

**Implementación:**
```javascript
// index.html línea ~1438
// ANTES:
this.mediaRecorder.start(250); // 250ms

// DESPUÉS:
this.mediaRecorder.start(1000); // 1000ms (1 segundo)
```

**Trade-offs:**
- ✅ Mayor compatibilidad con Deepgram
- ✅ Chunks más estables
- ⚠️ Mayor latencia (1 segundo vs 250ms)
- ⚠️ Más datos por mensaje WebSocket

---

### Solución 2: Agregar sample_rate Explícito

**Cambio:** Especificar `sample_rate=48000` en URL de Deepgram

**Justificación:**
- Opus default es 48kHz
- Especificar elimina ambigüedad
- Deepgram puede optimizar mejor el procesamiento

**Implementación:**
```javascript
// voice-services.js línea ~55
// ANTES:
if (format === 'webm') {
  url += '&encoding=opus';
}

// DESPUÉS:
if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000';
}
```

---

### Solución 3: Validar Tamaño Mínimo de Chunks

**Cambio:** Filtrar chunks demasiado pequeños antes de enviar a Deepgram

**Justificación:**
- Evita enviar datos inválidos
- Ahorra llamadas API fallidas
- Mejor logging para debugging

**Implementación:**
```javascript
// voice-services.js después de Buffer.from (línea ~38)
// Agregar validación:
if (audioBuffer.length < 2000) { // 2KB mínimo para WebM válido
  logger.warn(`Audio chunk too small: ${audioBuffer.length} bytes, skipping`);
  return ''; // Retornar string vacío (no error, solo skip)
}
```

---

### Solución 4: Agregar Content-Type Header (ALTERNATIVA)

**Cambio:** Especificar Content-Type explícitamente

**Justificación:**
- Deepgram puede procesar mejor el formato
- Elimina necesidad de auto-detection

**Implementación:**
```javascript
// voice-services.js línea ~67
// ANTES:
headers: {
  'Authorization': `Token ${this.deepgramApiKey}`,
  // Don't set Content-Type - let Deepgram auto-detect
}

// DESPUÉS:
headers: {
  'Authorization': `Token ${this.deepgramApiKey}`,
  'Content-Type': 'audio/webm' // Especificar explícitamente
}
```

**Nota:** Esto puede funcionar o no - Deepgram docs dicen que auto-detect funciona mejor, pero puede ayudar en algunos casos.

---

## 🧪 PLAN DE PRUEBAS

### Test 1: Verificar Groq API ✅ (REQUISITO CRÍTICO)

**Script:** `test-groq-connection.js`
**Acción:** Llamar a Groq API directamente
**Resultado Esperado:** Respuesta 200 con contenido válido

**⚠️ NO CONTINUAR SI GROQ NO FUNCIONA**

### Test 2: Probar con Chunks de 1 Segundo

1. Implementar Solución 1 (cambiar 250ms → 1000ms)
2. Hacer llamada conversacional
3. Verificar logs de Deepgram
4. Confirmar que error 400 desaparece

### Test 3: Probar con sample_rate Explícito

1. Implementar Solución 2 (agregar sample_rate=48000)
2. Si Test 2 falló, probar con esta solución adicional
3. Verificar logs

### Test 4: Validación de Tamaño

1. Implementar Solución 3 (validar tamaño mínimo)
2. Verificar que chunks pequeños se filtran
3. Confirmar que solo chunks válidos llegan a Deepgram

---

## 📝 IMPLEMENTACIÓN PROPUESTA (Orden de Prioridad)

### Prioridad 1: Solución 1 (Aumentar Chunks)

**Archivo:** `index.html`
**Línea:** ~1438
**Cambio:**
```javascript
// Cambiar de 250ms a 1000ms
this.mediaRecorder.start(1000);
```

### Prioridad 2: Solución 2 (sample_rate)

**Archivo:** `src/services/voice-services.js`
**Línea:** ~56
**Cambio:**
```javascript
if (format === 'webm') {
  url += '&encoding=opus&sample_rate=48000';
}
```

### Prioridad 3: Solución 3 (Validación)

**Archivo:** `src/services/voice-services.js`
**Línea:** ~43 (después de validación existente)
**Cambio:**
```javascript
// Validar tamaño mínimo para WebM válido
if (audioBuffer.length < 2000) {
  logger.warn(`Audio chunk too small: ${audioBuffer.length} bytes, skipping`);
  return ''; // Skip chunk, no error
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de presentar solución al usuario:

- [ ] ✅ Groq API funciona correctamente
- [ ] 📝 Estudio completo documentado
- [ ] 💡 Soluciones propuestas claras
- [ ] 🔧 Código de implementación preparado
- [ ] 🧪 Plan de pruebas definido
- [ ] 📊 Análisis de trade-offs completo

---

## 🚨 NOTAS IMPORTANTES

1. **Voz Nativa = Archivo WAV Local:**
   - El usuario menciona "voz nativa" pero el problema es STT (entrada), no TTS (salida)
   - El archivo WAV `sandra-conversational.wav` es para TTS (ya funciona)
   - El problema actual es STT (transcripción de audio del usuario)

2. **NO es Problema de API Key:**
   - API key ya está corregida
   - Error 400 (Bad Request) ≠ Error 401 (Unauthorized)
   - Problema es formato/configuración, no autenticación

3. **Groq DEBE Funcionar Primero:**
   - Requisito explícito del usuario
   - Sin confirmación de Groq, NO implementar cambios

---

## 📚 REFERENCIAS TÉCNICAS

- **Deepgram REST API:** https://developers.deepgram.com/docs/rest-api
- **Opus Codec:** https://opus-codec.org/
- **WebM Container:** https://www.webmproject.org/docs/
- **MediaRecorder API:** https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

---

**Estado:** ✅ Estudio Completo - Listo para Presentación
**Próximo Paso:** Verificar Groq API, luego presentar al usuario para aprobación
