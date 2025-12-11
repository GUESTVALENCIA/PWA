# ✅ SOLUCIÓN: ERROR DE CONEXIÓN WEBSOCKET

## 🔍 PROBLEMA IDENTIFICADO

El widget intenta conectarse a `wss://mcp.sandra-ia.com:4042` pero debería conectarse a `wss://pwa-imbf.onrender.com:4042`.

## 🔧 CAMBIOS APLICADOS

### 1. ✅ `index.html` - Fallback actualizado
- **Antes:** `'https://mcp.sandra-ia.com'`
- **Ahora:** `'https://pwa-imbf.onrender.com'`

### 2. ✅ `api/config.js` - Default actualizado
- **Antes:** `'https://mcp.sandra-ia.com'`
- **Ahora:** `'https://pwa-imbf.onrender.com'`

## 📋 VERIFICACIÓN REQUERIDA

### 1. Variable de Entorno en Vercel

**IMPORTANTE:** Asegúrate de que `MCP_SERVER_URL` esté configurada en Vercel:

1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto
3. **Settings → Environment Variables**
4. Verifica que existe:
   - **Key:** `MCP_SERVER_URL`
   - **Value:** `https://pwa-imbf.onrender.com`
   - **Environment:** Production

### 2. Nuevo Deploy

**Después de hacer commit y push, haz un nuevo deploy:**

1. El deploy automático debería iniciarse
2. O haz un Manual Deploy desde Vercel Dashboard

### 3. Verificación Post-Deploy

Abre la consola del navegador en producción y verifica:

```javascript
// Deberías ver:
✅ [MCP] Configuración cargada desde API: {
  MCP_SERVER_URL: "https://pwa-imbf.onrender.com",
  hasToken: false
}

🔌 [MCP] Configuración de producción: {
  mcpServerUrl: "https://pwa-imbf.onrender.com",
  wsUrl: "wss://pwa-imbf.onrender.com:4042",
  useMCPFormat: true,
  isLocalhost: false
}
```

**NO deberías ver:**
```
❌ Error de conexión WebSocket en wss://mcp.sandra-ia.com:4042
```

## 🎯 FLUJO DE CONEXIÓN CORRECTO

```
1. Usuario carga página
   ↓
2. Fetch /api/config desde Vercel
   ↓
3. Obtiene MCP_SERVER_URL desde process.env o default
   ↓
4. window.MCP_SERVER_URL = "https://pwa-imbf.onrender.com"
   ↓
5. SandraGateway construye: wss://pwa-imbf.onrender.com:4042
   ↓
6. WebSocket conecta a Render
   ↓
7. ✅ Conexión exitosa
```

## ⚠️ NOTAS IMPORTANTES

1. **Si la variable MCP_SERVER_URL NO está en Vercel:**
   - El código usará el default: `https://pwa-imbf.onrender.com` ✅
   - Esto debería funcionar

2. **Si sigue fallando:**
   - Verifica que Render está activo: `curl https://pwa-imbf.onrender.com/health`
   - Verifica los logs de Render
   - Verifica CORS en Render (ALLOWED_ORIGINS debe incluir `*` o la URL de Vercel)

3. **Render debe aceptar conexiones WebSocket:**
   - Verifica que el servidor MCP en Render está corriendo en puerto 4042
   - Verifica que Render permite conexiones WebSocket (wss://)

## ✅ CHECKLIST

- [x] Código actualizado (fallback a Render)
- [ ] Variable `MCP_SERVER_URL` configurada en Vercel (verificar)
- [ ] Nuevo deploy realizado
- [ ] Widget verificado en producción
- [ ] WebSocket conectando correctamente

---

**Última actualización:** 10 de Diciembre, 2025

