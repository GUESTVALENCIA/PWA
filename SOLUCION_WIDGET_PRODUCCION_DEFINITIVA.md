# 🔴 SOLUCIÓN DEFINITIVA: Widget en Producción Vercel

## ❌ PROBLEMA ACTUAL

1. **Widget funciona en local** ✅
2. **Widget NO funciona en producción** ❌
3. **El código es idéntico** pero algo se pierde en el deploy

---

## 🔍 DIAGNÓSTICO

### Posibles causas:

1. **Archivo JS no se despliega** (404 en `/assets/js/sandra-widget.js`)
2. **Ruta incorrecta** en producción (relative vs absolute)
3. **Cache de Vercel** sirviendo versión antigua
4. **Configuración de Vercel** no incluye carpeta `assets/`
5. **Build process** eliminando archivos

---

## ✅ SOLUCIÓN 1: Verificar que el archivo existe en el repo

```powershell
git ls-files assets/js/sandra-widget.js
```

Si NO aparece, agregarlo:
```powershell
git add assets/js/sandra-widget.js
git commit -m "Add sandra-widget.js to repository"
git push
```

---

## ✅ SOLUCIÓN 2: Cambiar ruta del script a absoluta

En lugar de:
```javascript
sandraScript.src = '/assets/js/sandra-widget.js';
```

Usar ruta relativa al dominio:
```javascript
sandraScript.src = `${window.location.origin}/assets/js/sandra-widget.js`;
```

O mejor aún, verificar si está en el mismo directorio:
```javascript
sandraScript.src = window.location.pathname.endsWith('/') 
  ? 'assets/js/sandra-widget.js' 
  : '/assets/js/sandra-widget.js';
```

---

## ✅ SOLUCIÓN 3: Agregar script directamente en HTML (NO dinámico)

En lugar de cargar dinámicamente, agregar directamente en `<head>`:

```html
<script src="/assets/js/sandra-widget.js" defer></script>
```

Y mover la inicialización al final del body:

```html
<script>
  window.WIDGET_ENABLED = true;
  window.MCP_SERVER_URL = 'https://mcp.sandra-ia.com';
  // El widget se auto-inicializa
</script>
```

---

## ✅ SOLUCIÓN 4: Verificar vercel.json

Asegurar que `assets/` no está siendo excluido:

```json
{
  "version": 2,
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/((?!assets|api|icons|media|manifest\\.webmanifest|service-worker\\.js|sw\\.js|favicon\\.svg).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ✅ SOLUCIÓN 5: Forzar nuevo deploy sin cache

1. Ir a Vercel Dashboard
2. Settings → General
3. "Clear Build Cache"
4. Redeploy

---

## 🎯 IMPLEMENTACIÓN RECOMENDADA

**Cambiar a carga estática del script** (más confiable):

1. Agregar script tag directamente en HTML
2. Eliminar carga dinámica
3. Widget se auto-inicializa al cargar

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Archivo `assets/js/sandra-widget.js` existe en Git
- [ ] Archivo se despliega (no está en .gitignore)
- [ ] Ruta del script es correcta
- [ ] Script se carga (verificar Network tab en DevTools)
- [ ] No hay errores en consola
- [ ] Widget se inicializa (verificar `window.sandraWidgetInstance`)

---

## 🚀 PRÓXIMOS PASOS

1. Cambiar a carga estática del script
2. Verificar que el archivo está en Git
3. Forzar redeploy sin cache
4. Verificar en producción

