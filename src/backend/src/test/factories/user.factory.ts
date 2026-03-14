/**
 * User Test Factory
 * Creates mock user objects for testing
 */

import { User as UserEntity } from '@/core/user/entities/user.entity';

export const createMockUser = (overrides?: Partial<UserEntity>): UserEntity => {
  const defaultUser: UserEntity = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    phone: '+84901234567',
    avatar: null,
    tenantId: 'test-tenant-id',
    role: 'user',
    status: 'active',
    emailVerified: true,
    emailVerificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    tenant: null,
    ...overrides,
  } as UserEntity;

  return defaultUser;
};

export const createMockAdminUser = (overrides?: Partial<UserEntity>): UserEntity => {
  return createMockUser({
    role: 'admin',
    email: 'admin@example.com',
    ...overrides,
  });
};
