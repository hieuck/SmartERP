/**
 * Mock for expo-local-authentication
 */

export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

export enum SecurityLevel {
  NONE = 0,
  SECRET = 1,
  BIOMETRIC = 2,
}

let mockIsAvailable = true;
let mockIsEnrolled = true;
let mockAuthSuccess = true;
let mockSupportedTypes = [AuthenticationType.FINGERPRINT, AuthenticationType.FACIAL_RECOGNITION];

export const hasHardwareAsync = jest.fn(async () => mockIsAvailable);

export const isEnrolledAsync = jest.fn(async () => mockIsEnrolled);

export const supportedAuthenticationTypesAsync = jest.fn(async () => mockSupportedTypes);

export const authenticateAsync = jest.fn(async (options?: any) => {
  if (!mockIsAvailable || !mockIsEnrolled) {
    return { success: false, error: 'not_available' };
  }
  return { success: mockAuthSuccess, error: mockAuthSuccess ? undefined : 'user_cancel' };
});

export const getEnrolledLevelAsync = jest.fn(async () => {
  if (mockIsEnrolled) {
    return SecurityLevel.BIOMETRIC;
  }
  return SecurityLevel.NONE;
});

// Test helpers
export const __setAvailable = (available: boolean) => {
  mockIsAvailable = available;
};

export const __setEnrolled = (enrolled: boolean) => {
  mockIsEnrolled = enrolled;
};

export const __setAuthSuccess = (success: boolean) => {
  mockAuthSuccess = success;
};

export const __setSupportedTypes = (types: AuthenticationType[]) => {
  mockSupportedTypes = types;
};

export const __reset = () => {
  mockIsAvailable = true;
  mockIsEnrolled = true;
  mockAuthSuccess = true;
  mockSupportedTypes = [AuthenticationType.FINGERPRINT, AuthenticationType.FACIAL_RECOGNITION];
};
