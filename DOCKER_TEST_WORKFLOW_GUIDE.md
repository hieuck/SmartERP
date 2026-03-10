# Smart-ERP Docker Test & Error Handling Workflow

**Date:** March 10, 2026  
**Status:** ✅ COMPLETE  
**Purpose:** Quick guide to Docker testing and error classification

---

## 📋 What's New

Đã tạo hoàn chỉnh workflow cho Docker testing với phân loại lỗi:

### ✅ Files Created

1. **`.kiro/steering/smart-erp-docker-test-workflow.md`**
   - Hướng dẫn chi tiết cho Docker testing
   - Phân loại lỗi (Refactoring Issues vs Bugs)
   - Decision tree để xác định loại lỗi
   - Checklists cho refactoring và bug fixes
   - 3 ví dụ thực tế
   - Best practices

2. **`.kiro/hooks/smart-erp-docker-test-handler.kiro.hook`** (đã tạo trước)
   - Hook user-triggered
   - Cung cấp guidance cho error classification
   - Checklists cho refactoring và bug fixes

3. **`.kiro/steering/smart-erp-refactoring-standards.md`** (đã tạo trước)
   - 31 patterns cho 6 components
   - NEW patterns (✅) vs OLD patterns (❌)
   - Universal + component-specific standards

4. **`.kiro/hooks/smart-erp-refactoring-reminder.kiro.hook`** (đã tạo trước)
   - File edit reminder
   - Triggers trên mọi file change trong smart-erp/src/**

---

## 🚀 Quick Start

### 1. Run Docker

```bash
cd smart-erp
docker-compose up --build
```

### 2. Monitor Logs

```bash
docker-compose logs -f
```

### 3. When Error Occurs

**Classify the error:**
- Is it a code pattern violation? → **REFACTORING ISSUE**
- Is it a runtime/logic error? → **BUG**
- Both? → Fix refactoring first, then bug

**Use the appropriate checklist:**
- Refactoring issue → Use refactoring checklist
- Bug → Use bug fix checklist

**Verify the fix:**
```bash
docker-compose down
docker-compose up --build
docker-compose logs -f
```

---

## 📚 Documentation

### For Developers

**Read these files in order:**

1. **`smart-erp/REFACTORING_STANDARDS_README.md`** (5 min)
   - Overview of standards
   - Quick examples
   - Checklists

2. **`.kiro/steering/smart-erp-refactoring-standards.md`** (20 min)
   - Detailed patterns for all components
   - NEW patterns with examples
   - OLD patterns to avoid
   - Refactoring priority phases

3. **`.kiro/steering/smart-erp-docker-test-workflow.md`** (15 min)
   - Docker testing workflow
   - Error classification guide
   - Decision tree
   - Examples and best practices

### For Code Reviewers

**Use these checklists:**

1. **Refactoring Checklist** (from standards)
   - 13 items for refactoring old code
   - Ensures nothing is missed

2. **Code Review Checklist** (from standards)
   - 12 items for reviewing new code
   - Ensures standards are followed

3. **Bug Fix Checklist** (from workflow)
   - 8 items for fixing bugs
   - Ensures proper testing

### For Team Leads

**Monitor progress:**

1. **Hook Reminders**
   - File edit hook reminds on every change
   - Docker test hook guides error classification

2. **Refactoring Phases**
   - Phase 1 (Immediate): Core architecture
   - Phase 2 (Short-term): Validation & error handling
   - Phase 3 (Mid-term): Testing & documentation
   - Phase 4 (Long-term): Optimization & cleanup

3. **Success Metrics**
   - 100% of new code follows NEW patterns
   - 80%+ of old code refactored
   - 80%+ code coverage
   - 0 linter violations

---

## 🔍 Error Classification

### Refactoring Issues (Fix by Refactoring)

Code violates NEW patterns:

**Backend:**
- Direct DB access in controllers
- Manual instantiation
- Raw promises
- `any` types
- No validation, error handling, tests, docs
- Hardcoded values
- Mixed patterns

**Frontend:**
- Class components
- Local state for global data
- API calls in components
- Inline styles
- No type safety

**Mobile:**
- Class components
- Inconsistent navigation
- Local state management
- No type safety

**Shared:**
- Types scattered everywhere
- Hardcoded values
- Duplicate utilities

**Database:**
- Unnamed migrations
- Hardcoded seeds
- No documentation

**Infrastructure:**
- Single-stage Docker builds
- Hardcoded configuration
- Disorganized docker-compose

### Bugs (Fix Directly)

Actual runtime/logic errors:

- Runtime errors (null reference, type mismatch, undefined)
- Logic errors (wrong calculation, incorrect condition)
- Missing dependencies or imports
- Configuration issues
- Database connection problems
- API endpoint issues
- Network issues
- Permission issues

---

## 🌳 Decision Tree

```
Error Occurred
    ↓
Is it a code pattern violation?
    ├─ YES → REFACTORING ISSUE
    │   └─ Use refactoring checklist
    │
    └─ NO → Is it a runtime/logic error?
        ├─ YES → BUG
        │   └─ Use bug fix checklist
        │
        └─ MAYBE → Check both
            └─ Fix refactoring first, then bug
```

---

## ✅ Checklists

### Refactoring Checklist (13 items)

- [ ] Move business logic from controller to service
- [ ] Replace manual instantiation with DI
- [ ] Replace promises with async/await
- [ ] Replace `any` types with proper types
- [ ] Add class-validator decorators
- [ ] Add custom exception classes
- [ ] Add JSDoc documentation
- [ ] Add unit tests
- [ ] Remove hardcoded values
- [ ] Add proper error handling
- [ ] Update module organization if needed
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`

### Bug Fix Checklist (8 items)

- [ ] Identify exact error location
- [ ] Understand root cause
- [ ] Apply minimal fix (don't refactor)
- [ ] Verify fix doesn't break other code
- [ ] Run tests: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] Test in Docker: `docker-compose up --build`
- [ ] Verify error is gone

---

## 📋 Examples

### Example 1: Refactoring Issue

**Error:** `Cannot read property 'find' of undefined`

**Root Cause:** Direct DB access in controller

**Fix:** Create service layer, inject service

**Result:** ✅ Error fixed by refactoring

### Example 2: Bug

**Error:** `Cannot read property 'email' of null`

**Root Cause:** Missing null check

**Fix:** Add null check, throw exception

**Result:** ✅ Error fixed by bug fix

### Example 3: Both

**Error:** `Cannot read property 'find' of undefined`

**Root Cause:** Direct DB access (refactoring) + repository undefined (bug)

**Fix:** 
1. Refactor to use service layer
2. Fix repository initialization

**Result:** ✅ Error fixed by refactoring + bug fix

---

## 🎯 Workflow Steps

```
1. Run Docker
   docker-compose up --build

2. Monitor Logs
   docker-compose logs -f

3. Error Occurs
   Note error message and stack trace

4. Classify Error
   Use decision tree

5. Fix Error
   Use appropriate checklist

6. Verify Fix
   docker-compose down
   docker-compose up --build

7. Repeat
   Continue until all errors resolved

8. Success
   All services running, no errors
```

---

## 🔗 Related Files

- `.kiro/steering/smart-erp-refactoring-standards.md` - Detailed standards
- `.kiro/steering/smart-erp-docker-test-workflow.md` - Detailed workflow
- `.kiro/hooks/smart-erp-docker-test-handler.kiro.hook` - Hook configuration
- `.kiro/hooks/smart-erp-refactoring-reminder.kiro.hook` - File edit reminder
- `smart-erp/REFACTORING_STANDARDS_README.md` - Quick reference

---

## 📞 Questions?

### For Standards Questions
See: `.kiro/steering/smart-erp-refactoring-standards.md`

### For Workflow Questions
See: `.kiro/steering/smart-erp-docker-test-workflow.md`

### For Quick Reference
See: `smart-erp/REFACTORING_STANDARDS_README.md`

### For Error Classification
See: Error Classification section above

---

## ✅ Checklist for Team

- [ ] Read `smart-erp/REFACTORING_STANDARDS_README.md`
- [ ] Read `.kiro/steering/smart-erp-refactoring-standards.md`
- [ ] Read `.kiro/steering/smart-erp-docker-test-workflow.md`
- [ ] Understand error classification
- [ ] Understand decision tree
- [ ] Know refactoring checklist
- [ ] Know bug fix checklist
- [ ] Ready to run Docker tests

---

## 🎯 Remember

**Key Principles:**

1. **Classify First** - Determine if refactoring issue or bug
2. **Fix Refactoring First** - If both, fix refactoring first
3. **Use Checklists** - Don't skip steps
4. **Run Tests** - Always verify fix
5. **Test in Docker** - Ensure production readiness

**Success Criteria:**

- ✅ All services running
- ✅ No errors in logs
- ✅ All tests passing
- ✅ Linter passing
- ✅ Code follows NEW patterns

---

**Last Updated:** March 10, 2026  
**Status:** ✅ COMPLETE

