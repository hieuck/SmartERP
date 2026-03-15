/**
 * Mock for expo-secure-store
 */

const secureStorage: { [key: string]: string } = {};

export const setItemAsync = jest.fn(async (key: string, value: string, options?: any) => {
  secureStorage[key] = value;
  return Promise.resolve();
});

export const getItemAsync = jest.fn(async (key: string, options?: any) => {
  return Promise.resolve(secureStorage[key] || null);
});

export const deleteItemAsync = jest.fn(async (key: string, options?: any) => {
  delete secureStorage[key];
  return Promise.resolve();
});

// Test helpers
export const __clearStorage = () => {
  Object.keys(secureStorage).forEach((key) => delete secureStorage[key]);
};

export const __getStorage = () => secureStorage;
