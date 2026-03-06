#!/bin/bash
# Run All Multi-Tenancy Migrations
# Purpose: Execute all migration scripts in order
# Date: 2026-02-26

set -e  # Exit on error

echo "========================================="
echo "Multi-Tenancy Migration Script"
echo "========================================="
echo ""

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-plaster_erp_main}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Function to run migration
run_migration() {
  local migration_file=$1
  local migration_name=$(basename "$migration_file")
  
  echo "Running migration: $migration_name"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
  
  if [ $? -eq 0 ]; then
    echo "✅ $migration_name completed successfully"
  else
    echo "❌ $migration_name failed"
    exit 1
  fi
  echo ""
}

# Check if database exists
echo "Checking database connection..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Cannot connect to database. Please check connection details."
  exit 1
fi

echo "✅ Database connection successful"
echo ""

# Create backup before migration
echo "Creating backup before migration..."
BACKUP_FILE="backup_before_multi_tenancy_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "❌ Backup failed. Aborting migration."
  exit 1
fi
echo ""

# Run migrations in order
echo "Starting migrations..."
echo ""

run_migration "001_create_tenants_table.sql"
run_migration "002_add_tenant_id_to_core_tables.sql"
run_migration "003_add_tenant_id_to_order_tables.sql"
run_migration "004_add_tenant_id_to_customer_supplier_tables.sql"
run_migration "005_add_tenant_id_to_payment_tables.sql"
run_migration "006_add_tenant_id_to_user_tables.sql"
run_migration "007_add_tenant_id_to_production_tables.sql"
run_migration "008_add_tenant_id_to_hr_tables.sql"
run_migration "009_add_tenant_id_to_notification_tables.sql"
run_migration "010_add_tenant_id_to_report_tables.sql"

echo "========================================="
echo "✅ All migrations completed successfully!"
echo "========================================="
echo ""
echo "Backup file: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "1. Verify data integrity"
echo "2. Update application code to use tenant_id"
echo "3. Test tenant isolation"
echo ""
