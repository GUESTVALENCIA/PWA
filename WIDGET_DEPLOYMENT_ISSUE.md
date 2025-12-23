#  PROBLEMA: Widget no desplegado en producción

##  Problemas Detectados

### 1. Archivo JS no disponible
- **URL:** `https://guestsvalencia.es/assets/js/sandra-widget.js`
- **Status:** 404 (No encontrado)
- **Problema:** El archivo no está siendo desplegado

### 2. HTML en producción sin el código del widget
- **Problema:** El HTML desplegado es una versión antigua
- **Falta:** Código de carga del script (líneas 2023-2032)
- **Falta:** Configuración `WIDGET_ENABLED` y `MCP_SERVER_URL`

### 3. Vercel Project ID incorrecto
- **Error:** Project not found (404)
- **Problema:** El PROJECT_ID en `check-vercel-status.js` puede estar incorrecto

---

##  Código Local (CORRECTO)

El código local en `index.html` (líneas 2008-2032) está correcto:

```javascript
// Configuración del widget
window.WIDGET_ENABLED = true;
window.MCP_SERVER_URL = 'https://mcp.sandra-ia.com'; // o URL correcta

// Cargar SandraWidget
const sandraScript = document.createElement('script');
sandraScript.src = '/assets/js/sandra-widget.js';
sandraScript.async = true;
sandraScript.onerror = function() {
  console.error(' Error cargando sandra-widget.js');
};
sandraScript.onload = function() {
  console.log(' SandraWidget cargado correctamente');
};
document.head.appendChild(sandraScript);
```

---

##  Soluciones

### Solución 1: Verificar que el archivo existe localmente
 El archivo existe: `assets/js/sandra-widget.js`

### Solución 2: Asegurar que Vercel despliega todos los archivos
- Verificar `vercel.json` está configurado correctamente
- Asegurar que `assets/` está incluido en el deploy

### Solución 3: Forzar nuevo deploy
1. Verificar que todos los cambios están commiteados
2. Hacer push a GitHub
3. Verificar que Vercel detecta el push
4. Esperar a que el deploy complete

### Solución 4: Verificar configuración de Vercel
- Root directory: debe estar en raíz
- Build command: verificar si hay algún comando que pueda estar excluyendo archivos
- Output directory: debe ser `.` o `public` si es necesario

---

##  Checklist de Verificación

- [ ] Archivo `assets/js/sandra-widget.js` existe localmente
- [ ] Código del widget está en `index.html` (líneas 2008-2032)
- [ ] Cambios están commiteados en Git
- [ ] Push realizado a GitHub
- [ ] Vercel detecta el nuevo commit
- [ ] Deploy completado exitosamente
- [ ] Archivo JS disponible en producción
- [ ] HTML en producción incluye el código del widget

---

##  Próximos Pasos

1. Verificar que todos los cambios están en Git
2. Hacer commit y push
3. Verificar deploy en Vercel
4. Ejecutar `verify-widget-production.js` después del deploy

