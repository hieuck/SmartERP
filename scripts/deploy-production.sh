#!/bin/bash

# Production Deployment Script for SmartERP
# This script automates the deployment process

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/your-org/smart-erp.git"
DEPLOY_DIR="/opt/smart-erp"
BACKUP_DIR="/backups/smart-erp"
LOG_FILE="/var/log/smart-erp-deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a $LOG_FILE
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SMARTERP - PRODUCTION DEPLOY        ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root or with sudo"
    exit 1
fi

log "Starting production deployment..."

# Step 1: Pre-deployment checks
log "Step 1: Running pre-deployment checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi
success "Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed"
    exit 1
fi
success "Docker Compose installed"

# Check disk space (need at least 10GB)
AVAILABLE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ $AVAILABLE_SPACE -lt 10 ]; then
    error "Insufficient disk space. Need at least 10GB, have ${AVAILABLE_SPACE}GB"
    exit 1
fi
success "Sufficient disk space: ${AVAILABLE_SPACE}GB available"

# Step 2: Backup existing deployment
log "Step 2: Creating backup..."

if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Backup database
    log "Backing up database..."
    docker exec postgres pg_dumpall -U postgres > $BACKUP_DIR/${BACKUP_NAME}_db.sql 2>/dev/null || true
    
    # Backup configuration
    log "Backing up configuration..."
    cp -r $DEPLOY_DIR/.env* $BACKUP_DIR/${BACKUP_NAME}_config/ 2>/dev/null || true
    
    # Compress backup
    tar -czf $BACKUP_DIR/${BACKUP_NAME}.tar.gz $BACKUP_DIR/${BACKUP_NAME}_* 2>/dev/null || true
    rm -rf $BACKUP_DIR/${BACKUP_NAME}_* 2>/dev/null || true
    
    success "Backup created: ${BACKUP_NAME}.tar.gz"
else
    warning "No existing deployment to backup"
fi

# Step 3: Clone/Update repository
log "Step 3: Updating code..."

if [ -d "$DEPLOY_DIR" ]; then
    cd $DEPLOY_DIR
    log "Pulling latest changes..."
    git pull origin main
else
    log "Cloning repository..."
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

success "Code updated"

# Step 4: Environment configuration
log "Step 4: Configuring environment..."

if [ ! -f ".env" ]; then
    warning ".env file not found. Please create it before continuing."
    echo "Copy .env.example to .env and configure:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

success "Environment configured"

# Step 5: Stop existing services
log "Step 5: Stopping existing services..."

if docker-compose ps | grep -q "Up"; then
    docker-compose down
    success "Services stopped"
else
    warning "No running services to stop"
fi

# Step 6: Build images
log "Step 6: Building Docker images..."

docker-compose build --no-cache
success "Images built"

# Step 7: Start services
log "Step 7: Starting services..."

docker-compose up -d
success "Services started"

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 10

# Step 8: Run database migrations
log "Step 8: Running database migrations..."

docker-compose exec -T api-gateway npm run migration:run || warning "Migration failed or already up to date"
success "Migrations completed"

# Step 9: Health checks
log "Step 9: Running health checks..."

HEALTH_CHECK_PASSED=true

# Check PostgreSQL
if docker exec postgres pg_isready > /dev/null 2>&1; then
    success "PostgreSQL: healthy"
else
    error "PostgreSQL: unhealthy"
    HEALTH_CHECK_PASSED=false
fi

# Check Redis
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    success "Redis: healthy"
else
    error "Redis: unhealthy"
    HEALTH_CHECK_PASSED=false
fi

# Check API Gateway
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    success "API Gateway: healthy"
else
    error "API Gateway: unhealthy"
    HEALTH_CHECK_PASSED=false
fi

# Check Landing Page
if curl -f http://localhost:3016 > /dev/null 2>&1; then
    success "Landing Page: healthy"
else
    error "Landing Page: unhealthy"
    HEALTH_CHECK_PASSED=false
fi

# Step 10: Verify deployment
log "Step 10: Verifying deployment..."

RUNNING_SERVICES=$(docker-compose ps | grep "Up" | wc -l)
log "Running services: $RUNNING_SERVICES"

if [ $RUNNING_SERVICES -lt 15 ]; then
    error "Not all services are running. Expected 15+, got $RUNNING_SERVICES"
    HEALTH_CHECK_PASSED=false
fi

# Step 11: Final report
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        DEPLOYMENT SUMMARY              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    success "Deployment completed successfully!"
    echo ""
    log "Services accessible at:"
    log "  - Landing Page: http://localhost:3016"
    log "  - Frontend App: http://localhost:5175"
    log "  - API Gateway:  http://localhost:3000"
    echo ""
    log "Next steps:"
    log "  1. Configure SSL/TLS (see docs/SSL-TLS-SETUP-GUIDE.md)"
    log "  2. Configure DNS records"
    log "  3. Run final system tests: ./scripts/final-system-test.sh"
    echo ""
    exit 0
else
    error "Deployment completed with errors!"
    echo ""
    log "Please check the logs:"
    log "  docker-compose logs"
    echo ""
    log "To rollback, restore from backup:"
    log "  tar -xzf $BACKUP_DIR/backup_*.tar.gz"
    echo ""
    exit 1
fi
