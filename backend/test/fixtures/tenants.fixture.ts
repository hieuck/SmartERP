export const tenantFixtures = {
  validTenant: {
    name: 'Test Company',
    subdomain: 'testcompany',
    email: 'contact@testcompany.com',
    phone: '+84123456789',
    address: '123 Test Street',
    city: 'Ho Chi Minh',
    country: 'Vietnam',
  },

  premiumTenant: {
    name: 'Premium Company',
    subdomain: 'premiumco',
    email: 'contact@premiumco.com',
    phone: '+84987654321',
    address: '456 Premium Ave',
    city: 'Hanoi',
    country: 'Vietnam',
    plan: 'premium',
  },

  invalidTenants: {
    noName: {
      subdomain: 'test',
      email: 'test@test.com',
    },
    invalidSubdomain: {
      name: 'Test',
      subdomain: 'test company', // spaces not allowed
      email: 'test@test.com',
    },
    duplicateSubdomain: {
      name: 'Test',
      subdomain: 'testcompany', // already exists
      email: 'test@test.com',
    },
  },
};

export const createTenantDto = (overrides = {}) => ({
  ...tenantFixtures.validTenant,
  ...overrides,
  subdomain: `test-${Date.now()}`, // Unique subdomain
  email: `contact-${Date.now()}@test.com`, // Unique email
});
