# 🔍 DIAGNÓSTICO: ERROR WEBSOCKET EN RENDER

## ❌ PROBLEMA ACTUAL

El widget intenta conectar a `wss://pwa-imbf.onrender.com:4042` pero falla con:
- "Error: No se pudo conectar al servidor WebSocket"
- "Conexión cerrada inesperadamente"

## 🔍 CAUSA PROBABLE

Render maneja WebSocket de forma especial:
1. **No necesitas especificar el puerto** en la URL cuando estás detrás del proxy de Render
2. Render expone el servicio en `https://pwa-imbf.onrender.com` y maneja el routing internamente
3. El WebSocket debe conectarse a `wss://pwa-imbf.onrender.com` (sin puerto)

## ✅ SOLUCIÓN

### 1. Actualizar el código del widget para NO incluir el puerto en producción

Render maneja el routing automáticamente. El código debe:
- Detectar si está en Render (URL contiene `onrender.com`)
- NO añadir puerto `:4042` si es Render
- Usar solo `wss://pwa-imbf.onrender.com`

### 2. Verificar que el servidor esté escuchando correctamente

El servidor MCP está bien configurado, solo necesitamos ajustar la URL del cliente.

---

## 🔧 CAMBIO NECESARIO

En `index.html`, modificar la construcción de la URL WebSocket para Render:

```javascript
// Si es Render, NO añadir puerto
const isRender = validatedMcpUrl.includes('onrender.com');
if (!isRender && !mcpHost.includes(':')) {
  mcpHost = `${mcpHost}:4042`;
}
```

---

## 📋 VERIFICACIÓN POST-FIX

Después del cambio, la URL debería ser:
- ✅ `wss://pwa-imbf.onrender.com` (sin puerto)
- ❌ NO `wss://pwa-imbf.onrender.com:4042` (con puerto)

---

**Nota:** Render en el plan gratuito soporta WebSocket, pero requiere que no especifiques el puerto en la URL pública.

