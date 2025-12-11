# 🔧 Configurar VS Code MCP Local Server
# Servidor MCP que se ejecuta en tu PC para acceder a archivos locales

Write-Host "`n🔗 CONFIGURANDO MCP SERVER LOCAL PARA VS CODE`n" -ForegroundColor Cyan

$VSCODE_CONFIG_DIR = "$env:APPDATA\Code\User"
$MCP_CONFIG_FILE = "$VSCODE_CONFIG_DIR\mcp-servers.json"

# Ruta del servidor MCP local
$MCP_SERVER_PATH = Join-Path $PSScriptRoot "mcp-server-local\index.js"

Write-Host "📁 Ruta del servidor: $MCP_SERVER_PATH" -ForegroundColor Yellow

# Verificar que existe
if (-not (Test-Path $MCP_SERVER_PATH)) {
    Write-Host "❌ Error: No se encuentra el servidor MCP local" -ForegroundColor Red
    Write-Host "   Asegúrate de que existe: $MCP_SERVER_PATH" -ForegroundColor Yellow
    exit 1
}

# Crear configuración MCP para VS Code
$mcpConfig = @{
    mcpServers = @{
        "sandra-local" = @{
            command = "node"
            args = @($MCP_SERVER_PATH)
            env = @{}
        }
    }
}

# Convertir a JSON y guardar
$mcpConfigJson = $mcpConfig | ConvertTo-Json -Depth 10

# Crear directorio si no existe
if (-not (Test-Path $VSCODE_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $VSCODE_CONFIG_DIR -Force | Out-Null
}

# Guardar configuración
$mcpConfigJson | Out-File -FilePath $MCP_CONFIG_FILE -Encoding UTF8 -Force

Write-Host "✅ Configuración guardada en: $MCP_CONFIG_FILE" -ForegroundColor Green

Write-Host "`n📋 CONFIGURACIÓN:`n" -ForegroundColor Cyan
Write-Host "  Servidor: Local (tu PC)" -ForegroundColor White
Write-Host "  Comando: node $MCP_SERVER_PATH" -ForegroundColor White
Write-Host "  Archivo: $MCP_CONFIG_FILE" -ForegroundColor White

Write-Host "`n🚀 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow
Write-Host "  1. Instala dependencias:" -ForegroundColor White
Write-Host "     cd mcp-server-local" -ForegroundColor Gray
Write-Host "     npm install" -ForegroundColor Gray
Write-Host "`n  2. Reinicia Visual Studio Code" -ForegroundColor White
Write-Host "`n  3. Abre paleta de comandos (Ctrl+Shift+P)" -ForegroundColor White
Write-Host "     Busca: 'MCP: Connect to Server'" -ForegroundColor Gray
Write-Host "     Selecciona: 'sandra-local'" -ForegroundColor Gray
Write-Host "`n  4. Ahora los modelos podrán leer archivos de tu escritorio" -ForegroundColor White

Write-Host "`n✨ Configuración completada!`n" -ForegroundColor Green

