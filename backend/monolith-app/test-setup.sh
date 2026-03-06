#!/bin/bash

echo "🚀 Testing Plaster ERP Monolith Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"

# Check if all required source files exist
echo ""
echo "Checking source files..."

required_files=(
    "src/main.ts"
    "src/app.module.ts"
    "src/common/middleware/tenant.middleware.ts"
    "src/common/middleware/logging.middleware.ts"
    "src/common/decorators/tenant.decorator.ts"
    "src/common/guards/tenant.guard.ts"
    "src/common/entities/base.entity.ts"
    "src/modules/health/health.module.ts"
    "src/modules/auth/auth.module.ts"
    "src/modules/user/user.module.ts"
    "src/modules/product/product.module.ts"
    "src/modules/inventory/inventory.module.ts"
    "src/modules/order/order.module.ts"
    "src/modules/customer/customer.module.ts"
    "src/modules/supplier/supplier.module.ts"
    "src/modules/payment/payment.module.ts"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file NOT FOUND"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo ""
    echo "❌ Some required files are missing"
    exit 1
fi

echo ""
echo "✅ All required files exist"
echo ""
echo "======================================"
echo "✅ Monolith setup verification PASSED"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Copy .env.example to .env and configure"
echo "3. Run 'npm run dev' to start development server"
echo "4. Visit http://localhost:3000/api/docs for API documentation"
