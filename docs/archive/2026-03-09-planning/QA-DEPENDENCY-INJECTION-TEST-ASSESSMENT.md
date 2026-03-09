# QA Assessment: Dependency Injection Error & Test Coverage

**Date:** 2026-03-09  
**Assessed By:** QA Engineer  
**Severity:** 🔴 **CRITICAL** - Production-blocking issue

---

## Executive Summary

Phát hiện lỗi dependency injection nghiêm trọng trong **UserModule** khiến backend server không thể khởi động. Root cause: `UserService` inject `PermissionService` nhưng `UserModule` không import `SecurityModule`.

**Impact:**

- ✅ **Tests PASS** (vì mock PermissionService trực tiếp)
- ❌ **Runtime FAILS** (vì NestJS không resolve được dependency)
- 🚨 **Gap:** Tests không phát hiện được lỗi module configuration

---

## 🔍 Root Cause Analysis

### The Problem

**UserModule** (`src/backend/core/user/user.module.ts`):

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User]), CacheModule], // ❌ Missing SecurityModule
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**UserService** (`src/backend/core/user/user.service.ts`):

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    private readonly permissionService: PermissionService, // ✅ Needs PermissionService
  ) {
    this.secureUserRepo = new SecureRepository(userRepository, permissionService, 'User');
  }
}
```

**SecurityModule** (`src/backend/common/security/security.module.ts`):

```typescript
@Module({
  providers: [PermissionService],
  exports: [PermissionService], // ✅ Exports PermissionService
})
export class SecurityModule {}
```

### Why Tests Didn't Catch This

**Current Test** (`user.service.spec.ts`):

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UserService,
      { provide: getRepositoryToken(User), useValue: mockRepository },
      { provide: PermissionService, useValue: mockPermissionService }, // ✅ Mock directly
    ],
  }).compile();
  // ...
});
```

**Problem:** Test mocks `PermissionService` trực tiếp trong providers array, bypass module dependency resolution. Runtime thì NestJS cần resolve từ imported modules.

---

## 🚨 Critical Gaps Identified

### 1. Missing Module Integration Tests

**Current State:**

- ✅ Unit tests for services (with mocked dependencies)
- ❌ **NO integration tests for module configuration**
- ❌ **NO tests verifying module imports/exports**

**Impact:** Dependency injection errors chỉ xuất hiện khi start server, không bị catch bởi tests.

### 2. Systematic Issue Across Codebase

Scan toàn bộ codebase phát hiện **26 modules** có cùng pattern (inject PermissionService):

**Modules MISSING SecurityModule import:**

1. ❌ `core/user/user.module.ts` - **CRITICAL**
2. ❌ `core/tenant/tenant.module.ts` - **CRITICAL**
3. ❌ `core/auth/auth.module.ts` - **CRITICAL**
4. ❌ `domains/hr/hr/hr.module.ts`
5. ❌ `domains/hr/role/role.module.ts`
6. ❌ `domains/manufacturing/mrp/production.module.ts`
7. ❌ `integrations/shipping/shipping.module.ts`
8. ❌ `integrations/payment-gateway/payment-gateway.module.ts`
9. ❌ `domains/ecommerce/shopping-cart/shopping-cart.module.ts`
10. ❌ `domains/ecommerce/product-catalog/product-catalog.module.ts`
11. ❌ `domains/ecommerce/order/order.module.ts` (3 services)

**Modules CORRECTLY importing SecurityModule:**

1. ✅ `domains/sales/order/order.module.ts`
2. ✅ `domains/sales/customer/customer.module.ts`
3. ✅ `domains/sales/crm/crm.module.ts`
4. ✅ `domains/purchasing/supplier/supplier.module.ts`
5. ✅ `domains/inventory/stock/inventory.module.ts`
6. ✅ `domains/inventory/product/product.module.ts`
7. ✅ `domains/inventory/category/category.module.ts`
8. ✅ `domains/accounting/payment/payment.module.ts`
9. ✅ `domains/accounting/account/accounting.module.ts`
10. ✅ `domains/accounting/reports/reports.module.ts`
11. ✅ `domains/accounting/bank-reconciliation/bank-reconciliation.module.ts`
12. ✅ `platform/workflow/workflow.module.ts`
13. ✅ `platform/notification/notification.module.ts`
14. ✅ `platform/document/document.module.ts`
15. ✅ `platform/audit/audit.module.ts`

**Statistics:**

- Total modules using PermissionService: **26**
- Correctly configured: **15** (58%)
- Missing SecurityModule: **11** (42%) 🚨

---

## 📋 Recommended Test Cases

### Priority 1: Module Integration Tests (CRITICAL)

#### Test 1.1: Module Dependency Resolution

```typescript
// src/backend/core/user/__tests__/user.module.integration.spec.ts

describe('UserModule Integration', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UserModule, // Import the actual module
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should resolve UserService with all dependencies', () => {
    const userService = module.get<UserService>(UserService);
    expect(userService).toBeDefined();
  });

  it('should resolve PermissionService from SecurityModule', () => {
    const permissionService = module.get<PermissionService>(PermissionService);
    expect(permissionService).toBeDefined();
  });

  it('should create SecureRepository with PermissionService', () => {
    const userService = module.get<UserService>(UserService);
    const secureRepo = (userService as any).secureUserRepo;
    expect(secureRepo).toBeDefined();
    expect(secureRepo.permissionService).toBeDefined();
  });
});
```

**Why this test is important:**

- ✅ Tests actual module configuration (not mocked)
- ✅ Verifies NestJS dependency injection works
- ✅ Catches missing module imports
- ✅ Runs in CI/CD before deployment

#### Test 1.2: Module Exports Verification

```typescript
describe('UserModule Exports', () => {
  it('should export UserService for other modules', async () => {
    @Module({
      imports: [UserModule],
    })
    class TestModule {}

    const module = await Test.createTestingModule({
      imports: [TestModule, TypeOrmModule.forRoot(testDbConfig)],
    }).compile();

    const userService = module.get<UserService>(UserService);
    expect(userService).toBeDefined();
  });
});
```

### Priority 2: Automated Module Configuration Validation

#### Test 2.1: ESLint Custom Rule

```typescript
// .eslintrc.js - Add custom rule

module.exports = {
  rules: {
    '@smarterp/require-security-module': 'error',
  },
};

// eslint-plugin-smarterp/rules/require-security-module.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require SecurityModule import when PermissionService is injected',
    },
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        // Check if class has @Module decorator
        const moduleDecorator = node.decorators?.find((d) => d.expression.callee.name === 'Module');

        if (!moduleDecorator) return;

        // Check if any provider injects PermissionService
        const hasPermissionServiceDep = checkForPermissionServiceDependency(node);

        if (hasPermissionServiceDep) {
          // Check if SecurityModule is imported
          const importsSecurityModule = checkSecurityModuleImport(moduleDecorator);

          if (!importsSecurityModule) {
            context.report({
              node: moduleDecorator,
              message: 'Module must import SecurityModule when using PermissionService',
            });
          }
        }
      },
    };
  },
};
```

#### Test 2.2: Pre-commit Hook Validation

```bash
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run module configuration validation
node scripts/validate-module-dependencies.js

if [ $? -ne 0 ]; then
  echo "❌ Module dependency validation failed"
  echo "Fix module imports before committing"
  exit 1
fi
```

```javascript
// scripts/validate-module-dependencies.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function validateModuleDependencies() {
  const errors = [];

  // Find all .module.ts files
  const moduleFiles = glob.sync('src/backend/**/*.module.ts');

  moduleFiles.forEach((moduleFile) => {
    const content = fs.readFileSync(moduleFile, 'utf8');

    // Check if module has providers that inject PermissionService
    const hasPermissionServiceDep = checkPermissionServiceDependency(moduleFile);

    if (hasPermissionServiceDep) {
      // Check if SecurityModule is imported
      const importsSecurityModule = content.includes('SecurityModule');

      if (!importsSecurityModule) {
        errors.push({
          file: moduleFile,
          message: 'Missing SecurityModule import (PermissionService dependency detected)',
        });
      }
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Module Dependency Validation Errors:\n');
    errors.forEach((err) => {
      console.error(`  ${err.file}`);
      console.error(`    ${err.message}\n`);
    });
    process.exit(1);
  }

  console.log('✅ All module dependencies validated');
}

function checkPermissionServiceDependency(moduleFile) {
  const serviceFile = moduleFile.replace('.module.ts', '.service.ts');

  if (!fs.existsSync(serviceFile)) return false;

  const content = fs.readFileSync(serviceFile, 'utf8');
  return content.includes('PermissionService');
}

validateModuleDependencies();
```

### Priority 3: E2E Tests for Critical Paths

#### Test 3.1: Server Bootstrap Test

```typescript
// test/bootstrap.e2e-spec.ts

describe('Application Bootstrap (e2e)', () => {
  let app: INestApplication;

  it('should bootstrap application without errors', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    await expect(app.init()).resolves.not.toThrow();
  });

  it('should resolve all critical services', async () => {
    const userService = app.get<UserService>(UserService);
    const authService = app.get<AuthService>(AuthService);
    const tenantService = app.get<TenantService>(TenantService);

    expect(userService).toBeDefined();
    expect(authService).toBeDefined();
    expect(tenantService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
```

**Why this test is important:**

- ✅ Tests actual application bootstrap
- ✅ Catches module configuration errors before deployment
- ✅ Verifies all critical services can be resolved
- ✅ Runs in CI/CD pipeline

### Priority 4: Security & Multi-tenancy Tests

#### Test 4.1: Tenant Isolation After Fix

```typescript
describe('UserService - Tenant Isolation (Integration)', () => {
  let service: UserService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UserModule,
        SecurityModule, // ✅ Now properly imported
        TypeOrmModule.forRoot(testDbConfig),
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should only return users from current tenant', async () => {
    // Seed data for multiple tenants
    await seedUsers([
      { id: 'user1', tenantId: 'tenant-1', email: 'user1@tenant1.com' },
      { id: 'user2', tenantId: 'tenant-2', email: 'user2@tenant2.com' },
    ]);

    const currentUser = { id: 'user1', tenantId: 'tenant-1', roles: ['user'] };
    const profile = await service.getProfile(currentUser, 'user1');

    expect(profile).toBeDefined();
    expect(profile.tenantId).toBe('tenant-1');
  });

  it('should deny access to other tenant users', async () => {
    const currentUser = { id: 'user1', tenantId: 'tenant-1', roles: ['user'] };

    await expect(
      service.getProfile(currentUser, 'user2'), // user2 belongs to tenant-2
    ).rejects.toThrow(NotFoundException);
  });
});
```

---

## 🎯 Test Coverage Analysis

### Current Coverage

**UserService Unit Tests:**

- ✅ `getProfile()` - Happy path
- ✅ `getProfile()` - User not found
- ✅ `updateProfile()` - Success
- ✅ `updateProfile()` - Partial update
- ✅ `updateProfile()` - User not found
- ✅ `changePassword()` - Success
- ✅ `changePassword()` - Password mismatch
- ✅ `changePassword()` - User not found
- ✅ `changePassword()` - Wrong current password

**Coverage:** ~85% (unit tests only)

### Missing Coverage

#### 1. Module Configuration (0% coverage)

- ❌ Module dependency resolution
- ❌ Module imports/exports
- ❌ Provider registration
- ❌ Circular dependency detection

#### 2. Integration Tests (0% coverage)

- ❌ Service with real PermissionService
- ❌ SecureRepository with real dependencies
- ❌ Multi-tenant queries with real database
- ❌ Permission checks with real PermissionService

#### 3. E2E Tests (0% coverage)

- ❌ Application bootstrap
- ❌ Full request lifecycle
- ❌ Authentication + Authorization flow
- ❌ Multi-tenant data isolation

#### 4. Security Tests (0% coverage)

- ❌ Tenant isolation verification
- ❌ Permission boundary testing
- ❌ Cross-tenant access attempts
- ❌ Privilege escalation attempts

### Target Coverage

| Test Type           | Current | Target | Priority     |
| ------------------- | ------- | ------ | ------------ |
| Unit Tests          | 85%     | 90%    | Medium       |
| Integration Tests   | 0%      | 80%    | **HIGH**     |
| E2E Tests           | 0%      | 60%    | **HIGH**     |
| Security Tests      | 0%      | 100%   | **CRITICAL** |
| Module Config Tests | 0%      | 100%   | **CRITICAL** |

---

## 🔧 Immediate Action Items

### 1. Fix Critical Modules (Priority: CRITICAL)

**Fix UserModule:**

```typescript
// src/backend/core/user/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module'; // ✅ ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CacheModule,
    SecurityModule, // ✅ ADD THIS
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

**Apply same fix to:**

- `core/tenant/tenant.module.ts`
- `core/auth/auth.module.ts`
- All 11 modules identified in scan

### 2. Add Module Integration Tests (Priority: HIGH)

Create integration test for each critical module:

- `user.module.integration.spec.ts`
- `tenant.module.integration.spec.ts`
- `auth.module.integration.spec.ts`

### 3. Add Automated Validation (Priority: HIGH)

- Implement ESLint custom rule
- Add pre-commit hook validation
- Add CI/CD pipeline check

### 4. Add E2E Bootstrap Test (Priority: HIGH)

- Create `test/bootstrap.e2e-spec.ts`
- Run in CI/CD before deployment
- Fail build if bootstrap fails

---

## 📊 Impact Assessment

### Before Fix

```
❌ Backend server: FAILS to start
✅ Unit tests: PASS (false positive)
❌ Integration tests: N/A (don't exist)
❌ E2E tests: N/A (don't exist)
```

### After Fix + Tests

```
✅ Backend server: Starts successfully
✅ Unit tests: PASS
✅ Integration tests: PASS (catch module config errors)
✅ E2E tests: PASS (verify full bootstrap)
✅ CI/CD: Blocks deployment if module config invalid
```

---

## 🎓 Lessons Learned

### Why This Happened

1. **Test Isolation Too Strong:** Unit tests mock everything, bypass real dependency resolution
2. **No Integration Tests:** Gap between unit tests and production runtime
3. **No Module Validation:** No automated checks for module configuration
4. **Inconsistent Patterns:** Some modules import SecurityModule, others don't

### Prevention Strategy

1. **Mandatory Integration Tests:** Every module MUST have integration test
2. **Automated Validation:** ESLint + pre-commit hooks catch errors early
3. **E2E Bootstrap Test:** Verify application can start before deployment
4. **Documentation:** Clear guidelines on when to import SecurityModule

### Best Practices Going Forward

#### ✅ DO:

- Write integration tests for modules
- Test actual dependency resolution
- Use ESLint custom rules for architecture validation
- Run E2E bootstrap test in CI/CD
- Document module dependencies clearly

#### ❌ DON'T:

- Rely solely on unit tests with mocks
- Skip integration tests "because unit tests pass"
- Assume module configuration is correct without testing
- Deploy without E2E bootstrap verification

---

## 📝 Test Implementation Checklist

### Phase 1: Critical Fixes (Day 1)

- [ ] Fix UserModule (add SecurityModule import)
- [ ] Fix TenantModule (add SecurityModule import)
- [ ] Fix AuthModule (add SecurityModule import)
- [ ] Add bootstrap E2E test
- [ ] Verify server starts successfully

### Phase 2: Integration Tests (Day 2-3)

- [ ] Create `user.module.integration.spec.ts`
- [ ] Create `tenant.module.integration.spec.ts`
- [ ] Create `auth.module.integration.spec.ts`
- [ ] Add integration tests for all 11 affected modules
- [ ] Achieve 80% integration test coverage

### Phase 3: Automated Validation (Day 4-5)

- [ ] Implement ESLint custom rule
- [ ] Create pre-commit hook validation script
- [ ] Add CI/CD pipeline check
- [ ] Document validation rules

### Phase 4: Security Tests (Day 6-7)

- [ ] Add tenant isolation integration tests
- [ ] Add permission boundary tests
- [ ] Add cross-tenant access attempt tests
- [ ] Achieve 100% security test coverage

### Phase 5: Documentation (Day 8)

- [ ] Update module development guidelines
- [ ] Create "Module Configuration Checklist"
- [ ] Document SecurityModule import requirements
- [ ] Add examples to developer docs

---

## 🚀 Success Metrics

### Code Quality

- ✅ All 11 modules fixed (100%)
- ✅ Integration test coverage: 80%+
- ✅ E2E test coverage: 60%+
- ✅ Security test coverage: 100%

### Automation

- ✅ ESLint rule catches 100% of missing imports
- ✅ Pre-commit hook prevents invalid commits
- ✅ CI/CD blocks deployment on bootstrap failure

### Team Velocity

- ✅ Zero module configuration bugs in production
- ✅ Faster debugging (caught in CI/CD, not production)
- ✅ Increased confidence in deployments

---

## 📚 References

### Related Documents

- `docs/ODOO-ARCHITECTURE-ANALYSIS.md` - Module architecture patterns
- `docs/ERPNEXT-ARCHITECTURE-ANALYSIS.md` - Multi-tenancy patterns
- `.kiro/steering/odoo-erpnext-architecture.md` - Architecture principles

### Testing Patterns

- NestJS Testing Documentation: https://docs.nestjs.com/fundamentals/testing
- Integration Testing Best Practices
- E2E Testing with NestJS

### Security

- Multi-tenancy Testing Guide
- Permission System Testing
- Tenant Isolation Verification

---

**Assessment Completed:** 2026-03-09  
**Next Review:** After Phase 1 fixes implemented  
**Estimated Fix Time:** 8 days (all phases)  
**Risk Level:** 🔴 CRITICAL → 🟢 LOW (after fixes)
