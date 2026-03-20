import { authService, RegisterRequest, LoginRequest } from './authService';
import api from './api';
import { hasRecentSessionRefreshFailure, markSessionRefreshFailure } from '@/lib/auth/sessionRefresh';
import { logger } from '@/lib/logger/logger.service';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('./api');
vi.mock('@/lib/logger/logger.service');

const mockApiPost = vi.mocked(api.post);
const mockApiGet = vi.mocked(api.get);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      markSessionRefreshFailure();
      const mockData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        phone: '1234567890',
      };

      const mockResponse = {
        data: {
          data: {
            token: 'test-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              tenantId: 'tenant-1',
              role: 'user',
            },
          },
        },
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await authService.register(mockData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', mockData);
      expect(result).toEqual(mockResponse.data.data);
      expect(hasRecentSessionRefreshFailure()).toBe(false);
    });

    it('should handle registration error', async () => {
      const mockData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        phone: '1234567890',
      };

      const mockError = {
        response: {
          data: {
            message: 'Email already exists',
          },
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.register(mockData)).rejects.toThrow('Email already exists');
    });

    it('should handle registration error without message', async () => {
      const mockData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        companyName: 'Test Company',
        phone: '1234567890',
      };

      mockApiPost.mockRejectedValue(new Error());

      await expect(authService.register(mockData)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      markSessionRefreshFailure();
      const mockCredentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          data: {
            token: 'test-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              tenantId: 'tenant-1',
              role: 'user',
            },
          },
        },
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(result).toEqual(mockResponse.data.data);
      expect(hasRecentSessionRefreshFailure()).toBe(false);
    });

    it('should handle 401 unauthorized error', async () => {
      const mockCredentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockError = {
        response: {
          status: 401,
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid email or password');
    });

    it('should handle 404 user not found error', async () => {
      const mockCredentials: LoginRequest = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      const mockError = {
        response: {
          status: 404,
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('User not found');
    });

    it('should handle 429 rate limit error', async () => {
      const mockCredentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockError = {
        response: {
          status: 429,
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow(
        'Too many login attempts. Please try again later.'
      );
    });

    it('should handle generic login error', async () => {
      const mockCredentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockApiPost.mockRejectedValue(new Error());

      await expect(authService.login(mockCredentials)).rejects.toThrow('Network Error');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      document.cookie = 'session_hint=1; path=/';
    });

    it('should logout successfully', async () => {
      mockApiPost.mockResolvedValue({});

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(document.cookie.includes('session_hint=1')).toBe(false);
    });

    it('should not throw error on logout failure', async () => {
      const mockError = new Error('Logout failed');
      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.logout()).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('AuthService', 'Logout error', mockError);
      expect(document.cookie.includes('session_hint=1')).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockResponse = {
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh-token',
        },
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken(mockRefreshToken);

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: mockRefreshToken });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle refresh token error', async () => {
      const mockRefreshToken = 'invalid-token';
      const mockError = {
        response: {
          data: {
            message: 'Invalid refresh token',
          },
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getMe', () => {
    it('should get current user successfully', async () => {
      const mockResponse = {
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await authService.getMe();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle getMe error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Unauthorized',
          },
        },
      };

      mockApiGet.mockRejectedValue(mockError);

      await expect(authService.getMe()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockData = {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      };

      mockApiPost.mockResolvedValue({});

      await authService.changePassword(mockData);

      expect(api.post).toHaveBeenCalledWith('/auth/change-password', mockData);
    });

    it('should handle change password error', async () => {
      const mockData = {
        oldPassword: 'wrong-password',
        newPassword: 'new-password',
      };

      const mockError = {
        response: {
          data: {
            message: 'Old password is incorrect',
          },
        },
      };

      mockApiPost.mockRejectedValue(mockError);

      await expect(authService.changePassword(mockData)).rejects.toThrow('Old password is incorrect');
    });
  });

  describe('forgotPassword', () => {
    it('should request a password reset successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            message: 'If the email exists, a password reset link has been sent',
          },
        },
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword('test@example.com');

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should surface forgot password API errors', async () => {
      mockApiPost.mockRejectedValue({
        response: {
          data: {
            message: 'Too many requests',
          },
        },
      });

      await expect(authService.forgotPassword('test@example.com')).rejects.toThrow('Too many requests');
    });
  });

  describe('resetPassword', () => {
    it('should reset a password successfully', async () => {
      const payload = {
        token: 'reset-token',
        newPassword: 'NewPassword1',
      };
      const mockResponse = {
        data: {
          data: {
            message: 'Password reset successful',
          },
        },
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword(payload);

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', payload);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should surface reset password API errors', async () => {
      mockApiPost.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid reset token',
          },
        },
      });

      await expect(
        authService.resetPassword({ token: 'reset-token', newPassword: 'NewPassword1' }),
      ).rejects.toThrow('Invalid reset token');
    });
  });
});
