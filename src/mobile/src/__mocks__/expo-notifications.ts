/**
 * Mock for expo-notifications
 */

let mockPermissionStatus = 'granted';
let mockPushToken = 'ExponentPushToken[mock-token-123]';

export const getPermissionsAsync = jest.fn(async () => ({
  status: mockPermissionStatus,
  granted: mockPermissionStatus === 'granted',
  canAskAgain: true,
}));

export const requestPermissionsAsync = jest.fn(async () => ({
  status: mockPermissionStatus,
  granted: mockPermissionStatus === 'granted',
  canAskAgain: true,
}));

export const getExpoPushTokenAsync = jest.fn(async (options?: any) => ({
  data: mockPushToken,
  type: 'expo',
}));

export const getDevicePushTokenAsync = jest.fn(async () => ({
  data: 'device-push-token-mock',
  type: 'ios',
}));

export const setNotificationHandler = jest.fn((handler: any) => {
  // Mock implementation
});

export const addNotificationReceivedListener = jest.fn((listener: any) => {
  return {
    remove: jest.fn(),
  };
});

export const addNotificationResponseReceivedListener = jest.fn((listener: any) => {
  return {
    remove: jest.fn(),
  };
});

export const scheduleNotificationAsync = jest.fn(async (content: any, trigger: any) => {
  return 'notification-id-mock';
});

export const cancelScheduledNotificationAsync = jest.fn(async (id: string) => {
  return Promise.resolve();
});

export const cancelAllScheduledNotificationsAsync = jest.fn(async () => {
  return Promise.resolve();
});

export const setNotificationChannelAsync = jest.fn(async (id: string, config: any) => {
  return Promise.resolve(config);
});

// Test helpers
export const __setPermissionStatus = (status: string) => {
  mockPermissionStatus = status;
};

export const __setPushToken = (token: string) => {
  mockPushToken = token;
};

export const __reset = () => {
  mockPermissionStatus = 'granted';
  mockPushToken = 'ExponentPushToken[mock-token-123]';
};
