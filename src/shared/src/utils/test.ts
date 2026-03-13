/**
 * Test Utilities
 * 
 * Common utilities for testing across the application
 */

import { User } from '../interfaces/security';

/**
 * Create a mock User object for testing
 * 
 * @param overrides - Partial User object to override defaults
 * @returns Mock User object
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    tenantId: 'tenant-1',
    roles: ['user'],
    ...overrides,
  };
}

/**
 * Create a mock admin User object for testing
 * 
 * @param overrides - Partial User object to override defaults
 * @returns Mock admin User object
 */
export function createMockAdminUser(overrides?: Partial<User>): User {
  return {
    id: 'admin-123',
    tenantId: 'tenant-1',
    roles: ['admin'],
    ...overrides,
  };
}

/**
 * Create a mock manager User object for testing
 * 
 * @param overrides - Partial User object to override defaults
 * @returns Mock manager User object
 */
export function createMockManagerUser(overrides?: Partial<User>): User {
  return {
    id: 'manager-123',
    tenantId: 'tenant-1',
    roles: ['manager'],
    ...overrides,
  };
}

/**
 * Create a mock super admin User object for testing
 * 
 * @param overrides - Partial User object to override defaults
 * @returns Mock super admin User object
 */
export function createMockSuperAdminUser(overrides?: Partial<User>): User {
  return {
    id: 'super-admin-123',
    tenantId: 'tenant-1',
    roles: ['super_admin'],
    ...overrides,
  };
}

/**
 * Wait for a specified duration (for testing async operations)
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified duration
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate random string for testing
 * 
 * @param length - Length of the string
 * @returns Random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random number within range
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random number
 */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random UUID for testing
 * 
 * @returns Random UUID string
 */
export const randomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
