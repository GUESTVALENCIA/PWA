# 🔍 ANÁLISIS COMPLETO DEL SISTEMA - Pipeline Conversacional

**Fecha:** 2026-01-03  
**Estado:** Sistema inestable con múltiples problemas críticos  
**Objetivo:** Limpiar y reconstruir pipeline robusto y estable

---

## 📊 PROBLEMAS IDENTIFICADOS

### 1. **AUDIO PRE-GRABADO DEL SALUDO** ❌
**Problema:** El sistema intenta usar audio pre-grabado (`welcome.mp3`) que causa cambio de voz/timbre/tono.

**Ubicación:**
- `MEMORIA_PERSISTENTE_PROYECTO.md` menciona `assets/audio/welcome.mp3`
- `socket-server.js:handleInitialGreeting()` genera saludo con TTS (correcto)
- Pero hay referencia a archivo grabado en documentación

**Impacto:** 
- Cambio perceptible de voz entre saludo y conversación
- El usuario nota claramente la diferencia
- No es "real-time" como debería ser

**Solución:** ✅ ELIMINAR completamente cualquier referencia a audio pre-grabado. Solo TTS en tiempo real.

---

### 2. **MÚLTIPLES MODELOS/VOCES** ❌
**Problema:** El sistema tiene configuraciones contradictorias con múltiples modelos de voz.

**Estado Actual:**
```javascript
// src/services/voice-services.js:472
model = 'aura-2-diana-es'  // Default en generateVoice()

// src/services/voice-services.js:467
model: 'aura-2-agustina-es'  // Default en legacy call signature

// src/services/voice-services.js:587
async createTTSStreamingConnection(model = 'aura-2-agustina-es')

// src/services/voice-services.js:738
async _generateDeepgramTTS(text, model = 'aura-2-agustina-es')

// src/websocket/socket-server.js:1314
model: 'aura-2-agustina-es'  // En handleInitialGreeting
```

**Logs muestran:**
- Se intenta usar `aura-2-diana-es`
- Deepgram devuelve `aura-asteria-en` (modelo incorrecto)
- Error 1008 (Policy Violation)
- Fallback constante a REST API

**Impacto:**
- Cambios de voz/acento durante la conversación
- Errores constantes de WebSocket
- Latencia horrible por fallbacks

**Solución:** ✅ UN SOLO MODELO fijo en TODO el sistema. Esperar JSON del usuario.

---

### 3. **WEBSOCKET TTS vs REST API - INESTABILIDAD** ❌
**Problema:** El sistema intenta usar WebSocket TTS pero falla constantemente, cayendo a REST API.

**Estado Actual:**
```javascript
// src/services/voice-services.js:504-528
// 🚫 WEBSOCKET DESHABILITADO: Siempre falla con error 1008
if (streaming && text && text.trim() !== '') {
  try {
    const ttsWs = await this.createTTSStreamingConnection(model);
    // ... falla con error 1008
    // Fallback to REST API
  }
}
```

**Logs muestran:**
```
[TTS] ⚠️ Model mismatch! Requested: aura-2-diana-es, Got: aura-asteria-en
[TTS] ❌ WebSocket closed with Policy Violation (1008): DATA-0000
[TTS] ⚠️ WebSocket streaming failed, falling back to REST API
[TTS] 🎙️ Generating audio with Deepgram TTS REST API
```

**Impacto:**
- Latencia horrible (timeouts de 10 segundos antes de fallback)
- Cambios constantes entre WebSocket y REST
- El usuario nota "cortes" e "interrupciones"
- No es "real-time" como OpenAI Realtime API

**Solución:** ✅ DECIDIR: Usar SOLO REST API (más simple, estable) O arreglar WebSocket completamente. NO cambiar entre ambos.

---

### 4. **MÚLTIPLES TRANSCRIPCIONES PROCESÁNDOSE** ❌
**Problema:** El sistema procesa múltiples transcripciones simultáneamente, causando múltiples respuestas.

**Logs muestran:**
```
[DEEPGRAM] ✅ Utterance finalized (idle_timeout): "Hola, estás en tiempo"
[DEEPGRAM] ✅ Utterance finalized (Results): "Hola, estás en tiempo"
🤖 Processing transcript with AI: "Hola, estás en tiempo"
[DEEPGRAM] ✅ Utterance finalized (speech_final): "Hola, estás en tiempo."
[DEEPGRAM] New transcript while processing - allowing (user spoke again)
🤖 Processing transcript with AI: "Hola, estás en tiempo."
```

**Impacto:**
- Múltiples respuestas de AI para la misma frase
- Latencia adicional
- Confusión en el usuario

**Solución:** ✅ Mejorar lógica de deduplicación en `socket-server.js`.

---

### 5. **CARTESIA TTS HABILITADO PERO NO USADO** ⚠️
**Problema:** El código tiene lógica para Cartesia pero no se usa consistentemente.

**Estado:**
- Cartesia está habilitado en `voice-services.js`
- Fallback logic presente
- Pero no se usa porque Deepgram tiene crédito

**Solución:** ✅ Eliminar Cartesia completamente si solo usamos Deepgram.

---

## 🏗️ ARQUITECTURA ACTUAL

### Componentes Principales:

1. **Frontend (`index.html`)**
   - Widget Sandra
   - WebSocket client
   - Audio capture (MediaRecorder)
   - Audio playback

2. **Backend (`src/websocket/socket-server.js`)**
   - WebSocket server
   - Manejo de conexiones
   - `handleInitialGreeting()` - Genera saludo con TTS
   - `handleMessage()` - Procesa mensajes del cliente

3. **Voice Services (`src/services/voice-services.js`)**
   - Deepgram STT (Streaming) ✅ Funciona
   - Deepgram TTS (REST API) ✅ Funciona
   - Deepgram TTS (WebSocket) ❌ Falla constantemente
   - Cartesia TTS (REST API) ⚠️ Habilitado pero no usado

4. **AI Services (`src/services/voice-services.js:processMessage`)**
   - OpenAI GPT-4o-mini ✅ Fijado como único modelo
   - Fallbacks eliminados ✅

---

## 📋 PLAN DE LIMPIEZA Y RECONSTRUCCIÓN

### FASE 1: ANÁLISIS Y DOCUMENTACIÓN ✅ (EN PROGRESO)
- [x] Identificar todos los problemas
- [x] Documentar estado actual
- [ ] Esperar JSON del usuario para configuración de modelo único
- [ ] Crear plan detallado de cambios

### FASE 2: LIMPIEZA DE CÓDIGO
- [ ] Eliminar referencias a audio pre-grabado (`welcome.mp3`)
- [ ] Eliminar Cartesia TTS completamente
- [ ] Eliminar WebSocket TTS (o arreglarlo completamente, no dejar fallback)
- [ ] Unificar modelo de voz (esperar JSON del usuario)
- [ ] Eliminar código muerto y comentarios obsoletos
- [ ] Limpiar lógica de deduplicación de transcripciones

### FASE 3: RECONSTRUCCIÓN
- [ ] Implementar pipeline limpio con un solo modelo
- [ ] Decidir: SOLO REST API TTS (más simple) o arreglar WebSocket
- [ ] Implementar saludo con TTS (no pre-grabado)
- [ ] Optimizar latencia
- [ ] Testing completo

### FASE 4: VALIDACIÓN
- [ ] Test de llamada completa
- [ ] Verificar latencia
- [ ] Verificar consistencia de voz
- [ ] Verificar estabilidad

---

## 🎯 CONFIGURACIÓN OBJETIVO (PENDIENTE JSON DEL USUARIO)

### Modelo de Voz:
- **ÚNICO MODELO:** (Esperando JSON del usuario)
- **Aplicar en:** TODO el sistema (saludo + respuestas)

### Pipeline TTS:
- **Opción A:** SOLO REST API (más simple, estable, latencia aceptable)
- **Opción B:** WebSocket TTS arreglado completamente (menor latencia, más complejo)

### AI Model:
- ✅ OpenAI GPT-4o-mini (ya fijado)
- Sin fallbacks

---

## 📝 DECISIONES PENDIENTES

1. **Modelo de voz único:** Esperando JSON del usuario
2. **TTS Pipeline:** REST API solo vs WebSocket arreglado
3. **Eliminación de Cartesia:** Confirmar si se usa o no

---

## 🔧 PRÓXIMOS PASOS

1. ✅ Completar análisis (ESTE DOCUMENTO)
2. ⏳ Esperar JSON del usuario con configuración de modelo único
3. ⏳ Crear plan detallado de implementación
4. ⏳ Ejecutar limpieza
5. ⏳ Ejecutar reconstrucción
6. ⏳ Testing y validación

---

**Nota:** Este análisis se actualizará cuando el usuario proporcione el JSON de configuración del modelo único.
