---
name: team-collaboration
description: Guidelines for agent collaboration and team structure in SmartERP development. Use when coordinating between Tech Lead, Senior Dev, and QA Engineer, or when deciding whether to use skills vs invoke agents.
---

# Team Collaboration

## Team Structure

**Current Agents:**

- **Tech Lead**: Final architectural decisions, team coordination
- **Senior Dev**: Code review, architecture proposals, challenges
- **QA Engineer**: Testing strategy, quality assurance

**Specialized Skills:**

Core Skills:

- `frontend-react-patterns` - React + Vite + Ant Design
- `mobile-react-native-patterns` - React Native + Expo
- `devops-deployment-patterns` - Docker + K8s + CI/CD
- `backend-testing-patterns` - Unit, Integration, E2E tests
- `security-authentication-patterns` - JWT, RBAC, OWASP
- `database-typeorm-patterns` - Migrations, optimization
- `api-design-patterns` - RESTful, pagination, error handling
- `performance-optimization-patterns` - N+1 detection, caching
- `code-quality-standards` - ESLint, Prettier, review checklist
- `error-handling-patterns` - Exception handling, logging
- `workflow-state-machine-patterns` - State transitions, approvals
- `documentation-standards` - Code comments, API docs

Advanced Testing Skills:

- `visual-regression-testing` - Playwright + Percy for UI testing
- `mutation-testing-patterns` - Stryker for test quality verification
- `contract-testing-patterns` - Pact for API compatibility
- `chaos-engineering-patterns` - Circuit breaker, retry, resilience

## When to Use Skills vs Agents

**Use Skills for:** Patterns, best practices, quick reference

**Invoke Agents for:** Architecture decisions, code reviews, test strategy

## Escalation Matrix

### Level 1: Self-Resolution

- Documentation updates
- Minor bug fixes
- Code formatting

### Level 2: Peer Review (1 agent)

- New features → Senior Dev
- Test issues → QA Engineer
- Performance → Senior Dev

### Level 3: Team Discussion (2+ agents)

- Architecture changes → Senior Dev + QA
- Security → Senior Dev + QA
- Breaking changes → Full team

### Level 4: Tech Lead Decision

- Conflicting opinions
- Major architecture
- Tech stack changes
- Timeline vs quality

## Decision Authority

| Decision     | Authority       | Escalation  |
| ------------ | --------------- | ----------- |
| Code style   | Senior Dev      | → Tech Lead |
| Tests        | QA Engineer     | → Tech Lead |
| Architecture | Tech Lead       | Final       |
| Security     | Senior Dev + QA | → Tech Lead |

## Collaboration Workflow

1. **Architecture:** Tech Lead proposes → Senior Dev challenges → QA verifies → Tech Lead decides
2. **Code Review:** Senior Dev reviews → QA checks tests → Tech Lead approves
3. **Testing:** QA proposes → Senior Dev reviews → Tech Lead approves
