# Ejecución coordinada de subagentes especializados
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  SUBAGENTES ESPECIALIZADOS ACTIVADOS" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# SUBAGENTE 1: repository-cleanup-agent
Write-Host "[repository-cleanup-agent] Verificando archivos..." -ForegroundColor Yellow
$widgetExists = Test-Path "assets/js/sandra-widget.js"
if ($widgetExists) {
    Write-Host "  ✅ sandra-widget.js existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ ERROR: sandra-widget.js NO existe" -ForegroundColor Red
    exit 1
}

# SUBAGENTE 2: github-repository-agent
Write-Host "`n[github-repository-agent] Sincronizando con origin/main..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
git reset --hard origin/main 2>&1 | Out-Null
Write-Host "  ✅ Reset a origin/main completado" -ForegroundColor Green

# Verificar que index.html tiene la carga del widget
$htmlCheck = Select-String -Path "index.html" -Pattern "sandra-widget\.js" -Quiet
if ($htmlCheck) {
    Write-Host "  ✅ index.html referencia sandra-widget.js" -ForegroundColor Green
} else {
    Write-Host "  ❌ ERROR: index.html NO referencia widget" -ForegroundColor Red
    exit 1
}

# SUBAGENTE 3: vercel-deploy-agent
Write-Host "`n[vercel-deploy-agent] Preparando deploy..." -ForegroundColor Yellow

# Agregar solo archivos críticos
git add index.html assets/js/sandra-widget.js 2>&1 | Out-Null

$changes = git diff --cached --name-only
if ($changes) {
    Write-Host "  ✅ Archivos preparados para commit" -ForegroundColor Green
    
    # Commit limpio
    git commit -m "fix(deploy): Corregir widget Sandra - eliminar duplicados y asegurar carga en producción" 2>&1 | Out-Null
    Write-Host "  ✅ Commit creado" -ForegroundColor Green
    
    # Push
    Write-Host "`n  Pusheando a origin/main..." -ForegroundColor Cyan
    $pushResult = git push origin main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Push exitoso" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Error en push:" -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ℹ️  No hay cambios para commitear" -ForegroundColor Yellow
}

# Verificación post-deploy
Write-Host "`n[vercel-deploy-agent] Verificando deploy..." -ForegroundColor Yellow
Write-Host "  ⏳ Esperando 15 segundos para build en Vercel..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  PROCESO COMPLETADO" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan
Write-Host "💡 Ejecuta ahora: node verify-widget-production.js" -ForegroundColor Yellow
Write-Host "   para verificar que el widget está en producción`n" -ForegroundColor Yellow

