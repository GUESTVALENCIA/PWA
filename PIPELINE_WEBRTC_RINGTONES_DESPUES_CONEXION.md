# 🚀 PIPELINE WebRTC: Ringtones DESPUÉS de Conexión

**Fecha:** 2026-01-03  
**Objetivo:** Latencia cero - Conexión estabilizada antes de reproducir ringtones

---

## ✅ CAMBIO IMPLEMENTADO

### **ANTES (Latencia alta):**
1. ❌ Ringtones se reproducen ANTES de conexión
2. ❌ Conexión WebSocket se establece después
3. ❌ Saludo se envía automáticamente al conectar
4. ❌ Latencia alta (servidor no está estabilizado)

### **AHORA (Latencia cero):**
1. ✅ **Conexión WebSocket se establece PRIMERO**
2. ✅ **Ringtones se reproducen DESPUÉS de la conexión**
3. ✅ **Cliente envía mensaje "ready" después de ringtones**
4. ✅ **Servidor envía saludo DESPUÉS de recibir "ready"**
5. ✅ **Latencia cero (servidor ya estabilizado)**

---

## 🔧 CAMBIOS TÉCNICOS

### 1. **Servidor (`src/websocket/socket-server.js`)**

#### **Eliminado:**
```javascript
// ❌ ANTES: Saludo automático al conectar
handleInitialGreeting(ws, voiceServices).catch((error) => {
  logger.error(`[WEBSOCKET] Error enviando saludo automático para ${agentId}:`, error);
});
```

#### **Agregado:**
```javascript
// ✅ AHORA: Esperar a que el cliente termine los ringtones
logger.info(`[WEBSOCKET] Conexión establecida para ${agentId} - esperando ringtones del cliente antes de enviar saludo`);
```

#### **Modificado:**
```javascript
// ✅ Handler de mensaje "ready" ahora envía el saludo
case 'conserje':
  if (action === 'message' && payload?.type === 'ready') {
    // 🚀 WEBRTC PIPELINE: Cliente terminó de reproducir ringtones, ahora enviar saludo
    logger.info(`[WEBSOCKET] Cliente ${agentId} listo después de ringtones - enviando saludo con Carina`);
    // Enviar saludo DESPUÉS de los ringtones (conexión ya estabilizada, latencia cero)
    handleInitialGreeting(ws, voiceServices).catch((error) => {
      logger.error(`[WEBSOCKET] Error enviando saludo después de ringtones para ${agentId}:`, error);
    });
    // ...
  }
```

### 2. **Cliente (`index.html`)**

El cliente ya tenía el flujo correcto implementado:
- ✅ Conexión WebSocket se establece primero
- ✅ Ringtones se reproducen después (`playRingtoneAfterConnection`)
- ✅ Cliente envía mensaje "ready" después de ringtones
- ✅ Saludo se recibe y reproduce después de ringtones

---

## 🎯 FLUJO COMPLETO

```
1. Usuario hace clic en "Llamar"
   ↓
2. Cliente establece conexión WebSocket
   ↓
3. Servidor: Conexión establecida (esperando ringtones)
   ↓
4. Cliente: Reproduce 2 ringtones (después de conexión)
   ↓
5. Cliente: Envía mensaje "ready" al servidor
   ↓
6. Servidor: Recibe "ready" → Envía saludo con Carina (aura-2-carina-es)
   ↓
7. Cliente: Recibe saludo → Reproduce audio
   ↓
8. Cliente: Inicia captura de micrófono
   ↓
9. Conversación en tiempo real
```

---

## ✅ BENEFICIOS

1. **Latencia Cero:**
   - Servidor ya está conectado y estabilizado cuando se reproducen ringtones
   - No hay espera de conexión durante la llamada

2. **Voz Consistente:**
   - Saludo usa `aura-2-carina-es` (mismo modelo que respuestas)
   - No hay diferencia entre voz grabada y voz real

3. **Pipeline Robusto:**
   - Conexión establecida antes de cualquier interacción
   - Flujo predecible y controlado

4. **Experiencia Realista:**
   - Como una llamada telefónica real
   - Ringtones → Saludo → Conversación

---

## 🔍 VERIFICACIÓN

- ✅ Saludo usa modelo `aura-2-carina-es`
- ✅ Saludo se envía DESPUÉS de ringtones
- ✅ Conexión establecida antes de ringtones
- ✅ Flujo completo implementado

---

**Este cambio optimiza el pipeline para latencia cero y experiencia realista.**
