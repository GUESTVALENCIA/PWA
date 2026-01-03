# Script para crear backup del sistema
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backupName = "GUESTVALENCIAPWA_BACKUP_$timestamp"

# Backup 1: En el sistema (carpeta backups)
$backupPath1 = "backups\$backupName"
New-Item -ItemType Directory -Force -Path $backupPath1 | Out-Null
Write-Host "Creando backup en sistema: $backupPath1"

robocopy . $backupPath1 /E /XD node_modules .git backups .cursor /XF *.log /NFL /NDL /NJH /NJS /NP
Write-Host "Backup 1 completado: $backupPath1"

# Backup 2: En el escritorio
$desktop = [Environment]::GetFolderPath('Desktop')
$backupPath2 = "$desktop\$backupName"
New-Item -ItemType Directory -Force -Path $backupPath2 | Out-Null
Write-Host "Creando backup en escritorio: $backupPath2"

robocopy . $backupPath2 /E /XD node_modules .git backups .cursor /XF *.log /NFL /NDL /NJH /NJS /NP
Write-Host "Backup 2 completado: $backupPath2"

Write-Host ""
Write-Host "=== BACKUPS CREADOS EXITOSAMENTE ==="
Write-Host "1. Sistema: $backupPath1"
Write-Host "2. Escritorio: $backupPath2"
