# Contributing to SmartERP

Thank you for your interest in contributing to SmartERP! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/smart-erp.git
cd smart-erp

# 2. Install dependencies
cd src/backend && npm install
cd ../frontend && npm install

# 3. Setup database
cd src/backend
npm run db:drop-create
npm run migration:run

# 4. Start development
# Terminal 1: Backend
cd src/backend && npm run start:dev

# Terminal 2: Frontend
cd src/frontend && npm run dev
```

---

## 🔄 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write code following our standards
- Add tests for new features
- Update documentation if needed

### 3. Test Your Changes

```bash
# Backend
cd src/backend
npm run lint
npm run test
npm run build

# Frontend
cd src/frontend
npm run lint
npm run test
npm run build
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat(scope): description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create Pull Request on GitHub.

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and return values
- Avoid `any` type (use `unknown` if needed)
- Use interfaces for object shapes

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### Naming Conventions

- **Files:** kebab-case (`user-service.ts`)
- **Classes:** PascalCase (`UserService`)
- **Functions:** camelCase (`getUserById`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces:** PascalCase with `I` prefix (`IUserRepository`)

### Code Organization

```
src/
├── backend/
│   ├── src/
│   │   ├── common/          # Shared utilities
│   │   ├── core/            # Core modules (auth, user, tenant)
│   │   ├── domains/         # Business domains
│   │   ├── platform/        # Platform services
│   │   └── utilities/       # Utility modules
│   └── test/
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   ├── lib/             # Libraries and utilities
    │   └── services/        # API services
    └── tests/
```

### Best Practices

1. **Single Responsibility:** Each function/class does one thing
2. **DRY:** Don't Repeat Yourself
3. **KISS:** Keep It Simple, Stupid
4. **YAGNI:** You Aren't Gonna Need It
5. **Clean Code:** Self-documenting code with clear names

---

## 🧪 Testing Guidelines

### Test Coverage

- Minimum 80% coverage
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows

### Writing Tests

**Backend (Jest):**
```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('should create user', async () => {
    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

**Frontend (React Testing Library):**
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add JWT authentication
fix(inventory): correct stock calculation
docs(readme): update installation guide
refactor(user): simplify user service
test(orders): add order creation tests
chore(deps): update dependencies
```

---

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] Commit messages follow convention

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Follows code standards
```

### Review Process

1. Automated checks run (CI/CD)
2. Code review by maintainers
3. Address feedback
4. Approval and merge

---

## 🐛 Issue Reporting

### Bug Reports

Include:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment (OS, Node version, etc.)

**Template:**
```markdown
**Describe the bug**
A clear description

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 11]
- Node: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]
```

### Feature Requests

Include:
- Clear title
- Problem description
- Proposed solution
- Alternatives considered
- Additional context

---

## 🎯 Areas for Contribution

### High Priority

- Expand offline-first coverage (17% → 50%+)
- Implement remaining features (54% → 80%+)
- Fix security vulnerabilities
- Improve test coverage

### Good First Issues

Look for issues labeled:
- `good first issue`
- `help wanted`
- `documentation`

### Documentation

- Improve existing docs
- Add code examples
- Create tutorials
- Translate documentation

---

## 💡 Tips for Success

1. **Start Small:** Begin with small PRs
2. **Ask Questions:** Don't hesitate to ask
3. **Read Code:** Understand existing patterns
4. **Test Thoroughly:** Ensure quality
5. **Be Patient:** Reviews take time

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Ant Design Components](https://ant.design/components/overview/)

---

## 🙏 Thank You!

Your contributions make SmartERP better for everyone. We appreciate your time and effort!

**Questions?** Open a discussion or reach out to maintainers.

---

**Happy Coding! 🚀**
