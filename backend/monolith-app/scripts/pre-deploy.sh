#!/bin/bash

# Pre-Deployment Validation Script
# This script validates the application before deployment

set -e  # Exit on error

echo "🚀 Smart ERP - Pre-Deployment Validation"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

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

echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]]; then
    success "Node.js version: $NODE_VERSION"
else
    warning "Node.js version: $NODE_VERSION (recommended: v18 or v20)"
fi
echo ""

echo "2. Checking npm version..."
NPM_VERSION=$(npm -v)
success "npm version: $NPM_VERSION"
echo ""

echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    success "Dependencies installed"
else
    error "Dependencies not installed. Run: npm install"
fi
echo ""

echo "4. Checking environment file..."
if [ -f ".env.production" ]; then
    success "Production environment file exists"
else
    warning "Production environment file not found (.env.production)"
fi
echo ""

echo "5. Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    success "TypeScript type check passed"
else
    error "TypeScript type check failed"
fi
echo ""

echo "6. Running unit tests..."
if npm test -- --passWithNoTests > /dev/null 2>&1; then
    success "Unit tests passed"
else
    error "Unit tests failed"
fi
echo ""

echo "7. Building application..."
if npm run build > /dev/null 2>&1; then
    success "Build successful"
else
    error "Build failed"
fi
echo ""

echo "8. Checking build output..."
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    success "Build output verified"
else
    error "Build output not found"
fi
echo ""

echo "9. Checking database configuration..."
if grep -q "DB_HOST" .env.production 2>/dev/null; then
    success "Database configuration found"
else
    warning "Database configuration not found in .env.production"
fi
echo ""

echo "10. Checking JWT secrets..."
if grep -q "JWT_SECRET" .env.production 2>/dev/null; then
    success "JWT secrets configured"
else
    warning "JWT secrets not found in .env.production"
fi
echo ""

# Summary
echo "========================================"
echo "Validation Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "❌ Pre-deployment validation FAILED"
    echo "Please fix the errors above before deploying."
    exit 1
else
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "✅ Pre-deployment validation PASSED"
    echo "Application is ready for deployment!"
    exit 0
fi
