# Script PowerShell Master: Configurar GROQ_API_KEY y corregir TODOS los errores del proyecto
# Ejecuta: .\configurar-y-corregir-todo.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CONFIGURACIÓN Y CORRECCIÓN MASIVA CON VOLTAGENT         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Paso 1: Verificar/Crear GROQ_API_KEY
Write-Host "🔑 PASO 1: Configurar GROQ_API_KEY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

if (-not $env:GROQ_API_KEY) {
    Write-Host "⚠️  GROQ_API_KEY no está configurada" -ForegroundColor Yellow
    Write-Host "`n📋 Para obtener una API key de GROQ:" -ForegroundColor Blue
    Write-Host "   1. Ve a: https://console.groq.com/" -ForegroundColor White
    Write-Host "   2. Crea una cuenta o inicia sesión" -ForegroundColor White
    Write-Host "   3. Ve a 'API Keys' y crea una nueva" -ForegroundColor White
    Write-Host "   4. Copia la key (empieza con gsk_)" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "¿Tienes una API key de GROQ? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        $apiKey = Read-Host "Pega tu GROQ_API_KEY aquí"
        if ($apiKey -and $apiKey.StartsWith("gsk_")) {
            $env:GROQ_API_KEY = $apiKey
            Write-Host "✅ GROQ_API_KEY configurada en esta sesión" -ForegroundColor Green
            Write-Host "💡 Para hacerla permanente, agrega al perfil de PowerShell:" -ForegroundColor Yellow
            Write-Host "   [System.Environment]::SetEnvironmentVariable('GROQ_API_KEY', '$apiKey', 'User')" -ForegroundColor White
        } else {
            Write-Host "❌ API key inválida. Debe empezar con 'gsk_'" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Continuando sin GROQ_API_KEY (algunas funciones pueden no funcionar)" -ForegroundColor Yellow
        Write-Host "   Puedes configurarla después y ejecutar este script de nuevo`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ GROQ_API_KEY ya está configurada" -ForegroundColor Green
    Write-Host "   Key: $($env:GROQ_API_KEY.Substring(0, 10))...`n" -ForegroundColor Gray
}

# Paso 2: Verificar Node.js
Write-Host "`n🔧 PASO 2: Verificar dependencias" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar que el script existe
$scriptPath = Join-Path $PSScriptRoot "corregir-todos-errores-proyecto-voltagent.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script no encontrado: $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Script encontrado: corregir-todos-errores-proyecto-voltagent.js`n" -ForegroundColor Green

# Paso 3: Ejecutar corrección
Write-Host "`n🚀 PASO 3: Ejecutando corrección automática" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "⏳ Esto puede tardar varios minutos..." -ForegroundColor Yellow
Write-Host "   El script escaneará todo el proyecto y corregirá errores`n" -ForegroundColor Gray

try {
    # Cambiar al directorio del proyecto
    Set-Location $PSScriptRoot
    
    # Ejecutar el script de Node.js
    node corregir-todos-errores-proyecto-voltagent.js
    
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "`n✅ Corrección completada exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  El script terminó con código de salida: $exitCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Error ejecutando el script: $_" -ForegroundColor Red
    exit 1
}

# Paso 4: Resumen y próximos pasos
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    PRÓXIMOS PASOS                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📋 Revisa los archivos .corrected generados:" -ForegroundColor Blue
Write-Host "   Get-ChildItem -Recurse -Filter '*.corrected'`n" -ForegroundColor White

Write-Host "✅ Si las correcciones son correctas, reemplaza los originales:" -ForegroundColor Blue
Write-Host "   Get-ChildItem -Recurse -Filter '*.corrected' | ForEach-Object {" -ForegroundColor White
Write-Host "     `$newName = `$_.Name -replace '\.corrected$', '';" -ForegroundColor White
Write-Host "     Move-Item `$_.FullName `$newName -Force" -ForegroundColor White
Write-Host "   }`n" -ForegroundColor White

Write-Host "🧹 Limpia los archivos de backup si todo está bien:" -ForegroundColor Blue
Write-Host "   Get-ChildItem -Recurse -Filter '*.backup' | Remove-Item`n" -ForegroundColor White

Write-Host "📤 Haz commit y push para desplegar a producción:" -ForegroundColor Blue
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Corrección automática de errores con VoltAgent'" -ForegroundColor White
Write-Host "   git push`n" -ForegroundColor White

Write-Host "✨ ¡Proceso completado!`n" -ForegroundColor Green

