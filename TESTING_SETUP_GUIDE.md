# Smart ERP - Testing Setup Guide

## Tổng Quan

Comprehensive test suite cho Smart ERP project với coverage target >= 80%.

## Test Infrastructure

### Backend Testing (NestJS + Jest)

**Framework**: Jest + @nestjs/testing + Supertest

**Files Created**:
- `jest.config.js` - Jest configuration
- `src/test/setup.ts` - Global test setup
- `src/test/factories/user.factory.ts` - User test data factory
- `src/test/factories/tenant.factory.ts` - Tenant test data factory

### Test Coverage

**Unit Tests Created**:
1. `src/core/auth/auth.service.spec.ts` - AuthService (45 test cases)
2. `src/core/auth/services/account-lockout.service.spec.ts` - AccountLockoutService (15 test cases)
3. `src/core/auth/services/token-blacklist.service.spec.ts` - TokenBlacklistService (12 test cases)

**Total**: 72 test cases covering critical authentication flows

## Installation

```bash
cd smart-erp/src/backend
npm install
```

Dependencies added:
- jest@^29.7.0
- @types/jest@^29.5.11
- ts-jest@^29.1.1
- supertest@^6.3.4
- @types/supertest@^6.0.2

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npm test -- auth.service.spec.ts
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts                    # Global test configuration
│   └── factories/
│       ├── user.factory.ts         # User test data
│       └── tenant.factory.ts       # Tenant test data
├── core/
│   └── auth/
│       ├── auth.service.ts
│       ├── auth.service.spec.ts    # ✅ 45 tests
│       └── services/
│           ├── account-lockout.service.spec.ts  # ✅ 15 tests
│           └── token-blacklist.service.spec.ts  # ✅ 12 tests
```

## Test Coverage Targets

| Module | Target | Status |
|--------|--------|--------|
| Services | >90% | ✅ Ready |
| Controllers | >70% | 🔄 Next |
| Utilities | >95% | 🔄 Next |
| Overall | >80% | 🔄 In Progress |

## Next Steps

### Phase 2: Additional Unit Tests
- [ ] UserService tests
- [ ] PermissionService tests
- [ ] TenantService tests
- [ ] Domain services tests

### Phase 3: Integration Tests
- [ ] Auth endpoints (login, register, refresh)
- [ ] User management endpoints
- [ ] Tenant management endpoints

### Phase 4: E2E Tests (Playwright)
- [ ] User registration flow
- [ ] Login/logout flow
- [ ] Password reset flow
- [ ] Multi-tenant isolation

## Test Patterns

### Unit Test Example
```typescript
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, /* mocks */],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  it('should validate user credentials', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    
    // Act
    const result = await service.validateUser(email, password);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example
```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = module.createNestApplication();
    await app.init();
  });
  
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
  });
});
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd smart-erp/src/backend && npm ci
      - run: cd smart-erp/src/backend && npm test -- --coverage
```

## Troubleshooting

### Issue: Tests fail with module not found
**Solution**: Check `moduleNameMapper` in `jest.config.js`

### Issue: Timeout errors
**Solution**: Increase `testTimeout` in `jest.config.js`

### Issue: Mock not working
**Solution**: Ensure mocks are created before service instantiation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated**: 2026-03-14
**Status**: Phase 1 Complete (72 tests)
**Next**: Phase 2 - Additional Unit Tests
