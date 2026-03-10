/**
 * Test Helpers
 * 
 * Common utilities for testing across the application
 */

import { User } from '../security/permission.service';

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
