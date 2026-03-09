# Agent Teams for SmartERP

## 📚 Overview

Agent Teams cho phép coordinate nhiều AI instances làm việc song song với shared task list và inter-agent messaging. Khác với subagents (đã loại bỏ), Agent Teams có:

- ✅ **Shared Task List** - Tất cả teammates nhìn thấy và claim tasks
- ✅ **Direct Communication** - Teammates message nhau trực tiếp
- ✅ **Independent Context** - Mỗi teammate có context window riêng
- ✅ **Self-Coordination** - Teammates tự claim tasks, không cần micromanage

## 🎯 Khi Nào Dùng Agent Teams?

### ✅ Dùng Agent Teams Khi:

1. **Cross-Layer Features** - Backend + Frontend + Tests cùng lúc
2. **Parallel Research** - Investigate nhiều hypotheses đồng thời
3. **Comprehensive Reviews** - Security + Performance + Architecture review
4. **Independent Modules** - Mỗi teammate owns riêng file set

### ❌ KHÔNG Dùng Agent Teams Khi:

1. **Sequential Tasks** - Tasks phụ thuộc nhau
2. **Same-File Edits** - Nhiều người sửa cùng file
3. **Simple Tasks** - Solo development nhanh hơn
4. **Heavy Dependencies** - Tasks blocking nhau nhiều

## 📊 Decision Tree

```
Task arrives
    ↓
Can work be parallelized?
    ├─ NO → Solo development (500 tokens)
    └─ YES → Do teammates need to communicate?
        ├─ NO → Consider solo (simpler)
        └─ YES → Agent Teams (higher tokens but valuable)
```

## 🏗️ SmartERP Team Structures

### Team 1: Full-Stack Feature Development

**Use case:** Implement complete feature với backend + frontend + tests

**Structure:**

```
Team Lead (Coordinator)
    ↓
Shared Task List
    ↓
├─→ Backend Teammate
│   - Owns: entities, services, controllers
│   - Focus: SecureRepository, tenant isolation, RBAC
│   - Files: src/backend/src/**/*.{entity,service,controller}.ts
│
├─→ Frontend Teammate
│   - Owns: components, composables, routes
│   - Focus: UI/UX, state management, API integration
│   - Files: src/frontend/src/**/*.{vue,ts}
│
└─→ Test Teammate
    - Owns: all test files
    - Focus: Unit tests, integration tests, E2E tests
    - Files: **/*.spec.ts, **/*.test.ts
```

**Communication Pattern:**

- Backend broadcasts API contract → Frontend builds against it
- Test teammate requests edge cases from both
- Lead synthesizes and ensures consistency

**Example Prompt:**

```
Create an agent team to implement Order Management feature:

- Backend teammate: Order entity, OrderService with SecureRepository,
  OrderController with RBAC, proper tenant isolation

- Frontend teammate: Order list/detail/form components, composables
  for state management, route registration

- Test teammate: Unit tests for service/controller, integration tests
  for API endpoints, E2E tests for user workflows

Require plan approval before implementation.
Each teammate must follow SmartERP architecture patterns.
```

---

### Team 2: Adversarial Debugging

**Use case:** Bug spans multiple layers, investigate competing theories

**Structure:**

```
Team Lead (Coordinator)
    ↓
Shared Task List
    ↓
├─→ Backend Investigator
│   - Theory: API/Database issue
│   - Check: Queries, caching, data transformation
│
├─→ Frontend Investigator
│   - Theory: UI/State management issue
│   - Check: Reactivity, composables, component lifecycle
│
├─→ Infrastructure Investigator
│   - Theory: Network/Deployment issue
│   - Check: CORS, proxies, environment configs
│
└─→ Security Investigator
    - Theory: Permission/Tenant isolation issue
    - Check: RBAC, tenant context, audit trail
```

**Communication Pattern:**

- Each investigator challenges others' findings
- Debate structure to find root cause
- Theory that survives scrutiny wins

**Example Prompt:**

```
Users report stale data in Order list after updates.

Create debugging team with 4 investigators:
- Backend: Check cache invalidation, query optimization, data transformation
- Frontend: Check Vue reactivity, composable state, component updates
- Infrastructure: Check API responses, network timing, environment configs
- Security: Check tenant isolation, permission context, audit trail

Have them challenge each other's findings.
The theory that survives adversarial scrutiny is the root cause.
```

---

### Team 3: Comprehensive Code Review

**Use case:** Review PR từ nhiều góc độ chuyên môn

**Structure:**

```
Team Lead (Synthesizer)
    ↓
Shared Task List
    ↓
├─→ Architecture Reviewer
│   - Focus: SecureRepository compliance, tenant isolation
│   - Check: Pattern adherence, SOLID principles
│
├─→ Security Reviewer
│   - Focus: RBAC, input validation, SQL injection
│   - Check: Permission checks, audit trail, sensitive data
│
├─→ Performance Reviewer
│   - Focus: N+1 queries, caching, indexing
│   - Check: Database queries, API response time
│
└─→ Test Reviewer
    - Focus: Test coverage, edge cases, mocking
    - Check: Unit/integration tests, test quality
```

**Communication Pattern:**

- Each reviewer reports findings independently
- Lead synthesizes across all dimensions
- Prioritizes issues by severity

**Example Prompt:**

```
Review PR #123: Authentication Refactor

Create review team with 4 specialized reviewers:
- Architecture: Check SecureRepository usage, tenant isolation, SOLID
- Security: Check RBAC implementation, input validation, token handling
- Performance: Check for N+1 queries, missing indexes, caching strategy
- Test: Check test coverage, edge cases, proper mocking

Each reviewer reports findings independently.
Lead synthesizes and prioritizes by severity.
```

---

### Team 4: Parallel Research

**Use case:** Research multiple approaches trước khi implement

**Structure:**

```
Team Lead (Decision Maker)
    ↓
Shared Task List
    ↓
├─→ Researcher 1: Approach A
├─→ Researcher 2: Approach B
├─→ Researcher 3: Approach C
└─→ Researcher 4: Approach D
```

**Communication Pattern:**

- Each researcher investigates one approach
- Share findings and trade-offs
- Lead makes informed decision

**Example Prompt:**

```
Research best approach for real-time notifications in SmartERP.

Create research team with 4 researchers:
- Researcher 1: WebSocket with Socket.io (pros/cons, implementation)
- Researcher 2: Server-Sent Events (SSE) (pros/cons, implementation)
- Researcher 3: Polling with optimizations (pros/cons, implementation)
- Researcher 4: Third-party services (Pusher, Ably) (pros/cons, cost)

Each researcher provides:
- Technical feasibility
- Performance implications
- Cost analysis
- Integration complexity
- Recommendation

Lead synthesizes and recommends best approach.
```

---

## 🎓 Best Practices for SmartERP

### 1. Task Sizing

**Good task size:**

```
✅ "Implement Order entity with SecureRepository"
✅ "Create OrderService with CRUD operations"
✅ "Add unit tests for OrderService"
```

**Bad task size:**

```
❌ "Add validation" (too vague)
❌ "Implement entire Order Management module" (too large)
❌ "Fix typo in comment" (too small)
```

**Rule:** Aim for 5-6 tasks per teammate

### 2. File Ownership

**Clear boundaries prevent conflicts:**

```typescript
// Backend Teammate owns:
src/backend/src/modules/orders/
├── entities/order.entity.ts
├── services/order.service.ts
├── controllers/order.controller.ts
└── dto/

// Frontend Teammate owns:
src/frontend/src/modules/orders/
├── components/
├── composables/
└── routes/

// Test Teammate owns:
**/*.spec.ts
**/*.test.ts
```

**Rule:** No two teammates edit same file

### 3. Rich Context in Spawn Prompts

**Good spawn prompt:**

```
Backend teammate: Implement Order Management

Context:
- Use SecureRepository pattern (see .kiro/steering/multi-tenant-architecture-patterns.md)
- Apply RBAC with PermissionService
- Add audit trail for all mutations
- Follow NestJS conventions
- Entity: Order with fields: id, orderNumber, customerId, items, status, total
- Service: CRUD with tenant isolation
- Controller: REST endpoints with permission guards

Files to create:
- src/backend/src/modules/orders/entities/order.entity.ts
- src/backend/src/modules/orders/services/order.service.ts
- src/backend/src/modules/orders/controllers/order.controller.ts
```

**Bad spawn prompt:**

```
❌ "Create order module"
```

**Rule:** Teammates don't inherit lead's context - be explicit!

### 4. Plan Approval for Risky Changes

```
Spawn backend teammate to refactor authentication.

Require plan approval before implementation.
Only approve plans that:
- Include rollback strategy
- Have comprehensive test coverage
- Maintain backward compatibility
- Document breaking changes
```

### 5. SmartERP-Specific Guidelines

**Always include in spawn prompts:**

```
All teammates must follow SmartERP architecture:
1. Use SecureRepository for all database operations
2. Inject PermissionService for RBAC checks
3. Add audit trail for mutations
4. Ensure tenant isolation
5. Write tests with proper mocking
6. Follow patterns in .kiro/steering/multi-tenant-architecture-patterns.md

Autonomous hooks will verify compliance automatically.
```

---

## 🚀 Example Workflows

### Workflow 1: New Feature Development

```bash
# User prompt:
"Implement Product Management module với full CRUD, multi-tenant, RBAC, tests"

# AI creates team:
Team Lead spawns 3 teammates:
1. Backend: Entity + Service + Controller
2. Frontend: Components + Composables + Routes
3. Test: Unit + Integration + E2E tests

# Task list:
- [ ] Design Product entity schema (Backend)
- [ ] Implement ProductService with SecureRepository (Backend)
- [ ] Create ProductController with RBAC (Backend)
- [ ] Build Product list component (Frontend)
- [ ] Build Product form component (Frontend)
- [ ] Add route registration (Frontend)
- [ ] Write service unit tests (Test)
- [ ] Write controller integration tests (Test)
- [ ] Write E2E user workflows (Test)

# Communication:
Backend → Broadcast API contract
Frontend → Build against contract
Test → Request edge cases
Lead → Synthesize and verify

# Hooks auto-verify:
- architecture-checkpoint: Check compliance before write
- production-ready-reminder: Verify after write
- release-readiness-check: Final check before commit
```

### Workflow 2: Bug Investigation

```bash
# User prompt:
"Orders không update real-time, investigate all possible causes"

# AI creates debugging team:
Team Lead spawns 4 investigators:
1. Backend: Cache + Database + API
2. Frontend: Reactivity + State + Components
3. Infrastructure: Network + CORS + Proxy
4. Security: Tenant context + Permissions

# Each investigator:
- Investigates their theory
- Challenges others' findings
- Provides evidence

# Lead synthesizes:
- Evaluates all theories
- Identifies root cause
- Recommends fix
```

### Workflow 3: Architecture Review

```bash
# User prompt:
"Review authentication refactor PR #123"

# AI creates review team:
Team Lead spawns 4 reviewers:
1. Architecture: Patterns + SOLID + Structure
2. Security: RBAC + Validation + Tokens
3. Performance: Queries + Caching + Indexes
4. Test: Coverage + Edge cases + Mocking

# Each reviewer:
- Reviews from their perspective
- Reports findings independently
- Rates severity (Critical/High/Medium/Low)

# Lead synthesizes:
- Combines all findings
- Prioritizes by severity
- Provides actionable feedback
```

---

## 📊 Token Cost Considerations

### Cost Comparison

| Approach    | Token Cost | Speed   | Best For              |
| ----------- | ---------- | ------- | --------------------- |
| Solo        | ~500       | Fastest | Most tasks            |
| Agent Teams | ~3K-10K    | Slower  | Complex parallel work |

### When Teams Are Worth It

**High value scenarios:**

- ✅ Cross-layer features (save context switching)
- ✅ Parallel research (faster decision making)
- ✅ Comprehensive reviews (better quality)
- ✅ Adversarial debugging (find root cause faster)

**Low value scenarios:**

- ❌ Sequential tasks (no parallelization benefit)
- ❌ Same-file edits (conflict overhead)
- ❌ Simple CRUD (solo is faster)

---

## 🎯 Integration với SmartERP Ecosystem

### Agent Teams + Steering Files

```
Teammates automatically load:
- multi-tenant-architecture-patterns.md (architecture guidance)
- CLAUDE.md (project context)
- Skills (via discloseContext)

Lead includes in spawn prompts:
- Specific steering files needed
- Architecture requirements
- Testing expectations
```

### Agent Teams + Hooks

```
Hooks work với Agent Teams:
- architecture-checkpoint: Verifies each teammate's writes
- production-ready-reminder: Checks after each tool use
- release-readiness-check: Final verification by lead

Each teammate's work is automatically verified!
```

### Agent Teams + Skills

```
Lead can activate skills for teammates:
- secure-repository-pattern: For backend teammate
- backend-testing-patterns: For test teammate
- api-design-patterns: For API design discussions
```

---

## 🔧 Configuration

### Enable Agent Teams (Experimental)

Add to `.kiro/settings/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"
}
```

Or set environment variable:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Display Modes

**In-process mode** (recommended):

- All teammates in one terminal
- Navigate with Shift+Up/Down
- Works everywhere

**Split-pane mode** (requires tmux):

- Each teammate in own pane
- See all output simultaneously
- Better for monitoring

---

## 📝 Templates

### Template 1: Full-Stack Feature

```
Create agent team for {FEATURE_NAME}:

Backend teammate:
- Entity: {entity_fields}
- Service: CRUD with SecureRepository, tenant isolation, RBAC
- Controller: REST endpoints with permission guards
- Files: src/backend/src/modules/{module}/**/*.ts

Frontend teammate:
- Components: List, Detail, Form
- Composables: State management, API calls
- Routes: Registration and guards
- Files: src/frontend/src/modules/{module}/**/*.{vue,ts}

Test teammate:
- Unit tests: Service and controller logic
- Integration tests: API endpoints
- E2E tests: User workflows
- Files: **/*.spec.ts

All teammates follow SmartERP architecture patterns.
Require plan approval before implementation.
```

### Template 2: Bug Investigation

```
Investigate {BUG_DESCRIPTION}:

Spawn 4 investigators:
- Backend: {backend_theory}
- Frontend: {frontend_theory}
- Infrastructure: {infra_theory}
- Security: {security_theory}

Each investigator:
1. Investigate their theory
2. Gather evidence
3. Challenge others' findings
4. Provide recommendation

Lead synthesizes and identifies root cause.
```

### Template 3: Code Review

```
Review PR #{PR_NUMBER}: {PR_TITLE}

Spawn 4 reviewers:
- Architecture: SecureRepository, tenant isolation, SOLID
- Security: RBAC, validation, sensitive data
- Performance: Queries, caching, indexes
- Test: Coverage, edge cases, mocking

Each reviewer reports findings with severity.
Lead synthesizes and prioritizes.
```

---

## ⚠️ Limitations

1. **No session resumption** - In-process teammates not restored on /resume
2. **Task status lag** - Teammates may not mark tasks complete
3. **One team per session** - Clean up before starting new team
4. **Token scaling** - Cost increases with team size
5. **Shutdown delay** - Teammates finish current work before stopping

---

## 🎓 Learning Path

**Week 1: Start Simple**

- Use Agent Teams for code reviews only
- 2-3 reviewers max
- Learn communication patterns

**Week 2: Parallel Research**

- Research tasks with 3-4 researchers
- Practice synthesizing findings
- Understand coordination overhead

**Week 3: Feature Development**

- Small features with 2 teammates
- Backend + Frontend or Backend + Tests
- Learn file ownership patterns

**Week 4: Complex Features**

- Full-stack features with 3 teammates
- Backend + Frontend + Tests
- Master task dependencies

---

## 📚 Resources

- [Official Agent Teams Docs](https://docs.anthropic.com/en/docs/build-with-claude/agent-teams)
- [Visual Guide](https://deeps.dev/explorations/agent-teams-explainer.html)
- [Practical Examples](https://richardporter.dev/blog/claude-code-agent-teams-parallel-development)
- SmartERP Steering: `.kiro/steering/multi-tenant-architecture-patterns.md`
- SmartERP Skills: `.kiro/skills/README.md`

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-09  
**Status:** ✅ Active (Experimental Feature)  
**Recommended For:** Complex parallel work only
