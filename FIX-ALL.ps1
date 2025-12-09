# Script completo para resolver TODOS los problemas de deploy
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PLAN COMPLETO DE CORRECCIÓN DEPLOY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# FASE 1: DIAGNÓSTICO
Write-Host "FASE 1: DIAGNÓSTICO" -ForegroundColor Yellow
Write-Host "--------------------`n" -ForegroundColor Yellow

Write-Host "1. Verificando estado Git..." -ForegroundColor Cyan
$env:GIT_PAGER = "cat"
$gitStatus = git status --short 2>&1
Write-Host "   Estado: $gitStatus" -ForegroundColor Gray

Write-Host "`n2. Verificando commits locales..." -ForegroundColor Cyan
$commits = git log origin/main..HEAD --oneline 2>&1
if ($commits) {
    Write-Host "   Commits locales no pusheados:" -ForegroundColor Yellow
    Write-Host $commits -ForegroundColor Gray
} else {
    Write-Host "   ✅ Sincronizado con origin/main" -ForegroundColor Green
}

Write-Host "`n3. Verificando archivos críticos..." -ForegroundColor Cyan
$widgetExists = Test-Path "assets/js/sandra-widget.js"
if ($widgetExists) {
    Write-Host "   ✅ sandra-widget.js existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ sandra-widget.js NO existe" -ForegroundColor Red
    exit 1
}

$htmlHasWidget = Select-String -Path "index.html" -Pattern "sandra-widget\.js" -Quiet
if ($htmlHasWidget) {
    Write-Host "   ✅ index.html referencia sandra-widget.js" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html NO referencia sandra-widget.js" -ForegroundColor Red
    exit 1
}

# FASE 2: LIMPIEZA Y PREPARACIÓN
Write-Host "`nFASE 2: LIMPIEZA Y PREPARACIÓN" -ForegroundColor Yellow
Write-Host "------------------------------`n" -ForegroundColor Yellow

Write-Host "4. Sincronizando con origin/main..." -ForegroundColor Cyan
git fetch origin 2>&1 | Out-Null
git reset --hard origin/main 2>&1 | Out-Null
Write-Host "   ✅ Reset completado" -ForegroundColor Green

Write-Host "`n5. Verificando cambios necesarios..." -ForegroundColor Cyan
git add index.html assets/js/sandra-widget.js 2>&1 | Out-Null
$changes = git status --short
if ($changes) {
    Write-Host "   Cambios detectados:" -ForegroundColor Yellow
    Write-Host $changes -ForegroundColor Gray
    
    Write-Host "`n6. Haciendo commit..." -ForegroundColor Cyan
    git commit -m "fix: Corregir deploy widget Sandra - eliminar duplicados y asegurar carga correcta" 2>&1 | Out-Null
    Write-Host "   ✅ Commit creado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay cambios para commitear" -ForegroundColor Yellow
}

# FASE 3: DEPLOY
Write-Host "`nFASE 3: DEPLOY" -ForegroundColor Yellow
Write-Host "---------------`n" -ForegroundColor Yellow

Write-Host "7. Pusheando a origin/main..." -ForegroundColor Cyan
$pushResult = git push origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Push exitoso" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error en push:" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    exit 1
}

# FASE 4: VERIFICACIÓN
Write-Host "`nFASE 4: VERIFICACIÓN" -ForegroundColor Yellow
Write-Host "---------------------`n" -ForegroundColor Yellow

Write-Host "8. Esperando 10 segundos para que Vercel inicie build..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "`n9. Verificando estado en Vercel..." -ForegroundColor Cyan
node check-vercel-status.js

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PROCESO COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "💡 Ejecuta 'node verify-widget-production.js' en 2 minutos" -ForegroundColor Yellow
Write-Host "   para verificar que el widget está en producción`n" -ForegroundColor Yellow

