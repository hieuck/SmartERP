import { beforeEach, describe, expect, it, vi } from 'vitest';

type RequestHandler = (config: {
  headers: Record<string, string>;
}) => Promise<{ headers: Record<string, string> }> | { headers: Record<string, string> };

type ResponseRejectedHandler = (error: {
  config: { headers: Record<string, string>; _retry?: boolean };
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}) => Promise<unknown>;

const requestUse = vi.fn();
const responseUse = vi.fn();
const axiosPost = vi.fn();
const axiosCreate = vi.fn();
const apiCall = vi.fn();
const getState = vi.fn();
const dispatch = vi.fn();
const clearCredentials = vi.fn(() => ({ type: 'auth/clearCredentials' }));
const updateAccessToken = vi.fn((token: string) => ({
  type: 'auth/updateAccessToken',
  payload: token,
}));

vi.mock('axios', () => {
  axiosCreate.mockImplementation(() => {
    const instance = Object.assign(apiCall, {
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    });
    return instance;
  });

  return {
    default: {
      create: axiosCreate,
      post: axiosPost,
    },
    create: axiosCreate,
    post: axiosPost,
  };
});

vi.mock('@/store', () => ({
  store: {
    getState,
    dispatch,
  },
}));

vi.mock('@/store/slices/authSlice', () => ({
  clearCredentials,
  updateAccessToken,
}));

const importClient = async () => {
  vi.resetModules();
  const module = await import('./client');
  return module.default;
};

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCall.mockResolvedValue({ data: 'retried' });
    getState.mockReturnValue({ auth: { accessToken: 'token-123' } });
    document.cookie = 'session_hint=; Max-Age=0; path=/';

    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'csrf-123');
    document.head.innerHTML = '';
    document.head.appendChild(meta);
  });

  it('prefers the local proxy base URL on localhost development runs', async () => {
    await importClient();

    expect(axiosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '/api',
        withCredentials: true,
      }),
    );
  });

  it('adds access token and csrf token in request interceptor', async () => {
    await importClient();

    const requestHandler = requestUse.mock.calls[0][0] as RequestHandler;
    const config = { headers: {} as Record<string, string> };
    const result = await requestHandler(config);

    expect(result.headers.Authorization).toBe('Bearer token-123');
    expect(result.headers['X-CSRF-Token']).toBe('csrf-123');
  });

  it('refreshes token on 401 and retries the original request', async () => {
    await importClient();

    axiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'new-token' } },
    });
    const responseRejectedHandler = responseUse.mock.calls[0][1] as ResponseRejectedHandler;
    const originalRequest = { headers: {} as Record<string, string> };

    const result = await responseRejectedHandler({
      config: originalRequest,
      response: { status: 401 },
      message: 'Unauthorized',
    });

    expect(axiosPost).toHaveBeenCalledWith(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    expect(updateAccessToken).toHaveBeenCalledWith('new-token');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'auth/updateAccessToken',
      payload: 'new-token',
    });
    expect(originalRequest.headers.Authorization).toBe('Bearer new-token');
    expect(apiCall).toHaveBeenCalledWith(originalRequest);
    expect(result).toEqual({ data: 'retried' });
  });

  it('clears credentials when token refresh fails', async () => {
    await importClient();

    axiosPost.mockRejectedValueOnce(new Error('refresh failed'));
    document.cookie = 'session_hint=1; path=/';
    const responseRejectedHandler = responseUse.mock.calls[0][1] as ResponseRejectedHandler;
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/dashboard',
        href: '/dashboard',
      },
    });

    await expect(
      responseRejectedHandler({
        config: { headers: {} },
        response: { status: 401 },
        message: 'Unauthorized',
      }),
    ).rejects.toThrow('refresh failed');

    expect(clearCredentials).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/clearCredentials' });
    expect(document.cookie.includes('session_hint=1')).toBe(false);
    expect(window.location.href).toBe('/login');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('replaces lockout error message for 423 responses', async () => {
    await importClient();

    const responseRejectedHandler = responseUse.mock.calls[0][1] as ResponseRejectedHandler;
    const error = {
      config: { headers: {} },
      response: { status: 423, data: { message: 'Account locked for 15 minutes' } },
      message: 'Locked',
    };

    await expect(responseRejectedHandler(error)).rejects.toMatchObject({
      message: 'Account locked for 15 minutes',
    });
  });
});
