# 🧹 Script de Limpieza de Archivos Obsoletos
# Elimina código muerto, documentación obsoleta y scripts no utilizados

Write-Host "🧹 Iniciando limpieza de archivos obsoletos..." -ForegroundColor Cyan

$deletedCount = 0
$errors = @()

# Categoría 1: Correcciones implementadas
Write-Host "`n📋 Eliminando correcciones ya implementadas..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "CORRECCION_*.md" -File | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Eliminado: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Error eliminando $($_.Name): $_"
        Write-Host "  ❌ Error: $($_.Name)" -ForegroundColor Red
    }
}

# Categoría 2: Fases de desarrollo completadas
Write-Host "`n📋 Eliminando fases de desarrollo completadas..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "FASE_*.md" -File | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Eliminado: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Error eliminando $($_.Name): $_"
        Write-Host "  ❌ Error: $($_.Name)" -ForegroundColor Red
    }
}

# Categoría 3: Estados intermedios obsoletos (mantener solo ESTADO_FINAL_COMPLETO.md y ESTADO_UNIFICACION_FINAL.md)
Write-Host "`n📋 Eliminando estados intermedios obsoletos..." -ForegroundColor Yellow
$estadosAMantener = @("ESTADO_FINAL_COMPLETO.md", "ESTADO_UNIFICACION_FINAL.md", "ESTADO_FINAL_LIMPIEZA.md")
Get-ChildItem -Path . -Filter "ESTADO_*.md" -File | Where-Object { $estadosAMantener -notcontains $_.Name } | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Eliminado: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Error eliminando $($_.Name): $_"
        Write-Host "  ❌ Error: $($_.Name)" -ForegroundColor Red
    }
}

# Resumen
Write-Host "`n📊 RESUMEN DE LIMPIEZA" -ForegroundColor Cyan
Write-Host "  Archivos eliminados: $deletedCount" -ForegroundColor Green
if ($errors.Count -gt 0) {
    Write-Host "  Errores: $($errors.Count)" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
} else {
    Write-Host "  ✅ Sin errores" -ForegroundColor Green
}

Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
