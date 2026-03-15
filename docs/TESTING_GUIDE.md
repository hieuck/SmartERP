# Testing Guide

**Version:** 1.0  
**Last Updated:** 2026-03-15

---

## Overview

SmartERP follows Test-Driven Development (TDD) with 80%+ coverage requirement.

## Test Types

### 1. Unit Tests (60%)
- Individual functions and services
- Component logic
- Utilities
- Target: >90% coverage for services

### 2. Integration Tests (30%)
- API endpoints
- Database operations
- Service interactions
- Target: >70% coverage for controllers

### 3. E2E Tests (10%)
- Critical user flows
- Complete workflows
- Browser automation with Playwright

---

## TDD Workflow

### Red → Green → Refactor

1. **Write test** (it should fail)
2. **Write minimal code** to pass test
3. **Refactor** while keeping tests green

### Example

```typescript
// 1. RED: Write failing test
describe('UserService', () => {
  it('should find user by id', async () => {
    const user = await service.findById('1');
    expect(user).toBeDefined();
    expect(user.id).toBe('1');
  });
});

// 2. GREEN: Implement to pass
async findById(id: string): Promise<User> {
  return this.repository.findOne({ where: { id } });
}

// 3. REFACTOR: Improve code
async findById(id: string): Promise<User> {
  const user = await this.repository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}
```

---

## Backend Testing (NestJS + Jest)

### Setup

Configuration: `src/backend/jest.config.js`

```bash
cd src/backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Unit Test Example

```typescript
// user.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
```

import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should find user by id', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    repository.findOne.mockResolvedValue(mockUser);

    const result = await service.findById('1');

    expect(result).toEqual(mockUser);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should throw NotFoundException when user not found', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findById('999')).rejects.toThrow(NotFoundException);
  });
});
```

### Integration Test Example

```typescript
// user.controller.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/users/:id should return user', () => {
    return request(app.getHttpServer())
      .get('/api/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
        expect(res.body.email).toBeDefined();
      });
  });

  it('POST /api/users should create user', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({ email: 'new@example.com', password: 'Password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe('new@example.com');
      });
  });
});
```

---

## Frontend Testing (React + Vitest)

### Setup

Configuration: `src/frontend/vitest.config.ts`

```bash
cd src/frontend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Component Test Example

```typescript
// UserList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserList } from './UserList';

describe('UserList', () => {
  const mockUsers = [
    { id: '1', name: 'John', email: 'john@example.com' },
    { id: '2', name: 'Jane', email: 'jane@example.com' },
  ];

  it('renders users', () => {
    render(<UserList users={mockUsers} onSelect={jest.fn()} />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('calls onSelect when user clicked', () => {
    const onSelect = jest.fn();
    render(<UserList users={mockUsers} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('John'));

    expect(onSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('shows empty state when no users', () => {
    render(<UserList users={[]} onSelect={jest.fn()} />);

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });
});
```

### Hook Test Example

```typescript
// useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('loads user on mount', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeDefined();
    });
  });
});
```

---

## E2E Testing (Playwright)

### Setup

```bash
cd src/frontend
npx playwright install
npx playwright test
```

### E2E Test Example

```typescript
// login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123');
    await page.click('[data-testid="submit-button"]');

    await page.waitForURL('/dashboard');
    await expect(page.locator('.welcome')).toContainText('Welcome');
  });

  it('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid credentials');
  });
});
```

---

## Mocking Strategies

### Mock External Services

```typescript
// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test' }],
          error: null
        }))
      }))
    }))
  }
}));

// Mock Redis
jest.mock('@/lib/redis', () => ({
  get: jest.fn(() => Promise.resolve('cached-value')),
  set: jest.fn(() => Promise.resolve('OK')),
}));
```

---

## Coverage Requirements

- **Overall:** ≥80%
- **Services:** ≥90%
- **Utilities:** ≥95%
- **Controllers:** ≥70%

### Check Coverage

```bash
# Backend
cd src/backend
npm run test:coverage
open coverage/lcov-report/index.html

# Frontend
cd src/frontend
npm run test:coverage
open coverage/index.html
```

---

## Best Practices

1. **Write tests first** (TDD)
2. **One assertion per test** (focus)
3. **Descriptive test names** (what's being tested)
4. **Arrange-Act-Assert** pattern
5. **Mock external dependencies**
6. **Test edge cases** (null, undefined, empty)
7. **Test error paths** (not just happy paths)
8. **Keep tests fast** (<50ms per unit test)
9. **Clean up after tests** (no side effects)
10. **Review coverage reports** regularly

---

## Common Mistakes

### ❌ WRONG

```typescript
// Testing implementation details
expect(component.state.count).toBe(5);

// Brittle selectors
await page.click('.css-class-xyz');

// No test isolation
test('creates user', () => { /* ... */ });
test('updates same user', () => { /* depends on previous */ });

// Arbitrary timeouts
await page.waitForTimeout(5000);
```

### ✅ CORRECT

```typescript
// Test user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();

// Semantic selectors
await page.click('[data-testid="submit-button"]');

// Independent tests
test('creates user', () => {
  const user = createTestUser();
  // Test logic
});

// Wait for conditions
await page.waitForResponse(resp => resp.url().includes('/api/data'));
```

---

## CI/CD Integration

Tests run automatically in CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm run test:coverage

- name: Check coverage threshold
  run: |
    echo "✅ Coverage threshold (80%) enforced"
```

---

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---

**Last Updated:** 2026-03-15  
**Maintained By:** QA Team
