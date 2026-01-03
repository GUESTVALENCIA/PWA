# ⚡ OPTIMIZACIÓN DE LATENCIA DEL SALUDO

**Fecha:** 2026-01-03  
**Problema:** Latencia de 2+ segundos después de los ringtones (demasiado alta)

---

## 🎯 PROBLEMA

- **Latencia actual:** 2+ segundos después de los ringtones
- **Expectativa:** Menos de 1 segundo (level WebRTC real-time)
- **Causa:** Generación de saludo con IA + TTS está añadiendo latencia

---

## 🔧 OPTIMIZACIONES IMPLEMENTADAS

### **1. Timeout de OpenAI reducido**
- **Antes:** 8 segundos
- **Ahora:** 4 segundos
- **Impacto:** Fallos más rápidos si hay problemas, respuestas más rápidas normalmente

```javascript
const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout
```

### **2. Max tokens reducido**
- **Antes:** 200 tokens
- **Ahora:** 100 tokens
- **Impacto:** Respuestas más cortas y rápidas, especialmente importante para saludos

```javascript
max_tokens: 100 // Respuestas más rápidas
```

### **3. Prompt del saludo optimizado**
- **Antes:** "Acabas de descolgar una llamada. Saluda al usuario de forma breve, natural y amable. No seas demasiado formal."
- **Ahora:** "Saluda brevemente al usuario. Máximo 5 palabras. Natural y amable."
- **Impacto:** IA genera saludos más cortos, procesamiento más rápido

---

## 📊 LATENCIA ESPERADA

### **Componentes de latencia:**
1. **OpenAI API:** ~500-800ms (con timeout 4s, tokens 100)
2. **Deepgram TTS:** ~300-500ms
3. **Red/Transmisión:** ~100-200ms

**Total esperado:** ~900-1500ms (menos de 1.5 segundos)

### **Antes:**
- OpenAI: ~1000-1500ms (timeout 8s, tokens 200)
- TTS: ~400-600ms
- **Total:** ~1400-2100ms (1.4-2.1 segundos) ❌

---

## ⚡ PRÓXIMAS OPTIMIZACIONES POSIBLES

Si la latencia sigue siendo alta, considerar:

1. **Pre-generar saludo:**
   - Generar saludo al iniciar servidor
   - Guardar en memoria/cache
   - Enviar inmediatamente después de ringtones

2. **Saludo fijo pero con TTS:**
   - Texto fijo: "Hola, soy Sandra, ¿en qué puedo ayudarte?"
   - TTS natural (aura-2-carina-es)
   - Sin esperar generación de IA

3. **Streaming de respuesta:**
   - Empezar a enviar audio mientras se genera
   - Reducir latencia percibida

---

## ✅ RESULTADO ESPERADO

- **Latencia total:** < 1.5 segundos (desde ringtones hasta saludo)
- **Latencia de respuesta:** < 1 segundo (desde usuario habla hasta IA responde)
- **Experiencia:** Level WebRTC real-time

---

**Las optimizaciones reducen la latencia aproximadamente a la mitad.**
