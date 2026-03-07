import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Biometric Authentication Service
 * Requirement 47.9: Biometric authentication (fingerprint, Face ID)
 */

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACIAL_RECOGNITION = 'facial_recognition',
  IRIS = 'iris',
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

export class BiometricAuthService {
  /**
   * Check if device supports biometric authentication
   * Requirement 47.9: Verify biometric capability
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Check if biometric data is enrolled
   */
  static async isEnrolled(): Promise<boolean> {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  static async getSupportedTypes(): Promise<BiometricType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const supported: BiometricType[] = [];

      types.forEach((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            supported.push(BiometricType.FINGERPRINT);
            break;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            supported.push(BiometricType.FACIAL_RECOGNITION);
            break;
          case LocalAuthentication.AuthenticationType.IRIS:
            supported.push(BiometricType.IRIS);
            break;
        }
      });

      return supported;
    } catch (error) {
      console.error('Error getting supported biometric types:', error);
      return [];
    }
  }

  /**
   * Get biometric type name for display
   */
  static getBiometricTypeName(types: BiometricType[]): string {
    if (types.includes(BiometricType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(BiometricType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(BiometricType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  }

  /**
   * Authenticate using biometrics
   * Requirement 47.9: Perform biometric authentication
   */
  static async authenticate(promptMessage?: string): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is available
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Check if biometric is enrolled
      const enrolled = await this.isEnrolled();
      if (!enrolled) {
        return {
          success: false,
          error:
            'No biometric data enrolled. Please set up biometric authentication in device settings.',
        };
      }

      // Get supported types for display
      const types = await this.getSupportedTypes();
      const typeName = this.getBiometricTypeName(types);

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${typeName}`,
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return {
          success: true,
          biometricType: types[0],
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  static async enableBiometric(username: string, password: string): Promise<boolean> {
    try {
      // First authenticate to confirm user identity
      const authResult = await this.authenticate('Enable biometric authentication');

      if (!authResult.success) {
        Alert.alert(
          'Authentication Failed',
          authResult.error || 'Could not enable biometric authentication',
        );
        return false;
      }

      // Store credentials securely
      const credentials = JSON.stringify({ username, password });
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentials);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      Alert.alert('Error', 'Failed to enable biometric authentication');
      return false;
    }
  }

  /**
   * Disable biometric authentication for the app
   */
  static async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  /**
   * Get stored credentials after successful biometric authentication
   */
  static async getStoredCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        return null;
      }

      // Authenticate first
      const authResult = await this.authenticate('Login with biometric');
      if (!authResult.success) {
        return null;
      }

      // Retrieve credentials
      const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsJson) {
        return null;
      }

      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  /**
   * Show biometric setup prompt
   */
  static async promptBiometricSetup(onEnable: () => void, onSkip: () => void): Promise<void> {
    const available = await this.isAvailable();
    const enrolled = await this.isEnrolled();

    if (!available || !enrolled) {
      onSkip();
      return;
    }

    const types = await this.getSupportedTypes();
    const typeName = this.getBiometricTypeName(types);

    Alert.alert(
      'Enable Biometric Login',
      `Would you like to enable ${typeName} for faster login?`,
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: onSkip,
        },
        {
          text: 'Enable',
          onPress: onEnable,
        },
      ],
    );
  }
}
