# 🔧 CORREGIR START COMMAND EN RENDER

## 📋 PROBLEMA DETECTADO:

Los logs de Render muestran:
```
==> Running 'node server.js'
```

Pero debería ejecutar:
```
==> Running 'node index.js'
```

## ✅ SOLUCIÓN:

### Opción 1: Manual en Render Dashboard (RECOMENDADO)

1. Ve a: https://dashboard.render.com/web/srv-d4sqhoeuk2gs73f1ba8g
2. Click en **"Settings"**
3. Ve a la sección **"Build & Deploy"**
4. Busca **"Start Command"**
5. Cambia de: `node server.js`
6. A: `node index.js`
7. **Guarda los cambios**
8. Ve a **"Deploys"** y haz click en **"Manual Deploy"**

### Opción 2: Usar render.yaml

Si Render está usando el `render.yaml`, el Start Command ya está correcto:
```yaml
startCommand: node index.js
```

Pero si el servicio se creó manualmente, necesitas cambiarlo en el Dashboard.

## 🔍 VERIFICACIÓN:

Después del deploy, los logs deberían mostrar:
```
==> Running 'node index.js'
🚀 MCP-SANDRA Server v1.0.0
MCP Server iniciado en 0.0.0.0:4042
```

**NO deberías ver:**
```
==> Running 'node server.js'
Servidor Galaxy local corriendo...
```

## ⚠️ NOTA:

El `server.js` es un servidor antiguo. El servidor correcto es `index.js` que está en `mcp-server/`.

