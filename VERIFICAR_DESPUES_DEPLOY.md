#  VERIFICACIÓN POST-DEPLOY

##  DEPLOY COMPLETADO

El deploy en Vercel se completó exitosamente:
-  Build completado en 2s
-  Deployment completado
-  Build cache creado

##  QUÉ VERIFICAR AHORA

### 1. Abre la Producción
Ve a: https://guestsvalencia.es (o tu dominio de Vercel)

### 2. Abre DevTools
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña **Console**

### 3. Verifica la Configuración

Deberías ver en la consola:

```javascript
 [MCP] Configuración cargada desde API: {
  MCP_SERVER_URL: "https://pwa-imbf.onrender.com",
  hasToken: false
}
```

### 4. Inicia una Llamada

Haz click en "Aceptar llamada" o inicia una llamada desde el widget.

### 5. Verifica la Conexión WebSocket

**Deberías ver:**
```javascript
 [MCP] Configuración de producción: {
  mcpServerUrl: "https://pwa-imbf.onrender.com",
  wsUrl: "wss://pwa-imbf.onrender.com",  // ← Sin puerto (correcto para Render)
  useMCPFormat: true,
  isLocalhost: false
}

 Iniciando conexión WebSocket a wss://pwa-imbf.onrender.com...
 Nueva conexión WebSocket: client_...
```

**NO deberías ver:**
```
 Error: No se pudo conectar al servidor WebSocket
 Error de conexión WebSocket en wss://pwa-imbf.onrender.com:4042
```

##  SI TODO FUNCIONA

Deberías ver:
-  Mensaje de bienvenida de Sandra
-  Conexión WebSocket establecida
-  Sin errores en la consola
-  Llamada funcionando correctamente

##  SI AÚN HAY ERRORES

### Error: "No se pudo conectar"

1. **Verifica Render:**
   ```bash
   curl https://pwa-imbf.onrender.com/health
   ```
   Debería retornar: `{"status":"ok",...}`

2. **Verifica CORS en Render:**
   - Variable `ALLOWED_ORIGINS` debe incluir `*` o `guestsvalencia.es`

3. **Verifica WebSocket en Render:**
   - Render soporta WebSocket, pero verifica que el servidor esté corriendo

### Error: "Conexión cerrada inesperadamente"

1. **Verifica los logs de Render:**
   - Ve a Render Dashboard → Logs
   - Busca errores de WebSocket

2. **Verifica el formato del mensaje:**
   - El widget usa formato MCP: `{route, action, payload}`
   - El servidor debe estar esperando este formato

##  CHECKLIST

- [ ] Deploy completado 
- [ ] Widget visible en producción
- [ ] Console muestra configuración correcta
- [ ] WebSocket URL correcta (sin puerto)
- [ ] Llamada conecta correctamente
- [ ] Sin errores en consola
- [ ] Sandra responde correctamente

---

**Última actualización:** 10 de Diciembre, 2025 - 19:23

