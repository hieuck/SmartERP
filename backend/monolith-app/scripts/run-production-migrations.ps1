# Run Production Module Migrations (PowerShell)
# This script creates tables for molds, BOMs, work orders, and quality checks

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Running Production Module Migrations..." -ForegroundColor Cyan

# Database connection details
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "erp_production" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }

# Set PGPASSWORD for non-interactive execution
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "📊 Checking database connection..." -ForegroundColor Yellow

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ Error: psql command not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client or use Docker method" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Docker method:" -ForegroundColor Cyan
    Write-Host "  docker-compose exec postgres psql -U postgres -d erp_production -f /path/to/migration.sql" -ForegroundColor Gray
    exit 1
}

# Test connection
try {
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to database $DB_NAME" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running and database exists" -ForegroundColor Yellow
    exit 1
}

# Run migrations in order
$migrations = @(
    "001-create-molds-table.sql",
    "002-create-boms-table.sql",
    "003-create-work-orders-table.sql",
    "004-create-quality-checks-table.sql"
)

foreach ($migration in $migrations) {
    Write-Host ""
    Write-Host "📝 Running migration: $migration" -ForegroundColor Yellow
    
    $migrationPath = "migrations/production/$migration"
    
    try {
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration $migration completed successfully" -ForegroundColor Green
        } else {
            throw "Migration failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "❌ Error running migration $migration" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 All production module migrations completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verifying tables..." -ForegroundColor Yellow
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt molds boms work_orders quality_checks"

Write-Host ""
Write-Host "✅ Production module tables created:" -ForegroundColor Green
Write-Host "   - molds" -ForegroundColor Gray
Write-Host "   - boms" -ForegroundColor Gray
Write-Host "   - work_orders" -ForegroundColor Gray
Write-Host "   - quality_checks" -ForegroundColor Gray
