/**
 * User Factory
 * Generate test user data
 */

import { User } from '@core/user/entities/user.entity';

let userIdCounter = 1;

export const createMockUser = (overrides?: Partial<User>): User => {
  const id = `user-${userIdCounter++}`;
  
  return {
    id,
    email: `user${userIdCounter}@example.com`,
    password: '$2b$10$hashedpassword', // bcrypt hash of 'password123'
    firstName: 'Test',
    lastName: 'User',
    phone: '+84901234567',
    status: 'active',
    role: 'user',
    tenantId: 'test-tenant-id',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
  } as User;
};

export const createMockUsers = (count: number, overrides?: Partial<User>): User[] => {
  return Array.from({ length: count }, () => createMockUser(overrides));
};

export const resetUserFactory = () => {
  userIdCounter = 1;
};
