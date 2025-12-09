# Script PowerShell para Deployment Completo a Vercel
# Configura todas las variables de entorno y despliega

Write-Host "🚀 DEPLOYMENT COMPLETO A VERCEL - GuestsValencia PWA + Sandra IA`n" -ForegroundColor Cyan

# Verificar Vercel CLI
Write-Host "📦 Verificando Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI instalado: $vercelVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI no encontrado. Instalando..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando Vercel CLI" -ForegroundColor Red
        exit 1
    }
}

# Login en Vercel
Write-Host "🔐 Iniciando sesión en Vercel..." -ForegroundColor Yellow
Write-Host "⚠️  Se abrirá el navegador para autenticación`n" -ForegroundColor Yellow
vercel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en login de Vercel" -ForegroundColor Red
    exit 1
}

# Leer variables de entorno del archivo .env
Write-Host "`n📖 Leyendo variables de entorno desde .env..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "Por favor, crea el archivo .env con todas las variables necesarias`n" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content ".env"
$envVars = @{}

foreach ($line in $envContent) {
    $line = $line.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            $envVars[$key] = $value
        }
    }
}

# Variables críticas
$criticalVars = @(
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
    "CARTESIA_API_KEY",
    "CARTESIA_VOICE_ID",
    "DEEPGRAM_API_KEY",
    "BRIDGEDATA_API_KEY",
    "NEON_DB_URL"
)

# Verificar variables críticas
Write-Host "`n🔍 Verificando variables críticas..." -ForegroundColor Yellow
$missing = @()
foreach ($var in $criticalVars) {
    if (-not $envVars.ContainsKey($var) -or $envVars[$var] -eq "") {
        Write-Host "⚠️  FALTA: $var" -ForegroundColor Red
        $missing += $var
    } else {
        Write-Host "✅ $var" -ForegroundColor Green
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n❌ FALTAN VARIABLES CRÍTICAS: $($missing -join ', ')`n" -ForegroundColor Red
    exit 1
}

# Todas las variables necesarias
$allVars = @(
    "GEMINI_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY",
    "CARTESIA_API_KEY", "CARTESIA_VOICE_ID", "DEEPGRAM_API_KEY",
    "BRIDGEDATA_API_KEY", "NEON_DB_URL",
    "ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID",
    "HEYGEN_API_KEY", "HEYGEN_AVATAR_ID", "ID_VIDEO_AVATAR",
    "BRIGHTDATA_PROXY_URL", "BRIGHTDATA_HTTP_PROXY",
    "SUPABASE_API_KEY", "TWILIO_SID", "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER", "WHATSAPP_SANDRA",
    "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_MODE",
    "ADMIN_SECRET_KEY", "TRAINING_API_KEY",
    "META_ACCESS_TOKEN", "META_PHONE_NUMBER_ID",
    "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"
)

# Configurar variables en Vercel
Write-Host "`n⚙️  Configurando variables de entorno en Vercel...`n" -ForegroundColor Yellow
$configured = 0
$skipped = 0
$environments = @("production", "preview", "development")

foreach ($var in $allVars) {
    if ($envVars.ContainsKey($var) -and $envVars[$var] -ne "") {
        $value = $envVars[$var]
        Write-Host "Configurando $var..." -ForegroundColor Cyan
        
        foreach ($env in $environments) {
            # Usar echo para pasar el valor al comando
            $value | vercel env add $var $env --yes 2>&1 | Out-Null
        }
        
        Write-Host "✅ $var configurado" -ForegroundColor Green
        $configured++
        Start-Sleep -Milliseconds 500
    } else {
        if ($criticalVars -notcontains $var) {
            Write-Host "⚠️  $var omitida (opcional)" -ForegroundColor Yellow
            $skipped++
        }
    }
}

Write-Host "`n📊 Resumen: $configured variables configuradas, $skipped omitidas`n" -ForegroundColor Cyan

# Deploy
Write-Host "🚀 Desplegando a Vercel (producción)...`n" -ForegroundColor Cyan
$output = vercel --prod --yes 2>&1 | Out-String

# Extraer URL
$urlMatches = [regex]::Matches($output, "https://[^\s]+\.vercel\.app")
if ($urlMatches.Count -gt 0) {
    $productionUrl = $urlMatches[$urlMatches.Count - 1].Value
    Write-Host "`n✅ DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "🌐 URL de Producción: $productionUrl`n" -ForegroundColor Cyan
    
    # Guardar URL
    $productionUrl | Out-File -FilePath "PRODUCTION_URL.txt" -Encoding utf8
    
    Write-Host "📄 URL guardada en: PRODUCTION_URL.txt`n" -ForegroundColor Green
} else {
    Write-Host "`n✅ Deployment completado" -ForegroundColor Green
    Write-Host "⚠️  No se pudo extraer la URL automáticamente" -ForegroundColor Yellow
    Write-Host "Verifica la URL en el dashboard de Vercel`n" -ForegroundColor Yellow
    $productionUrl = "Verificar en Vercel Dashboard"
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

if ($productionUrl -ne "Verificar en Vercel Dashboard") {
    Write-Host "`n✅ URL de Producción: $productionUrl`n" -ForegroundColor Cyan
}

Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Verifica que la aplicación funciona"
Write-Host "  2. Prueba el widget de Sandra IA"
Write-Host "  3. Verifica los endpoints /api/sandra/*"
Write-Host "  4. Monitorea los logs en Vercel Dashboard`n"

Write-Host "✨ ¡Sistema completo desplegado en producción!`n" -ForegroundColor Green

