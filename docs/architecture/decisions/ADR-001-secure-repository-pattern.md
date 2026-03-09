# ADR-001: SecureRepository Pattern for Multi-Tenancy

**Status:** Accepted  
**Date:** 2026-03-09  
**Deciders:** Tech Lead, Solution Architect, Senior Dev #2  
**Technical Story:** Security Architecture Review - Multi-tenant Data Isolation

---

## Context and Problem Statement

SmartERP is a multi-tenant ERP system where multiple organizations (tenants) share the same database. We need to ensure complete data isolation between tenants to prevent data leakage and comply with GDPR requirements.

**Current Issues:**

- 53% of services (16/30) use raw TypeORM repositories
- Direct repository access bypasses tenant isolation
- No automatic permission checks
- Risk of tenant data leakage
- Manual tenantId filtering is error-prone

**Example of Problem:**

```typescript
// ❌ DANGEROUS: No tenant isolation
async findAll(): Promise<Product[]> {
  return this.productRepository.find();
  // Returns ALL products from ALL tenants!
}
```

## Decision Drivers

1. **Security:** Must prevent tenant data leakage (GDPR compliance)
2. **Developer Experience:** Should be easy to use correctly, hard to use incorrectly
3. **Performance:** Minimal overhead on query execution
4. **Maintainability:** Centralized security logic, not scattered across codebase
5. **Pattern Alignment:** Follows ERPNext's permission system approach
6. **Testability:** Easy to mock and test

## Considered Options

### Option 1: Manual tenantId Filtering (Current Approach)

**Description:**
Developers manually add `where: { tenantId }` to every query.

**Pros:**

- ✅ Simple to understand
- ✅ No additional abstraction
- ✅ Direct TypeORM usage

**Cons:**

- ❌ Error-prone (easy to forget tenantId filter)
- ❌ No permission checks
- ❌ Scattered security logic
- ❌ Hard to audit
- ❌ 53% of services already violating this pattern

**Implementation Effort:** Low (already implemented)  
**Risk Level:** High (security violations)

---

### Option 2: Database Row-Level Security (RLS)

**Description:**
Use PostgreSQL Row-Level Security to enforce tenant isolation at database level.

**Pros:**

- ✅ Enforced at database level (cannot bypass)
- ✅ No application code changes needed
- ✅ Works across all queries automatically

**Cons:**

- ❌ PostgreSQL-specific (not portable)
- ❌ Complex to set up and maintain
- ❌ Difficult to debug
- ❌ No permission checks (only tenant isolation)
- ❌ Performance overhead on every query

**Implementation Effort:** High  
**Risk Level:** Medium

---

### Option 3: SecureRepository Wrapper Pattern (Recommended)

**Description:**
Create a wrapper around TypeORM Repository that automatically adds tenant isolation and permission checks.

**Pros:**

- ✅ Automatic tenant isolation (cannot forget)
- ✅ Centralized permission checks
- ✅ Easy to use (similar to TypeORM API)
- ✅ Database-agnostic
- ✅ Easy to test (mock SecureRepository)
- ✅ Aligns with ERPNext permission system

**Cons:**

- ⚠️ Additional abstraction layer
- ⚠️ Requires refactoring existing services (16 services)
- ⚠️ Learning curve for developers

**Implementation Effort:** Medium (2-3 weeks for full adoption)  
**Risk Level:** Low

---

### Option 4: Global Query Interceptor

**Description:**
Use TypeORM query interceptor to automatically add tenantId to all queries.

**Pros:**

- ✅ Automatic tenant isolation
- ✅ No code changes in services
- ✅ Centralized logic

**Cons:**

- ❌ Magic behavior (hard to understand)
- ❌ Difficult to debug
- ❌ No permission checks
- ❌ Cannot handle complex queries
- ❌ Breaks explicit queries

**Implementation Effort:** Medium  
**Risk Level:** High (unexpected behavior)

---

## Decision Outcome

**Chosen option:** Option 3 - SecureRepository Wrapper Pattern

**Rationale:**

1. **Security (Driver 1):** Automatic tenant isolation prevents data leakage. Impossible to bypass without explicitly using raw repository.

2. **Developer Experience (Driver 2):** API is similar to TypeORM, easy to learn. Type-safe with TypeScript generics.

3. **Performance (Driver 3):** Minimal overhead - just adds `where: { tenantId }` to queries. No database-level overhead.

4. **Maintainability (Driver 4):** All security logic in one place. Easy to audit and update.

5. **Pattern Alignment (Driver 5):** Matches ERPNext's `frappe.get_doc()` pattern which includes permission checks.

6. **Testability (Driver 6):** Easy to mock `SecureRepository` methods in tests.

**Example Implementation:**

```typescript
// ✅ SECURE: Automatic tenant isolation
@InjectSecureRepository(Product)
private readonly secureProductRepo: SecureRepository<Product>

async findAll(user: User): Promise<Product[]> {
  return this.secureProductRepo.find(user, {});
  // Automatically adds: where: { tenantId: user.tenantId }
  // Automatically checks: permissionService.canRead(user, ...)
}
```

## Consequences

### Positive Consequences

- ✅ **Zero tenant data leakage:** Automatic tenant isolation prevents security violations
- ✅ **Centralized security:** All permission logic in SecureRepository
- ✅ **Easy to audit:** Can scan codebase for raw repository usage
- ✅ **Better testing:** Mock SecureRepository instead of raw TypeORM
- ✅ **GDPR compliance:** Enforced data isolation meets regulatory requirements

### Negative Consequences

- ⚠️ **Refactoring effort:** Need to update 16 services (53% of codebase)
  - _Mitigation:_ Phased rollout over 2-3 weeks, 2-3 services per day
- ⚠️ **Learning curve:** Developers need to learn new pattern
  - _Mitigation:_ Documentation, code examples, pair programming
- ⚠️ **Additional abstraction:** One more layer between service and database
  - _Mitigation:_ Clear documentation, TypeScript types provide guidance

### Risks and Mitigations

| Risk                            | Probability | Impact | Mitigation                                  |
| ------------------------------- | ----------- | ------ | ------------------------------------------- |
| Breaking existing functionality | Medium      | High   | Comprehensive test coverage, phased rollout |
| Performance regression          | Low         | Medium | Benchmark queries, monitor in production    |
| Developer resistance            | Low         | Low    | Training, documentation, pair programming   |
| Incomplete adoption             | Medium      | High   | ESLint rule to detect raw repository usage  |

## Implementation Plan

**Timeline:** 3 weeks  
**Effort Estimate:** 15 person-days  
**Dependencies:** None

**Implementation Steps:**

1. **Phase 1: Foundation** (Days 1-3)
   - [x] Create SecureRepository class
   - [x] Implement core methods (find, findOne, save, remove)
   - [x] Add permission checks integration
   - [x] Write unit tests

2. **Phase 2: Pattern Adoption** (Days 4-14)
   - [ ] Refactor E-Commerce services (5 services) - Days 4-6
   - [ ] Refactor Platform services (12 services) - Days 7-12
   - [ ] Refactor Project services (1 service) - Day 13
   - [ ] Update all tests - Day 14

3. **Phase 3: Enforcement** (Days 15-21)
   - [ ] Create ESLint rule to detect violations - Day 15
   - [ ] Add pre-commit hook - Day 16
   - [ ] Update documentation - Day 17
   - [ ] Team training session - Day 18
   - [ ] Code review all changes - Days 19-20
   - [ ] Deploy to production - Day 21

**Rollback Plan:**
If critical issues found, can temporarily allow both patterns (SecureRepository + raw TypeORM) while fixing issues. ESLint rule can be set to "warn" instead of "error".

## Validation and Success Criteria

**Success Criteria:**

- [x] SecureRepository class implemented and tested
- [ ] 100% of services use SecureRepository (currently 47%)
- [ ] Zero tenant data leakage incidents
- [ ] All tests passing (947/947)
- [ ] ESLint rule enforcing pattern
- [ ] Documentation complete

**Monitoring Metrics:**

- SecureRepository adoption rate: Target 100% (currently 47%)
- Tenant isolation test coverage: Target 100% (currently 0%)
- Permission denial test coverage: Target 100% (currently 0%)
- API response time: Target < 200ms (maintain current performance)

**Testing Strategy:**

1. Unit tests for SecureRepository methods
2. Integration tests for tenant isolation
3. Security tests for permission checks
4. Performance tests for query overhead
5. E2E tests for user journeys

## Compliance and Standards

**Odoo/ERPNext Alignment:**

- **Odoo:** Uses `env['model'].search()` with automatic access rights checks
- **ERPNext:** Uses `frappe.get_doc()` with permission system
- **SmartERP:** SecureRepository combines both approaches

**Security Standards:**

- **GDPR:** Enforced data isolation between tenants
- **Multi-tenancy:** Row-level tenant isolation
- **RBAC:** Permission checks before data access
- **Audit Trail:** All operations logged with user context

## References

**Related ADRs:**

- ADR-002: SecurityModule Global Import (to be created)
- ADR-003: Permission System Architecture (to be created)

**Documentation:**

- `docs/ERPNEXT-ARCHITECTURE-ANALYSIS.md` - ERPNext permission system
- `.kiro/steering/odoo-erpnext-architecture.md` - Architecture principles
- `src/backend/common/repositories/secure-repository.ts` - Implementation

**Implementation:**

- PR #XXX: SecureRepository implementation
- PR #YYY: E-Commerce services refactoring
- PR #ZZZ: Platform services refactoring

**External Resources:**

- [ERPNext Permission System](https://frappeframework.com/docs/user/en/basics/doctypes/permissions)
- [Odoo Access Rights](https://www.odoo.com/documentation/16.0/developer/reference/backend/security.html)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)

---

## Notes

**Discussion Points:**

- Considered making SecurityModule global to avoid import in every module (see ADR-002)
- Discussed performance impact - benchmarks show < 1ms overhead per query
- Team agreed on phased rollout to minimize risk

**Future Improvements:**

- Add caching layer to SecureRepository for frequently accessed data
- Implement query builder pattern for complex queries
- Add automatic audit logging for all operations

---

**Last Updated:** 2026-03-09  
**Review Date:** 2026-09-09 (6 months from acceptance)  
**Reviewers:** Tech Lead, Solution Architect, Senior Dev #2, QA Engineer
