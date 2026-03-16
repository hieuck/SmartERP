# Production Deployment Script for SmartERP - Windows PowerShell
# This script automates the deployment process

# Configuration
$REPO_URL = "https://github.com/your-org/smart-erp.git"
$DEPLOY_DIR = "C:\smart-erp"
$BACKUP_DIR = "C:\backups\smart-erp"
$LOG_FILE = "C:\logs\smart-erp-deploy.log"

# Ensure log directory exists
$logDir = Split-Path $LOG_FILE -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Functions
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

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    Add-Content -Path $LOG_FILE -Value "⚠ $Message"
}

# Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   SMARTERP - PRODUCTION DEPLOY        ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

Write-Log "Starting production deployment..."

# Step 1: Pre-deployment checks
Write-Log "Step 1: Running pre-deployment checks..."

# Check Docker
try {
    docker --version | Out-Null
    Write-Success "Docker installed"
} catch {
    Write-Error-Log "Docker is not installed"
    exit 1
}

# Check Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Success "Docker Compose installed"
} catch {
    Write-Error-Log "Docker Compose is not installed"
    exit 1
}

# Check disk space (need at least 10GB)
$drive = Get-PSDrive -Name C
$freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeSpaceGB -lt 10) {
    Write-Error-Log "Insufficient disk space. Need at least 10GB, have ${freeSpaceGB}GB"
    exit 1
}
Write-Success "Sufficient disk space: ${freeSpaceGB}GB available"

# Step 2: Backup existing deployment
Write-Log "Step 2: Creating backup..."

if (Test-Path $DEPLOY_DIR) {
    $backupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    
    # Ensure backup directory exists
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    # Backup database
    Write-Log "Backing up database..."
    try {
        docker exec postgres pg_dumpall -U postgres > "$BACKUP_DIR\${backupName}_db.sql" 2>$null
    } catch {
        Write-Warning-Log "Database backup failed or no database running"
    }
    
    # Backup configuration
    Write-Log "Backing up configuration..."
    try {
        $configBackupDir = "$BACKUP_DIR\${backupName}_config"
        New-Item -ItemType Directory -Path $configBackupDir -Force | Out-Null
        Copy-Item "$DEPLOY_DIR\.env*" $configBackupDir -ErrorAction SilentlyContinue
    } catch {
        Write-Warning-Log "Configuration backup failed"
    }
    
    # Compress backup
    try {
        Compress-Archive -Path "$BACKUP_DIR\${backupName}_*" -DestinationPath "$BACKUP_DIR\${backupName}.zip" -Force
        Remove-Item "$BACKUP_DIR\${backupName}_*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Backup created: ${backupName}.zip"
    } catch {
        Write-Warning-Log "Backup compression failed"
    }
} else {
    Write-Warning-Log "No existing deployment to backup"
}

# Step 3: Clone/Update repository
Write-Log "Step 3: Updating code..."

if (Test-Path $DEPLOY_DIR) {
    Set-Location $DEPLOY_DIR
    Write-Log "Pulling latest changes..."
    git pull origin main
} else {
    Write-Log "Cloning repository..."
    git clone $REPO_URL $DEPLOY_DIR
    Set-Location $DEPLOY_DIR
}

Write-Success "Code updated"

# Step 4: Environment configuration
Write-Log "Step 4: Configuring environment..."

if (-not (Test-Path ".env")) {
    Write-Warning-Log ".env file not found. Please create it before continuing."
    Write-Host "Copy .env.example to .env and configure:"
    Write-Host "  Copy-Item .env.example .env"
    Write-Host "  notepad .env"
    exit 1
}

Write-Success "Environment configured"

# Step 5: Stop existing services
Write-Log "Step 5: Stopping existing services..."

try {
    $runningServices = docker-compose ps | Select-String "Up"
    if ($runningServices) {
        docker-compose down
        Write-Success "Services stopped"
    } else {
        Write-Warning-Log "No running services to stop"
    }
} catch {
    Write-Warning-Log "Error stopping services"
}

# Step 6: Build images
Write-Log "Step 6: Building Docker images..."

docker-compose build --no-cache
if ($LASTEXITCODE -eq 0) {
    Write-Success "Images built"
} else {
    Write-Error-Log "Image build failed"
    exit 1
}

# Step 7: Start services
Write-Log "Step 7: Starting services..."

docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Success "Services started"
} else {
    Write-Error-Log "Service start failed"
    exit 1
}

# Wait for services to be ready
Write-Log "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Step 8: Run database migrations
Write-Log "Step 8: Running database migrations..."

try {
    docker-compose exec -T api-gateway npm run migration:run
    Write-Success "Migrations completed"
} catch {
    Write-Warning-Log "Migration failed or already up to date"
}

# Step 9: Health checks
Write-Log "Step 9: Running health checks..."

$healthCheckPassed = $true

# Check PostgreSQL
try {
    $pgResult = docker exec postgres pg_isready 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL: healthy"
    } else {
        Write-Error-Log "PostgreSQL: unhealthy"
        $healthCheckPassed = $false
    }
} catch {
    Write-Error-Log "PostgreSQL: unhealthy"
    $healthCheckPassed = $false
}

# Check Redis
try {
    $redisResult = docker exec redis redis-cli ping 2>&1
    if ($redisResult -match "PONG") {
        Write-Success "Redis: healthy"
    } else {
        Write-Error-Log "Redis: unhealthy"
        $healthCheckPassed = $false
    }
} catch {
    Write-Error-Log "Redis: unhealthy"
    $healthCheckPassed = $false
}

# Check API Gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "API Gateway: healthy"
    } else {
        Write-Error-Log "API Gateway: unhealthy"
        $healthCheckPassed = $false
    }
} catch {
    Write-Error-Log "API Gateway: unhealthy"
    $healthCheckPassed = $false
}

# Check Landing Page
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3016" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "Landing Page: healthy"
    } else {
        Write-Error-Log "Landing Page: unhealthy"
        $healthCheckPassed = $false
    }
} catch {
    Write-Error-Log "Landing Page: unhealthy"
    $healthCheckPassed = $false
}

# Step 10: Verify deployment
Write-Log "Step 10: Verifying deployment..."

$runningServices = (docker-compose ps | Select-String "Up").Count
Write-Log "Running services: $runningServices"

if ($runningServices -lt 15) {
    Write-Error-Log "Not all services are running. Expected 15+, got $runningServices"
    $healthCheckPassed = $false
}

# Step 11: Final report
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║        DEPLOYMENT SUMMARY              ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

if ($healthCheckPassed) {
    Write-Success "Deployment completed successfully!"
    Write-Host ""
    Write-Log "Services accessible at:"
    Write-Log "  - Landing Page: http://localhost:3016"
    Write-Log "  - Frontend App: http://localhost:80 (production)"
    Write-Log "  - API Gateway:  http://localhost:3000"
    Write-Host ""
    Write-Log "Next steps:"
    Write-Log "  1. Configure SSL/TLS (see docs/SSL-TLS-SETUP-GUIDE.md)"
    Write-Log "  2. Configure DNS records"
    Write-Log "  3. Run final system tests: .\scripts\final-system-test.ps1"
    Write-Host ""
    exit 0
} else {
    Write-Error-Log "Deployment completed with errors!"
    Write-Host ""
    Write-Log "Please check the logs:"
    Write-Log "  docker-compose logs"
    Write-Host ""
    Write-Log "To rollback, restore from backup:"
    Write-Log "  Expand-Archive $BACKUP_DIR\backup_*.zip"
    Write-Host ""
    exit 1
}
