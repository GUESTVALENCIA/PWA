# Script para iniciar ngrok con authtoken configurado
# Uso: .\start-ngrok.ps1 [AUTHTOKEN]
# Si no se proporciona authtoken, intenta usar el configurado en ngrok.yml

param(
    [Parameter(Mandatory=$false)]
    [string]$AuthToken
)

# Refrescar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Si se proporciona authtoken, configurarlo
if ($AuthToken) {
    Write-Host "Configurando ngrok con authtoken..." -ForegroundColor Yellow
    ngrok config add-authtoken $AuthToken
}

# Verificar que el servidor MCP está corriendo
$mcpRunning = netstat -ano | findstr :4042
if (-not $mcpRunning) {
    Write-Host "ERROR: Servidor MCP no esta corriendo en puerto 4042" -ForegroundColor Red
    Write-Host "Ejecuta primero: npm run mcp" -ForegroundColor Yellow
    exit 1
}

Write-Host "Iniciando ngrok tunnel en puerto 4042..." -ForegroundColor Green
Write-Host ""

# Iniciar ngrok
ngrok http 4042

