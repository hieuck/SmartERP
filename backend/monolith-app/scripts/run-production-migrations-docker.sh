#!/bin/bash

# Run Production Module Migrations via Docker
# This script runs migrations inside the postgres container

set -e

echo "🗄️  Running Production Module Migrations via Docker..."

# Check if docker-compose is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "Please start docker-compose first:"
    echo "  docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL container is running"

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
    
    if docker-compose exec -T postgres psql -U postgres -d erp_production < "migrations/production/$migration"; then
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
docker-compose exec postgres psql -U postgres -d erp_production -c "\dt molds boms work_orders quality_checks"

echo ""
echo "✅ Production module tables created:"
echo "   - molds"
echo "   - boms"
echo "   - work_orders"
echo "   - quality_checks"
