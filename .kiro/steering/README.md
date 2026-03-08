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
   - Role-based structure (Tech Lead, Developer, QA)
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

- `odoo-erpnext-architecture.md`
- `vietnamese-communication.md`

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

### git-commit-milestone.kiro.hook

- **Trigger**: agentStop (after task completion)
- **Action**: Suggest git commit if milestone completed
- **Uses**: Both changelog-guide.md and roadmap-guide.md
- **Format**: Conventional Commits with detailed body

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
| changelog-guide.md           | Manual | ✅ Active | 2026-03-09   |
| roadmap-guide.md             | Manual | ✅ Active | 2026-03-09   |

---

**Last Updated**: 2026-03-09  
**Total Guides**: 4 (2 auto, 2 manual)
