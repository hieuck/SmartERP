---
inclusion: auto
---

# Team Collaboration Guidelines

## 🎯 Overview

SmartERP development team có 7 thành viên chính (tỷ lệ vàng):

- **Tech Lead** - Quyết định kiến trúc, review code, phê duyệt approach
- **Senior Dev #1** - Phân tích kỹ thuật, đề xuất giải pháp, challenge decisions
- **Senior Dev #2** - Parallel architecture review, refactoring specialist
- **Mid-Level Dev** - Feature implementation, service refactoring, moderate tasks
- **Junior Dev** - Thực thi nhanh các task đã định nghĩa rõ ràng
- **QA Engineer** - Đảm bảo chất lượng, review tests, identify gaps
- **DevOps Engineer** - Infrastructure, deployment, monitoring, CI/CD

## 🤝 When to Use Each Agent

### Use Tech Lead When:

- ✅ Need architectural decisions
- ✅ Need code review and approval
- ✅ Resolving technical conflicts
- ✅ Making final decisions on approach
- ✅ Setting technical direction

**Example:**

```
"Tech Lead, should we use SecureRepository or raw TypeORM for this service?"
"Tech Lead, review this refactoring approach and approve if correct"
```

### Use Senior Dev #1 or #2 When:

- ✅ Need technical analysis of complex problems
- ✅ Need alternative solution proposals
- ✅ Need architecture review and challenges
- ✅ Planning refactoring strategies
- ✅ Identifying technical debt
- ✅ **Parallel work** - assign different modules to each

**Example:**

```
"Senior Dev #1, analyze E-Commerce refactoring strategy"
"Senior Dev #2, analyze Platform services refactoring in parallel"
```

### Use QA Engineer When:

- ✅ Need test coverage analysis
- ✅ Need quality assessment
- ✅ Identifying testing gaps
- ✅ Reviewing test strategies
- ✅ Security and edge case analysis

**Example:**

```
"QA Engineer, review test coverage for this module"
"QA Engineer, what edge cases are we missing?"
```

### Use Junior Dev When:

- ✅ Fix compilation errors (type issues, imports)
- ✅ Implement CRUD operations with SecureRepository
- ✅ Update test files following established patterns
- ✅ Add missing imports across multiple files
- ✅ Repetitive coding tasks
- ✅ Well-defined implementation tasks

**Example:**

```
"Junior Dev, fix 15 compilation errors in test files (parameter order)"
"Junior Dev, implement CRUD for Product entity using SecureRepository"
"Junior Dev, update 10 test files to use new mock pattern"
```

## 🚫 When NOT to Use Agents

### Don't Use Agents For:

- ❌ Simple file reads (use readFile directly)
- ❌ Quick grep searches (use grepSearch directly)
- ❌ Single file edits (use editCode/strReplace directly)
- ❌ Running tests (use executePwsh directly)
- ❌ Tasks you can complete in < 5 minutes

### Use Agents For:

- ✅ Complex analysis requiring expertise
- ✅ Tasks requiring multiple steps
- ✅ Decisions requiring domain knowledge
- ✅ Parallel work streams
- ✅ Tasks requiring specialized skills

## 📋 Task Delegation Strategy

### Simple Tasks (< 1 hour)

**Delegate to Junior Dev:**

- Fix compilation errors
- Update test mocks
- Add imports
- Implement CRUD
- Follow established patterns

**Example:**

```typescript
invokeSubAgent({
  name: 'junior-dev',
  prompt: 'Fix 10 parameter order errors in test files',
  explanation: 'Junior Dev can handle this quickly',
});
```

### Complex Tasks (1-4 hours)

**Break into subtasks:**

1. Senior Dev analyzes and proposes approach
2. Tech Lead reviews and approves
3. Junior Dev executes simple parts
4. You handle complex parts

**Example:**

```typescript
// Step 1: Analysis
invokeSubAgent({
  name: 'senior-dev',
  prompt: 'Analyze refactoring strategy for 12 Platform services',
});

// Step 2: Approval
invokeSubAgent({
  name: 'tech-lead',
  prompt: "Review Senior Dev's proposal and approve approach",
});

// Step 3: Execution (parallel)
invokeSubAgent({
  name: 'junior-dev',
  prompt: 'Fix compilation errors in 6 service files',
});
// You handle complex refactoring
```

### Very Complex Tasks (> 4 hours)

**Use full team workflow:**

1. Senior Dev: Technical analysis
2. QA Engineer: Quality review
3. Junior Dev: Readiness assessment
4. Tech Lead: Final decision
5. Execute with delegation

## 🔄 Autonomous Workflow

The autonomous workflow hook automatically invokes all 4 team members after each task completion:

**Trigger:** `agentStop` (after any task completes)

**Flow:**

```
Task Complete
    ↓
📋 Session Summary (you provide)
    ↓
🏢 Team Meeting (automatic)
    ├─ Senior Dev: Technical analysis
    ├─ QA Engineer: Quality review
    ├─ Junior Dev: Execution readiness
    └─ Tech Lead: Final decision + task assignment
    ↓
⚡ Execute Decision (you execute)
    ├─ Simple task → Delegate to Junior Dev
    ├─ Complex task → You handle with Junior Dev support
    └─ Research task → Research first, then execute
```

**Hook Location:** `.kiro/hooks/autonomous-workflow.kiro.hook`

## 💡 Best Practices

### 1. Clear Task Definitions

**Good:**

```
"Junior Dev, fix parameter order in these 5 files:
- user.service.spec.ts: Line 45, 67, 89
- product.service.spec.ts: Line 23, 56
Expected: (user, entityType, data)
Current: (entityType, tenantId, data)"
```

**Bad:**

```
"Junior Dev, fix some errors in test files"
```

### 2. Appropriate Delegation

**Good:**

```
// Simple, repetitive → Junior Dev
invokeSubAgent({
  name: "junior-dev",
  prompt: "Add missing @CurrentUser imports to 10 controller files"
})

// Complex, architectural → Senior Dev
invokeSubAgent({
  name: "senior-dev",
  prompt: "Design refactoring strategy for Platform services"
})
```

**Bad:**

```
// Architectural decision → Junior Dev (WRONG!)
invokeSubAgent({
  name: "junior-dev",
  prompt: "Decide if we should use SecureRepository or raw TypeORM"
})
```

### 3. Parallel Execution

When tasks are independent, delegate in parallel:

```typescript
// Both can run simultaneously
Promise.all([
  invokeSubAgent({
    name: 'junior-dev',
    prompt: 'Fix compilation errors in test files',
  }),
  invokeSubAgent({
    name: 'senior-dev',
    prompt: 'Analyze refactoring strategy',
  }),
]);
```

### 4. Progress Tracking

Junior Dev reports progress every 4-5 turns:

```
Turn 1-4: Working on task
Turn 5: "Đã fix 5/10 errors, đang xử lý missing imports"
Turn 6-9: Continue working
Turn 10: "Hoàn thành 10/10 errors, all tests compile"
```

## 🎓 Team Dynamics

### Tech Lead (Authority)

- Makes final decisions
- Approves approaches
- Resolves conflicts
- Sets direction

### Senior Dev (Advisor)

- Proposes solutions
- Challenges decisions constructively
- Provides technical depth
- Identifies risks

### QA Engineer (Quality Gate)

- Ensures quality standards
- Identifies gaps
- Reviews test coverage
- Security focus

### Junior Dev (Executor)

- Fast execution
- Follows patterns
- Asks when blocked
- Reports progress

### You (Coordinator)

- Orchestrate team
- Execute complex tasks
- Document progress
- Integrate work

## 📊 Success Metrics

### Junior Dev Performance

- ✅ Task completion speed (< 30 min for simple tasks)
- ✅ Code quality (passes linting + tests)
- ✅ Pattern consistency (100% adherence)
- ✅ Low rework rate (< 10%)

### Team Collaboration

- ✅ Clear task delegation
- ✅ Minimal back-and-forth
- ✅ Fast decision making
- ✅ High velocity

### Overall Velocity

- ✅ More tasks completed per day
- ✅ Faster compilation error fixes
- ✅ Quicker CRUD implementations
- ✅ Better code quality

## 🚀 Quick Reference

| Task Type              | Delegate To | Time Estimate |
| ---------------------- | ----------- | ------------- |
| Fix compilation errors | Junior Dev  | 15-30 min     |
| Implement CRUD         | Junior Dev  | 30-60 min     |
| Update test mocks      | Junior Dev  | 20-40 min     |
| Add imports            | Junior Dev  | 10-20 min     |
| Refactor service       | Senior Dev  | 1-2 hours     |
| Architecture decision  | Tech Lead   | 30-60 min     |
| Test strategy          | QA Engineer | 30-60 min     |
| Complex integration    | You         | 2-4 hours     |

---

**Last Updated:** 2026-03-09  
**Team Size:** 4 members (Tech Lead, Senior Dev, QA Engineer, Junior Dev)  
**Status:** ✅ Active

### Use Mid-Level Dev When:

- ✅ Implement features following established patterns
- ✅ Refactor services to SecureRepository
- ✅ Create CRUD operations with security
- ✅ Write comprehensive tests
- ✅ Moderate complexity tasks (2-4 hours)

**Example:**

```
"Mid-Level Dev, implement Product CRUD with SecureRepository"
"Mid-Level Dev, refactor Order service to use proper security"
```

### Use DevOps Engineer When:

- ✅ Deployment issues or automation
- ✅ Infrastructure setup or optimization
- ✅ CI/CD pipeline configuration
- ✅ Monitoring and alerting setup
- ✅ Performance tuning and scaling
- ✅ Database operations and backups

**Example:**

```
"DevOps, deploy latest changes to staging"
"DevOps, investigate high memory usage in production"
"DevOps, set up monitoring for new service"
```
