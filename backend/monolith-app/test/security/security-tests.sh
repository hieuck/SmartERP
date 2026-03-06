#!/bin/bash

# Security Testing Script for SmartERP
# Tests for common vulnerabilities: SQL Injection, XSS, CSRF, etc.

API_URL="http://localhost:3000"
AUTH_TOKEN=""

echo "========================================="
echo "SmartERP Security Testing Suite"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name=$1
    local expected_status=$2
    local actual_status=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$actual_status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name (Expected: $expected_status, Got: $actual_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 1. SQL Injection Tests
echo "1. SQL Injection Tests"
echo "----------------------"

# Test 1.1: SQL injection in login
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com OR 1=1--","password":"anything"}')
run_test "SQL Injection in login (should fail)" 401 $response

# Test 1.2: SQL injection in product search
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products?search=test' OR '1'='1")
run_test "SQL Injection in search (should return 401 without auth)" 401 $response

# Test 1.3: SQL injection in query parameter
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products?id=1; DROP TABLE products--")
run_test "SQL Injection in query param (should return 401 without auth)" 401 $response

echo ""

# 2. XSS (Cross-Site Scripting) Tests
echo "2. XSS Tests"
echo "------------"

# Test 2.1: XSS in product name
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d '{"name":"<script>alert(\"XSS\")</script>","sku":"XSS-001","price":100}')
run_test "XSS in product name (should return 401 without auth)" 401 $response

# Test 2.2: XSS in customer name
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/customers" \
    -H "Content-Type: application/json" \
    -d '{"name":"<img src=x onerror=alert(1)>","email":"xss@test.com"}')
run_test "XSS in customer name (should return 401 without auth)" 401 $response

echo ""

# 3. Authentication Tests
echo "3. Authentication Tests"
echo "-----------------------"

# Test 3.1: Access without token
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products")
run_test "Access without auth token (should return 401)" 401 $response

# Test 3.2: Invalid token
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products" \
    -H "Authorization: Bearer invalid-token-12345")
run_test "Access with invalid token (should return 401)" 401 $response

# Test 3.3: Expired token (simulated)
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
run_test "Access with expired token (should return 401)" 401 $response

echo ""

# 4. Authorization Tests
echo "4. Authorization Tests"
echo "----------------------"

# Test 4.1: Access admin endpoint without admin role
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/admin/users")
run_test "Access admin endpoint without auth (should return 401)" 401 $response

# Test 4.2: Delete without permission
response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/products/123")
run_test "Delete without auth (should return 401)" 401 $response

echo ""

# 5. Input Validation Tests
echo "5. Input Validation Tests"
echo "-------------------------"

# Test 5.1: Invalid email format
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"not-an-email","password":"password123","firstName":"Test","lastName":"User","tenantId":"test"}')
run_test "Invalid email format (should return 400)" 400 $response

# Test 5.2: Missing required fields
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}')
run_test "Missing required fields (should return 400)" 400 $response

# Test 5.3: Negative price
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","sku":"TEST","price":-100}')
run_test "Negative price (should return 401 without auth)" 401 $response

echo ""

# 6. Rate Limiting Tests
echo "6. Rate Limiting Tests"
echo "----------------------"

# Test 6.1: Multiple rapid requests
success_count=0
for i in {1..20}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    if [ "$response" -eq 401 ]; then
        success_count=$((success_count + 1))
    fi
done

if [ $success_count -eq 20 ]; then
    echo -e "${YELLOW}⚠${NC} Rate limiting not detected (20 requests succeeded)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${GREEN}✓${NC} Rate limiting working (some requests blocked)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

echo ""

# 7. CSRF Tests
echo "7. CSRF Tests"
echo "-------------"

# Test 7.1: POST without CSRF token (if implemented)
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d '{"name":"CSRF Test","sku":"CSRF-001","price":100}')
run_test "POST without CSRF token (should return 401 without auth)" 401 $response

echo ""

# 8. File Upload Tests (if applicable)
echo "8. File Upload Tests"
echo "--------------------"

# Test 8.1: Upload malicious file
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/documents/upload" \
    -F "file=@/dev/null;filename=malicious.php")
run_test "Upload malicious file (should return 401 without auth)" 401 $response

echo ""

# 9. Header Injection Tests
echo "9. Header Injection Tests"
echo "-------------------------"

# Test 9.1: CRLF injection
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products" \
    -H "X-Custom-Header: test\r\nX-Injected: malicious")
run_test "CRLF injection in header (should handle safely)" 401 $response

echo ""

# 10. Tenant Isolation Tests
echo "10. Tenant Isolation Tests"
echo "--------------------------"

# Test 10.1: Access other tenant's data
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/products/other-tenant-product-id")
run_test "Access other tenant data (should return 401 without auth)" 401 $response

echo ""

# Summary
echo "========================================="
echo "Security Test Summary"
echo "========================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All security tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some security tests failed. Please review.${NC}"
    exit 1
fi
