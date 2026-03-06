#!/bin/bash

# Script to clean up old microservices architecture
# Keep only the monolith-app which is the refactored version

echo "🧹 Cleaning up old microservices..."
echo "⚠️  This will delete all microservice directories"
echo "✅ Keeping: monolith-app (refactored modular monolith)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

echo "🗑️  Removing old microservices..."

# Remove all microservice directories
rm -rf api-gateway/
rm -rf auth-service/
rm -rf audit-service/
rm -rf backup-service/
rm -rf collaboration-service/
rm -rf config-service/
rm -rf crm-service/
rm -rf currency-service/
rm -rf custom-fields-service/
rm -rf customer-service/
rm -rf document-service/
rm -rf email-service/
rm -rf hr-service/
rm -rf import-export-service/
rm -rf integration-service/
rm -rf inventory-service/
rm -rf marketing-service/
rm -rf module-marketplace-service/
rm -rf notification-service/
rm -rf order-service/
rm -rf payment-gateway-service/
rm -rf payment-service/
rm -rf product-service/
rm -rf production-service/
rm -rf report-service/
rm -rf scheduled-jobs-service/
rm -rf search-service/
rm -rf shipping-service/
rm -rf subscription-service/
rm -rf supplier-service/
rm -rf tenant-service/
rm -rf webhook-service/
rm -rf workflow-service/

echo "✅ Cleanup complete!"
echo ""
echo "📁 Remaining structure:"
echo "backend/"
echo "├── monolith-app/     ✅ (Modular Monolith - USE THIS)"
echo "├── shared/           ✅ (Shared utilities)"
echo "├── test/             ✅ (Tests)"
echo "└── migrations/       ✅ (Database migrations)"
echo ""
echo "🚀 Next steps:"
echo "1. cd monolith-app"
echo "2. npm install"
echo "3. npm run start:dev"
