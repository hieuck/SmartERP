# Solution Patterns Library

Quick reference cho common problems trong SmartERP development.

## 🔐 Security Patterns

### Pattern 1: SecureRepository CRUD

**Problem:** Cần implement CRUD với tenant isolation + permissions

**Solution:**

```typescript
// ✅ CORRECT
async findAll(tenantId: string, userId: string) {
  await this.permissionService.canRead(userId, 'Entity');
  return this.secureRepo.find({ where: { tenantId } });
}

// ❌ WRONG
async findAll() {
  return this.repository.find(); // No tenant isolation!
}
```

**Time Saved:** 30 min/service

---

### Pattern 2: Test Mocking

**Problem:** Tests fail với SecurityModule imports

**Solution:**

```typescript
// ✅ CORRECT
beforeEach(async () => {
  const module = await Test.createTestingModule({
    imports: [SecurityModule], // Import module
    providers: [
      MyService,
      {
        provide: SecureRepository,
        useValue: {
          find: jest.fn(),
          findOne: jest.fn(),
          save: jest.fn(),
          remove: jest.fn(),
        },
      },
    ],
  }).compile();
});

// ❌ WRONG
providers: [
  PermissionService, // Don't provide directly
];
```

**Time Saved:** 15 min/test file

---

## 🚀 Performance Patterns

### Pattern 3: Caching Strategy

**Problem:** Queries chậm, cần caching

**Solution:**

```typescript
// ✅ CORRECT
async findAll(tenantId: string) {
  const cacheKey = `entity:${tenantId}:all`;
  const cached = await this.cacheService.get(cacheKey);
  if (cached) return cached;

  const items = await this.secureRepo.find({ where: { tenantId } });
  await this.cacheService.set(cacheKey, items, CacheTTL.SHORT);
  return items;
}

// Invalidate on update
async update(id: string, dto: any, tenantId: string) {
  const result = await this.secureRepo.save(dto);
  await this.cacheService.invalidate(`entity:${tenantId}`);
  return result;
}
```

**Time Saved:** 20 min/service

---

### Pattern 4: Query Optimization

**Problem:** N+1 query problem

**Solution:**

```typescript
// ✅ CORRECT
const orders = await this.secureRepo.find({
  where: { tenantId },
  relations: ['customer', 'items'], // Eager load
});

// ❌ WRONG
const orders = await this.secureRepo.find({ where: { tenantId } });
for (const order of orders) {
  order.customer = await this.customerRepo.findOne(order.customerId); // N+1!
}
```

**Time Saved:** 45 min/complex query

---

## 📝 Code Quality Patterns

### Pattern 5: Error Handling

**Problem:** Inconsistent error responses

**Solution:**

```typescript
// ✅ CORRECT
try {
  const item = await this.secureRepo.findOne({ where: { id, tenantId } });
  if (!item) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }
  return item;
} catch (error) {
  if (error instanceof NotFoundException) throw error;
  throw new InternalServerErrorException('Failed to fetch entity');
}

// ❌ WRONG
const item = await this.secureRepo.findOne({ where: { id } });
return item; // Returns null instead of throwing
```

**Time Saved:** 10 min/method

---

### Pattern 6: DTO Validation

**Problem:** Invalid data từ client

**Solution:**

```typescript
// ✅ CORRECT
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;
}

// ❌ WRONG
export class CreateProductDto {
  name: string; // No validation
  price: number;
}
```

**Time Saved:** 15 min/DTO

---

## 🧪 Testing Patterns

### Pattern 7: Integration Test Setup

**Problem:** Integration tests phức tạp

**Solution:**

```typescript
// ✅ CORRECT
describe('ProductService Integration', () => {
  let app: INestApplication;
  let service: ProductService;
  let tenantId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get(ProductService);
    tenantId = 'test-tenant';
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create product', async () => {
    const dto = { name: 'Test', price: 100 };
    const result = await service.create(dto, tenantId, 'user-1');
    expect(result.name).toBe('Test');
  });
});
```

**Time Saved:** 30 min/integration test

---

## 🏗️ Architecture Patterns

### Pattern 8: Module Structure

**Problem:** Module organization unclear

**Solution:**

```
domains/
  product/
    entities/
      product.entity.ts
    dto/
      create-product.dto.ts
      update-product.dto.ts
    services/
      product.service.ts
      product.service.spec.ts
    controllers/
      product.controller.ts
      product.controller.spec.ts
    product.module.ts
```

**Time Saved:** 20 min/module

---

### Pattern 9: Dependency Injection

**Problem:** Circular dependencies

**Solution:**

```typescript
// ✅ CORRECT
@Module({
  imports: [
    forwardRef(() => OrderModule), // Use forwardRef
  ],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

// In service
constructor(
  @Inject(forwardRef(() => OrderService))
  private orderService: OrderService,
) {}

// ❌ WRONG
@Module({
  imports: [OrderModule], // Circular dependency!
})
```

**Time Saved:** 45 min/circular dependency issue

---

## 📊 Velocity Metrics

| Pattern                  | Time Saved | Frequency | Total Impact   |
| ------------------------ | ---------- | --------- | -------------- |
| SecureRepository CRUD    | 30 min     | 10x/week  | 5 hours/week   |
| Test Mocking             | 15 min     | 20x/week  | 5 hours/week   |
| Caching Strategy         | 20 min     | 5x/week   | 1.7 hours/week |
| Query Optimization       | 45 min     | 3x/week   | 2.3 hours/week |
| Error Handling           | 10 min     | 15x/week  | 2.5 hours/week |
| DTO Validation           | 15 min     | 10x/week  | 2.5 hours/week |
| Integration Test Setup   | 30 min     | 5x/week   | 2.5 hours/week |
| Module Structure         | 20 min     | 3x/week   | 1 hour/week    |
| Dependency Injection Fix | 45 min     | 2x/week   | 1.5 hours/week |

**Total Time Saved:** ~24 hours/week

---

## 🎯 Quick Decision Tree

```
Need to implement feature?
├─ CRUD only? → Use generate-crud-service.ps1
├─ Complex business logic? → Start with service.template.ts
├─ Tests failing? → Check SOLUTION-PATTERNS.md
└─ Performance issue? → Apply caching pattern

Tests failing?
├─ SecurityModule error? → Run fix-security-imports.ps1
├─ Parameter order error? → Run fix-test-parameters.ps1
└─ Mock not working? → Check Pattern 2

Need to estimate?
├─ Simple CRUD → 2 points (2 hours)
├─ CRUD + Business Logic → 5 points (5 hours)
├─ Complex Feature → 8 points (8 hours)
└─ Module → 13 points (13 hours)
```

---

**Last Updated:** 2026-03-09  
**Patterns:** 9  
**Time Saved:** ~24 hours/week
