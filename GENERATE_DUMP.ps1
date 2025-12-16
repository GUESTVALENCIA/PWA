<#
.SYNOPSIS
    GENERATE REPO DUMP - Google AI Studio Preparation Tool
    Author: Jules (Staff Software Engineer)
    Version: 1.0.0

.DESCRIPTION
    Ejecuta el script de Node.js para volcar todo el contexto del repositorio
    en un solo archivo 'REPOSITORY_DUMP.txt' listo para Google AI Studio.
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🧠 PREPARANDO CONTEXTO PARA GOOGLE AI STUDIO..." -ForegroundColor Cyan

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js no está instalado o no está en el PATH."
}

# Ejecutar Script
try {
    Write-Host "⏳ Ejecutando extractor..." -ForegroundColor Yellow
    node scripts/generate_repo_dump.js

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✨ PROCESO COMPLETADO." -ForegroundColor Green
        Write-Host "   El archivo 'REPOSITORY_DUMP.txt' está listo en la raíz."
    } else {
        Write-Error "❌ Hubo un error durante la ejecución del script Node.js."
    }
} catch {
    Write-Error "❌ Error inesperado: $_"
}

Write-Host "`nPresiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
