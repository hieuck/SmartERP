/**
 * Test utilities and helpers for mobile tests
 */

import { configureStore } from '@reduxjs/toolkit';
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import authReducer from '../../store/slices/authSlice';
import offlineReducer from '../../store/slices/offlineSlice';
import productReducer from '../../store/slices/productSlice';
import orderReducer from '../../store/slices/orderSlice';
import inventoryReducer from '../../store/slices/inventorySlice';
import dashboardReducer from '../../store/slices/dashboardSlice';

/**
 * Create a test store with initial state
 */
export const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      offline: offlineReducer,
      products: productReducer,
      orders: orderReducer,
      inventory: inventoryReducer,
      dashboard: dashboardReducer,
    },
    preloadedState: initialState,
  });
};

/**
 * Render component with Redux Provider
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialState,
    store = createTestStore(initialState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Wait for async operations
 */
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock product data
 */
export const createMockProduct = (overrides?: any) => ({
  id: '1',
  name: 'Test Product',
  sku: 'TEST001',
  price: 100,
  cost: 50,
  status: 'active',
  stockQuantity: 10,
  ...overrides,
});

/**
 * Mock order data
 */
export const createMockOrder = (overrides?: any) => ({
  id: '1',
  orderNumber: 'ORD001',
  customerId: 'c1',
  totalAmount: 100,
  status: 'pending',
  items: [],
  ...overrides,
});

/**
 * Mock inventory data
 */
export const createMockInventory = (overrides?: any) => ({
  id: '1',
  productId: 'p1',
  warehouseId: 'w1',
  quantity: 10,
  reservedQuantity: 0,
  availableQuantity: 10,
  ...overrides,
});

/**
 * Mock user data
 */
export const createMockUser = (overrides?: any) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  ...overrides,
});

/**
 * Mock auth state
 */
export const createMockAuthState = (overrides?: any) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
  biometricEnabled: false,
  ...overrides,
});

/**
 * Mock offline state
 */
export const createMockOfflineState = (overrides?: any) => ({
  isOffline: false,
  isSyncing: false,
  lastSync: null,
  pendingSyncCount: 0,
  syncError: null,
  ...overrides,
});

/**
 * Simulate network status change
 */
export const simulateNetworkChange = (isOnline: boolean) => {
  const NetInfo = require('@react-native-community/netinfo').default;
  if (isOnline) {
    NetInfo.__setOnline();
  } else {
    NetInfo.__setOffline();
  }
};

/**
 * Simulate biometric authentication
 */
export const simulateBiometricAuth = (success: boolean) => {
  const LocalAuth = require('expo-local-authentication');
  LocalAuth.__setAuthSuccess(success);
};

/**
 * Clear all mocks
 */
export const clearAllMocks = () => {
  jest.clearAllMocks();
  
  // Clear AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AsyncStorage.__clearStorage();
  
  // Clear SecureStore
  const SecureStore = require('expo-secure-store');
  SecureStore.__clearStorage();
  
  // Clear SQLite
  const SQLite = require('expo-sqlite');
  SQLite.__clearDatabase();
};

/**
 * Mock API responses
 */
export const mockApiResponse = (method: string, url: string, response: any) => {
  const axios = require('axios').default;
  axios.__setMockResponse(method, url, response);
};

/**
 * Mock API error
 */
export const mockApiError = (error: any) => {
  const axios = require('axios').default;
  axios.__setMockError(error);
};

/**
 * Create mock sync result
 */
export const createMockSyncResult = (overrides?: any) => ({
  success: true,
  synced: 0,
  failed: 0,
  errors: [],
  ...overrides,
});

/**
 * Create mock pending sync item
 */
export const createMockPendingSyncItem = (overrides?: any) => ({
  id: 'sync_1',
  type: 'create' as const,
  entity: 'product' as const,
  data: {},
  timestamp: Date.now(),
  ...overrides,
});

/**
 * Advance timers and flush promises
 */
export const flushPromises = async () => {
  await new Promise((resolve) => setImmediate(resolve));
};

/**
 * Mock date for consistent testing
 */
export const mockDate = (date: string | number) => {
  const mockNow = new Date(date).getTime();
  jest.spyOn(Date, 'now').mockReturnValue(mockNow);
  jest.spyOn(global.Date.prototype, 'getTime').mockReturnValue(mockNow);
};

/**
 * Restore date mock
 */
export const restoreDate = () => {
  jest.restoreAllMocks();
};
