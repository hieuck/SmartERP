import { faker } from '@faker-js/faker';

/**
 * User Factory
 * Generates realistic test user data
 */
export class UserFactory {
  /**
   * Create a single user with optional overrides
   */
  static create(overrides?: Partial<any>): any {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const user = {
      id: faker.string.uuid(),
      username: faker.internet.userName({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      passwordHash: '$2b$10$hashedpassword', // Pre-hashed test password
      firstName,
      lastName,
      phone: faker.phone.number('09########'),
      role: faker.helpers.arrayElement(['admin', 'manager', 'staff', 'viewer']),
      tenantId: 'test-tenant-001',
      isActive: true,
      lastLoginAt: faker.date.recent(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return { ...user, ...overrides };
  }

  /**
   * Create multiple users
   */
  static createMany(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create admin user
   */
  static createAdmin(overrides?: Partial<any>): any {
    return this.create({ ...overrides, role: 'admin' });
  }

  /**
   * Create manager user
   */
  static createManager(overrides?: Partial<any>): any {
    return this.create({ ...overrides, role: 'manager' });
  }

  /**
   * Create staff user
   */
  static createStaff(overrides?: Partial<any>): any {
    return this.create({ ...overrides, role: 'staff' });
  }

  /**
   * Create viewer user (read-only)
   */
  static createViewer(overrides?: Partial<any>): any {
    return this.create({ ...overrides, role: 'viewer' });
  }

  /**
   * Create user for specific tenant
   */
  static createWithTenant(tenantId: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, tenantId });
  }

  /**
   * Create inactive user
   */
  static createInactive(overrides?: Partial<any>): any {
    return this.create({ ...overrides, isActive: false });
  }
}
