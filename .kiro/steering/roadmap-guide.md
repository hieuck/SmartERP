---
inclusion: manual
description: 'ROADMAP update guide for role-based, phase-driven development tracking. Defines status indicators, progress tracking tables, and update patterns for SmartERP development phases.'
---

# ROADMAP Update Guide

## Role-Based Structure

ROADMAP.md follows a **role-based, phase-driven** structure for SmartERP development.

---

## Structure Overview

```markdown
# 🚀 SmartERP Development Roadmap

## 📊 Current Status

- Feature Parity: X% → Target: Y%
- Modules: N modules → Target: M modules
- Quality Score: A/10 → Target: B/10

## 🎯 12-Month Roadmap

### Phase N: Name (Months X-Y) → Z% Feature Parity

#### Month X: Focus Area

- [ ] **Week A-B**: Task Name ⏳ STATUS
  - Subtask 1 ✅
  - Subtask 2 ⏳
  - Metrics: X/Y tests, N% coverage
  - Files: service.ts, controller.ts

**Phase N Deliverables**:

- ✅ Deliverable 1
- ⏳ Deliverable 2
```

---

## Status Indicators

- ✅ **Complete**: Task finished, tests passing
- ⏳ **In Progress**: Currently working on
- ⚠️ **Blocked**: Has blockers, needs resolution
- ❌ **Failed**: Attempted but failed
- 📋 **Planned**: Not started yet

---

## Update Patterns

### 1. Starting a Task

```markdown
- [ ] **Week X-Y**: Task Name ⏳ IN PROGRESS
  - Started: YYYY-MM-DD
  - Approach: Brief description
  - Expected completion: YYYY-MM-DD
```

### 2. Completing a Task

```markdown
- [x] **Week X-Y**: Task Name ✅ COMPLETE - YYYY-MM-DD
  - Subtask 1 ✅
  - Subtask 2 ✅
  - Tests: X/Y passing (Z% coverage)
  - Files: list of modified files
```

### 3. Blocking a Task

```markdown
- [ ] **Week X-Y**: Task Name ⚠️ BLOCKED
  - Blocker: Description of issue
  - Impact: What's affected
  - Resolution plan: How to unblock
```

### 4. Progress Update

```markdown
- [ ] **Week X-Y**: Task Name ⏳ IN PROGRESS (N% complete)
  - Progress made:
    - ✅ Completed item 1
    - ✅ Completed item 2
    - ⏳ Working on item 3
  - Remaining: X items
  - Next steps: Brief plan
```

---

## Role-Based Sections

### For Tech Lead

- Update **Phase Deliverables** when completing phases
- Update **Progress Tracking** tables with metrics
- Update **Success Criteria** when goals change

### For Developer

- Update **Week tasks** with progress
- Update **Module Status** table
- Add **Technical Notes** for complex implementations

### For QA Engineer

- Update **Quality Metrics** table
- Add **Test Coverage** numbers
- Document **Known Issues**

---

## Progress Tracking Tables

### Feature Parity Milestones

```markdown
| Phase   | Target Date | Feature Parity | Status         |
| ------- | ----------- | -------------- | -------------- |
| Phase 1 | Month 3     | 50%            | ✅ Complete    |
| Phase 2 | Month 6     | 65%            | ⏳ In Progress |
```

### Module Status

```markdown
| Module     | Current | Target | Phase   | Status         |
| ---------- | ------- | ------ | ------- | -------------- |
| Accounting | 75%     | 80%    | Phase 1 | ⏳ In Progress |
```

### Quality Metrics

```markdown
| Metric             | Current | Target  | Status          |
| ------------------ | ------- | ------- | --------------- |
| Test Coverage      | 70%     | 80%+    | ⚠️ Below Target |
| API Response (p95) | 150ms   | < 200ms | ✅ On Target    |
```

---

## Best Practices

1. **Update Weekly**: Review and update ROADMAP every week
2. **Be Realistic**: Don't overcommit, use buffer weeks
3. **Track Metrics**: Include test counts, coverage, performance
4. **Document Blockers**: Always explain why tasks are blocked
5. **Celebrate Wins**: Mark completed tasks with ✅ and dates
6. **Link Documents**: Reference related docs (CHANGELOG, guides)
7. **Version Control**: Commit ROADMAP changes with descriptive messages

---

## Example Update

```markdown
### Phase 4: Polish & Scale (Months 10-12) → 80%+ Feature Parity

#### Month 10: Performance Optimization

- [x] **Week 39-41**: Database & API ✅ COMPLETE - 2026-03-07
  - Database indexes ✅ (47 indexes added)
  - Redis caching ✅ (cache interceptor implemented)
  - API rate limiting ✅ (throttler guard registered)
  - Performance testing ✅ (benchmark suite created)
  - Tests: 154/154 passing (100%)
  - Files: 14 services refactored

- [ ] **Week 42**: Monitoring & Logging ⏳ IN PROGRESS (60%)
  - APM ✅
  - Structured logging ✅
  - Dashboards ⏳ (in progress)
  - Alerts ⏳ (pending)
```

---

## When to Update

Update ROADMAP.md when:

- ✅ Starting a new week/task
- ✅ Completing a task or milestone
- ✅ Encountering blockers
- ✅ Changing priorities or timeline
- ✅ Completing a phase
- ✅ Before major commits

---

## Automation

Use the `git-commit-milestone.kiro.hook` to remind you to update ROADMAP when completing milestones.

---

**Remember**: ROADMAP is a living document. Update it frequently to reflect reality!
