# Skills Library

Comprehensive collection of development patterns, best practices, and guides for SmartERP.

---

## 📚 What are Skills?

Skills are specialized knowledge modules that provide:

- ✅ Detailed implementation guides
- ✅ Code examples and patterns
- ✅ Best practices and anti-patterns
- ✅ Testing strategies
- ✅ Troubleshooting tips

---

## 🎯 How to Use Skills

### Activate a Skill

Use the `discloseContext` tool to load a skill:

```typescript
discloseContext({ name: 'secure-repository-pattern' });
```

### When to Activate

Activate skills when:

- Starting a new feature implementation
- Encountering a specific problem
- Need guidance on best practices
- Writing tests for a pattern
- Debugging architecture issues

---

## 📖 Available Skills (22)

### 🏗️ Architecture & Core Patterns (6 skills)

#### 1. **secure-repository-pattern** ⭐ CORE

Multi-tenant security and audit trail pattern. Use for ALL service implementations.

**When to use:**

- Implementing any service with database access
- Need tenant isolation
- Need permission checks
- Need audit trail

**Key topics:** Constructor setup, CRUD operations, caching, testing

---

#### 2. **api-design-patterns**

RESTful API design including pagination, filtering, error handling, versioning.

**When to use:**

- Designing new API endpoints
- Implementing controllers
- Standardizing API responses

**Key topics:** REST conventions, pagination, filtering, versioning, error responses

---

#### 3. **database-typeorm-patterns**

Database design and TypeORM patterns including migrations, query optimization, indexing.

**When to use:**

- Designing entities
- Writing migrations
- Optimizing database queries
- Creating indexes

**Key topics:** Entity design, migrations, relationships, query optimization, indexing

---

#### 4. **workflow-state-machine-patterns**

Workflow and state machine patterns for managing complex business processes.

**When to use:**

- Implementing approval workflows
- Managing order status transitions
- Building multi-step processes

**Key topics:** State machines, approval flows, status transitions, validation

---

#### 5. **error-handling-patterns**

Error handling and logging patterns for consistent error management.

**When to use:**

- Implementing error handling
- Setting up logging
- Debugging issues

**Key topics:** Exception hierarchy, error codes, logging levels, error responses

---

#### 6. **accessibility-testing-patterns**

Accessibility testing with axe-core for WCAG 2.1 AA compliance.

**When to use:**

- Testing email templates
- Testing PDF generation
- Testing API responses for screen readers

**Key topics:** axe-core, WCAG compliance, screen reader testing

---

### 🧪 Testing Patterns (8 skills)

#### 7. **backend-testing-patterns** ⭐ ESSENTIAL

Comprehensive testing patterns for NestJS backend including unit, integration, E2E tests.

**When to use:**

- Writing tests for services
- Writing tests for controllers
- Testing complex business logic
- Testing with SecureRepository

**Key topics:** Test pyramid, unit tests, integration tests, E2E tests, security testing

---

#### 8. **fixing-test-mocking-issues** ⭐ TROUBLESHOOTING

Fix common test failures caused by mocking raw TypeORM instead of SecureRepository.

**When to use:**

- Tests failing with "undefined" errors
- Tests expecting update/delete to be called
- Migrating tests to SecureRepository

**Key topics:** Mock SecureRepository, test patterns, common pitfalls

---

#### 9. **test-utilities-patterns**

Test utilities including factories, fixtures, builders, and mocks.

**When to use:**

- Writing tests
- Reducing test boilerplate
- Creating test data

**Key topics:** Factories, fixtures, builders, mocks, test helpers

---

#### 10. **contract-testing-patterns**

Contract testing với Pact để đảm bảo API compatibility giữa frontend và backend.

**When to use:**

- Testing API contracts
- Preventing breaking changes
- Integration testing

**Key topics:** Pact, consumer-driven contracts, API compatibility

---

#### 11. **property-based-testing-patterns**

Property-based testing với fast-check để tự động discover edge cases.

**When to use:**

- Testing business logic
- Testing calculations
- Testing invariants

**Key topics:** fast-check, property testing, edge cases, invariants

---

#### 12. **mutation-testing-patterns**

Mutation testing để đánh giá chất lượng test suite thực sự.

**When to use:**

- Verifying test quality
- Finding weak tests
- Improving test coverage

**Key topics:** Stryker, mutation testing, test quality metrics

---

#### 13. **load-testing-patterns**

Load testing với k6 và Artillery để verify system performance.

**When to use:**

- Testing scalability
- Identifying bottlenecks
- Ensuring SLA compliance

**Key topics:** k6, Artillery, load testing, performance metrics

---

#### 14. **visual-regression-testing**

Visual regression testing với Playwright và Percy để catch UI bugs.

**When to use:**

- Testing UI changes
- Detecting CSS regressions
- Catching layout shifts

**Key topics:** Playwright, Percy, visual testing, screenshot comparison

---

### 🎨 Frontend & Mobile (2 skills)

#### 15. **frontend-react-patterns**

Best practices for React + Vite + Ant Design + React Query development.

**When to use:**

- Building React components
- Implementing forms
- Data fetching
- Writing frontend tests

**Key topics:** React hooks, Ant Design, React Query, form handling, testing

---

#### 16. **mobile-react-native-patterns**

Best practices for React Native + Expo development.

**When to use:**

- Building mobile components
- Implementing navigation
- Offline-first architecture
- Mobile testing

**Key topics:** React Native, Expo, navigation, offline sync, mobile testing

---

### 🔒 Security & Authentication (1 skill)

#### 17. **security-authentication-patterns**

Security and authentication patterns including JWT, RBAC, OWASP best practices.

**When to use:**

- Implementing authentication
- Implementing authorization
- Security features

**Key topics:** JWT, RBAC, OWASP, multi-tenant security, password hashing

---

### ⚡ Performance & Optimization (1 skill)

#### 18. **performance-optimization-patterns**

Performance optimization including N+1 detection, caching, profiling, monitoring.

**When to use:**

- Optimizing slow endpoints
- Reducing database load
- Improving response times

**Key topics:** N+1 queries, caching strategies, profiling, monitoring

---

### 🚀 DevOps & Infrastructure (2 skills)

#### 19. **devops-deployment-patterns**

Best practices for Docker, Kubernetes, CI/CD, and monitoring.

**When to use:**

- Containerization
- Orchestration
- Deployment pipelines
- Infrastructure monitoring

**Key topics:** Docker, Kubernetes, CI/CD, monitoring, logging

---

#### 20. **chaos-engineering-patterns**

Chaos engineering patterns for building resilient systems.

**When to use:**

- Implementing fault tolerance
- Building resilient systems
- Testing system resilience

**Key topics:** Circuit breakers, retry logic, timeout handling, graceful degradation

---

### 📝 Documentation & Quality (2 skills)

#### 21. **documentation-standards**

Documentation standards for code comments, API docs, technical documentation.

**When to use:**

- Writing documentation
- API specifications
- Code comments

**Key topics:** JSDoc, OpenAPI, Swagger, README standards

---

#### 22. **code-quality-standards**

Code quality standards including ESLint rules, Prettier config, code review checklist.

**When to use:**

- Setting up linting
- Reviewing code
- Establishing coding standards

**Key topics:** ESLint, Prettier, code review, best practices

---

## 🎓 Skill Combinations

### For New Service Implementation

1. `secure-repository-pattern` - Core pattern
2. `backend-testing-patterns` - Write tests
3. `api-design-patterns` - Design endpoints
4. `error-handling-patterns` - Handle errors

### For Performance Issues

1. `performance-optimization-patterns` - Identify issues
2. `database-typeorm-patterns` - Optimize queries
3. `load-testing-patterns` - Verify improvements

### For Testing Issues

1. `fixing-test-mocking-issues` - Fix mocking errors
2. `backend-testing-patterns` - Learn correct patterns
3. `test-utilities-patterns` - Use test helpers

### For Frontend Development

1. `frontend-react-patterns` - React best practices
2. `api-design-patterns` - API integration
3. `accessibility-testing-patterns` - Ensure accessibility

---

## 📊 Skill Status

| Category            | Skills | Status          |
| ------------------- | ------ | --------------- |
| Architecture & Core | 6      | ✅ Complete     |
| Testing             | 8      | ✅ Complete     |
| Frontend & Mobile   | 2      | ✅ Complete     |
| Security            | 1      | ✅ Complete     |
| Performance         | 1      | ✅ Complete     |
| DevOps              | 2      | ✅ Complete     |
| Documentation       | 2      | ✅ Complete     |
| **Total**           | **22** | **✅ Complete** |

---

## 🔍 Quick Reference

### Most Used Skills

1. `secure-repository-pattern` - Every service needs this
2. `backend-testing-patterns` - Every test needs this
3. `fixing-test-mocking-issues` - Common troubleshooting
4. `api-design-patterns` - Every controller needs this
5. `error-handling-patterns` - Every service needs this

### By Role

**Backend Developer:**

- secure-repository-pattern
- backend-testing-patterns
- database-typeorm-patterns
- api-design-patterns
- error-handling-patterns

**Frontend Developer:**

- frontend-react-patterns
- api-design-patterns
- accessibility-testing-patterns

**Mobile Developer:**

- mobile-react-native-patterns
- api-design-patterns

**DevOps Engineer:**

- devops-deployment-patterns
- chaos-engineering-patterns
- performance-optimization-patterns

**QA Engineer:**

- backend-testing-patterns
- test-utilities-patterns
- load-testing-patterns
- visual-regression-testing

---

## 🆕 Adding New Skills

To add a new skill:

1. Create directory: `.kiro/skills/my-new-skill/`
2. Create `SKILL.md` with front-matter:

   ```markdown
   ---
   name: my-new-skill
   description: Brief description of the skill
   ---

   # My New Skill

   Content here...
   ```

3. (Optional) Create `README.md` for quick reference
4. Update this README.md
5. Test activation: `discloseContext({ name: "my-new-skill" })`

---

## 📚 Related Documentation

- **Steering Files**: `.kiro/steering/README.md` - Project guidelines
- **Architecture**: `.kiro/steering/odoo-erpnext-architecture.md` - Core principles
- **Migration Guide**: `.kiro/steering/migration-guide.md` - Migrate to SecureRepository
- **Troubleshooting**: `.kiro/steering/troubleshooting-guide.md` - Common issues

---

**Last Updated**: 2026-03-09  
**Total Skills**: 22  
**Version**: 2.0.0
