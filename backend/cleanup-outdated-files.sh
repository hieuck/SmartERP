#!/bin/bash

# Cleanup Outdated Files Script
# Purpose: Remove outdated test files, seed data, and debug scripts from microservices refactor
# Date: 26/02/2026

echo "🧹 Starting cleanup of outdated files..."
echo ""

# Counter
DELETED_COUNT=0

# Function to delete file if exists
delete_file() {
    if [ -f "$1" ]; then
        echo "❌ Deleting: $1"
        rm "$1"
        ((DELETED_COUNT++))
    fi
}

# Function to delete directory if exists
delete_dir() {
    if [ -d "$1" ]; then
        echo "❌ Deleting directory: $1"
        rm -rf "$1"
        ((DELETED_COUNT++))
    fi
}

echo "📋 Phase 1: Deleting outdated test/debug scripts in backend root..."
echo ""

# Delete all test/debug scripts in backend root
delete_file "backend/auto-check-system.js"
delete_file "backend/check-admin.js"
delete_file "backend/check-all-schemas.js"
delete_file "backend/check-db-direct.js"
delete_file "backend/check-deleted-products.js"
delete_file "backend/check-inventory-schema.js"
delete_file "backend/check-product-in-db.js"
delete_file "backend/check-products-status.js"
delete_file "backend/check-receipts-schema.js"
delete_file "backend/check-role-permissions.js"
delete_file "backend/check-stocks-columns.js"
delete_file "backend/check-tenant-id.js"
delete_file "backend/clear-redis-cache.js"
delete_file "backend/create-schema.js"
delete_file "backend/debug-products.js"
delete_file "backend/delete-old-admin.js"
delete_file "backend/fix-duplicate-categories.sql"
delete_file "backend/flush-all-redis.js"
delete_file "backend/force-refresh-cache.js"
delete_file "backend/init-db.sql"
delete_file "backend/quick-test.js"
delete_file "backend/restore-deleted-products.js"
delete_file "backend/test-api.js"
delete_file "backend/test-delete-direct-api.js"
delete_file "backend/test-delete-existing.js"
delete_file "backend/test-delete-fresh.js"
delete_file "backend/test-delete-product.js"
delete_file "backend/test-delete-verify-db.js"
delete_file "backend/test-full-flow.js"
delete_file "backend/test-inventory-api.js"
delete_file "backend/test-login.js"
delete_file "backend/test-product-direct.js"
delete_file "backend/test-products-api.js"
delete_file "backend/test-products-direct.js"
delete_file "backend/test-products-response.js"
delete_file "backend/test-runner.js"
delete_file "backend/test-with-timestamp.js"
delete_file "backend/test-with-valid-product.js"
delete_file "backend/verify-data.js"

echo ""
echo "📋 Phase 2: Deleting outdated seed data files..."
echo ""

# Delete seed data files (outdated for microservices)
delete_file "backend/seed-100-part2.txt"
delete_file "backend/seed-all-data.ts"
delete_file "backend/seed-categories.ts"
delete_file "backend/seed-data.js"
delete_file "backend/SEED-DATA.md"
delete_file "backend/seed-products.ts"
delete_file "backend/seed-quick.ts"
delete_file "backend/seed-via-api.ts"

echo ""
echo "📋 Phase 3: Deleting outdated test files from old microservices..."
echo ""

# Delete ALL-PROPERTIES-TEST-SUITE.spec.ts (references old microservices)
delete_file "backend/ALL-PROPERTIES-TEST-SUITE.spec.ts"

# Delete e2e tests (outdated for microservices)
delete_file "backend/e2e/cross-module-integration.e2e.spec.ts"
delete_file "backend/e2e/user-workflows.e2e.spec.ts"
delete_file "backend/e2e/jest-e2e.config.js"
delete_file "backend/e2e/README.md"
delete_dir "backend/e2e"

# Delete security tests (will be rewritten for monolith)
delete_file "backend/security-tests/auth.security.spec.ts"
delete_file "backend/security-tests/injection.security.spec.ts"
delete_file "backend/security-tests/owasp-top10.security.spec.ts"
delete_file "backend/security-tests/xss.security.spec.ts"
delete_file "backend/security-tests/jest.config.js"
delete_file "backend/security-tests/README.md"
delete_dir "backend/security-tests"

# Delete performance tests (will be rewritten for monolith)
delete_file "backend/performance-tests/k6-api-response-time.js"
delete_file "backend/performance-tests/k6-load-test.js"
delete_file "backend/performance-tests/k6-stress-test.js"
delete_file "backend/performance-tests/README.md"
delete_dir "backend/performance-tests"

# Delete tests directory
delete_file "backend/tests/registration-flow.test.ts"
delete_dir "backend/tests"

echo ""
echo "📋 Phase 4: Deleting outdated config files..."
echo ""

# Delete outdated config files
delete_file "backend/services-config.json"
delete_file "backend/load-test.yml"

echo ""
echo "📋 Phase 5: Deleting outdated data files..."
echo ""

# Delete outdated data files
delete_file "backend/data/inventory.db"
delete_dir "backend/data"

echo ""
echo "📋 Phase 6: Deleting test result files..."
echo ""

# Delete test result files
delete_file "backend/order-service/test-results.txt"

echo ""
echo "📋 Phase 7: Cleaning up empty coverage directories..."
echo ""

# Find and delete empty coverage directories
find backend -type d -name "coverage" -empty -exec rm -rf {} + 2>/dev/null || true

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📊 Summary:"
echo "   - Deleted $DELETED_COUNT files/directories"
echo ""
echo "📝 Note: The following are KEPT (still needed):"
echo "   ✅ backend/monolith-app/ - Current monolith application"
echo "   ✅ backend/migrations/ - Database migrations"
echo "   ✅ backend/shared/ - Shared utilities"
echo "   ✅ Old microservices directories (for reference during refactor)"
echo ""
echo "⚠️  Recommendation: After confirming monolith works, delete old microservices:"
echo "   - backend/api-gateway/"
echo "   - backend/auth-service/"
echo "   - backend/product-service/"
echo "   - backend/inventory-service/"
echo "   - backend/order-service/"
echo "   - backend/customer-service/"
echo "   - backend/supplier-service/"
echo "   - backend/payment-service/"
echo "   - backend/report-service/"
echo "   - backend/notification-service/"
echo "   - And all other *-service/ directories"
echo ""
