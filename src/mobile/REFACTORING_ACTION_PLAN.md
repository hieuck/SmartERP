# Mobile Refactoring Action Plan

**Project:** Smart-ERP Mobile  
**Current Compliance:** 95%  
**Target Compliance:** 100%  
**Timeline:** 2-3 sprints

---

## Overview

The mobile project is already well-structured and follows NEW patterns. This action plan outlines the minimal work needed to reach 100% compliance.

---

## Phase 1: Testing Infrastructure (Sprint 1)

### 1.1 Create Test Utilities

**File:** `src/__tests__/utils/setup.ts`
```typescript
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

// Mock Secure Store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

### 1.2 Add Hook Tests

**File:** `src/__tests__/unit/hooks/useOffline.test.ts`
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useOffline } from '../../../hooks/useOffline';

describe('useOffline', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOffline).toBe(false);
    expect(result.current.isSyncing).toBe(false);
  });

  it('should trigger sync', async () => {
    const { result } = renderHook(() => useOffline());
    await act(async () => {
      await result.current.triggerSync();
    });
    expect(result.current.isSyncing).toBe(false);
  });
});
```

### 1.3 Add Redux Tests

**File:** `src/__tests__/unit/store/slices/authSlice.test.ts`
```typescript
import authReducer, { login } from '../../../store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    biometricEnabled: false,
  };

  it('should handle login pending', () => {
    const state = authReducer(
      initialState,
      login.pending('', { username: '', password: '' })
    );
    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });
});
```

---

## Phase 2: Documentation (Sprint 1-2)

### 2.1 Add JSDoc to Hooks

**File:** `src/hooks/useOffline.ts`
```typescript
/**
 * Manages offline mode and data synchronization
 * 
 * Handles network status monitoring, automatic sync when online,
 * and pending sync count tracking. Integrates with Redux for state management.
 * 
 * @hook
 * @returns {Object} Offline state and control methods
 * @returns {boolean} returns.isOffline - Whether app is currently offline
 * @returns {boolean} returns.isSyncing - Whether sync operation is in progress
 * @returns {number} returns.lastSync - Timestamp of last successful sync
 * @returns {number} returns.pendingSyncCount - Count of pending sync operations
 * @returns {string | null} returns.syncError - Error message from last sync attempt
 * @returns {boolean} returns.isInitialized - Whether hook has completed initialization
 * @returns {Function} returns.triggerSync - Manually trigger data synchronization
 * @returns {Function} returns.checkConnection - Check current connection status
 * 
 * @example
 * const { isOffline, triggerSync, pendingSyncCount } = useOffline();
 * 
 * if (isOffline) {
 *   return <OfflineIndicator pendingCount={pendingSyncCount} />;
 * }
 */
export const useOffline = () => {
  // Implementation...
};
```

### 2.2 Add JSDoc to Components

**File:** `src/components/BarcodeScanner.tsx`
```typescript
/**
 * Barcode/QR Scanner Component
 * 
 * Provides barcode and QR code scanning functionality with camera permissions
 * handling, visual feedback, and error states. Supports scanning multiple formats.
 * 
 * @component
 * @param {BarcodeScannerProps} props - Component props
 * @param {Function} props.onScan - Callback when barcode is scanned successfully
 * @param {Function} props.onClose - Callback to close scanner
 * @returns {React.ReactElement} Scanner component with overlay UI
 * 
 * @example
 * <BarcodeScannerComponent 
 *   onScan={(result) => {
 *     console.log('Scanned:', result.data);
 *     handleScan(result);
 *   }}
 *   onClose={() => setShowScanner(false)}
 * />
 */
export const BarcodeScannerComponent: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose 
}) => {
  // Implementation...
};
```

---

## Phase 3: Error Handling (Sprint 2)

### 3.1 Create Error Boundary

**File:** `src/components/ErrorBoundary.tsx`
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays error UI.
 * Provides recovery option to reset error state.
 * 
 * @component
 * @param {Props} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Error UI or children
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## Implementation Timeline

### Sprint 1 (Week 1-2)
- [ ] Create test utilities and mocks
- [ ] Add hook tests (useOffline, useBiometric, usePushNotifications)
- [ ] Add Redux slice tests
- [ ] Add JSDoc to hooks

**Deliverable:** 50% test coverage, documented hooks

### Sprint 2 (Week 3-4)
- [ ] Add API client tests
- [ ] Add component tests
- [ ] Add JSDoc to components
- [ ] Create error boundary

**Deliverable:** 80% test coverage, fully documented

### Sprint 3 (Week 5-6)
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Performance optimization
- [ ] Security audit

**Deliverable:** 100% test coverage, production ready

---

## Success Criteria

### Phase 1: Testing
- [ ] Jest configured and running
- [ ] 50% code coverage
- [ ] All hooks tested
- [ ] All Redux slices tested

### Phase 2: Documentation
- [ ] All public APIs have JSDoc
- [ ] All components have JSDoc
- [ ] API endpoints documented

### Phase 3: Error Handling
- [ ] Error boundary implemented
- [ ] Error logging configured
- [ ] Error recovery flows tested
- [ ] User-friendly error messages

---

## Testing Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- useOffline.test.ts
```

---

## Verification Checklist

- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No linting errors
- [ ] All JSDoc comments present
- [ ] Error boundary integrated
- [ ] No console errors in app
- [ ] App builds successfully
- [ ] App runs on iOS
- [ ] App runs on Android

---

**Status:** Ready to implement  
**Estimated Effort:** 2-3 sprints  
**Target Completion:** End of Q2 2026

