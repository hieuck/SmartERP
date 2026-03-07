import { useState, useEffect } from 'react';
import { BiometricAuthService, BiometricType } from '../services/auth/biometricAuth';

/**
 * Hook for biometric authentication
 * Requirement 47.9: Biometric authentication integration
 */
export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<BiometricType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    setLoading(true);
    try {
      const [available, enrolled, enabled, types] = await Promise.all([
        BiometricAuthService.isAvailable(),
        BiometricAuthService.isEnrolled(),
        BiometricAuthService.isBiometricEnabled(),
        BiometricAuthService.getSupportedTypes(),
      ]);

      setIsAvailable(available);
      setIsEnrolled(enrolled);
      setIsEnabled(enabled);
      setSupportedTypes(types);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async (promptMessage?: string) => {
    return await BiometricAuthService.authenticate(promptMessage);
  };

  const enableBiometric = async (username: string, password: string) => {
    const success = await BiometricAuthService.enableBiometric(username, password);
    if (success) {
      setIsEnabled(true);
    }
    return success;
  };

  const disableBiometric = async () => {
    await BiometricAuthService.disableBiometric();
    setIsEnabled(false);
  };

  const getStoredCredentials = async () => {
    return await BiometricAuthService.getStoredCredentials();
  };

  const getBiometricTypeName = () => {
    return BiometricAuthService.getBiometricTypeName(supportedTypes);
  };

  return {
    isAvailable,
    isEnrolled,
    isEnabled,
    supportedTypes,
    loading,
    authenticate,
    enableBiometric,
    disableBiometric,
    getStoredCredentials,
    getBiometricTypeName,
    refresh: checkBiometricStatus,
  };
};
