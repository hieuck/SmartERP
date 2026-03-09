# Security Test Review Checklist

**Version:** 1.0.0  
**Last Updated:** 2026-03-09  
**Purpose:** Quality criteria for reviewing security tests

---

## 🎯 Overview

This checklist ensures security tests meet quality standards before merging to main branch.

**Use this checklist when:**

- Reviewing pull requests with security tests
- Self-reviewing your own security tests
- Conducting code reviews
- QA Engineer final approval

---

## ✅ Checklist Categories

### 1. Test Coverage Completeness

### 2. Test Quality Standards

### 3. Mock Configuration

### 4. Assertion Specificity

### 5. Security Best Practices

### 6. Code Quality

---

## 1️⃣ Test Coverage Completeness

### Tenant Isolation Tests

- [ ] **Tenant filter applied to queries**
  - [ ] findAll includes tenantId filter
  - [ ] findOne includes tenantId filter
  - [ ] Custom queries include tenantId filter
  - [ ] buildSecureQuery called with user context

- [ ] **Cross-tenant access prevention**
  - [ ] Cannot read other tenant data
  - [ ] Cannot update other tenant data
  - [ ] Cannot delete other tenant data
  - [ ] Returns empty/null for other tenant queries

- [ ] **TenantId auto-set on create**
  - [ ] TenantId set from user context
  - [ ] CreatedBy set from user context
  - [ ] Cannot inject different tenantId via DTO
  - [ ] Malicious tenantId injection blocked

- [ ] **Bulk operations respect tenant isolation**
  - [ ] Count scoped to tenant
  - [ ] FindByStatus scoped to tenant
  - [ ] Custom bulk operations scoped to tenant

- [ ] **Cache key tenant isolation**
  - [ ] Cache keys include tenantId
  - [ ] Different tenants use different cache keys
  - [ ] Cache invalidation scoped to tenant

- [ ] **Relationship tenant isolation**
  - [ ] Related entities from same tenant only
  - [ ] Joins include tenant filter
  - [ ] Eager loading respects tenant isolation

### Permission Denial Tests

- [ ] **Read permission denial**
  - [ ] canRead denial throws ForbiddenException
  - [ ] Permission checked before returning data
  - [ ] Clear error message on denial
  - [ ] Database query still executes (current behavior)

- [ ] **Write permission denial (create)**
  - [ ] canWrite denial throws ForbiddenException
  - [ ] Permission checked before create
  - [ ] Database save NOT called on denial
  - [ ] Clear error message on denial

- [ ] **Write permission denial (update)**
  - [ ] canWrite denial throws ForbiddenException
  - [ ] Permission checked before update
  - [ ] Database save NOT called on denial
  - [ ] Cache NOT invalidated on denial

- [ ] **Delete permission denial**
  - [ ] canDelete denial throws ForbiddenException
  - [ ] Permission checked before delete
  - [ ] Database remove NOT called on denial
  - [ ] Cache NOT invalidated on denial

- [ ] **Role-based access control**
  - [ ] Admin role has full access
  - [ ] User role has limited access
  - [ ] Viewer role has read-only access
  - [ ] Custom roles tested

- [ ] **Permission check order**
  - [ ] Entity fetched first
  - [ ] Permission checked second
  - [ ] Action performed last
  - [ ] Fail fast if entity not found

---

## 2️⃣ Test Quality Standards

### Test Structure

- [ ] **Describe blocks organized logically**
  - [ ] Top-level: Service name + test type
  - [ ] Second-level: Feature/operation being tested
  - [ ] Clear hierarchy

- [ ] **Test names are descriptive**
  - [ ] Starts with "should"
  - [ ] Describes expected behavior
  - [ ] Includes context (when/if)
  - [ ] No vague names like "test 1" or "works"

- [ ] **Setup and teardown proper**
  - [ ] beforeEach resets mocks
  - [ ] afterEach clears mocks
  - [ ] No shared mutable state
  - [ ] Tests can run in any order

### Test Independence

- [ ] **Tests are isolated**
  - [ ] Each test can run independently
  - [ ] No dependencies between tests
  - [ ] Mock state reset between tests
  - [ ] No side effects

- [ ] **No test pollution**
  - [ ] Database mocks cleared
  - [ ] Cache mocks cleared
  - [ ] Permission mocks reset to defaults
  - [ ] No leftover state

---

## 3️⃣ Mock Configuration

### Repository Mocks

- [ ] **SecureRepository methods mocked**
  - [ ] find() mocked
  - [ ] findOne() mocked
  - [ ] save() mocked
  - [ ] remove() mocked
  - [ ] count() mocked (if used)

- [ ] **NOT mocking raw TypeORM**
  - [ ] NO createQueryBuilder()
  - [ ] NO update()
  - [ ] NO delete()
  - [ ] NO getRepository()

### PermissionService Mocks

- [ ] **All permission methods mocked**
  - [ ] canRead() mocked with default return
  - [ ] canWrite() mocked with default return
  - [ ] canDelete() mocked with default return
  - [ ] buildSecureQuery() mocked correctly

- [ ] **Mock returns appropriate values**
  - [ ] Default: true (allow)
  - [ ] Override in specific tests: false (deny)
  - [ ] buildSecureQuery adds tenantId

### CacheService Mocks

- [ ] **Cache methods mocked**
  - [ ] get() mocked
  - [ ] set() mocked
  - [ ] del() mocked
  - [ ] getOrSet() mocked with factory execution

- [ ] **Cache behavior realistic**
  - [ ] getOrSet executes factory function
  - [ ] Cache keys include tenantId
  - [ ] Cache invalidation tested

### User Mocks

- [ ] **Using createMockUser helper**
  - [ ] Not creating user objects manually
  - [ ] Using helper for consistency
  - [ ] Overriding properties as needed

- [ ] **Multiple tenant users created**
  - [ ] tenant1User for primary tests
  - [ ] tenant2User for cross-tenant tests
  - [ ] Different roles tested

---

## 4️⃣ Assertion Specificity

### Verification Depth

- [ ] **Assertions are specific**
  - [ ] Not just "toHaveBeenCalled()"
  - [ ] Verify arguments with "toHaveBeenCalledWith()"
  - [ ] Use expect.objectContaining() for partial matches
  - [ ] Check exact values where critical

- [ ] **Error assertions complete**
  - [ ] Exception type verified
  - [ ] Error message verified
  - [ ] Status code verified (if applicable)

### Common Assertions

- [ ] **Tenant filter verification**

  ```typescript
  expect(mockRepository.find).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-1' }),
    }),
  );
  ```

- [ ] **Permission check verification**

  ```typescript
  expect(mockPermissionService.canRead).toHaveBeenCalledWith(mockUser, mockEntity, 'EntityName');
  ```

- [ ] **Database not called verification**

  ```typescript
  expect(mockRepository.save).not.toHaveBeenCalled();
  ```

- [ ] **Exception verification**
  ```typescript
  await expect(service.method()).rejects.toThrow(ForbiddenException);
  ```

---

## 5️⃣ Security Best Practices

### Tenant Isolation

- [ ] **All queries include tenantId**
  - [ ] No queries without tenant filter
  - [ ] buildSecureQuery used consistently
  - [ ] Custom queries include tenant filter

- [ ] **Cross-tenant access blocked**
  - [ ] Tested with different tenant users
  - [ ] Returns null/empty for other tenant data
  - [ ] Cannot inject tenantId via DTO

- [ ] **Audit fields set correctly**
  - [ ] createdBy set on create
  - [ ] updatedBy set on update
  - [ ] tenantId set on create
  - [ ] Cannot override audit fields

### Permission Enforcement

- [ ] **Permission checks before DB access**
  - [ ] Read permission checked
  - [ ] Write permission checked
  - [ ] Delete permission checked
  - [ ] Custom operations checked

- [ ] **Database not accessed on denial**
  - [ ] save() not called on write denial
  - [ ] remove() not called on delete denial
  - [ ] Cache not invalidated on denial

- [ ] **Clear error messages**
  - [ ] ForbiddenException thrown
  - [ ] Error message mentions "permission"
  - [ ] User knows why access denied

### Role-Based Access

- [ ] **Different roles tested**
  - [ ] Admin role tested
  - [ ] User role tested
  - [ ] Viewer role tested
  - [ ] Custom roles tested

- [ ] **Role hierarchy respected**
  - [ ] Admin can do everything
  - [ ] User has limited access
  - [ ] Viewer is read-only

---

## 6️⃣ Code Quality

### Code Style

- [ ] **Follows TypeScript conventions**
  - [ ] Proper typing
  - [ ] No any types (unless necessary)
  - [ ] Consistent formatting
  - [ ] ESLint passes

- [ ] **Comments where needed**
  - [ ] Complex logic explained
  - [ ] Security implications noted
  - [ ] TODO items tracked

### Test Maintainability

- [ ] **DRY principle followed**
  - [ ] Common setup in beforeEach
  - [ ] Reusable mock data
  - [ ] Helper functions for repetitive code

- [ ] **Easy to understand**
  - [ ] Clear test names
  - [ ] Logical organization
  - [ ] Minimal complexity

- [ ] **Easy to modify**
  - [ ] Placeholders replaced
  - [ ] Mock data matches entity
  - [ ] No hardcoded values

---

## 📊 Coverage Metrics

### Minimum Requirements

- [ ] **Tenant Isolation: 6+ tests**
  - [ ] Tenant filter applied
  - [ ] Cross-tenant access prevention (3 tests: read, update, delete)
  - [ ] TenantId auto-set
  - [ ] Cache key isolation

- [ ] **Permission Denial: 6+ tests**
  - [ ] Read permission denial
  - [ ] Write permission denial (2 tests: create, update)
  - [ ] Delete permission denial
  - [ ] Role-based access
  - [ ] Error messages

### Coverage Targets

- [ ] **Line coverage: >80%**
  - [ ] All service methods covered
  - [ ] All branches covered
  - [ ] Error handlers covered

- [ ] **Security coverage: 100%**
  - [ ] All CRUD operations tested
  - [ ] All custom operations tested
  - [ ] All permission checks tested

---

## 🚨 Critical Issues (Must Fix)

### Blocking Issues

These issues MUST be fixed before approval:

- [ ] ❌ Mocking raw TypeORM (createQueryBuilder, update, delete)
- [ ] ❌ No permission checks tested
- [ ] ❌ No tenant isolation tests
- [ ] ❌ Tests depend on execution order
- [ ] ❌ Shared mutable state between tests
- [ ] ❌ No assertions (empty test bodies)
- [ ] ❌ Tests always pass (no real verification)

### High Priority Issues

These issues should be fixed:

- [ ] ⚠️ Incomplete tenant isolation coverage
- [ ] ⚠️ Incomplete permission denial coverage
- [ ] ⚠️ Vague test names
- [ ] ⚠️ Missing error message verification
- [ ] ⚠️ Not using createMockUser helper
- [ ] ⚠️ Hardcoded values instead of constants

### Medium Priority Issues

These issues are nice to fix:

- [ ] 💡 Could use more descriptive variable names
- [ ] 💡 Could add more comments
- [ ] 💡 Could refactor duplicate code
- [ ] 💡 Could add integration tests

---

## 📝 Review Process

### Step 1: Initial Review (5 minutes)

- [ ] Check file structure
- [ ] Verify templates used
- [ ] Count test cases
- [ ] Scan for obvious issues

### Step 2: Detailed Review (15 minutes)

- [ ] Go through each checklist item
- [ ] Verify mock configuration
- [ ] Check assertion specificity
- [ ] Test security scenarios

### Step 3: Run Tests (5 minutes)

- [ ] Run tests locally
- [ ] Verify all tests pass
- [ ] Check coverage report
- [ ] No console errors/warnings

### Step 4: Provide Feedback (5 minutes)

- [ ] List blocking issues
- [ ] List high priority issues
- [ ] Suggest improvements
- [ ] Approve or request changes

**Total Time: ~30 minutes per service**

---

## ✅ Approval Criteria

### Must Have (Required for Approval)

- ✅ All blocking issues resolved
- ✅ Minimum 6 tenant isolation tests
- ✅ Minimum 6 permission denial tests
- ✅ All tests pass
- ✅ Coverage >80%
- ✅ No TypeORM mocking
- ✅ PermissionService mocked correctly

### Should Have (Recommended)

- ✅ All high priority issues resolved
- ✅ Clear test names
- ✅ Specific assertions
- ✅ Role-based tests
- ✅ Error message verification

### Nice to Have (Optional)

- ✅ Medium priority issues resolved
- ✅ Integration tests
- ✅ Performance tests
- ✅ Edge case coverage

---

## 📋 Review Template

Use this template when reviewing:

```markdown
## Security Test Review: [ServiceName]

**Reviewer:** [Your Name]
**Date:** [Date]
**PR:** [PR Link]

### Coverage Summary

- Tenant Isolation Tests: [X/6]
- Permission Denial Tests: [X/6]
- Total Security Tests: [X/12]
- Line Coverage: [X%]

### Blocking Issues

- [ ] Issue 1
- [ ] Issue 2

### High Priority Issues

- [ ] Issue 1
- [ ] Issue 2

### Medium Priority Issues

- [ ] Issue 1
- [ ] Issue 2

### Strengths

- Good point 1
- Good point 2

### Recommendations

- Suggestion 1
- Suggestion 2

### Decision

- [ ] ✅ APPROVED - Ready to merge
- [ ] ⚠️ APPROVED WITH COMMENTS - Merge but address comments later
- [ ] ❌ CHANGES REQUESTED - Must fix blocking issues

### Next Steps

1. [Action item 1]
2. [Action item 2]
```

---

## 🎯 Quick Reference

### Fast Check (2 minutes)

1. ✅ File uses templates?
2. ✅ 12+ security tests?
3. ✅ All tests pass?
4. ✅ No TypeORM mocking?
5. ✅ PermissionService mocked?

**If all YES → Detailed review**  
**If any NO → Request changes immediately**

### Common Feedback

**Tenant Isolation:**

- "Add test for cross-tenant update prevention"
- "Verify tenantId in cache keys"
- "Test that tenantId cannot be injected via DTO"

**Permission Denial:**

- "Add test for write permission denial on create"
- "Verify database not called when permission denied"
- "Add role-based access control tests"

**Code Quality:**

- "Use createMockUser helper instead of manual object"
- "Add more specific assertions with toHaveBeenCalledWith"
- "Clear mocks in afterEach"

---

## 📚 Resources

### Documentation

- `docs/testing/security-test-templates.md` - Main guide
- `docs/testing/tenant-isolation-test.template.ts` - Template
- `docs/testing/permission-denial-test.template.ts` - Template

### Examples

- `src/backend/domains/sales/order/order.service.spec.ts`
- `src/backend/platform/notification/notification.service.spec.ts`

### Tools

```bash
# Run tests
npm test -- service-name.spec.ts

# Check coverage
npm test -- --coverage

# Run security tests only
npm test -- --testNamePattern="Tenant Isolation|Permission Denial"
```

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Ready for Use  
**Next Review:** Week 2 Day 1
