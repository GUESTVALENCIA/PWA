# 🚀 INSTRUCCIONES RÁPIDAS: CONECTAR PRODUCCIÓN

## ✅ LO QUE YA ESTÁ LISTO

1. ✅ Servidor MCP en Render funcionando: `https://pwa-imbf.onrender.com:4042`
2. ✅ Código preparado para usar variables de entorno
3. ✅ API endpoint `/api/config` listo para exponer configuración

## 🔧 QUÉ HACER AHORA (2 MINUTOS)

### Opción 1: Desde Vercel Dashboard (RECOMENDADO)

1. **Ve a:** https://vercel.com/dashboard
2. **Selecciona:** Proyecto `GUESTVALENCIAPWA`
3. **Settings → Environment Variables**
4. **Agregar:**
   - **Key:** `MCP_SERVER_URL`
   - **Value:** `https://pwa-imbf.onrender.com`
   - **Environments:** ✅ Production
   - **Save**
5. **Redeploy:** Click en "Deployments" → "Redeploy" (último deployment)

### Opción 2: Desde Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Configurar variable
vercel env add MCP_SERVER_URL production
# Cuando pida el valor, escribe: https://pwa-imbf.onrender.com

# Hacer deploy
vercel --prod
```

## ✅ VERIFICAR QUE FUNCIONA

1. **Después del deploy, abre:** https://guestsvalencia.es
2. **Abre la consola del navegador (F12)**
3. **Busca este mensaje:**
   ```
   ✅ [MCP] Configuración cargada desde API: {MCP_SERVER_URL: "https://pwa-imbf.onrender.com", ...}
   ```
4. **Inicia una llamada** y verifica que conecta correctamente

## 🎯 RESULTADO ESPERADO

- ✅ Widget carga configuración desde Vercel
- ✅ WebSocket conecta a `wss://pwa-imbf.onrender.com:4042`
- ✅ Llamadas funcionan correctamente
- ✅ Chat funciona correctamente

---

**¿Problemas?** Revisa `CONFIGURAR_CONEXION_PRODUCCION.md` para troubleshooting.

