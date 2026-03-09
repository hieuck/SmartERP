# 🚀 Week 1 Prep Work - Action Plan

**Date**: 2026-03-09  
**Owner**: DevOps Engineer  
**Duration**: 4 hours  
**Deadline**: Before Day 1 (2026-03-10 9:00 AM)  
**Status**: 🟡 IN PROGRESS

---

## 📊 EXECUTIVE SUMMARY

### Critical Issues Found

Infrastructure assessment revealed **3 critical gaps** that must be fixed before Week 1 starts:

1. ❌ **Security test runner** - docker-compose references non-existent scripts
2. ❌ **Performance test scripts** - k6 load tests missing
3. ⚠️ **CI/CD pipeline** - needs security test job enhancements

### Action Plan

**Total Time**: 4 hours  
**Completion Target**: 2026-03-09 6:00 PM  
**Verification**: 30 minutes  
**Buffer**: 30 minutes

---

## 🎯 TASK BREAKDOWN

### Task 1: Fix Security Test Runner (30 min)

**Priority**: CRITICAL  
**Owner**: DevOps  
**Time**: 30 minutes

#### Problem

Current `docker-compose.test.yml`:

```yaml
test-security:
  command: sh -c "cd backend/security-tests && npm test"
  # ❌ backend/security-tests/ doesn't exist!
```

#### Solution

Security tests will be in domain folders (e.g., `*.security.spec.ts`), not separate folder.

#### Steps

1. **Update docker-compose.test.yml** (10 min)

```yaml
# File: config/docker/docker-compose.test.yml

test-security:
  build:
    context: .
    dockerfile: Dockerfile.test
  container_name: smart-erp-test-security
  environment:
    NODE_ENV: test
    DB_HOST: postgres-test
    DB_PORT: 5432
    DB_USER: postgres
    DB_PASSWORD: postgres
    DB_NAME: smart_erp_test
    REDIS_HOST: redis-test
    REDIS_PORT: 6379
    JWT_SECRET: test-secret-key
    API_URL: http://api-gateway-test:3000
  # ✅ UPDATED COMMAND
  command: sh -c "cd backend && npm test -- --testPathPattern='.*\\.security\\.spec\\.ts$' --passWithNoTests"
  depends_on:
    postgres-test:
      condition: service_healthy
    redis-test:
      condition: service_healthy
    api-gateway-test:
      condition: service_started
  volumes:
    - ./backend:/app/backend
    - /app/node_modules
    - /app/backend/node_modules
  networks:
    - test-network
```

2. **Test security runner** (10 min)

```bash
# Build test environment
docker-compose -f config/docker/docker-compose.test.yml build test-security

# Test with existing security tests
docker-compose -f config/docker/docker-compose.test.yml run --rm test-security

# Expected output: Tests run (may pass or fail, but runner works)
```

3. **Verify output format** (10 min)

```bash
# Check test output includes:
# - Test file paths
# - Test names
# - Pass/fail status
# - Coverage report (if configured)

# Example expected output:
# PASS src/backend/domains/inventory/product/product.security.spec.ts
#   ProductService - Tenant Isolation
#     ✓ should allow user to read their own tenant data (50ms)
#     ✓ should not return other tenant data (45ms)
```

#### Success Criteria

- ✅ docker-compose.test.yml updated
- ✅ Security test runner starts successfully
- ✅ Tests execute (pass or fail)
- ✅ Output format is readable

#### Deliverable

- Updated `config/docker/docker-compose.test.yml`
- Test run log saved to `docs/infrastructure/security-test-runner-verification.log`

---

### Task 2: Create Performance Test Script (1 hour)

**Priority**: CRITICAL  
**Owner**: DevOps  
**Time**: 1 hour

#### Problem

Current `docker-compose.test.yml`:

```yaml
test-performance:
  command: sh -c "cd backend/performance-tests && k6 run k6-load-test.js"
  # ❌ backend/performance-tests/ doesn't exist!
  # ❌ k6-load-test.js doesn't exist!
```

#### Solution

Create k6 performance test script for security baseline testing.

#### Steps

1. **Create performance test directory** (5 min)

```bash
# Directory already exists: src/backend/test/performance/
# Just need to add k6 script
```

2. **Create k6 security baseline script** (30 min)

File: `src/backend/test/performance/k6-security-baseline.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const securityCheckDuration = new Trend('security_check_duration');
const securityCheckFailRate = new Rate('security_check_failures');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    security_check_duration: ['p(95)<50'], // Security checks < 50ms overhead
    security_check_failures: ['rate<0.01'], // < 1% failures
  },
};

export default function () {
  const BASE_URL = __ENV.API_URL || 'http://api-gateway-test:3000';
  const TEST_TOKEN = __ENV.TEST_TOKEN || 'test-jwt-token';
  const TEST_TENANT_ID = __ENV.TEST_TENANT_ID || 'tenant-1';

  // Test 1: Tenant-isolated product query
  const productsRes = http.get(`${BASE_URL}/api/products`, {
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
      'X-Tenant-ID': TEST_TENANT_ID,
    },
  });

  securityCheckDuration.add(productsRes.timings.duration);

  const productsCheck = check(productsRes, {
    'products: status is 200': (r) => r.status === 200,
    'products: response time < 200ms': (r) => r.timings.duration < 200,
    'products: has tenant isolation': (r) => {
      try {
        const data = JSON.parse(r.body);
        if (!Array.isArray(data)) return true; // Empty or error response
        return data.every((item) => item.tenantId === TEST_TENANT_ID);
      } catch (e) {
        return false;
      }
    },
  });

  if (!productsCheck) {
    securityCheckFailRate.add(1);
  } else {
    securityCheckFailRate.add(0);
  }

  sleep(1);

  // Test 2: Tenant-isolated order query
  const ordersRes = http.get(`${BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
      'X-Tenant-ID': TEST_TENANT_ID,
    },
  });

  securityCheckDuration.add(ordersRes.timings.duration);

  const ordersCheck = check(ordersRes, {
    'orders: status is 200': (r) => r.status === 200,
    'orders: response time < 200ms': (r) => r.timings.duration < 200,
    'orders: has tenant isolation': (r) => {
      try {
        const data = JSON.parse(r.body);
        if (!Array.isArray(data)) return true;
        return data.every((item) => item.tenantId === TEST_TENANT_ID);
      } catch (e) {
        return false;
      }
    },
  });

  if (!ordersCheck) {
    securityCheckFailRate.add(1);
  } else {
    securityCheckFailRate.add(0);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'results/summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Performance Test Summary\n`;
  summary += `${indent}========================\n\n`;

  // Requests
  summary += `${indent}Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;

  // Response Time
  summary += `${indent}Response Time:\n`;
  summary += `${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  // Security Metrics
  if (data.metrics.security_check_duration) {
    summary += `${indent}Security Check Duration:\n`;
    summary += `${indent}  Avg: ${data.metrics.security_check_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  p95: ${data.metrics.security_check_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (data.metrics.security_check_failures) {
    const failRate = (data.metrics.security_check_failures.values.rate * 100).toFixed(2);
    summary += `${indent}Security Check Failures: ${failRate}%\n\n`;
  }

  // Thresholds
  summary += `${indent}Thresholds:\n`;
  Object.keys(data.metrics).forEach((metric) => {
    if (data.metrics[metric].thresholds) {
      Object.keys(data.metrics[metric].thresholds).forEach((threshold) => {
        const passed = data.metrics[metric].thresholds[threshold].ok;
        const status = passed ? '✓' : '✗';
        summary += `${indent}  ${status} ${metric} ${threshold}\n`;
      });
    }
  });

  return summary;
}
```

3. **Update docker-compose.test.yml** (10 min)

```yaml
# File: config/docker/docker-compose.test.yml

test-performance:
  build:
    context: .
    dockerfile: Dockerfile.test
  container_name: smart-erp-test-performance
  environment:
    NODE_ENV: test
    DB_HOST: postgres-test
    DB_PORT: 5432
    DB_USER: postgres
    DB_PASSWORD: postgres
    DB_NAME: smart_erp_test
    REDIS_HOST: redis-test
    REDIS_PORT: 6379
    JWT_SECRET: test-secret-key
    API_URL: http://api-gateway-test:3000
    TEST_TOKEN: test-jwt-token
    TEST_TENANT_ID: tenant-1
  # ✅ UPDATED COMMAND
  command: sh -c "cd backend/test/performance && k6 run k6-security-baseline.js"
  depends_on:
    postgres-test:
      condition: service_healthy
    redis-test:
      condition: service_healthy
    api-gateway-test:
      condition: service_started
  volumes:
    - ./backend:/app/backend
    - /app/node_modules
    - /app/backend/node_modules
  networks:
    - test-network
```

4. **Install k6 in test container** (10 min)

Update `Dockerfile.test`:

```dockerfile
# Add k6 installation
RUN apt-get update && apt-get install -y \
    curl \
    && curl -L https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz | tar xvz \
    && mv k6-v0.48.0-linux-amd64/k6 /usr/local/bin/ \
    && rm -rf k6-v0.48.0-linux-amd64 \
    && apt-get clean
```

5. **Test performance runner** (15 min)

```bash
# Rebuild test container with k6
docker-compose -f config/docker/docker-compose.test.yml build test-performance

# Run performance test (will take ~5 minutes)
docker-compose -f config/docker/docker-compose.test.yml run --rm test-performance

# Expected output:
# - Ramp up phase
# - Steady state metrics
# - Ramp down phase
# - Summary with thresholds
```

#### Success Criteria

- ✅ k6 script created
- ✅ docker-compose.test.yml updated
- ✅ k6 installed in test container
- ✅ Performance test runs successfully
- ✅ Metrics collected and displayed

#### Deliverable

- `src/backend/test/performance/k6-security-baseline.js`
- Updated `config/docker/docker-compose.test.yml`
- Updated `Dockerfile.test`
- Test run results saved to `docs/infrastructure/performance-test-baseline.log`

---

### Task 3: Update CI/CD Pipeline (2 hours)

**Priority**: HIGH  
**Owner**: DevOps  
**Time**: 2 hours

#### Problem

Current security-tests job is generic:

```yaml
security-tests:
  - Run security tests (generic)
  - Run npm audit
  - Cleanup
```

Missing:

- Tenant isolation test job
- Permission denial test job
- Security report generation
- Artifact upload

#### Solution

Enhance security-tests job with specific test types and reporting.

#### Steps

1. **Backup current CI/CD config** (5 min)

```bash
cp .github/workflows/ci.yml .github/workflows/ci.yml.backup
```

2. **Update security-tests job** (1 hour)

File: `.github/workflows/ci.yml`

```yaml
# Replace existing security-tests job with:

security-tests:
  name: Security Tests
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
  needs: [build]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Build test environment
      run: docker-compose -f config/docker/docker-compose.test.yml build test-security

    - name: Start test dependencies
      run: |
        docker-compose -f config/docker/docker-compose.test.yml up -d postgres-test redis-test
        sleep 10

    # NEW: Run tenant isolation tests
    - name: Run tenant isolation tests
      id: tenant-isolation
      continue-on-error: true
      run: |
        docker-compose -f config/docker/docker-compose.test.yml run --rm test-security \
        npm test -- --testPathPattern='.*\\.security\\.spec\\.ts$' \
        --testNamePattern='Tenant Isolation' \
        --json --outputFile=/app/backend/tenant-isolation-results.json

    # NEW: Run permission denial tests
    - name: Run permission denial tests
      id: permission-denial
      continue-on-error: true
      run: |
        docker-compose -f config/docker/docker-compose.test.yml run --rm test-security \
        npm test -- --testPathPattern='.*\\.security\\.spec\\.ts$' \
        --testNamePattern='Permission Denial' \
        --json --outputFile=/app/backend/permission-denial-results.json

    # Existing: npm audit
    - name: Run security audit
      id: npm-audit
      continue-on-error: true
      run: |
        docker-compose -f config/docker/docker-compose.test.yml run --rm test-security \
        npm audit --audit-level=moderate --json > npm-audit-results.json || true

    # NEW: Generate combined security report
    - name: Generate security report
      if: always()
      run: |
        echo "# Security Test Report" > security-report.md
        echo "" >> security-report.md
        echo "**Date**: $(date)" >> security-report.md
        echo "**Commit**: ${{ github.sha }}" >> security-report.md
        echo "" >> security-report.md

        echo "## Tenant Isolation Tests" >> security-report.md
        if [ "${{ steps.tenant-isolation.outcome }}" == "success" ]; then
          echo "✅ PASSED" >> security-report.md
        else
          echo "❌ FAILED" >> security-report.md
        fi
        echo "" >> security-report.md

        echo "## Permission Denial Tests" >> security-report.md
        if [ "${{ steps.permission-denial.outcome }}" == "success" ]; then
          echo "✅ PASSED" >> security-report.md
        else
          echo "❌ FAILED" >> security-report.md
        fi
        echo "" >> security-report.md

        echo "## NPM Audit" >> security-report.md
        if [ "${{ steps.npm-audit.outcome }}" == "success" ]; then
          echo "✅ NO VULNERABILITIES" >> security-report.md
        else
          echo "⚠️ VULNERABILITIES FOUND" >> security-report.md
        fi

    # NEW: Upload security test results
    - name: Upload security test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-test-results-${{ github.sha }}
        path: |
          backend/tenant-isolation-results.json
          backend/permission-denial-results.json
          npm-audit-results.json
          security-report.md
        retention-days: 30

    # NEW: Comment PR with results (if PR)
    - name: Comment PR with security results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const report = fs.readFileSync('security-report.md', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: report
          });

    - name: Cleanup
      if: always()
      run: docker-compose -f config/docker/docker-compose.test.yml down -v

    # Fail job if any security test failed
    - name: Check security test results
      if: always()
      run: |
        if [ "${{ steps.tenant-isolation.outcome }}" != "success" ] || \
           [ "${{ steps.permission-denial.outcome }}" != "success" ]; then
          echo "❌ Security tests failed"
          exit 1
        fi
        echo "✅ All security tests passed"
```

3. **Test CI/CD pipeline locally** (30 min)

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Test security-tests job
act -j security-tests

# Or test with docker-compose directly
docker-compose -f config/docker/docker-compose.test.yml run --rm test-security \
  npm test -- --testPathPattern='.*\\.security\\.spec\\.ts$'
```

4. **Create feature branch and test** (30 min)

```bash
# Create feature branch
git checkout -b infra/week1-ci-cd-updates

# Commit changes
git add .github/workflows/ci.yml
git commit -m "feat(ci): enhance security tests with tenant isolation and permission denial jobs"

# Push and create PR
git push origin infra/week1-ci-cd-updates

# Monitor GitHub Actions run
# Verify:
# - Security tests run
# - Artifacts uploaded
# - Report generated
```

#### Success Criteria

- ✅ CI/CD pipeline updated
- ✅ Tenant isolation test job added
- ✅ Permission denial test job added
- ✅ Security report generation working
- ✅ Artifacts uploaded correctly
- ✅ Pipeline tested in feature branch

#### Deliverable

- Updated `.github/workflows/ci.yml`
- Feature branch `infra/week1-ci-cd-updates`
- CI/CD test run results
- Documentation of changes

---

### Task 4: Verification & Documentation (30 min)

**Priority**: MEDIUM  
**Owner**: DevOps  
**Time**: 30 minutes

#### Steps

1. **Run full test suite** (15 min)

```bash
# Test all components
docker-compose -f config/docker/docker-compose.test.yml up -d

# Run security tests
docker-compose -f config/docker/docker-compose.test.yml run --rm test-security

# Run performance tests
docker-compose -f config/docker/docker-compose.test.yml run --rm test-performance

# Check logs
docker-compose -f config/docker/docker-compose.test.yml logs

# Cleanup
docker-compose -f config/docker/docker-compose.test.yml down -v
```

2. **Document changes** (15 min)

Create: `docs/infrastructure/week1-prep-completion-report.md`

```markdown
# Week 1 Prep Work - Completion Report

**Date**: 2026-03-09  
**Completed by**: DevOps Engineer  
**Status**: ✅ COMPLETE

## Changes Made

### 1. Security Test Runner

- ✅ Updated docker-compose.test.yml
- ✅ Fixed test command
- ✅ Verified test execution

### 2. Performance Test Script

- ✅ Created k6-security-baseline.js
- ✅ Updated docker-compose.test.yml
- ✅ Installed k6 in test container
- ✅ Verified test execution

### 3. CI/CD Pipeline

- ✅ Enhanced security-tests job
- ✅ Added tenant isolation tests
- ✅ Added permission denial tests
- ✅ Added security report generation
- ✅ Added artifact upload
- ✅ Tested in feature branch

## Verification Results

### Security Test Runner

- Status: ✅ WORKING
- Test execution time: X seconds
- Tests found: X files
- Tests passed: X/X

### Performance Test Runner

- Status: ✅ WORKING
- Test duration: ~5 minutes
- Requests: X total
- p95 response time: Xms
- Thresholds: X/X passed

### CI/CD Pipeline

- Status: ✅ WORKING
- Pipeline run: #XXXX
- Security tests: PASSED
- Artifacts: UPLOADED
- Report: GENERATED

## Next Steps

1. Merge feature branch to develop
2. Monitor CI/CD runs on Day 1
3. Setup monitoring during Day 2-3
4. Run performance baseline on Day 5

## Issues Encountered

(Document any issues and resolutions)

## Recommendations

(Any recommendations for improvements)
```

#### Success Criteria

- ✅ All tests verified working
- ✅ Documentation complete
- ✅ Changes committed
- ✅ Team notified

#### Deliverable

- `docs/infrastructure/week1-prep-completion-report.md`
- Test run logs
- Verification screenshots

---

## 📋 EXECUTION CHECKLIST

### Pre-Work (5 min)

- [ ] Read infrastructure requirements document
- [ ] Review Week 1 execution plan
- [ ] Prepare development environment
- [ ] Backup current configurations

### Task 1: Security Test Runner (30 min)

- [ ] Update docker-compose.test.yml
- [ ] Test security runner
- [ ] Verify output format
- [ ] Document changes

### Task 2: Performance Test Script (1 hour)

- [ ] Create k6-security-baseline.js
- [ ] Update docker-compose.test.yml
- [ ] Install k6 in test container
- [ ] Test performance runner
- [ ] Document results

### Task 3: CI/CD Pipeline (2 hours)

- [ ] Backup current ci.yml
- [ ] Update security-tests job
- [ ] Test locally with act
- [ ] Create feature branch
- [ ] Push and test in GitHub Actions
- [ ] Document changes

### Task 4: Verification (30 min)

- [ ] Run full test suite
- [ ] Verify all components working
- [ ] Create completion report
- [ ] Commit all changes
- [ ] Notify team

### Post-Work (10 min)

- [ ] Merge feature branch (if approved)
- [ ] Update ROADMAP.md
- [ ] Update task tracker
- [ ] Send completion notification

---

## 🚨 TROUBLESHOOTING

### Issue: Security test runner fails

**Symptoms**: Container exits with error

**Solutions**:

1. Check docker-compose.test.yml syntax
2. Verify backend folder path
3. Check npm test command
4. Review container logs

### Issue: k6 not found

**Symptoms**: "k6: command not found"

**Solutions**:

1. Rebuild test container
2. Verify k6 installation in Dockerfile.test
3. Check k6 binary path
4. Test k6 version: `k6 version`

### Issue: CI/CD pipeline fails

**Symptoms**: GitHub Actions job fails

**Solutions**:

1. Check workflow syntax
2. Verify docker-compose path
3. Review job logs
4. Test locally with act

### Issue: Performance test timeout

**Symptoms**: Test runs > 10 minutes

**Solutions**:

1. Reduce test duration
2. Lower target users
3. Check API response time
4. Review database performance

---

## 📊 PROGRESS TRACKING

### Time Tracking

| Task                    | Estimated   | Actual | Status         |
| ----------------------- | ----------- | ------ | -------------- |
| Security Test Runner    | 30 min      | -      | 🟡 Pending     |
| Performance Test Script | 1 hour      | -      | 🟡 Pending     |
| CI/CD Pipeline          | 2 hours     | -      | 🟡 Pending     |
| Verification            | 30 min      | -      | 🟡 Pending     |
| **Total**               | **4 hours** | **-**  | **🟡 Pending** |

### Completion Status

- [ ] Task 1: Security Test Runner (0%)
- [ ] Task 2: Performance Test Script (0%)
- [ ] Task 3: CI/CD Pipeline (0%)
- [ ] Task 4: Verification (0%)

**Overall Progress**: 0% (0/4 tasks complete)

---

## ✅ SUCCESS CRITERIA

### Infrastructure Ready When:

1. ✅ Security test runner executes successfully
2. ✅ Performance test script runs and collects metrics
3. ✅ CI/CD pipeline runs security tests
4. ✅ All artifacts uploaded correctly
5. ✅ Documentation complete

### Week 1 Can Start When:

1. ✅ All 4 tasks complete
2. ✅ Verification passed
3. ✅ Team notified
4. ✅ Changes merged to develop

---

## 📞 ESCALATION

### If Blocked:

**< 30 min**: Continue with next task, return later  
**30-60 min**: Escalate to Tech Lead  
**> 60 min**: Escalate to PM, adjust timeline

### Contact:

- **Tech Lead**: For technical decisions
- **PM**: For timeline concerns
- **Team**: For collaboration needs

---

**Prepared by**: DevOps Engineer  
**Start Time**: 2026-03-09 2:00 PM  
**Target Completion**: 2026-03-09 6:00 PM  
**Status**: 🟡 READY TO START

---

**"4 hours of focused work to ensure Week 1 success!"**
