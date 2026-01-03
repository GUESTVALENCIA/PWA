# 🔧 CORRECCIONES: Timeout y Deduplicación

**Fecha:** 2026-01-03  
**Problemas detectados en logs:** Timeout demasiado largo y transcripciones triplicadas

---

## ✅ CORRECCIÓN 1: Timeout de OpenAI

### **Problema:**
- Timeout de 30 segundos es demasiado largo para tiempo real
- Usuario espera 30 segundos antes de error
- Impacto negativo en experiencia de usuario

### **Solución:**
- ✅ Reducido timeout de **30s → 8s**
- ✅ Para conversación en tiempo real, 8 segundos es un balance adecuado
- ✅ Si OpenAI no responde en 8s, se cancela y se notifica error rápido

### **Cambios:**
```javascript
// ❌ ANTES:
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

// ✅ AHORA:
const timeout = setTimeout(() => controller.abort(), 8000); // 🚀 REAL-TIME: 8s timeout
```

---

## ⚠️ PROBLEMA 2: Transcripciones Triplicadas

### **Problema detectado en logs:**
```
"Sí, hoy necesito una habitación. Sí, hoy necesito una habitación. Sí, hoy necesito una habitación."
```

### **Causa:**
- Deepgram envía múltiples eventos (`idle_timeout`, `Results`, `speech_final`) para la misma transcripción
- La lógica de deduplicación existe pero no está capturando todas las variaciones
- El texto se está repitiendo dentro de la misma transcripción (no son eventos separados, es el mismo evento con texto repetido)

### **Análisis:**
Mirando los logs más de cerca:
- Deepgram está devolviendo el mismo texto repetido 3 veces en un solo evento
- Esto puede ser un problema del modelo de Deepgram o del audio de entrada
- NO es un problema de múltiples eventos, sino de un solo evento con texto duplicado

### **Solución requerida:**
1. ✅ Timeout reducido (YA HECHO)
2. ⏳ Verificar si el problema es del audio de entrada (eco/feedback)
3. ⏳ Verificar configuración de Deepgram (puede haber algún parámetro que cause esto)
4. ⏳ Agregar post-procesamiento para eliminar repeticiones dentro de la misma transcripción

---

## 📊 PROBLEMAS ADICIONALES EN LOGS

### **Respuestas duplicadas del AI:**
- Dos saludos diferentes:
  - "¡Hola! Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?" (61 chars)
  - "¡Hola! ¿En qué puedo ayudarte hoy?" (34 chars)
- **Causa:** Múltiples transcripciones procesándose simultáneamente
- **Solución:** La lógica de `isProcessing` debería prevenir esto, pero necesita refinamiento

### **No aparecen logs del nuevo flujo:**
- No se ven logs: "esperando ringtones del cliente antes de enviar saludo"
- **Posible causa:** Los logs mostrados son de ANTES del deploy del nuevo código
- **Acción:** Verificar que el nuevo código esté desplegado en Render

---

## 🎯 PRIORIDADES

1. ✅ **COMPLETADO:** Reducir timeout de OpenAI (30s → 8s)
2. ⏳ **PENDIENTE:** Investigar transcripciones triplicadas (puede ser problema de audio/eco)
3. ⏳ **PENDIENTE:** Mejorar lógica de prevención de procesamiento simultáneo
4. ⏳ **PENDIENTE:** Verificar deploy del nuevo flujo (ringtones después conexión)

---

**Nota:** El timeout ya está corregido. Las transcripciones triplicadas requieren más investigación para determinar si es problema del audio de entrada, configuración de Deepgram, o lógica de procesamiento.
