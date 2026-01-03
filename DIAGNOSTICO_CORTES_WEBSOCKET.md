# 🔍 DIAGNÓSTICO: Cortes en Conexión WebSocket

## Problema Crítico
Los cortes en la conexión WebSocket hacen que el sistema piense que es una nueva llamada, causando que el AI vuelva a saludar. Esto hace que la llamada no sea seria, robusta ni profesional.

## Estado Actual del Keepalive

### Implementación Actual
- ✅ Keepalive implementado en `src/services/voice-services.js`
- ✅ Intervalo: 10 segundos (10000ms)
- ✅ Envía chunks de silencio de 100ms para mantener conexión activa
- ✅ Se activa cuando la conexión está abierta

### Código del Keepalive
```javascript
// Enviar chunk de silencio cada 10 segundos
keepAliveTimer = setInterval(() => {
  sendKeepAlive();
}, keepAliveInterval);

// Genera 100ms de silencio (PCM 16-bit, mono, 48kHz)
const silenceBuffer = Buffer.alloc(samples * 2);
connection.send(silenceBuffer);
```

## Posibles Causas de Cortes

### 1. Keepalive Insuficiente
- **Problema:** 10 segundos puede ser demasiado tiempo
- **Solución:** Reducir intervalo a 5-7 segundos
- **Riesgo:** Más tráfico, pero más estabilidad

### 2. Timeout del Servidor/Proxy
- **Problema:** Render o proxy puede tener timeout más corto
- **Solución:** Verificar timeouts de Render
- **Nota:** Render en plan gratuito puede tener limitaciones

### 3. Falta de Audio Real
- **Problema:** Si no hay audio real, el keepalive puede no ser suficiente
- **Solución:** Asegurar que siempre haya audio o keepalive más frecuente

### 4. WebSocket Idle Timeout
- **Problema:** Deepgram puede cerrar conexión si no hay actividad
- **Solución:** Verificar configuración de `idleTimeoutMs` (actualmente 600ms)

### 5. Problemas de Red
- **Problema:** Latencia alta o pérdida de paquetes
- **Solución:** Implementar reconexión automática
- **Nota:** Necesitamos detectar cortes y reconectar sin perder estado

## Soluciones Propuestas

### 1. Mejorar Keepalive
- Reducir intervalo a 5-7 segundos
- Aumentar duración del chunk de silencio a 200ms
- Verificar que se envíe correctamente

### 2. Detección de Cortes
- Implementar `ping/pong` en WebSocket
- Detectar desconexiones inesperadas
- Mantener estado de conversación durante reconexión

### 3. Reconexión Automática
- Si se detecta corte, reconectar automáticamente
- NO resetear `greetingSent` durante reconexión
- Mantener `deepgramConnections` durante cortes temporales

### 4. Configuración de Audio Mono
- El usuario menciona que WebRTC Realtime OpenAI usa mono
- Mono reduce impurezas y mejora calidad
- Verificar configuración de audio en cliente

## Próximos Pasos

1. ✅ Revertir cambios de velocidad/volumen (completado)
2. ⏳ Reducir intervalo de keepalive a 5-7 segundos
3. ⏳ Implementar detección de cortes
4. ⏳ Implementar reconexión automática sin resetear estado
5. ⏳ Investigar configuración de audio mono

## Notas
- Los cortes son el problema más crítico
- Cada corte hace que el AI vuelva a saludar
- Necesitamos robustez tipo WebRTC Realtime OpenAI
