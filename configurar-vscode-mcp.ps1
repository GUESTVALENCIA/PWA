# 🔧 Script de Configuración: VS Code → MCP Server (Render)
# Conecta Visual Studio Code al servidor MCP de Render para usar herramientas con modelos Qwen/Groq

Write-Host "`n🔗 CONFIGURANDO VS CODE PARA MCP SERVER`n" -ForegroundColor Cyan

# Variables
$MCP_SERVER_URL = "https://pwa-imbf.onrender.com"
$MCP_TOKEN = Read-Host "Ingresa tu token de acceso MCP (o presiona Enter para usar el por defecto)"
if ([string]::IsNullOrWhiteSpace($MCP_TOKEN)) {
    $MCP_TOKEN = "sandra_mcp_ultra_secure_2025"
}

# Ruta de configuración de VS Code
$VSCODE_CONFIG_DIR = "$env:APPDATA\Code\User"
$VSCODE_SETTINGS_FILE = "$VSCODE_CONFIG_DIR\settings.json"
$MCP_CONFIG_FILE = "$VSCODE_CONFIG_DIR\mcp-servers.json"

Write-Host "`n📁 Directorio de configuración: $VSCODE_CONFIG_DIR" -ForegroundColor Yellow

# Crear directorio si no existe
if (-not (Test-Path $VSCODE_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $VSCODE_CONFIG_DIR -Force | Out-Null
    Write-Host "✅ Directorio creado" -ForegroundColor Green
}

# Configuración MCP para VS Code
$mcpConfig = @{
    mcpServers = @{
        "sandra-mcp-render" = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-everything"
            )
            env = @{
                MCP_SERVER_URL = $MCP_SERVER_URL
                MCP_TOKEN = $MCP_TOKEN
            }
        }
    }
}

# Alternativa: Configuración HTTP directa (si VS Code soporta HTTP MCP)
$mcpConfigHttp = @{
    mcpServers = @{
        "sandra-mcp-render" = @{
            url = "$MCP_SERVER_URL/api/mcp"
            transport = "http"
            headers = @{
                Authorization = "Bearer $MCP_TOKEN"
            }
        }
    }
}

# Guardar configuración MCP
$mcpConfigJson = $mcpConfigHttp | ConvertTo-Json -Depth 10
$mcpConfigJson | Out-File -FilePath $MCP_CONFIG_FILE -Encoding UTF8 -Force

Write-Host "✅ Configuración MCP guardada en: $MCP_CONFIG_FILE" -ForegroundColor Green

# Crear archivo de configuración alternativa para extensiones MCP
$mcpConfigAlt = @{
    servers = @(
        @{
            name = "sandra-mcp-render"
            url = "$MCP_SERVER_URL/api/mcp"
            type = "http"
            auth = @{
                type = "bearer"
                token = $MCP_TOKEN
            }
            enabled = $true
        }
    )
}

$mcpConfigAltJson = $mcpConfigAlt | ConvertTo-Json -Depth 10
$mcpConfigAltFile = "$VSCODE_CONFIG_DIR\mcp-config.json"
$mcpConfigAltJson | Out-File -FilePath $mcpConfigAltFile -Encoding UTF8 -Force

Write-Host "✅ Configuración alternativa guardada en: $mcpConfigAltFile" -ForegroundColor Green

# Verificar si existe settings.json y agregar configuración MCP
if (Test-Path $VSCODE_SETTINGS_FILE) {
    $settings = Get-Content $VSCODE_SETTINGS_FILE -Raw | ConvertFrom-Json
} else {
    $settings = @{}
}

# Agregar configuración MCP a settings.json
$settings | Add-Member -MemberType NoteProperty -Name "mcp.servers" -Value @{
    "sandra-mcp-render" = @{
        url = "$MCP_SERVER_URL/api/mcp"
        token = $MCP_TOKEN
    }
} -Force

$settingsJson = $settings | ConvertTo-Json -Depth 10
$settingsJson | Out-File -FilePath $VSCODE_SETTINGS_FILE -Encoding UTF8 -Force

Write-Host "✅ Configuración agregada a settings.json" -ForegroundColor Green

# Crear script de prueba
$testScript = @"
# Test MCP Connection
`$MCP_URL = "$MCP_SERVER_URL/api/mcp"
`$TOKEN = "$MCP_TOKEN"

`$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer `$TOKEN"
}

`$body = @{
    method = "initialize"
    params = @{}
} | ConvertTo-Json

try {
    `$response = Invoke-RestMethod -Uri `$MCP_URL -Method Post -Headers `$headers -Body `$body
    Write-Host "✅ Conexión MCP exitosa!" -ForegroundColor Green
    Write-Host (`$response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Error conectando a MCP: `$(`$_.Exception.Message)" -ForegroundColor Red
}
"@

$testScript | Out-File -FilePath "test-mcp-connection.ps1" -Encoding UTF8 -Force

Write-Host "`n✅ Script de prueba creado: test-mcp-connection.ps1" -ForegroundColor Green

Write-Host "`n📋 RESUMEN DE CONFIGURACIÓN:`n" -ForegroundColor Cyan
Write-Host "  Servidor MCP: $MCP_SERVER_URL" -ForegroundColor White
Write-Host "  Token: $MCP_TOKEN" -ForegroundColor White
Write-Host "  Configuración guardada en:" -ForegroundColor White
Write-Host "    - $MCP_CONFIG_FILE" -ForegroundColor Gray
Write-Host "    - $mcpConfigAltFile" -ForegroundColor Gray
Write-Host "    - $VSCODE_SETTINGS_FILE" -ForegroundColor Gray

Write-Host "`n🚀 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow
Write-Host "  1. Reinicia Visual Studio Code" -ForegroundColor White
Write-Host "  2. Instala la extensión 'Model Context Protocol' si no la tienes" -ForegroundColor White
Write-Host "  3. Ejecuta: .\test-mcp-connection.ps1 para probar la conexión" -ForegroundColor White
Write-Host "  4. En VS Code, abre la paleta de comandos (Ctrl+Shift+P)" -ForegroundColor White
Write-Host "  5. Busca 'MCP: Connect to Server' y selecciona 'sandra-mcp-render'" -ForegroundColor White

Write-Host "`n✨ Configuración completada!`n" -ForegroundColor Green

