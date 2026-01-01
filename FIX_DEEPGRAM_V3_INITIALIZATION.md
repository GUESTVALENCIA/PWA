# ✅ FIX: Deepgram SDK v3 Initialization

## 🔍 Error

```
DeepgramVersionError: You are attempting to use an old format for a newer SDK version.
```

## 🎯 Causa

El SDK de Deepgram v3 cambió el formato de inicialización. Ahora requiere un objeto con `{ apiKey: ... }` en lugar de pasar directamente el string de la API key.

## ✅ Solución Aplicada

**Archivo:** `src/services/voice-services.js`

**ANTES (Formato v2 - Incorrecto):**
```javascript
this.deepgram = new Deepgram(this.deepgramApiKey);
```

**DESPUÉS (Formato v3 - Correcto):**
```javascript
this.deepgram = new Deepgram({ apiKey: this.deepgramApiKey });
```

## 📝 Nota

Esta es la misma inicialización que se usa en `api/websocket/stream-server-v2.js` línea 244, que ya estaba correcta.

## 🚀 Estado

- ✅ Inicialización corregida para SDK v3
- ✅ Compatible con @deepgram/sdk@^3.13.0

---

**Fecha:** 2026-01-01
**Status:** ✅ Fix aplicado
