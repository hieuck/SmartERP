#!/bin/bash

# Archive Old Configuration Files
# These files are duplicates of monolith-app configs

echo "🗄️  Archiving old configuration files..."

# Create archive directory
ARCHIVE_DIR="../archive/old-backend-configs-$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_DIR"

# List of files to archive
FILES_TO_ARCHIVE=(
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "nest-cli.json"
  "jest.config.base.js"
  "Dockerfile"
  "Dockerfile.dev"
)

# Archive each file
for file in "${FILES_TO_ARCHIVE[@]}"; do
  if [ -f "$file" ]; then
    echo "  📦 Archiving $file..."
    mv "$file" "$ARCHIVE_DIR/"
  else
    echo "  ⚠️  $file not found, skipping..."
  fi
done

echo ""
echo "✅ Archive complete!"
echo "📁 Files archived to: $ARCHIVE_DIR"
echo ""
echo "ℹ️  These files were duplicates of monolith-app configs."
echo "ℹ️  All development should use backend/monolith-app/ configs."
echo ""
echo "🔍 To verify monolith-app still works:"
echo "   cd monolith-app"
echo "   npm test"
echo ""
