# 🔧 INSTRUCCIONES: Configurar Render para Clonar Submodules

## 🎯 OBJETIVO
Configurar Render para que clone automáticamente el submodule IA-SANDRA durante el build.

---

## 📋 PASOS

### 1. Ir a Render Dashboard
1. Abre: https://dashboard.render.com
2. Ve a tu servicio (PWA)

### 2. Modificar Build Command
1. Click en **Settings** (Configuración)
2. Busca la sección **Build & Deploy**
3. Encuentra el campo **Build Command**
4. **Cambia de:**
   ```
   npm install
   ```
   **A:**
   ```
   git submodule update --init --recursive && npm install
   ```

### 3. Guardar y Deploy
1. Click en **Save Changes**
2. Ve a **Deploys**
3. Click en **Manual Deploy** → **Deploy latest commit**

---

## ✅ VERIFICACIÓN

Después del deploy, verifica en los logs:

### Logs Correctos:
```
==> Syncing Git submodules
Submodule 'IA-SANDRA' (https://github.com/GUESTVALENCIA/IA-SANDRA.git) registered for path 'IA-SANDRA'
Cloning into '/opt/render/project/src/IA-SANDRA'...
==> Running build command 'git submodule update --init --recursive && npm install'
```

### Logs de Inicialización Correctos:
```
[SANDRA ORCHESTRATOR] ✅ Pipeline de negociación cargado (NegotiationService)
[SANDRA ORCHESTRATOR] ✅ Adaptador Neon de IA-SANDRA cargado
[SANDRA ORCHESTRATOR] ✅ Orquestador de contexto cargado (desde PWA)
[SANDRA ORCHESTRATOR] ✅ Unificación completada exitosamente
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Primer Deploy:** El primer deploy después de cambiar el Build Command tomará más tiempo porque clonará el submodule.

2. **Tamaño del Repo:** IA-SANDRA es un repo grande, puede aumentar el tiempo de build en ~1-2 minutos.

3. **Variables de Entorno:** No es necesario configurar `SANDRA_REPO_PATH` si el submodule está en la raíz (comportamiento por defecto).

---

**ESTADO**: ✅ LISTO PARA CONFIGURAR
