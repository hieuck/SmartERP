/**
 * Test Helpers and Utilities
 * Common utilities for unit, integration, and E2E tests
 */

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { render, RenderOptions } from '@testing-library/react-native';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import dashboardReducer from '../../store/slices/dashboardSlice';
import inventoryReducer from '../../store/slices/inventorySlice';
import offlineReducer from '../../store/slices/offlineSlice';
import orderReducer from '../../store/slices/orderSlice';
import productReducer from '../../store/slices/productSlice';

/**
 * Create a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: PreloadedState<any>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      dashboard: dashboardReducer,
      inventory: inventoryReducer,
      offline: offlineReducer,
      order: orderReducer,
      product: productReducer,
    },
    preloadedState,
  });
}

/**
 * Custom render function that includes Redux provider
 */
export function renderWithRedux(
  component: ReactNode,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: RenderOptions & {
    preloadedState?: PreloadedState<any>;
    store?: any;
  } = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { ...render(component, { wrapper: Wrapper, ...renderOptions }), store };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock API response
 */
export function createMockResponse<T>(data: T, status: number = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

/**
 * Create a mock error response
 */
export function createMockError(message: string, code: string = 'ERROR') {
  return {
    response: {
      data: { message, code },
      status: 400,
    },
    message,
  };
}

/**
 * Mock localStorage for tests
 */
export function setupLocalStorageMock() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}

/**
 * Mock AsyncStorage for React Native tests
 */
export function setupAsyncStorageMock() {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn(async (key: string) => store[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    getAllKeys: jest.fn(async () => Object.keys(store)),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map((key) => [key, store[key] || null])
    ),
    multiSet: jest.fn(async (items: [string, string][]) => {
      items.forEach(([key, value]) => {
        store[key] = value;
      });
    }),
  };
}

/**
 * Create a mock navigation object
 */
export function createMockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    isFocused: jest.fn(() => true),
  };
}

/**
 * Create a mock route object
 */
export function createMockRoute(params: Record<string, any> = {}) {
  return {
    key: 'test-route',
    name: 'TestScreen',
    params,
  };
}
