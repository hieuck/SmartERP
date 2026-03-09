# Steering Files

Steering files provide guidance and best practices for development.

---

## 📚 Available Guides

### Architecture & Patterns (Core)

1. **multi-tenant-architecture-patterns.md** ⭐ NEW - General Architecture
   - Tenant isolation pattern
   - Permission system (RBAC)
   - Audit trail patterns
   - Caching strategies
   - Testing patterns
   - API design
   - Status management
   - Workflow patterns
   - **Type**: Auto-included (always active)
   - **Use for**: Any multi-tenant application (SaaS, B2B, Enterprise)

2. **erp-implementation-guide.md** ⭐ NEW - ERP-Specific Guide
   - Odoo/ERPNext research workflow
   - ERP module structure
   - Accounting patterns
   - Inventory patterns
   - Manufacturing patterns
   - SmartERP business logic
   - **Type**: Manual inclusion (`#erp-implementation-guide`)
   - **Use for**: ERP features, Odoo/ERPNext research

3. **~~odoo-erpnext-architecture.md~~** 🚫 DEPRECATED
   - **Status**: Deprecated (v2.1.0), will be removed in v3.0.0
   - **Replaced by**: multi-tenant-architecture-patterns.md + erp-implementation-guide.md
   - **Action**: Use new files above

4. **architecture-enforcement.md** - Automated Compliance
   - Pre-commit hooks
   - CI/CD gates
   - ESLint custom rules
   - Exception list mechanism
   - **Type**: Auto-included (always active)

### Documentation Standards

5. **changelog-guide.md** - CHANGELOG Update Guide
   - Format: Keep a Changelog standard
   - Categories: Added, Changed, Fixed, Security
   - Entry format with examples
   - When to update CHANGELOG
   - **Usage**: `#changelog-guide` in chat

6. **roadmap-guide.md** - ROADMAP Update Guide
   - Status indicators (✅ ⏳ ⚠️ ❌)
   - Progress tracking tables
   - Update patterns for tasks
   - **Usage**: `#roadmap-guide` in chat

### Migration & Troubleshooting

7. **migration-guide.md** - SecureRepository Migration
   - Step-by-step migration process
   - Before/after code examples
   - Test migration strategies
   - Rollback procedures
   - **Usage**: `#migration-guide` in chat

8. **troubleshooting-guide.md** - Common Issues & Solutions
   - Architecture compliance errors
   - Test failures
   - Permission issues
   - Cache problems
   - Edge cases
   - **Usage**: `#troubleshooting-guide` in chat

### Communication

9. **vietnamese-communication.md** - Communication Guidelines
   - Vietnamese response rules
   - Technical term handling
   - Code comment standards
   - **Type**: Auto-included (always active)

---

## 🎯 How to Use

### Auto-Included Files (Always Active)

These files are automatically loaded in every conversation:

- `multi-tenant-architecture-patterns.md` ⭐ NEW - General architecture (70% general)
- `architecture-enforcement.md` - Compliance automation
- `vietnamese-communication.md` - Communication guidelines

### Manual Inclusion (Load When Needed)

Use `#filename` in chat to load specific guides:

```
User: "I need to update CHANGELOG #changelog-guide"
Agent: [Loads changelog-guide.md and provides guidance]

User: "Implement accounting module #erp-implementation-guide"
Agent: [Loads erp-implementation-guide.md with Odoo/ERPNext patterns]
```

### Context Keys

- `#erp-implementation-guide` ⭐ NEW - Load ERP-specific patterns
- `#changelog-guide` - Load CHANGELOG update guide
- `#roadmap-guide` - Load ROADMAP update guide
- `#migration-guide` - Load SecureRepository migration guide
- `#troubleshooting-guide` - Load troubleshooting guide

---

## 🔧 Hooks Integration

### architecture-checkpoint.kiro.hook ⭐ RENAMED

**Previous name**: `legacy-code-checkpoint.kiro.hook`

- **Trigger**: preToolUse (write tools only)
- **Action**: Autonomous verification - Tự động check và fix vi phạm
- **Mode**: Autonomous (không hỏi user, tự quyết định)
- **Checks**:
  1. File có trong exception list không?
  2. Nếu CÓ (Legacy) → TỰ ĐỘNG: Refactor nếu cần hoặc minimal change
  3. Nếu KHÔNG (New) → TỰ ĐỘNG: Fix vi phạm ngay lập tức
  4. Chỉ check file đang sửa, bỏ qua files khác
- **Research Time**: Adaptive (10-60 phút based on complexity)
  - Simple: 10-15 phút research
  - Moderate: 20-30 phút research
  - Complex: 30-60 phút research
  - **Domain-agnostic**: Research best practices for any domain
- **Decision Rules**:
  - ❌ KHÔNG BAO GIỜ proceed với code vi phạm
  - ✅ LUÔN LUÔN fix trước khi proceed
  - 🤖 TỰ ĐỘNG quyết định, không cần approval
- **Exception List**: `.kiro/architecture-exceptions.json`
- **Version**: 2.0.0 (was 1.2.0)
- **Status**: ✅ Active

### production-ready-reminder.kiro.hook

- **Trigger**: postToolUse (write, shell tools only)
- **Action**: Autonomous verification - Tự động verify architecture compliance sau mỗi tool use
- **Mode**: Autonomous (không hỏi user, tự verify và fix)
- **File Type Filter**: Chỉ check .service.ts, .controller.ts, .entity.ts, .spec.ts
  - ⏭️ SKIP: .json, .md, .yml, .yaml, .txt, config files
- **Checks**: SecureRepository, tenant isolation, permission check, audit trail, tests
- **Decision Rules**:
  - Vi phạm → TỰ ĐỘNG fix ngay
  - Tuân thủ → Continue work
- **Version**: 2.0.0 (was 1.2.0)
- **Status**: ✅ Active

### release-readiness-check.kiro.hook

- **Trigger**: agentStop (after task completion)
- **Action**: Autonomous final check - Tự động verify release readiness
- **Mode**: Autonomous (không hỏi user, tự quyết định commit hay continue)
- **Checks**: Tests pass, security, features work, no blockers
- **Decision Rules**:
  - All YES → TỰ ĐỘNG commit
  - Any NO → Continue fixing
- **Version**: 1.1.0
- **Status**: ✅ Active

### pre-commit-quality-gate.kiro.hook

- **Trigger**: userTriggered (manual)
- **Action**: Run comprehensive quality checks
- **Checks**: lint, type-check, tests, security audit
- **Status**: ✅ Active

---

## 📊 Steering File Status

| File                                  | Type   | Status        | Last Updated |
| ------------------------------------- | ------ | ------------- | ------------ |
| multi-tenant-architecture-patterns.md | Auto   | ✅ Active     | 2026-03-09   |
| erp-implementation-guide.md           | Manual | ✅ Active     | 2026-03-09   |
| architecture-enforcement.md           | Auto   | ✅ Active     | 2026-03-09   |
| vietnamese-communication.md           | Auto   | ✅ Active     | 2026-03-07   |
| ~~odoo-erpnext-architecture.md~~      | Auto   | 🚫 Deprecated | 2026-03-09   |
| changelog-guide.md                    | Manual | ✅ Active     | 2026-03-09   |
| roadmap-guide.md                      | Manual | ✅ Active     | 2026-03-09   |
| migration-guide.md                    | Manual | ✅ Active     | 2026-03-09   |
| troubleshooting-guide.md              | Manual | ✅ Active     | 2026-03-09   |

---

## 🎓 Skills Library

SmartERP has 22 specialized skills for development patterns and best practices.

### Core Skills (Most Used)

1. **secure-repository-pattern** ⭐ - Multi-tenant security pattern (use for ALL services)
2. **backend-testing-patterns** ⭐ - Comprehensive testing guide
3. **fixing-test-mocking-issues** ⭐ - Fix common test errors
4. **api-design-patterns** - RESTful API best practices
5. **error-handling-patterns** - Consistent error management

### All Skills by Category

- **Architecture & Core** (6): secure-repository, api-design, database-typeorm, workflow-state-machine, error-handling, accessibility-testing
- **Testing** (8): backend-testing, fixing-test-mocking, test-utilities, contract-testing, property-based-testing, mutation-testing, load-testing, visual-regression-testing
- **Frontend & Mobile** (2): frontend-react, mobile-react-native
- **Security** (1): security-authentication
- **Performance** (1): performance-optimization
- **DevOps** (2): devops-deployment, chaos-engineering
- **Documentation** (2): documentation-standards, code-quality-standards

### How to Use Skills

Activate a skill using `discloseContext` tool:

```typescript
discloseContext({ name: 'secure-repository-pattern' });
```

**Full Skills Documentation**: `.kiro/skills/README.md`

---

## 🎯 Phase 1 Generalization (v2.1.0)

**Status**: ✅ Complete (2026-03-09)

**Changes**:

1. ✅ Split `odoo-erpnext-architecture.md` → 2 files (general + specific)
2. ✅ Created `multi-tenant-architecture-patterns.md` (70% general)
3. ✅ Created `erp-implementation-guide.md` (30% ERP-specific)
4. ✅ Renamed `legacy-code-checkpoint.kiro.hook` → `architecture-checkpoint.kiro.hook`
5. ✅ Generalized hooks (removed ERP-specific research requirement)
6. ✅ Updated hook versions: 1.2.0 → 2.0.0

**Benefits**:

- ✅ Portable to any multi-tenant app (not just ERP)
- ✅ Clear separation: 70% general, 30% specific
- ✅ ERP knowledge preserved but optional
- ✅ Domain-agnostic architecture patterns

**Next**: Phase 2 - Generalize skills (4 skills need updates)

---

**Last Updated**: 2026-03-09  
**Version**: 2.1.0 (was 2.0.0)  
**Total Guides**: 9 (4 auto, 5 manual)  
**Status**: ✅ Phase 1 Complete
