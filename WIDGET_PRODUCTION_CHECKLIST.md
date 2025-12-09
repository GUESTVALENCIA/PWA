# ✅ Checklist de Widget de Sandra para Producción

## 📋 Verificación Pre-Deploy

### 1. Archivo del Widget
- ✅ **Archivo:** `assets/js/sandra-widget.js` (23,511 bytes)
- ✅ **Clase:** `SandraWidget` (no UIGSandra)
- ✅ **Nombre correcto:** `sandra-widget.js` (no uig-sandra.js)

### 2. Integración en HTML
- ✅ **Script cargado en:** `index.html` (línea 3561)
- ✅ **Ruta:** `/assets/js/sandra-widget.js`
- ✅ **Handlers:** `onload` y `onerror` configurados
- ✅ **Configuración:** `WIDGET_ENABLED = true`

### 3. Configuración Vercel
- ✅ **vercel.json:** Configurado para servir archivos estáticos
- ✅ **Rewrite:** `/assets/*` se sirve directamente (no necesita rewrite especial)
- ✅ **Headers:** Cache configurado para archivos `.js`

### 4. Características del Widget
- ✅ **Visibilidad forzada:** Estilos con `!important`
- ✅ **Posicionamiento:** `fixed bottom-4 right-4 z-[9999]`
- ✅ **Auto-inicialización:** Se ejecuta automáticamente al cargar
- ✅ **ID del botón:** `sandra-widget-button`
- ✅ **ID del contenedor:** `sandra-widget-button-container`

## 🔍 Verificación Post-Deploy

Después del despliegue, verificar:

1. **Archivo accesible:**
   ```
   https://[URL-PRODUCCION]/assets/js/sandra-widget.js
   ```
   - Debe devolver código 200
   - Debe mostrar el contenido del archivo

2. **HTML incluye el script:**
   ```
   https://[URL-PRODUCCION]/
   ```
   - Inspeccionar fuente HTML
   - Buscar: `sandra-widget.js`
   - Verificar que aparece en el `<head>`

3. **Widget visible:**
   - Abrir consola del navegador
   - Verificar: `✅ SandraWidget cargado correctamente`
   - Verificar: `✅ SandraWidget inicializado`
   - Ver botón en esquina inferior derecha

4. **Funcionalidad:**
   - Click en el botón del widget
   - Verificar que se inicia la llamada
   - Verificar conexión con MCP server

## 🚨 Posibles Problemas

### Widget no aparece:
1. Verificar que `WIDGET_ENABLED = true`
2. Verificar consola del navegador por errores
3. Verificar que el archivo JS se carga correctamente
4. Verificar estilos CSS no están sobrescribiendo

### Script no carga:
1. Verificar ruta: `/assets/js/sandra-widget.js`
2. Verificar que el archivo existe en el deploy
3. Verificar headers de Vercel
4. Verificar permisos del archivo

### Widget no funciona:
1. Verificar `MCP_SERVER_URL` configurado
2. Verificar conexión WebSocket
3. Verificar variables de entorno
4. Verificar logs del servidor MCP

## 📝 Comandos de Verificación

### Verificar archivo local:
```bash
Test-Path "assets/js/sandra-widget.js"
Get-Item "assets/js/sandra-widget.js" | Select-Object Name, Length
```

### Verificar integración:
```bash
Select-String -Path "index.html" -Pattern "sandra-widget.js"
Select-String -Path "index.html" -Pattern "SandraWidget"
```

### Verificar después del deploy:
```bash
node verify-widget-production.js
```

## ✅ Estado Actual

- ✅ Archivo renombrado correctamente
- ✅ Referencias actualizadas en código
- ✅ Visibilidad forzada para producción
- ✅ Error handling implementado
- ✅ Auto-inicialización configurada
- ✅ Cambios pusheados a repositorio

## 🚀 Próximos Pasos

1. **Esperar despliegue automático de Vercel** (si hay auto-deploy configurado)
2. **O desplegar manualmente:**
   ```bash
   npx vercel --prod
   ```

3. **Verificar después del deploy:**
   - Ejecutar `node verify-widget-production.js`
   - Abrir URL de producción en navegador
   - Inspeccionar consola del navegador
   - Verificar que el widget aparece

## 📞 URL de Producción

```
https://pwa-2caws3ssh-guests-valencias-projects.vercel.app
```

**Nota:** El widget aparecerá automáticamente después del próximo despliegue de Vercel.

