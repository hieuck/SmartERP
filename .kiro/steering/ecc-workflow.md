---
inclusion: always
---

# ECC Workflow Enforcement for Smart ERP

You MUST follow this strict workflow for ALL code changes:

## Mandatory Workflow

### 1. PLAN (Complex Features Only)
- If feature is complex (>3 files or >500 lines), use context-gatherer agent FIRST
- Break into phases, identify risks
- Document plan before coding

### 2. TDD (MANDATORY)
**RED → GREEN → REFACTOR**

Before writing ANY implementation code:
1. Write test first (test MUST fail)
2. Run test to verify it fails
3. Write minimal implementation
4. Run test to verify it passes
5. Refactor if needed
6. Verify 80%+ coverage

**NO EXCEPTIONS** - If you write implementation before tests, STOP and rewrite.

### 3. IMPLEMENTATION
- Follow immutability principle (never mutate objects)
- Functions <50 lines, files <800 lines
- Proper error handling at every level
- Input validation at system boundaries
- No hardcoded secrets or values

### 4. SECURITY CHECK (MANDATORY)
After writing code, you MUST check:
- ✅ No hardcoded secrets (API keys, passwords, tokens)
- ✅ All user inputs validated
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (sanitized HTML)
- ✅ CSRF protection enabled
- ✅ Authentication/authorization verified
- ✅ Rate limiting on endpoints
- ✅ Error messages don't leak sensitive data

If ANY security issue found: STOP → Fix CRITICAL issues → Review similar code

### 5. CODE REVIEW (MANDATORY)
After implementation, you MUST review:
- ✅ Code quality (readability, maintainability)
- ✅ Performance (no N+1 queries, proper indexing)
- ✅ Error handling (no silent failures)
- ✅ Documentation (JSDoc for complex functions)
- ✅ Naming conventions (clear, descriptive)
- ✅ No code duplication

### 6. COVERAGE CHECK (MANDATORY)
Before considering task complete:
- Run tests: `npm test`
- Check coverage: `npm run test:cov`
- **MINIMUM 80% coverage required**
- If <80%, write more tests until threshold met

### 7. BUILD VERIFICATION (MANDATORY)
Before commit:
- Run linter: `npm run lint`
- Run build: `npm run build`
- Fix ALL errors (no warnings allowed in production code)

## Enforcement Rules

**If you skip ANY step above:**
1. STOP immediately
2. Acknowledge the violation
3. Go back and complete the skipped step
4. Continue from there

**If tests fail:**
1. Analyze failure (test isolation, mocks, implementation)
2. Fix implementation (NOT tests, unless tests are wrong)
3. Re-run until all pass

**If coverage <80%:**
1. Identify uncovered code paths
2. Write additional tests
3. Re-run coverage check
4. Repeat until 80%+ achieved

**If security issue found:**
1. STOP all other work
2. Fix CRITICAL and HIGH severity issues immediately
3. Document fix in commit message
4. Review codebase for similar issues

## Success Criteria

Task is NOT complete until:
- ✅ All tests pass
- ✅ Coverage ≥80%
- ✅ No security vulnerabilities
- ✅ Build successful
- ✅ Code reviewed and approved
- ✅ Linter passes with no errors

## Commit Format (MANDATORY)

```
<type>: <description>

[optional body]

[optional footer]
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Example:
```
feat: add offline-first support for products API

- Implement IndexedDB storage with Dexie
- Add background sync service
- Add conflict resolution (last-write-wins)
- Tests: 85% coverage

Closes #123
```

## Offline-First Pattern (Smart ERP Specific)

When implementing features that need offline support:
1. Add Dexie table definition
2. Create sync service with conflict resolution
3. Update UI to use IndexedDB first, then API
4. Add Service Worker for background sync
5. Test offline scenarios in E2E tests

## Project-Specific Standards

### NestJS Backend
- Use dependency injection
- DTOs for validation
- Guards for auth
- Interceptors for logging
- Exception filters for errors
- Swagger decorators on all endpoints

### React Frontend
- Functional components + hooks only
- Redux Toolkit for state
- Ant Design components
- TypeScript strict mode
- Offline-first: IndexedDB → API

### Database
- TypeORM migrations (never modify entities directly)
- Indexes on foreign keys
- Soft deletes (deletedAt)
- Parameterized queries only

## Violation Consequences

If you violate these rules:
1. Task is considered INCOMPLETE
2. You must restart from the violated step
3. All subsequent work may need to be redone

**These rules are NON-NEGOTIABLE for production code.**
