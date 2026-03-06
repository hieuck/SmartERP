import { faker } from '@faker-js/faker';

/**
 * Customer Factory
 * Generates realistic test customer data
 */
export class CustomerFactory {
  /**
   * Create a single customer with optional overrides
   */
  static create(overrides?: Partial<any>): any {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    const customer = {
      id: faker.string.uuid(),
      code: `CUST-${faker.string.alphanumeric(6).toUpperCase()}`,
      name: fullName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number('09########'),
      address: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']),
      district: faker.location.county(),
      taxCode: faker.string.numeric(10),
      contactPerson: fullName,
      contactPhone: faker.phone.number('09########'),
      notes: faker.lorem.sentence(),
      creditLimit: faker.number.float({ min: 0, max: 100000000, fractionDigits: 0 }),
      currentDebt: 0,
      tenantId: 'test-tenant-001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return { ...customer, ...overrides };
  }

  /**
   * Create multiple customers
   */
  static createMany(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create customer with debt
   */
  static createWithDebt(overrides?: Partial<any>): any {
    const creditLimit = faker.number.float({ min: 10000000, max: 100000000, fractionDigits: 0 });
    const currentDebt = faker.number.float({ min: 1000000, max: creditLimit * 0.8, fractionDigits: 0 });
    
    return this.create({ ...overrides, creditLimit, currentDebt });
  }

  /**
   * Create customer for specific tenant
   */
  static createWithTenant(tenantId: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, tenantId });
  }

  /**
   * Create inactive customer
   */
  static createInactive(overrides?: Partial<any>): any {
    return this.create({ ...overrides, isActive: false });
  }
}
