# 🔧 Script de Configuración de Variables de Entorno para IA-SANDRA
# Este script configura SANDRA_REPO_PATH y otras variables necesarias

Write-Host "🚀 Configurando variables de entorno para IA-SANDRA..." -ForegroundColor Cyan

$envFile = ".env"
$currentDir = Get-Location

# Ruta del repo IA-SANDRA (submodule)
$sandraRepoPath = Join-Path $currentDir "IA-SANDRA"

# Verificar si existe el repo
if (Test-Path $sandraRepoPath) {
    Write-Host "✅ Repo IA-SANDRA encontrado en: $sandraRepoPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  Repo IA-SANDRA no encontrado en: $sandraRepoPath" -ForegroundColor Yellow
    Write-Host "   Verificando ubicaciones alternativas..." -ForegroundColor Yellow
    
    # Buscar en ubicaciones alternativas
    $alternativePaths = @(
        "C:\Users\clayt\OneDrive\IA-SANDRA",
        "C:\Users\clayt\Desktop\IA-SANDRA",
        "C:\IA-SANDRA"
    )
    
    foreach ($altPath in $alternativePaths) {
        if (Test-Path $altPath) {
            $sandraRepoPath = $altPath
            Write-Host "✅ Repo IA-SANDRA encontrado en: $sandraRepoPath" -ForegroundColor Green
            break
        }
    }
    
    if (-not (Test-Path $sandraRepoPath)) {
        Write-Host "❌ No se encontró el repo IA-SANDRA. Por favor, clónalo primero." -ForegroundColor Red
        exit 1
    }
}

# Convertir ruta a formato normalizado (sin barras invertidas al final)
$sandraRepoPath = $sandraRepoPath.TrimEnd('\')

Write-Host ""
Write-Host "📝 Configurando SANDRA_REPO_PATH=$sandraRepoPath" -ForegroundColor Cyan

# Leer archivo .env si existe, o crear uno nuevo
$envContentArray = @()
$sandraRepoPathSet = $false

if (Test-Path $envFile) {
    Write-Host "📄 Leyendo archivo .env existente..." -ForegroundColor Cyan
    $envContentArray = Get-Content $envFile
    
    # Verificar si SANDRA_REPO_PATH ya existe
    for ($i = 0; $i -lt $envContentArray.Length; $i++) {
        if ($envContentArray[$i] -match "^SANDRA_REPO_PATH\s*=") {
            $envContentArray[$i] = "SANDRA_REPO_PATH=$sandraRepoPath"
            $sandraRepoPathSet = $true
            Write-Host "✅ Variable SANDRA_REPO_PATH actualizada" -ForegroundColor Green
            break
        }
    }
    
    if (-not $sandraRepoPathSet) {
        $envContentArray += ""
        $envContentArray += "# 🚀 SANDRA ORCHESTRATOR - Ruta al repositorio IA-SANDRA"
        $envContentArray += "SANDRA_REPO_PATH=$sandraRepoPath"
        Write-Host "✅ Variable SANDRA_REPO_PATH agregada" -ForegroundColor Green
    }
} else {
    Write-Host "📄 Creando nuevo archivo .env..." -ForegroundColor Cyan
    $envContentArray = @(
        "# Variables de Entorno - GUESTVALENCIAPWA",
        "",
        "# 🚀 SANDRA ORCHESTRATOR - Ruta al repositorio IA-SANDRA",
        "SANDRA_REPO_PATH=$sandraRepoPath"
    )
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
}

# Escribir archivo .env
$envContentArray | Set-Content $envFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   - Archivo: $envFile" -ForegroundColor White
Write-Host "   - SANDRA_REPO_PATH=$sandraRepoPath" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Reinicia el servidor para aplicar los cambios" -ForegroundColor Yellow
Write-Host ""
