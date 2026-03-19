import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createTestQueryClient, createTestStore, renderWithProviders } from './test-utils';

describe('test-utils', () => {
  it('creates a test store with preloaded auth state', () => {
    const store = createTestStore({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-1', email: 'tester@example.com' },
      } as never,
    });

    const state = store.getState();

    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toEqual({ id: 'user-1', email: 'tester@example.com' });
    expect(state.ui).toBeDefined();
  });

  it('creates a query client with retries disabled for queries and mutations', () => {
    const queryClient = createTestQueryClient();

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(0);
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('renders UI with providers and returns the active store and query client', () => {
    const { store, queryClient } = renderWithProviders(<div>hello smart erp</div>, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
        } as never,
      },
    });

    expect(screen.getByText('hello smart erp')).toBeInTheDocument();
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });
});
