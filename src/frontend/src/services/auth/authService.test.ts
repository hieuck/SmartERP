import { authService, RegisterRequest, LoginRequest } from './authService';
import api from './api';
import { logger } from '@/lib/logger/logger.service';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('./api');
vi.mock('@/lib/logger/logger.service');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
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

      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.register(mockData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', mockData);
      expect(result).toEqual(mockResponse.data.data);
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

      (api.post as any).mockRejectedValue(mockError);

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

      (api.post as any).mockRejectedValue(new Error());

      await expect(authService.register(mockData)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
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

      (api.post as any).mockResolvedValue(mockResponse);

      const result = await authService.login(mockCredentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', mockCredentials);
      expect(result).toEqual(mockResponse.data.data);
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

      (api.post as any).mockRejectedValue(mockError);

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

      (api.post as any).mockRejectedValue(mockError);

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

      (api.post as any).mockRejectedValue(mockError);

      await expect(authService.login(mockCredentials)).rejects.toThrow(
        'Too many login attempts. Please try again later.'
      );
    });

    it('should handle generic login error', async () => {
      const mockCredentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      (api.post as any).mockRejectedValue(new Error());

      await expect(authService.login(mockCredentials)).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (api.post as any).mockResolvedValue({});

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should not throw error on logout failure', async () => {
      const mockError = new Error('Logout failed');
      (api.post as any).mockRejectedValue(mockError);

      await expect(authService.logout()).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith('AuthService', 'Logout error', mockError);
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

      (api.post as any).mockResolvedValue(mockResponse);

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

      (api.post as any).mockRejectedValue(mockError);

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

      (api.get as any).mockResolvedValue(mockResponse);

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

      (api.get as any).mockRejectedValue(mockError);

      await expect(authService.getMe()).rejects.toThrow('Unauthorized');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockData = {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      };

      (api.post as any).mockResolvedValue({});

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

      (api.post as any).mockRejectedValue(mockError);

      await expect(authService.changePassword(mockData)).rejects.toThrow('Old password is incorrect');
    });
  });
});
