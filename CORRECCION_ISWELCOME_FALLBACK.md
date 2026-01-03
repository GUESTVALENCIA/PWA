# 🔧 CORRECCIÓN: Eliminado Fallback de `isWelcome`

**Fecha:** 2026-01-03  
**Problema:** Múltiples audios marcados incorrectamente como `isWelcome: true`

---

## ⚠️ PROBLEMA

### **Lógica problemática (ANTES):**
```javascript
const isWelcome = data.isWelcome || data.payload?.isWelcome || (!this.currentAudio && !this.isSpeaking);
```

**Problema:**
- El fallback `(!this.currentAudio && !this.isSpeaking)` marcaba incorrectamente respuestas como saludos
- Causaba que la primera respuesta después del saludo se marcara como `isWelcome: true`
- Esto generaba múltiples "saludos" cuando solo debería haber UNO

---

## ✅ SOLUCIÓN

### **Lógica corregida (AHORA):**
```javascript
// ✅ SOLO usar isWelcome explícito del servidor (no fallbacks)
const isWelcome = data.payload?.isWelcome === true;
```

**Beneficios:**
- Solo el servidor controla qué es un saludo (`isWelcome: true`)
- No hay fallbacks que causen falsos positivos
- Un solo saludo al inicio (el que envía `handleInitialGreeting`)

---

## 📋 CAMBIOS APLICADOS

### **Archivo:** `index.html`

1. **Línea ~1901:**
   ```javascript
   // ❌ ANTES:
   const isWelcome = data.isWelcome || data.payload?.isWelcome || (!this.currentAudio && !this.isSpeaking);
   
   // ✅ AHORA:
   const isWelcome = data.payload?.isWelcome === true;
   ```

2. **Línea ~1970:**
   ```javascript
   // ❌ ANTES:
   const isWelcome = data.payload.isWelcome || (!this.currentAudio && !this.isSpeaking);
   
   // ✅ AHORA:
   const isWelcome = data.payload.isWelcome === true;
   ```

---

## 🎯 RESULTADO ESPERADO

1. **Solo UN saludo:**
   - El servidor envía `isWelcome: true` solo en `handleInitialGreeting`
   - El cliente solo marca como saludo lo que el servidor explícitamente marca

2. **Respuestas correctas:**
   - Las respuestas conversacionales NO se marcan como `isWelcome: true`
   - Solo tienen `isWelcome: false` o no tienen la propiedad

---

**Este cambio elimina las voces duplicadas causadas por el fallback incorrecto.**
