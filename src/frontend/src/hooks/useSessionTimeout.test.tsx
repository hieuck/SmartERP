import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestStore } from '@/test/test-utils';
import { authService } from '@/services/auth/authService';
import { useSessionTimeout } from './useSessionTimeout';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/services/auth/authService', () => ({
  authService: {
    logout: vi.fn(),
  },
}));

function createWrapper(isAuthenticated: boolean) {
  const store = createTestStore({
    auth: isAuthenticated
      ? {
          isAuthenticated: true,
          accessToken: 'test-token',
          user: {
            id: 'user-1',
            username: 'admin@demo.com',
            email: 'admin@demo.com',
            firstName: 'Admin',
            lastName: 'User',
            roles: ['admin'],
          },
        }
      : {
          isAuthenticated: false,
          accessToken: null,
          user: null,
        },
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  return { store, wrapper };
}

describe('useSessionTimeout', () => {
  const logoutMock = vi.mocked(authService.logout);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    logoutMock.mockResolvedValue(undefined);
  });

  it('does not schedule timers for anonymous users', async () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const { wrapper } = createWrapper(false);
    const activityEvents = new Set(['mousedown', 'keydown', 'scroll', 'touchstart', 'click']);

    renderHook(() => useSessionTimeout({ timeoutMs: 1_000, warningMs: 200 }), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    const activityListenerCalls = addEventListenerSpy.mock.calls.filter(([eventName]) =>
      activityEvents.has(String(eventName)),
    );

    expect(activityListenerCalls).toHaveLength(0);
    expect(logoutMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('logs out authenticated users after the inactivity timeout', async () => {
    const { store, wrapper } = createWrapper(true);

    renderHook(() => useSessionTimeout({ timeoutMs: 1_000, warningMs: 200 }), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      await Promise.resolve();
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { reason: 'session-expired' },
    });
  });

  it('resets the inactivity timer when user activity occurs', async () => {
    const { wrapper } = createWrapper(true);

    renderHook(() => useSessionTimeout({ timeoutMs: 1_000, warningMs: 200 }), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown'));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(logoutMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('fires the warning callback before timing out', async () => {
    const onWarning = vi.fn();
    const { wrapper } = createWrapper(true);

    renderHook(() => useSessionTimeout({ timeoutMs: 1_000, warningMs: 200, onWarning }), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
