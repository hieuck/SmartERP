# Final System Test Script - Windows PowerShell
# Tests all critical paths before production launch

Write-Host "🧪 SMARTERP - FINAL SYSTEM TEST" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$PASSED = 0
$FAILED = 0

# Test function for endpoints
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedCode
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq $ExpectedCode) {
            Write-Host "✓ PASSED (HTTP $($response.StatusCode))" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ FAILED (Expected $ExpectedCode, got $($response.StatusCode))" -ForegroundColor Red
            $script:FAILED++
        }
    } catch {
        Write-Host "✗ FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:FAILED++
    }
}

# Test service health
function Test-Health {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Testing $Name health... " -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 5
        $responseText = $response | ConvertTo-Json
        
        if ($responseText -match "ok|healthy|UP") {
            Write-Host "✓ HEALTHY" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ UNHEALTHY" -ForegroundColor Red
            $script:FAILED++
        }
    } catch {
        Write-Host "✗ UNHEALTHY (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:FAILED++
    }
}

Write-Host "📊 TESTING INFRASTRUCTURE" -ForegroundColor Yellow
Write-Host "-------------------------"

# Test Docker services
Write-Host "Checking Docker services... " -NoNewline
try {
    $running = (docker-compose ps | Select-String "Up").Count
    if ($running -gt 15) {
        Write-Host "✓ $running services running" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Only $running services running" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Docker not available" -ForegroundColor Red
    $FAILED++
}

# Test PostgreSQL
Write-Host "Testing PostgreSQL... " -NoNewline
try {
    $pgResult = docker exec postgres pg_isready 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ READY" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ NOT READY" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ NOT READY" -ForegroundColor Red
    $FAILED++
}

# Test Redis
Write-Host "Testing Redis... " -NoNewline
try {
    $redisResult = docker exec redis redis-cli ping 2>&1
    if ($redisResult -match "PONG") {
        Write-Host "✓ PONG" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ NO RESPONSE" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ NO RESPONSE" -ForegroundColor Red
    $FAILED++
}

Write-Host ""
Write-Host "🌐 TESTING WEB SERVICES" -ForegroundColor Yellow
Write-Host "----------------------"

# Test Landing Page
Test-Endpoint -Name "Landing Page" -Url "http://localhost:3016" -ExpectedCode 200
Test-Endpoint -Name "Pricing Page" -Url "http://localhost:3016/pricing" -ExpectedCode 200
Test-Endpoint -Name "Features Page" -Url "http://localhost:3016/features" -ExpectedCode 200
Test-Endpoint -Name "Register Page" -Url "http://localhost:3016/register" -ExpectedCode 200

# Test Frontend
Test-Endpoint -Name "Frontend App" -Url "http://localhost:5175" -ExpectedCode 200

Write-Host ""
Write-Host "🔌 TESTING API SERVICES" -ForegroundColor Yellow
Write-Host "----------------------"

# Test API Gateway
Test-Health -Name "API Gateway" -Url "http://localhost:3000/health"

# Test Auth Service
Test-Health -Name "Auth Service" -Url "http://localhost:3001/health"

# Test Tenant Service
Test-Health -Name "Tenant Service" -Url "http://localhost:3002/health"

# Test Subscription Service
Test-Health -Name "Subscription Service" -Url "http://localhost:3013/health"

# Test Payment Service
Test-Health -Name "Payment Service" -Url "http://localhost:3014/health"

# Test Email Service
Test-Health -Name "Email Service" -Url "http://localhost:3015/health"

Write-Host ""
Write-Host "💼 TESTING BUSINESS LOGIC" -ForegroundColor Yellow
Write-Host "------------------------"

# Test Subscription Plans API
Write-Host "Testing Subscription Plans API... " -NoNewline
try {
    $plans = Invoke-RestMethod -Uri "http://localhost:3013/api/v1/plans" -TimeoutSec 5
    $plansJson = $plans | ConvertTo-Json
    
    if ($plansJson -match "free" -and $plansJson -match "basic") {
        Write-Host "✓ Plans available" -ForegroundColor Green
        $PASSED++
    } else {
        Write-Host "✗ Plans not available" -ForegroundColor Red
        $FAILED++
    }
} catch {
    Write-Host "✗ Plans not available" -ForegroundColor Red
    $FAILED++
}

Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==============="
Write-Host "Passed: " -NoNewline
Write-Host "$PASSED" -ForegroundColor Green
Write-Host "Failed: " -NoNewline
Write-Host "$FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! System ready for production." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  SOME TESTS FAILED! Please fix issues before launch." -ForegroundColor Red
    exit 1
}
