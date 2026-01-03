# 🧹 PLAN DE LIMPIEZA COMPLETA - Pipeline Conversacional

**Fecha:** 2026-01-03  
**Modelo seleccionado:** `aura-2-celeste-es` (Colombiano - ⚠️ Confirmar si es correcto)

---

## 📋 CAMBIOS A REALIZAR

### 1. **ELIMINAR CARTESIA TTS COMPLETAMENTE** ✅
- Eliminar `_generateCartesiaTTS()` method
- Eliminar lógica de fallback a Cartesia en `generateVoice()`
- Eliminar `cartesiaApiKey` y `cartesiaVoiceId` del constructor
- Eliminar referencias a Cartesia en comentarios

### 2. **ELIMINAR WEBSOCKET TTS** ✅
- Eliminar `createTTSStreamingConnection()` method
- Eliminar `sendTextToTTS()` method
- Eliminar `flushTTS()` method
- Eliminar toda la lógica de streaming en `generateVoice()`
- Dejar SOLO REST API (más simple, estable)

### 3. **UNIFICAR MODELO A `aura-2-celeste-es`** ✅
- Cambiar default en `generateVoice()`: `aura-2-celeste-es`
- Cambiar default en `_generateDeepgramTTS()`: `aura-2-celeste-es`
- Cambiar en `handleInitialGreeting()`: `aura-2-celeste-es`
- Eliminar todos los otros defaults (agustina, diana, etc.)

### 4. **ELIMINAR AUDIO PRE-GRABADO** ✅
- Eliminar referencia a `useNative` option
- Eliminar código que carga `sandra-conversational.wav`
- Eliminar comentarios sobre audio nativo

### 5. **SIMPLIFICAR `generateVoice()`** ✅
- Eliminar `useNative` option
- Eliminar `streaming` option
- Eliminar `provider` option (solo Deepgram)
- Dejar solo: `text` y `model` (opcional, default `aura-2-celeste-es`)

### 6. **LIMPIAR COMENTARIOS OBSOLETOS** ✅
- Eliminar comentarios sobre WebSocket TTS
- Eliminar comentarios sobre Cartesia
- Eliminar comentarios sobre múltiples modelos
- Limpiar comentarios confusos

---

## 🎯 RESULTADO FINAL

### `generateVoice()` simplificado:
```javascript
async generateVoice(text, options = {}) {
  const model = options.model || 'aura-2-celeste-es';
  
  if (!text || text.trim() === '') {
    throw new Error('Text is required for TTS generation');
  }

  if (!this.deepgramApiKey) {
    throw new Error('Deepgram API key not configured. Set DEEPGRAM_API_KEY environment variable.');
  }

  // SOLO REST API - Simple y estable
  return await this._generateDeepgramTTS(text, model);
}
```

### Modelo único en TODO el sistema:
- Saludo inicial: `aura-2-celeste-es`
- Respuestas conversacionales: `aura-2-celeste-es`
- Sin fallbacks
- Sin cambios de voz

---

## ⚠️ NOTA IMPORTANTE

El modelo `aura-2-celeste-es` es **colombiano**, no peninsular. Si el usuario prefiere un modelo peninsular, cambiar a:
- `aura-2-agustina-es` (Peninsular)
- `aura-2-carina-es` (Peninsular)
- `aura-2-diana-es` (Peninsular)
