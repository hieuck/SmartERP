import { faker } from '@faker-js/faker';

/**
 * Order Factory
 * Generates realistic test order data
 */
export class OrderFactory {
  /**
   * Create a single order with optional overrides
   */
  static create(overrides?: Partial<any>): any {
    const subtotal = faker.number.float({ min: 100000, max: 10000000, fractionDigits: 0 });
    const shippingFee = faker.number.float({ min: 0, max: 100000, fractionDigits: 0 });
    const discountAmount = faker.number.float({ min: 0, max: subtotal * 0.2, fractionDigits: 0 });
    const taxAmount = subtotal * 0.1; // 10% VAT

    const order = {
      id: faker.string.uuid(),
      orderNumber: `ORD-${faker.string.alphanumeric(10).toUpperCase()}`,
      customerId: faker.string.uuid(),
      orderDate: faker.date.recent(),
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'processing', 'completed', 'cancelled']),
      subtotal,
      taxAmount,
      shippingFee,
      discountAmount,
      totalAmount: subtotal + taxAmount + shippingFee - discountAmount,
      notes: faker.lorem.sentence(),
      tenantId: 'test-tenant-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return { ...order, ...overrides };
  }

  /**
   * Create multiple orders
   */
  static createMany(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create order with specific status
   */
  static createWithStatus(status: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, status });
  }

  /**
   * Create pending order
   */
  static createPending(overrides?: Partial<any>): any {
    return this.create({ ...overrides, status: 'pending' });
  }

  /**
   * Create completed order
   */
  static createCompleted(overrides?: Partial<any>): any {
    return this.create({ ...overrides, status: 'completed' });
  }

  /**
   * Create order for specific customer
   */
  static createForCustomer(customerId: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, customerId });
  }
}
