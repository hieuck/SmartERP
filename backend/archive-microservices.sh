#!/bin/bash

# Script to archive old microservices architecture
# This is safer than deleting - code is moved to archive folder

echo "📦 Archiving old microservices..."
echo "✅ Keeping: monolith-app (refactored modular monolith)"
echo "📁 Moving to: ../archive/old-microservices-$(date +%Y-%m-%d)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

# Create archive directory
ARCHIVE_DIR="../archive/old-microservices-$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Creating archive directory: $ARCHIVE_DIR"
echo ""

echo "🗂️  Moving old microservices..."

# List of services to archive
services=(
    "api-gateway"
    "auth-service"
    "audit-service"
    "backup-service"
    "collaboration-service"
    "config-service"
    "crm-service"
    "currency-service"
    "custom-fields-service"
    "customer-service"
    "document-service"
    "email-service"
    "hr-service"
    "import-export-service"
    "integration-service"
    "inventory-service"
    "marketing-service"
    "module-marketplace-service"
    "notification-service"
    "order-service"
    "payment-gateway-service"
    "payment-service"
    "product-service"
    "production-service"
    "report-service"
    "scheduled-jobs-service"
    "search-service"
    "shipping-service"
    "subscription-service"
    "supplier-service"
    "tenant-service"
    "webhook-service"
    "workflow-service"
)

# Move each service
count=0
for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        mv "$service" "$ARCHIVE_DIR/"
        echo "  ✓ Moved: $service"
        ((count++))
    fi
done

echo ""
echo "✅ Archive complete!"
echo "   Moved $count services to: $ARCHIVE_DIR"
echo ""
echo "📁 Remaining structure:"
echo "backend/"
echo "├── monolith-app/     ✅ (Modular Monolith - USE THIS)"
echo "├── shared/           ✅ (Shared utilities)"
echo "├── test/             ✅ (Tests)"
echo "└── migrations/       ✅ (Database migrations)"
echo ""
echo "📦 Archived:"
echo "$ARCHIVE_DIR/"
echo "└── (33 old microservices)"
echo ""
echo "🚀 Next steps:"
echo "1. cd monolith-app"
echo "2. npm install"
echo "3. npm test  # Should see 431 tests passing"
echo "4. npm run start:dev"
echo ""
echo "💡 To restore (if needed):"
echo "   cp -r $ARCHIVE_DIR/* ."
echo ""
echo "🗑️  To delete archive (after verification):"
echo "   rm -rf $ARCHIVE_DIR"

