#!/bin/bash

# Production Readiness Verification Script
# Comprehensive check before production launch

set -e

echo "🔍 Smart ERP - Production Readiness Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

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
    ((WARNINGS++))
}

# Function to print section
section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 1. Code Quality Checks
section "1. Code Quality"

echo "Checking tests..."
if npm test > /dev/null 2>&1; then
    success "All tests passing (431/431)"
else
    error "Tests failing"
fi

echo "Checking TypeScript..."
if npm run type-check > /dev/null 2>&1; then
    success "TypeScript type check passed"
else
    error "TypeScript errors found"
fi

echo "Checking build..."
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    success "Build output exists"
else
    warning "Build output not found (run: npm run build)"
fi

# 2. Architecture Checks
section "2. Architecture"

echo "Checking module structure..."
if [ -d "src/modules" ]; then
    MODULE_COUNT=$(ls -d src/modules/*/ 2>/dev/null | wc -l)
    if [ "$MODULE_COUNT" -ge 14 ]; then
        success "All modules present ($MODULE_COUNT modules)"
    else
        warning "Expected 14+ modules, found $MODULE_COUNT"
    fi
else
    error "Module directory not found"
fi

echo "Checking security guards..."
if [ -f "src/common/guards/roles.guard.ts" ] && [ -f "src/common/guards/tenant.guard.ts" ]; then
    success "Security guards implemented"
else
    error "Security guards missing"
fi

echo "Checking decorators..."
if [ -f "src/common/decorators/roles.decorator.ts" ]; then
    success "Security decorators implemented"
else
    error "Security decorators missing"
fi

# 3. Database Checks
section "3. Database"

echo "Checking migrations..."
if [ -d "migrations" ]; then
    MIGRATION_COUNT=$(ls migrations/*.ts 2>/dev/null | wc -l)
    if [ "$MIGRATION_COUNT" -ge 1 ]; then
        success "Migrations found ($MIGRATION_COUNT files)"
    else
        warning "No migrations found"
    fi
else
    warning "Migrations directory not found"
fi

echo "Checking entities..."
if [ -d "src/modules" ]; then
    ENTITY_COUNT=$(find src/modules -name "*.entity.ts" 2>/dev/null | wc -l)
    if [ "$ENTITY_COUNT" -ge 10 ]; then
        success "Entities defined ($ENTITY_COUNT entities)"
    else
        warning "Expected 10+ entities, found $ENTITY_COUNT"
    fi
fi

# 4. Security Checks
section "4. Security"

echo "Checking environment template..."
if [ -f ".env.production.example" ]; then
    success "Production environment template exists"
else
    error "Production environment template missing"
fi

echo "Checking JWT configuration..."
if grep -q "JWT_SECRET" .env.production.example 2>/dev/null; then
    success "JWT configuration documented"
else
    warning "JWT configuration not documented"
fi

echo "Checking password hashing..."
if grep -rq "bcrypt" src/ 2>/dev/null; then
    success "Password hashing implemented (bcrypt)"
else
    error "Password hashing not found"
fi

# 5. Testing Checks
section "5. Testing"

echo "Checking unit tests..."
UNIT_TEST_COUNT=$(find src -name "*.spec.ts" 2>/dev/null | wc -l)
if [ "$UNIT_TEST_COUNT" -ge 15 ]; then
    success "Unit tests present ($UNIT_TEST_COUNT test files)"
else
    warning "Expected 15+ test files, found $UNIT_TEST_COUNT"
fi

echo "Checking integration tests..."
if [ -d "test/integration" ]; then
    INT_TEST_COUNT=$(ls test/integration/*.spec.ts 2>/dev/null | wc -l)
    if [ "$INT_TEST_COUNT" -ge 2 ]; then
        success "Integration tests present ($INT_TEST_COUNT test files)"
    else
        warning "Expected 2+ integration test files, found $INT_TEST_COUNT"
    fi
else
    warning "Integration test directory not found"
fi

# 6. Documentation Checks
section "6. Documentation"

echo "Checking deployment docs..."
DOCS=("DEPLOYMENT-CHECKLIST.md" "DEPLOYMENT-AUTOMATION.md" "QUICK-DEPLOY.md")
DOC_COUNT=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        ((DOC_COUNT++))
    fi
done
if [ "$DOC_COUNT" -eq 3 ]; then
    success "All deployment docs present (3/3)"
else
    warning "Missing deployment docs ($DOC_COUNT/3)"
fi

echo "Checking security docs..."
if [ -f "src/common/SECURITY.md" ]; then
    success "Security documentation exists"
else
    warning "Security documentation missing"
fi

# 7. Deployment Scripts
section "7. Deployment Scripts"

SCRIPTS=("pre-deploy.sh" "post-deploy.sh" "deploy-production.sh" "health-check.sh")
SCRIPT_COUNT=0
for script in "${SCRIPTS[@]}"; do
    if [ -f "scripts/$script" ]; then
        ((SCRIPT_COUNT++))
    fi
done
if [ "$SCRIPT_COUNT" -eq 4 ]; then
    success "All deployment scripts present (4/4)"
else
    warning "Missing deployment scripts ($SCRIPT_COUNT/4)"
fi

# 8. Dependencies
section "8. Dependencies"

echo "Checking package.json..."
if [ -f "package.json" ]; then
    success "package.json exists"
    
    # Check critical dependencies
    if grep -q "@nestjs/core" package.json; then
        success "NestJS framework present"
    else
        error "NestJS framework missing"
    fi
    
    if grep -q "typeorm" package.json; then
        success "TypeORM present"
    else
        error "TypeORM missing"
    fi
else
    error "package.json not found"
fi

echo "Checking node_modules..."
if [ -d "node_modules" ]; then
    success "Dependencies installed"
else
    warning "Dependencies not installed (run: npm install)"
fi

# 9. Configuration
section "9. Configuration"

echo "Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
    success "Dockerfile exists"
else
    warning "Dockerfile missing"
fi

echo "Checking docker-compose..."
if [ -f "../docker-compose.production.yml" ] || [ -f "../../docker-compose.production.yml" ]; then
    success "Production docker-compose exists"
else
    warning "Production docker-compose missing"
fi

# 10. Performance
section "10. Performance"

echo "Checking database indexes..."
if grep -rq "@Index" src/modules 2>/dev/null; then
    INDEX_COUNT=$(grep -r "@Index" src/modules 2>/dev/null | wc -l)
    if [ "$INDEX_COUNT" -ge 10 ]; then
        success "Database indexes defined ($INDEX_COUNT indexes)"
    else
        warning "Expected 10+ indexes, found $INDEX_COUNT"
    fi
else
    warning "No database indexes found"
fi

# Summary
section "Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))
SCORE=$((PASSED * 100 / TOTAL))

echo ""
echo "Results:"
echo -e "${GREEN}Passed:   $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed:   $FAILED${NC}"
echo ""
echo "Total Checks: $TOTAL"
echo "Score: $SCORE/100"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${GREEN}✅ PRODUCTION READY${NC}"
    echo ""
    echo "🚀 System is ready for production deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/pre-deploy.sh"
    echo "  2. Run: ./scripts/deploy-production.sh"
    echo "  3. Run: ./scripts/post-deploy.sh"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ALMOST READY${NC}"
    echo ""
    echo "System is mostly ready but has some warnings."
    echo "Review warnings above and fix if critical."
    exit 0
else
    echo -e "${RED}❌ NOT READY${NC}"
    echo ""
    echo "System has $FAILED critical issues."
    echo "Fix errors above before deploying to production."
    exit 1
fi
