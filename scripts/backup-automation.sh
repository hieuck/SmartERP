#!/bin/bash

# Automated Backup Script for SmartERP
# Runs daily via cron to backup database and files

set -e

# Configuration
BACKUP_DIR="/backups/smart-erp"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/smart-erp-backup.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a $LOG_FILE
}

log "Starting automated backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. Backup PostgreSQL databases
log "Backing up PostgreSQL databases..."
docker exec postgres pg_dumpall -U postgres | gzip > $BACKUP_DIR/db_$DATE.sql.gz
if [ $? -eq 0 ]; then
    success "Database backup completed"
else
    error "Database backup failed"
    exit 1
fi

# 2. Backup MinIO data (file storage)
log "Backing up MinIO data..."
docker exec minio tar czf - /data > $BACKUP_DIR/minio_$DATE.tar.gz
if [ $? -eq 0 ]; then
    success "MinIO backup completed"
else
    error "MinIO backup failed"
fi

# 3. Backup configuration files
log "Backing up configuration..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz \
    .env* \
    docker-compose.yml \
    nginx.conf \
    2>/dev/null || true
success "Configuration backup completed"

# 4. Create combined backup archive
log "Creating combined backup archive..."
tar czf $BACKUP_DIR/backup_$DATE.tar.gz \
    $BACKUP_DIR/db_$DATE.sql.gz \
    $BACKUP_DIR/minio_$DATE.tar.gz \
    $BACKUP_DIR/config_$DATE.tar.gz

# Remove individual files
rm -f $BACKUP_DIR/db_$DATE.sql.gz
rm -f $BACKUP_DIR/minio_$DATE.tar.gz
rm -f $BACKUP_DIR/config_$DATE.tar.gz

success "Combined backup created: backup_$DATE.tar.gz"

# 5. Calculate backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.tar.gz | cut -f1)
log "Backup size: $BACKUP_SIZE"

# 6. Clean old backups (keep last 30 days)
log "Cleaning old backups (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | wc -l)
log "Remaining backups: $REMAINING"

# 7. Verify backup integrity
log "Verifying backup integrity..."
if tar tzf $BACKUP_DIR/backup_$DATE.tar.gz > /dev/null 2>&1; then
    success "Backup integrity verified"
else
    error "Backup integrity check failed"
    exit 1
fi

# 8. Send notification (optional)
# Uncomment to enable email notifications
# echo "Backup completed successfully: backup_$DATE.tar.gz ($BACKUP_SIZE)" | \
#     mail -s "SmartERP Backup Success" admin@smart-erp.com

success "Automated backup completed successfully!"
log "Backup location: $BACKUP_DIR/backup_$DATE.tar.gz"

exit 0
