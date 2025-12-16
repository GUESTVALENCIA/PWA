# =============================================================================
# 🛡️ GALAXY ENTERPRISE - MASTER CLEANUP & ISOLATION WORKFLOW
# =============================================================================
# Este script prepara el entorno local para la separación estricta de proyectos.
# Elimina ruido, caches corruptas y prepara directorios limpios.

Write-Host "`n🚀 INICIANDO PROTOCOLO DE AISLAMIENTO Y LIMPIEZA ENTERPRISE`n" -ForegroundColor Cyan

# 1. Definición de Rutas Base
$ROOT_DIR = $PSScriptRoot
$QUARANTINE_DIR = Join-Path $ROOT_DIR "_QUARANTINE_$(Get-Date -Format 'yyyyMMdd-HHmm')"
$PROJECTS_ROOT = Join-Path $ROOT_DIR "PROJECTS_ISOLATED"

# 1.1 Definición de Mapeo de Proyectos (Local -> Repo)
# Mapeamos las rutas locales proporcionadas a los nombres de repositorio estándar
$SOURCE_MAP = @{
    "guestsvalencia-site"      = "C:\Users\clayt\OneDrive\GUESTVALENCIAPWA"
    "sandra_studio_ultimate"   = "C:\Sandra-IA-8.0-Pro\sandra_studio_ultimate"
    "sandra-pure-core"         = "C:\Sandra-IA-8.0-Pro"
    "mcp-enterprise-server"    = "C:\Sandra-IA-8.0-Pro\mcp-enterprise-server" # Intentaremos localizarlo aquí o crearlo
}

# 2. Crear Estructura de Aislamiento
Write-Host "🏗️  Creando estructura de aislamiento..." -ForegroundColor Yellow
if (-not (Test-Path $PROJECTS_ROOT)) {
    New-Item -ItemType Directory -Path $PROJECTS_ROOT -Force | Out-Null
    Write-Host "✅ Directorio PROJECTS_ISOLATED creado." -ForegroundColor Green
}

if (-not (Test-Path $QUARANTINE_DIR)) {
    New-Item -ItemType Directory -Path $QUARANTINE_DIR -Force | Out-Null
    Write-Host "✅ Directorio de CUARENTENA creado." -ForegroundColor Green
}

# 3. Función de Limpieza Profunda (Deep Clean)
function Invoke-DeepClean {
    param (
        [string]$TargetDir
    )
    
    Write-Host "🧹 Ejecutando limpieza profunda en: $TargetDir" -ForegroundColor Yellow
    
    # Lista de patrones a eliminar (Archivos temporales, logs, caches)
    $patterns = @(
        "node_modules",
        ".next",
        "dist",
        "build",
        ".turbo",
        ".cache",
        "*.log",
        ".DS_Store",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*"
    )

    foreach ($pattern in $patterns) {
        Get-ChildItem -Path $TargetDir -Include $pattern -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
            $itemPath = $_.FullName
            Write-Host "   🗑️ Eliminando: $itemPath" -ForegroundColor Gray
            Remove-Item -Path $itemPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "✨ Limpieza de artefactos temporales completada." -ForegroundColor Green
}

# 4. Detección de Archivos Corruptos (Básico - Tamaño 0 o extensiones conflictivas)
function Scan-CorruptFiles {
    param (
        [string]$TargetDir
    )
    Write-Host "`n🔍 Escaneando posibles archivos corruptos..." -ForegroundColor Yellow
    
    # Buscar archivos de tamaño 0 bytes (a menudo resultado de corrupción)
    Get-ChildItem -Path $TargetDir -Recurse -File | Where-Object { $_.Length -eq 0 } | ForEach-Object {
        $dest = Join-Path $QUARANTINE_DIR $_.Name
        Write-Host "   ⚠️ Archivo vacío detectado (Moviendo a cuarentena): $($_.FullName)" -ForegroundColor Red
        Move-Item -Path $_.FullName -Destination $dest -Force
    }
}

# 5. Migración Inteligente (Enterprise Migration)
function Invoke-Migration {
    Write-Host "`n🚚 INICIANDO MIGRACIÓN A ENTORNOS AISLADOS..." -ForegroundColor Cyan
    
    foreach ($project in $SOURCE_MAP.Keys) {
        $sourcePath = $SOURCE_MAP[$project]
        $destPath = Join-Path $PROJECTS_ROOT $project
        
        Write-Host "   ➡️ Procesando: $project" -ForegroundColor Yellow
        
        if (Test-Path $sourcePath) {
            # Crear destino
            if (-not (Test-Path $destPath)) { New-Item -ItemType Directory -Path $destPath -Force | Out-Null }
            
            # Lógica especial para evitar anidamiento (ej: sandra_studio dentro de sandra-pro)
            $exclude = @("node_modules", ".git", ".next", "dist", "build", "sandra_studio_ultimate", "PROJECTS_ISOLATED", "_QUARANTINE*")
            
            Write-Host "      Copiando desde: $sourcePath" -ForegroundColor Gray
            
            # Usar Robocopy para velocidad y exclusión, o Copy-Item recursivo filtrado
            Get-ChildItem -Path $sourcePath -Exclude $exclude | ForEach-Object {
                $targetItem = Join-Path $destPath $_.Name
                Copy-Item -Path $_.FullName -Destination $targetItem -Recurse -Force -ErrorAction SilentlyContinue
            }
            
            # Inicializar Git limpio si no existe
            if (-not (Test-Path (Join-Path $destPath ".git"))) {
                Write-Host "      🔧 Inicializando repositorio Git limpio..." -ForegroundColor Gray
                git init $destPath | Out-Null
                # Aquí Jules conectará el remote después
            }
            
            # Limpieza post-migración en el destino
            Invoke-DeepClean -TargetDir $destPath
            
        } else {
            Write-Host "      ⚠️ Ruta origen no encontrada: $sourcePath. Creando scaffold vacío." -ForegroundColor Red
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            # Crear README básico
            "Project: $project" | Out-File (Join-Path $destPath "README.md")
        }
    }
}

# 6. Generación de Blueprint para Render (Infrastructure as Code)
function New-RenderBlueprint {
    Write-Host "`n☁️  Generando render.yaml (Blueprint Enterprise)..." -ForegroundColor Cyan
    $renderYamlPath = Join-Path $PROJECTS_ROOT "render.yaml"
    
    $yamlContent = @"
services:
  # 1. PWA (Frontend)
  - type: web
    name: guestsvalencia-site
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 20.x
      - key: API_KEY_RENDER
        value: rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR

  # 2. Sandra Studio (Dashboard)
  - type: web
    name: sandra-studio-ultimate
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: API_KEY_RENDER
        value: rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR

  # 3. MCP Enterprise Server (Backend/AI)
  - type: web
    name: mcp-enterprise-server
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: API_KEY_RENDER
        value: rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR

  # 4. Sandra Pure Core (Logic)
  - type: worker
    name: sandra-pure-core
    env: node
    buildCommand: npm install
    startCommand: npm start
"@
    
    $yamlContent | Out-File -FilePath $renderYamlPath -Encoding UTF8
    Write-Host "✅ Blueprint generado en: $renderYamlPath" -ForegroundColor Green
}

# --- EJECUCIÓN DEL WORKFLOW ---

Invoke-Migration
New-RenderBlueprint

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ FASE 2 COMPLETADA: Proyectos Aislados y Listos." -ForegroundColor Green
Write-Host "📂 Ubicación: $PROJECTS_ROOT" -ForegroundColor Yellow
Write-Host "🚀 SIGUIENTE PASO: Jules puede hacer push a los repositorios." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan