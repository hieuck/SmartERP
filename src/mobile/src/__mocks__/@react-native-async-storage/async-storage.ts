/**
 * Mock for @react-native-async-storage/async-storage
 */

const storage: { [key: string]: string } = {};

const AsyncStorage = {
  setItem: jest.fn(async (key: string, value: string) => {
    storage[key] = value;
    return Promise.resolve();
  }),

  getItem: jest.fn(async (key: string) => {
    return Promise.resolve(storage[key] || null);
  }),

  removeItem: jest.fn(async (key: string) => {
    delete storage[key];
    return Promise.resolve();
  }),

  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),

  clear: jest.fn(async () => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    return Promise.resolve();
  }),

  getAllKeys: jest.fn(async () => {
    return Promise.resolve(Object.keys(storage));
  }),

  multiGet: jest.fn(async (keys: string[]) => {
    return Promise.resolve(
      keys.map((key) => [key, storage[key] || null])
    );
  }),

  multiSet: jest.fn(async (keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  }),

  // Helper for tests
  __clearStorage: () => {
    Object.keys(storage).forEach((key) => delete storage[key]);
  },

  __getStorage: () => storage,
};

export default AsyncStorage;
