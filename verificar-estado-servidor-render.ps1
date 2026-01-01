# Script para verificar el estado del servidor MCP en Render
# Verifica qué variables están configuradas y qué proveedores funcionan

$serverUrl = "https://pwa-imbf.onrender.com"
$tokens = @(
    "sandra_mcp_ultra_secure_2025",
    "cursor_mcp_token",
    "claude_mcp_token"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " VERIFICACIÓN SERVIDOR MCP - RENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Intentar health check sin autenticación
Write-Host "1. Verificando health check (sin auth)..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$serverUrl/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Servidor respondiendo" -ForegroundColor Green
    Write-Host "   Status: $($health.StatusCode)" -ForegroundColor Gray
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "   Environment: $($healthData.environment)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Health check requiere autenticación" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Intentar con diferentes tokens
Write-Host ""
Write-Host "2. Intentando diagnóstico con tokens..." -ForegroundColor Yellow

$diagnoseWorked = $false
foreach ($token in $tokens) {
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
            'Content-Type' = 'application/json'
        }
        $diagnose = Invoke-WebRequest -Uri "$serverUrl/api/voice/diagnose" -Headers $headers -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✅ Diagnóstico exitoso con token: $($token.Substring(0, 10))..." -ForegroundColor Green
        $diagnoseData = $diagnose.Content | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "   RESULTADO DEL DIAGNÓSTICO:" -ForegroundColor Cyan
        Write-Host "   ==========================" -ForegroundColor Cyan
        Write-Host "   Entorno: $($diagnoseData.environment)" -ForegroundColor White
        Write-Host "   Proveedor preferido: $($diagnoseData.preferredProvider)" -ForegroundColor White
        Write-Host ""
        Write-Host "   Proveedores configurados: $($diagnoseData.summary.totalConfigured)" -ForegroundColor White
        Write-Host "   Proveedores funcionando: $($diagnoseData.summary.totalWorking)" -ForegroundColor $(if ($diagnoseData.summary.totalWorking -gt 0) { "Green" } else { "Red" })
        Write-Host "   Estado: $(if ($diagnoseData.summary.hasWorkingProvider) { '✅ OK' } else { '❌ ERROR' })" -ForegroundColor $(if ($diagnoseData.summary.hasWorkingProvider) { "Green" } else { "Red" })
        Write-Host ""
        Write-Host "   DETALLES:" -ForegroundColor Cyan
        
        # Groq
        Write-Host "   GROQ:" -ForegroundColor Yellow
        Write-Host "   - Configurado: $(if ($diagnoseData.providers.groq.configured) { '✅' } else { '❌' })" -ForegroundColor $(if ($diagnoseData.providers.groq.configured) { "Green" } else { "Red" })
        if ($diagnoseData.providers.groq.configured) {
            Write-Host "   - Key: $($diagnoseData.providers.groq.keyPrefix) ($($diagnoseData.providers.groq.keyLength) chars)" -ForegroundColor Gray
            if ($diagnoseData.providers.groq.tested) {
                Write-Host "   - Estado: $(if ($diagnoseData.providers.groq.working) { '✅ Funcionando' } else { '❌ Fallando' })" -ForegroundColor $(if ($diagnoseData.providers.groq.working) { "Green" } else { "Red" })
                if ($diagnoseData.providers.groq.error) {
                    Write-Host "   - Error: $($diagnoseData.providers.groq.error)" -ForegroundColor Red
                }
            }
        }
        
        # OpenAI
        Write-Host "   OPENAI:" -ForegroundColor Yellow
        Write-Host "   - Configurado: $(if ($diagnoseData.providers.openai.configured) { '✅' } else { '❌' })" -ForegroundColor $(if ($diagnoseData.providers.openai.configured) { "Green" } else { "Red" })
        if ($diagnoseData.providers.openai.configured) {
            Write-Host "   - Key: $($diagnoseData.providers.openai.keyPrefix) ($($diagnoseData.providers.openai.keyLength) chars)" -ForegroundColor Gray
            if ($diagnoseData.providers.openai.tested) {
                Write-Host "   - Estado: $(if ($diagnoseData.providers.openai.working) { '✅ Funcionando' } else { '❌ Fallando' })" -ForegroundColor $(if ($diagnoseData.providers.openai.working) { "Green" } else { "Red" })
                if ($diagnoseData.providers.openai.error) {
                    Write-Host "   - Error: $($diagnoseData.providers.openai.error)" -ForegroundColor Red
                }
            }
        }
        
        # Gemini
        Write-Host "   GEMINI:" -ForegroundColor Yellow
        Write-Host "   - Configurado: $(if ($diagnoseData.providers.gemini.configured) { '✅' } else { '❌' })" -ForegroundColor $(if ($diagnoseData.providers.gemini.configured) { "Green" } else { "Red" })
        if ($diagnoseData.providers.gemini.configured) {
            Write-Host "   - Key: $($diagnoseData.providers.gemini.keyPrefix) ($($diagnoseData.providers.gemini.keyLength) chars)" -ForegroundColor Gray
            if ($diagnoseData.providers.gemini.tested) {
                Write-Host "   - Estado: $(if ($diagnoseData.providers.gemini.working) { '✅ Funcionando' } else { '❌ Fallando' })" -ForegroundColor $(if ($diagnoseData.providers.gemini.working) { "Green" } else { "Red" })
                if ($diagnoseData.providers.gemini.error) {
                    Write-Host "   - Error: $($diagnoseData.providers.gemini.error)" -ForegroundColor Red
                }
            }
        }
        
        # Deepgram
        Write-Host "   DEEPGRAM:" -ForegroundColor Yellow
        Write-Host "   - Configurado: $(if ($diagnoseData.deepgram.configured) { '✅' } else { '❌' })" -ForegroundColor $(if ($diagnoseData.deepgram.configured) { "Green" } else { "Red" })
        
        Write-Host ""
        Write-Host "   RECOMENDACIÓN:" -ForegroundColor Cyan
        Write-Host "   $($diagnoseData.summary.recommendation)" -ForegroundColor White
        
        $diagnoseWorked = $true
        break
    } catch {
        # Continuar con el siguiente token
    }
}

if (-not $diagnoseWorked) {
    Write-Host "   ❌ No se pudo obtener diagnóstico" -ForegroundColor Red
    Write-Host "   Posibles causas:" -ForegroundColor Yellow
    Write-Host "   - El endpoint /api/voice/diagnose no está disponible" -ForegroundColor Gray
    Write-Host "   - El código no está actualizado en Render" -ForegroundColor Gray
    Write-Host "   - Se requiere un token diferente" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   ACCIÓN REQUERIDA:" -ForegroundColor Cyan
    Write-Host "   1. Verifica que el código esté desplegado en Render" -ForegroundColor White
    Write-Host "   2. Verifica las variables de entorno en Render Dashboard" -ForegroundColor White
    Write-Host "   3. Reinicia el servicio después de configurar variables" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FIN DE VERIFICACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
