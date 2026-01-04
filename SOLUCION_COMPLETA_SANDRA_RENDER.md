# 🔧 SOLUCIÓN COMPLETA: Conectar IA-SANDRA en Render

## 🎯 PROBLEMA IDENTIFICADO

Los logs muestran:
```
[SANDRA ORCHESTRATOR] ⚠️ Repo IA-SANDRA no encontrado en: /opt/render/project/IA-SANDRA
[SANDRA ORCHESTRATOR] ❌ Repo IA-SANDRA no encontrado: /opt/render/project/IA-SANDRA
```

**Causas:**
1. El Build Command no está clonando el submodule correctamente
2. La ruta de búsqueda puede ser incorrecta en Render
3. El submodule no se está inicializando durante el build

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Orquestador Mejorado (`src/orchestrators/sandra-orchestrator.js`)

**Cambios:**
- ✅ Detección automática de entorno Render
- ✅ Búsqueda en múltiples ubicaciones posibles
- ✅ Logs informativos para debugging
- ✅ Fallback graceful si no se encuentra

**Rutas que busca:**
1. Ruta configurada (`SANDRA_REPO_PATH` o parámetro)
2. `process.cwd()/IA-SANDRA` (ubicación relativa actual)
3. `/opt/render/project/src/IA-SANDRA` (Render con rootDir = .)
4. `/opt/render/project/IA-SANDRA` (Render con rootDir = src/)
5. Ruta relativa desde `__dirname`

### 2. Build Command en Render

**Configuración necesaria:**
```
Build Command: git submodule update --init --recursive && npm install
```

**Verificación:**
- El Build Command debe ejecutarse ANTES de `npm install`
- Los logs deben mostrar: `Submodule 'IA-SANDRA' registered`

---

## 🔧 PASOS PARA RESOLVER

### Paso 1: Verificar Build Command en Render

Usar el script para verificar y actualizar:
```bash
node forzar-build-command-render.cjs
```

### Paso 2: Verificar .gitmodules

El archivo `.gitmodules` debe contener:
```ini
[submodule "IA-SANDRA"]
	path = IA-SANDRA
	url = https://github.com/GUESTVALENCIA/IA-SANDRA.git
```

### Paso 3: Hacer Commit y Push

Si el submodule no está en el repositorio:
```bash
git add .gitmodules IA-SANDRA
git commit -m "feat: Add IA-SANDRA submodule"
git push
```

### Paso 4: Verificar en Render

Después del deploy, los logs deben mostrar:
```
==> Syncing Git submodules
Submodule 'IA-SANDRA' registered
Cloning into '/opt/render/project/src/IA-SANDRA'
```

---

## 🚀 PRÓXIMOS PASOS

1. **Verificar Build Command** - Usar script o Dashboard
2. **Hacer nuevo deploy** - Para aplicar cambios
3. **Verificar logs** - Confirmar que submodule se clona
4. **Verificar inicialización** - Confirmar que servicios se cargan

---

**ESTADO**: 🔧 **SOLUCIÓN IMPLEMENTADA - REQUIERE DEPLOY**
