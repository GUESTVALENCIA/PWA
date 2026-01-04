# 🔧 CONFIGURACIÓN: IA-SANDRA en Render

## 📋 Situación Actual

- ✅ IA-SANDRA está configurado como **Git Submodule** (`.gitmodules`)
- ✅ Submodule está inicializado localmente
- ❌ En Render, los submodules **NO se clonan automáticamente**
- ✅ Los logs ya NO muestran ERROR/WARN cuando IA-SANDRA no está disponible (comportamiento esperado)

## 🎯 Objetivo

Hacer que IA-SANDRA esté disponible en Render para que el orquestador pueda cargar sus servicios.

## 🚀 Solución: Configurar Git Submodules en Render

### Opción 1: Modificar Build Command (RECOMENDADO)

Render necesita clonar los submodules durante el build. Modifica el **Build Command** en Render:

1. Ve a Render Dashboard → Tu Servicio → Settings
2. En la sección **Build & Deploy**, busca **Build Command**
3. Cambia de:
   ```
   npm install
   ```
   A:
   ```
   git submodule update --init --recursive && npm install
   ```

Esto hará que Render:
1. Clone los submodules (incluyendo IA-SANDRA)
2. Instale las dependencias de npm

### Opción 2: Usar Variable de Entorno SANDRA_REPO_PATH

Si prefieres no usar submodules en Render, puedes:

1. **Clonar IA-SANDRA en otro lugar** (fuera del repositorio)
2. **Configurar variable de entorno en Render**:
   - Nombre: `SANDRA_REPO_PATH`
   - Valor: Ruta absoluta donde está clonado (ej: `/opt/render/project/IA-SANDRA`)

**Nota**: Esta opción requiere clonar el repo manualmente o mediante un script personalizado.

## ✅ Verificación

Después de configurar, los logs deberían mostrar:

```
✅ Sandra Orchestrator inicializado correctamente
[SANDRA ORCHESTRATOR] ✅ Unificación completada exitosamente
[SANDRA ORCHESTRATOR] ✅ Servicio cargado: [nombre]
```

En lugar de (comportamiento actual sin IA-SANDRA):
```
[SANDRA ORCHESTRATOR] 🔌 Inicializado - Ruta IA-SANDRA: /opt/render/project/IA-SANDRA
[DEBUG] IA-SANDRA no disponible, usando servicios del PWA (comportamiento esperado)
```

## 📝 Nota Importante

**Los logs ya NO muestran ERROR/WARN** cuando IA-SANDRA no está disponible. El sistema funciona correctamente sin IA-SANDRA usando servicios del PWA como fallback.

Si quieres que IA-SANDRA esté disponible en Render (para usar servicios avanzados como pipeline de negociación), sigue la **Opción 1** (modificar Build Command).

---

**Estado**: ✅ Logs corregidos - Opcional: Configurar submodules en Render para IA-SANDRA
