# ✅ DEEPGRAM TTS - Solo REST API (Text to Voice)

## 🎯 CONFIGURACIÓN ACTUAL

**Objetivo:** Usar solo Deepgram TTS (texto a voz) para gastar los $200 de crédito disponibles.

### **Modelo por Defecto:**
- ✅ `aura-2-celeste-es` (modelo encontrado en Playground)

### **Formato API:**
- ✅ **Endpoint:** `https://api.deepgram.com/v1/speak?model=aura-2-celeste-es`
- ✅ **Método:** POST
- ✅ **Headers:**
  - `Authorization: Token {API_KEY}`
  - `Content-Type: text/plain` (NO application/json)
- ✅ **Body:** Texto directamente (NO JSON)

---

## 🔧 CAMBIOS APLICADOS

### **1. Formato API Corregido:**
```javascript
// ❌ ANTES (incorrecto):
headers: { 'Content-Type': 'application/json' }
body: JSON.stringify({ text })

// ✅ AHORA (correcto según curl oficial):
headers: { 'Content-Type': 'text/plain' }
body: text  // Texto directamente
```

### **2. Modelo por Defecto:**
- ✅ Cambiado de `aura-2-agustina-es` → `aura-2-celeste-es`

### **3. Streaming Deshabilitado por Defecto:**
- ✅ `streaming: false` (usa REST API, más simple y confiable)
- ✅ Evita problemas de WebSocket (error 1008)

---

## 📋 USO

### **Automático (Recomendado):**
El sistema usará Deepgram TTS automáticamente:

```javascript
const audioResult = await voiceServices.generateVoice("Hola, ¿cómo estás?");
// Usa: model='aura-2-celeste-es', streaming=false, provider='deepgram'
```

### **Explícito:**
```javascript
const audioResult = await voiceServices.generateVoice("Hola, ¿cómo estás?", {
  model: 'aura-2-celeste-es',
  streaming: false, // REST API (más confiable)
  provider: 'deepgram'
});
```

---

## 🎙️ MODELOS DISPONIBLES

Según el Playground de Deepgram:

**Femeninas:**
- `aura-2-celeste-es` ⭐ (DEFAULT - Colombia)
- `aura-2-carina-es` (Peninsular)
- `aura-2-diana-es` (Peninsular)
- `aura-2-agustina-es` (Peninsular)
- `aura-2-silvia-es` (Peninsular)
- `aura-2-estrella-es` (México)

**Masculinas:**
- `aura-2-nestor-es` (Peninsular)
- `aura-2-alvaro-es` (Peninsular)

---

## ✅ VENTAJAS DE REST API

1. **Más Simple:**
   - No requiere WebSocket
   - Menos puntos de fallo
   - Más fácil de debuggear

2. **Más Confiable:**
   - No hay errores 1008 (Policy Violation)
   - No hay problemas de conexión WebSocket
   - Respuesta directa (MP3 base64)

3. **Gasta Crédito:**
   - ✅ Usa tus $200 de crédito de Deepgram
   - ✅ Pago por uso (caracteres procesados)

---

## 🔄 FLUJO ACTUAL

```
1. Usuario habla → Deepgram STT → Texto
2. Texto → IA (GPT/Gemini) → Respuesta
3. Respuesta → Deepgram TTS REST API → Audio MP3
4. Audio → Cliente
```

**Cartesia:** Mantenido en el sistema pero NO se usa (solo Deepgram ahora)

---

## 📊 CRÉDITO DEEPGRAM

- **Crédito disponible:** $199.46
- **Plan:** Pay As You Go
- **Uso:** Solo TTS (texto a voz)
- **Modelo:** `aura-2-celeste-es`

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Código actualizado con formato correcto
2. ✅ Modelo cambiado a `aura-2-celeste-es`
3. ✅ REST API configurada correctamente
4. ⏳ **Probar en producción** - Debería funcionar sin errores 1008

---

## 🐛 DEBUGGING

Si hay problemas, revisa logs:

```
[DEEPGRAM TTS] 🎙️ Requesting TTS: model=aura-2-celeste-es, text_length=XX
[DEEPGRAM TTS] ✅ Audio generated successfully (XXXX bytes, MP3)
```

Si ves errores:
- Verifica que `DEEPGRAM_API_KEY` esté configurada
- Verifica que el modelo `aura-2-celeste-es` esté disponible en tu plan
- Revisa el formato del request (debe ser `text/plain`, no JSON)

---

**Última actualización:** 2026-01-02  
**Estado:** ✅ Deepgram TTS REST API configurado correctamente
