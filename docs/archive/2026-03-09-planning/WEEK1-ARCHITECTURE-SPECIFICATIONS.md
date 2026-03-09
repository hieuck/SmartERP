# Week 1 Architecture Specifications - Security Fix Sprint

**Date**: 2026-03-09  
**Prepared by**: Solution Architect  
**Status**: ✅ Ready for Execution  
**Sprint**: Week 52.1 (Days 1-5)

---

## 📊 EXECUTIVE SUMMARY

### Context

- **Current State**: 10 modules missing SecurityModule (CRITICAL vulnerability)
- **Validation**: Pattern tested on 2 modules (95% confidence)
- **Team Ready**: All prep work complete, guides available
- **Timeline**: 5 days (2026-03-10 to 2026-03-14)

### Architecture Goals

1. **Eliminate security vulnerabilities** - 0 multi-tenant data leakage risks
2. **Establish security foundation** - All modules use SecurityModule
3. **Implement comprehensive testing** - 360 security tests (12 tests × 30 services)
4. **Enable safe refactoring** - Secure foundation for Week 2+ work

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current Architecture State

```
SmartERP Architecture (Before Week 1)
├── Core Security Layer
│   ├── SecurityModule ✅ (exists)
│   ├── PermissionService ✅ (exists)
│   └── SecureRepository ✅ (exists)
├── Platform Modules
│   ├── notification ❌ Missing SecurityModule
│   ├── email ❌ Missing SecurityModule
│   └── document ❌ Missing SecurityModule
├── Domain Modules
│   ├── eCommerce
│   │   ├── product-catalog ❌ Missing SecurityModule
│   │   ├── shopping-cart ❌ Missing SecurityModule
│   │   ├── checkout ❌ Missing SecurityModule
│   │   ├── order ❌ Missing SecurityModule
│   │   └── payment ❌ Missing SecurityModule
│   ├── HR
│   │   ├── attendance ❌ Missing SecurityModule
│   │   └── leave ❌ Missing SecurityModule
│   └── Manufacturing
│       ├── bom ❌ Missing SecurityModule
│       └── work-order ❌ Missing SecurityModule
└── Integration Modules
    ├── payment-gateway ❌ Missing SecurityModule
    └── webhook ❌ Missing SecurityModule
```

### Target Architecture State (After Week 1)

```
SmartERP Architecture (After Week 1)
├── Core Security Layer
│   ├── SecurityModule ✅ (enhanced)
│   ├── PermissionService ✅ (enhanced)
│   └── SecureRepository ✅ (enhanced)
├── Platform Modules
│   ├── notification ✅ SecurityModule integrated
│   ├── email ✅ SecurityModule integrated
│   └── document ✅ SecurityModule integrated
├── Domain Modules (ALL SECURE)
│   ├── eCommerce ✅ All modules secured
│   ├── HR ✅ All modules secured
│   └── Manufacturing ✅ All modules secured
└── Integration Modules ✅ All modules secured
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### 1. SecurityModule Integration Pattern

#### 1.1 Module-Level Integration

**Pattern**: Add SecurityModule to module imports

**Before (Vulnerable)**:

```typescript
// notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    // ❌ Missing SecurityModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
```

**After (Secure)**:

```typescript
// notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '@/common/security/security.module'; // ✅ ADD THIS
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    SecurityModule, // ✅ ADD THIS
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
```

**Architecture Benefits**:

- ✅ PermissionService available via DI
- ✅ SecureRepository can be instantiated
- ✅ Tenant isolation enforced
- ✅ Audit trail enabled

#### 1.2 Service-Level Integration

**Pattern**: Use SecureRepository in services

**Reference Implementation** (product-category.service.ts):

```typescript
@Injectable()
export class ProductCategoryService {
  private secureCategoryRepo: SecureRepository<ProductCategory>;

  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService, // ✅ Injected from SecurityModule
  ) {
    // ✅ Initialize SecureRepository
    this.secureCategoryRepo = new SecureRepository(
      categoryRepository,
      permissionService,
      'ProductCategory',
    );
  }

  // ✅ All methods use SecureRepository
  async findAll(user: User, page: number = 1, limit: number = 20) {
    return await this.secureCategoryRepo.find(user, {
      order: { name: 'ASC' },
    });
  }
}
```

**Key Architecture Principles**:

1. **User context required** - All methods accept `User` parameter
2. **Automatic tenant filtering** - SecureRepository adds `tenantId` filter
3. **Permission checks** - canRead/canWrite/canDelete enforced
4. **No raw TypeORM** - Never use repository directly

---

### 2. Security Test Architecture

#### 2.1 Test Structure

**Pattern**: 2 test types × 6 test cases = 12 tests per service

**Test Categories**:

1. **Tenant Isolation Tests** (6 tests)
   - Tenant filter in queries
   - Cross-tenant access prevention
   - Tenant isolation in create
   - Bulk operations
   - Cache key isolation

2. **Permission Denial Tests** (6 tests)
   - Read permission denial
   - Write permission denial
   - Delete permission denial
   - Role-based access control

**Reference Implementation** (product-category.security.spec.ts):

```typescript
describe('ProductCategoryService - Security Tests', () => {
  // ==========================================
  // TENANT ISOLATION TESTS (6 tests)
  // ==========================================
  describe('Tenant Isolation', () => {
    it('should apply tenantId filter when querying all categories', async () => {
      // Test implementation
    });

    it('should NOT return data from other tenants in findAll', async () => {
      // Test implementation
    });

    it('should automatically set tenantId from user context on create', async () => {
      // Test implementation
    });

    it('should IGNORE tenantId in DTO and use user tenantId', async () => {
      // Security test: Prevent tenant injection
    });

    it('should only count categories from user tenant', async () => {
      // Test implementation
    });

    it('should include tenantId in cache keys', async () => {
      // Test implementation
    });
  });

  // ==========================================
  // PERMISSION DENIAL TESTS (6 tests)
  // ==========================================
  describe('Permission Denial', () => {
    it('should deny access when user lacks read permission', async () => {
      // Test implementation
    });

    it('should deny update when user lacks write permission', async () => {
      // Test implementation
    });

    it('should deny create when user lacks write permission', async () => {
      // Test implementation
    });

    it('should deny delete when user lacks delete permission', async () => {
      // Test implementation
    });

    it('should deny access for user role when admin role required', async () => {
      // Test implementation
    });

    it('should allow access for admin role', async () => {
      // Test implementation
    });
  });
});
```

#### 2.2 Mock Architecture

**Critical Pattern**: Mock SecureRepository methods, NOT raw TypeORM

**CORRECT Mocking**:

```typescript
const mockCategoryRepository = {
  find: jest.fn(), // ✅ Mock these
  findOne: jest.fn(), // ✅ Mock these
  save: jest.fn(), // ✅ Mock these
  remove: jest.fn(), // ✅ Mock these
};

const mockPermissionService = {
  buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
  canRead: jest.fn().mockReturnValue(true),
  canWrite: jest.fn().mockReturnValue(true),
  canDelete: jest.fn().mockReturnValue(true),
};
```

**INCORRECT Mocking** (DO NOT USE):

```typescript
const mockCategoryRepository = {
  createQueryBuilder: jest.fn(), // ❌ Don't mock QueryBuilder
  update: jest.fn(), // ❌ Don't mock raw methods
  delete: jest.fn(), // ❌ Don't mock raw methods
};
```

**Why?**

- SecureRepository wraps TypeORM methods
- Tests should verify SecureRepository behavior
- Mocking QueryBuilder bypasses security layer

---

### 3. Module Dependency Architecture

#### 3.1 Dependency Hierarchy

**Architecture Principle**: Clear dependency hierarchy prevents circular dependencies

```
Level 1: Core Modules (No dependencies)
├── SecurityModule
├── CacheModule
└── LoggerModule

Level 2: Platform Modules (Depend on Core)
├── NotificationModule → SecurityModule ✅
├── EmailModule → SecurityModule ✅
└── DocumentModule → SecurityModule ✅

Level 3: Domain Modules (Depend on Core + Platform)
├── eCommerce
│   ├── ProductCatalogModule → SecurityModule ✅
│   ├── ShoppingCartModule → SecurityModule ✅
│   ├── CheckoutModule → SecurityModule ✅
│   ├── OrderModule → SecurityModule ✅
│   └── PaymentModule → SecurityModule ✅
├── HR
│   ├── AttendanceModule → SecurityModule ✅
│   └── LeaveModule → SecurityModule ✅
└── Manufacturing
    ├── BOMModule → SecurityModule ✅
    └── WorkOrderModule → SecurityModule ✅

Level 4: Integration Modules (Depend on Core + Domain)
├── PaymentGatewayModule → SecurityModule ✅
└── WebhookModule → SecurityModule ✅
```

#### 3.2 Circular Dependency Prevention

**Risk Areas Identified**:

1. email ↔ notification (both send notifications)
2. order ↔ payment (order creates payment, payment updates order)
3. checkout ↔ order (checkout creates order, order updates checkout)

**Mitigation Strategy**:

```typescript
// Use forwardRef() if circular dependency detected
@Module({
  imports: [
    forwardRef(() => SecurityModule), // ✅ Breaks circular dependency
  ],
})
export class ProblematicModule {}
```

**Architecture Rule**: Domain modules should NOT depend on each other directly. Use events for cross-domain communication.

---

### 4. Cache Architecture for Security

#### 4.1 Tenant-Isolated Cache Keys

**Pattern**: Include tenantId in all cache keys

**Implementation**:

```typescript
async findOne(user: User, id: string): Promise<ProductCategory> {
  // ✅ Cache key includes tenantId
  const cacheKey = `category:${user.tenantId}:${id}`;

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const category = await this.secureCategoryRepo.findOne(user, {
        where: { id } as any,
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    },
    CacheTTL.LONG,
  );
}
```

**Architecture Benefits**:

- ✅ Prevents cache poisoning across tenants
- ✅ Each tenant has isolated cache namespace
- ✅ Cache invalidation scoped to tenant

#### 4.2 Cache Invalidation Strategy

**Pattern**: Invalidate cache after mutations

```typescript
async update(user: User, id: string, updateDto: UpdateProductCategoryDto) {
  const category = await this.findOne(user, id);

  // ... update logic ...

  const updated = await this.secureCategoryRepo.save(user, category);

  // ✅ Invalidate cache after update
  await this.cacheService.del(`category:${user.tenantId}:${id}`);

  return updated;
}

async remove(user: User, id: string): Promise<void> {
  const category = await this.findOne(user, id);
  await this.secureCategoryRepo.remove(user, category);

  // ✅ Invalidate cache after delete
  await this.cacheService.del(`category:${user.tenantId}:${id}`);
}
```

---

## 📋 WEEK 1 EXECUTION ARCHITECTURE

### Day 1: Module Fixes + Test Template Design

#### Architecture Tasks

**1. SecurityModule Integration (10 modules)**

**Modules to Fix**:

```
Core (3):
├── notification.module.ts
├── email.module.ts
└── document.module.ts

eCommerce (5):
├── product-catalog.module.ts
├── shopping-cart.module.ts
├── checkout.module.ts
├── order.module.ts
└── payment.module.ts

HR (2):
├── attendance.module.ts
└── leave.module.ts

Manufacturing (2):
├── bom.module.ts
└── work-order.module.ts

Integration (2):
├── payment-gateway.module.ts
└── webhook.module.ts
```

**Fix Pattern** (2 lines per module):

```typescript
// Line 1: Add import
import { SecurityModule } from '@/common/security/security.module';

// Line 2: Add to imports array
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity]),
    SecurityModule, // Add here
  ],
})
```

**Verification Steps**:

1. Compilation check: `npm run build`
2. Test check: `npm test -- module-name`
3. No circular dependency warnings
4. Module loads correctly

**2. Test Template Design**

**Deliverables**:

- `docs/testing/tenant-isolation-test.template.ts`
- `docs/testing/permission-denial-test.template.ts`
- `docs/testing/security-test-templates.md`

**Template Structure**:

```typescript
// tenant-isolation-test.template.ts
describe('{ServiceName} - Tenant Isolation Tests', () => {
  describe('Tenant Filter in Queries', () => {
    it('should apply tenantId filter when querying all {entities}', async () => {
      // Template implementation
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('should NOT return data from other tenants in findAll', async () => {
      // Template implementation
    });
  });

  // ... 4 more test cases
});
```

---

### Day 2-3: Parallel Execution

#### Architecture: Team A (Security Tests)

**Pattern Distribution**:

**Pattern 1 - E-Commerce Services** (5 services):

- product-catalog.service
- shopping-cart.service
- checkout.service
- order.service
- payment.service

**Pattern 2 - Platform Services** (8 services):

- notification.service
- email.service
- document.service
- workflow.service
- approval.service
- dashboard.service
- search.service
- settings.service

**Pattern 3 - Integration Services** (3 services):

- payment-gateway.service
- shipping.service
- webhook.service

**Pattern 4 - Domain Services** (3 services):

- accounting.service
- inventory.service
- hr.service

**Pattern 5 - Core Services** (4 services):

- audit.service
- cache.service
- event.service
- storage.service

**Total**: 23 services × 12 tests = 276 security tests

#### Architecture: Team B (Refactoring)

**Services to Refactor** (8 services):

**Platform Services**:

1. notification.service.ts (3 hours)
2. email.service.ts (3 hours)
3. document.service.ts (3 hours)
4. workflow.service.ts (3 hours)
5. approval.service.ts (4 hours)
6. dashboard.service.ts (6 hours)
7. search.service.ts (5 hours)
8. settings.service.ts (5 hours)

**Refactoring Pattern**:

```typescript
// BEFORE: Raw TypeORM
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async findAll(tenantId: string) {
    return await this.notificationRepo.find({
      where: { tenantId }, // ❌ Manual tenant filter
    });
  }
}

// AFTER: SecureRepository
@Injectable()
export class NotificationService {
  private secureNotificationRepo: SecureRepository<Notification>;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly permissionService: PermissionService, // ✅ Injected
  ) {
    this.secureNotificationRepo = new SecureRepository(
      notificationRepo,
      permissionService,
      'Notification',
    );
  }

  async findAll(user: User) {
    return await this.secureNotificationRepo.find(user, {
      // ✅ Automatic tenant filter + permission check
    });
  }
}
```

---

### Day 4: Integration & E2E Testing

#### Architecture: E2E Security Testing

**Test Scenarios**:

**1. Cross-Tenant Access Attempts**:

```typescript
describe('E2E Security - Cross-Tenant Access', () => {
  it('should prevent Tenant A from accessing Tenant B data via API', async () => {
    // Create data for Tenant B
    const tenantBCategory = await createCategory(tenantBUser, { name: 'Tenant B Category' });

    // Try to access with Tenant A credentials
    const response = await request(app.getHttpServer())
      .get(`/api/categories/${tenantBCategory.id}`)
      .set('Authorization', `Bearer ${tenantAToken}`)
      .expect(404); // Should not find (tenant isolation)

    expect(response.body.error).toContain('not found');
  });
});
```

**2. Permission Escalation Attempts**:

```typescript
describe('E2E Security - Permission Escalation', () => {
  it('should prevent regular user from performing admin actions', async () => {
    const regularUserToken = await getToken(regularUser);

    const response = await request(app.getHttpServer())
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(403); // Forbidden

    expect(response.body.error).toContain('permission');
  });
});
```

**3. Tenant Injection Attempts**:

```typescript
describe('E2E Security - Tenant Injection', () => {
  it('should ignore tenantId in request body and use authenticated user tenant', async () => {
    const maliciousPayload = {
      name: 'Malicious Category',
      tenantId: 'other-tenant-id', // Trying to inject different tenant
    };

    const response = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send(maliciousPayload)
      .expect(201);

    // Verify: Created with correct tenantId (from token, not payload)
    expect(response.body.data.tenantId).toBe(tenantAUser.tenantId);
    expect(response.body.data.tenantId).not.toBe('other-tenant-id');
  });
});
```

---

### Day 5: Edge Cases + Production Readiness

#### Architecture: Edge Case Testing

**Test Categories**:

**1. Null/Undefined Handling**:

```typescript
describe('Edge Cases - Null/Undefined', () => {
  it('should handle null tenantId gracefully', async () => {
    const userWithNullTenant = { ...tenant1User, tenantId: null };

    await expect(service.findAll(userWithNullTenant)).rejects.toThrow();
  });

  it('should handle undefined user gracefully', async () => {
    await expect(service.findAll(undefined as any)).rejects.toThrow();
  });
});
```

**2. Deleted/Expired Users**:

```typescript
describe('Edge Cases - Deleted Users', () => {
  it('should deny access for deleted users', async () => {
    const deletedUser = { ...tenant1User, deletedAt: new Date() };
    mockPermissionService.canRead.mockReturnValue(false);

    await expect(service.findOne(deletedUser, '1')).rejects.toThrow(ForbiddenException);
  });
});
```

**3. Expired Sessions**:

```typescript
describe('Edge Cases - Expired Sessions', () => {
  it('should deny access for expired session tokens', async () => {
    const expiredUser = { ...tenant1User, sessionExpiry: new Date('2020-01-01') };
    mockPermissionService.canRead.mockReturnValue(false);

    await expect(service.findAll(expiredUser)).rejects.toThrow(ForbiddenException);
  });
});
```

#### Architecture: Performance Testing

**Metrics to Measure**:

**1. Query Performance**:

```typescript
describe('Performance - Query Time', () => {
  it('should complete findAll query in < 200ms', async () => {
    const start = Date.now();
    await service.findAll(tenant1User, 1, 100);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
  });
});
```

**2. API Response Time**:

```typescript
describe('Performance - API Response', () => {
  it('should respond to GET /api/categories in < 200ms', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.duration).toBeLessThan(200);
  });
});
```

**3. Database Load**:

```typescript
describe('Performance - Database Load', () => {
  it('should not increase query count after SecurityModule integration', async () => {
    const queryCountBefore = await getQueryCount();

    await service.findAll(tenant1User, 1, 20);

    const queryCountAfter = await getQueryCount();
    const queriesExecuted = queryCountAfter - queryCountBefore;

    expect(queriesExecuted).toBeLessThanOrEqual(2); // 1 for data, 1 for count
  });
});
```

---

## 🎯 SUCCESS CRITERIA

### Architecture Quality Gates

**Week 1 Exit Criteria**:

**1. Security**:

- ✅ 0 security vulnerabilities
- ✅ 10/10 modules have SecurityModule
- ✅ 360/360 security tests passing (12 tests × 30 services)
- ✅ 0 cross-tenant data leakage incidents

**2. Code Quality**:

- ✅ 0 TypeScript compilation errors
- ✅ 85%+ test pass rate
- ✅ All E2E security tests passing
- ✅ Code review approved by Tech Lead

**3. Performance**:

- ✅ API response time p95 < 200ms
- ✅ Database query time p95 < 50ms
- ✅ No performance regression vs baseline

**4. Documentation**:

- ✅ All modules documented
- ✅ Security test templates available
- ✅ Architecture decisions recorded
- ✅ ROADMAP and CHANGELOG updated

---

## 🚨 RISK MITIGATION

### Architecture Risks

**Risk 1: Circular Dependencies**

**Mitigation**:

```typescript
// Use forwardRef() if needed
@Module({
  imports: [
    forwardRef(() => SecurityModule),
  ],
})
```

**Risk 2: Performance Degradation**

**Mitigation**:

- Measure baseline performance before changes
- Monitor query count and response time
- Use caching aggressively
- Optimize database indexes

**Risk 3: Test Failures**

**Mitigation**:

- Test after each module fix (incremental)
- Use reference implementation (product-category)
- Mock correctly (SecureRepository methods, not QueryBuilder)
- Escalate to Senior Dev #1 if blocked > 30 min

**Risk 4: Breaking Changes**

**Mitigation**:

- Small commits (1 module per commit)
- Run full test suite after each change
- Keep rollback plan ready
- Document all changes

---

## 📚 ARCHITECTURE REFERENCES

### Key Documents

1. **Security Patterns**:
   - `docs/testing/security-test-templates.md`
   - `docs/testing/tenant-isolation-test.template.ts`
   - `docs/testing/permission-denial-test.template.ts`

2. **Reference Implementations**:
   - `src/backend/domains/inventory/category/product-category.service.ts`
   - `src/backend/domains/inventory/category/product-category.security.spec.ts`
   - `src/backend/common/security/secure-repository.ts`

3. **Architecture Guides**:
   - `docs/guides/module-security-fix-guide.md`
   - `docs/guides/service-refactoring-guide.md`
   - `.kiro/steering/odoo-erpnext-architecture.md`

4. **Project Plans**:
   - `docs/project/NEXT-SPRINT-PLAN.md`
   - `docs/project/TASK-ASSIGNMENTS.md`
   - `docs/project/week1-task-tracker.md`

---

## ✅ ARCHITECTURE APPROVAL

**Prepared by**: Solution Architect  
**Date**: 2026-03-09  
**Status**: ✅ Ready for Tech Lead Review

**Architecture Principles Followed**:

- ✅ Odoo/ERPNext patterns (module-based, multi-tenancy)
- ✅ Security-first approach (SecureRepository, tenant isolation)
- ✅ Test-driven development (360 security tests)
- ✅ Incremental delivery (day-by-day milestones)
- ✅ Clear rollback strategy (small commits, documented risks)

**Next Steps**:

1. Tech Lead review and approval
2. Team kickoff meeting (2026-03-10 9:00 AM)
3. Begin Week 1 Day 1 execution

---

**"Security by design, quality by default, delivery by discipline."**
