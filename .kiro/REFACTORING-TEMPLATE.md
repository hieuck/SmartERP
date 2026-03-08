# SecureRepository Refactoring Template

**Based on:** Accounting Service (good example) + Odoo/ERPNext research  
**Purpose:** Step-by-step guide to refactor services to SecureRepository pattern

---

## 📋 BEFORE YOU START

**Prerequisites:**

- ✅ Read `.kiro/ODOO-ERPNEXT-SALES-CRM-RESEARCH.md`
- ✅ Review `domains/accounting/account/accounting.service.ts` (reference)
- ✅ Understand SecureRepository pattern
- ✅ Have test file ready

**Time Estimate:**

- Simple service: 30-45 min
- Complex service: 1-2 hours

---

## 🔧 STEP 1: UPDATE SERVICE CONSTRUCTOR

### Before (BAD):

```typescript
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cacheService: CacheService,
  ) {}
}
```

### After (GOOD):

```typescript
@Injectable()
export class OrderService {
  private secureOrderRepo: SecureRepository<Order>;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService, // ADD THIS
  ) {
    // Initialize SecureRepository
    this.secureOrderRepo = new SecureRepository(
      orderRepository,
      permissionService,
      'Order', // Entity name for permissions
    );
  }
}
```

**Changes:**

1. Add `PermissionService` to constructor
2. Declare `private secureOrderRepo: SecureRepository<T>`
3. Initialize in constructor with entity name

---

## 🔧 STEP 2: UPDATE METHOD SIGNATURES

### Rule: User Parameter FIRST

### Before (BAD):

```typescript
async findAllOrders(tenantId: string): Promise<Order[]> {
  return this.orderRepository.find({ where: { tenantId } });
}

async createOrder(data: CreateOrderDto, tenantId: string): Promise<Order> {
  const order = this.orderRepository.create({ ...data, tenantId });
  return this.orderRepository.save(order);
}
```

### After (GOOD):

```typescript
async findAllOrders(user: User, filters?: OrderFilters): Promise<Order[]> {
  const where: any = {};
  if (filters?.status) where.status = filters.status;

  return this.secureOrderRepo.find(user, {
    where,
    order: { createdAt: 'DESC' },
  });
}

async createOrder(user: User, data: CreateOrderDto): Promise<Order> {
  return this.secureOrderRepo.save(user, data);
}
```

**Changes:**

1. Replace `tenantId: string` with `user: User` as FIRST parameter
2. Use `secureOrderRepo` instead of `orderRepository`
3. Remove manual `tenantId` assignment (SecureRepository handles it)

---

## 🔧 STEP 3: UPDATE FIND OPERATIONS

### Before (BAD):

```typescript
async findOrderById(id: string, tenantId: string): Promise<Order> {
  const order = await this.orderRepository.findOne({
    where: { id, tenantId },
  });

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  return order;
}
```

### After (GOOD):

```typescript
async findOrderById(user: User, id: string): Promise<Order> {
  const cacheKey = generateCacheKey('order', user.tenantId, id);

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const order = await this.secureOrderRepo.findOne(user, {
        where: { id }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    },
    CacheTTL.MEDIUM,
  );
}
```

**Changes:**

1. Add caching with tenant-aware key
2. Use `secureOrderRepo.findOne(user, ...)`
3. Remove manual `tenantId` in where clause

---

## 🔧 STEP 4: UPDATE CREATE/UPDATE OPERATIONS

### Before (BAD):

```typescript
async updateOrder(id: string, data: UpdateOrderDto, tenantId: string): Promise<Order> {
  await this.orderRepository.update({ id, tenantId }, data);
  return this.findOrderById(id, tenantId);
}
```

### After (GOOD):

```typescript
async updateOrder(user: User, id: string, data: UpdateOrderDto): Promise<Order> {
  const order = await this.findOrderById(user, id);
  Object.assign(order, data);

  const updated = await this.secureOrderRepo.save(user, order);

  // Invalidate cache
  const cacheKey = generateCacheKey('order', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}
```

**Changes:**

1. Find existing entity first
2. Use `Object.assign` to merge changes
3. Use `secureOrderRepo.save(user, entity)`
4. Invalidate cache after update

---

## 🔧 STEP 5: UPDATE DELETE OPERATIONS

### Before (BAD):

```typescript
async deleteOrder(id: string, tenantId: string): Promise<void> {
  await this.orderRepository.softDelete({ id, tenantId });
}
```

### After (GOOD):

```typescript
async deleteOrder(user: User, id: string): Promise<void> {
  const order = await this.findOrderById(user, id);
  await this.secureOrderRepo.remove(user, order);

  // Invalidate cache
  const cacheKey = generateCacheKey('order', user.tenantId, id);
  await this.cacheService.del(cacheKey);
}
```

**Changes:**

1. Find entity first (for permission check)
2. Use `secureOrderRepo.remove(user, entity)`
3. Invalidate cache after delete

---

## 🔧 STEP 6: ADD DOCUMENT NUMBERING (ERPNext Style)

### Add Helper Method:

```typescript
private async generateOrderNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.orderRepository.count({
    where: { tenantId },
  });

  return `SO-${year}-${String(count + 1).padStart(5, '0')}`;
}
```

### Use in Create:

```typescript
async createOrder(user: User, data: CreateOrderDto): Promise<Order> {
  const orderNumber = await this.generateOrderNumber(user.tenantId);

  const order = {
    ...data,
    orderNumber,
    status: OrderStatus.DRAFT,
  };

  return this.secureOrderRepo.save(user, order);
}
```

---

## 🔧 STEP 7: UPDATE TESTS

### Before (BAD):

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(), // ❌ BAD
};
```

### After (GOOD):

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

const mockPermissionService = {
  canRead: jest.fn().mockResolvedValue(true),
  canWrite: jest.fn().mockResolvedValue(true),
  canDelete: jest.fn().mockResolvedValue(true),
  buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
};

const mockCacheService = {
  getOrSet: jest.fn(),
  del: jest.fn(),
};

const mockUser = createMockUser();
```

### Update Test Cases:

```typescript
describe('findAllOrders', () => {
  it('should return all orders for user', async () => {
    const orders = [{ id: '1', orderNumber: 'SO-2024-00001' }];
    mockRepository.find.mockResolvedValue(orders as Order[]);

    const result = await service.findAllOrders(mockUser);

    expect(result).toEqual(orders);
    expect(mockRepository.find).toHaveBeenCalled();
  });
});

describe('createOrder', () => {
  it('should create new order with auto-generated number', async () => {
    const data = { customerId: 'cust-1', amount: 1000 };
    const order = {
      id: 'order-1',
      ...data,
      orderNumber: 'SO-2024-00001',
      tenantId: mockUser.tenantId,
    };

    mockRepository.count.mockResolvedValue(0);
    mockRepository.save.mockResolvedValue(order as Order);

    const result = await service.createOrder(mockUser, data);

    expect(result.orderNumber).toBe('SO-2024-00001');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

---

## ✅ VERIFICATION CHECKLIST

After refactoring, verify:

1. ✅ All methods have `user: User` as first parameter
2. ✅ No direct `orderRepository` usage (use `secureOrderRepo`)
3. ✅ No manual `tenantId` assignment
4. ✅ Caching with tenant-aware keys
5. ✅ Cache invalidation on update/delete
6. ✅ Document numbering implemented
7. ✅ Tests mock SecureRepository methods
8. ✅ Tests mock PermissionService
9. ✅ All tests passing
10. ✅ No TypeScript errors

---

## 🚀 COMMON PATTERNS

### Pattern 1: Find with Filters

```typescript
async findOrders(user: User, filters: OrderFilters): Promise<Order[]> {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;

  return this.secureOrderRepo.find(user, {
    where,
    order: { createdAt: 'DESC' },
  });
}
```

### Pattern 2: Find with Relations

```typescript
async findOrderWithLines(user: User, id: string): Promise<Order> {
  return this.secureOrderRepo.findOne(user, {
    where: { id },
    relations: ['orderLines', 'customer'],
  });
}
```

### Pattern 3: Bulk Operations

```typescript
async bulkUpdateStatus(user: User, ids: string[], status: OrderStatus): Promise<void> {
  for (const id of ids) {
    const order = await this.findOrderById(user, id);
    order.status = status;
    await this.secureOrderRepo.save(user, order);
  }
}
```

---

## 📚 REFERENCE FILES

**Good Examples:**

- `domains/accounting/account/accounting.service.ts`
- `domains/manufacturing/mrp/production.service.ts`

**Research:**

- `.kiro/ODOO-ERPNEXT-SALES-CRM-RESEARCH.md`
- `.kiro/ARCHITECTURE-VIOLATION-ANALYSIS.md`

**Skills:**

- `.kiro/skills/fixing-test-mocking-issues.md`
- `.kiro/skills/secure-repository-pattern.md`

---

**Template Version:** 1.0  
**Last Updated:** 2026-03-08  
**Ready for:** POC Refactoring
