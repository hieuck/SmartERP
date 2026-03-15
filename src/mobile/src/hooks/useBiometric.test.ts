import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBiometric } from './useBiometric';
import { BiometricAuthService } from '../services/auth/biometricAuth';

// Mock BiometricAuthService
jest.mock('../services/auth/biometricAuth');

describe('useBiometric', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    (BiometricAuthService.isAvailable as jest.Mock).mockResolvedValue(true);
    (BiometricAuthService.isEnrolled as jest.Mock).mockResolvedValue(true);
    (BiometricAuthService.isBiometricEnabled as jest.Mock).mockResolvedValue(false);
    (BiometricAuthService.getSupportedTypes as jest.Mock).mockResolvedValue([1, 2]);
    (BiometricAuthService.authenticate as jest.Mock).mockResolvedValue(true);
    (BiometricAuthService.enableBiometric as jest.Mock).mockResolvedValue(true);
    (BiometricAuthService.disableBiometric as jest.Mock).mockResolvedValue(undefined);
    (BiometricAuthService.getStoredCredentials as jest.Mock).mockResolvedValue(null);
    (BiometricAuthService.getBiometricTypeName as jest.Mock).mockReturnValue('Face ID');
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useBiometric());

      expect(result.current.loading).toBe(true);
    });

    it('should check biometric status on mount', async () => {
      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(BiometricAuthService.isAvailable).toHaveBeenCalled();
      expect(BiometricAuthService.isEnrolled).toHaveBeenCalled();
      expect(BiometricAuthService.isBiometricEnabled).toHaveBeenCalled();
      expect(BiometricAuthService.getSupportedTypes).toHaveBeenCalled();
    });

    it('should set biometric status correctly', async () => {
      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.isEnrolled).toBe(true);
      expect(result.current.isEnabled).toBe(false);
      expect(result.current.supportedTypes).toEqual([1, 2]);
    });

    it('should handle unavailable biometric', async () => {
      (BiometricAuthService.isAvailable as jest.Mock).mockResolvedValue(false);
      (BiometricAuthService.isEnrolled as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isEnrolled).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      (BiometricAuthService.isAvailable as jest.Mock).mockRejectedValue(
        new Error('Hardware error')
      );

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not crash
      expect(result.current).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should authenticate successfully', async () => {
      (BiometricAuthService.authenticate as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: boolean = false;
      await act(async () => {
        authResult = await result.current.authenticate();
      });

      expect(authResult).toBe(true);
      expect(BiometricAuthService.authenticate).toHaveBeenCalled();
    });

    it('should authenticate with custom prompt message', async () => {
      (BiometricAuthService.authenticate as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.authenticate('Custom prompt');
      });

      expect(BiometricAuthService.authenticate).toHaveBeenCalledWith('Custom prompt');
    });

    it('should handle authentication failure', async () => {
      (BiometricAuthService.authenticate as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let authResult: boolean = true;
      await act(async () => {
        authResult = await result.current.authenticate();
      });

      expect(authResult).toBe(false);
    });

    it('should handle authentication errors', async () => {
      (BiometricAuthService.authenticate as jest.Mock).mockRejectedValue(
        new Error('Auth error')
      );

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.authenticate();
        })
      ).rejects.toThrow('Auth error');
    });
  });

  describe('Enable Biometric', () => {
    it('should enable biometric successfully', async () => {
      (BiometricAuthService.enableBiometric as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.enableBiometric('user@test.com', 'password123');
      });

      expect(success).toBe(true);
      expect(result.current.isEnabled).toBe(true);
      expect(BiometricAuthService.enableBiometric).toHaveBeenCalledWith(
        'user@test.com',
        'password123'
      );
    });

    it('should handle enable biometric failure', async () => {
      (BiometricAuthService.enableBiometric as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.enableBiometric('user@test.com', 'password123');
      });

      expect(success).toBe(false);
      expect(result.current.isEnabled).toBe(false);
    });

    it('should not update state if enable fails', async () => {
      (BiometricAuthService.enableBiometric as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialEnabled = result.current.isEnabled;

      await act(async () => {
        await result.current.enableBiometric('user@test.com', 'password123');
      });

      expect(result.current.isEnabled).toBe(initialEnabled);
    });
  });

  describe('Disable Biometric', () => {
    it('should disable biometric successfully', async () => {
      (BiometricAuthService.isBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (BiometricAuthService.disableBiometric as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
      });

      await act(async () => {
        await result.current.disableBiometric();
      });

      expect(result.current.isEnabled).toBe(false);
      expect(BiometricAuthService.disableBiometric).toHaveBeenCalled();
    });

    it('should handle disable biometric errors', async () => {
      (BiometricAuthService.disableBiometric as jest.Mock).mockRejectedValue(
        new Error('Disable error')
      );

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.disableBiometric();
        })
      ).rejects.toThrow('Disable error');
    });
  });

  describe('Get Stored Credentials', () => {
    it('should get stored credentials', async () => {
      const mockCredentials = { username: 'user@test.com', password: 'password123' };
      (BiometricAuthService.getStoredCredentials as jest.Mock).mockResolvedValue(
        mockCredentials
      );

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let credentials: any = null;
      await act(async () => {
        credentials = await result.current.getStoredCredentials();
      });

      expect(credentials).toEqual(mockCredentials);
      expect(BiometricAuthService.getStoredCredentials).toHaveBeenCalled();
    });

    it('should return null if no credentials stored', async () => {
      (BiometricAuthService.getStoredCredentials as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let credentials: any = {};
      await act(async () => {
        credentials = await result.current.getStoredCredentials();
      });

      expect(credentials).toBeNull();
    });
  });

  describe('Get Biometric Type Name', () => {
    it('should get biometric type name', async () => {
      (BiometricAuthService.getBiometricTypeName as jest.Mock).mockReturnValue('Touch ID');

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const typeName = result.current.getBiometricTypeName();

      expect(typeName).toBe('Touch ID');
      expect(BiometricAuthService.getBiometricTypeName).toHaveBeenCalledWith([1, 2]);
    });

    it('should handle different biometric types', async () => {
      (BiometricAuthService.getSupportedTypes as jest.Mock).mockResolvedValue([2]);
      (BiometricAuthService.getBiometricTypeName as jest.Mock).mockReturnValue('Face ID');

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const typeName = result.current.getBiometricTypeName();

      expect(typeName).toBe('Face ID');
    });
  });

  describe('Refresh', () => {
    it('should refresh biometric status', async () => {
      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      jest.clearAllMocks();

      // Change mock return values
      (BiometricAuthService.isAvailable as jest.Mock).mockResolvedValue(false);
      (BiometricAuthService.isEnrolled as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await result.current.refresh();
      });

      expect(BiometricAuthService.isAvailable).toHaveBeenCalled();
      expect(BiometricAuthService.isEnrolled).toHaveBeenCalled();
      expect(result.current.isAvailable).toBe(false);
      expect(result.current.isEnrolled).toBe(false);
    });

    it('should set loading state during refresh', async () => {
      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loadingDuringRefresh = false;

      const refreshPromise = act(async () => {
        const promise = result.current.refresh();
        loadingDuringRefresh = result.current.loading;
        await promise;
      });

      await refreshPromise;

      expect(loadingDuringRefresh).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple supported types', async () => {
      (BiometricAuthService.getSupportedTypes as jest.Mock).mockResolvedValue([1, 2, 3]);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.supportedTypes).toEqual([1, 2, 3]);
    });

    it('should handle no supported types', async () => {
      (BiometricAuthService.getSupportedTypes as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.supportedTypes).toEqual([]);
    });

    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() => useBiometric());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start multiple operations concurrently
      await act(async () => {
        await Promise.all([
          result.current.authenticate(),
          result.current.getStoredCredentials(),
          result.current.refresh(),
        ]);
      });

      // Should not crash
      expect(result.current).toBeDefined();
    });
  });
});
