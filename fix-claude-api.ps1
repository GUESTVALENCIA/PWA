# Script para configurar API key de Claude directamente en VS Code
$apiKey = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")

if ($apiKey) {
    Write-Host "✅ API Key encontrada" -ForegroundColor Green
    
    # Configurar en settings.json del workspace
    $settingsPath = ".vscode\settings.json"
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    
    # Agregar configuración para ambas extensiones de Claude
    $settings | Add-Member -MemberType NoteProperty -Name "anthropic.claude-code.apiKey" -Value $apiKey -Force
    $settings | Add-Member -MemberType NoteProperty -Name "saoudrizwan.claude-dev.apiKey" -Value $apiKey -Force
    
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
    
    Write-Host "✅ API Key configurada en .vscode/settings.json" -ForegroundColor Green
    Write-Host "🔄 Reinicia VS Code para aplicar los cambios" -ForegroundColor Yellow
} else {
    Write-Host "❌ API Key no encontrada en variables de entorno" -ForegroundColor Red
}

