#  Mejoras de Sincronización Audio-Video y Conexión MCP

##  Cambios Implementados

### 1. Conexión al MCP en Producción

**Problema resuelto:** El widget ahora garantiza que en producción NUNCA intente conectarse a un WebSocket local, sino que siempre use el servidor MCP oficial.

**Implementación:**
-  Validación adicional: Si `MCP_SERVER_URL` contiene `localhost` en producción, se usa un servidor MCP por defecto
-  Conversión automática HTTP/HTTPS a WS/WSS con puerto 4042
-  Soporte para token de autenticación opcional (`MCP_TOKEN`)
-  Logs detallados para debugging de conexiones

**Código clave:**
```javascript
// Validar que no sea localhost (seguridad adicional)
if (mcpServerUrl.includes('localhost') || mcpServerUrl.includes('127.0.0.1')) {
  console.error(' [MCP] ERROR: Intentando usar localhost en producción. Usando servidor MCP por defecto.');
  var validatedMcpUrl = 'https://mcp.sandra-ia.com';
} else {
  var validatedMcpUrl = mcpServerUrl;
}
```

### 2. Carga Completa del Audio

**Problema resuelto:** El audio del saludo ahora se reproduce completamente sin cortes gracias al evento `canplaythrough`.

**Implementación:**
-  Uso del evento `canplaythrough` que se dispara cuando el navegador puede reproducir el audio sin interrupciones
-  Verificación del estado del audio (readyState, buffered, seekable) antes de reproducir
-  Fallback de seguridad si `canplaythrough` no se dispara en 5 segundos
-  Timeout de seguridad de 8 segundos como último recurso

**Código clave:**
```javascript
// CRÍTICO: Usar evento canplaythrough para asegurar carga completa
const onCanPlayThrough = () => {
  console.log(' [CLIENTE] Evento canplaythrough disparado - Audio completamente cargado');
  // Reproducir audio solo cuando está completamente listo
  audio.play();
};

audio.addEventListener('canplaythrough', onCanPlayThrough);
```

### 3. Sincronización con el Video del Hero

**Problema resuelto:** El inicio del video del hero ahora está perfectamente sincronizado con el saludo de audio de Sandra.

**Implementación:**
-  El video del hero se inicia JUSTO cuando el saludo de audio está listo para reproducirse
-  Transición más rápida (500ms en lugar de 800ms) para mejor sincronización
-  El video NO se reproduce automáticamente al iniciar la llamada, sino que espera al saludo
-  `currentTime = 0` garantizado antes de reproducir el video

**Flujo de sincronización:**
1. Usuario inicia llamada conversacional
2. `startVideoStream()` prepara el video pero NO lo reproduce
3. Cuando el servidor envía el saludo de audio, se activa `playAudioResponse()`
4. Cuando `canplaythrough` se dispara, se llama a `transitionHeroToVideo()`
5. El video inicia con `currentTime = 0` y fade-in rápido
6. El audio se reproduce inmediatamente después

**Código clave:**
```javascript
// SINCRONIZAR VIDEO CON AUDIO: Iniciar video del hero justo antes del audio
if (!videoStarted) {
  videoStarted = true;
  this.transitionHeroToVideo();
  console.log(' [SYNC] Video del hero iniciado en sincronización con el saludo de audio');
}

// Luego reproducir audio
audio.play();
```

### 4. Optimizaciones Adicionales

-  Reducción de delays de transición (500ms en lugar de 800ms)
-  Mejor manejo de errores con fallbacks múltiples
-  Logs detallados para debugging de sincronización
-  Verificación de `currentTime = 0` antes de reproducir

##  Pruebas Recomendadas en Producción

### Prueba 1: Conexión MCP
1. Abrir la consola del navegador en producción
2. Buscar el mensaje: ` [MCP] Configuración de producción:`
3. Verificar que `wsUrl` NO sea `ws://localhost:4041`
4. Verificar que `wsUrl` apunte al servidor MCP (ej: `wss://mcp.sandra-ia.com:4042`)

### Prueba 2: Carga Completa del Audio
1. Iniciar una llamada conversacional
2. En la consola, buscar: ` [CLIENTE] Evento canplaythrough disparado`
3. Verificar que el audio se reproduce desde el inicio sin cortes
4. Verificar que no hay mensajes de error relacionados con `currentTime`

### Prueba 3: Sincronización Video-Audio
1. Iniciar una llamada conversacional
2. Observar que la transición de imagen a video ocurre JUSTO cuando comienza el saludo
3. Verificar que el video y el audio están sincronizados
4. En la consola, buscar: ` [SYNC] Video del hero iniciado en sincronización con el saludo de audio`

### Prueba 4: Transcripción de Audio
1. Hablar durante la llamada conversacional
2. Verificar que la transcripción funciona correctamente
3. Verificar que Sandra responde con audio correctamente
4. Verificar que el video responde al tiempo esperado

##  Métricas de Rendimiento

**Latencia medida:**
- Tiempo desde descuelgue hasta inicio del saludo: Se registra en consola
- El código mide automáticamente: `⏱ [LATENCIA] Tiempo desde descuelgue hasta inicio del saludo: XXXms`

**Logs útiles para debugging:**
- ` [MCP] Configuración de producción:` - Verifica conexión MCP
- ` [CLIENTE] Evento canplaythrough disparado` - Confirma carga completa del audio
- ` [SYNC] Video del hero iniciado` - Confirma sincronización
- `⏱ [LATENCIA]` - Mide tiempo de respuesta

##  Configuración Requerida

Para que todo funcione correctamente en producción, asegúrate de:

1. **Configurar `MCP_SERVER_URL` en Vercel:**
   - Dashboard > Settings > Environment Variables
   - Nombre: `MCP_SERVER_URL`
   - Valor: `https://tu-servidor-mcp.com`
   - Ambiente: Production

2. **Verificar que el servidor MCP esté desplegado y accesible:**
   - El servidor debe estar en puerto 4042 para WebSocket
   - Debe aceptar conexiones WSS (WebSocket seguro)
   - Debe responder al formato MCP `{route, action, payload}`

##  Referencias

- `CONFIGURACION_MCP_PRODUCCION.md` - Configuración completa del servidor MCP
- `mcp-server/README.md` - Documentación del servidor MCP
- `SANDRA_WIDGET_COMPLETO.md` - Documentación completa del widget

