# 🎯 PLANTILLA DE AGENTE CALL CENTER - DEEPGRAM

## 📋 Resumen

Plantilla de configuración para agente de voz conversacional tipo Call Center basada en mejores prácticas de Deepgram y sistemas de atención al cliente.

**Ubicación:** `config/deepgram-agent-config.js`

---

## ✅ Configuraciones Incluidas

### 1. **Feedback de Duplicados** ✅
- Ventana de tiempo: 3 segundos
- Comparación exacta de transcripciones
- Bloqueo de eventos múltiples de Deepgram (`idle_timeout`, `Results`, `speech_final`)
- Permite transcripciones nuevas aunque haya una en proceso

### 2. **Modo Calmado (Calm Mode)** ✅
- `idleTimeoutMs: 600` - Balance óptimo (no muy corto, no muy largo)
- `smartFormat: true` - Reduce falsos positivos de "frase finalizada"
- `endpointing: 300` - Reduce eventos múltiples

### 3. **Configuración de Agente de Atención al Cliente** ✅
- Personalidad: `calm` (calmada, profesional)
- Estilo: `customer_service`
- Modelo TTS: `aura-2-agustina-es` (Peninsular - España)

---

## 🔧 Configuraciones Disponibles

### **Perfiles de Agente:**

1. **`customer_service`** (Por defecto)
   - Personalidad: Calmada
   - `idleTimeoutMs: 600ms`
   - Ideal para atención al cliente estándar

2. **`sales`** (Ventas)
   - Personalidad: Enérgica
   - `idleTimeoutMs: 400ms` (más rápido)
   - Ideal para ventas y captación

3. **`support`** (Soporte técnico)
   - Personalidad: Profesional
   - `idleTimeoutMs: 800ms` (más tiempo para explicaciones)
   - Ideal para soporte técnico detallado

---

## 📊 Configuración STT (Speech-to-Text)

```javascript
{
  model: 'nova-2',              // Mejor balance calidad/latencia
  encoding: 'linear16',
  sampleRate: 48000,
  channels: 1,
  idleTimeoutMs: 600,          // Balance óptimo para call center
  language: 'es',
  smartFormat: true,            // Modo calmado
  punctuate: true,              // Mejor calidad
  diarize: false,               // Solo un hablante (cliente)
  vadEvents: true,              // Voice Activity Detection
  endpointing: 300              // Reduce eventos múltiples
}
```

---

## 🎙️ Configuración TTS (Text-to-Speech)

```javascript
{
  model: 'aura-2-agustina-es',  // Peninsular (España)
  encoding: 'linear16',
  sampleRate: 24000,            // Requerido por Deepgram
  container: 'none'             // Streaming sin contenedor
}
```

---

## 🔄 Manejo de Duplicados

### **Estrategia Implementada:**

1. **Check 1:** Transcripción vacía → Skip
2. **Check 2:** Ya procesando otra transcripción → Comparar si es exactamente igual
3. **Check 3:** Misma transcripción en ventana de 3 segundos → Skip (eventos múltiples)
4. **Check 3.5:** Ya procesando esta transcripción exacta → Skip
5. **Check 4:** Nueva transcripción es subconjunto de la que se procesa → Skip

### **Lógica de Permisos:**

- ✅ **Permite:** Transcripciones nuevas aunque haya una en proceso (usuario habló de nuevo)
- ❌ **Bloquea:** Transcripciones exactamente iguales dentro de 3 segundos
- ❌ **Bloquea:** Múltiples eventos de Deepgram para la misma transcripción

---

## 📝 Notas Importantes

### **Deepgram NO tiene configuración nativa de:**
- ❌ "Modo calmado" (se implementa con `idleTimeoutMs` y `smartFormat`)
- ❌ "Agente de atención al cliente" (se implementa en el prompt del LLM)
- ❌ "Feedback de duplicados" (se implementa en nuestro código)

### **Lo que SÍ tiene Deepgram:**
- ✅ `endpointing` - Reduce eventos múltiples
- ✅ `vadEvents` - Voice Activity Detection
- ✅ `smartFormat` - Mejora legibilidad
- ✅ `punctuate` - Mejor calidad de transcripción

---

## 🚀 Uso en el Código

### **Actual (Implementado):**

```javascript
// En socket-server.js línea 716
const connection = voiceServices.deepgram.createStreamingConnection({
  language: 'es',
  encoding: 'linear16',
  sampleRate: 48000,
  channels: 1,
  idleTimeoutMs: 600, // ✅ Configuración de call center
  onTranscriptionFinalized: async (transcript, message) => {
    // ✅ Lógica de deduplicación implementada
  }
});
```

### **Futuro (Con plantilla):**

```javascript
import { createSTTOptions, getAgentConfig } from '../config/deepgram-agent-config.js';

const agentConfig = getAgentConfig('customer_service');
const connection = voiceServices.deepgram.createStreamingConnection(
  createSTTOptions(agentConfig.stt)
);
```

---

## 📚 Referencias

### **Deepgram Documentation:**
- [Live Transcription API](https://developers.deepgram.com/docs/live-transcription-api)
- [Voice Agent API](https://developers.deepgram.com/docs/voice-agent-api)
- [Best Practices](https://developers.deepgram.com/docs/best-practices)

### **Plantillas de Call Center:**
- Microsoft Copilot Studio (plantillas de agente de voz)
- Audara (agentes de IA para call center)
- Respond.io (plantillas preconfiguradas)

---

## ✅ Estado Actual

- ✅ Plantilla creada en `config/deepgram-agent-config.js`
- ✅ Configuración de duplicados implementada en `socket-server.js`
- ✅ Modelo peninsular configurado (`aura-2-agustina-es`)
- ⏳ Pendiente: Integrar plantilla en código (opcional, ya funciona bien)

---

**Última actualización:** 2026-01-02  
**Estado:** ✅ Plantilla lista, código funcionando con configuración manual
