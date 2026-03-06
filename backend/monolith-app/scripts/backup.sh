#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

echo "🗄️  Starting database backup..."

# Check if postgres container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ Error: PostgreSQL container is not running!"
    exit 1
fi

# Create backup
echo "📦 Creating backup: $BACKUP_FILE"
docker-compose exec -T postgres pg_dump -U postgres erp_production > $BACKUP_FILE

# Compress backup
echo "🗜️  Compressing backup..."
gzip $BACKUP_FILE

# Get file size
SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📁 File: ${BACKUP_FILE}.gz"
echo "📊 Size: $SIZE"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "✅ Backup process completed!"
