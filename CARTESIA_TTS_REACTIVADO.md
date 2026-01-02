# ✅ CARTESIA TTS REACTIVADO - Guía de Uso

## 🎯 RESUMEN

**Cartesia TTS ahora puede usarse INDEPENDIENTEMENTE de Deepgram:**

- ✅ **Deepgram** → Solo STT (transcripción de voz a texto)
- ✅ **Cartesia** → Solo TTS (texto a voz)
- ✅ **Son independientes** - no necesitas uno para usar el otro

---

## 🔧 CONFIGURACIÓN

### **Variables de Entorno Requeridas:**

```bash
# Para Cartesia TTS
CARTESIA_API_KEY=tu_api_key_aqui
CARTESIA_VOICE_ID=sandra  # O el ID de voz que prefieras

# Para Deepgram STT (opcional, solo si usas transcripción)
DEEPGRAM_API_KEY=tu_api_key_aqui
```

### **Configurar en Render/Vercel:**

1. **Render (MCP Server):**
   - Settings → Environment Variables
   - Agregar `CARTESIA_API_KEY` y `CARTESIA_VOICE_ID`

2. **Vercel (Frontend):**
   - Settings → Environment Variables
   - Agregar `CARTESIA_API_KEY` y `CARTESIA_VOICE_ID`

---

## 📋 ARQUITECTURA

### **Opción 1: Deepgram STT + Cartesia TTS**
```
Usuario habla → Deepgram STT → Texto
Texto → IA (GPT/Gemini) → Respuesta
Respuesta → Cartesia TTS → Audio
```

### **Opción 2: Solo Cartesia TTS (sin Deepgram)**
```
Texto → Cartesia TTS → Audio
```

---

## 💻 USO EN CÓDIGO

### **Opción 1: Usar Cartesia explícitamente**

```javascript
// En socket-server.js o donde generes TTS
const audioResult = await voiceServices.generateVoice(aiResponse, {
  provider: 'cartesia', // Forzar Cartesia
  streaming: false // Cartesia usa REST API (no streaming)
});
```

### **Opción 2: Auto-selección (recomendado)**

```javascript
// El sistema elegirá automáticamente:
// - Si hay Deepgram → intenta Deepgram primero
// - Si falla o no hay Deepgram → usa Cartesia
const audioResult = await voiceServices.generateVoice(aiResponse, {
  provider: 'auto', // Auto-selección inteligente
  streaming: false // Para REST API
});
```

### **Opción 3: Solo Cartesia (sin Deepgram)**

Si no tienes `DEEPGRAM_API_KEY` configurada, automáticamente usará Cartesia.

---

## 🎙️ VOCES DISPONIBLES EN CARTESIA

Cartesia soporta múltiples voces. Para ver todas las disponibles:

1. Ve a: https://cartesia.ai/
2. Dashboard → Voices
3. Selecciona la voz que quieras
4. Copia el `voice_id`

**Voz por defecto:** `sandra` (si tienes `CARTESIA_VOICE_ID=sandra`)

---

## ✅ VENTAJAS DE CARTESIA

1. **Independiente de Deepgram:**
   - No necesitas Deepgram para usar Cartesia
   - Funciona solo con `CARTESIA_API_KEY`

2. **Soporte Español:**
   - ✅ Soporta español nativo
   - ✅ Voces en español disponibles

3. **Sin limitaciones de modelos:**
   - No hay problemas de "modelo no disponible"
   - No hay errores 1008

4. **API REST simple:**
   - Más fácil de implementar que WebSocket
   - Menos puntos de fallo

---

## ⚠️ CONSIDERACIONES

### **Latencia:**
- **Cartesia REST:** ~200-400ms (similar a Deepgram REST)
- **Deepgram WebSocket:** ~100-200ms (más rápido, pero más complejo)

### **Formato:**
- **Cartesia:** MP3 (base64)
- **Deepgram WebSocket:** PCM (streaming)
- **Deepgram REST:** MP3 (base64)

### **Cuándo usar cada uno:**

**Usa Cartesia si:**
- ✅ No quieres depender de Deepgram para TTS
- ✅ Prefieres simplicidad (REST API)
- ✅ No necesitas streaming ultra-bajo latencia

**Usa Deepgram TTS si:**
- ✅ Ya tienes Deepgram configurado
- ✅ Necesitas streaming de muy baja latencia
- ✅ Quieres mantener todo en un solo proveedor

---

## 🚀 PRÓXIMOS PASOS

1. **Configurar variables de entorno:**
   ```bash
   CARTESIA_API_KEY=tu_api_key
   CARTESIA_VOICE_ID=sandra
   ```

2. **Probar en código:**
   ```javascript
   const result = await voiceServices.generateVoice("Hola, ¿cómo estás?", {
     provider: 'cartesia'
   });
   ```

3. **Verificar logs:**
   - Deberías ver: `[CARTESIA] ✅ Audio generated successfully`

---

## 📞 SOPORTE

Si tienes problemas:
1. Verifica que `CARTESIA_API_KEY` esté configurada
2. Verifica que `CARTESIA_VOICE_ID` sea válido
3. Revisa logs para ver errores específicos

---

**Última actualización:** 2026-01-02  
**Estado:** ✅ Cartesia TTS reactivado y funcional
