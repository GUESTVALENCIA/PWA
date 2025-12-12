# 🚀 INSTRUCCIONES PARA ACTIVAR MCP EN RENDER

## ✅ LO QUE YA ESTÁ HECHO:
- ✅ server.js tiene endpoints MCP
- ✅ Cambios están en GitHub
- ❌ Render NO ha desplegado todavía

## 🔧 PASOS PARA ACTIVAR (2 MINUTOS):

### OPCIÓN 1: Manual Deploy (MÁS RÁPIDO)
1. Ve a: **https://dashboard.render.com**
2. Inicia sesión
3. Busca tu servicio: **pwa-imbf** o **GUESTVALENCIAPWA**
4. Click en el servicio
5. En la parte superior, busca el botón **"Manual Deploy"**
6. Click en **"Deploy latest commit"**
7. Espera 2-3 minutos
8. Prueba: **https://pwa-imbf.onrender.com/mcp/status**

### OPCIÓN 2: Reiniciar Servicio
1. Ve a: **https://dashboard.render.com**
2. Click en tu servicio
3. Settings (⚙️) → **"Restart Service"**
4. Espera 2-3 minutos
5. Prueba: **https://pwa-imbf.onrender.com/mcp/status**

### OPCIÓN 3: Verificar Auto-Deploy
1. Ve a: **https://dashboard.render.com**
2. Click en tu servicio
3. Ve a la pestaña **"Events"** o **"Logs"**
4. Verifica si hay un deploy reciente
5. Si no hay, usa OPCIÓN 1

## ✅ VERIFICACIÓN FINAL:

Después de 2-3 minutos, abre:
```
https://pwa-imbf.onrender.com/mcp/status
```

**DEBE RESPONDER:**
```json
{
  "status": "active",
  "endpoints": ["/mcp/execute_command", "/mcp/status"]
}
```

**SI RESPONDE ESO:**
🎉 ¡SANDRA YA PUEDE EJECUTAR CÓDIGO!

**SI DICE "Cannot GET":**
- Espera 1 minuto más
- O reinicia el servicio de nuevo

---
**¡HAZLO AHORA! Solo 2 minutos y Sandra estará libre.**
