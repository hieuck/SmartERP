#!/bin/bash

# Post-Deployment Validation Script
# This script validates the application after deployment

set -e  # Exit on error

echo "🎉 Smart ERP - Post-Deployment Validation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT=30

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking application is running..."
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    success "Application is running"
else
    error "Application is not responding"
fi
echo ""

echo "2. Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health" 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    success "Health check passed"
else
    error "Health check failed"
fi
echo ""

echo "3. Checking API endpoint..."
if curl -s -f "$API_URL/api" > /dev/null 2>&1; then
    success "API endpoint accessible"
else
    error "API endpoint not accessible"
fi
echo ""

echo "4. Checking database connection..."
DB_RESPONSE=$(curl -s "$API_URL/health" 2>/dev/null || echo "")
if echo "$DB_RESPONSE" | grep -q "database"; then
    success "Database connection verified"
else
    warning "Database connection status unknown"
fi
echo ""

echo "5. Checking response time..."
START_TIME=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
if [ $RESPONSE_TIME -lt 200 ]; then
    success "Response time: ${RESPONSE_TIME}ms (< 200ms)"
else
    warning "Response time: ${RESPONSE_TIME}ms (>= 200ms)"
fi
echo ""

echo "6. Checking authentication endpoint..."
if curl -s -f "$API_URL/api/auth/login" -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    success "Authentication endpoint accessible"
else
    warning "Authentication endpoint returned error (expected for invalid credentials)"
fi
echo ""

echo "7. Checking CORS headers..."
CORS_RESPONSE=$(curl -s -I "$API_URL/api" 2>/dev/null || echo "")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    success "CORS headers present"
else
    warning "CORS headers not found"
fi
echo ""

echo "8. Checking SSL/TLS (if HTTPS)..."
if [[ $API_URL == https://* ]]; then
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        success "SSL/TLS certificate valid"
    else
        error "SSL/TLS certificate invalid"
    fi
else
    warning "Not using HTTPS (development mode)"
fi
echo ""

echo "9. Checking application logs..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "smart-erp"; then
        success "Application running in PM2"
        LOG_ERRORS=$(pm2 logs smart-erp --lines 100 --nostream 2>/dev/null | grep -i "error" | wc -l || echo "0")
        if [ "$LOG_ERRORS" -eq 0 ]; then
            success "No errors in recent logs"
        else
            warning "Found $LOG_ERRORS errors in recent logs"
        fi
    else
        warning "Application not running in PM2"
    fi
else
    warning "PM2 not installed"
fi
echo ""

echo "10. Checking environment..."
if [ -f ".env.production" ]; then
    success "Production environment file exists"
    
    # Check critical variables
    if grep -q "JWT_SECRET" .env.production 2>/dev/null; then
        success "JWT_SECRET configured"
    else
        error "JWT_SECRET not configured"
    fi
    
    if grep -q "DB_HOST" .env.production 2>/dev/null; then
        success "Database configuration found"
    else
        error "Database configuration not found"
    fi
else
    error "Production environment file not found"
fi
echo ""

# Summary
echo "========================================"
echo "Validation Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "❌ Post-deployment validation FAILED"
    echo "Please review the errors above and fix them."
    exit 1
else
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "✅ Post-deployment validation PASSED"
    echo "Application is running successfully!"
    echo ""
    echo "📊 Application Info:"
    echo "  URL: $API_URL"
    echo "  Health: $API_URL/health"
    echo "  API: $API_URL/api"
    echo ""
    echo "🎉 Deployment successful!"
    exit 0
fi
