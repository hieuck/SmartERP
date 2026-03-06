# Automated Backup Script for SmartERP - Windows PowerShell
# Runs daily via Task Scheduler to backup database and files

# Configuration
$BACKUP_DIR = "C:\backups\smart-erp"
$RETENTION_DAYS = 30
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$LOG_FILE = "C:\logs\smart-erp-backup.log"

# Ensure directories exist
$logDir = Split-Path $LOG_FILE -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

# Logging functions
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor Blue
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    Add-Content -Path $LOG_FILE -Value "✓ $Message"
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    Add-Content -Path $LOG_FILE -Value "✗ $Message"
}

Write-Log "Starting automated backup..."

# 1. Backup PostgreSQL databases
Write-Log "Backing up PostgreSQL databases..."
try {
    docker exec postgres pg_dumpall -U postgres > "$BACKUP_DIR\db_$DATE.sql"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database backup completed"
    } else {
        Write-Error-Log "Database backup failed"
        exit 1
    }
} catch {
    Write-Error-Log "Database backup failed: $($_.Exception.Message)"
    exit 1
}

# 2. Backup MinIO data (file storage)
Write-Log "Backing up MinIO data..."
try {
    docker exec minio tar czf - /data > "$BACKUP_DIR\minio_$DATE.tar.gz"
    Write-Success "MinIO backup completed"
} catch {
    Write-Error-Log "MinIO backup failed: $($_.Exception.Message)"
}

# 3. Backup configuration files
Write-Log "Backing up configuration..."
try {
    $configFiles = @(".env", ".env.production", "docker-compose.yml")
    $configBackup = "$BACKUP_DIR\config_$DATE"
    New-Item -ItemType Directory -Path $configBackup -Force | Out-Null
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Copy-Item $file $configBackup -ErrorAction SilentlyContinue
        }
    }
    Write-Success "Configuration backup completed"
} catch {
    Write-Error-Log "Configuration backup failed"
}

# 4. Create combined backup archive
Write-Log "Creating combined backup archive..."
try {
    $backupFiles = @(
        "$BACKUP_DIR\db_$DATE.sql",
        "$BACKUP_DIR\minio_$DATE.tar.gz",
        "$BACKUP_DIR\config_$DATE"
    )
    
    Compress-Archive -Path $backupFiles -DestinationPath "$BACKUP_DIR\backup_$DATE.zip" -Force
    
    # Remove individual files
    Remove-Item "$BACKUP_DIR\db_$DATE.sql" -Force -ErrorAction SilentlyContinue
    Remove-Item "$BACKUP_DIR\minio_$DATE.tar.gz" -Force -ErrorAction SilentlyContinue
    Remove-Item "$BACKUP_DIR\config_$DATE" -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Success "Combined backup created: backup_$DATE.zip"
} catch {
    Write-Error-Log "Failed to create combined backup"
    exit 1
}

# 5. Calculate backup size
$backupFile = Get-Item "$BACKUP_DIR\backup_$DATE.zip"
$backupSizeMB = [math]::Round($backupFile.Length / 1MB, 2)
Write-Log "Backup size: ${backupSizeMB}MB"

# 6. Clean old backups (keep last 30 days)
Write-Log "Cleaning old backups (keeping last $RETENTION_DAYS days)..."
$cutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
    Remove-Item -Force

$remainingBackups = (Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.zip").Count
Write-Log "Remaining backups: $remainingBackups"

# 7. Verify backup integrity
Write-Log "Verifying backup integrity..."
try {
    $testExtract = [System.IO.Compression.ZipFile]::OpenRead("$BACKUP_DIR\backup_$DATE.zip")
    $testExtract.Dispose()
    Write-Success "Backup integrity verified"
} catch {
    Write-Error-Log "Backup integrity check failed"
    exit 1
}

Write-Success "Automated backup completed successfully!"
Write-Log "Backup location: $BACKUP_DIR\backup_$DATE.zip"

exit 0
