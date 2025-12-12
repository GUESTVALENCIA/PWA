# 🚀 GUÍA RÁPIDA: INSTALAR RENDER MCP EN CURSOR

## ✅ PASO 1: Obtener API Key de Render

1. Ve a: **https://dashboard.render.com/settings#api-keys**
2. Click en **"Create API Key"**
3. Dale un nombre (ej: "Cursor MCP")
4. **COPIA LA API KEY** (solo se muestra una vez)

## ✅ PASO 2: Instalar en Cursor

Ejecuta este comando (reemplaza `TU_API_KEY` con la que copiaste):

```bash
cd C:\Users\clayt\OneDrive\GUESTVALENCIAPWA
node INSTALAR-RENDER-MCP.js TU_API_KEY
```

## ✅ PASO 3: Reiniciar Cursor

1. Cierra Cursor completamente
2. Ábrelo de nuevo
3. Espera 10 segundos para que cargue MCP

## ✅ PASO 4: Configurar Workspace

En Cursor, escribe:
```
Set my Render workspace to My Workspace
```

## 🎯 COMANDOS QUE PUEDES USAR AHORA:

### Gestionar Deploys:
- `"Deploy latest commit to PWA service"`
- `"Why is my PWA service failing?"`
- `"Show recent deploys for PWA"`

### Ver Logs:
- `"Show error logs for PWA service"`
- `"Pull the most recent logs for PWA"`

### Gestionar Servicios:
- `"List my Render services"`
- `"Show details for PWA service"`
- `"What's the status of my PWA service?"`

### Métricas:
- `"What was the busiest traffic day for PWA this month?"`
- `"Show CPU usage for PWA service"`

### Arreglar el Deploy Fallido:
- `"Debug why PWA service deployment failed"`
- `"Show build logs for the failed deploy"`
- `"Redeploy PWA service with latest commit"`

---

## 🔧 ARREGLAR EL DEPLOY FALLIDO ACTUAL:

Veo que tu servicio PWA tiene un deploy fallido. Con MCP puedes:

1. **Ver los logs del error:**
   ```
   Show error logs for PWA service
   ```

2. **Hacer redeploy:**
   ```
   Deploy latest commit to PWA service
   ```

3. **Ver qué falló:**
   ```
   Why is my PWA service failing?
   ```

---

**¡Una vez instalado, puedes gestionar TODO Render desde Cursor!** 🎉
