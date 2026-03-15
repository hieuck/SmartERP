# Type Errors Fix Plan

## Summary

Main branch has **455 type errors** that cause all PRs to fail CI checks:
- Backend: 251 errors
- Frontend: 204 errors

## Root Cause

Type errors exist in main branch, NOT caused by dependency updates from Dependabot PRs.

## Pull Requests Status

### PR #5: chore(deps): bump npm_and_yarn dependencies
- Status: Open, Mergeable (unstable)
- Base: main ✓
- Issue: CI fails due to existing type errors in main
- Action: Can merge after fixing type errors in main

### PR #4: chore(deps): bump tar package  
- Status: Open, Mergeable (unstable)
- Base: main ✓
- Issue: CI fails due to existing type errors in main
- Action: Can merge after fixing type errors in main

### PR #7: feat: add SmartERP ECC bundle
- Status: Open, Mergeable (clean)
- Base: dependabot/npm_and_yarn/npm_and_yarn-ecf76fa8fe ✗
- Issue: Wrong base branch, no CI checks
- Action: Change base to main

### PR #6: feat: add SmartERP ECC bundle
- Status: Open, NOT Mergeable (conflicts)
- Base: dependabot/npm_and_yarn/npm_and_yarn-ecf76fa8fe ✗
- Issue: Wrong base branch + conflicts
- Action: Change base to main, resolve conflicts

## Fix Strategy

### Phase 1: Fix Type Errors in Main Branch (Priority: HIGH)

#### Backend (251 errors)

**Category 1: Missing type declarations**
- `Cannot find name 'cacheManager'` - 1 error
- `Cannot find name 'tenantId'` - 1 error
- `Cannot find name 'jwtService'` - 1 error
- `Cannot find name 'tenantRepository'` - 1 error
- `Cannot find name 'cacheService'` - 1 error
- `Cannot find name 'permissionService'` - multiple errors
- `Cannot find name 'userRepository'` - 1 error
- `Cannot find name 'accountRepository'` - 1 error
- `Cannot find name 'order'` - multiple errors
- `Cannot find name 'user'` - multiple errors

**Category 2: Wrong property names (underscore prefix issues)**
- `Property '_transactionId' does not exist` - multiple errors
- `Property '_productId' does not exist` - multiple errors
- `Property '_shippingAddress' does not exist` - multiple errors
- `Property '_tenantId' does not exist` - multiple errors
- `Property '_reason' does not exist` - multiple errors
- `Property '_startDate/_endDate' does not exist` - multiple errors

**Category 3: Import errors**
- `has no exported member named '_Gauge'` - should be 'Gauge'
- `has no exported member named '_register'` - should be 'register'
- `has no exported member named '_IsDateString'` - should be 'IsDateString'

**Category 4: Type mismatches**
- SyncStatus type mismatches
- Period type mismatches (missing _startDate, _endDate)
- Product type mismatches (missing _productId)

#### Frontend (204 errors)

**Category 1: Missing exports**
- `Module '"./LazyDataLoader"' has no exported member 'default'`
- `Module '"./LazyImage"' has no exported member 'default'`
- `Module '"./OfflineDemo"' missing 'default' export`

**Category 2: Missing type declarations**
- `Could not find declaration file for module 'lodash'`
- Missing @types/lodash package

**Category 3: Unused variables (TS6133)**
- Multiple unused imports and variables
- Can be auto-fixed with eslint

**Category 4: Type mismatches**
- API service method mismatches (getPayments, delete, complete, refund, etc.)
- Property mismatches (orderId, issueDate, discountAmount, customerName, etc.)
- Type conversion issues

**Category 5: Null/undefined checks**
- `is possibly 'null'` - needs null checks
- `Type 'undefined' is not assignable to type 'string'`

### Phase 2: Handle Pull Requests (Priority: MEDIUM)

1. **After fixing type errors in main:**
   - Rebase PR #5 and PR #4 on latest main
   - CI checks should pass
   - Merge PRs

2. **For ECC bundle PRs (#6, #7):**
   - Change base branch to main
   - Resolve conflicts
   - Run CI checks
   - Merge if appropriate

## Implementation Steps

### Step 1: Fix Backend Type Errors

1. Fix import errors (wrong export names)
2. Fix underscore prefix issues in DTOs and entities
3. Add missing variable declarations in test files
4. Fix type mismatches
5. Run type-check to verify

### Step 2: Fix Frontend Type Errors

1. Install missing @types packages (`npm install --save-dev @types/lodash`)
2. Fix missing default exports
3. Fix API service type mismatches
4. Add null/undefined checks
5. Remove unused variables
6. Run type-check to verify

### Step 3: Verify CI Passes

1. Commit fixes to main branch
2. Push to origin
3. Wait for CI checks to pass
4. Verify all checks green

### Step 4: Handle Pull Requests

1. Rebase/update PR #5 and #4
2. Change base branch for PR #6 and #7
3. Resolve conflicts
4. Merge PRs

## Estimated Time

- Backend fixes: 4-6 hours
- Frontend fixes: 3-4 hours
- PR handling: 1-2 hours
- **Total: 8-12 hours**

## Next Actions

1. Start fixing backend type errors systematically
2. Use automated tools where possible (eslint --fix)
3. Test after each category of fixes
4. Commit incrementally to track progress
