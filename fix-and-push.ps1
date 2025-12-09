# Script para arreglar y pushear en un solo paso
Write-Host "🔧 Limpiando y preparando push..." -ForegroundColor Cyan

# Resetear al estado remoto
Write-Host "📥 Sincronizando con origin/main..." -ForegroundColor Yellow
git fetch origin
git reset --hard origin/main

# Agregar solo index.html si tiene cambios
Write-Host "📝 Verificando cambios en index.html..." -ForegroundColor Yellow
git add index.html

# Commit simple
Write-Host "💾 Haciendo commit..." -ForegroundColor Yellow
git commit -m "fix: Eliminar carga duplicada del widget Sandra" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit creado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No hay cambios para commitear" -ForegroundColor Yellow
}

# Push directo
Write-Host "🚀 Pusheando a origin/main..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PUSH COMPLETADO" -ForegroundColor Green
    Write-Host "🔗 Verifica el deploy en Vercel en unos segundos" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Error en push" -ForegroundColor Red
    exit 1
}

