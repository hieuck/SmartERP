# Architecture Review Checklist

**Version:** 1.0  
**Date:** 2026-03-09  
**Purpose:** Prevent architectural issues before they reach production  
**Status:** ✅ Active

---

## 📋 Overview

This checklist ensures all modules, services, and features follow SmartERP architectural patterns based on Odoo/ERPNext best practices. Use this checklist for:

- **Pre-implementation review** (before coding)
- **Code review** (PR review)
- **Post-implementation audit** (quality gate)
- **Refactoring validation** (ensure no regressions)

---

## 🎯 Quick Reference

### Critical Checks (Must Pass)

- ✅ Dependency Injection configured correctly
- ✅ SecurityModule imported when using PermissionService
- ✅ SecureRepository used for all database queries
- ✅ Tenant isolation enforced
- ✅ Permission checks implemented

### High Priority Checks

- ✅ Odoo/ERPNext patterns followed
- ✅ Audit trail implemented
- ✅ Error handling comprehensive
- ✅ Tests cover security scenarios

### Medium Priority Checks

- ✅ Caching strategy defined
- ✅ Performance optimized
- ✅ Documentation complete

---

## 1️⃣ DEPENDENCY INJECTION CHECKLIST

### 1.1 Module Configuration

**Problem:** Missing module imports cause "Can't resolve dependencies" errors

**Checklist:**

- [ ] **All dependencies declared in imports array**

  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([Entity]),
      SecurityModule,  // ✅ Required if service injects PermissionService
      CacheModule,     // ✅ Required if service injects CacheService
    ],
  })
  ```

- [ ] **SecurityModule imported when PermissionService used**

  ```typescript
  // ❌ BAD: Missing SecurityModule
  @Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UserService],  // UserService injects PermissionService
  })

  // ✅ GOOD: SecurityModule imported
  @Module({
    imports: [
      TypeOrmModule.forFeature([User]),
      SecurityModule,  // ← Required
    ],
    providers: [UserService],
  })
  ```

- [ ] **No circular dependencies**

  ```bash
  # Check for circular dependencies
  npm run build
  # Look for warnings: "Circular dependency detected"
  ```

- [ ] **Providers exported if used by other modules**
  ```typescript
  @Module({
    providers: [UserService],
    exports: [UserService],  // ✅ Export if other modules need it
  })
  ```

**Verification:**

```bash
# 1. Compile check
npm run build

# 2. Start server
npm run start:dev

# 3. Check logs for dependency errors
# Look for: "Nest can't resolve dependencies"
```

**Common Issues:**

| Issue                  | Symptom                           | Fix                                 |
| ---------------------- | --------------------------------- | ----------------------------------- |
| Missing SecurityModule | "Can't resolve PermissionService" | Add SecurityModule to imports       |
| Missing CacheModule    | "Can't resolve CacheService"      | Add CacheModule to imports          |
| Circular dependency    | Build warnings                    | Refactor to remove circular imports |
| Provider not exported  | "Can't resolve XService"          | Add service to exports array        |

---

## 2️⃣ SECURITY & MULTI-TENANCY CHECKLIST

### 2.1 SecureRepository Usage

**Problem:** Direct TypeORM repository usage bypasses tenant isolation and permission checks

**Checklist:**

- [ ] **Use SecureRepository instead of raw TypeORM Repository**

  ```typescript
  // ❌ BAD: Direct TypeORM repository
  @InjectRepository(Product)
  private readonly productRepo: Repository<Product>

  async findAll(): Promise<Product[]> {
    return this.productRepo.find();  // ← No tenant isolation!
  }

  // ✅ GOOD: SecureRepository
  @InjectSecureRepository(Product)
  private readonly secureProductRepo: SecureRepository<Product>

  async findAll(user: User): Promise<Product[]> {
    return this.secureProductRepo.find(user, {});  // ← Automatic tenant isolation
  }
  ```

- [ ] **All queries pass user context**

  ```typescript
  // ❌ BAD: No user context
  async findAll(): Promise<Product[]> {
    return this.secureProductRepo.find({});
  }

  // ✅ GOOD: User context passed
  async findAll(user: User): Promise<Product[]> {
    return this.secureProductRepo.find(user, {});
  }
  ```

- [ ] **No direct use of createQueryBuilder, update, delete**

  ```typescript
  // ❌ BAD: Direct query builder (bypasses SecureRepository)
  await this.productRepo.createQueryBuilder().where('id = :id', { id }).getOne();

  // ✅ GOOD: Use SecureRepository methods
  await this.secureProductRepo.findOne(user, { where: { id } });
  ```

**Verification:**

```bash
# Scan for raw repository usage
grep -r "@InjectRepository" src/backend/domains/
grep -r "Repository<" src/backend/domains/

# Should find ZERO instances (all should use SecureRepository)
```

### 2.2 Tenant Isolation

**Problem:** Queries return data from all tenants, causing data leakage

**Checklist:**

- [ ] **Every entity has tenantId field**

  ```typescript
  @Entity()
  export class Product extends BaseEntity {
    @Column()
    tenantId: string; // ✅ Required for multi-tenancy

    // ... other fields
  }
  ```

- [ ] **SecureRepository automatically adds tenantId filter**

  ```typescript
  // SecureRepository automatically adds:
  // where: { tenantId: user.tenantId }
  ```

- [ ] **Manual queries include tenantId filter**
  ```typescript
  // If you MUST use raw query (rare cases)
  const products = await this.productRepo.find({
    where: { tenantId: user.tenantId }, // ✅ Explicit tenant filter
  });
  ```

**Verification:**

```typescript
// Test: Verify tenant isolation
it('should only return products for current tenant', async () => {
  const tenant1User = { tenantId: 'tenant1', id: 'user1' };
  const tenant2User = { tenantId: 'tenant2', id: 'user2' };

  // Create products for both tenants
  await service.create(tenant1User, { name: 'Product 1' });
  await service.create(tenant2User, { name: 'Product 2' });

  // Verify isolation
  const tenant1Products = await service.findAll(tenant1User);
  const tenant2Products = await service.findAll(tenant2User);

  expect(tenant1Products).toHaveLength(1);
  expect(tenant2Products).toHaveLength(1);
  expect(tenant1Products[0].name).toBe('Product 1');
  expect(tenant2Products[0].name).toBe('Product 2');
});
```

### 2.3 Permission Checks

**Problem:** Users can access/modify data without proper permissions

**Checklist:**

- [ ] **Permission checks before data access**

  ```typescript
  async findAll(user: User): Promise<Product[]> {
    // ✅ SecureRepository automatically checks canRead permission
    return this.secureProductRepo.find(user, {});
  }
  ```

- [ ] **Permission checks before modifications**

  ```typescript
  async update(user: User, id: string, dto: UpdateProductDto): Promise<Product> {
    // ✅ SecureRepository automatically checks canWrite permission
    return this.secureProductRepo.update(user, id, dto);
  }

  async delete(user: User, id: string): Promise<void> {
    // ✅ SecureRepository automatically checks canDelete permission
    await this.secureProductRepo.remove(user, id);
  }
  ```

- [ ] **Custom permission checks for complex operations**
  ```typescript
  async approveOrder(user: User, orderId: string): Promise<Order> {
    // ✅ Custom permission check
    const canApprove = await this.permissionService.hasPermission(
      user,
      'Order',
      'approve'
    );

    if (!canApprove) {
      throw new ForbiddenException('You cannot approve orders');
    }

    // ... approval logic
  }
  ```

**Verification:**

```typescript
// Test: Verify permission denial
it('should deny access when user lacks permission', async () => {
  const userWithoutPermission = {
    tenantId: 'tenant1',
    id: 'user1',
    roles: ['viewer'], // No write permission
  };

  await expect(service.create(userWithoutPermission, { name: 'Product' })).rejects.toThrow(
    ForbiddenException,
  );
});
```

---

## 3️⃣ ODOO/ERPNEXT PATTERNS CHECKLIST

### 3.1 Module Structure (Odoo Style)

**Problem:** Inconsistent module organization makes codebase hard to navigate

**Checklist:**

- [ ] **Module follows standard structure**

  ```
  domains/{domain}/
  ├── entities/
  │   └── {entity}.entity.ts
  ├── dto/
  │   ├── create-{entity}.dto.ts
  │   └── update-{entity}.dto.ts
  ├── {entity}.service.ts
  ├── {entity}.controller.ts
  ├── {entity}.module.ts
  └── tests/
      ├── {entity}.service.spec.ts
      └── {entity}.controller.spec.ts
  ```

- [ ] **Module metadata complete**

  ```typescript
  /**
   * ProductModule
   *
   * Domain: Inventory Management
   * Dependencies:
   * - SecurityModule: Permission checks
   * - CacheModule: Product caching
   * - CategoryModule: Product categories
   *
   * Exports:
   * - ProductService: CRUD operations for products
   */
  @Module({
    imports: [TypeOrmModule.forFeature([Product]), SecurityModule, CacheModule, CategoryModule],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
  })
  export class ProductModule {}
  ```

- [ ] **Clear module dependencies**

  ```typescript
  // ✅ GOOD: Explicit dependencies
  @Module({
    imports: [
      SecurityModule,  // For PermissionService
      CacheModule,     // For CacheService
      CategoryModule,  // For CategoryService
    ],
  })

  // ❌ BAD: Hidden dependencies
  @Module({
    imports: [],  // Service injects dependencies but module doesn't import
  })
  ```

### 3.2 Entity Design (ERPNext Style)

**Problem:** Entities missing required fields for audit trail and multi-tenancy

**Checklist:**

- [ ] **Entity extends BaseEntity**

  ```typescript
  @Entity('products')
  export class Product extends BaseEntity {
    // BaseEntity provides:
    // - id: string (UUID)
    // - tenantId: string
    // - createdBy: string
    // - updatedBy: string
    // - createdAt: Date
    // - updatedAt: Date
    // - deletedAt: Date (soft delete)
  }
  ```

- [ ] **Status field for workflow (if applicable)**

  ```typescript
  export enum ProductStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ARCHIVED = 'archived',
  }

  @Entity()
  export class Product extends BaseEntity {
    @Column({
      type: 'enum',
      enum: ProductStatus,
      default: ProductStatus.DRAFT,
    })
    status: ProductStatus;
  }
  ```

- [ ] **Proper indexes for performance**
  ```typescript
  @Entity()
  @Index(['tenantId', 'status']) // ✅ Composite index for common queries
  @Index(['tenantId', 'sku'], { unique: true }) // ✅ Unique constraint per tenant
  export class Product extends BaseEntity {
    @Column()
    sku: string;

    @Column()
    status: ProductStatus;
  }
  ```

### 3.3 Workflow & State Machine (Odoo Style)

**Problem:** State transitions not validated, leading to invalid states

**Checklist:**

- [ ] **Valid state transitions defined**

  ```typescript
  const ORDER_TRANSITIONS = {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'rejected'],
    approved: ['completed', 'cancelled'],
    rejected: [],
    completed: [],
    cancelled: [],
  };
  ```

- [ ] **State transition validation**

  ```typescript
  async changeStatus(
    user: User,
    orderId: string,
    newStatus: OrderStatus
  ): Promise<Order> {
    const order = await this.findOne(user, orderId);

    // ✅ Validate transition
    const validTransitions = ORDER_TRANSITIONS[order.status];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`
      );
    }

    // ✅ Update status
    order.status = newStatus;
    return this.secureOrderRepo.save(user, order);
  }
  ```

- [ ] **Workflow service integration (if complex workflow)**
  ```typescript
  async submitForApproval(user: User, orderId: string): Promise<Order> {
    const order = await this.findOne(user, orderId);

    // ✅ Use WorkflowService for approval workflow
    await this.workflowService.startWorkflow(user, {
      entityType: 'Order',
      entityId: orderId,
      workflowType: 'order_approval',
    });

    order.status = OrderStatus.PENDING_APPROVAL;
    return this.secureOrderRepo.save(user, order);
  }
  ```

---

## 4️⃣ TESTING CHECKLIST

### 4.1 Security Tests

**Problem:** Security vulnerabilities not caught by tests

**Checklist:**

- [ ] **Tenant isolation tests**

  ```typescript
  describe('Tenant Isolation', () => {
    it('should not return data from other tenants', async () => {
      const tenant1User = { tenantId: 'tenant1', id: 'user1' };
      const tenant2User = { tenantId: 'tenant2', id: 'user2' };

      await service.create(tenant1User, { name: 'Product 1' });
      await service.create(tenant2User, { name: 'Product 2' });

      const tenant1Products = await service.findAll(tenant1User);

      expect(tenant1Products).toHaveLength(1);
      expect(tenant1Products[0].tenantId).toBe('tenant1');
    });
  });
  ```

- [ ] **Permission denial tests**

  ```typescript
  describe('Permission Checks', () => {
    it('should deny create when user lacks permission', async () => {
      const userWithoutPermission = {
        tenantId: 'tenant1',
        id: 'user1',
        roles: ['viewer'],
      };

      await expect(service.create(userWithoutPermission, { name: 'Product' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
  ```

- [ ] **Cross-tenant access prevention tests**
  ```typescript
  describe('Cross-Tenant Access Prevention', () => {
    it('should not allow access to other tenant data', async () => {
      const tenant1User = { tenantId: 'tenant1', id: 'user1' };
      const tenant2User = { tenantId: 'tenant2', id: 'user2' };

      const product = await service.create(tenant1User, { name: 'Product' });

      await expect(service.findOne(tenant2User, product.id)).rejects.toThrow(NotFoundException);
    });
  });
  ```

### 4.2 Mock Configuration

**Problem:** Tests mock wrong methods, causing false positives

**Checklist:**

- [ ] **Mock SecureRepository methods, not TypeORM**

  ```typescript
  // ❌ BAD: Mocking TypeORM methods
  jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({...});
  jest.spyOn(repository, 'update').mockResolvedValue({...});

  // ✅ GOOD: Mock SecureRepository methods
  jest.spyOn(secureRepository, 'find').mockResolvedValue([...]);
  jest.spyOn(secureRepository, 'findOne').mockResolvedValue({...});
  jest.spyOn(secureRepository, 'save').mockResolvedValue({...});
  ```

- [ ] **Mock PermissionService**

  ```typescript
  const mockPermissionService = {
    canRead: jest.fn().mockResolvedValue(true),
    canWrite: jest.fn().mockResolvedValue(true),
    canDelete: jest.fn().mockResolvedValue(true),
  };
  ```

- [ ] **Test both success and failure scenarios**
  ```typescript
  describe('ProductService', () => {
    it('should create product when user has permission', async () => {
      mockPermissionService.canWrite.mockResolvedValue(true);
      // ... test logic
    });

    it('should deny create when user lacks permission', async () => {
      mockPermissionService.canWrite.mockResolvedValue(false);
      // ... test logic
    });
  });
  ```

---

## 5️⃣ PERFORMANCE & CACHING CHECKLIST

### 5.1 Caching Strategy

**Problem:** Unnecessary database queries slow down application

**Checklist:**

- [ ] **Cache frequently accessed data**

  ```typescript
  async findById(user: User, id: string): Promise<Product> {
    const cacheKey = `product:${user.tenantId}:${id}`;

    // ✅ Check cache first
    const cached = await this.cacheService.get<Product>(cacheKey);
    if (cached) return cached;

    // ✅ Query database
    const product = await this.secureProductRepo.findOne(user, {
      where: { id },
    });

    // ✅ Cache result
    await this.cacheService.set(cacheKey, product, CacheTTL.MEDIUM);

    return product;
  }
  ```

- [ ] **Invalidate cache on updates**

  ```typescript
  async update(user: User, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.secureProductRepo.update(user, id, dto);

    // ✅ Invalidate cache
    const cacheKey = `product:${user.tenantId}:${id}`;
    await this.cacheService.del(cacheKey);

    return product;
  }
  ```

- [ ] **Use appropriate TTL**

  ```typescript
  // Master data (rarely changes)
  await this.cacheService.set(key, data, CacheTTL.LONG); // 1 hour

  // Transactional data (changes frequently)
  await this.cacheService.set(key, data, CacheTTL.SHORT); // 5 minutes

  // Reference data (moderate changes)
  await this.cacheService.set(key, data, CacheTTL.MEDIUM); // 15 minutes
  ```

### 5.2 Query Optimization

**Problem:** Slow queries due to missing indexes or N+1 queries

**Checklist:**

- [ ] **Use eager loading for relations**

  ```typescript
  // ❌ BAD: N+1 query problem
  const orders = await this.secureOrderRepo.find(user, {});
  for (const order of orders) {
    order.items = await this.orderItemRepo.find({ where: { orderId: order.id } });
  }

  // ✅ GOOD: Eager loading
  const orders = await this.secureOrderRepo.find(user, {
    relations: ['items', 'customer'],
  });
  ```

- [ ] **Add indexes for frequently queried fields**

  ```typescript
  @Entity()
  @Index(['tenantId', 'status']) // ✅ Composite index
  @Index(['tenantId', 'createdAt']) // ✅ For date range queries
  export class Order extends BaseEntity {
    @Column()
    status: OrderStatus;
  }
  ```

- [ ] **Use pagination for large datasets**
  ```typescript
  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Product>> {
    const [data, total] = await this.secureProductRepo.findAndCount(user, {
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  ```

---

## 6️⃣ ERROR HANDLING & VALIDATION CHECKLIST

### 6.1 Input Validation

**Problem:** Invalid data causes runtime errors

**Checklist:**

- [ ] **DTO validation with class-validator**

  ```typescript
  export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;
  }
  ```

- [ ] **Custom validation for business rules**

  ```typescript
  @ValidatorConstraint({ name: 'isValidSKU', async: false })
  export class IsValidSKU implements ValidatorConstraintInterface {
    validate(sku: string) {
      return /^[A-Z]{3}-\d{6}$/.test(sku); // Format: ABC-123456
    }

    defaultMessage() {
      return 'SKU must be in format: ABC-123456';
    }
  }

  export class CreateProductDto {
    @Validate(IsValidSKU)
    sku: string;
  }
  ```

### 6.2 Error Handling

**Problem:** Generic errors don't provide useful information

**Checklist:**

- [ ] **Use appropriate HTTP exceptions**

  ```typescript
  // ✅ GOOD: Specific exceptions
  if (!product) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }

  if (!canUpdate) {
    throw new ForbiddenException('You cannot update this product');
  }

  if (product.stock < quantity) {
    throw new BadRequestException('Insufficient stock');
  }
  ```

- [ ] **Catch and transform errors**
  ```typescript
  async create(user: User, dto: CreateProductDto): Promise<Product> {
    try {
      return await this.secureProductRepo.save(user, dto);
    } catch (error) {
      if (error.code === '23505') {  // Unique constraint violation
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }
  ```

---

## 7️⃣ DOCUMENTATION CHECKLIST

### 7.1 Code Documentation

**Checklist:**

- [ ] **Service methods documented**

  ```typescript
  /**
   * Find all products for the current tenant
   *
   * @param user - Current user context (for tenant isolation)
   * @param filters - Optional filters (status, category, etc.)
   * @returns Array of products
   * @throws ForbiddenException if user lacks read permission
   */
  async findAll(user: User, filters?: ProductFilters): Promise<Product[]> {
    return this.secureProductRepo.find(user, { where: filters });
  }
  ```

- [ ] **Complex logic explained**
  ```typescript
  // Calculate discount based on customer tier and order amount
  // Tier 1 (< $1000): 5% discount
  // Tier 2 ($1000-$5000): 10% discount
  // Tier 3 (> $5000): 15% discount
  const discount = this.calculateDiscount(customer.tier, order.total);
  ```

### 7.2 API Documentation

**Checklist:**

- [ ] **Swagger decorators added**
  ```typescript
  @ApiTags('products')
  @Controller('products')
  export class ProductController {
    @Get()
    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async findAll(@CurrentUser() user: User): Promise<Product[]> {
      return this.productService.findAll(user);
    }
  }
  ```

---

## 8️⃣ AUDIT & COMPLIANCE CHECKLIST

### 8.1 Audit Trail

**Problem:** Cannot track who changed what and when

**Checklist:**

- [ ] **BaseEntity provides audit fields**

  ```typescript
  // Automatically tracked by BaseEntity:
  // - createdBy: string
  // - updatedBy: string
  // - createdAt: Date
  // - updatedAt: Date
  ```

- [ ] **Soft delete instead of hard delete**

  ```typescript
  // ✅ GOOD: Soft delete (sets deletedAt)
  await this.secureProductRepo.softRemove(user, product);

  // ❌ BAD: Hard delete (permanent)
  await this.secureProductRepo.remove(user, product);
  ```

- [ ] **Important actions logged**
  ```typescript
  async approveOrder(user: User, orderId: string): Promise<Order> {
    const order = await this.findOne(user, orderId);

    // ✅ Log approval action
    await this.auditService.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: 'ORDER_APPROVED',
      entityType: 'Order',
      entityId: orderId,
      metadata: { previousStatus: order.status },
    });

    order.status = OrderStatus.APPROVED;
    return this.secureOrderRepo.save(user, order);
  }
  ```

---

## 🎯 REVIEW PROCESS

### Pre-Implementation Review

**Before writing code:**

1. ✅ Review requirements with PM
2. ✅ Check Odoo/ERPNext patterns for similar features
3. ✅ Design database schema (entities, relationships, indexes)
4. ✅ Plan security approach (permissions, tenant isolation)
5. ✅ Identify dependencies (which modules to import)

### Code Review Checklist

**During PR review:**

1. ✅ Run through this checklist
2. ✅ Verify all critical checks pass
3. ✅ Check test coverage (>80%)
4. ✅ Review security tests
5. ✅ Verify documentation complete

### Post-Implementation Audit

**After deployment:**

1. ✅ Run security scan
2. ✅ Check performance metrics
3. ✅ Verify audit trail working
4. ✅ Monitor error logs
5. ✅ Gather user feedback

---

## 📊 SCORING SYSTEM

### Critical Issues (Must Fix)

- ❌ Missing SecurityModule import: **BLOCKER**
- ❌ Direct TypeORM repository usage: **BLOCKER**
- ❌ No tenant isolation: **BLOCKER**
- ❌ No permission checks: **BLOCKER**

### High Priority Issues (Fix Before Merge)

- ⚠️ Missing security tests: **HIGH**
- ⚠️ No error handling: **HIGH**
- ⚠️ Missing indexes: **HIGH**
- ⚠️ No input validation: **HIGH**

### Medium Priority Issues (Fix Soon)

- 🟡 Missing caching: **MEDIUM**
- 🟡 No documentation: **MEDIUM**
- 🟡 Missing audit trail: **MEDIUM**

### Low Priority Issues (Nice to Have)

- 🟢 Code style issues: **LOW**
- 🟢 Missing comments: **LOW**
- 🟢 Optimization opportunities: **LOW**

---

## 🚀 AUTOMATION

### Automated Checks

**ESLint Rules:**

```javascript
// .eslintrc.js
rules: {
  // Detect raw TypeORM repository usage
  'no-restricted-imports': ['error', {
    patterns: ['**/typeorm', '@nestjs/typeorm'],
    message: 'Use SecureRepository instead of raw TypeORM'
  }],

  // Require SecurityModule import
  'smarterp/require-security-module': 'error',
}
```

**Pre-commit Hook:**

```bash
#!/bin/bash
# .husky/pre-commit

# Run architecture scan
npm run scan:architecture

# Run security tests
npm run test:security

# Check for violations
if [ $? -ne 0 ]; then
  echo "❌ Architecture violations found. Fix before committing."
  exit 1
fi
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Check

on: [pull_request]

jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run architecture checklist
        run: npm run check:architecture
      - name: Run security tests
        run: npm run test:security
      - name: Generate report
        run: npm run report:architecture
```

---

## 📚 REFERENCES

### Internal Documentation

- [Odoo Architecture Analysis](../ODOO-ARCHITECTURE-ANALYSIS.md)
- [ERPNext Architecture Analysis](../ERPNEXT-ARCHITECTURE-ANALYSIS.md)
- [ADR-001: SecureRepository Pattern](./decisions/ADR-001-secure-repository-pattern.md)
- [Security Fix Implementation Plan](../../SECURITY-FIX-IMPLEMENTATION-PLAN.md)

### External Resources

- [NestJS Best Practices](https://docs.nestjs.com/techniques/configuration)
- [TypeORM Best Practices](https://typeorm.io/best-practices)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)

---

## 📝 CHANGELOG

### Version 1.0 (2026-03-09)

- ✅ Initial checklist created
- ✅ Based on Odoo/ERPNext patterns
- ✅ Includes lessons from SecurityModule DI failure
- ✅ Covers all critical architectural areas

---

**Last Updated:** 2026-03-09  
**Maintained By:** Solution Architect + Tech Lead  
**Review Frequency:** Monthly or after major incidents
