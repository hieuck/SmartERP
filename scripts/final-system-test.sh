#!/bin/bash

# Final System Test Script
# Tests all critical paths before production launch

echo "🧪 SMARTERP - FINAL SYSTEM TEST"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $response)"
        ((FAILED++))
    fi
}

# Test service health
test_health() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name health... "
    
    response=$(curl -s $url)
    
    if [[ $response == *"ok"* ]] || [[ $response == *"healthy"* ]] || [[ $response == *"UP"* ]]; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ UNHEALTHY${NC}"
        ((FAILED++))
    fi
}

echo "📊 TESTING INFRASTRUCTURE"
echo "-------------------------"

# Test Docker services
echo -n "Checking Docker services... "
running=$(docker-compose ps | grep "Up" | wc -l)
if [ $running -gt 15 ]; then
    echo -e "${GREEN}✓ $running services running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Only $running services running${NC}"
    ((FAILED++))
fi

# Test PostgreSQL
echo -n "Testing PostgreSQL... "
if docker exec postgres pg_isready > /dev/null 2>&1; then
    echo -e "${GREEN}✓ READY${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT READY${NC}"
    ((FAILED++))
fi

# Test Redis
echo -n "Testing Redis... "
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PONG${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NO RESPONSE${NC}"
    ((FAILED++))
fi

echo ""
echo "🌐 TESTING WEB SERVICES"
echo "----------------------"

# Test Landing Page
test_endpoint "Landing Page" "http://localhost:3016" 200
test_endpoint "Pricing Page" "http://localhost:3016/pricing" 200
test_endpoint "Features Page" "http://localhost:3016/features" 200
test_endpoint "Register Page" "http://localhost:3016/register" 200

# Test Frontend
test_endpoint "Frontend App" "http://localhost:5175" 200

echo ""
echo "🔌 TESTING API SERVICES"
echo "----------------------"

# Test API Gateway
test_health "API Gateway" "http://localhost:3000/health"

# Test Auth Service
test_health "Auth Service" "http://localhost:3001/health"

# Test Tenant Service
test_health "Tenant Service" "http://localhost:3002/health"

# Test Subscription Service
test_health "Subscription Service" "http://localhost:3013/health"

# Test Payment Service
test_health "Payment Service" "http://localhost:3014/health"

# Test Email Service
test_health "Email Service" "http://localhost:3015/health"

echo ""
echo "💼 TESTING BUSINESS LOGIC"
echo "------------------------"

# Test Subscription Plans API
echo -n "Testing Subscription Plans API... "
plans=$(curl -s http://localhost:3013/api/v1/plans)
if [[ $plans == *"free"* ]] && [[ $plans == *"basic"* ]]; then
    echo -e "${GREEN}✓ Plans available${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Plans not available${NC}"
    ((FAILED++))
fi

echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System ready for production.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED! Please fix issues before launch.${NC}"
    exit 1
fi
