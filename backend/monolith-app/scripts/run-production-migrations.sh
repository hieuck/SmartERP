#!/bin/bash

# Run Production Module Migrations
# This script creates tables for molds, BOMs, work orders, and quality checks

set -e

echo "🗄️  Running Production Module Migrations..."

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-erp_production}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Set PGPASSWORD for non-interactive execution
export PGPASSWORD=$DB_PASSWORD

# Check if database exists
echo "📊 Checking database connection..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database $DB_NAME"
    echo "Please ensure PostgreSQL is running and database exists"
    exit 1
fi

echo "✅ Database connection successful"

# Run migrations in order
MIGRATIONS=(
    "001-create-molds-table.sql"
    "002-create-boms-table.sql"
    "003-create-work-orders-table.sql"
    "004-create-quality-checks-table.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo ""
    echo "📝 Running migration: $migration"
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "migrations/production/$migration"; then
        echo "✅ Migration $migration completed successfully"
    else
        echo "❌ Error running migration $migration"
        exit 1
    fi
done

echo ""
echo "🎉 All production module migrations completed successfully!"
echo ""
echo "📊 Verifying tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt molds boms work_orders quality_checks"

echo ""
echo "✅ Production module tables created:"
echo "   - molds"
echo "   - boms"
echo "   - work_orders"
echo "   - quality_checks"
