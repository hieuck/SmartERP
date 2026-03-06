#!/bin/bash

# Database Backup Script
# Runs daily via cron

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

echo "Starting database backup at $(date)"

# Create backup directory if not exists
mkdir -p ${BACKUP_DIR}

# Perform backup
pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "Backup created successfully: ${BACKUP_FILE}"
    
    # Compress backup
    gzip ${BACKUP_FILE}
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Upload to S3 (if configured)
    if [ ! -z "${AWS_S3_BUCKET}" ]; then
        aws s3 cp ${BACKUP_FILE}.gz s3://${AWS_S3_BUCKET}/backups/
        echo "Backup uploaded to S3"
    fi
    
    # Remove old backups
    find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Old backups removed (older than ${RETENTION_DAYS} days)"
    
    echo "Backup completed successfully at $(date)"
else
    echo "Backup failed at $(date)"
    exit 1
fi
