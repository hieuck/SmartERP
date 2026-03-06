#!/bin/bash

# Production Deployment Automation Script
# This script automates the entire deployment process

set -e  # Exit on error

echo "🚀 Smart ERP - Production Deployment"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOY_DIR=$(pwd)
BACKUP_DIR="$DEPLOY_DIR/backups"
LOG_FILE="$DEPLOY_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to print section header
section() {
    log ""
    log "${BLUE}========================================${NC}"
    log "${BLUE}$1${NC}"
    log "${BLUE}========================================${NC}"
}

# Function to handle errors
handle_error() {
    log "${RED}❌ Deployment failed at: $1${NC}"
    log "${YELLOW}Check log file: $LOG_FILE${NC}"
    exit 1
}

# Trap errors
trap 'handle_error "${BASH_COMMAND}"' ERR

# Start deployment
log "${GREEN}Starting deployment at $(date)${NC}"
log "Deployment directory: $DEPLOY_DIR"
log "Log file: $LOG_FILE"

# Phase 1: Pre-deployment validation
section "Phase 1: Pre-deployment Validation"
log "Running pre-deployment checks..."
if [ -f "./scripts/pre-deploy.sh" ]; then
    bash ./scripts/pre-deploy.sh || handle_error "Pre-deployment validation"
    log "${GREEN}✓ Pre-deployment validation passed${NC}"
else
    log "${YELLOW}⚠ Pre-deployment script not found, skipping...${NC}"
fi

# Phase 2: Backup
section "Phase 2: Database Backup"
log "Creating database backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

if [ -f "./scripts/backup.sh" ]; then
    bash ./scripts/backup.sh "$BACKUP_FILE" || handle_error "Database backup"
    log "${GREEN}✓ Database backup created: $BACKUP_FILE${NC}"
else
    log "${YELLOW}⚠ Backup script not found, skipping...${NC}"
fi

# Phase 3: Stop application
section "Phase 3: Stop Application"
log "Stopping application..."

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "smart-erp"; then
        pm2 stop smart-erp || log "${YELLOW}⚠ Failed to stop PM2 process${NC}"
        log "${GREEN}✓ Application stopped (PM2)${NC}"
    else
        log "${YELLOW}⚠ Application not running in PM2${NC}"
    fi
elif command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml down || log "${YELLOW}⚠ Failed to stop Docker containers${NC}"
        log "${GREEN}✓ Application stopped (Docker)${NC}"
    fi
elif command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet smart-erp; then
        sudo systemctl stop smart-erp || log "${YELLOW}⚠ Failed to stop systemd service${NC}"
        log "${GREEN}✓ Application stopped (systemd)${NC}"
    fi
else
    log "${YELLOW}⚠ No process manager found${NC}"
fi

# Phase 4: Update code
section "Phase 4: Update Code"
log "Pulling latest code..."
if [ -d ".git" ]; then
    git pull origin main || handle_error "Git pull"
    log "${GREEN}✓ Code updated${NC}"
else
    log "${YELLOW}⚠ Not a git repository, skipping...${NC}"
fi

# Phase 5: Install dependencies
section "Phase 5: Install Dependencies"
log "Installing dependencies..."
npm ci --production || handle_error "npm install"
log "${GREEN}✓ Dependencies installed${NC}"

# Phase 6: Build application
section "Phase 6: Build Application"
log "Building application..."
npm run build || handle_error "Build"
log "${GREEN}✓ Application built${NC}"

# Phase 7: Run migrations
section "Phase 7: Database Migrations"
log "Running database migrations..."
npm run migration:run || handle_error "Migrations"
log "${GREEN}✓ Migrations completed${NC}"

# Phase 8: Start application
section "Phase 8: Start Application"
log "Starting application..."

if command -v pm2 &> /dev/null; then
    pm2 start dist/main.js --name smart-erp || pm2 restart smart-erp || handle_error "PM2 start"
    pm2 save
    log "${GREEN}✓ Application started (PM2)${NC}"
elif command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml up -d || handle_error "Docker start"
        log "${GREEN}✓ Application started (Docker)${NC}"
    fi
elif command -v systemctl &> /dev/null; then
    sudo systemctl start smart-erp || handle_error "systemd start"
    log "${GREEN}✓ Application started (systemd)${NC}"
else
    log "${RED}❌ No process manager found${NC}"
    handle_error "No process manager"
fi

# Phase 9: Wait for application to start
section "Phase 9: Waiting for Application"
log "Waiting for application to start..."
sleep 10
log "${GREEN}✓ Wait completed${NC}"

# Phase 10: Post-deployment validation
section "Phase 10: Post-deployment Validation"
log "Running post-deployment checks..."
if [ -f "./scripts/post-deploy.sh" ]; then
    bash ./scripts/post-deploy.sh || handle_error "Post-deployment validation"
    log "${GREEN}✓ Post-deployment validation passed${NC}"
else
    log "${YELLOW}⚠ Post-deployment script not found, skipping...${NC}"
fi

# Phase 11: Cleanup
section "Phase 11: Cleanup"
log "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "backup-*.sql" -mtime +7 -delete 2>/dev/null || true
log "${GREEN}✓ Cleanup completed${NC}"

# Deployment complete
section "Deployment Complete"
log "${GREEN}✅ Deployment successful!${NC}"
log ""
log "📊 Deployment Summary:"
log "  Started: $(head -n 1 "$LOG_FILE" | grep -oP '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}' || date)"
log "  Completed: $(date)"
log "  Backup: $BACKUP_FILE"
log "  Log: $LOG_FILE"
log ""
log "🎉 Smart ERP is now running in production!"
log ""
log "Next steps:"
log "  1. Monitor application logs"
log "  2. Check health endpoint: curl http://localhost:3000/health"
log "  3. Verify API: curl http://localhost:3000/api"
log "  4. Review deployment log: cat $LOG_FILE"
log ""

exit 0
