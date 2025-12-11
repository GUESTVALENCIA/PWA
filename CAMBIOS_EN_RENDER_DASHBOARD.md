# 🔧 CAMBIOS EXACTOS EN RENDER DASHBOARD

## 📍 Pasos Exactos:

1. **Ve a:** https://dashboard.render.com
2. **Logueate** (GitHub, Google, etc.)
3. **Ve a tu servicio:** Busca "PWA" o el servicio que estás desplegando
4. **Click en:** Settings (Configuración)

## ⚙️ CAMBIOS EN "Build & Deploy":

### Root Directory:
**Cambiar de:** (vacío o raíz)  
**A:** `mcp-server`

### Start Command:
**Cambiar de:** `node server.js`  
**A:** `node index.js`

### Build Command:
**Dejar:** `npm install` (o vacío si auto-detecta)

## 🌐 CAMBIOS EN "Networking" o "Port":

### Port:
**Cambiar de:** `4040`  
**A:** `4042`

## ✅ DESPUÉS DE HACER LOS CAMBIOS:

1. **Guarda** los cambios
2. **Ve a:** Deploys
3. **Click en:** "Manual Deploy" o espera el auto-deploy

## 🔍 VERIFICAR:

Después del deploy, en los logs deberías ver:
```
🚀 MCP-SANDRA Server v1.0.0
MCP Server iniciado en 0.0.0.0:4042
```

**NO deberías ver:**
```
Servidor Galaxy local corriendo en http://localhost:4040
```

---

## 📋 RESUMEN DE CAMBIOS:

| Configuración | Antes | Después |
|---------------|-------|---------|
| Root Directory | (vacío) | `mcp-server` |
| Start Command | `node server.js` | `node index.js` |
| Port | `4040` | `4042` |

