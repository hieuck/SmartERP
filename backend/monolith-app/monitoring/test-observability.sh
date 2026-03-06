#!/bin/bash

# Smart ERP - Observability Stack Testing Script
# Tests logging, metrics, and monitoring infrastructure

set -e

echo "🔍 Smart ERP - Observability Stack Testing"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
        return 1
    fi
}

# Test JSON response
test_json_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "")
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC} (Valid JSON)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
        ((FAILED++))
        return 1
    fi
}

# Test Prometheus metrics format
test_metrics() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "^# HELP"; then
        echo -e "${GREEN}✓ PASS${NC} (Valid Prometheus format)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid format)"
        ((FAILED++))
        return 1
    fi
}

echo "📊 Phase 1: Application Endpoints"
echo "-----------------------------------"

# Test application health
test_endpoint "Application Health" "http://localhost:3000/api/health"

# Test metrics endpoint
test_metrics "Application Metrics" "http://localhost:3000/api/metrics"

# Test API endpoints
test_endpoint "API Root" "http://localhost:3000/api"
test_endpoint "Swagger Docs" "http://localhost:3000/api/docs"

echo ""
echo "📈 Phase 2: Monitoring Stack"
echo "----------------------------"

# Test Prometheus
test_endpoint "Prometheus UI" "http://localhost:9090"
test_endpoint "Prometheus Targets" "http://localhost:9090/api/v1/targets"
test_json_endpoint "Prometheus Query API" "http://localhost:9090/api/v1/query?query=up"

# Test Grafana
test_endpoint "Grafana UI" "http://localhost:3001"
test_json_endpoint "Grafana Health" "http://localhost:3001/api/health"

# Test Alertmanager
test_endpoint "Alertmanager UI" "http://localhost:9093"
test_json_endpoint "Alertmanager Status" "http://localhost:9093/api/v1/status"

echo ""
echo "🔧 Phase 3: Exporters"
echo "---------------------"

# Test Node Exporter
test_metrics "Node Exporter" "http://localhost:9100/metrics"

# Test Postgres Exporter
test_metrics "Postgres Exporter" "http://localhost:9187/metrics"

# Test Redis Exporter
test_metrics "Redis Exporter" "http://localhost:9121/metrics"

echo ""
echo "📝 Phase 4: Logging"
echo "-------------------"

# Check log files exist
if [ -d "logs" ]; then
    echo -n "Checking log directory... "
    echo -e "${GREEN}✓ PASS${NC} (Directory exists)"
    ((PASSED++))
    
    # Check for log files
    if ls logs/*.log 1> /dev/null 2>&1; then
        echo -n "Checking log files... "
        echo -e "${GREEN}✓ PASS${NC} (Log files found)"
        ((PASSED++))
    else
        echo -n "Checking log files... "
        echo -e "${YELLOW}⚠ WARN${NC} (No log files yet)"
    fi
else
    echo -n "Checking log directory... "
    echo -e "${YELLOW}⚠ WARN${NC} (Directory not created yet)"
fi

echo ""
echo "🎯 Phase 5: Metrics Validation"
echo "-------------------------------"

# Check for specific metrics
echo -n "Checking HTTP metrics... "
if curl -s "http://localhost:3000/api/metrics" | grep -q "smart_erp_http_requests_total"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking business metrics... "
if curl -s "http://localhost:3000/api/metrics" | grep -q "smart_erp_orders_created_total"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking system metrics... "
if curl -s "http://localhost:3000/api/metrics" | grep -q "smart_erp_process_cpu_seconds_total"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "📊 Test Results"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "🎉 Observability stack is working correctly!"
    echo ""
    echo "Access points:"
    echo "  - Application: http://localhost:3000"
    echo "  - Metrics: http://localhost:3000/api/metrics"
    echo "  - Grafana: http://localhost:3001 (admin/admin)"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Alertmanager: http://localhost:9093"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  1. All services are running (docker-compose ps)"
    echo "  2. Application is started (npm run start:dev)"
    echo "  3. Network connectivity"
    exit 1
fi
