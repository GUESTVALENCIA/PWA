# 🔍 DEBUG: IA-SANDRA No Encontrado

## 📊 HIPÓTESIS GENERADAS

### Hipótesis A: Build Command no se ejecutó durante el build
- **Razón**: El Build Command puede no haberse guardado correctamente o Render no lo ejecutó
- **Evidencia esperada**: No ver `Submodule 'IA-SANDRA' registered` en logs de build
- **Verificación**: Logs de build en Render Dashboard

### Hipótesis B: Submodule se clonó pero en ubicación diferente
- **Razón**: Render puede clonar en `/opt/render/project/src/IA-SANDRA` en lugar de `/opt/render/project/IA-SANDRA`
- **Evidencia esperada**: El código busca en `/opt/render/project/IA-SANDRA` pero está en otra ruta
- **Verificación**: Instrumentación de búsqueda de rutas alternativas

### Hipótesis C: El submodule no está en el repositorio remoto
- **Razón**: `.gitmodules` puede no estar en el commit que Render está usando
- **Evidencia esperada**: Git no encuentra el submodule durante el clone
- **Verificación**: Verificar que `.gitmodules` está en el repositorio

### Hipótesis D: La detección de Render no funciona correctamente
- **Razón**: El código puede no detectar que está en Render y usar ruta local
- **Evidencia esperada**: `isRender` es `false` cuando debería ser `true`
- **Verificación**: Loggear valores de detección de entorno

### Hipótesis E: El constructor usa ruta incorrecta antes de la búsqueda
- **Razón**: El constructor establece `this.sandraRepoPath` antes de que `initialize()` busque alternativas
- **Evidencia esperada**: La búsqueda en `initialize()` nunca se ejecuta o usa ruta incorrecta
- **Verificación**: Loggear ruta establecida en constructor vs. ruta buscada en initialize()

## 🔧 INSTRUMENTACIÓN AGREGADA

Se agregaron logs de depuración en:
- `src/orchestrators/sandra-orchestrator.js`:
  - Constructor: Detección de Render, rutas posibles, ruta final establecida
  - Initialize: Verificación de ruta inicial, búsqueda en rutas alternativas, resultado final

Los logs se envían a: `http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad`
Y se escriben en: `.cursor/debug.log`

## ✅ VERIFICACIONES REALIZADAS

1. ✅ `.gitmodules` existe y está configurado correctamente
2. ✅ Submodule está inicializado localmente
3. ✅ Build Command configurado en Render (pero no se puede verificar si se ejecutó)

## 📋 PRÓXIMOS PASOS

1. Hacer commit y push de los cambios instrumentados
2. Esperar nuevo deploy en Render
3. Analizar logs de depuración para identificar la causa raíz
