/**
 * Test Utilities
 * Custom render functions and test helpers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import authReducer from '@/store/slices/authSlice';
import uiReducer from '@/store/slices/uiSlice';

type PreloadedState = Partial<RootState>;

// Create a test store
export function createTestStore(preloadedState: PreloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: preloadedState as RootState,
  });
}

// Create a test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
  queryClient?: QueryClient;
}

// Wrapper with all providers
export function AllTheProviders({
  children,
  store = createTestStore(),
  queryClient = createTestQueryClient(),
}: AllTheProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider>{children}</ConfigProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

// Custom render function
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: {
    preloadedState?: PreloadedState;
    store?: ReturnType<typeof createTestStore>;
    queryClient?: QueryClient;
  } & Omit<RenderOptions, 'wrapper'> = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AllTheProviders store={store} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    );
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
