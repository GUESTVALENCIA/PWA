# ✅ CHECKLIST DE PRUEBAS - GuestsValencia.es

## 🔍 VERIFICACIÓN PRE-DEPLOY

### ✅ Archivos Críticos
- [x] `index.html` - Widget Galaxy cargado
- [x] `assets/js/galaxy/WIDGET_INYECTABLE.js` - Widget único y limpio
- [x] `assets/js/websocket-stream-client.js` - Cliente WebSocket con audio
- [x] `api/config.js` - Endpoint de configuración
- [x] `vercel.json` - Configuración limpia

### ✅ Lógica de Llamada
- [x] Widget Galaxy tiene `startCall()` integrado
- [x] Usa `window.websocketStreamClient`
- [x] Tiene `endCall()` con `disconnect()`
- [x] WebSocket client maneja `route: 'audio'`
- [x] Función `playBase64Audio()` implementada
- [x] Función `handleAudioResponse()` implementada

---

## 🧪 PRUEBAS EN PRODUCCIÓN (guestsvalencia.es)

### 1. Verificar Carga del Widget
- [ ] Abrir https://guestsvalencia.es
- [ ] Verificar que el botón flotante del widget aparece (esquina inferior derecha)
- [ ] Abrir DevTools (F12) → Console
- [ ] Verificar mensaje: `SandraWidget inicializado correctamente (instancia única)`
- [ ] Verificar que NO hay errores de carga de scripts

### 2. Verificar Configuración WebSocket
- [ ] En Console, verificar:
  ```javascript
  [MCP] Configuración cargada desde API: {
    MCP_SERVER_URL: "https://pwa-imbf.onrender.com",
    hasToken: false
  }
  ```
- [ ] Verificar conexión:
  ```javascript
  [WEBSOCKET-CLIENT] ✅ Conectado al servidor WebSocket
  ```
- [ ] Verificar URL correcta: `wss://pwa-imbf.onrender.com` (NO vercel.app)

### 3. Probar Chat de Texto
- [ ] Hacer clic en el botón del widget para abrir chat
- [ ] Escribir un mensaje de prueba
- [ ] Enviar mensaje
- [ ] Verificar que Sandra responde correctamente
- [ ] Verificar que el mensaje aparece en el chat

### 4. Probar Llamada Conversacional
- [ ] Hacer clic en el botón de llamada (verde) en el chat
- [ ] Verificar que el botón cambia a rojo (colgar)
- [ ] Verificar en Console:
  ```javascript
  [CALLFLOW] Iniciando llamada conversacional con WebSocket Enterprise Stream...
  [CALLFLOW] ✅ WebSocket conectado, iniciando grabación...
  [CALLFLOW] 📤 Enviando mensaje "ready" al servidor...
  ```
- [ ] Verificar que se solicita permiso del micrófono
- [ ] Permitir acceso al micrófono
- [ ] Verificar que se recibe audio de bienvenida:
  ```javascript
  [WEBSOCKET-CLIENT] 🎵 Recibido audio del servidor
  [WEBSOCKET-CLIENT] ✅ Audio reproduciéndose
  ```

### 5. Probar Audio Bidireccional
- [ ] Hablar al micrófono después del saludo
- [ ] Verificar que el audio se envía:
  ```javascript
  [WEBSOCKET-CLIENT] ✅ Audio enviado al servidor (MCP format)
  ```
- [ ] Verificar que se recibe transcripción:
  ```javascript
  [WEBSOCKET-CLIENT] 📝 Transcripción: [tu mensaje]
  ```
- [ ] Verificar que se recibe respuesta de audio:
  ```javascript
  [WEBSOCKET-CLIENT] 🎵 Recibido audio del servidor
  [WEBSOCKET-CLIENT] ✅ Audio reproduciéndose
  ```

### 6. Probar Cierre de Llamada
- [ ] Hacer clic en el botón rojo (colgar)
- [ ] Verificar que se cierra correctamente:
  ```javascript
  [CALLFLOW] Finalizando llamada (razón: user_hangup)...
  [CALLFLOW] Cerrando WebSocket Enterprise Stream...
  [CALLFLOW] ✅ WebSocket cerrado correctamente
  ```
- [ ] Verificar que el botón vuelve a verde
- [ ] Verificar que el chat se desbloquea

### 7. Verificar Sin Errores
- [ ] Revisar Console por errores rojos
- [ ] Verificar Network tab - no hay 404s
- [ ] Verificar que NO hay intentos de conexión a vercel.app
- [ ] Verificar que todas las conexiones van a `pwa-imbf.onrender.com`

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Widget no aparece
- Verificar que `WIDGET_ENABLED` no está en `false`
- Verificar que el script se carga: Network tab → `WIDGET_INYECTABLE.js`

### WebSocket no conecta
- Verificar `/api/config` retorna `MCP_SERVER_URL` correcto
- Verificar que Render está activo: https://pwa-imbf.onrender.com/health
- Verificar CORS en Render

### Audio no se reproduce
- Verificar permisos del micrófono
- Verificar que `playBase64Audio()` se llama
- Verificar que el audio base64 no está vacío
- Revisar Console por errores de Audio API

### Llamada no cierra
- Verificar que `disconnect()` se llama
- Verificar que todos los timers se limpian
- Verificar que `isCallActive` se pone en `false`

---

## ✅ CRITERIOS DE ÉXITO

- ✅ Widget se carga sin errores
- ✅ Chat de texto funciona
- ✅ Botón de llamada inicia llamada
- ✅ Audio de bienvenida se reproduce
- ✅ Audio del usuario se envía
- ✅ Respuesta de audio se reproduce
- ✅ Llamada se cierra correctamente
- ✅ Sin errores en Console
- ✅ Sin conexiones a vercel.app

---

## 📝 NOTAS

- Dominio oficial: https://guestsvalencia.es
- Servidor MCP: https://pwa-imbf.onrender.com
- WebSocket: wss://pwa-imbf.onrender.com
- Widget único: Galaxy Widget en `assets/js/galaxy/WIDGET_INYECTABLE.js`

