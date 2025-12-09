# Script para obtener la URL pública de ngrok desde la API local
# Uso: .\get-ngrok-url.ps1

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
    
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        $tunnel = $response.tunnels[0]
        $publicUrl = $tunnel.public_url
        $localUrl = $tunnel.config.addr
        
        Write-Host "Ngrok Tunnel Activo:" -ForegroundColor Green
        Write-Host "  Public URL:  $publicUrl" -ForegroundColor Cyan
        Write-Host "  Local URL:   $localUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Endpoint MCP para ChatGPT:" -ForegroundColor Yellow
        Write-Host "  $publicUrl/mcp" -ForegroundColor White
        Write-Host ""
        
        # Retornar URL para uso en scripts
        return "$publicUrl/mcp"
    } else {
        Write-Host "No se encontraron túneles activos" -ForegroundColor Red
        Write-Host "Verifica que ngrok este corriendo: ngrok http 4042" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error obteniendo URL de ngrok:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  - Ngrok no esta corriendo" -ForegroundColor Gray
    Write-Host "  - Ngrok requiere authtoken (ejecuta: ngrok config add-authtoken TU_TOKEN)" -ForegroundColor Gray
    Write-Host "  - API de ngrok no disponible en puerto 4040" -ForegroundColor Gray
}

