---
name: backend-testing-patterns
description: Comprehensive testing patterns for NestJS backend including unit tests, integration tests, E2E tests, and workflow testing. Use when writing tests for services, controllers, or complex business logic with SecureRepository.
---

# Backend Testing Patterns

## Test Pyramid Strategy

```
        /\
       /E2E\      10% - Full system tests
      /------\
     /Integration\ 30% - API + DB tests
    /------------\
   /  Unit Tests  \ 60% - Service logic tests
  /----------------\
```

## 1. Unit Tests (Services)

### ✅ Correct Pattern - SecureRepository Mocking

```typescript
describe('ProductService', () => {
  let service: ProductService;

  const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
  const mockProduct = { id: '1', name: 'Product 1', tenantId: 'tenant-1' };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    // Mock SecureRepository methods AFTER service creation
    jest.spyOn(service['secureProductRepo'], 'find').mockResolvedValue([mockProduct]);
    jest
      .spyOn(service['secureProductRepo'], 'save')
      .mockImplementation(async (user, data) => ({ ...mockProduct, ...data }));
  });

  it('should find all products with tenant isolation', async () => {
    const result = await service.findAll(mockUser);

    expect(result).toEqual([mockProduct]);
    expect(service['secureProductRepo'].find).toHaveBeenCalledWith(
      mockUser,
      expect.objectContaining({ where: expect.any(Object) }),
    );
  });
});
```

## 2. Integration Tests (API + Database)

### ✅ Test với Real Database

```typescript
describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule], // Full app with real DB
    }).compile();

    app = module.createNestApplication();
    await app.init();

    productRepository = module.get(getRepositoryToken(Product));
  });

  beforeEach(async () => {
    await productRepository.clear(); // Clean DB
  });

  it('POST /products should create product with audit trail', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ name: 'New Product', price: 100 })
      .expect(201);

    expect(response.body.data).toMatchObject({
      name: 'New Product',
      createdBy: expect.any(String),
      tenantId: expect.any(String),
    });

    // Verify in DB
    const product = await productRepository.findOne({
      where: { id: response.body.data.id },
    });
    expect(product.createdBy).toBeDefined();
  });
});
```

## 3. E2E Tests (Full Workflows)

### ✅ Test Complete Business Flow

```typescript
describe('Purchase Order Workflow (E2E)', () => {
  it('should complete full PO approval workflow', async () => {
    // 1. Create PO as requester
    const createResponse = await request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send(poData)
      .expect(201);

    const poId = createResponse.body.data.id;
    expect(createResponse.body.data.status).toBe('DRAFT');

    // 2. Submit for approval
    await request(app.getHttpServer())
      .post(`/purchase-orders/${poId}/submit`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .expect(200);

    // 3. Approve as manager
    await request(app.getHttpServer())
      .post(`/purchase-orders/${poId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    // 4. Verify final state
    const finalResponse = await request(app.getHttpServer())
      .get(`/purchase-orders/${poId}`)
      .set('Authorization', `Bearer ${requesterToken}`)
      .expect(200);

    expect(finalResponse.body.data.status).toBe('APPROVED');
    expect(finalResponse.body.data.approvedBy).toBe(managerId);
  });
});
```

## 4. Security Testing

### ✅ Test Tenant Isolation

```typescript
describe('Tenant Isolation', () => {
  it('should not access other tenant data', async () => {
    // Create product for tenant-1
    const product1 = await productRepository.save({
      name: 'Product 1',
      tenantId: 'tenant-1',
    });

    // Try to access as tenant-2
    const response = await request(app.getHttpServer())
      .get(`/products/${product1.id}`)
      .set('Authorization', `Bearer ${tenant2Token}`)
      .expect(404); // Should not find

    expect(response.body.error).toContain('not found');
  });
});
```

### ✅ Test Permission Checks

```typescript
describe('Permission Checks', () => {
  it('should deny access without permission', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer ${readOnlyUserToken}`)
      .expect(403);
  });
});
```

## 5. Workflow Testing

### ✅ Test State Transitions

```typescript
describe('Order Status Workflow', () => {
  it('should allow valid transitions', async () => {
    const order = await createOrder({ status: 'DRAFT' });

    // DRAFT → SUBMITTED (valid)
    await service.updateStatus(order.id, 'SUBMITTED', mockUser);
    expect(order.status).toBe('SUBMITTED');

    // SUBMITTED → APPROVED (valid)
    await service.updateStatus(order.id, 'APPROVED', mockUser);
    expect(order.status).toBe('APPROVED');
  });

  it('should reject invalid transitions', async () => {
    const order = await createOrder({ status: 'DRAFT' });

    // DRAFT → APPROVED (invalid, must go through SUBMITTED)
    await expect(service.updateStatus(order.id, 'APPROVED', mockUser)).rejects.toThrow(
      'Invalid status transition',
    );
  });
});
```

## 6. Performance Testing

### ✅ Test N+1 Query Issues

```typescript
describe('Performance', () => {
  it('should not have N+1 queries', async () => {
    // Create 100 products with categories
    await createManyProducts(100);

    const queryCount = await countQueries(async () => {
      await service.findAllWithCategories(mockUser);
    });

    expect(queryCount).toBeLessThanOrEqual(2); // 1 for products, 1 for categories
  });
});
```

## Test Checklist

Before merging, verify:

- [ ] ✅ Unit tests cover service logic (60% of tests)
- [ ] ✅ Integration tests cover API endpoints (30% of tests)
- [ ] ✅ E2E tests cover critical workflows (10% of tests)
- [ ] ✅ Security tests verify tenant isolation
- [ ] ✅ Security tests verify permission checks
- [ ] ✅ Workflow tests verify state transitions
- [ ] ✅ Tests mock SecureRepository (not raw TypeORM)
- [ ] ✅ Coverage > 80% for critical paths
- [ ] ✅ No N+1 query issues
- [ ] ✅ Audit trail tested (createdBy, updatedBy)
