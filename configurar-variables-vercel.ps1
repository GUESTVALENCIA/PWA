# Script PowerShell para Configurar Variables de Entorno en Vercel
# Ejecuta el script de Node.js para configurar las variables necesarias

Write-Host "🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Verificar que Node.js esté instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Por favor instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar que el script existe
if (-not (Test-Path "configurar-variables-vercel.js")) {
    Write-Host "❌ Script configurar-variables-vercel.js no encontrado" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde el directorio del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Ejecutando script de configuración..." -ForegroundColor Green
Write-Host ""

# Ejecutar el script
node configurar-variables-vercel.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Script ejecutado correctamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Error ejecutando el script" -ForegroundColor Red
    exit $LASTEXITCODE
}

