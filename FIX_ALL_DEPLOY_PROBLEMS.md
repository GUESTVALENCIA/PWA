# PLAN COMPLETO DE CORRECCIÓN DE DEPLOY - VERCEL

## PROBLEMAS IDENTIFICADOS

### 1. GIT - Múltiples commits problemáticos
- Commits locales no sincronizados con origin/main
- Posibles conflictos de merge
- Historial desordenado

### 2. VERCEL - Deploy
- Widget no aparece en producción
- Archivo sandra-widget.js puede no estar desplegado
- Errores de build no verificados

### 3. CÓDIGO
- Código duplicado en index.html (ya corregido)
- Verificar que sandra-widget.js existe y es correcto

### 4. VARIABLES DE ENTORNO
- Verificar que todas las variables están en Vercel

---

## PLAN DE ACCIÓN COMPLETO

### FASE 1: VERIFICACIÓN DIAGNÓSTICA
1. ✅ Verificar estado Git actual
2. ✅ Verificar errores en Vercel (usando API)
3. ✅ Verificar archivos críticos
4. ✅ Listar TODOS los problemas encontrados

### FASE 2: LIMPIEZA GIT
1. Resetear a origin/main limpio
2. Aplicar SOLO correcciones necesarias
3. Un solo commit limpio
4. Push forzado controlado

### FASE 3: VERIFICACIÓN POST-DEPLOY
1. Verificar que Vercel recibe el push
2. Esperar build completar
3. Verificar widget en producción
4. Verificar todos los assets

### FASE 4: DOCUMENTACIÓN
1. Registrar URL de producción final
2. Documentar problemas resueltos
3. Crear checklist de verificación

---

## EJECUTAR EN ORDEN:

```powershell
# 1. DIAGNÓSTICO
node check-vercel-status.js

# 2. VERIFICAR GIT
git status
git log --oneline -10

# 3. RESET LIMPIO
git fetch origin
git reset --hard origin/main

# 4. VERIFICAR ARCHIVOS CRÍTICOS
Test-Path "assets/js/sandra-widget.js"
Select-String -Path "index.html" -Pattern "sandra-widget.js"

# 5. COMMIT Y PUSH
git add index.html assets/js/sandra-widget.js
git commit -m "fix: Corregir deploy widget Sandra - eliminar duplicados"
git push origin main

# 6. VERIFICAR DEPLOY
Start-Sleep -Seconds 30
node verify-widget-production.js
```

---

## CHECKLIST FINAL
- [ ] Git sincronizado con origin/main
- [ ] index.html sin código duplicado
- [ ] sandra-widget.js existe y está correcto
- [ ] Commit limpio hecho
- [ ] Push exitoso
- [ ] Vercel build exitoso
- [ ] Widget visible en producción
- [ ] Scripts funcionando

---

**EJECUTAR: node check-vercel-status.js primero para ver errores reales**

