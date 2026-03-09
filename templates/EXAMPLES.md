# Template Usage Examples

Các ví dụ thực tế về cách sử dụng templates để tạo CRUD modules.

---

## 📚 Table of Contents

1. [Simple CRUD Module](#1-simple-crud-module)
2. [Module with Business Logic](#2-module-with-business-logic)
3. [Module with Workflow](#3-module-with-workflow)
4. [Module with Relations](#4-module-with-relations)
5. [Module with Custom Queries](#5-module-with-custom-queries)

---

## 1. Simple CRUD Module

### Scenario: Product Management

**Requirements:**

- Basic CRUD operations
- Tenant isolation
- Permission checks
- Caching

### Step 1: Generate Module

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "Product" -Domain "inventory"
```

### Step 2: Update Entity

```typescript
// src/backend/domains/inventory/product/entities/product.entity.ts
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('products')
@Index(['tenantId', 'code'], { unique: true })
@Index(['tenantId', 'categoryId'])
@Index(['tenantId', 'status'])
export class Product extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category;
}
```

### Step 3: Update DTOs

```typescript
// src/backend/domains/inventory/product/dto/create-product.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product code', example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Product name', example: 'Laptop Dell XPS 15' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Price', example: 1500.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Stock quantity', example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
```

### Step 4: Add Business Logic

```typescript
// src/backend/domains/inventory/product/product.service.ts
// Add these methods to the generated service

/**
 * Find product by code
 */
async findByCode(user: User, code: string): Promise<Product | null> {
  return this.secureProductRepo.findOne(user, {
    where: { code },
    relations: ['category'],
  });
}

/**
 * Update stock quantity
 */
async updateStock(user: User, id: string, quantity: number): Promise<Product> {
  const product = await this.findOne(user, id);

  if (product.stock + quantity < 0) {
    throw new BadRequestException('Insufficient stock');
  }

  product.stock += quantity;
  const updated = await this.secureProductRepo.save(user, product);

  // Invalidate cache
  const cacheKey = generateCacheKey('product', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}

/**
 * Get low stock products
 */
async getLowStockProducts(user: User, threshold: number = 10): Promise<Product[]> {
  const allProducts = await this.secureProductRepo.find(user, {
    order: { stock: 'ASC' },
  });

  return allProducts.filter(p => p.stock < threshold);
}
```

### Result

✅ Full CRUD module with:

- Tenant isolation
- Permission checks
- Caching
- Business logic
- Unit tests

**Time:** ~1 hour (vs 4 hours manual)

---

## 2. Module with Business Logic

### Scenario: Sales Order Management

**Requirements:**

- CRUD operations
- Status workflow (Draft → Submitted → Approved → Cancelled)
- Order number generation
- Total amount calculation
- Approval logic

### Step 1: Generate Module

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "SalesOrder" -Domain "sales"
```

### Step 2: Update Entity

```typescript
// src/backend/domains/sales/sales-order/entities/sales-order.entity.ts
import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { SalesOrderItem } from './sales-order-item.entity';

export enum SalesOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
}

@Entity('sales_orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'orderDate'])
export class SalesOrder extends BaseEntity {
  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: Date;

  @Column({ type: 'enum', enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  status: SalesOrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true })
  items: SalesOrderItem[];
}
```

### Step 3: Add Business Logic

```typescript
// src/backend/domains/sales/sales-order/sales-order.service.ts

/**
 * Generate order number
 */
private async generateOrderNumber(user: User): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.count(user);
  const sequence = String(count + 1).padStart(5, '0');
  return `SO-${year}-${sequence}`;
}

/**
 * Calculate total amount from items
 */
private calculateTotalAmount(items: SalesOrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

/**
 * Create order with auto-generated order number
 */
async create(user: User, createSalesOrderDto: CreateSalesOrderDto): Promise<SalesOrder> {
  // Generate order number
  const orderNumber = await this.generateOrderNumber(user);

  // Calculate total amount
  const totalAmount = this.calculateTotalAmount(createSalesOrderDto.items);

  const order = {
    ...createSalesOrderDto,
    orderNumber,
    totalAmount,
    status: SalesOrderStatus.DRAFT,
    orderDate: new Date(),
  };

  return this.secureSalesOrderRepo.save(user, order);
}

/**
 * Submit order for approval
 */
async submit(user: User, id: string): Promise<SalesOrder> {
  const order = await this.findOne(user, id);

  if (order.status !== SalesOrderStatus.DRAFT) {
    throw new BadRequestException('Only draft orders can be submitted');
  }

  if (!order.items || order.items.length === 0) {
    throw new BadRequestException('Cannot submit order without items');
  }

  order.status = SalesOrderStatus.SUBMITTED;
  const updated = await this.secureSalesOrderRepo.save(user, order);

  // Invalidate cache
  const cacheKey = generateCacheKey('sales-order', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}

/**
 * Approve order
 */
async approve(user: User, id: string): Promise<SalesOrder> {
  const order = await this.findOne(user, id);

  if (order.status !== SalesOrderStatus.SUBMITTED) {
    throw new BadRequestException('Only submitted orders can be approved');
  }

  // Check approval permission
  if (order.totalAmount > 10000 && !user.roles.includes('manager')) {
    throw new ForbiddenException('Manager approval required for orders > $10,000');
  }

  order.status = SalesOrderStatus.APPROVED;
  order.approvedBy = user.id;
  order.approvedAt = new Date();

  const updated = await this.secureSalesOrderRepo.save(user, order);

  // Invalidate cache
  const cacheKey = generateCacheKey('sales-order', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}

/**
 * Cancel order
 */
async cancel(user: User, id: string): Promise<SalesOrder> {
  const order = await this.findOne(user, id);

  if (order.status === SalesOrderStatus.APPROVED) {
    throw new BadRequestException('Cannot cancel approved order');
  }

  order.status = SalesOrderStatus.CANCELLED;
  const updated = await this.secureSalesOrderRepo.save(user, order);

  // Invalidate cache
  const cacheKey = generateCacheKey('sales-order', user.tenantId, id);
  await this.cacheService.del(cacheKey);

  return updated;
}
```

### Step 4: Add Custom Endpoints

```typescript
// src/backend/domains/sales/sales-order/sales-order.controller.ts

@Patch(':id/submit')
@ApiOperation({ summary: 'Submit order for approval' })
submitOrder(@CurrentUser() user: User, @Param('id') id: string) {
  return this.salesOrderService.submit(user, id);
}

@Patch(':id/approve')
@ApiOperation({ summary: 'Approve order' })
approveOrder(@CurrentUser() user: User, @Param('id') id: string) {
  return this.salesOrderService.approve(user, id);
}

@Patch(':id/cancel')
@ApiOperation({ summary: 'Cancel order' })
cancelOrder(@CurrentUser() user: User, @Param('id') id: string) {
  return this.salesOrderService.cancel(user, id);
}
```

### Result

✅ Full order management with:

- Status workflow
- Auto-generated order numbers
- Approval logic
- Business validation
- Custom endpoints

**Time:** ~2 hours (vs 6 hours manual)

---

## 3. Module with Workflow

### Scenario: Leave Request Management

**Requirements:**

- CRUD operations
- Multi-step approval workflow
- Email notifications
- Leave balance validation

### Step 1: Generate Module

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "LeaveRequest" -Domain "hr"
```

### Step 2: Update Module to Include WorkflowModule

```typescript
// src/backend/domains/hr/leave-request/leave-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequest } from './entities/leave-request.entity';
import { CacheModule } from '@/common/cache/cache.module';
import { SecurityModule } from '@/common/security/security.module';
import { WorkflowModule } from '@/platform/workflow/workflow.module'; // Add this
import { NotificationModule } from '@/platform/notification/notification.module'; // Add this

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]),
    CacheModule,
    SecurityModule,
    WorkflowModule, // Add workflow support
    NotificationModule, // Add notification support
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
```

### Step 3: Add Workflow Logic

```typescript
// src/backend/domains/hr/leave-request/leave-request.service.ts
import { WorkflowService } from '@/platform/workflow/workflow.service';
import { NotificationService } from '@/platform/notification/notification.service';

@Injectable()
export class LeaveRequestService {
  private secureLeaveRequestRepo: SecureRepository<LeaveRequest>;

  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
    private readonly workflowService: WorkflowService, // Add this
    private readonly notificationService: NotificationService, // Add this
  ) {
    this.secureLeaveRequestRepo = new SecureRepository(
      leaveRequestRepository,
      permissionService,
      'LeaveRequest',
    );
  }

  /**
   * Submit leave request and start workflow
   */
  async submit(user: User, id: string): Promise<LeaveRequest> {
    const request = await this.findOne(user, id);

    if (request.status !== 'draft') {
      throw new BadRequestException('Only draft requests can be submitted');
    }

    // Validate leave balance
    const balance = await this.getLeaveBalance(user, request.employeeId, request.leaveType);
    if (balance < request.days) {
      throw new BadRequestException('Insufficient leave balance');
    }

    // Start workflow
    const workflow = await this.workflowService.startWorkflow(user, {
      entityType: 'LeaveRequest',
      entityId: id,
      workflowType: 'leave_approval',
    });

    request.status = 'submitted';
    request.workflowId = workflow.id;

    const updated = await this.secureLeaveRequestRepo.save(user, request);

    // Send notification to approver
    await this.notificationService.create(user, {
      recipientId: workflow.currentApproverId,
      title: 'New Leave Request',
      message: `${user.name} submitted a leave request for ${request.days} days`,
      type: 'leave_request',
      entityId: id,
    });

    return updated;
  }

  /**
   * Approve leave request
   */
  async approve(user: User, id: string, comments?: string): Promise<LeaveRequest> {
    const request = await this.findOne(user, id);

    if (request.status !== 'submitted') {
      throw new BadRequestException('Only submitted requests can be approved');
    }

    // Approve workflow step
    await this.workflowService.approveStep(user, request.workflowId, {
      comments,
    });

    // Check if workflow is complete
    const workflow = await this.workflowService.findOne(user, request.workflowId);

    if (workflow.status === 'completed') {
      request.status = 'approved';
      request.approvedBy = user.id;
      request.approvedAt = new Date();

      // Deduct leave balance
      await this.deductLeaveBalance(user, request.employeeId, request.leaveType, request.days);

      // Notify employee
      await this.notificationService.create(user, {
        recipientId: request.createdBy,
        title: 'Leave Request Approved',
        message: `Your leave request for ${request.days} days has been approved`,
        type: 'leave_approved',
        entityId: id,
      });
    }

    const updated = await this.secureLeaveRequestRepo.save(user, request);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave-request', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }
}
```

### Result

✅ Full workflow integration with:

- Multi-step approval
- Email notifications
- Leave balance validation
- Audit trail

**Time:** ~3 hours (vs 8 hours manual)

---

## 4. Module with Relations

### Scenario: Invoice with Line Items

**Requirements:**

- Master-detail relationship
- Cascade operations
- Aggregate calculations

### Step 1: Generate Modules

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "Invoice" -Domain "accounting"
.\scripts\generate-crud-module.ps1 -EntityName "InvoiceItem" -Domain "accounting"
```

### Step 2: Update Entities with Relations

```typescript
// Invoice entity
@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;
}

// InvoiceItem entity
@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'line_total', type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;
}
```

### Step 3: Add Cascade Logic

```typescript
// Invoice service
async create(user: User, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
  // Calculate line totals
  const items = createInvoiceDto.items.map(item => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }));

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const invoice = {
    ...createInvoiceDto,
    items,
    totalAmount,
    invoiceNumber: await this.generateInvoiceNumber(user),
  };

  return this.secureInvoiceRepo.save(user, invoice);
}

async update(user: User, id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
  const invoice = await this.findOne(user, id);

  // Recalculate if items changed
  if (updateInvoiceDto.items) {
    const items = updateInvoiceDto.items.map(item => ({
      ...item,
      lineTotal: item.quantity * item.unitPrice,
    }));

    updateInvoiceDto.totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
    updateInvoiceDto.items = items;
  }

  Object.assign(invoice, updateInvoiceDto);
  return this.secureInvoiceRepo.save(user, invoice);
}
```

### Result

✅ Master-detail module with:

- Cascade operations
- Automatic calculations
- Proper relations

**Time:** ~2 hours (vs 5 hours manual)

---

## 5. Module with Custom Queries

### Scenario: Sales Analytics

**Requirements:**

- Complex aggregations
- Date range queries
- Performance optimization

### Step 1: Generate Module

```powershell
.\scripts\generate-crud-module.ps1 -EntityName "SalesAnalytics" -Domain "sales"
```

### Step 2: Add Custom Query Methods

```typescript
// Sales analytics service
/**
 * Get revenue by date range
 */
async getRevenueByDateRange(
  user: User,
  startDate: Date,
  endDate: Date,
): Promise<{ date: string; revenue: number }[]> {
  const cacheKey = generateCacheKey(
    'sales-analytics-revenue',
    user.tenantId,
    `${startDate.toISOString()}-${endDate.toISOString()}`,
  );

  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      const orders = await this.secureOrderRepo.find(user, {
        where: {
          orderDate: Between(startDate, endDate),
          status: 'approved',
        },
      });

      // Group by date
      const revenueByDate = orders.reduce((acc, order) => {
        const date = order.orderDate.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += Number(order.totalAmount);
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue,
      }));
    },
    CacheTTL.SHORT,
  );
}

/**
 * Get top customers
 */
async getTopCustomers(user: User, limit: number = 10): Promise<any[]> {
  const orders = await this.secureOrderRepo.find(user, {
    where: { status: 'approved' },
    relations: ['customer'],
  });

  // Group by customer
  const customerRevenue = orders.reduce((acc, order) => {
    const customerId = order.customerId;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: order.customer,
        totalRevenue: 0,
        orderCount: 0,
      };
    }
    acc[customerId].totalRevenue += Number(order.totalAmount);
    acc[customerId].orderCount += 1;
    return acc;
  }, {} as Record<string, any>);

  // Sort and limit
  return Object.values(customerRevenue)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}
```

### Result

✅ Analytics module with:

- Complex aggregations
- Caching for performance
- Custom queries

**Time:** ~1.5 hours (vs 4 hours manual)

---

## 📊 Summary

| Scenario       | Manual Time | Template Time | Time Saved |
| -------------- | ----------- | ------------- | ---------- |
| Simple CRUD    | 4 hours     | 1 hour        | 75%        |
| Business Logic | 6 hours     | 2 hours       | 67%        |
| Workflow       | 8 hours     | 3 hours       | 62%        |
| Relations      | 5 hours     | 2 hours       | 60%        |
| Custom Queries | 4 hours     | 1.5 hours     | 62%        |

**Average Time Savings: 65%** 🎯

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0
