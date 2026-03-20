import { store } from '@/store';
import { clearCredentials, updateAccessToken } from '@/store/slices/authSlice';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './baseUrl';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

const clearSessionRefreshHint = () => {
  document.cookie = 'session_hint=; Max-Age=0; path=/; SameSite=Lax';
};

// Token refresh queue to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor: Add access token to headers
 * Uses Redux store for access token (memory only)
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add CSRF token from meta tag if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: Handle token refresh and errors
 * Implements token refresh queue pattern to retry failed requests
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token using refresh token from cookie
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken: newAccessToken } = response.data?.data || response.data;

        // Update Redux store with new access token
        store.dispatch(updateAccessToken(newAccessToken));

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear credentials
        store.dispatch(clearCredentials());
        clearSessionRefreshHint();
        processQueue(refreshError, undefined);

        // Only redirect if not already on login page to prevent infinite loop
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 423 Locked - account lockout
    if (error.response?.status === 423) {
      const lockoutMessage =
        error.response?.data?.message || 'Account is locked. Please try again later.';
      error.message = lockoutMessage;
    }

    return Promise.reject(error);
  },
);

export default api;
