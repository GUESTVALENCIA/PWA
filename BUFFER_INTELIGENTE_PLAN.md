# 🚀 PLAN: BUFFER INTELIGENTE PARA LATENCIA CERO

**Fecha:** 2026-01-03  
**Objetivo:** Implementar buffer inteligente que procese transcripciones interim para generar respuestas ANTES de que el usuario termine de hablar

---

## 🎯 CONCEPTO

### **Problema actual:**
- Respuesta se genera DESPUÉS de que el usuario termine de hablar
- Latencia de ~1-2 segundos desde que usuario termina hasta que IA responde
- Vacío/silencio entre turnos de conversación

### **Solución: Buffer Inteligente**
- Procesar transcripciones **interim** (parciales) de Deepgram
- Generar respuesta de IA **mientras** el usuario sigue hablando
- Usar respuesta anticipada cuando el usuario termina (latencia cero)

---

## 📋 IMPLEMENTACIÓN

### **1. Agregar campos al `deepgramData`:**

```javascript
deepgramData = {
  // ... campos existentes ...
  pendingAIResponse: null, // Respuesta de IA generada anticipadamente
  pendingAIRequest: null, // AbortController para cancelar request
  lastInterimProcessedAt: 0 // Timestamp de última transcripción interim procesada
};
```

### **2. Función `processInterimTranscript`:**

```javascript
async function processInterimTranscript(interimText, ws, voiceServices, agentId, deepgramData, abortController) {
  // Procesar con IA (puede ser cancelado si usuario continúa hablando)
  const aiResponse = await voiceServices.ai.processMessage(interimText, context);
  
  // Guardar en buffer si no fue cancelado
  if (!abortController.signal.aborted && !deepgramData.isProcessing) {
    deepgramData.pendingAIResponse = aiResponse;
  }
}
```

### **3. Modificar `onTranscriptionUpdated`:**

```javascript
onTranscriptionUpdated: (interim, message) => {
  // ... código existente ...
  
  // 🚀 BUFFER INTELIGENTE: Procesar si:
  // - Tiene al menos 3 palabras
  // - Han pasado 400ms desde última procesada
  // - No hay respuesta pendiente
  // - No está procesando transcripción finalizada
  const words = interim.trim().split(/\s+/);
  if (words.length >= 3 && 
      (now - lastInterimProcessedAt) >= 400 &&
      !deepgramData.pendingAIResponse &&
      !deepgramData.isProcessing) {
    
    // Cancelar request anterior
    if (deepgramData.pendingAIRequest) {
      deepgramData.pendingAIRequest.abort();
    }
    
    // Procesar en paralelo
    const controller = new AbortController();
    deepgramData.pendingAIRequest = controller;
    processInterimTranscript(interim, ...).catch(...);
  }
}
```

### **4. Modificar `onUtteranceFinalized`:**

```javascript
onUtteranceFinalized: (transcript, message) => {
  // ... código existente ...
  
  // 🚀 BUFFER INTELIGENTE: Usar respuesta anticipada si está disponible
  let aiResponse = null;
  
  if (deepgramData.pendingAIResponse) {
    // ✅ Latencia cero: usar respuesta del buffer
    aiResponse = deepgramData.pendingAIResponse;
    deepgramData.pendingAIResponse = null;
  } else {
    // Procesar normalmente si no hay respuesta anticipada
    aiResponse = await voiceServices.ai.processMessage(transcript, context);
  }
  
  // Generar TTS y enviar...
}
```

---

## ⚡ FLUJO COMPLETO

```
1. Usuario empieza a hablar
   ↓
2. Deepgram envía transcripciones interim: "Hola, quiero..."
   ↓
3. Buffer inteligente detecta: 3+ palabras, 400ms desde última
   ↓
4. Procesa con IA en paralelo (sin bloquear)
   ↓
5. Usuario continúa hablando: "...una reserva para..."
   ↓
6. Nueva transcripción interim → Cancela request anterior, procesa nueva
   ↓
7. Usuario termina de hablar → Deepgram finaliza transcripción
   ↓
8. ✅ Usar respuesta del buffer (si está lista) → Latencia cero
   ↓
9. Generar TTS y enviar respuesta inmediatamente
```

---

## ✅ BENEFICIOS

1. **Latencia cero:** Respuesta ya está lista cuando usuario termina
2. **Natural:** Sin vacíos entre turnos de conversación
3. **Inteligente:** Cancela respuestas obsoletas si usuario continúa hablando
4. **Eficiente:** Solo procesa cuando tiene suficiente contexto (3+ palabras)

---

## 🔧 PARÁMETROS CONFIGURABLES

- **Umbral de palabras:** 3 palabras mínimo (ajustable)
- **Throttle:** 400ms entre procesamientos (ajustable)
- **Condiciones:** Solo procesa si no hay respuesta pendiente y no está procesando finalizada

---

**Este sistema reduce la latencia percibida a casi cero, haciendo la conversación súper natural y fluida.**
