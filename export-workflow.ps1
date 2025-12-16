# =============================================================================
# 📦 GALAXY ENTERPRISE - WORKFLOW EXPORTER
# =============================================================================
# Copia la inteligencia y herramientas actuales a un nuevo proyecto objetivo.

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

Write-Host "`n🚚 EXPORTANDO PROTOCOLO GALAXY A: $TargetDir" -ForegroundColor Cyan

if (-not (Test-Path $TargetDir)) {
    Write-Host "⚠️  El directorio destino no existe. Creándolo..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$filesToExport = @(
    "GALAXY_ENTERPRISE_MEMORY.md",
    "master-cleanup-workflow.ps1",
    "git-handoff.ps1",
    "deploy-complete.ps1"
)

foreach ($file in $filesToExport) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $TargetDir -Force
        Write-Host "   ✅ Exportado: $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ No encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`n✨ EXPORTACIÓN COMPLETADA." -ForegroundColor Cyan
Write-Host "👉 Ahora abre el nuevo proyecto en VS Code y dime: 'Lee la memoria'." -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Cyan