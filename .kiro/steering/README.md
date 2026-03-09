# Steering Files

Steering files provide guidance and best practices for SmartERP development.

---

## 📚 Available Guides

### Documentation Standards

1. **changelog-guide.md** - CHANGELOG Update Guide
   - Format: Keep a Changelog standard
   - Categories: Added, Changed, Fixed, Security
   - Entry format with examples
   - When to update CHANGELOG
   - Usage: `#changelog-guide` in chat

2. **roadmap-guide.md** - ROADMAP Update Guide
   - Status indicators (✅ ⏳ ⚠️ ❌)
   - Progress tracking tables
   - Update patterns for tasks
   - Usage: `#roadmap-guide` in chat

### Architecture & Patterns

3. **odoo-erpnext-architecture.md** - Architecture Principles
   - Module-based structure (Odoo style)
   - Multi-tenancy & security (ERPNext style)
   - Workflow & approval system
   - Testing with SecureRepository
   - Usage: Auto-included (always active)

4. **vietnamese-communication.md** - Communication Guidelines
   - Vietnamese response rules
   - Technical term handling
   - Code comment standards
   - Usage: Auto-included (always active)

---

## 🎯 How to Use

### Auto-Included Files

These files are automatically loaded in every conversation:

- `odoo-erpnext-architecture.md` - Architecture principles
- `vietnamese-communication.md` - Communication guidelines

### Manual Inclusion

Use `#filename` in chat to load specific guides:

```
User: "I need to update CHANGELOG #changelog-guide"
Agent: [Loads changelog-guide.md and provides guidance]
```

### Context Keys

- `#changelog-guide` - Load CHANGELOG update guide
- `#roadmap-guide` - Load ROADMAP update guide

---

## 🔧 Hooks Integration

### legacy-code-checkpoint.kiro.hook

- **Trigger**: preToolUse (write tools only)
- **Action**: Verify legacy code trước khi refactor
- **Checks**:
  1. File có trong exception list không?
  2. Nếu CÓ → Research Odoo/ERPNext + Refactor theo pattern
  3. Nếu KHÔNG → Verify tuân thủ hoặc block
  4. Chỉ check file đang sửa, bỏ qua files khác
- **Exception List**: `.kiro/architecture-exceptions.json`
- **Status**: ✅ Active

### production-ready-reminder.kiro.hook

- **Trigger**: postToolUse (write, shell tools only)
- **Action**: Verify steering rules compliance after each tool use
- **Checks**: SecureRepository, tenant isolation, permission check, audit trail, tests
- **Status**: ✅ Active

### release-readiness-check.kiro.hook

- **Trigger**: agentStop (after task completion)
- **Action**: Final production readiness check
- **Checks**: Tests pass, security, features work, no blockers
- **Status**: ✅ Active

### pre-commit-quality-gate.kiro.hook

- **Trigger**: userTriggered (manual)
- **Action**: Run comprehensive quality checks
- **Checks**: lint, type-check, tests, security audit
- **Status**: ✅ Active

### .husky/pre-commit (Git Hook)

- **Trigger**: Before every git commit
- **Action**: Automated enforcement of architecture rules
- **Checks**:
  1. Architecture compliance (SecureRepository, PermissionService)
  2. Lint staged files
  3. Type check
  4. Debug code detection
  5. Code smells warning
- **Enforcement**: `.husky/architecture-check` script
- **Status**: ✅ Active

### .husky/architecture-check (Enforcement Script)

- **Purpose**: Block commits that violate Odoo/ERPNext patterns
- **Checks**:
  1. Direct repository queries (must use SecureRepository)
  2. Missing PermissionService injection
  3. Missing SecureRepository instantiation
- **Exception List**: Legacy code in `architecture-exceptions.json`
- **Status**: ✅ Active

### Disabled Hooks (Team Disbanded)

- **post-tool-continue-work.kiro.hook** - ❌ Disabled (replaced by production-ready-reminder)
- **git-commit-milestone.kiro.hook** - ❌ Disabled (team disbanded, no delegation)
- **autonomous-workflow.kiro.hook** - ❌ Disabled (team disbanded, no delegation)

---

## 📝 Adding New Guides

1. Create new `.md` file in `.kiro/steering/`
2. Add front-matter:
   ```markdown
   ---
   inclusion: manual # or auto
   ---
   ```
3. Write guide content
4. Update this README.md
5. Create hook if needed (in `.kiro/hooks/`)

---

## 🎓 Best Practices

1. **Keep guides focused** - One topic per file
2. **Provide examples** - Show, don't just tell
3. **Update regularly** - Guides should reflect current practices
4. **Link related docs** - Reference other guides and docs
5. **Use clear formatting** - Headers, lists, code blocks

---

## 📊 Steering File Status

| File                         | Type   | Status    | Last Updated |
| ---------------------------- | ------ | --------- | ------------ |
| odoo-erpnext-architecture.md | Auto   | ✅ Active | 2026-03-07   |
| vietnamese-communication.md  | Auto   | ✅ Active | 2026-03-07   |
| architecture-enforcement.md  | Auto   | ✅ Active | 2026-03-09   |
| changelog-guide.md           | Manual | ✅ Active | 2026-03-09   |
| roadmap-guide.md             | Manual | ✅ Active | 2026-03-09   |

---

**Last Updated**: 2026-03-09  
**Total Guides**: 5 (3 auto, 2 manual)

## 🔗 Integration Status

### Steering ↔ Hooks Mapping

| Steering File                | Enforced By                         | Status     |
| ---------------------------- | ----------------------------------- | ---------- |
| odoo-erpnext-architecture.md | .husky/architecture-check           | ✅ Active  |
| architecture-enforcement.md  | .husky/pre-commit                   | ✅ Active  |
| vietnamese-communication.md  | production-ready-reminder.kiro.hook | ✅ Active  |
| changelog-guide.md           | (Manual reference)                  | ⏳ Pending |
| roadmap-guide.md             | (Manual reference)                  | ⏳ Pending |

### Compliance Metrics

- **Architecture Compliance**: 76% (38/50 services use SecureRepository)
- **Test Coverage**: 80% (88/110 test suites pass)
- **Target**: 100% by 2026-06-30
