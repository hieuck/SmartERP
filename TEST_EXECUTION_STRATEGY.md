# Smart-ERP Test Execution Strategy

**Document Version:** 1.0  
**Last Updated:** 2026-03-10  
**Status:** Ready for Execution

---

## Executive Summary

This document outlines the comprehensive test execution strategy for Smart-ERP, covering unit tests, integration tests, e2e tests, and performance tests. The strategy includes test configuration analysis, execution workflows, coverage monitoring, and failure handling procedures.

**Key Metrics:**
- **Global Coverage Threshold:** 80% (statements, branches, functions, lines)
- **Security Module Coverage:** 100% (critical path)
- **Service/Controller Coverage:** 85% (high priority)
- **Test Timeout:** 30 seconds per test
- **Parallel Workers:** 50% of available CPU cores

---

## 1. Test Infrastructure Overview

### 1.1 Test Configuration

**Jest Configuration (`jest.config.js`):**
- **Preset:** `ts-jest` (TypeScript support)
- **Environment:** Node.js
- **Test Roots:** Backend, Frontend, Shared
- **Test Match Patterns:**
  - `**/__tests__/**/*.ts`
  - `**/?(*.)+(spec|test).ts`
  - Excludes: `*.e2e.spec.ts`, `*.integration.spec.ts`

**Jest Setup (`jest.setup.js`):**
- Environment: `NODE_ENV=test`
- Database: PostgreSQL test instance
- Test timeout: 30 seconds
- Global test helpers available
- Optional console suppression

### 1.2 Test Structure

```
smart-erp/
├── src/backend/
│   ├── common/test/
│   │   └── test-helpers.ts          # Shared test utilities
│   ├── domains/test/
│   │   └── test-product/
│   │       └── test-product.service.spec.ts
│   └── test/
│       ├── e2e/
│       │   └── user-journey.e2e-spec.ts
│       └── performance/
│           ├── api-performance.spec.ts
│           └── k6-security-baseline.js
├── src/frontend/
│   ├── src/__tests__/
│   │   ├── enterprise-features.test.tsx
│   │   ├── integration.test.tsx
│   │   ├── integration/
│   │   │   ├── advanced-features.test.tsx
│   │   │   ├── orders.test.tsx
│   │   │   ├── production.test.tsx
│   │   │   └── reports.test.tsx
│   │   └── performance/
│   │       └── integration.test.tsx
│   └── e2e/
│       ├── auth.spec.ts
│       ├── dashboard.spec.ts
│       ├── orders.spec.ts
│       └── products.spec.ts
└── jest.config.js
```

### 1.3 Coverage Thresholds by Module

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **Global** | 80% | 80% | 80% | 80% |
| **Security** | 100% | 100% | 100% | 100% |
| **Services** | 85% | 85% | 85% | 85% |
| **Controllers** | 85% | 85% | 85% | 85% |
| **Entities** | 80% | 75% | 80% | 80% |
| **Utilities** | 90% | 90% | 90% | 90% |
| **Shared Code** | 85% | 85% | 85% | 85% |

---

## 2. Test Execution Workflows

### 2.1 Unit Tests (Backend)

**Command:**
```bash
npm test
```

**What It Does:**
- Runs all unit tests in backend, frontend, and shared
- Excludes e2e and integration tests
- Generates coverage reports
- Uses 50% of available CPU cores for parallelization

**Expected Output:**
- Test summary (passed/failed/skipped)
- Coverage report (text, HTML, JSON)
- Execution time

**Coverage Reports Generated:**
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format
- `coverage/clover.xml` - Clover format

### 2.2 Unit Tests with Coverage

**Command:**
```bash
npm run test:cov
```

**What It Does:**
- Runs all unit tests
- Generates detailed coverage reports
- Enforces coverage thresholds
- Fails if coverage below threshold

**Coverage Enforcement:**
- Global: 80% minimum
- Security modules: 100% minimum
- Services/Controllers: 85% minimum
- Utilities: 90% minimum

### 2.3 Watch Mode (Development)

**Command:**
```bash
npm run test:watch
```

**What It Does:**
- Runs tests in watch mode
- Re-runs tests on file changes
- Useful for TDD workflow
- Continues until manually stopped

### 2.4 Debug Mode

**Command:**
```bash
npm run test:debug
```

**What It Does:**
- Runs tests with Node debugger
- Runs in single-threaded mode (`--runInBand`)
- Allows breakpoint debugging
- Connect debugger to `localhost:9229`

### 2.5 E2E Tests (Backend)

**Command:**
```bash
npm run test:e2e
```

**Configuration:** `test/jest-e2e.json`

**What It Does:**
- Runs end-to-end tests for backend
- Tests complete user journeys
- Includes: `user-journey.e2e-spec.ts`
- Requires running backend service

### 2.6 E2E Tests (Frontend - Playwright)

**Command:**
```bash
npm run test:e2e
```

**Location:** `src/frontend/`

**What It Does:**
- Runs Playwright e2e tests
- Tests: auth, dashboard, orders, products
- Generates HTML report
- Supports headed/headless modes

**Additional Commands:**
```bash
npm run test:e2e:ui          # UI mode
npm run test:e2e:headed      # Headed browser
npm run test:e2e:debug       # Debug mode
npm run test:e2e:report      # View report
```

### 2.7 Performance Tests

**Backend Performance:**
```bash
npm run test:api-live
```

**Configuration:** `test/api-live/jest.config.js`

**Frontend Performance:**
```bash
npm run test:coverage
```

**Location:** `src/frontend/src/__tests__/performance/`

---

## 3. Test Execution Plan

### 3.1 Pre-Test Checklist

- [ ] Database is running (PostgreSQL)
- [ ] Redis is running (for cache tests)
- [ ] Environment variables configured (`.env.test`)
- [ ] Dependencies installed (`npm install`)
- [ ] No uncommitted changes (optional)
- [ ] Backend compiled (if needed)

### 3.2 Full Test Suite Execution

**Step 1: Unit Tests**
```bash
cd smart-erp/src/backend
npm test
```

**Expected Duration:** 2-5 minutes

**Success Criteria:**
- All tests pass
- Coverage meets thresholds
- No timeout errors

**Step 2: Frontend Unit Tests**
```bash
cd smart-erp/src/frontend
npm test
```

**Expected Duration:** 1-3 minutes

**Success Criteria:**
- All tests pass
- Coverage meets thresholds

**Step 3: E2E Tests (Backend)**
```bash
cd smart-erp/src/backend
npm run test:e2e
```

**Expected Duration:** 3-5 minutes

**Success Criteria:**
- All user journeys complete
- No API errors
- Response times acceptable

**Step 4: E2E Tests (Frontend)**
```bash
cd smart-erp/src/frontend
npm run test:e2e
```

**Expected Duration:** 5-10 minutes

**Success Criteria:**
- All scenarios pass
- UI interactions work
- Navigation flows correct

**Step 5: Performance Tests**
```bash
cd smart-erp/src/backend
npm run test:api-live
```

**Expected Duration:** 2-3 minutes

**Success Criteria:**
- API response times < 200ms (p95)
- No memory leaks
- Throughput acceptable

### 3.3 Parallel Execution Strategy

**Recommended Approach:**
```bash
# Terminal 1: Backend tests
cd smart-erp/src/backend && npm test

# Terminal 2: Frontend tests (parallel)
cd smart-erp/src/frontend && npm test

# Terminal 3: E2E tests (after unit tests pass)
cd smart-erp/src/backend && npm run test:e2e
```

**Total Time:** ~10-15 minutes (vs 20-30 minutes sequential)

---

## 4. Coverage Analysis

### 4.1 Coverage Report Interpretation

**Coverage Metrics:**
- **Statements:** % of code statements executed
- **Branches:** % of conditional branches tested
- **Functions:** % of functions called
- **Lines:** % of lines executed

**Example Report:**
```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
All files                     |   82.5  |   79.2   |   84.1  |   82.3
 backend/services/            |   88.0  |   85.0   |   90.0  |   88.0
 backend/controllers/         |   85.0  |   82.0   |   87.0  |   85.0
 backend/security/            |  100.0  |  100.0   |  100.0  |  100.0
 frontend/components/         |   78.0  |   75.0   |   80.0  |   78.0
```

### 4.2 Coverage Gap Analysis

**Identify Gaps:**
1. Open `coverage/lcov-report/index.html` in browser
2. Click on files with low coverage
3. Red lines = uncovered code
4. Yellow lines = partially covered branches

**Common Coverage Gaps:**
- Error handling paths
- Edge cases
- Conditional branches
- Rarely-used features

### 4.3 Improving Coverage

**Strategies:**
1. **Add unit tests** for uncovered functions
2. **Test error paths** with mocked failures
3. **Test edge cases** (null, empty, boundary values)
4. **Test conditional branches** (if/else, switch)
5. **Mock external dependencies** properly

**Example:**
```typescript
// Low coverage: error path not tested
describe('UserService', () => {
  it('should handle database errors', async () => {
    const mockDb = jest.fn().mockRejectedValue(new Error('DB Error'));
    const service = new UserService(mockDb);
    
    await expect(service.getUser(1)).rejects.toThrow('DB Error');
  });
});
```

---

## 5. Failure Monitoring & Debugging

### 5.1 Test Failure Categories

| Category | Cause | Action |
|----------|-------|--------|
| **Compilation Error** | TypeScript error | Fix type errors, check imports |
| **Timeout** | Test takes > 30s | Increase timeout or optimize test |
| **Assertion Failure** | Expected ≠ Actual | Review test logic or implementation |
| **Mock Error** | Mock not set up | Check mock configuration |
| **Database Error** | Connection/query issue | Check DB setup, migrations |
| **Flaky Test** | Intermittent failure | Add waits, fix race conditions |

### 5.2 Debugging Failed Tests

**Option 1: Debug Mode**
```bash
npm run test:debug
# Connect debugger to localhost:9229
```

**Option 2: Verbose Output**
```bash
npm test -- --verbose
```

**Option 3: Single Test**
```bash
npm test -- test-product.service.spec.ts
```

**Option 4: Watch Mode**
```bash
npm run test:watch
# Edit test, auto-reruns
```

### 5.3 Common Issues & Solutions

**Issue: "Cannot find module"**
```
Solution: Check import paths, verify tsconfig paths mapping
```

**Issue: "Timeout - Async callback was not invoked"**
```
Solution: Ensure async operations complete, add done() callback
```

**Issue: "Mock not working"**
```
Solution: Mock before import, use jest.mock() at top of file
```

**Issue: "Database connection failed"**
```
Solution: Check .env.test, verify PostgreSQL running
```

**Issue: "Flaky test (passes sometimes)"**
```
Solution: Add explicit waits, fix race conditions, use jest.useFakeTimers()
```

---

## 6. Test Quality Metrics

### 6.1 Key Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Overall Coverage** | 80% | TBD | ⏳ |
| **Security Coverage** | 100% | TBD | ⏳ |
| **Test Pass Rate** | 100% | TBD | ⏳ |
| **Avg Test Duration** | < 100ms | TBD | ⏳ |
| **Flaky Tests** | 0% | TBD | ⏳ |
| **E2E Pass Rate** | 100% | TBD | ⏳ |

### 6.2 Coverage Trend Analysis

**Track Over Time:**
- Weekly coverage reports
- Identify declining coverage
- Celebrate coverage improvements
- Set improvement targets

**Example Tracking:**
```
Week 1: 75% → Week 2: 78% → Week 3: 81% → Week 4: 84%
```

### 6.3 Test Maintenance

**Regular Tasks:**
- [ ] Review flaky tests weekly
- [ ] Update mocks when APIs change
- [ ] Remove obsolete tests
- [ ] Refactor duplicate test code
- [ ] Update test documentation

---

## 7. CI/CD Integration

### 7.1 Pre-Commit Hooks

**File:** `.husky/pre-commit`

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests
npm test
```

### 7.2 CI Pipeline

**GitHub Actions Workflow:**

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm test
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 7.3 Coverage Reports

**Upload to CodeCov:**
```bash
npm run test:cov
# Coverage automatically uploaded via CI
```

**View Coverage:**
- CodeCov dashboard
- GitHub PR comments
- Coverage badges

---

## 8. Test Execution Checklist

### Pre-Execution
- [ ] All dependencies installed
- [ ] Database running and initialized
- [ ] Redis running (if needed)
- [ ] Environment variables set
- [ ] No uncommitted changes
- [ ] Latest code pulled

### Execution
- [ ] Run unit tests (backend)
- [ ] Run unit tests (frontend)
- [ ] Check coverage reports
- [ ] Run e2e tests (backend)
- [ ] Run e2e tests (frontend)
- [ ] Run performance tests
- [ ] Review test results

### Post-Execution
- [ ] Document failures
- [ ] Create issues for failures
- [ ] Update coverage metrics
- [ ] Review coverage gaps
- [ ] Plan coverage improvements
- [ ] Commit test results

---

## 9. Performance Benchmarks

### 9.1 Expected Test Execution Times

| Test Suite | Expected Duration | Parallelization |
|-----------|------------------|-----------------|
| **Backend Unit Tests** | 2-5 min | 50% CPU cores |
| **Frontend Unit Tests** | 1-3 min | Vitest default |
| **Backend E2E** | 3-5 min | Sequential |
| **Frontend E2E** | 5-10 min | Sequential |
| **Performance Tests** | 2-3 min | Sequential |
| **Full Suite** | 10-15 min | Parallel execution |

### 9.2 Test Performance Optimization

**Strategies:**
1. **Parallel execution** - Run independent tests simultaneously
2. **Mocking** - Mock external dependencies
3. **Test isolation** - Minimize shared state
4. **Caching** - Cache expensive operations
5. **Selective testing** - Run only affected tests

---

## 10. Troubleshooting Guide

### Issue: Tests Won't Run

**Symptoms:** `npm test` fails immediately

**Solutions:**
1. Check Node.js version: `node --version` (need v16+)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Clear Jest cache: `npm test -- --clearCache`
4. Check TypeScript: `npm run type-check`

### Issue: Database Connection Fails

**Symptoms:** "Cannot connect to database" error

**Solutions:**
1. Verify PostgreSQL running: `psql -U postgres`
2. Check `.env.test` configuration
3. Run migrations: `npm run migration:run`
4. Reset database: `npm run db:drop-create`

### Issue: Tests Timeout

**Symptoms:** "Timeout - Async callback was not invoked"

**Solutions:**
1. Increase timeout: `jest.setTimeout(60000)`
2. Check async operations complete
3. Mock slow operations
4. Use `jest.useFakeTimers()` for time-dependent tests

### Issue: Flaky Tests

**Symptoms:** Tests pass sometimes, fail other times

**Solutions:**
1. Add explicit waits: `await waitFor(() => expect(...).toBe(...))`
2. Fix race conditions
3. Mock time-dependent operations
4. Isolate test state

### Issue: Coverage Below Threshold

**Symptoms:** "Coverage threshold not met"

**Solutions:**
1. Add tests for uncovered code
2. Test error paths
3. Test edge cases
4. Review coverage report: `open coverage/lcov-report/index.html`

---

## 11. Best Practices

### 11.1 Test Writing

✅ **DO:**
- Write descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test one thing per test
- Mock external dependencies
- Use test fixtures for common setup
- Test error cases
- Keep tests independent

❌ **DON'T:**
- Test implementation details
- Create interdependent tests
- Use real external services
- Write overly complex tests
- Skip error path testing
- Ignore flaky tests

### 11.2 Test Organization

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new UserService(mockDb);
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      mockDb.findUser.mockResolvedValue({ id: 1, name: 'John' });

      // Act
      const result = await service.getUser(1);

      // Assert
      expect(result).toEqual({ id: 1, name: 'John' });
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockDb.findUser.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUser(1)).rejects.toThrow('User not found');
    });
  });
});
```

### 11.3 Coverage Best Practices

- Aim for 80%+ coverage
- Focus on critical paths (security, business logic)
- Don't chase 100% coverage
- Review coverage gaps regularly
- Prioritize quality over quantity

---

## 12. Next Steps

### Immediate Actions
1. ✅ Review this strategy document
2. ⏳ Run full test suite: `npm test`
3. ⏳ Review coverage reports
4. ⏳ Identify coverage gaps
5. ⏳ Create issues for failing tests

### Short-term (This Sprint)
- [ ] Achieve 80% coverage threshold
- [ ] Fix all failing tests
- [ ] Document test patterns
- [ ] Set up CI/CD pipeline
- [ ] Create test maintenance schedule

### Long-term (Next Quarter)
- [ ] Improve coverage to 85%+
- [ ] Implement performance testing
- [ ] Add visual regression testing
- [ ] Implement mutation testing
- [ ] Create test automation framework

---

## 13. References

### Configuration Files
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Jest setup and globals
- `tsconfig.test.json` - TypeScript test configuration
- `.env.test` - Test environment variables

### Test Locations
- Backend: `src/backend/test/`, `src/backend/domains/test/`
- Frontend: `src/frontend/src/__tests__/`, `src/frontend/e2e/`
- Shared: `src/shared/types/`

### Documentation
- Jest: https://jestjs.io/docs/getting-started
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- Testing Library: https://testing-library.com/

---

## 14. Contact & Support

**Test Infrastructure Owner:** QA Team  
**Last Updated:** 2026-03-10  
**Next Review:** 2026-03-24

For questions or issues, contact the QA team or create an issue in the project repository.

---

**Document Status:** ✅ Ready for Execution  
**Approval:** Pending QA Review
