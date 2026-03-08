---
name: test-utilities-patterns
description: Test utilities patterns including factories, fixtures, builders, and mocks for clean and maintainable tests. Use when writing tests to reduce boilerplate and improve test quality.
---

# Test Utilities Patterns

## Vấn đề với Test Boilerplate

**Repetitive test setup code:**

```typescript
// ❌ Every test file has this boilerplate
describe('ProductService', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    sku: 'SKU-001',
    price: 100,
    stockQuantity: 50,
    category: 'Electronics',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    createdBy: 'user-123',
    updatedBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    roles: ['user'],
  };

  // ... 50 more lines of setup
});
```

**Problems:**

- ❌ Repetitive boilerplate in every test
- ❌ Hard to maintain (change structure = update all tests)
- ❌ No realistic data (always same values)
- ❌ Difficult to create complex scenarios

**Test Utilities = Reusable test data and mocks**

## Pattern 1: Factory Pattern

**For dynamic test data with realistic values:**

```typescript
// src/backend/common/test/factories/base.factory.ts
import { faker } from '@faker-js/faker';

export abstract class BaseFactory<T> {
  abstract create(overrides?: Partial<T>): T;

  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  createBatch(overridesArray: Array<Partial<T>>): T[] {
    return overridesArray.map((overrides) => this.create(overrides));
  }
}
```

### User Factory

```typescript
// src/backend/common/test/factories/user.factory.ts
import { BaseFactory } from './base.factory';
import { User } from '@/domains/auth/entities/user.entity';
import { faker } from '@faker-js/faker';

export class UserFactory extends BaseFactory<User> {
  create(overrides?: Partial<User>): User {
    return {
      id: faker.string.uuid(),
      tenantId: 'tenant-1',
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      roles: ['user'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static admin(overrides?: Partial<User>): User {
    return new UserFactory().create({
      roles: ['admin'],
      ...overrides,
    });
  }

  static viewer(overrides?: Partial<User>): User {
    return new UserFactory().create({
      roles: ['viewer'],
      ...overrides,
    });
  }

  static withTenant(tenantId: string, overrides?: Partial<User>): User {
    return new UserFactory().create({
      tenantId,
      ...overrides,
    });
  }
}
```

### Product Factory

```typescript
// src/backend/common/test/factories/product.factory.ts
import { BaseFactory } from './base.factory';
import { Product } from '@/domains/inventory/entities/product.entity';
import { faker } from '@faker-js/faker';

export class ProductFactory extends BaseFactory<Product> {
  create(overrides?: Partial<Product>): Product {
    return {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric(10).toUpperCase(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      stockQuantity: faker.number.int({ min: 0, max: 1000 }),
      category: faker.commerce.department(),
      status: 'ACTIVE',
      tenantId: 'tenant-1',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  }

  static outOfStock(overrides?: Partial<Product>): Product {
    return new ProductFactory().create({
      stockQuantity: 0,
      status: 'OUT_OF_STOCK',
      ...overrides,
    });
  }

  static discontinued(overrides?: Partial<Product>): Product {
    return new ProductFactory().create({
      status: 'DISCONTINUED',
      deletedAt: new Date(),
      ...overrides,
    });
  }
}
```

### Order Factory

```typescript
// src/backend/common/test/factories/order.factory.ts
import { BaseFactory } from './base.factory';
import { Order } from '@/domains/sales/entities/order.entity';
import { faker } from '@faker-js/faker';

export class OrderFactory extends BaseFactory<Order> {
  create(overrides?: Partial<Order>): Order {
    const items = overrides?.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return {
      id: faker.string.uuid(),
      orderNumber: `SO-${faker.string.numeric(6)}`,
      customerId: faker.string.uuid(),
      status: 'DRAFT',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: '',
      tenantId: 'tenant-1',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
      subtotal,
      tax,
      total,
    };
  }

  static pending(overrides?: Partial<Order>): Order {
    return new OrderFactory().create({
      status: 'PENDING',
      ...overrides,
    });
  }

  static completed(overrides?: Partial<Order>): Order {
    return new OrderFactory().create({
      status: 'COMPLETED',
      completedAt: new Date(),
      ...overrides,
    });
  }
}
```

### Usage

```typescript
import { UserFactory, ProductFactory, OrderFactory } from '@/common/test/factories';

describe('OrderService', () => {
  it('should create order', async () => {
    // ✅ Clean and readable
    const user = UserFactory.admin();
    const product = ProductFactory.create({ price: 100 });
    const order = OrderFactory.pending();

    // Test implementation
  });

  it('should handle multiple products', async () => {
    const products = ProductFactory.createMany(5);
    // Test with 5 products
  });

  it('should handle different tenants', async () => {
    const tenant1User = UserFactory.withTenant('tenant-1');
    const tenant2User = UserFactory.withTenant('tenant-2');
    // Test tenant isolation
  });
});
```

## Pattern 2: Fixture Pattern

**For static, predefined test data:**

```typescript
// src/backend/common/test/fixtures/users.fixture.ts
import { User } from '@/domains/auth/entities/user.entity';

export const usersFixture = {
  admin: {
    id: 'user-admin',
    tenantId: 'tenant-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as User,

  viewer: {
    id: 'user-viewer',
    tenantId: 'tenant-1',
    email: 'viewer@example.com',
    firstName: 'Viewer',
    lastName: 'User',
    roles: ['viewer'],
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as User,

  manager: {
    id: 'user-manager',
    tenantId: 'tenant-1',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    roles: ['manager'],
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as User,
};
```

```typescript
// src/backend/common/test/fixtures/products.fixture.ts
import { Product } from '@/domains/inventory/entities/product.entity';

export const productsFixture = {
  laptop: {
    id: 'prod-laptop',
    sku: 'LAPTOP-001',
    name: 'Laptop Dell XPS 15',
    price: 1500,
    stockQuantity: 10,
    category: 'Electronics',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    createdBy: 'user-admin',
    updatedBy: 'user-admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  } as Product,

  mouse: {
    id: 'prod-mouse',
    sku: 'MOUSE-001',
    name: 'Wireless Mouse',
    price: 25,
    stockQuantity: 100,
    category: 'Electronics',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    createdBy: 'user-admin',
    updatedBy: 'user-admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  } as Product,
};
```

```typescript
// src/backend/common/test/fixtures/index.ts
export { usersFixture } from './users.fixture';
export { productsFixture } from './products.fixture';

export const fixtures = {
  users: usersFixture,
  products: productsFixture,
};
```

### Usage

```typescript
import { fixtures } from '@/common/test/fixtures';

describe('ProductService', () => {
  it('should find laptop product', async () => {
    // ✅ Use predefined fixture
    const laptop = fixtures.products.laptop;

    mockRepository.findOne.mockResolvedValue(laptop);

    const result = await service.findById(fixtures.users.admin, laptop.id);

    expect(result).toEqual(laptop);
  });
});
```

## Pattern 3: Builder Pattern

**For complex objects with many optional fields:**

```typescript
// src/backend/common/test/builders/order.builder.ts
import { Order, OrderItem } from '@/domains/sales/entities/order.entity';
import { faker } from '@faker-js/faker';

export class OrderBuilder {
  private order: Partial<Order> = {
    id: faker.string.uuid(),
    orderNumber: `SO-${faker.string.numeric(6)}`,
    status: 'DRAFT',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    tenantId: 'tenant-1',
    createdBy: 'user-123',
    updatedBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  withId(id: string): this {
    this.order.id = id;
    return this;
  }

  withOrderNumber(orderNumber: string): this {
    this.order.orderNumber = orderNumber;
    return this;
  }

  withCustomer(customerId: string): this {
    this.order.customerId = customerId;
    return this;
  }

  withStatus(status: Order['status']): this {
    this.order.status = status;
    return this;
  }

  addItem(productId: string, quantity: number, price: number): this {
    const item: OrderItem = {
      id: faker.string.uuid(),
      productId,
      quantity,
      price,
      total: quantity * price,
    };

    this.order.items = [...(this.order.items || []), item];
    this.recalculateTotals();
    return this;
  }

  withTax(taxRate: number): this {
    this.order.tax = this.order.subtotal! * taxRate;
    this.order.total = this.order.subtotal! + this.order.tax;
    return this;
  }

  withNotes(notes: string): this {
    this.order.notes = notes;
    return this;
  }

  withTenant(tenantId: string): this {
    this.order.tenantId = tenantId;
    return this;
  }

  private recalculateTotals(): void {
    this.order.subtotal = this.order.items!.reduce((sum, item) => sum + item.total, 0);
    this.order.total = this.order.subtotal + (this.order.tax || 0);
  }

  build(): Order {
    return this.order as Order;
  }
}
```

### Usage

```typescript
import { OrderBuilder } from '@/common/test/builders';

describe('OrderService', () => {
  it('should calculate order total correctly', async () => {
    // ✅ Fluent API for complex objects
    const order = new OrderBuilder()
      .withCustomer('cust-1')
      .withStatus('PENDING')
      .addItem('prod-1', 2, 100) // 2 × $100 = $200
      .addItem('prod-2', 1, 50) // 1 × $50 = $50
      .withTax(0.1) // 10% tax
      .withNotes('Test order')
      .build();

    expect(order.subtotal).toBe(250);
    expect(order.tax).toBe(25);
    expect(order.total).toBe(275);
  });

  it('should handle multiple scenarios', async () => {
    const draftOrder = new OrderBuilder().withStatus('DRAFT').build();

    const pendingOrder = new OrderBuilder().withStatus('PENDING').addItem('prod-1', 1, 100).build();

    const completedOrder = new OrderBuilder()
      .withStatus('COMPLETED')
      .addItem('prod-1', 2, 100)
      .withTax(0.1)
      .build();

    // Test different scenarios
  });
});
```

## Pattern 4: Mock Utilities

**Reusable mock implementations:**

```typescript
// src/backend/common/test/mocks/repository.mock.ts
export function mockSecureRepository<T>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}
```

```typescript
// src/backend/common/test/mocks/cache.mock.ts
export function mockCacheService() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidate: jest.fn(),
  };
}
```

```typescript
// src/backend/common/test/mocks/permission.mock.ts
export function mockPermissionService(defaultPermissions = true) {
  return {
    canRead: jest.fn().mockResolvedValue(defaultPermissions),
    canWrite: jest.fn().mockResolvedValue(defaultPermissions),
    canDelete: jest.fn().mockResolvedValue(defaultPermissions),
    hasRole: jest.fn().mockReturnValue(defaultPermissions),
  };
}
```

### Usage

```typescript
import { mockSecureRepository, mockCacheService, mockPermissionService } from '@/common/test/mocks';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepo: ReturnType<typeof mockSecureRepository>;
  let mockCache: ReturnType<typeof mockCacheService>;
  let mockPermission: ReturnType<typeof mockPermissionService>;

  beforeEach(() => {
    mockRepo = mockSecureRepository<Product>();
    mockCache = mockCacheService();
    mockPermission = mockPermissionService();

    service = new ProductService(mockRepo, mockCache, mockPermission);
  });

  it('should use cache', async () => {
    const product = ProductFactory.create();

    mockCache.getOrSet.mockResolvedValue(product);

    const result = await service.findById(UserFactory.admin(), product.id);

    expect(mockCache.getOrSet).toHaveBeenCalled();
    expect(result).toEqual(product);
  });
});
```

## Complete Example

```typescript
// product.service.spec.ts
import { Test } from '@nestjs/testing';
import { ProductService } from './product.service';
import { UserFactory, ProductFactory } from '@/common/test/factories';
import { fixtures } from '@/common/test/fixtures';
import { mockSecureRepository, mockCacheService, mockPermissionService } from '@/common/test/mocks';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepo: ReturnType<typeof mockSecureRepository>;
  let mockCache: ReturnType<typeof mockCacheService>;
  let mockPermission: ReturnType<typeof mockPermissionService>;

  beforeEach(async () => {
    mockRepo = mockSecureRepository<Product>();
    mockCache = mockCacheService();
    mockPermission = mockPermissionService();

    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: 'ProductRepository', useValue: mockRepo },
        { provide: 'CacheService', useValue: mockCache },
        { provide: 'PermissionService', useValue: mockPermission },
      ],
    }).compile();

    service = module.get(ProductService);
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // ✅ Use factory for dynamic data
      const products = ProductFactory.createMany(5);
      const user = UserFactory.admin();

      mockRepo.find.mockResolvedValue(products);

      const result = await service.findAll(user);

      expect(result).toEqual(products);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: user.tenantId },
        }),
      );
    });

    it('should deny access without permission', async () => {
      const user = UserFactory.viewer();

      mockPermission.canRead.mockResolvedValue(false);

      await expect(service.findAll(user)).rejects.toThrow('Permission denied');
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      // ✅ Use fixture for known data
      const laptop = fixtures.products.laptop;
      const admin = fixtures.users.admin;

      mockCache.getOrSet.mockResolvedValue(laptop);

      const result = await service.findById(admin, laptop.id);

      expect(result).toEqual(laptop);
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const user = UserFactory.admin();
      const productData = {
        sku: 'NEW-001',
        name: 'New Product',
        price: 100,
      };

      mockRepo.save.mockResolvedValue({
        ...productData,
        id: 'new-id',
        tenantId: user.tenantId,
        createdBy: user.id,
      });

      const result = await service.create(user, productData);

      expect(result.id).toBeDefined();
      expect(result.tenantId).toBe(user.tenantId);
      expect(result.createdBy).toBe(user.id);
    });
  });
});
```

## Best Practices

### 1. Use Factories for Dynamic Data

```typescript
// ✅ Good - Unique data per test
const user1 = UserFactory.create();
const user2 = UserFactory.create();
expect(user1.id).not.toBe(user2.id);

// ❌ Bad - Same data causes conflicts
const user1 = { id: '1', email: 'test@example.com' };
const user2 = { id: '1', email: 'test@example.com' };
```

### 2. Use Fixtures for Reference Data

```typescript
// ✅ Good - Consistent reference data
const admin = fixtures.users.admin;
const laptop = fixtures.products.laptop;

// ❌ Bad - Hardcoded values
const admin = { id: 'user-admin', roles: ['admin'] };
```

### 3. Use Builders for Complex Objects

```typescript
// ✅ Good - Readable and flexible
const order = new OrderBuilder()
  .withCustomer('cust-1')
  .addItem('prod-1', 2, 100)
  .withTax(0.1)
  .build();

// ❌ Bad - Verbose and error-prone
const order = {
  id: '1',
  customerId: 'cust-1',
  items: [{ productId: 'prod-1', quantity: 2, price: 100, total: 200 }],
  subtotal: 200,
  tax: 20,
  total: 220,
};
```

### 4. Organize Test Utilities

```
src/backend/common/test/
├── index.ts              # Export all utilities
├── factories/
│   ├── index.ts
│   ├── base.factory.ts
│   ├── user.factory.ts
│   ├── product.factory.ts
│   └── order.factory.ts
├── fixtures/
│   ├── index.ts
│   ├── users.fixture.ts
│   └── products.fixture.ts
├── builders/
│   ├── index.ts
│   └── order.builder.ts
└── mocks/
    ├── index.ts
    ├── repository.mock.ts
    ├── cache.mock.ts
    └── permission.mock.ts
```

## Test Utilities Checklist

- [ ] ✅ Factory classes for all entities
- [ ] ✅ Fixtures for reference data
- [ ] ✅ Builders for complex objects
- [ ] ✅ Mock utilities for services
- [ ] ✅ Centralized exports (index.ts)
- [ ] ✅ Faker for realistic data
- [ ] ✅ Type-safe implementations
- [ ] ✅ Documentation and examples

## Expected Impact

**Before Test Utilities:**

- Test writing time: 30 min/test
- Test maintenance: High
- Code duplication: 70%

**After Test Utilities:**

- Test writing time: 15 min/test (-50%)
- Test maintenance: Low (-40%)
- Code duplication: 20% (-70%)

## Summary

Test Utilities = **Reusable test data and mocks**

- ✅ Factories for dynamic data
- ✅ Fixtures for static data
- ✅ Builders for complex objects
- ✅ Mocks for services
- ✅ Reduce boilerplate by 70%
- ✅ Improve test maintainability

**Goal: Write tests faster with less code**
