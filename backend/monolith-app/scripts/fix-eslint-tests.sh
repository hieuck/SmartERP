#!/bin/bash

# Script to fix common ESLint issues in test files
# This script focuses on unused variables and explicit any types

echo "🔧 Fixing ESLint issues in test files..."
echo ""

# Run ESLint with auto-fix
echo "1. Running ESLint auto-fix..."
npm run lint -- --fix

echo ""
echo "2. Checking remaining issues..."
npm run lint -- --format compact | grep -E "error|warning" | wc -l

echo ""
echo "✅ ESLint fix complete!"
echo ""
echo "Remaining issues can be fixed manually or deferred to post-launch."
