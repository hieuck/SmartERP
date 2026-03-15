# Mobile App Testing Guide

## Overview

This directory contains comprehensive tests for the Smart ERP mobile application, including unit tests, integration tests, and test utilities.

## Test Structure

```
src/__tests__/
├── setup.ts                    # Test setup and configuration
├── integration/                # Integration tests
│   ├── authentication.test.ts  # Auth flow tests
│   └── offlineDatabase.test.ts # Offline DB tests
└── utils/
    └── testHelpers.ts          # Test utilities and helpers
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI
```bash
npm run test:ci
```

## Test Coverage

Current coverage targets:
- **Overall**: ≥80%
- **Hooks**: ≥90%
- **Services**: ≥90%
- **Components**: ≥80%
- **Integration**: ≥70%

## Test Categories

### 1. Unit Tests

#### Hooks Tests
- `src/hooks/useOffline.test.ts` - Offline state management
- `src/hooks/useBiometric.test.ts` - Biometric authentication

#### Service Tests
- `src/services/sync/syncService.test.ts` - Sync operations
- `src/services/storage/offlineStorage.test.ts` - Offline storage

#### Component Tests
- `src/screens/auth/LoginScreen.test.tsx` - Login screen
- `src/components/OfflineIndicator.test.tsx` - Offline indicator

### 2. Integration Tests

#### Authentication Flow
- Standard login/logout
- Biometric authentication
- Session management
- Error recovery

#### Offline Database
- Database initialization
- CRUD operations
- Sync queue management
- Conflict resolution

## Mocks

### Available Mocks

1. **AsyncStorage** (`__mocks__/@react-native-async-storage/async-storage.ts`)
   - In-memory storage
   - All AsyncStorage methods
   - Test helpers: `__clearStorage()`, `__getStorage()`

2. **NetInfo** (`__mocks__/@react-native-community/netinfo.ts`)
   - Network status simulation
   - Test helpers: `__setOnline()`, `__setOffline()`

3. **SQLite** (`__mocks__/expo-sqlite.ts`)
   - In-memory database
   - Test helpers: `__clearDatabase()`, `__getTable()`, `__setTable()`

4. **Biometric Auth** (`__mocks__/expo-local-authentication.ts`)
   - Biometric simulation
   - Test helpers: `__setAvailable()`, `__setEnrolled()`, `__setAuthSuccess()`

5. **Secure Store** (`__mocks__/expo-secure-store.ts`)
   - Secure storage simulation
   - Test helpers: `__clearStorage()`, `__getStorage()`

6. **Notifications** (`__mocks__/expo-notifications.ts`)
   - Push notification simulation
   - Test helpers: `__setPermissionStatus()`, `__setPushToken()`

7. **Axios** (`__mocks__/axios.ts`)
   - API call simulation
   - Test helpers: `__setMockResponse()`, `__setMockError()`, `__clearMocks()`

### Using Mocks

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Clear storage before test
beforeEach(() => {
  (AsyncStorage as any).__clearStorage();
});

// Simulate network change
NetInfo.__setOffline();

// Check storage state
const storage = (AsyncStorage as any).__getStorage();
```

## Test Helpers

### Store Helpers

```typescript
import { createTestStore, renderWithProviders } from './__tests__/utils/testHelpers';

// Create test store
const store = createTestStore({
  auth: { isAuthenticated: true },
});

// Render with providers
const { getByText } = renderWithProviders(<MyComponent />, {
  initialState: { auth: { isAuthenticated: true } },
});
```

### Mock Data Helpers

```typescript
import {
  createMockProduct,
  createMockOrder,
  createMockUser,
} from './__tests__/utils/testHelpers';

const product = createMockProduct({ name: 'Custom Product' });
const order = createMockOrder({ status: 'completed' });
const user = createMockUser({ role: 'admin' });
```

### Network Simulation

```typescript
import { simulateNetworkChange } from './__tests__/utils/testHelpers';

// Go offline
simulateNetworkChange(false);

// Go online
simulateNetworkChange(true);
```

### API Mocking

```typescript
import { mockApiResponse, mockApiError } from './__tests__/utils/testHelpers';

// Mock successful response
mockApiResponse('get', '/api/products', {
  data: { data: [{ id: '1', name: 'Product' }] },
  status: 200,
});

// Mock error
mockApiError(new Error('Network error'));
```

## Writing Tests

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Feature Group', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  const { getByText } = render(<Component />);

  fireEvent.press(getByText('Submit'));

  await waitFor(() => {
    expect(getByText('Success')).toBeTruthy();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react-native';

it('should update state', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.updateValue('new value');
  });

  expect(result.current.value).toBe('new value');
});
```

### Testing Redux

```typescript
import { renderWithProviders } from './__tests__/utils/testHelpers';

it('should dispatch action', async () => {
  const { store, getByText } = renderWithProviders(<Component />);

  fireEvent.press(getByText('Login'));

  await waitFor(() => {
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Clear mocks between tests

### 2. Descriptive Names
- Use clear, descriptive test names
- Follow "should do X when Y" pattern
- Group related tests with `describe`

### 3. Arrange-Act-Assert
- **Arrange**: Set up test data
- **Act**: Execute the code
- **Assert**: Verify the result

### 4. Test Edge Cases
- Empty inputs
- Null/undefined values
- Large datasets
- Error conditions
- Boundary values

### 5. Mock External Dependencies
- Always mock API calls
- Mock device features (camera, biometric)
- Mock storage operations
- Mock network status

### 6. Avoid Implementation Details
- Test behavior, not implementation
- Use user-facing queries (getByText, getByRole)
- Don't test internal state directly

### 7. Keep Tests Fast
- Use mocks instead of real services
- Avoid unnecessary delays
- Run tests in parallel when possible

## Debugging Tests

### Run single test file
```bash
npm test -- LoginScreen.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should login"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout or check for unresolved promises
```typescript
jest.setTimeout(10000);
```

### Issue: Mock not working
**Solution**: Ensure mock is defined before import
```typescript
jest.mock('./module', () => ({
  default: jest.fn(),
}));
```

### Issue: State not updating
**Solution**: Wrap state changes in `act()`
```typescript
await act(async () => {
  await result.current.updateState();
});
```

### Issue: Component not rendering
**Solution**: Check if providers are wrapped correctly
```typescript
const { getByText } = renderWithProviders(<Component />);
```

## Coverage Reports

### View coverage report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage thresholds
Defined in `jest.config.js`:
```javascript
coverageThresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment

### GitHub Actions
```yaml
- name: Run tests
  run: npm run test:ci
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mobile Testing Guide](../../../docs/TESTING_GUIDE.md)
