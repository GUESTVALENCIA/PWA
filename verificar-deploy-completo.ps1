# Script PowerShell para Verificación Completa del Deploy en Vercel
# Ejecuta verificación automática y muestra resultados

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 VERIFICACIÓN COMPLETA DE DEPLOY EN VERCEL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Node.js está disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js disponible: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Por favor instálalo primero." -ForegroundColor Red
    exit 1
}

# Verificar que el script de verificación existe
if (-not (Test-Path "verificar-deploy-vercel.js")) {
    Write-Host "❌ Script verificar-deploy-vercel.js no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Ejecutando verificación de deploy..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar script de verificación
node verificar-deploy-vercel.js

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    
    # Leer URL de producción si existe
    if (Test-Path "PRODUCTION_URL.txt") {
        $productionUrl = Get-Content "PRODUCTION_URL.txt" -First 1
        Write-Host "🌐 URL de Producción: $productionUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
        Write-Host "   1. Abre la URL en tu navegador" -ForegroundColor White
        Write-Host "   2. Verifica que el widget aparece en la esquina inferior derecha" -ForegroundColor White
        Write-Host "   3. Prueba abrir el chat y hacer una llamada conversacional" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "❌ VERIFICACIÓN FALLÓ" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Acciones recomendadas:" -ForegroundColor Yellow
    Write-Host "   1. Revisa los logs del script anterior" -ForegroundColor White
    Write-Host "   2. Verifica el dashboard de Vercel" -ForegroundColor White
    Write-Host "   3. Espera 2-3 minutos y vuelve a ejecutar este script" -ForegroundColor White
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode

