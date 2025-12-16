# Script PowerShell para iniciar servidor MCP y ejecutar tests
# Uso: .\start-and-test.ps1

Write-Host "`nINICIANDO SERVIDOR MCP Y EJECUTANDO TESTS`n" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "index.js")) {
    Write-Host "Error: index.js no encontrado. Asegurate de estar en el directorio mcp-server" -ForegroundColor Red
    exit 1
}

# Verificar variables de entorno
if (-not (Test-Path ".env.production")) {
    Write-Host "Advertencia: .env.production no encontrado. Usando .env.production.example" -ForegroundColor Yellow
    if (Test-Path ".env.production.example") {
        Copy-Item ".env.production.example" ".env" -Force
        Write-Host "Creado .env desde .env.production.example" -ForegroundColor Green
    }
}

# Iniciar servidor en segundo plano
Write-Host "`nIniciando servidor MCP en segundo plano..." -ForegroundColor Cyan
$serverProcess = Start-Process -FilePath "node" -ArgumentList "index.js" -WindowStyle Hidden -PassThru
Write-Host "Servidor iniciado (PID: $($serverProcess.Id))" -ForegroundColor Green

# Esperar a que el servidor este listo
Write-Host "`nEsperando a que el servidor este listo..." -ForegroundColor Cyan
$maxAttempts = 15
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4042/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "Servidor listo despues de $($attempt * 2) segundos" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Intento $attempt/$maxAttempts..." -ForegroundColor Yellow
    }
}

if (-not $ready) {
    Write-Host "`nEl servidor no respondio despues de $($maxAttempts * 2) segundos" -ForegroundColor Red
    Write-Host "Verifica los logs del servidor para mas detalles" -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Ejecutar tests
Write-Host "`nEjecutando tests completos...`n" -ForegroundColor Cyan
node test-mcp-complete.js
$testResult = $LASTEXITCODE

# Limpiar
Write-Host "`nDeteniendo servidor..." -ForegroundColor Cyan
Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servidor detenido`n" -ForegroundColor Green

# Resultado final
if ($testResult -eq 0) {
    Write-Host "TODOS LOS TESTS PASARON" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Algunos tests fallaron. Revisa los resultados arriba." -ForegroundColor Yellow
    exit $testResult
}
