# ✅ ELIMINACIÓN: Saludo Predeterminado

**Fecha:** 2026-01-03  
**Objetivo:** Sistema completamente natural - sin saludo escrito/predeterminado

---

## 🎯 CAMBIO PRINCIPAL

### **ANTES:**
- ❌ Se enviaba saludo predeterminado después de ringtones
- ❌ Texto fijo: "Hola, soy Sandra, tu asistente de Guests Valencia, ¿en qué puedo ayudarle hoy?"
- ❌ Saludo generado con TTS antes de que el usuario hable

### **AHORA:**
- ✅ **NO se envía saludo predeterminado**
- ✅ Después de ringtones: **1 segundo de silencio**
- ✅ Luego: El usuario habla y Sandra responde **naturalmente**
- ✅ Completamente real-time, latencia cero

---

## 🔧 CAMBIOS IMPLEMENTADOS

### 1. **Servidor (`src/websocket/socket-server.js`)**

#### **Eliminado:**
- ✅ Función `handleInitialGreeting` completamente eliminada
- ✅ Llamada a `handleInitialGreeting` en handler de "ready" eliminada

#### **Modificado:**
```javascript
// ✅ AHORA: Solo confirmar que el servidor está listo, NO enviar saludo
case 'conserje':
  if (action === 'message' && payload?.type === 'ready') {
    // 🚀 REAL-TIME PIPELINE: NO enviar saludo - esperar a que el usuario hable
    logger.info(`[WEBSOCKET] Cliente ${agentId} listo después de ringtones - esperando audio del usuario (sin saludo predeterminado)`);
    // Enviar confirmación de que el servidor está listo para recibir audio
    ws.send(JSON.stringify({
      route: 'conserje',
      action: 'message',
      payload: { type: 'ready_ack', message: 'Servidor listo para recibir audio' }
    }));
  }
```

### 2. **Cliente (`index.html`)**

#### **Modificado:**
```javascript
// ✅ AHORA: Después de ringtones, 1 segundo de silencio, luego iniciar micrófono
this.playRingtoneAfterConnection(() => {
  console.log('[MCP] 🔔 Ringtones completed - esperando 1 segundo de silencio antes de iniciar micrófono');
  this.waitingForRingtones = false;
  this.queuedGreeting = null; // Limpiar cualquier saludo que pudiera estar en cola
  
  // ✅ 1 segundo de silencio después de ringtones, luego iniciar micrófono
  setTimeout(() => {
    sttCapabilitiesTimeout = setTimeout(() => {
      if (this.sttAvailable === false) return;
      if (this.sttAvailable === null) this.sttAvailable = true;
      console.log('[MCP] 🎤 Iniciando captura de micrófono - listo para conversación natural');
      startMicrophoneCapture();
    }, 100); // Pequeño delay adicional para estabilización
  }, 1000); // 1 segundo de silencio después de ringtones
});
```

---

## 📋 FLUJO NUEVO

```
1. Usuario hace clic en "Llamar"
   ↓
2. Cliente establece conexión WebSocket
   ↓
3. Cliente reproduce 2 ringtones (después de conexión)
   ↓
4. Cliente envía mensaje "ready" al servidor
   ↓
5. Servidor: Confirma "ready_ack" (NO envía saludo)
   ↓
6. Cliente: Espera 1 segundo de silencio
   ↓
7. Cliente: Inicia captura de micrófono
   ↓
8. Usuario habla → STT → AI → TTS → Sandra responde naturalmente
   ↓
9. Conversación continua (real-time, latencia cero)
```

---

## ✅ BENEFICIOS

1. **Completamente Natural:**
   - No hay saludo escrito/predeterminado
   - Sandra responde solo cuando el usuario habla
   - Comportamiento real-time, como una llamada telefónica real

2. **Latencia Cero:**
   - Servidor ya está conectado cuando se reproducen ringtones
   - 1 segundo de silencio después de ringtones (tiempo para estabilización)
   - Luego respuesta inmediata cuando el usuario habla

3. **Experiencia Realista:**
   - Como una llamada telefónica real
   - Ringtones → Silencio → Usuario habla → Sandra responde

---

## 🎯 SYSTEM PROMPT

El system prompt ya está configurado correctamente:
```
Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.
```

Sandra sabe quién es sin necesidad de un saludo predeterminado.

---

**El sistema ahora es completamente natural, sin saludo escrito/predeterminado. La conversación comienza cuando el usuario habla.**
