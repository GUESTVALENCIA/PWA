# =============================================================================
# 🤝 GALAXY ENTERPRISE - GIT HANDOFF PROTOCOL
# 🚀 GALAXY ENTERPRISE - GIT COMMIT PROTOCOL
# =============================================================================
# Prepara el repositorio para la entrega al agente Jules.
# Prepara el repositorio y realiza el commit de sistema.

Write-Host "`n🚀 INICIANDO PROTOCOLO DE ENTREGA A JULES (GIT HANDOFF)`n" -ForegroundColor Cyan
Write-Host "`n🚀 INICIANDO PROTOCOLO DE COMMIT DE SISTEMA`n" -ForegroundColor Cyan

# 1. Verificar estado
Write-Host "🔍 Verificando estado del repositorio..." -ForegroundColor Yellow
git status

# 2. Añadir todos los cambios (incluyendo limpiezas y reestructuraciones)
Write-Host "`n📦 Staging de todos los archivos (Enterprise Clean)..." -ForegroundColor Yellow
git add .

# 3. Commit de Sistema
$commitMessage = "feat(galaxy): enterprise cleanup & isolation complete

- Estructura de proyecto aislada y centralizada
- Rutas de Render y Vercel configuradas
- Limpieza de código muerto y logs de depuración en index.html
- Inyección de variables de entorno segura
- Preparado para despliegue en producción"

Write-Host "💾 Creando commit de sistema..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ COMMIT EXITOSO." -ForegroundColor Green
    Write-Host "📋 El repositorio local está listo y blindado." -ForegroundColor Cyan
    Write-Host "👉 JULES: Ahora puedes proceder con el 'git push' al remoto oficial." -ForegroundColor Magenta
    Write-Host "👉 LISTO PARA PUSH AL REMOTO OFICIAL." -ForegroundColor Magenta
} else {
    Write-Host "`n⚠️  No hubo cambios para commitear o hubo un error." -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan