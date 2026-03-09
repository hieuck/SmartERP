# Week 1 Design Patterns - Security Architecture

**Date**: 2026-03-09  
**Prepared by**: Solution Architect  
**Status**: ✅ Ready for Implementation

---

## 📋 OVERVIEW

This document defines the design patterns and architectural decisions for Week 1 security fix sprint. All patterns follow Odoo/ERPNext best practices and SmartERP security standards.

---

## 🏗️ CORE DESIGN PATTERNS

### Pattern 1: SecurityModule Integration Pattern

**Intent**: Provide security services (PermissionService, SecureRepository) to all modules

**Problem**: Modules need access to security services for tenant isolation and permission checks

**Solution**: Import SecurityModule in every domain module

**Structure**:

```typescript
// Module Definition
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity]),
    SecurityModule, // ✅ Provides PermissionService
  ],
  controllers: [EntityController],
  providers: [EntityService],
  exports: [EntityService],
})
export class EntityModule {}
```

**Participants**:

- **SecurityModule**: Exports PermissionService
- **PermissionService**: Provides canRead/canWrite/canDelete methods
- **Domain Module**: Imports SecurityModule to access security services

**Consequences**:

- ✅ **Pros**: Centralized security, consistent patterns, easy to maintain
- ⚠️ **Cons**: Additional dependency, slight performance overhead

**Implementation Notes**:

- Always import SecurityModule in domain modules
- Never import domain modules in SecurityModule (prevents circular dependencies)
- Use forwardRef() only if circular dependency detected

---

### Pattern 2: SecureRepository Pattern

**Intent**: Wrap TypeORM Repository with automatic tenant isolation and permission checks

**Problem**: Raw TypeORM queries don't enforce tenant isolation or permission checks

**Solution**: Use SecureRepository wrapper that automatically adds tenantId filter and checks permissions

**Structure**:

```typescript
@Injectable()
export class EntityService {
  private secureEntityRepo: SecureRepository<Entity>;

  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository
    this.secureEntityRepo = new SecureRepository(
      entityRepository,
      permissionService,
      'Entity', // Resource name for permission checks
    );
  }

  // All methods use SecureRepository
  async findAll(user: User) {
    return await this.secureEntityRepo.find(user, {
      order: { name: 'ASC' },
    });
  }

  async findOne(user: User, id: string) {
    return await this.secureEntityRepo.findOne(user, {
      where: { id },
    });
  }

  async create(user: User, dto: CreateEntityDto) {
    return await this.secureEntityRepo.save(user, {
      ...dto,
      createdBy: user.id,
    });
  }

  async update(user: User, id: string, dto: UpdateEntityDto) {
    const entity = await this.findOne(user, id);
    Object.assign(entity, dto);
    entity.updatedBy = user.id;
    return await this.secureEntityRepo.save(user, entity);
  }

  async remove(user: User, id: string) {
    const entity = await this.findOne(user, id);
    return await this.secureEntityRepo.remove(user, entity);
  }
}
```

**Participants**:

- **SecureRepository**: Wrapper around TypeORM Repository
- **PermissionService**: Checks permissions before operations
- **User**: Context object containing tenantId and roles
- **Entity**: Domain entity being accessed

**Collaborations**:

```
Service → SecureRepository.find(user, options)
  → PermissionService.buildSecureQuery(user, options.where)
    → Adds { tenantId: user.tenantId }
  → Repository.find(secureOptions)
  → PermissionService.canRead(user, entity)
    → Checks user permissions
  → Return filtered entities
```

**Consequences**:

- ✅ **Pros**: Automatic tenant isolation, centralized permission logic, prevents data leakage
- ✅ **Pros**: Consistent API across all services
- ⚠️ **Cons**: Cannot use QueryBuilder (must use find/findOne methods)
- ⚠️ **Cons**: Slight performance overhead for permission checks

**Implementation Notes**:

- Always pass User object as first parameter
- Never use raw repository methods (find, save, remove)
- Use SecureRepository methods instead
- Handle ForbiddenException from permission checks

---

### Pattern 3: User Context Pattern

**Intent**: Pass authenticated user context through all service methods

**Problem**: Services need user context for tenant isolation and permission checks

**Solution**: Accept User parameter as first argument in all service methods

**Structure**:

```typescript
// Service Method Signature
async methodName(user: User, ...otherParams): Promise<ReturnType> {
  // Use user.tenantId for tenant isolation
  // Use user.id for audit trail
  // Use user.roles for permission checks
}

// Controller passes user from request
@Get()
async findAll(@CurrentUser() user: User) {
  return await this.service.findAll(user);
}

@Post()
async create(@CurrentUser() user: User, @Body() dto: CreateDto) {
  return await this.service.create(user, dto);
}
```

**Participants**:

- **User**: Context object with tenantId, id, roles
- **@CurrentUser()**: Decorator that extracts user from JWT token
- **Service**: Business logic that uses user context
- **Controller**: API endpoint that passes user to service

**Consequences**:

- ✅ **Pros**: Explicit user context, easy to test, clear security boundary
- ✅ **Pros**: Audit trail (createdBy, updatedBy) automatically set
- ⚠️ **Cons**: User parameter in every method (verbose)

**Implementation Notes**:

- Always use @CurrentUser() decorator in controllers
- Never extract tenantId from request body (security risk)
- User object should be immutable
- Validate user object before use

---

### Pattern 4: Tenant-Isolated Cache Pattern

**Intent**: Prevent cache poisoning across tenants

**Problem**: Shared cache keys can leak data between tenants

**Solution**: Include tenantId in all cache keys

**Structure**:

```typescript
async findOne(user: User, id: string): Promise<Entity> {
  // ✅ Cache key includes tenantId
  const cacheKey = `entity:${user.tenantId}:${id}`;

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      return await this.secureEntityRepo.findOne(user, {
        where: { id },
      });
    },
    CacheTTL.LONG,
  );
}

async update(user: User, id: string, dto: UpdateDto): Promise<Entity> {
  const entity = await this.findOne(user, id);

  // ... update logic ...

  const updated = await this.secureEntityRepo.save(user, entity);

  // ✅ Invalidate cache after mutation
  await this.cacheService.del(`entity:${user.tenantId}:${id}`);

  return updated;
}
```

**Cache Key Format**:

```
{resource}:{tenantId}:{id}
{resource}:{tenantId}:list:{page}:{limit}
{resource}:{tenantId}:count
```

**Consequences**:

- ✅ **Pros**: Prevents cross-tenant cache poisoning
- ✅ **Pros**: Each tenant has isolated cache namespace
- ✅ **Pros**: Cache invalidation scoped to tenant
- ⚠️ **Cons**: More cache keys (higher memory usage)

**Implementation Notes**:

- Always include tenantId in cache keys
- Invalidate cache after create/update/delete
- Use consistent cache key format
- Consider cache TTL based on data volatility

---

### Pattern 5: Permission Check Pattern

**Intent**: Enforce role-based access control before operations

**Problem**: Not all users should have access to all operations

**Solution**: Check permissions before read/write/delete operations

**Structure**:

```typescript
// SecureRepository automatically checks permissions
async findOne(user: User, id: string): Promise<Entity> {
  const entity = await this.secureEntityRepo.findOne(user, {
    where: { id },
  });
  // ✅ canRead() checked automatically
  // Throws ForbiddenException if denied
  return entity;
}

async update(user: User, id: string, dto: UpdateDto): Promise<Entity> {
  const entity = await this.findOne(user, id);
  // ✅ canWrite() checked automatically
  Object.assign(entity, dto);
  return await this.secureEntityRepo.save(user, entity);
}

async remove(user: User, id: string): Promise<void> {
  const entity = await this.findOne(user, id);
  // ✅ canDelete() checked automatically
  await this.secureEntityRepo.remove(user, entity);
}
```

**Permission Check Flow**:

```
1. User requests operation
2. SecureRepository checks permission
   - canRead() for find operations
   - canWrite() for save operations
   - canDelete() for remove operations
3. If denied → throw ForbiddenException
4. If allowed → proceed with operation
```

**Consequences**:

- ✅ **Pros**: Centralized permission logic, consistent enforcement
- ✅ **Pros**: Easy to audit (all checks in one place)
- ⚠️ **Cons**: Performance overhead for permission checks
- ⚠️ **Cons**: Must handle ForbiddenException in controllers

**Implementation Notes**:

- SecureRepository handles permission checks automatically
- Controllers should catch ForbiddenException and return 403
- Permission rules defined in PermissionService
- Use role-based or attribute-based access control

---

## 🧪 TESTING PATTERNS

### Pattern 6: Security Test Pattern

**Intent**: Verify tenant isolation and permission enforcement

**Problem**: Need comprehensive security testing for all services

**Solution**: Use standardized test templates for tenant isolation and permission denial

**Structure**:

```typescript
describe('EntityService - Security Tests', () => {
  // ==========================================
  // TENANT ISOLATION TESTS (6 tests)
  // ==========================================
  describe('Tenant Isolation', () => {
    it('should apply tenantId filter when querying all entities', async () => {
      // Verify buildSecureQuery called
      // Verify tenantId in where clause
    });

    it('should NOT return data from other tenants', async () => {
      // Setup: Repository returns only user's tenant data
      // Verify: No cross-tenant data returned
    });

    it('should automatically set tenantId from user context on create', async () => {
      // Verify: tenantId set from user, not DTO
    });

    it('should IGNORE tenantId in DTO and use user tenantId', async () => {
      // Security test: Prevent tenant injection
    });

    it('should only count entities from user tenant', async () => {
      // Verify: Count scoped to tenant
    });

    it('should include tenantId in cache keys', async () => {
      // Verify: Cache keys contain tenantId
    });
  });

  // ==========================================
  // PERMISSION DENIAL TESTS (6 tests)
  // ==========================================
  describe('Permission Denial', () => {
    it('should deny access when user lacks read permission', async () => {
      mockPermissionService.canRead.mockReturnValue(false);
      await expect(service.findOne(user, id)).rejects.toThrow(ForbiddenException);
    });

    it('should deny update when user lacks write permission', async () => {
      mockPermissionService.canWrite.mockReturnValue(false);
      await expect(service.update(user, id, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should deny create when user lacks write permission', async () => {
      mockPermissionService.canWrite.mockReturnValue(false);
      await expect(service.create(user, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should deny delete when user lacks delete permission', async () => {
      mockPermissionService.canDelete.mockReturnValue(false);
      await expect(service.remove(user, id)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access for user role when admin role required', async () => {
      const regularUser = createMockUser({ roles: ['user'] });
      mockPermissionService.canRead.mockReturnValue(false);
      await expect(service.findOne(regularUser, id)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access for admin role', async () => {
      const adminUser = createMockUser({ roles: ['admin'] });
      mockPermissionService.canRead.mockReturnValue(true);
      const result = await service.findOne(adminUser, id);
      expect(result).toBeDefined();
    });
  });
});
```

**Test Coverage**:

- 6 tenant isolation tests per service
- 6 permission denial tests per service
- Total: 12 tests per service
- Target: 30 services × 12 tests = 360 security tests

**Consequences**:

- ✅ **Pros**: Comprehensive security coverage, standardized tests
- ✅ **Pros**: Easy to maintain (template-based)
- ⚠️ **Cons**: Many tests to write (360 total)

**Implementation Notes**:

- Use test templates from docs/testing/
- Mock SecureRepository methods (find, findOne, save, remove)
- Mock PermissionService methods (canRead, canWrite, canDelete)
- Never mock QueryBuilder (bypasses security layer)

---

### Pattern 7: Mock Architecture Pattern

**Intent**: Test security layer without bypassing it

**Problem**: Incorrect mocking can bypass security checks

**Solution**: Mock SecureRepository methods, not raw TypeORM

**Structure**:

```typescript
// ✅ CORRECT: Mock SecureRepository methods
const mockEntityRepository = {
  find: jest.fn(), // ✅ Mock these
  findOne: jest.fn(), // ✅ Mock these
  save: jest.fn(), // ✅ Mock these
  remove: jest.fn(), // ✅ Mock these
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

// ❌ INCORRECT: Don't mock QueryBuilder
const mockEntityRepository = {
  createQueryBuilder: jest.fn(), // ❌ Bypasses security
  update: jest.fn(), // ❌ Bypasses security
  delete: jest.fn(), // ❌ Bypasses security
};
```

**Why This Matters**:

- SecureRepository wraps TypeORM methods
- Tests should verify SecureRepository behavior
- Mocking QueryBuilder bypasses security layer
- Tests would pass even if security is broken

**Consequences**:

- ✅ **Pros**: Tests verify actual security behavior
- ✅ **Pros**: Catches security bugs
- ⚠️ **Cons**: More verbose mocking

**Implementation Notes**:

- Always mock find/findOne/save/remove
- Never mock createQueryBuilder/update/delete
- Mock PermissionService to control permission checks
- Use createMockUser() helper for test users

---

## 🔄 REFACTORING PATTERNS

### Pattern 8: Service Refactoring Pattern

**Intent**: Convert raw TypeORM services to SecureRepository

**Problem**: Existing services use raw TypeORM without security

**Solution**: Systematic refactoring following 5-step process

**Structure**:

```typescript
// STEP 1: Add PermissionService injection
constructor(
  @InjectRepository(Entity)
  private readonly entityRepository: Repository<Entity>,
  private readonly permissionService: PermissionService, // ✅ ADD THIS
) {
  // STEP 2: Initialize SecureRepository
  this.secureEntityRepo = new SecureRepository(
    entityRepository,
    permissionService,
    'Entity',
  );
}

// STEP 3: Update method signatures (tenantId → user)
// BEFORE
async findAll(tenantId: string) { ... }

// AFTER
async findAll(user: User) { ... }

// STEP 4: Replace repository calls with SecureRepository
// BEFORE
return await this.entityRepository.find({
  where: { tenantId },
});

// AFTER
return await this.secureEntityRepo.find(user, {});

// STEP 5: Update tests
// - Mock PermissionService
// - Update method calls to pass user instead of tenantId
// - Add security tests
```

**Refactoring Checklist**:

- [ ] Add PermissionService to constructor
- [ ] Initialize SecureRepository
- [ ] Update all method signatures (tenantId → user)
- [ ] Replace all repository calls with SecureRepository
- [ ] Update all tests
- [ ] Add security tests (12 tests)
- [ ] Verify all tests pass
- [ ] Code review

**Consequences**:

- ✅ **Pros**: Systematic approach, reduces errors
- ✅ **Pros**: Consistent refactoring across services
- ⚠️ **Cons**: Time-consuming (3-6 hours per service)

**Implementation Notes**:

- Follow service-refactoring-guide.md
- Test after each step
- Commit after each service
- Use product-category.service.ts as reference

---

## 📊 ARCHITECTURAL DECISIONS

### ADR-001: Use SecurityModule for All Domain Modules

**Status**: ✅ Accepted

**Context**:

- 10 modules missing SecurityModule
- Risk of multi-tenant data leakage
- Need consistent security patterns

**Decision**:
Import SecurityModule in all domain modules to provide PermissionService

**Consequences**:

- ✅ Centralized security
- ✅ Consistent patterns
- ✅ Easy to maintain
- ⚠️ Additional dependency

**Alternatives Considered**:

- ❌ Manual permission checks in each service (inconsistent, error-prone)
- ❌ Global security middleware (cannot access entity-level permissions)

---

### ADR-002: Use SecureRepository Pattern

**Status**: ✅ Accepted

**Context**:

- Raw TypeORM doesn't enforce tenant isolation
- Manual tenantId filtering is error-prone
- Need automatic permission checks

**Decision**:
Wrap TypeORM Repository with SecureRepository that automatically adds tenantId filter and checks permissions

**Consequences**:

- ✅ Automatic tenant isolation
- ✅ Centralized permission logic
- ✅ Prevents data leakage
- ⚠️ Cannot use QueryBuilder
- ⚠️ Slight performance overhead

**Alternatives Considered**:

- ❌ Manual tenantId filtering (error-prone, inconsistent)
- ❌ Database-level RLS only (no application-level permissions)
- ❌ Middleware-based filtering (cannot access entity context)

---

### ADR-003: User Context as First Parameter

**Status**: ✅ Accepted

**Context**:

- Services need user context for security
- Need consistent API across services
- Need explicit security boundary

**Decision**:
All service methods accept User as first parameter

**Consequences**:

- ✅ Explicit user context
- ✅ Easy to test
- ✅ Clear security boundary
- ⚠️ Verbose (user parameter in every method)

**Alternatives Considered**:

- ❌ Thread-local storage (not supported in Node.js)
- ❌ Async context (experimental, complex)
- ❌ Global user object (not thread-safe)

---

### ADR-004: Tenant-Isolated Cache Keys

**Status**: ✅ Accepted

**Context**:

- Shared cache can leak data between tenants
- Need to prevent cache poisoning
- Need efficient cache invalidation

**Decision**:
Include tenantId in all cache keys

**Consequences**:

- ✅ Prevents cache poisoning
- ✅ Isolated cache namespace per tenant
- ✅ Scoped cache invalidation
- ⚠️ More cache keys (higher memory)

**Alternatives Considered**:

- ❌ Shared cache keys (security risk)
- ❌ No caching (performance impact)
- ❌ Separate Redis instance per tenant (cost prohibitive)

---

### ADR-005: 12 Security Tests Per Service

**Status**: ✅ Accepted

**Context**:

- Need comprehensive security coverage
- Need standardized testing approach
- Need to verify tenant isolation and permissions

**Decision**:
Implement 12 security tests per service (6 tenant isolation + 6 permission denial)

**Consequences**:

- ✅ Comprehensive coverage
- ✅ Standardized tests
- ✅ Easy to maintain
- ⚠️ Many tests to write (360 total)

**Alternatives Considered**:

- ❌ Fewer tests (insufficient coverage)
- ❌ Manual testing only (not repeatable)
- ❌ E2E tests only (too slow, not granular)

---

## 🎯 PATTERN SELECTION GUIDE

### When to Use Each Pattern

**SecurityModule Integration Pattern**:

- ✅ Use for: All domain modules
- ❌ Don't use for: Core modules (SecurityModule itself)

**SecureRepository Pattern**:

- ✅ Use for: All database access
- ❌ Don't use for: Complex queries requiring QueryBuilder (use raw SQL with manual security)

**User Context Pattern**:

- ✅ Use for: All service methods
- ❌ Don't use for: Internal helper methods (pass user from public methods)

**Tenant-Isolated Cache Pattern**:

- ✅ Use for: All cached data
- ❌ Don't use for: Global configuration (not tenant-specific)

**Permission Check Pattern**:

- ✅ Use for: All CRUD operations
- ❌ Don't use for: Public endpoints (no authentication required)

**Security Test Pattern**:

- ✅ Use for: All services with database access
- ❌ Don't use for: Pure utility functions (no security concerns)

---

## 📚 REFERENCES

**Pattern Sources**:

- Odoo Architecture: Module-based, multi-tenancy
- ERPNext Architecture: Permission system, tenant isolation
- NestJS Best Practices: Dependency injection, testing
- SmartERP Conventions: SecureRepository, User context

**Related Documents**:

- `docs/architecture/WEEK1-ARCHITECTURE-SPECIFICATIONS.md`
- `docs/guides/module-security-fix-guide.md`
- `docs/guides/service-refactoring-guide.md`
- `docs/testing/security-test-templates.md`

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-03-09  
**Next Review**: After Week 1 completion  
**Owner**: Solution Architect

---

**"Patterns enable consistency, consistency enables quality, quality enables trust."**
