---
inclusion: manual
description: 'CHANGELOG update guide following Keep a Changelog standard. Defines categories (Added, Changed, Fixed, Security), entry format, and best practices for documenting changes.'
---

# CHANGELOG Update Guide

## Format: Keep a Changelog

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standard.

---

## Structure

```markdown
# Changelog

## [Unreleased]

### Added - YYYY-MM-DD

- New features

### Changed - YYYY-MM-DD

- Changes to existing functionality

### Deprecated - YYYY-MM-DD

- Soon-to-be removed features

### Removed - YYYY-MM-DD

- Removed features

### Fixed - YYYY-MM-DD

- Bug fixes

### Security - YYYY-MM-DD

- Security improvements

## [Version] - YYYY-MM-DD

...
```

---

## Categories

### Added

- New features, modules, endpoints
- New capabilities
- Example: "Added SecureRepository pattern for multi-tenant security"

### Changed

- Modifications to existing features
- Breaking changes (mark with **BREAKING CHANGE**)
- Example: "**BREAKING**: Method signatures changed from tenantId to User context"

### Fixed

- Bug fixes
- Test fixes
- Example: "Fixed 31 test files with parameter order issues"

### Security

- Security improvements
- Vulnerability fixes
- Example: "Added CSRF protection with CsrfGuard"

---

## Entry Format

```markdown
### Added - YYYY-MM-DD

- **Feature Name** (Context/Phase)
  - Detailed description with bullet points
  - Key changes or improvements
  - Metrics: X/Y tests passing, N% coverage
  - Files affected: service.ts, controller.ts
  - Example: "✅ product-catalog.service.ts - 18/18 tests PASSED"
```

---

## Best Practices

1. **Date Format**: Use YYYY-MM-DD (ISO 8601)
2. **Group by Date**: All changes on same date under same heading
3. **Be Specific**: Include file names, test counts, metrics
4. **Use Checkmarks**: ✅ for complete, ⏳ for in-progress, ❌ for blocked
5. **Link Issues**: Reference GitHub issues when applicable
6. **Breaking Changes**: Always mark with **BREAKING CHANGE**
7. **Progress Metrics**: Include test results, coverage, completion %

---

## Example Entry

```markdown
### Added - 2026-03-09

- **SecureRepository Refactoring** (Phase 4, Week 48.6)
  - Refactored 14 services to use SecureRepository pattern
  - Pattern 1 (E-Commerce): 3/5 services complete (60%)
    - ✅ checkout.service.ts - 10/10 tests PASSED
    - ✅ payment.service.ts - 7/7 tests PASSED
  - Overall Progress: 14/30 services (47%), 154/154 tests passing
  - Security: All queries enforce tenant isolation automatically
```

---

## When to Update

Update CHANGELOG.md when:

- ✅ Completing a service refactoring
- ✅ Adding a new module or feature
- ✅ Fixing critical bugs
- ✅ Making breaking changes
- ✅ Completing a milestone (e.g., 50% progress)
- ✅ Before committing to git

---

## Automation

Use the `git-commit-milestone.kiro.hook` to auto-suggest CHANGELOG updates when completing milestones.

---

**Remember**: CHANGELOG is for humans, not machines. Write clearly and provide context!
