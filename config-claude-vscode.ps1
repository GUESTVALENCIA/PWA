# Script para configurar Claude Code en VS Code
# Ejecutar: .\config-claude-vscode.ps1

# Leer API key del archivo .env
$envContent = Get-Content .env -Raw
if ($envContent -match "ANTHROPIC_API_KEY=(.+?)(?:\r?\n|$)") {
    $apiKey = $matches[1].Trim()
    
    if ($apiKey -and $apiKey -ne "tu_api_key_aqui" -and $apiKey.StartsWith("sk-ant-")) {
        # Configurar variable de entorno del sistema
        [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $apiKey, "User")
        
        Write-Host "✅ API Key configurada en variables de entorno del sistema" -ForegroundColor Green
        Write-Host "✅ API Key encontrada y configurada: $($apiKey.Substring(0,20))..." -ForegroundColor Green
        Write-Host "🔄 Reinicia VS Code para que la extensión de Claude la detecte" -ForegroundColor Yellow
    } else {
        Write-Host "❌ API Key no válida en .env" -ForegroundColor Red
    }
} else {
    # Intentar leer de variables de entorno del sistema
    $systemKey = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
    if ($systemKey) {
        Write-Host "✅ API Key encontrada en variables de entorno del sistema" -ForegroundColor Green
        Write-Host "✅ Configurando en .env..." -ForegroundColor Yellow
        Add-Content -Path .env -Value "`nANTHROPIC_API_KEY=$systemKey"
        Write-Host "✅ API Key agregada al .env" -ForegroundColor Green
        Write-Host "🔄 Reinicia VS Code para que la extensión de Claude la detecte" -ForegroundColor Yellow
    } else {
        Write-Host "❌ No se encontró ANTHROPIC_API_KEY en .env ni en variables de entorno" -ForegroundColor Red
    }
}

