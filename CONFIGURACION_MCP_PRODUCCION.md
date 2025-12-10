# 🔧 Configuración del Widget para Servidor MCP en Producción

## ✅ Cambios Implementados

El widget ahora está configurado para usar el servidor MCP oficial en producción, en lugar de los servidores locales que solo funcionan en desarrollo.

### Cambios Realizados

1. **SandraGateway actualizado**:
   - Detecta automáticamente si está en desarrollo local o producción
   - En **desarrollo local**: Usa `ws://localhost:4041` con formato simple
   - En **producción**: Usa el servidor MCP configurado en `MCP_SERVER_URL` con formato MCP

2. **Formato de mensajes WebSocket**:
   - **Desarrollo local**: Formato simple `{type, audio/message}`
   - **Producción MCP**: Formato MCP `{route, action, payload}`

3. **URL WebSocket en producción**:
   - Se construye automáticamente desde `MCP_SERVER_URL`
   - Convierte HTTP/HTTPS a WS/WSS
   - Añade puerto `4042` automáticamente
   - Incluye token si está disponible en `window.MCP_TOKEN`

## 🔑 Configuración Requerida en Vercel

Para que el widget funcione correctamente en producción, necesitas configurar las siguientes variables de entorno en Vercel:

### Variables de Entorno Necesarias

1. **MCP_SERVER_URL** (Requerido)
   - URL base del servidor MCP desplegado
   - Ejemplo: `https://mcp.sandra-ia.com` o `https://tu-mcp-server.railway.app`
   - **Cómo configurar**:
     ```
     Vercel Dashboard > Tu Proyecto > Settings > Environment Variables
     Nombre: MCP_SERVER_URL
     Valor: https://tu-servidor-mcp.com
     Ambiente: Production (y Preview si lo deseas)
     ```

2. **MCP_TOKEN** (Opcional)
   - Token de autenticación para el servidor MCP
   - Solo necesario si tu servidor MCP requiere autenticación
   - Se añade automáticamente a la URL del WebSocket: `wss://server:4042?token=TU_TOKEN`

### Configuración desde Código (Alternativa)

Si prefieres configurarlo directamente en el código (no recomendado para tokens), puedes añadir antes de la inicialización del widget:

```javascript
// En index.html, antes de initSandraWidget()
window.MCP_SERVER_URL = 'https://tu-servidor-mcp.com';
window.MCP_TOKEN = 'tu-token-opcional'; // Solo si es necesario
```

## 📋 Formato de Mensajes MCP

### Mensajes Enviados al Servidor MCP

1. **Iniciar llamada (ready)**:
   ```json
   {
     "route": "conserje",
     "action": "message",
     "payload": {
       "type": "ready",
       "message": "Cliente completamente listo para recibir saludo"
     }
   }
   ```

2. **Enviar audio**:
   ```json
   {
     "route": "audio",
     "action": "stt",
     "payload": {
       "audio": "base64_audio_data...",
       "format": "webm",
       "mimeType": "audio/webm;codecs=opus"
     }
   }
   ```

### Mensajes Recibidos del Servidor MCP

El widget procesa automáticamente los mensajes MCP y los convierte al formato interno:

1. **Audio (TTS)**:
   ```json
   {
     "route": "audio",
     "action": "tts",
     "payload": {
       "audio": "base64_audio_data...",
       "isWelcome": false
     }
   }
   ```

2. **Texto/Mensaje**:
   ```json
   {
     "route": "conserje",
     "action": "message",
     "payload": {
       "text": "Respuesta de Sandra"
     }
   }
   ```

## 🧪 Verificación

1. **Verificar en consola del navegador**:
   - Abre la consola del navegador en producción
   - Busca el mensaje: `🔌 [MCP] Configuración de producción:`
   - Debe mostrar `wsUrl` apuntando al servidor MCP

2. **Verificar conexión WebSocket**:
   - En la consola, busca: `🔌 Iniciando conexión WebSocket a wss://...`
   - Debe conectarse correctamente al servidor MCP

3. **Probar llamada conversacional**:
   - Abre el widget
   - Haz clic en el botón de llamada
   - Verifica que se conecte al servidor MCP (no a localhost)

## 🔍 Debugging

Si el widget no se conecta correctamente:

1. **Verifica MCP_SERVER_URL**:
   ```javascript
   console.log(window.MCP_SERVER_URL); // Debe mostrar la URL del servidor MCP
   ```

2. **Verifica la URL WebSocket generada**:
   ```javascript
   const gateway = new SandraGateway();
   console.log(gateway.wsUrl); // Debe ser wss://tu-servidor-mcp.com:4042
   ```

3. **Verifica logs del servidor MCP**:
   - Revisa los logs del servidor MCP para ver si recibe las conexiones
   - Verifica que el puerto 4042 esté abierto y accesible

## 📚 Referencias

- Ver `mcp-server/README.md` para documentación completa del servidor MCP
- Ver `mcp-server/DEPLOY_PRODUCCION.md` para guía de deployment del servidor MCP

