#!/bin/bash

# SmartERP Production Deployment Script
# Usage: ./deploy-production.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/opt/smart-erp"
BACKUP_DIR="/opt/backups/smart-erp"
DOCKER_COMPOSE_FILE="config/docker/docker-compose.production.yml"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "ℹ️  $1"; }

echo "=========================================="
echo "SmartERP Production Deployment"
echo "Timestamp: $TIMESTAMP"
echo "=========================================="
echo ""

# Pre-flight checks
echo "Step 1: Pre-flight checks..."

if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

for cmd in docker docker-compose git psql curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        print_error "$cmd is not installed"
        exit 1
    fi
done

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory $PROJECT_DIR does not exist"
    exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    exit 1
fi

print_success "Pre-flight checks passed"
echo ""

# Confirmation
echo "Step 2: Deployment confirmation..."
print_warning "You are about to deploy to PRODUCTION"
read -p "Type 'deploy' to confirm: " confirm

if [ "$confirm" != "deploy" ]; then
    print_error "Deployment cancelled"
    exit 0
fi

print_success "Deployment confirmed"
echo ""

# Create backup
echo "Step 3: Creating backup..."
mkdir -p "$BACKUP_DIR"

source .env.production
if [ -n "$DB_HOST" ] && [ -n "$DB_USERNAME" ] && [ -n "$DB_DATABASE" ]; then
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE > "$BACKUP_DIR/database-$TIMESTAMP.sql"
    print_success "Database backup created"
fi

tar -czf "$BACKUP_DIR/app-$TIMESTAMP.tar.gz" --exclude='node_modules' --exclude='dist' --exclude='.git' .
print_success "Application backup created"
echo ""

# Pull latest code
echo "Step 4: Pulling latest code..."
git fetch origin
git checkout main
git pull origin main
print_success "Code updated"
echo ""

# Build Docker images
echo "Step 5: Building Docker images..."
cd src/backend
docker build -t smart-erp-backend:latest -t smart-erp-backend:$TIMESTAMP .
print_success "Backend image built"

cd ../frontend
docker build -t smart-erp-frontend:latest -t smart-erp-frontend:$TIMESTAMP .
print_success "Frontend image built"

cd "$PROJECT_DIR"
echo ""

# Run migrations
echo "Step 6: Running database migrations..."
cd src/backend
npm ci --only=production --silent
npm run migration:show

read -p "Run migrations? (yes/no): " run_migrations
if [ "$run_migrations" == "yes" ]; then
    npm run migration:run
    print_success "Migrations completed"
fi

cd "$PROJECT_DIR"
echo ""

# Deploy
echo "Step 7: Deploying containers..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
sleep 10

print_success "Containers started"
echo ""

# Health checks
echo "Step 8: Running health checks..."
sleep 30

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$BACKEND_HEALTH" == "200" ]; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    exit 1
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_HEALTH" == "200" ]; then
    print_success "Frontend is accessible"
else
    print_error "Frontend check failed"
    exit 1
fi

echo ""

# Summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
print_success "Deployment completed successfully!"
echo ""
echo "Details:"
echo "  - Timestamp: $TIMESTAMP"
echo "  - Commit: $(git rev-parse --short HEAD)"
echo ""
echo "Backups:"
echo "  - Database: $BACKUP_DIR/database-$TIMESTAMP.sql"
echo "  - Application: $BACKUP_DIR/app-$TIMESTAMP.tar.gz"
echo ""
echo "Next Steps:"
echo "  1. Monitor application for 24 hours"
echo "  2. Check error rates in Sentry"
echo "  3. Monitor performance in Grafana"
echo ""
echo "=========================================="
