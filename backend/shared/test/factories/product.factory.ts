import { faker } from '@faker-js/faker';

/**
 * Product Factory
 * Generates realistic test product data using faker
 */
export class ProductFactory {
  /**
   * Create a single product with optional overrides
   */
  static create(overrides?: Partial<any>): any {
    const product = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      sku: `PROD-${faker.string.alphanumeric(8).toUpperCase()}`,
      description: faker.commerce.productDescription(),
      unit: faker.helpers.arrayElement(['cái', 'kg', 'hộp', 'thùng', 'm2', 'lít']),
      purchasePrice: faker.number.float({ min: 10000, max: 1000000, fractionDigits: 0 }),
      salePrice: faker.number.float({ min: 20000, max: 2000000, fractionDigits: 0 }),
      categoryId: faker.string.uuid(),
      barcode: faker.string.numeric(13),
      qrCode: faker.string.alphanumeric(20),
      minStock: faker.number.int({ min: 10, max: 100 }),
      maxStock: faker.number.int({ min: 200, max: 1000 }),
      tenantId: 'test-tenant-001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return { ...product, ...overrides };
  }

  /**
   * Create multiple products
   */
  static createMany(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create product for specific tenant
   */
  static createWithTenant(tenantId: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, tenantId });
  }

  /**
   * Create product with specific category
   */
  static createWithCategory(categoryId: string, overrides?: Partial<any>): any {
    return this.create({ ...overrides, categoryId });
  }

  /**
   * Create product with low stock (for testing alerts)
   */
  static createLowStock(overrides?: Partial<any>): any {
    return this.create({
      ...overrides,
      minStock: 50,
      maxStock: 200,
    });
  }
}
