# Script para configurar variables en Vercel/Railway desde .env.production
$envFile = Get-Content ".env.production" -Raw
$vars = @{}

# Parsear variables
$envFile -split "`n" | ForEach-Object {
    if ($_ -match "^([A-Z_]+)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2].Trim()
        if ($value -and $value -ne "" -and -not $value.StartsWith("#")) {
            $vars[$key] = $value
        }
    }
}

Write-Host "Variables encontradas: $($vars.Count)" -ForegroundColor Green
Write-Host "`nPara Vercel:" -ForegroundColor Cyan
Write-Host "vercel env add VARIABLE_NAME production" -ForegroundColor Yellow
Write-Host "`nPara Railway:" -ForegroundColor Cyan  
Write-Host "railway variables set VARIABLE_NAME=value" -ForegroundColor Yellow
Write-Host "`nVariables listas para configurar:" -ForegroundColor Green
$vars.Keys | ForEach-Object { Write-Host "  $_" }

