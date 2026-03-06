# Contributing to Plaster Warehouse ERP

Thank you for your interest in contributing to Plaster Warehouse ERP! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## Code of Conduct

This project follows a professional code of conduct. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional but recommended)

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/plaster-warehouse-erp.git
cd plaster-warehouse-erp

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your local settings

# 4. Start development server
npm run dev

# 5. Run tests to verify setup
npm test
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

Examples:
- `feature/add-user-authentication`
- `bugfix/fix-order-calculation`
- `refactor/improve-query-performance`

### 2. Make Your Changes

- Write clean, readable code
- Follow coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Check code coverage
npm run test:cov

# Run linter
npm run lint

# Check formatting
npm run format:check

# Type check
npm run type-check
```

### 4. Commit Your Changes

Follow commit message guidelines (see below)

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript Conventions

**Naming**:
- Classes/Interfaces: `PascalCase`
- Functions/Methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

**Example**:
```typescript
// ✅ GOOD
export class UserService {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  
  async findOne(id: string): Promise<User> {
    // Implementation
  }
}

// ❌ BAD
export class user_service {
  private readonly maxRetryAttempts = 3;
  
  async FindOne(id: string) {
    // Implementation
  }
}
```

### NestJS Best Practices

- Use dependency injection
- Implement proper error handling
- Use DTOs for validation
- Document APIs with Swagger decorators
- Write unit tests for services
- Write integration tests for controllers

**Example**:
```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user: ${id}`, error.stack);
      throw error;
    }
  }
}
```

### Code Quality

- **ESLint**: All code must pass linting
- **Prettier**: All code must be formatted
- **TypeScript**: No `any` types, use strict mode
- **Tests**: Maintain >80% coverage

---

## Testing Requirements

### Test Coverage Requirements

- **Services**: 90% minimum
- **Controllers**: 80% minimum
- **Utilities**: 95% minimum
- **Overall**: 80% minimum

### Writing Tests

**Unit Tests**:
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should find user by id', async () => {
    const user = { id: '1', email: 'test@example.com' };
    repository.findOne.mockResolvedValue(user as User);

    const result = await service.findOne('1');

    expect(result).toEqual(user);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

**Integration Tests**:
```typescript
describe('UserController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users should create user', async () => {
    const createDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123!',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createDto)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      email: createDto.email,
      name: createDto.name,
    });
  });
});
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Feature
feat(auth): implement JWT refresh token

Add refresh token functionality to extend user sessions
without requiring re-authentication.

- Add refresh token generation
- Add refresh endpoint
- Update token expiration logic

Closes #123

# Bug fix
fix(order): correct total calculation

Fix rounding error in order total calculation that caused
discrepancies in financial reports.

Fixes #456

# Breaking change
feat(api)!: change user response structure

BREAKING CHANGE: User API now returns nested address object
instead of flat structure.

Migration guide: Update frontend to access user.address.city
instead of user.city

Closes #789
```

### Rules

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- First line max 72 characters
- Separate subject from body with blank line
- Reference issues in footer

---

## Pull Request Process

### Before Creating PR

1. ✅ All tests passing
2. ✅ Code linted and formatted
3. ✅ No TypeScript errors
4. ✅ Coverage requirements met
5. ✅ Documentation updated
6. ✅ Commits follow guidelines

### PR Title Format

```
[TYPE] Brief description

Examples:
[FEATURE] Add user authentication
[BUGFIX] Fix order calculation
[REFACTOR] Improve query performance
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Changes Made
- Added JWT authentication
- Implemented refresh token
- Updated user model

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

1. Create PR with proper title and description
2. Request review from maintainers
3. Address review comments
4. Ensure CI/CD checks pass
5. Wait for approval
6. Squash and merge

---

## Project Structure

### Backend (Monolith App)

```
backend/monolith-app/
├── src/
│   ├── modules/           # Business modules (34 modules)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── product/
│   │   └── ...
│   ├── common/            # Shared utilities
│   ├── config/            # Configuration
│   └── main.ts            # Entry point
├── test/                  # Tests
└── migrations/            # Database migrations
```

### Frontend

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── store/            # Redux store
│   └── hooks/            # Custom hooks
└── e2e/                  # E2E tests
```

### Documentation

```
docs/
├── architecture/         # Technical architecture
├── deployment/          # Deployment guides
├── guides/              # User guides
├── marketing/           # Marketing materials
└── reports/             # Project reports
```

---

## Questions?

- Check [docs/FAQ.md](docs/FAQ.md)
- Check [docs/guides/](docs/guides/)
- Ask in team chat
- Create an issue

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Plaster Warehouse ERP!** 🎉
