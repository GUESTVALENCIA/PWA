#  CONFIGURAR CONEXIÓN DE PRODUCCIÓN: VERCEL → RENDER

##  SITUACIÓN ACTUAL

-  **Servidor MCP en Render:** `https://pwa-imbf.onrender.com:4042`
-  **Código preparado:** El widget ya carga `MCP_SERVER_URL` desde `/api/config`
-  **Falta:** Configurar variable de entorno en Vercel

---

##  CONFIGURACIÓN REQUERIDA EN VERCEL

### 1. Variable de Entorno: `MCP_SERVER_URL`

**Valor:**
```
https://pwa-imbf.onrender.com
```

**Notas:**
-  NO incluir el puerto `:4042` (el código lo añade automáticamente para WebSocket)
-  Usar `https://` (HTTPS)
-  El código automáticamente convierte a `wss://pwa-imbf.onrender.com:4042` para WebSocket

### 2. Variable de Entorno: `MCP_TOKEN` (Opcional)

Si el servidor MCP requiere autenticación, configurar:
```
MCP_TOKEN=tu_token_aqui
```

---

##  PASOS PARA CONFIGURAR EN VERCEL

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecciona el proyecto `GUESTVALENCIAPWA`

2. **Settings → Environment Variables:**
   - Click en "Settings"
   - Click en "Environment Variables"

3. **Agregar `MCP_SERVER_URL`:**
   - **Key:** `MCP_SERVER_URL`
   - **Value:** `https://pwa-imbf.onrender.com`
   - **Environments:**  Production,  Preview,  Development (o solo Production)
   - Click en "Save"

4. **Agregar `MCP_TOKEN` (si es necesario):**
   - **Key:** `MCP_TOKEN`
   - **Value:** (el token si está configurado en Render)
   - **Environments:**  Production
   - Click en "Save"

5. **Redeploy:**
   - Después de agregar las variables, haz un nuevo deploy
   - Ve a "Deployments"
   - Click en "Redeploy" del último deployment

---

##  VERIFICACIÓN

### 1. Verificar que la variable está cargada:

Abre la consola del navegador en producción y busca:
```
 [MCP] Configuración cargada desde API: {MCP_SERVER_URL: "https://pwa-imbf.onrender.com", hasToken: true/false}
```

### 2. Verificar la conexión WebSocket:

Al iniciar una llamada, deberías ver en la consola:
```
 [MCP] Configuración de producción: {
  mcpServerUrl: "https://pwa-imbf.onrender.com",
  wsUrl: "wss://pwa-imbf.onrender.com:4042",
  useMCPFormat: true,
  isLocalhost: false
}
```

### 3. Probar el endpoint de configuración:

```bash
curl https://guestsvalencia.es/api/config
```

Debería retornar:
```json
{
  "MCP_SERVER_URL": "https://pwa-imbf.onrender.com",
  "MCP_TOKEN": null
}
```

---

##  IMPORTANTE

1. **El código ya está preparado:**
   -  `api/config.js` expone `MCP_SERVER_URL` desde variables de entorno
   -  `index.html` carga la configuración desde `/api/config`
   -  `SandraGateway` usa `window.MCP_SERVER_URL` para construir la conexión WebSocket

2. **Después de configurar las variables:**
   -  **SIEMPRE hacer un nuevo deploy** en Vercel
   - Las variables de entorno solo se cargan en nuevos deployments

3. **URL WebSocket:**
   - El código automáticamente convierte `https://` → `wss://`
   - Añade el puerto `:4042` automáticamente
   - Si necesitas otro puerto, modifica `index.html` línea ~1526

---

##  CHECKLIST

- [ ] Variable `MCP_SERVER_URL` configurada en Vercel
- [ ] Variable `MCP_TOKEN` configurada (si es necesario)
- [ ] Nuevo deploy realizado en Vercel
- [ ] Verificado en consola del navegador que carga la configuración
- [ ] Probado conexión WebSocket en una llamada
- [ ] Verificado que NO aparece `localhost` en los logs

---

##  RESOLUCIÓN DE PROBLEMAS

### Si la conexión falla:

1. **Verifica que Render está activo:**
   ```bash
   curl https://pwa-imbf.onrender.com/health
   ```

2. **Verifica las variables en Vercel:**
   - Ve a Settings → Environment Variables
   - Confirma que `MCP_SERVER_URL` está configurada
   - Verifica que no hay espacios extra o caracteres raros

3. **Verifica los logs de Render:**
   - Render Dashboard → Logs
   - Busca errores de conexión WebSocket

4. **Verifica CORS en Render:**
   - El servidor MCP debe permitir conexiones desde `guestsvalencia.es`
   - Variable `ALLOWED_ORIGINS` en Render debe incluir `*` o la URL específica

---

##  FLUJO DE CONEXIÓN

```
Usuario → guestsvalencia.es (Vercel)
    ↓
Carga index.html
    ↓
Fetch /api/config (Vercel Function)
    ↓
Carga MCP_SERVER_URL desde process.env
    ↓
window.MCP_SERVER_URL = "https://pwa-imbf.onrender.com"
    ↓
SandraGateway construye: wss://pwa-imbf.onrender.com:4042
    ↓
WebSocket conecta a Render
    ↓
Servidor MCP procesa y responde
```

---

**Última actualización:** 10 de Diciembre, 2025

