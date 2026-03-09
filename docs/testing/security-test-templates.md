# Security Test Templates

**Version:** 1.0.0  
**Last Updated:** 2026-03-09  
**Status:** ✅ Ready for Team Use

---

## 🎯 Overview

This document provides comprehensive security test templates for SmartERP services. These templates ensure **100% security test coverage** across all 30 services.

### Why Security Tests Are Critical

**Current Status:**

- ❌ 0% security test coverage
- 🔴 CRITICAL RISK: Tenant data leakage
- 🔴 CRITICAL RISK: Unauthorized access
- 🔴 GDPR violation potential

**Target Status:**

- ✅ 100% security test coverage
- ✅ Tenant isolation verified
- ✅ Permission checks enforced
- ✅ GDPR compliant

### Security Test Categories

1. **Tenant Isolation Tests** - Prevent cross-tenant data access
2. **Permission Denial Tests** - Enforce role-based access control

---

## 📋 Template Files

### 1. Tenant Isolation Test Template

**File:** `docs/testing/tenant-isolation-test.template.ts`

**Purpose:** Ensure users can ONLY access data from their own tenant.

**Test Coverage:**

- ✅ Tenant filter applied to all queries
- ✅ Cross-tenant access prevention
- ✅ TenantId auto-set on create
- ✅ Bulk operations respect tenant isolation
- ✅ Cache keys include tenantId
- ✅ Related entities from same tenant only

**When to Use:**

- Every service that queries the database
- Services with findAll, findOne, create, update, delete
- Services with custom query methods

### 2. Permission Denial Test Template

**File:** `docs/testing/permission-denial-test.template.ts`

**Purpose:** Ensure permission checks are enforced BEFORE database access.

**Test Coverage:**

- ✅ Read permission denial
- ✅ Write permission denial
- ✅ Delete permission denial
- ✅ Permission check order
- ✅ Role-based access control
- ✅ Clear error messages

**When to Use:**

- Every service operation (read, write, delete)
- Services with role-based access
- Services with sensitive data

---

## 🚀 Quick Start Guide

### Step 1: Choose Your Template

**For Tenant Isolation:**

```bash
# Copy template
cp docs/testing/tenant-isolation-test.template.ts src/backend/domains/your-domain/your-service.tenant.spec.ts
```

**For Permission Denial:**

```bash
# Copy template
cp docs/testing/permission-denial-test.template.ts src/backend/domains/your-domain/your-service.permission.spec.ts
```

### Step 2: Replace Placeholders

Find and replace these placeholders:

- `{{EntityName}}` → Your entity name (PascalCase, e.g., `Order`, `Product`)
- `{{entityName}}` → Lowercase version (e.g., `order`, `product`)
- `{{entity-name}}` → Kebab-case version (e.g., `order`, `product`)

**Example:**

```typescript
// Before
describe('{{EntityName}}Service - Tenant Isolation', () => {

// After
describe('OrderService - Tenant Isolation', () => {
```

### Step 3: Adjust Mock Data

Update mock data to match your entity structure:

```typescript
// Template default
const mockEntity = {
  id: '1',
  tenantId: mockUser.tenantId,
  name: 'Test Entity',
};

// Your entity
const mockOrder = {
  id: '1',
  tenantId: mockUser.tenantId,
  orderNumber: 'ORD-001',
  customerId: 'cust-1',
  status: 'pending',
  totalAmount: 1000,
};
```

### Step 4: Run Tests

```bash
# Run specific test file
npm test -- your-service.tenant.spec.ts

# Run all security tests
npm test -- --testNamePattern="Tenant Isolation|Permission Denial"
```

---

## 📖 Detailed Usage Guide

### Tenant Isolation Tests

#### Test Structure

```typescript
describe('YourService - Tenant Isolation', () => {
  // Setup mocks
  // Test 1: Tenant filter applied
  // Test 2: Cross-tenant access prevention
  // Test 3: TenantId auto-set on create
  // Test 4: Bulk operations
  // Test 5: Cache key isolation
  // Test 6: Relationship isolation
});
```

#### Key Test Cases

**1. Tenant Filter Applied**

```typescript
it('should apply tenantId filter when querying all items', async () => {
  await service.findAll(tenant1User, 1, 20);

  expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
    tenant1User,
    expect.any(Object),
    'EntityName',
  );

  expect(mockRepository.find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-1' }),
    }),
  );
});
```

**2. Cross-Tenant Access Prevention**

```typescript
it('should NOT allow accessing other tenant data by id', async () => {
  // Try to access tenant-2 data with tenant-1 user
  mockRepository.findOne.mockResolvedValue(null);

  await expect(service.findOne(tenant1User, '999')).rejects.toThrow();

  expect(mockRepository.findOne).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: '999',
        tenantId: 'tenant-1', // User's tenant, not item's tenant
      }),
    }),
  );
});
```

**3. TenantId Auto-Set**

```typescript
it('should automatically set tenantId from user context on create', async () => {
  await service.create(tenant1User, createDto);

  const savedEntity = mockRepository.save.mock.calls[0][0];
  expect(savedEntity.tenantId).toBe('tenant-1');
  expect(savedEntity.createdBy).toBe('user-1');
});
```

#### Common Patterns

**Pattern 1: Multiple Tenants**

```typescript
const tenant1User = createMockUser({ id: 'user-1', tenantId: 'tenant-1' });
const tenant2User = createMockUser({ id: 'user-2', tenantId: 'tenant-2' });
```

**Pattern 2: Mixed Tenant Data**

```typescript
const mixedData = [
  { id: '1', tenantId: 'tenant-1', name: 'Tenant 1 Item' },
  { id: '2', tenantId: 'tenant-2', name: 'Tenant 2 Item' },
];
mockRepository.find.mockResolvedValue(mixedData.filter((item) => item.tenantId === user.tenantId));
```

**Pattern 3: Cache Key Isolation**

```typescript
expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
  expect.stringContaining('tenant-1'),
  expect.any(Function),
);
```

---

### Permission Denial Tests

#### Test Structure

```typescript
describe('YourService - Permission Denial', () => {
  // Setup mocks
  // Test 1: Read permission denial
  // Test 2: Write permission denial
  // Test 3: Delete permission denial
  // Test 4: Permission check order
  // Test 5: Role-based access
  // Test 6: Error messages
});
```

#### Key Test Cases

**1. Read Permission Denial**

```typescript
it('should deny access when user lacks read permission', async () => {
  mockPermissionService.canRead.mockReturnValue(false);
  mockRepository.findOne.mockResolvedValue(mockEntity);

  await expect(service.findOne(mockUser, '1')).rejects.toThrow(ForbiddenException);

  expect(mockPermissionService.canRead).toHaveBeenCalledWith(mockUser, mockEntity, 'EntityName');
});
```

**2. Write Permission Denial**

```typescript
it('should deny update when user lacks write permission', async () => {
  mockPermissionService.canWrite.mockReturnValue(false);
  mockRepository.findOne.mockResolvedValue(mockEntity);

  await expect(service.update(mockUser, '1', { name: 'Updated' })).rejects.toThrow(
    ForbiddenException,
  );
});
```

**3. Delete Permission Denial**

```typescript
it('should deny delete when user lacks delete permission', async () => {
  mockPermissionService.canDelete.mockReturnValue(false);
  mockRepository.findOne.mockResolvedValue(mockEntity);

  await expect(service.remove(mockUser, '1')).rejects.toThrow(ForbiddenException);
});
```

#### Common Patterns

**Pattern 1: Permission Setup**

```typescript
beforeEach(() => {
  // Default: Allow all permissions
  mockPermissionService.canRead.mockReturnValue(true);
  mockPermissionService.canWrite.mockReturnValue(true);
  mockPermissionService.canDelete.mockReturnValue(true);
});

// In specific test: Deny permission
mockPermissionService.canRead.mockReturnValue(false);
```

**Pattern 2: Role-Based Testing**

```typescript
const regularUser = createMockUser({ roles: ['user'] });
const adminUser = createMockUser({ roles: ['admin'] });
const viewerUser = createMockUser({ roles: ['viewer'] });
```

**Pattern 3: Database Not Called**

```typescript
try {
  await service.update(mockUser, '1', { name: 'Hacked' });
} catch (error) {
  // Expected to throw
}

expect(mockRepository.save).not.toHaveBeenCalled();
```

---

## 🎓 Best Practices

### 1. Test Naming Conventions

**Good:**

```typescript
it('should deny access when user lacks read permission', async () => {
it('should NOT return data from other tenants in findAll', async () => {
it('should automatically set tenantId from user context on create', async () => {
```

**Bad:**

```typescript
it('test permission', async () => {
it('works', async () => {
it('should pass', async () => {
```

### 2. Mock Setup

**Good:**

```typescript
const mockPermissionService = {
  buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
  canRead: jest.fn().mockReturnValue(true),
  canWrite: jest.fn().mockReturnValue(true),
  canDelete: jest.fn().mockReturnValue(true),
};
```

**Bad:**

```typescript
const mockPermissionService = {
  canRead: jest.fn(), // No default return value
};
```

### 3. Assertion Specificity

**Good:**

```typescript
expect(mockRepository.find).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({ tenantId: 'tenant-1' }),
  }),
);
```

**Bad:**

```typescript
expect(mockRepository.find).toHaveBeenCalled(); // Too vague
```

### 4. Test Independence

**Good:**

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset to default state
});
```

**Bad:**

```typescript
// No cleanup between tests
// Tests depend on execution order
```

### 5. Error Verification

**Good:**

```typescript
await expect(service.findOne(mockUser, '1')).rejects.toThrow(ForbiddenException);
await expect(service.findOne(mockUser, '1')).rejects.toThrow(
  expect.objectContaining({
    message: expect.stringContaining('permission'),
  }),
);
```

**Bad:**

```typescript
try {
  await service.findOne(mockUser, '1');
} catch (error) {
  // No assertion
}
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Mocking Raw TypeORM

**❌ WRONG:**

```typescript
const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  }),
};
```

**✅ CORRECT:**

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};
```

**Why:** SecureRepository abstracts TypeORM. Mock the abstraction, not the implementation.

### Pitfall 2: No Permission Mocking

**❌ WRONG:**

```typescript
// No PermissionService mock
const module = await Test.createTestingModule({
  providers: [YourService],
}).compile();
```

**✅ CORRECT:**

```typescript
const module = await Test.createTestingModule({
  providers: [
    YourService,
    {
      provide: PermissionService,
      useValue: mockPermissionService,
    },
  ],
}).compile();
```

### Pitfall 3: Testing Happy Path Only

**❌ WRONG:**

```typescript
describe('findOne', () => {
  it('should find entity by id', async () => {
    // Only tests success case
  });
});
```

**✅ CORRECT:**

```typescript
describe('findOne', () => {
  it('should find entity by id', async () => {
    // Success case
  });

  it('should deny access when user lacks read permission', async () => {
    // Permission denial
  });

  it('should NOT allow accessing other tenant data', async () => {
    // Tenant isolation
  });

  it('should throw NotFoundException if not found', async () => {
    // Not found case
  });
});
```

### Pitfall 4: Ignoring Cache in Tests

**❌ WRONG:**

```typescript
mockRepository.findOne.mockResolvedValue(mockEntity);
await service.findOne(mockUser, '1');
// Cache not mocked - test fails
```

**✅ CORRECT:**

```typescript
mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
mockRepository.findOne.mockResolvedValue(mockEntity);
await service.findOne(mockUser, '1');
```

### Pitfall 5: Not Verifying Database Not Called

**❌ WRONG:**

```typescript
it('should deny write permission', async () => {
  mockPermissionService.canWrite.mockReturnValue(false);

  await expect(service.update(mockUser, '1', {})).rejects.toThrow();
  // Doesn't verify database wasn't called
});
```

**✅ CORRECT:**

```typescript
it('should deny write permission', async () => {
  mockPermissionService.canWrite.mockReturnValue(false);

  try {
    await service.update(mockUser, '1', {});
  } catch (error) {
    // Expected
  }

  expect(mockRepository.save).not.toHaveBeenCalled();
});
```

---

## 📊 Coverage Requirements

### Minimum Security Test Coverage

Every service MUST have:

1. **Tenant Isolation Tests (6 minimum)**
   - ✅ Tenant filter applied to queries
   - ✅ Cross-tenant access prevention (read)
   - ✅ Cross-tenant access prevention (update)
   - ✅ Cross-tenant access prevention (delete)
   - ✅ TenantId auto-set on create
   - ✅ Cache key tenant isolation

2. **Permission Denial Tests (6 minimum)**
   - ✅ Read permission denial
   - ✅ Write permission denial (create)
   - ✅ Write permission denial (update)
   - ✅ Delete permission denial
   - ✅ Role-based access control
   - ✅ Clear error messages

### Total: 12 Security Tests per Service

**For 30 services:** 360 security tests minimum

---

## 🔍 Examples by Service Type

### Example 1: Simple CRUD Service

**Service:** ProductService  
**Operations:** findAll, findOne, create, update, remove

**Security Tests Needed:**

- 6 Tenant Isolation tests
- 6 Permission Denial tests
- **Total:** 12 tests

### Example 2: Complex Business Logic Service

**Service:** OrderService  
**Operations:** findAll, findOne, create, update, remove, updateStatus, ship, deliver, cancel

**Security Tests Needed:**

- 8 Tenant Isolation tests (includes custom methods)
- 10 Permission Denial tests (includes status transitions)
- **Total:** 18 tests

### Example 3: Read-Only Service

**Service:** ReportService  
**Operations:** findAll, findOne, generate

**Security Tests Needed:**

- 4 Tenant Isolation tests
- 3 Permission Denial tests (read only)
- **Total:** 7 tests

---

## 🎯 Testing Checklist

Use this checklist when adding security tests:

### Before Writing Tests

- [ ] Read this documentation
- [ ] Copy appropriate template
- [ ] Understand service operations
- [ ] Identify sensitive data

### While Writing Tests

- [ ] Replace all placeholders
- [ ] Adjust mock data structure
- [ ] Add service-specific test cases
- [ ] Test all CRUD operations
- [ ] Test custom business logic
- [ ] Verify error messages

### After Writing Tests

- [ ] Run tests locally
- [ ] Check test coverage (>80%)
- [ ] Review with QA Engineer
- [ ] Update service documentation
- [ ] Commit with clear message

---

## 📚 Additional Resources

### Related Documentation

- `docs/testing/security-test-review-checklist.md` - Review criteria
- `src/common/test/test-helpers.ts` - Test utilities
- `templates/service.spec.template.ts` - General test template

### Code Examples

- `src/backend/domains/sales/order/order.service.spec.ts` - Full example
- `src/backend/platform/notification/notification.service.spec.ts` - Another example

### Tools & Commands

```bash
# Run all tests
npm test

# Run security tests only
npm test -- --testNamePattern="Tenant Isolation|Permission Denial"

# Run tests for specific service
npm test -- order.service.spec.ts

# Check coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## 🚨 Security Impact Summary

### Without Security Tests

- ❌ Tenant data leakage risk
- ❌ Unauthorized access possible
- ❌ GDPR violation potential
- ❌ No audit trail
- ❌ Production incidents

### With Security Tests

- ✅ Tenant isolation verified
- ✅ Permission checks enforced
- ✅ GDPR compliant
- ✅ Audit trail complete
- ✅ Production-ready

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Ready for Team Use  
**Next Review:** Week 2 Day 1
