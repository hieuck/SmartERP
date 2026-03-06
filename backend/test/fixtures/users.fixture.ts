export const userFixtures = {
  validUser: {
    email: 'user@test.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  },

  adminUser: {
    email: 'admin@test.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
  },

  invalidUsers: {
    noEmail: {
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    },
    invalidEmail: {
      email: 'invalid-email',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    },
    weakPassword: {
      email: 'test@test.com',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
    },
    noPassword: {
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
    },
  },
};

export const createUserDto = (overrides = {}) => ({
  ...userFixtures.validUser,
  ...overrides,
  email: `test-${Date.now()}@test.com`, // Unique email
});
