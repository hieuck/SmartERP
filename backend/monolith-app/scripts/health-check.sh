#!/bin/bash

# Health Check Script
# Quick health check for monitoring systems

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT=5

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Perform health check
RESPONSE=$(curl -s -m $TIMEOUT "$API_URL/health" 2>/dev/null || echo "")

if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} Application is healthy"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 0
else
    echo -e "${RED}✗${NC} Application is unhealthy"
    echo "Response: $RESPONSE"
    exit 1
fi
