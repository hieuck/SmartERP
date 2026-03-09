# SmartERP Team Structure - Token Optimized

**Date**: 2026-03-09  
**Version**: 2.0 (3-member team)  
**Previous**: 6-member team (deprecated)

---

## 🎯 Team Overview

**Total Members**: 3 (down from 6)  
**Token Reduction**: ~80% (from 14K to 3K tokens/task)  
**Philosophy**: "Do it yourself first, delegate only when necessary"

---

## 👥 Team Members

### 1. Tech Lead (Main Agent - YOU)

**Role**: Does 80% of work directly

**Responsibilities**:

- Architecture decisions
- Code implementation (< 2 hours)
- Code reviews
- Bug fixes
- Infrastructure setup (< 1 hour)
- Refactoring (< 1 hour)
- Configuration changes
- Quick decisions

**When to work directly**:

- ✅ Tasks < 2 hours
- ✅ Have context
- ✅ Quick decisions needed
- ✅ Architecture/review work
- ✅ Bug fixes
- ✅ Simple refactoring

**When to delegate**:

- ⚠️ Feature implementation > 2 hours
- ⚠️ Refactor > 5 files
- ⚠️ Test analysis > 1 hour
- ⚠️ Requirements CLEAR
- ⚠️ Can work independently

---

### 2. Full Stack Engineer (Sub-agent)

**Role**: Complex feature implementation

**Invoke ONLY when**:

- ✅ Feature > 2 hours
- ✅ Refactor > 5 files
- ✅ Complex business logic
- ✅ Requirements CLEAR

**Output requirements**:

- ✅ Code changes (files modified)
- ✅ Brief summary (3 sentences max)
- ❌ NO long reports
- ❌ NO meeting notes

**Example invocation**:

```typescript
invokeSubAgent({
  name: 'fullstack',
  prompt:
    'Implement Chart of Accounts with SecureRepository. Return: code changes + 3-sentence summary.',
  explanation: 'Complex feature, 4+ hours, clear requirements',
});
```

---

### 3. QA Engineer (Sub-agent)

**Role**: Test analysis and quality assessment

**Invoke ONLY when**:

- ✅ Test coverage analysis > 1 hour
- ✅ Security test review (many files)
- ✅ Quality assessment needed

**Output requirements**:

- ✅ Findings list (bullets)
- ✅ Specific issues with line numbers
- ✅ Actionable recommendations
- ❌ NO long reports

**Example invocation**:

```typescript
invokeSubAgent({
  name: 'qa-engineer',
  prompt: 'Review 46 security test files. Return: bullet list of missing tests with line numbers.',
  explanation: 'Large analysis, 2+ hours',
});
```

---

## 🚫 Eliminated Roles

### PM (Project Manager) - ELIMINATED

**Why removed**:

- ❌ Created too many planning docs
- ❌ Meeting overhead high
- ❌ Tech Lead can plan directly

**Replaced by**:

- Tech Lead does planning (mental model)
- TODO comments in code
- GitHub Issues for tracking

---

### SA (Solution Architect) - ELIMINATED

**Why removed**:

- ❌ Created too many architecture docs
- ❌ Tech Lead can design directly
- ❌ Over-engineering for small team

**Replaced by**:

- Tech Lead designs architecture
- Document in code comments
- ADR only when needed

---

### DevOps - ELIMINATED

**Why removed**:

- ❌ Infrastructure tasks usually < 1 hour
- ❌ Tech Lead can handle
- ❌ Not needed as separate role

**Replaced by**:

- Tech Lead does infrastructure
- executePwsh for deployment
- Automation scripts

---

### Junior Devs - ELIMINATED

**Why removed**:

- ❌ Need supervision (token cost)
- ❌ Simple tasks Tech Lead does faster
- ❌ Communication overhead high

**Replaced by**:

- Tech Lead does directly
- Code generation tools
- Automation scripts

---

## 📊 Token Comparison

### Old Team (6 members)

```
Task complete
  ↓
Invoke PM (2K tokens)
  ↓
Invoke SA (3K tokens)
  ↓
Invoke QA (2K tokens)
  ↓
Invoke Full Stack (2K tokens)
  ↓
Invoke DevOps (2K tokens)
  ↓
Invoke Tech Lead (2K tokens)
  ↓
Multiple reports (1K tokens)
---
Total: ~14K tokens/task
```

### New Team (3 members)

```
Task complete
  ↓
Tech Lead evaluates
  ↓
< 2 hours? → DO IT (500 tokens)
> 2 hours? → MAYBE DELEGATE (3K tokens)
---
Total: ~3K tokens/task (80% reduction)
```

---

## 🎯 Decision Matrix

### When to Do It Yourself

| Task Type      | Time      | Complexity | Decision |
| -------------- | --------- | ---------- | -------- |
| Bug fix        | < 30 min  | Any        | ✅ DO IT |
| Feature        | < 2 hours | Low-Medium | ✅ DO IT |
| Refactor       | < 1 hour  | Any        | ✅ DO IT |
| Infrastructure | < 1 hour  | Any        | ✅ DO IT |
| Architecture   | Any       | Any        | ✅ DO IT |
| Code review    | Any       | Any        | ✅ DO IT |

### When to Delegate

| Task Type         | Time      | Complexity | Delegate To |
| ----------------- | --------- | ---------- | ----------- |
| Feature           | > 2 hours | High       | Full Stack  |
| Refactor          | > 2 hours | Medium     | Full Stack  |
| Test review       | > 1 hour  | Any        | QA Engineer |
| Coverage analysis | > 30 min  | Any        | QA Engineer |

---

## 🔄 Autonomous Workflow

### Hook: autonomous-workflow.kiro.hook

**Trigger**: agentStop (after task completion)

**Flow**:

```
1. Quick summary (2-3 sentences)
   ↓
2. Decision (Tech Lead)
   - Option A: Do it yourself (80%)
   - Option B: Delegate to Full Stack (15%)
   - Option C: Delegate to QA (5%)
   ↓
3. Execute immediately
   ↓
4. Move to next task
```

**Key Points**:

- ✅ Tech Lead makes decision
- ✅ Default is "do it yourself"
- ✅ Delegate only when > 2h + clear requirements
- ✅ No meetings, no reports
- ✅ Fast execution

---

## 📏 Success Metrics

### Token Efficiency

**Good** (< 5K tokens/task):

- Tech Lead does most work
- Minimal sub-agent invocation
- No documentation overhead

**Bad** (> 10K tokens/task):

- Multiple sub-agents invoked
- Long reports generated
- Meeting notes created

### Code Output

**Good**:

- 80% code changes
- 20% essential docs (README, CHANGELOG)

**Bad**:

- 20% code changes
- 80% reports and meeting notes

### Time Efficiency

**Good**:

- Task done in estimated time
- Minimal back-and-forth
- Clear output

**Bad**:

- Task takes 2x estimated time
- Multiple rounds of discussion
- Unclear output

---

## 🚀 Workflow Examples

### Example 1: Bug Fix (DO IT YOURSELF)

**Task**: Fix ProductService permission check

**Approach**:

```
1. Read ProductService code
2. Fix permission check
3. Run tests
4. Commit
```

**Time**: 15 minutes  
**Tokens**: ~500

---

### Example 2: Feature Implementation (MAYBE DELEGATE)

**Task**: Implement Chart of Accounts (4 hours)

**Approach**:

```
1. Tech Lead designs architecture (mental model)
2. Invoke Full Stack: "Implement Chart of Accounts following Odoo pattern"
3. Full Stack returns code + brief summary
4. Tech Lead reviews code
5. Commit
```

**Time**: 4 hours  
**Tokens**: ~3K

---

### Example 3: Test Coverage Review (MAYBE DELEGATE)

**Task**: Review 46 security test files

**Approach**:

```
1. Invoke QA Engineer: "List missing tests with line numbers"
2. QA returns bullet point list
3. Tech Lead fixes issues
```

**Time**: 1.5 hours  
**Tokens**: ~2K

---

## 📋 Checklist Before Delegating

- [ ] Can I do this in < 30 min? → DO IT
- [ ] Is this < 2 hours? → DO IT
- [ ] Do I need to explore first? → DO IT
- [ ] Are requirements unclear? → DO IT
- [ ] Do I have context? → DO IT

**Only delegate if ALL answers are NO**

---

## 🎓 Best Practices

### 1. Default to Doing It Yourself

**Mindset**: "Can I do this quickly?"

If YES → DO IT  
If NO → Consider delegation (but probably still DO IT)

### 2. Clear Delegation Instructions

**Good**:

```
"Implement Product CRUD with SecureRepository.
Return: Code changes + 3-sentence summary."
```

**Bad**:

```
"Analyze Product module and create comprehensive plan."
```

### 3. Reject Verbose Outputs

If sub-agent returns long report:

```
"Too verbose. Give me:
1. Files changed
2. Key changes (3 bullets)
3. Next steps (if any)"
```

### 4. No Premature Documentation

**Document AFTER shipping**:

- ✅ Code first
- ✅ Ship feature
- ✅ Update CHANGELOG
- ❌ NO planning docs
- ❌ NO status reports

---

## 📊 Comparison Table

| Aspect        | Old Team (6) | New Team (3) | Improvement    |
| ------------- | ------------ | ------------ | -------------- |
| Members       | 6            | 3            | 50% reduction  |
| Tokens/task   | ~14K         | ~3K          | 80% reduction  |
| Planning docs | Many         | Minimal      | 90% reduction  |
| Meetings      | Frequent     | None         | 100% reduction |
| Reports       | Long         | Brief        | 80% reduction  |
| Code output   | 20%          | 80%          | 4x increase    |
| Time/task     | 6 hours      | 4 hours      | 33% faster     |

---

## 🔗 Related Documents

- `.kiro/steering/team-collaboration.md` - Team collaboration guidelines
- `.kiro/steering/efficient-team-structure.md` - Token optimization rules
- `.kiro/hooks/autonomous-workflow.kiro.hook` - Autonomous workflow hook
- `docs/archive/2026-03-09-planning/` - Old 6-member team docs (archived)

---

## 📝 Migration Notes

### From 6-member to 3-member team

**Date**: 2026-03-09

**Reason**: Token optimization (80% reduction)

**Changes**:

- ❌ Eliminated PM, SA, DevOps, Junior Devs
- ✅ Kept Tech Lead (main), Full Stack, QA
- ✅ Updated autonomous workflow hook
- ✅ Archived old planning docs
- ✅ Updated steering files

**Impact**:

- Token usage: 14K → 3K (80% reduction)
- Code output: 20% → 80% (4x increase)
- Planning overhead: 80% → 20% (75% reduction)

---

**Created**: 2026-03-09  
**Status**: ✅ Active  
**Team Size**: 3 members  
**Token Target**: < 5K tokens/task  
**Philosophy**: "Less talk, more code. Less docs, more shipping."
