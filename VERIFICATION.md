#  SmartERP Verification Guide

**Created**: 2026-03-07  
**Purpose**: Verify system integrity after refactoring

##  CRITICAL: Run This After Refactoring

Verify SmartERP after folder structure refactoring.

##  Quick Verification

```bash
# 1. Install dependencies
cd src/backend && npm install

# 2. Build
npm run build

# 3. Run tests
npm test

# 4. Check coverage
npm run test:cov

# Expected: 443+ tests passing, 80% coverage
```

##  Common Issues

- Import path errors  Check tsconfig.json
- Module not found  Reinstall dependencies
- Tests failing  Check import paths in tests
- DB connection error  Check .env file
- Redis error  Ensure Redis is running

##  Expected Results

-  Build: Success
-  Tests: 443+ passing (80% coverage)
-  Lint: No errors
-  Performance: API < 200ms (p95)

See full guide in docs/ for detailed troubleshooting.
