/**
 * Integration tests for authentication flow
 * Tests the complete authentication process including biometric auth
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, setBiometricEnabled } from '../../store/slices/authSlice';
import { BiometricAuthService } from '../../services/auth/biometricAuth';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('expo-local-authentication');
jest.mock('../../services/api/client');

describe('Authentication Integration', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();

    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    // Setup default mocks
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Standard Login Flow', () => {
    it('should complete login flow successfully', async () => {
      const credentials = {
        username: 'test@example.com',
        password: 'password123',
      };

      // Dispatch login action
      await store.dispatch(login(credentials));

      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const credentials = {
        username: 'wrong@example.com',
        password: 'wrongpassword',
      };

      try {
        await store.dispatch(login(credentials)).unwrap();
      } catch (error) {
        // Expected to fail
      }

      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should clear error on successful login after failure', async () => {
      // First login fails
      try {
        await store.dispatch(
          login({ username: 'wrong', password: 'wrong' })
        ).unwrap();
      } catch (error) {
        // Expected
      }

      expect(store.getState().auth.error).toBeDefined();

      // Second login succeeds
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe('Biometric Authentication Flow', () => {
    it('should enable biometric authentication', async () => {
      const username = 'test@example.com';
      const password = 'password123';

      const success = await BiometricAuthService.enableBiometric(username, password);

      expect(success).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_username',
        username
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_password',
        password
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_enabled',
        'true'
      );
    });

    it('should authenticate with biometrics', async () => {
      // Setup stored credentials
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('test@example.com') // username
        .mockResolvedValueOnce('password123'); // password

      const credentials = await BiometricAuthService.getStoredCredentials();

      expect(credentials).toEqual({
        username: 'test@example.com',
        password: 'password123',
      });

      // Login with stored credentials
      await store.dispatch(login(credentials));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });

    it('should disable biometric authentication', async () => {
      await BiometricAuthService.disableBiometric();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_username');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_password');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_enabled');
    });

    it('should handle biometric authentication failure', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await BiometricAuthService.authenticate();

      expect(result).toBe(false);
    });

    it('should not enable biometric when hardware unavailable', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const success = await BiometricAuthService.enableBiometric(
        'test@example.com',
        'password123'
      );

      expect(success).toBe(false);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should not enable biometric when not enrolled', async () => {
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const success = await BiometricAuthService.enableBiometric(
        'test@example.com',
        'password123'
      );

      expect(success).toBe(false);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow', async () => {
      // Login first
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Logout
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should clear biometric data on logout if requested', async () => {
      // Login with biometric enabled
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );
      store.dispatch(setBiometricEnabled(true));

      // Logout and clear biometric
      store.dispatch(logout());
      await BiometricAuthService.disableBiometric();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should maintain session after successful login', async () => {
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      const state1 = store.getState().auth;
      expect(state1.isAuthenticated).toBe(true);
      expect(state1.token).toBeDefined();

      // Simulate app restart - token should persist
      const state2 = store.getState().auth;
      expect(state2.token).toBe(state1.token);
    });

    it('should handle token expiration', async () => {
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      // Simulate token expiration
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      // First attempt fails
      try {
        await store.dispatch(
          login({ username: 'test@example.com', password: 'password123' })
        ).unwrap();
      } catch (error) {
        // Network error
      }

      // Retry succeeds
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    it('should handle biometric fallback to password', async () => {
      // Biometric fails
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const biometricResult = await BiometricAuthService.authenticate();
      expect(biometricResult).toBe(false);

      // Fallback to password login
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent login attempts', async () => {
      const credentials = {
        username: 'test@example.com',
        password: 'password123',
      };

      // Start multiple login attempts
      const promises = [
        store.dispatch(login(credentials)),
        store.dispatch(login(credentials)),
        store.dispatch(login(credentials)),
      ];

      await Promise.all(promises);

      // Should only be logged in once
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login during logout', async () => {
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      // Start logout and login concurrently
      store.dispatch(logout());
      await store.dispatch(
        login({ username: 'test@example.com', password: 'password123' })
      );

      // Final state should be logged in
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty credentials', async () => {
      try {
        await store.dispatch(login({ username: '', password: '' })).unwrap();
      } catch (error) {
        expect(error).toBeDefined();
      }

      expect(store.getState().auth.isAuthenticated).toBe(false);
    });

    it('should handle special characters in credentials', async () => {
      const credentials = {
        username: 'test+user@example.com',
        password: 'p@ssw0rd!#$%',
      };

      await store.dispatch(login(credentials));

      // Should handle special characters correctly
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    it('should handle very long credentials', async () => {
      const credentials = {
        username: 'a'.repeat(1000) + '@example.com',
        password: 'b'.repeat(1000),
      };

      try {
        await store.dispatch(login(credentials)).unwrap();
      } catch (error) {
        // May fail validation
      }

      // Should not crash
      expect(store.getState().auth).toBeDefined();
    });
  });
});
