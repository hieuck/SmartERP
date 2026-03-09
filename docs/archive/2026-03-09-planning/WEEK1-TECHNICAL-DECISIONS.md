# Week 1 Technical Decisions - Architecture Decision Records

**Date**: 2026-03-09  
**Prepared by**: Solution Architect  
**Status**: ✅ Approved for Implementation

---

## 📋 OVERVIEW

This document records all technical decisions made for Week 1 security fix sprint. Each decision follows the Architecture Decision Record (ADR) format.

---

## ADR-001: SecurityModule Integration Strategy

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect

### Context

10 critical modules are missing SecurityModule import, creating multi-tenant data leakage risk:

- Core: notification, email, document
- eCommerce: product-catalog, shopping-cart, checkout, order, payment
- HR: attendance, leave
- Manufacturing: bom, work-order
- Integration: payment-gateway, webhook

Without SecurityModule, these modules cannot:

- Access PermissionService for permission checks
- Use SecureRepository for tenant isolation
- Enforce role-based access control

### Decision

**Add SecurityModule to all 10 modules immediately (Week 1 Day 1)**

Implementation:

```typescript
// Add to every module
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entity]),
    SecurityModule, // ✅ Add this
  ],
})
```

### Consequences

**Positive**:

- ✅ Eliminates multi-tenant data leakage risk
- ✅ Enables SecureRepository usage in services
- ✅ Provides PermissionService via dependency injection
- ✅ Foundation for Week 2+ refactoring work
- ✅ Quick fix (2 lines per module, 5 days total)

**Negative**:

- ⚠️ Additional module dependency
- ⚠️ Potential circular dependency risk (mitigated with forwardRef)
- ⚠️ Slight performance overhead (negligible)

**Risks**:

- Circular dependencies (mitigation: use forwardRef if needed)
- Breaking changes (mitigation: test after each module)
- Performance regression (mitigation: measure baseline, monitor)

### Alternatives Considered

**Alternative 1: Manual permission checks in each service**

- ❌ Rejected: Inconsistent, error-prone, hard to maintain
- ❌ Rejected: No centralized security logic
- ❌ Rejected: Developers might forget to add checks

**Alternative 2: Global security middleware**

- ❌ Rejected: Cannot access entity-level context
- ❌ Rejected: Cannot enforce fine-grained permissions
- ❌ Rejected: Middleware runs before service layer

**Alternative 3: Database-level RLS only**

- ❌ Rejected: No application-level permission checks
- ❌ Rejected: Cannot enforce role-based access
- ❌ Rejected: Harder to test and debug

### Implementation Plan

**Day 1** (2026-03-10):

- Junior Dev #2: Fix 5 modules (4 hours)
- Junior Dev #3: Fix 5 modules (4 hours)
- Verify compilation after each module
- Run tests after each module
- Commit after each module

**Success Criteria**:

- ✅ 10/10 modules have SecurityModule
- ✅ 0 compilation errors
- ✅ All existing tests pass
- ✅ No circular dependency warnings

---

## ADR-002: SecureRepository as Standard Pattern

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect

### Context

Current state:

- 14/30 services use SecureRepository (47%)
- 16/30 services use raw TypeORM (53%)
- Inconsistent security patterns across codebase
- Risk of developers using raw TypeORM for new features

Raw TypeORM problems:

- No automatic tenant isolation
- No automatic permission checks
- Manual tenantId filtering (error-prone)
- Inconsistent security enforcement

### Decision

**Mandate SecureRepository for all database access**

All services MUST:

1. Initialize SecureRepository in constructor
2. Use SecureRepository methods (find, findOne, save, remove)
3. Pass User object as first parameter
4. Never use raw TypeORM methods directly

Implementation:

```typescript
@Injectable()
export class EntityService {
  private secureEntityRepo: SecureRepository<Entity>;

  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureEntityRepo = new SecureRepository(entityRepository, permissionService, 'Entity');
  }

  // All methods use SecureRepository
  async findAll(user: User) {
    return await this.secureEntityRepo.find(user, {});
  }
}
```

### Consequences

**Positive**:

- ✅ Automatic tenant isolation (tenantId filter added automatically)
- ✅ Automatic permission checks (canRead/canWrite/canDelete)
- ✅ Consistent security patterns across all services
- ✅ Centralized security logic (easier to maintain)
- ✅ Prevents data leakage bugs
- ✅ Audit trail automatically enforced

**Negative**:

- ⚠️ Cannot use TypeORM QueryBuilder (limitation)
- ⚠️ Slight performance overhead (~5-10ms per query)
- ⚠️ More verbose service code
- ⚠️ Learning curve for developers

**Risks**:

- Complex queries may need raw SQL (mitigation: provide secure raw query helper)
- Performance impact on high-traffic endpoints (mitigation: caching, optimization)
- Developers might bypass SecureRepository (mitigation: code review, linting)

### Alternatives Considered

**Alternative 1: Manual tenantId filtering**

```typescript
// ❌ Rejected
async findAll(tenantId: string) {
  return await this.repository.find({
    where: { tenantId }, // Easy to forget
  });
}
```

- ❌ Rejected: Error-prone, inconsistent, no permission checks

**Alternative 2: TypeORM Subscribers**

```typescript
// ❌ Rejected
@EventSubscriber()
export class TenantSubscriber {
  beforeInsert(event: InsertEvent<any>) {
    event.entity.tenantId = getCurrentTenantId();
  }
}
```

- ❌ Rejected: Cannot access user context in subscriber
- ❌ Rejected: No permission checks
- ❌ Rejected: Hard to test

**Alternative 3: Database Views**

```sql
-- ❌ Rejected
CREATE VIEW tenant_products AS
SELECT * FROM products
WHERE tenant_id = current_setting('app.tenant_id');
```

- ❌ Rejected: Complex to maintain
- ❌ Rejected: No application-level permissions
- ❌ Rejected: Harder to debug

### Implementation Plan

**Week 2** (Days 6-10):

- Refactor 16 remaining services to use SecureRepository
- Update all method signatures (tenantId → user)
- Update all tests
- Code review by Tech Lead

**Success Criteria**:

- ✅ 30/30 services use SecureRepository (100%)
- ✅ 0 raw TypeORM usage in services
- ✅ All tests passing
- ✅ Code review approved

---

## ADR-003: User Context as First Parameter

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect

### Context

Services need user context for:

- Tenant isolation (user.tenantId)
- Permission checks (user.roles)
- Audit trail (user.id for createdBy/updatedBy)

Current inconsistency:

- Some services accept `tenantId: string`
- Some services accept `user: User`
- Some services accept both

### Decision

**All service methods MUST accept User as first parameter**

Standard signature:

```typescript
async methodName(user: User, ...otherParams): Promise<ReturnType> {
  // Use user.tenantId for tenant isolation
  // Use user.id for audit trail
  // Use user.roles for permission checks
}
```

Controller integration:

```typescript
@Get()
async findAll(@CurrentUser() user: User) {
  return await this.service.findAll(user);
}

@Post()
async create(@CurrentUser() user: User, @Body() dto: CreateDto) {
  return await this.service.create(user, dto);
}
```

### Consequences

**Positive**:

- ✅ Explicit user context (clear security boundary)
- ✅ Easy to test (pass mock user)
- ✅ Consistent API across all services
- ✅ Audit trail automatically set
- ✅ Type-safe (TypeScript enforces User type)

**Negative**:

- ⚠️ Verbose (user parameter in every method)
- ⚠️ Breaking change (existing code needs update)
- ⚠️ More parameters to pass

**Risks**:

- Developers might forget to pass user (mitigation: TypeScript enforces)
- User object might be null (mitigation: @CurrentUser() throws if not authenticated)

### Alternatives Considered

**Alternative 1: Thread-local storage**

```typescript
// ❌ Rejected
AsyncLocalStorage.run(user, () => {
  service.findAll(); // User accessed from storage
});
```

- ❌ Rejected: Not well-supported in Node.js
- ❌ Rejected: Hard to test
- ❌ Rejected: Implicit context (harder to reason about)

**Alternative 2: Global user object**

```typescript
// ❌ Rejected
global.currentUser = user;
service.findAll(); // Access global.currentUser
```

- ❌ Rejected: Not thread-safe
- ❌ Rejected: Race conditions in async code
- ❌ Rejected: Hard to test

**Alternative 3: Separate tenantId and userId parameters**

```typescript
// ❌ Rejected
async findAll(tenantId: string, userId: string, roles: string[]) {
  // Too many parameters
}
```

- ❌ Rejected: Too verbose
- ❌ Rejected: Easy to pass wrong values
- ❌ Rejected: No type safety

### Implementation Plan

**Week 2-3** (Days 6-15):

- Update all service method signatures
- Update all controller calls
- Update all tests
- Verify compilation

**Success Criteria**:

- ✅ All service methods accept User as first parameter
- ✅ No methods accept tenantId directly
- ✅ All tests updated
- ✅ 0 TypeScript errors

---

## ADR-004: Tenant-Isolated Cache Keys

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect

### Context

Cache poisoning risk:

- Shared cache keys can leak data between tenants
- Example: `product:123` could return Tenant A's product to Tenant B
- Need to prevent cross-tenant cache access

Current state:

- Some services include tenantId in cache keys
- Some services don't (security risk)
- Inconsistent cache key formats

### Decision

**All cache keys MUST include tenantId**

Standard format:

```typescript
// Single entity
const cacheKey = `{resource}:{tenantId}:{id}`;
// Example: `product:tenant-1:123`

// List
const cacheKey = `{resource}:{tenantId}:list:{page}:{limit}`;
// Example: `product:tenant-1:list:1:20`

// Count
const cacheKey = `{resource}:{tenantId}:count`;
// Example: `product:tenant-1:count`
```

Implementation:

```typescript
async findOne(user: User, id: string): Promise<Entity> {
  const cacheKey = `entity:${user.tenantId}:${id}`;

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      return await this.secureEntityRepo.findOne(user, { where: { id } });
    },
    CacheTTL.LONG,
  );
}

async update(user: User, id: string, dto: UpdateDto) {
  // ... update logic ...

  // Invalidate cache
  await this.cacheService.del(`entity:${user.tenantId}:${id}`);
}
```

### Consequences

**Positive**:

- ✅ Prevents cache poisoning across tenants
- ✅ Each tenant has isolated cache namespace
- ✅ Cache invalidation scoped to tenant
- ✅ Easy to debug (cache keys are descriptive)
- ✅ Consistent cache key format

**Negative**:

- ⚠️ More cache keys (higher memory usage)
- ⚠️ Cannot share cache across tenants (even for public data)
- ⚠️ More verbose cache key construction

**Risks**:

- Memory usage increase (mitigation: set appropriate TTL, monitor Redis memory)
- Cache key collisions (mitigation: use consistent format, include resource name)

### Alternatives Considered

**Alternative 1: Shared cache keys**

```typescript
// ❌ Rejected
const cacheKey = `product:${id}`; // No tenantId
```

- ❌ Rejected: Security risk (cache poisoning)
- ❌ Rejected: Data leakage between tenants

**Alternative 2: Separate Redis instance per tenant**

```typescript
// ❌ Rejected
const redis = getRedisForTenant(user.tenantId);
await redis.set(`product:${id}`, data);
```

- ❌ Rejected: Cost prohibitive (many Redis instances)
- ❌ Rejected: Complex to manage
- ❌ Rejected: Connection pool overhead

**Alternative 3: Cache key prefix**

```typescript
// ❌ Rejected
const cacheKey = `${user.tenantId}:product:${id}`;
```

- ✅ Similar to chosen solution
- ⚠️ Less readable (tenantId at start)
- ⚠️ Harder to query by resource type

### Implementation Plan

**Week 1-2** (Days 1-10):

- Audit all cache key usage
- Update to include tenantId
- Verify cache isolation in tests
- Monitor Redis memory usage

**Success Criteria**:

- ✅ All cache keys include tenantId
- ✅ No shared cache keys
- ✅ Cache isolation tests passing
- ✅ Redis memory usage acceptable

---

## ADR-005: 12 Security Tests Per Service

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect, QA Engineer

### Context

Need comprehensive security testing:

- Verify tenant isolation (no cross-tenant access)
- Verify permission enforcement (role-based access)
- Prevent security regressions
- Standardize testing approach

Current state:

- Some services have security tests
- Some services don't
- Inconsistent test coverage
- No standard test template

### Decision

**Implement 12 security tests per service**

Test breakdown:

- 6 tenant isolation tests
- 6 permission denial tests

Test categories:

```typescript
describe('EntityService - Security Tests', () => {
  // Tenant Isolation (6 tests)
  describe('Tenant Isolation', () => {
    it('should apply tenantId filter when querying all entities');
    it('should NOT return data from other tenants');
    it('should automatically set tenantId from user context on create');
    it('should IGNORE tenantId in DTO and use user tenantId');
    it('should only count entities from user tenant');
    it('should include tenantId in cache keys');
  });

  // Permission Denial (6 tests)
  describe('Permission Denial', () => {
    it('should deny access when user lacks read permission');
    it('should deny update when user lacks write permission');
    it('should deny create when user lacks write permission');
    it('should deny delete when user lacks delete permission');
    it('should deny access for user role when admin role required');
    it('should allow access for admin role');
  });
});
```

Target: 30 services × 12 tests = 360 security tests

### Consequences

**Positive**:

- ✅ Comprehensive security coverage
- ✅ Standardized testing approach
- ✅ Easy to maintain (template-based)
- ✅ Catches security bugs early
- ✅ Prevents regressions
- ✅ Confidence in security

**Negative**:

- ⚠️ Many tests to write (360 total)
- ⚠️ Time-consuming (2 hours per service)
- ⚠️ Test suite execution time increases

**Risks**:

- Test maintenance burden (mitigation: use templates, keep tests simple)
- False positives (mitigation: careful mocking, verify behavior)
- Slow test execution (mitigation: parallel execution, optimize mocks)

### Alternatives Considered

**Alternative 1: Fewer tests (6 per service)**

- ❌ Rejected: Insufficient coverage
- ❌ Rejected: Might miss edge cases
- ❌ Rejected: Less confidence in security

**Alternative 2: Manual testing only**

- ❌ Rejected: Not repeatable
- ❌ Rejected: Time-consuming
- ❌ Rejected: Easy to miss cases

**Alternative 3: E2E tests only**

- ❌ Rejected: Too slow
- ❌ Rejected: Not granular enough
- ❌ Rejected: Harder to debug

**Alternative 4: Property-based testing**

- ✅ Good idea for future
- ⚠️ More complex to implement
- ⚠️ Longer to write
- 📝 Consider for Week 3+

### Implementation Plan

**Week 1** (Days 2-3):

- Senior Dev #1: 24 test files (16 hours)
- Junior Dev #2: 14 test files (14 hours)
- Junior Dev #3: 8 test files (10 hours)
- Total: 46 test files (40 hours)

**Success Criteria**:

- ✅ 360 security tests implemented
- ✅ All tests passing
- ✅ Test coverage > 80%
- ✅ QA review approved

---

## ADR-006: Mock SecureRepository Methods, Not QueryBuilder

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, Solution Architect, QA Engineer

### Context

Test mocking strategy is critical:

- Incorrect mocking can bypass security layer
- Tests might pass even if security is broken
- Need to verify SecureRepository behavior

Problem with QueryBuilder mocking:

```typescript
// ❌ BAD: Bypasses security layer
const mockRepo = {
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([...]),
  }),
};
```

This bypasses SecureRepository entirely!

### Decision

**Mock SecureRepository methods (find, findOne, save, remove), NOT QueryBuilder**

Correct mocking:

```typescript
// ✅ GOOD: Tests security layer
const mockEntityRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockPermissionService = {
  buildSecureQuery: jest.fn((user, where) => ({
    ...where,
    tenantId: user.tenantId,
  })),
  canRead: jest.fn().mockReturnValue(true),
  canWrite: jest.fn().mockReturnValue(true),
  canDelete: jest.fn().mockReturnValue(true),
};
```

### Consequences

**Positive**:

- ✅ Tests verify actual security behavior
- ✅ Catches security bugs
- ✅ Tests SecureRepository wrapper
- ✅ Verifies permission checks
- ✅ Verifies tenant isolation

**Negative**:

- ⚠️ More verbose mocking
- ⚠️ Need to understand SecureRepository internals
- ⚠️ Tests coupled to SecureRepository implementation

**Risks**:

- Developers might mock incorrectly (mitigation: provide templates, code review)
- Tests might be brittle (mitigation: focus on behavior, not implementation)

### Alternatives Considered

**Alternative 1: Mock QueryBuilder**

- ❌ Rejected: Bypasses security layer
- ❌ Rejected: Tests don't verify security
- ❌ Rejected: False confidence

**Alternative 2: Integration tests only**

- ❌ Rejected: Too slow
- ❌ Rejected: Harder to test edge cases
- ❌ Rejected: Need real database

**Alternative 3: No mocking (use real database)**

- ❌ Rejected: Slow test execution
- ❌ Rejected: Complex test setup
- ❌ Rejected: Harder to test error cases

### Implementation Plan

**Week 1** (Day 1):

- Senior Dev #1: Create test templates with correct mocking
- Document mocking patterns
- Share with team
- Code review all tests

**Success Criteria**:

- ✅ All tests mock SecureRepository methods
- ✅ No tests mock QueryBuilder
- ✅ All tests verify security behavior
- ✅ Test templates available

---

## ADR-007: Incremental Module Fixes (Not Batch)

**Date**: 2026-03-09  
**Status**: ✅ Accepted  
**Deciders**: Tech Lead, PM, Solution Architect

### Context

10 modules need SecurityModule fix:

- Could fix all at once (batch)
- Could fix one at a time (incremental)

Batch approach risks:

- Large changeset (hard to review)
- If something breaks, hard to identify cause
- All-or-nothing (cannot deploy partial fix)
- Rollback affects all modules

### Decision

**Fix modules incrementally (one at a time)**

Process:

1. Fix one module
2. Verify compilation
3. Run tests
4. Commit
5. Repeat for next module

Commit message format:

```
fix(module-name): add SecurityModule for tenant isolation

- Add SecurityModule import
- Enable PermissionService injection
- Prepare for SecureRepository refactoring

Refs: WEEK1-DAY1
```

### Consequences

**Positive**:

- ✅ Small, reviewable commits
- ✅ Easy to identify issues
- ✅ Can deploy partial fix if needed
- ✅ Easy to rollback single module
- ✅ Continuous integration (tests after each)
- ✅ Progress tracking (10 commits = 10 modules)

**Negative**:

- ⚠️ More commits (10 vs 1)
- ⚠️ More time (test after each)
- ⚠️ More context switching

**Risks**:

- Slower progress (mitigation: parallel work by 2 developers)
- Merge conflicts (mitigation: coordinate via Slack)

### Alternatives Considered

**Alternative 1: Batch fix (all 10 modules at once)**

- ❌ Rejected: Large changeset
- ❌ Rejected: Hard to review
- ❌ Rejected: Risky deployment

**Alternative 2: Fix by domain (all eCommerce, then all HR, etc.)**

- ✅ Reasonable compromise
- ⚠️ Still larger changesets
- ⚠️ Harder to rollback

### Implementation Plan

**Day 1** (2026-03-10):

- Junior Dev #2: Fix 5 modules (1 commit each)
- Junior Dev #3: Fix 5 modules (1 commit each)
- Total: 10 commits

**Success Criteria**:

- ✅ 10 commits (1 per module)
- ✅ Each commit passes tests
- ✅ Clear commit messages
- ✅ Easy to review

---

## 📊 DECISION SUMMARY

| ADR | Decision                   | Status      | Impact | Priority |
| --- | -------------------------- | ----------- | ------ | -------- |
| 001 | SecurityModule Integration | ✅ Accepted | HIGH   | P0       |
| 002 | SecureRepository Standard  | ✅ Accepted | HIGH   | P1       |
| 003 | User Context First Param   | ✅ Accepted | MEDIUM | P1       |
| 004 | Tenant-Isolated Cache      | ✅ Accepted | MEDIUM | P1       |
| 005 | 12 Security Tests/Service  | ✅ Accepted | HIGH   | P0       |
| 006 | Mock SecureRepository      | ✅ Accepted | MEDIUM | P0       |
| 007 | Incremental Module Fixes   | ✅ Accepted | LOW    | P0       |

---

## 🎯 IMPLEMENTATION PRIORITIES

**P0 (Critical - Week 1)**:

- ADR-001: SecurityModule Integration
- ADR-005: 12 Security Tests
- ADR-006: Correct Mocking
- ADR-007: Incremental Fixes

**P1 (High - Week 2)**:

- ADR-002: SecureRepository Standard
- ADR-003: User Context Pattern
- ADR-004: Tenant-Isolated Cache

---

## ✅ APPROVAL

**Prepared by**: Solution Architect  
**Reviewed by**: Tech Lead  
**Approved by**: Tech Lead  
**Date**: 2026-03-09  
**Status**: ✅ Ready for Implementation

**Next Steps**:

1. Share with team in kickoff meeting
2. Begin implementation (Day 1)
3. Review decisions after Week 1
4. Update ADRs based on learnings

---

**"Document decisions, learn from outcomes, improve continuously."**
