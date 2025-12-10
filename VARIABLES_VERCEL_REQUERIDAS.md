# 🔑 Variables de Entorno Requeridas en Vercel

## Variables Necesarias

### 1. **MCP_SERVER_URL** (REQUERIDO) ✅

**Descripción:** URL del servidor MCP que maneja las llamadas conversacionales.

**Valor ejemplo:**
```
https://mcp.sandra-ia.com
```

**Cómo configurar:**
- Ve a: https://vercel.com/dashboard
- Selecciona tu proyecto: `pwa`
- Ve a: **Settings > Environment Variables**
- Click en **Add New**
- Nombre: `MCP_SERVER_URL`
- Valor: `https://tu-servidor-mcp.com` (tu URL real)
- Ambientes: Selecciona **Production** (y Preview si quieres)

**Sin esta variable:**
- ❌ El widget no podrá conectarse al servidor MCP en producción
- ❌ Las llamadas conversacionales no funcionarán
- ❌ El endpoint `/api/config` retornará el valor por defecto

---

### 2. **MCP_TOKEN** (OPCIONAL) ⚠️

**Descripción:** Token de autenticación para el servidor MCP (solo si tu servidor lo requiere).

**Valor ejemplo:**
```
tu-token-de-autenticacion-aqui
```

**Cómo configurar:**
- Ve a: https://vercel.com/dashboard
- Selecciona tu proyecto: `pwa`
- Ve a: **Settings > Environment Variables**
- Click en **Add New**
- Nombre: `MCP_TOKEN`
- Valor: `tu-token` (si es necesario)
- Ambientes: Selecciona **Production** (y Preview si aplica)

**Cuándo necesitas esto:**
- Solo si tu servidor MCP requiere autenticación
- El token se añadirá automáticamente a la URL WebSocket: `wss://server:4042?token=TU_TOKEN`

**Sin esta variable:**
- ✅ El widget funcionará igual si tu servidor MCP no requiere token
- El endpoint `/api/config` retornará `MCP_TOKEN: null`

---

## 🚀 Configuración Automática

Puedes usar el script incluido para configurar las variables automáticamente:

### Opción 1: Script Node.js
```bash
node configurar-variables-vercel.js
```

### Opción 2: Script PowerShell (Windows)
```powershell
.\configurar-variables-vercel.ps1
```

El script:
- ✅ Lista las variables actuales
- ✅ Identifica las faltantes
- ✅ Te permite configurarlas interactivamente
- ✅ Verifica la configuración

---

## 📋 Resumen Rápido

**Para que el widget funcione en producción, necesitas:**

1. ✅ **MCP_SERVER_URL** - URL de tu servidor MCP (REQUERIDO)
2. ⚠️ **MCP_TOKEN** - Token de autenticación (OPCIONAL, solo si tu servidor lo requiere)

**Después de configurar:**
- Las variables se aplicarán en el próximo deploy
- Puedes forzar un redeploy desde Vercel Dashboard
- O hacer un push al repositorio para trigger automático

---

## 🔍 Verificar Configuración

### Verificar en Vercel Dashboard:
1. Ve a: **Settings > Environment Variables**
2. Verifica que `MCP_SERVER_URL` esté configurada
3. Verifica que esté asignada a **Production**

### Verificar endpoint:
```bash
curl https://pwa-chi-six.vercel.app/api/config
```

**Respuesta esperada:**
```json
{
  "MCP_SERVER_URL": "https://tu-servidor-mcp.com",
  "MCP_TOKEN": null
}
```

### Verificar en consola del navegador:
1. Abre: `https://pwa-chi-six.vercel.app`
2. Abre la consola (F12)
3. Busca: `✅ [MCP] Configuración cargada desde API`

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde obtengo la URL del servidor MCP?**
R: Es la URL donde desplegaste tu servidor MCP (Railway, Render, Heroku, etc.)

**P: ¿Necesito configurar MCP_TOKEN?**
R: Solo si tu servidor MCP requiere autenticación. Si no, puedes omitirlo.

**P: ¿Las variables se aplican inmediatamente?**
R: No, se aplican en el próximo deploy. Haz un push o fuerza un redeploy.

**P: ¿Funciona en desarrollo local?**
R: No necesitas configurarlas en Vercel para desarrollo local. El widget detecta automáticamente si está en localhost y usa los servidores locales.

---

## 📚 Referencias

- `CONFIGURACION_VERCEL_COMPLETA.md` - Guía completa de configuración
- `CONFIGURACION_MCP_PRODUCCION.md` - Configuración del servidor MCP
- `api/config.js` - Endpoint que expone estas variables

