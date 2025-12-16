<#
.SYNOPSIS
    JULES EXECUTIVE SYNC - Enterprise Maintenance Protocol
    Author: Jules (Staff Software Engineer)
    Version: 2.0.0 (No-Chat Edition)

.DESCRIPTION
    Este script es la manifestación de la voluntad de Jules en tu sistema local.
    Realiza limpieza, verificación de integridad, aislamiento de rutas y sincronización git.
    Reemplaza la necesidad de discutir con agentes locales.

.NOTES
    Ejecutar desde la raíz del proyecto.
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🤖 JULES EXECUTIVE PROTOCOL INITIATED..." -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. LIMPIEZA DE BASURA (GARBAGE COLLECTION)
# -----------------------------------------------------------------------------
Write-Host "`n🧹 [1/4] Ejecutando limpieza profunda..." -ForegroundColor Yellow

$garbage = @(
    "start_log.txt",
    "start_log_2.txt",
    "npm-debug.log",
    "yarn-error.log",
    ".DS_Store",
    "Thumbs.db"
)

foreach ($file in $garbage) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   - Eliminado: $file" -ForegroundColor Gray
    }
}

# Limpiar carpetas de logs si existen
if (Test-Path "logs") {
    Get-ChildItem "logs" -Recurse | Remove-Item -Force
    Write-Host "   - Carpeta logs purgada." -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# 2. VERIFICACIÓN DE INTEGRIDAD DE RUTAS (ROUTE ISOLATION CHECK)
# -----------------------------------------------------------------------------
Write-Host "`n🛡️ [2/4] Verificando aislamiento de rutas..." -ForegroundColor Yellow

# Verificar que existan las carpetas críticas
$requiredPaths = @("src", "mcp-server", "assets")
foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        Write-Error "CRITICAL: Falta la carpeta '$path'. La estructura del proyecto está comprometida."
    }
}

# Alerta si hay archivos sueltos en raíz que deberían estar en src (simple check)
$rootFiles = Get-ChildItem -File | Where-Object { $_.Name -match "\.js$" -and $_.Name -notin "server.js", "jest.config.js", "setup-pwa-env.js" }
if ($rootFiles) {
    Write-Host "⚠️ ADVERTENCIA: Archivos JS sueltos en raíz detectados. Deberían moverse a /src o /scripts:" -ForegroundColor Red
    $rootFiles | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Red }
    # Nota: No los movemos automáticamente para no romper referencias, pero avisamos.
} else {
    Write-Host "   - Estructura raíz limpia de scripts JS no autorizados." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 3. SINCRONIZACIÓN GIT (SYNC PROTOCOL)
# -----------------------------------------------------------------------------
Write-Host "`n🔄 [3/4] Sincronizando repositorio..." -ForegroundColor Yellow

# Pull primero para evitar conflictos
Write-Host "   - Bajando cambios de Jules (git pull)..." -ForegroundColor Gray
try {
    git pull origin $(git branch --show-current)
} catch {
    Write-Warning "No se pudo hacer pull. Puede que no haya remoto o haya conflictos."
}

# Estado actual
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   - Cambios locales detectados. Preparando envío..." -ForegroundColor Cyan

    git add .

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "chore(sync): jules executive sync update [$timestamp]"

    git commit -m $commitMsg
    Write-Host "   - Cambios guardados localmente." -ForegroundColor Green

    Write-Host "   - Enviando a remoto (git push)..." -ForegroundColor Cyan
    git push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Sincronización completa." -ForegroundColor Green
    } else {
        Write-Error "❌ Falló el push. Revisa tu conexión o permisos."
    }
} else {
    Write-Host "   - Nada que enviar. El repositorio está limpio." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. REPORTE FINAL
# -----------------------------------------------------------------------------
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ PROTOCOLO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "   Jules ha asegurado tu entorno local."
Write-Host "============================================================" -ForegroundColor Cyan
