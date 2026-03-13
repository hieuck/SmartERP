# Test Implementation Guide - Authentication System

**Purpose:** Step-by-step guide to implement missing test scenarios  
**Target Coverage:** 85%+ backend, 80%+ frontend  
**Estimated Time:** 3-4 weeks  

---

## Quick Reference: Test Scenarios by Priority

### CRITICAL (Week 1) - 12 Tests
1. Multi-tenancy isolation (3 tests)
2. Rate limiting (3 tests)
3. Account lockout (3 tests)
4. Token security (3 tests)

### HIGH (Week 2) - 15 Tests
5. Email verification flow (3 tests)
6. Password reset security (3 tests)
7. Protected routes (3 tests)
8. Token refresh on 401 (3 tests)
9. Frontend auth store (3 tests)

### MEDIUM (Week 3) - 10 Tests
10. Session timeout (2 tests)
11. Subdomain validation (3 tests)
12. Concurrent requests (2 tests)
13. Error message security (3 tests)

### NICE TO HAVE (Week 4) - 8 Tests
14. Cross-browser compatibility (2 tests)
15. Mobile responsiveness (2 tests)
16. Network error handling (2 tests)
17. Performance testing (2 tests)

---

## Test Template Examples

### Backend Unit Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';

describe('AuthService - [Feature Name]', () => {
  let service: AuthService;
  let mockUserRepository: any;

  beforeEach(async () => {
    // Setup mocks
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Feature Name', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const input = { /* test data */ };
      mockUserRepository.findOne.mockResolvedValue({ /* mock data */ });

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual({ /* expected result */ });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ /* expected call */ });
    });

    it('should [error scenario]', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.methodName({})).rejects.toThrow('Error message');
    });
  });
});
```

### Frontend Component Test Template
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ConfigProvider locale={viVN}>
          <MyComponent />
        </ConfigProvider>
      </BrowserRouter>,
    );
  };

  describe('Feature Name', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const user = userEvent.setup();
      renderComponent();

      // Act
      const button = screen.getByRole('button', { name: /button text/i });
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/expected text/i)).toBeInTheDocument();
      });
    });

    it('should [error scenario]', async () => {
      // Arrange
      const user = userEvent.setup();
      renderComponent();

      // Act
      const input = screen.getByLabelText(/label/i);
      await user.type(input, 'invalid');

      // Assert
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Template
```typescript
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Feature Name', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should [expected behavior]', async () => {
    // Arrange
    await page.goto(`${BASE_URL}/path`);

    // Act
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Submit")');

    // Assert
    await page.waitForURL('**/expected-path**', { timeout: 5000 });
    expect(page.url()).toContain('/expected-path');
  });

  test('should [error scenario]', async () => {
    // Arrange
    await page.goto(`${BASE_URL}/path`);

    // Act
    await page.fill('input[type="email"]', 'invalid');
    await page.click('button:has-text("Submit")');

    // Assert
    await expect(page.locator('text=Error message')).toBeVisible();
  });
});
```

---

## Specific Test Implementations

### 1. Multi-Tenancy Isolation Test

**File:** `src/backend/src/core/auth/auth.service.extended.spec.ts`

```typescript
describe('Multi-Tenancy Isolation', () => {
  it('should prevent user from accessing other tenant data', async () => {
    // Arrange
    const tenant1 = await tenantRepository.save({
      name: 'Tenant 1',
      subdomain: 'tenant1',
      status: TenantStatus.ACTIVE,
    });
    const tenant2 = await tenantRepository.save({
      name: 'Tenant 2',
      subdomain: 'tenant2',
      status: TenantStatus.ACTIVE,
    });

    const user1 = await userRepository.save({
      email: 'user1@tenant1.com',
      tenantId: tenant1.id,
      password: await authService.hashPassword('password123'),
    });

    // Act
    const token = authService.login(user1);
    const decoded = jwt.decode(token);

    // Assert
    expect(decoded.tenantId).toBe(tenant1.id);
    expect(decoded.tenantId).not.toBe(tenant2.id);
  });

  it('should verify tenant status on login', async () => {
    // Arrange
    const inactiveTenant = await tenantRepository.save({
      name: 'Inactive Tenant',
      subdomain: 'inactive',
      status: TenantStatus.INACTIVE,
    });

    const user = await userRepository.save({
      email: 'user@inactive.com',
      tenantId: inactiveTenant.id,
      password: await authService.hashPassword('password123'),
    });

    // Act & Assert
    await expect(
      authService.validateUser('user@inactive.com', 'password123')
    ).rejects.toThrow('Tenant is not active');
  });

  it('should isolate JWT tokens by tenantId', async () => {
    // Arrange
    const tenant1 = await tenantRepository.save({
      name: 'Tenant 1',
      subdomain: 'tenant1',
      status: TenantStatus.ACTIVE,
    });

    const user1 = await userRepository.save({
      email: 'user1@tenant1.com',
      tenantId: tenant1.id,
      password: await authService.hashPassword('password123'),
    });

    // Act
    const token = authService.login(user1);
    const decoded = jwt.decode(token);

    // Assert
    expect(decoded.tenantId).toBe(tenant1.id);
    expect(decoded.sub).toBe(user1.id);
  });
});
```

### 2. Rate Limiting Test

**File:** `src/backend/src/core/auth/auth.service.extended.spec.ts`

```typescript
describe('Rate Limiting', () => {
  it('should rate limit login attempts', async () => {
    // Arrange
    const user = await userRepository.save({
      email: 'test@example.com',
      password: await authService.hashPassword('correct123'),
    });

    // Act & Assert
    for (let i = 0; i < 5; i++) {
      await expect(
        authService.validateUser('test@example.com', 'wrong')
      ).rejects.toThrow();
    }

    // 6th attempt should be rate limited
    const response = await authService.validateUser('test@example.com', 'wrong');
    expect(response).toBeNull(); // Rate limited
  });

  it('should lock account after N failed attempts', async () => {
    // Arrange
    const user = await userRepository.save({
      email: 'test@example.com',
      password: await authService.hashPassword('correct123'),
      failedLoginAttempts: 0,
    });

    // Act - Make 10 failed attempts
    for (let i = 0; i < 10; i++) {
      await authService.validateUser('test@example.com', 'wrong');
    }

    // Assert - Account should be locked
    const lockedUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });
    expect(lockedUser.isLocked).toBe(true);

    // Even correct password should fail
    await expect(
      authService.validateUser('test@example.com', 'correct123')
    ).rejects.toThrow('Account is locked');
  });

  it('should unlock account after timeout', async () => {
    // Arrange
    const user = await userRepository.save({
      email: 'test@example.com',
      password: await authService.hashPassword('correct123'),
      isLocked: true,
      lockedUntil: new Date(Date.now() - 1000), // Locked in past
    });

    // Act
    const result = await authService.validateUser('test@example.com', 'correct123');

    // Assert
    expect(result).not.toBeNull();
    expect(result.email).toBe('test@example.com');
  });
});
```

### 3. Protected Routes Test

**File:** `src/frontend/src/components/ProtectedRoute.test.tsx`

```typescript
describe('ProtectedRoute', () => {
  it('should redirect to login when accessing protected route without token', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Act
    await user.navigate('/dashboard');

    // Assert
    expect(window.location.pathname).toBe('/login');
  });

  it('should allow access with valid token', async () => {
    // Arrange
    localStorage.setItem('authToken', 'valid-token');
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Act
    await user.navigate('/dashboard');

    // Assert
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should refresh token on 401 response', async () => {
    // Arrange
    const mockApi = jest.spyOn(api, 'get');
    mockApi.mockRejectedValueOnce({ response: { status: 401 } });
    mockApi.mockResolvedValueOnce({ data: { /* dashboard data */ } });

    // Act
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </BrowserRouter>,
    );

    // Assert
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## Running Tests

### Backend Tests
```bash
# All tests
cd smart-erp/src/backend
npm test -- --run

# Specific test file
npm test -- auth.service.spec.ts --run

# With coverage
npm test -- --coverage --run

# Watch mode (development)
npm test
```

### Frontend Tests
```bash
# All tests
cd smart-erp/src/frontend
npm test -- --run

# Specific test file
npm test -- LoginPage.test.tsx --run

# With coverage
npm test -- --coverage --run

# Watch mode (development)
npm test
```

### E2E Tests
```bash
# All E2E tests
cd smart-erp
npm run test:e2e

# Specific test file
npm run test:e2e -- auth.e2e.spec.ts

# Headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

---

## Coverage Reporting

### Generate Coverage Report
```bash
# Backend
cd smart-erp/src/backend
npm test -- --coverage --run

# Frontend
cd smart-erp/src/frontend
npm test -- --coverage --run
```

### View Coverage Report
```bash
# Backend
open smart-erp/src/backend/coverage/lcov-report/index.html

# Frontend
open smart-erp/src/frontend/coverage/lcov-report/index.html
```

### Coverage Thresholds
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

## Best Practices

### 1. Test Naming
```typescript
// ✅ Good
it('should return user when credentials are valid', () => {});
it('should throw error when password is incorrect', () => {});
it('should lock account after 10 failed attempts', () => {});

// ❌ Bad
it('test login', () => {});
it('validates', () => {});
it('works', () => {});
```

### 2. AAA Pattern
```typescript
// ✅ Good
it('should validate email format', () => {
  // Arrange
  const invalidEmail = 'not-an-email';

  // Act
  const result = validateEmail(invalidEmail);

  // Assert
  expect(result).toBe(false);
});

// ❌ Bad
it('should validate email format', () => {
  expect(validateEmail('not-an-email')).toBe(false);
});
```

### 3. Mock External Dependencies
```typescript
// ✅ Good
jest.mock('../email.service');
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

// ❌ Bad
// Making real API calls in tests
```

### 4. Test Isolation
```typescript
// ✅ Good
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
  localStorage.clear();
});

// ❌ Bad
// Tests depending on each other
// Shared state between tests
```

---

## Checklist for Test Implementation

- [ ] Write test description (what should happen)
- [ ] Arrange test data (setup)
- [ ] Act (execute code)
- [ ] Assert (verify results)
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Add comments for complex logic
- [ ] Run tests locally
- [ ] Verify coverage > 80%
- [ ] Commit with descriptive message

---

## Common Issues & Solutions

### Issue: Tests timing out
**Solution:** Increase timeout or mock async operations
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Mock not working
**Solution:** Clear mocks between tests
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Issue: Database state persisting
**Solution:** Use transactions or cleanup
```typescript
afterEach(async () => {
  await queryRunner.rollbackTransaction();
});
```

### Issue: Flaky E2E tests
**Solution:** Add proper waits
```typescript
await page.waitForURL('**/expected-path**', { timeout: 5000 });
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
