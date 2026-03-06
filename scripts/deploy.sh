#!/bin/bash

# Smart ERP Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}"

echo "=========================================="
echo "Smart ERP Deployment Script"
echo "Environment: ${ENVIRONMENT}"
echo "Timestamp: ${TIMESTAMP}"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error ".env.${ENVIRONMENT} file not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p "${BACKUP_DIR}"
    
    docker-compose exec -T postgres pg_dump -U ${DB_USERNAME} ${DB_DATABASE} > "${BACKUP_DIR}/database.sql"
    
    if [ $? -eq 0 ]; then
        log_info "Database backup created: ${BACKUP_DIR}/database.sql"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd backend
    npm run test
    npm run test:e2e
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    npm run test:e2e
    cd ..
    
    log_info "All tests passed"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    docker-compose -f docker-compose.${ENVIRONMENT}.yml build --no-cache
    
    if [ $? -eq 0 ]; then
        log_info "Docker images built successfully"
    else
        log_error "Docker build failed"
        exit 1
    fi
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    
    log_info "Services stopped"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    if [ $? -eq 0 ]; then
        log_info "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
}

# Run migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T backend npm run migration:run
    
    if [ $? -eq 0 ]; then
        log_info "Migrations completed successfully"
    else
        log_error "Migration failed"
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log_info "Backend health check passed"
            break
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_warn "Health check attempt ${RETRY_COUNT}/${MAX_RETRIES}..."
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        log_error "Health check failed after ${MAX_RETRIES} attempts"
        exit 1
    fi
    
    # Frontend health check
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        log_info "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
}

# Show logs
show_logs() {
    log_info "Showing service logs..."
    docker-compose -f docker-compose.${ENVIRONMENT}.yml logs --tail=50
}

# Rollback
rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Restore database
    if [ -f "${BACKUP_DIR}/database.sql" ]; then
        log_info "Restoring database..."
        docker-compose exec -T postgres psql -U ${DB_USERNAME} ${DB_DATABASE} < "${BACKUP_DIR}/database.sql"
    fi
    
    # Restart services with previous version
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    log_error "Rollback completed"
    exit 1
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    # Set trap for errors
    trap rollback ERR
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Backup database
    backup_database
    
    # Step 3: Run tests (optional, comment out for faster deployment)
    # run_tests
    
    # Step 4: Build images
    build_images
    
    # Step 5: Stop services
    stop_services
    
    # Step 6: Start services
    start_services
    
    # Step 7: Run migrations
    run_migrations
    
    # Step 8: Health check
    health_check
    
    # Step 9: Show logs
    show_logs
    
    log_info "=========================================="
    log_info "Deployment completed successfully!"
    log_info "Backend: http://localhost:3000"
    log_info "Frontend: http://localhost:80"
    log_info "Grafana: http://localhost:3001"
    log_info "=========================================="
}

# Run main function
main
