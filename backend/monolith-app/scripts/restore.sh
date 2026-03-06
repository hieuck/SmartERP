#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore.sh <backup-file>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Backup file not specified!"
    echo "Usage: ./scripts/restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Check if postgres container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ Error: PostgreSQL container is not running!"
    exit 1
fi

# Stop app to prevent connections
echo "🛑 Stopping application..."
docker-compose stop app

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "🗜️  Decompressing backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
    BACKUP_FILE=$TEMP_FILE
fi

# Drop and recreate database
echo "🗑️  Dropping existing database..."
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS erp_production;"
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE erp_production;"

# Restore backup
echo "📦 Restoring backup..."
cat $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres erp_production

# Clean up temp file
if [ -n "$TEMP_FILE" ]; then
    rm $TEMP_FILE
fi

# Start app
echo "▶️  Starting application..."
docker-compose start app

# Wait for health check
echo "⏳ Waiting for application to be healthy..."
sleep 5

for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Restore completed successfully!"
        exit 0
    fi
    echo "Attempt $i/30..."
    sleep 2
done

echo "⚠️  Warning: Health check failed, but restore may have succeeded"
echo "Check logs: docker-compose logs app"
