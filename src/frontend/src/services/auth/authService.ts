import api from './api';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role: string;
  };
  token: string;
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Authentication Service
 * Handles all auth-related API calls
 * Features:
 * - Login/Register
 * - Token refresh
 * - Logout
 * - Password management
 * - Error handling
 */
export const authService = {
  /**
   * Register a new user
   * @param data - Registration data
   * @returns Login response with user and tokens
   * @throws Error if registration fails
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/register', data);
      // Backend returns { success, data: { token, user }, message }
      // Unwrap to get { token, user }
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Registration failed');
    }
  },

  /**
   * Login user with email and password
   * @param credentials - Email and password
   * @returns Login response with user and tokens
   * @throws Error if login fails
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Backend returns { success, data: { token, user }, message }
      // Unwrap to get { token, user }
      return response.data.data || response.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error?.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error?.response?.status === 404) {
        throw new Error('User not found');
      } else if (error?.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw new Error(error?.response?.data?.message || 'Login failed');
    }
  },

  /**
   * Logout user
   * @throws Error if logout fails
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Logout error:', error);
    }
  },

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns New tokens
   * @throws Error if refresh fails
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken?: string }> => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Token refresh failed');
    }
  },

  /**
   * Get current user info
   * @returns Current user data
   * @throws Error if request fails
   */
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to fetch user info');
    }
  },

  /**
   * Change user password
   * @param data - Old and new password
   * @throws Error if change fails
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await api.post('/auth/change-password', data);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Password change failed');
    }
  },
};

export default authService;
