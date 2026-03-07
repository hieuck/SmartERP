# Technical Patterns Guide: Odoo/ERPNext → SmartERP

**Date**: 2026-03-07  
**Purpose**: Hướng dẫn implement patterns từ Odoo/ERPNext vào SmartERP  
**Target**: NestJS + TypeORM + TypeScript

---

## 📋 Table of Contents

1. [ORM Patterns](#1-orm-patterns)
2. [Permission Patterns](#2-permission-patterns)
3. [Workflow Patterns](#3-workflow-patterns)
4. [Metadata-Driven Patterns](#4-metadata-driven-patterns)
5. [API Patterns](#5-api-patterns)
6. [Testing Patterns](#6-testing-patterns)
7. [Module Patterns](#7-module-patterns)
8. [Security Patterns](#8-security-patterns)

---

## 1. 🗄️ ORM Patterns

### 1.1. Computed Fields

**Odoo Pattern**:
```python
# Odoo: @api.depends decorator
class AccountMove(models.Model):
    _name = 'account.move'
    
    line_ids = fields.One2many('account.move.line', 'move_id')
    amount_total = fields.Monetary(compute='_compute_amount', store=True)
    
    @api.depends('line_ids.debit', 'line_ids.credit')
    def _compute_amount(self):
        for move in self:
            move.amount_total = sum(move.line_ids.mapped('debit'))
```

**ERPNext Pattern**:
```python
# ERPNext: validate() method
class JournalEntry(Document):
    def validate(self):
        self.total_debit = sum(d.debit for d in self.accounts)
        self.total_credit = sum(d.credit for d in self.accounts)
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Use TypeORM hooks + computed property

import { Entity, Column, OneToMany, AfterLoad, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @OneToMany(() => JournalLine, line => line.entry, { eager: true })
  lines: JournalLine[];

  // Computed field (not stored in DB)
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalDebit?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalCredit?: number;

  // Auto-compute before save
  @BeforeInsert()
  @BeforeUpdate()
  computeTotals() {
    if (this.lines && this.lines.length > 0) {
      this.totalDebit = this.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      this.totalCredit = this.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    }
  }

  // Validation
  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
      throw new Error('Journal entry must be balanced!');
    }
  }
}
```

**Key Learnings**:
- ✅ Use `@BeforeInsert()` / `@BeforeUpdate()` for auto-computation
- ✅ Store computed values in DB for performance (optional)
- ✅ Use `@AfterLoad()` for runtime computation (if not stored)
- ✅ Validate in same hook

---

### 1.2. Relational Fields

**Odoo Pattern**:
```python
# Odoo: Many2one, One2many, Many2many
class SalesOrder(models.Model):
    partner_id = fields.Many2one('res.partner', required=True)
    line_ids = fields.One2many('sale.order.line', 'order_id')
    tag_ids = fields.Many2many('sale.order.tag')
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: TypeORM relations with proper cascade

@Entity('sales_orders')
export class SalesOrder {
  @ManyToOne(() => Customer, { nullable: false, eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => SalesOrderLine, line => line.order, {
    cascade: true,  // Auto-save/delete children
    eager: false,   // Load on demand
  })
  lines: SalesOrderLine[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'sales_order_tags',
    joinColumn: { name: 'order_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];
}
```


**Key Learnings**:
- ✅ Use `cascade: true` for parent-child relationships
- ✅ Use `eager: true` for frequently accessed relations
- ✅ Use `@JoinColumn()` to specify FK column name
- ✅ Use `@JoinTable()` for many-to-many with custom table name

---

### 1.3. Constraints & Validation

**Odoo Pattern**:
```python
# Odoo: @api.constrains decorator
class AccountMove(models.Model):
    @api.constrains('line_ids')
    def _check_balanced(self):
        for move in self:
            if abs(sum(move.line_ids.mapped('debit')) - 
                   sum(move.line_ids.mapped('credit'))) > 0.01:
                raise ValidationError("Entry must be balanced!")
```

**ERPNext Pattern**:
```python
# ERPNext: validate() method
class JournalEntry(Document):
    def validate(self):
        self.validate_total_debit_and_credit()
        self.validate_accounts()
    
    def validate_total_debit_and_credit(self):
        if abs(self.total_debit - self.total_credit) > 0.01:
            frappe.throw("Total Debit must equal Total Credit")
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: class-validator + custom validators

import { IsNotEmpty, IsDate, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  // Custom validator
  @IsBalanced()
  get isBalanced(): boolean {
    const debit = this.lines.reduce((sum, l) => sum + l.debit, 0);
    const credit = this.lines.reduce((sum, l) => sum + l.credit, 0);
    return Math.abs(debit - credit) < 0.01;
  }
}

// Custom decorator
function IsBalanced() {
  return function (target: any, propertyKey: string) {
    // Register custom validator
  };
}

// In service
async create(dto: CreateJournalEntryDto) {
  // Validate DTO
  const errors = await validate(dto);
  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }
  
  // Additional business validation
  this.validateAccounts(dto);
  
  return this.repository.save(dto);
}
```

**Key Learnings**:
- ✅ Use `class-validator` for DTO validation
- ✅ Create custom validators for business rules
- ✅ Validate in service layer (not just entity)
- ✅ Throw descriptive errors

---

## 2. 🔐 Permission Patterns

### 2.1. Record-Level Security (Row-Level)

**Odoo Pattern**:
```xml
<!-- Odoo: Record rules -->
<record id="account_move_rule_user" model="ir.rule">
    <field name="name">User can only see own company</field>
    <field name="model_id" ref="model_account_move"/>
    <field name="domain_force">[('company_id', 'in', company_ids)]</field>
    <field name="groups" eval="[(4, ref('group_account_user'))]"/>
</record>
```

**ERPNext Pattern**:
```python
# ERPNext: Permission query
def get_permission_query_conditions(user):
    if "Sales Manager" in frappe.get_roles(user):
        return None  # Can see all
    
    return f"""(`tabSales Invoice`.owner = '{user}')"""
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Query builder with permission filters

// 1. Create permission service
@Injectable()
export class PermissionService {
  applyRecordLevelSecurity<T>(
    query: SelectQueryBuilder<T>,
    user: User,
    entityName: string,
  ): SelectQueryBuilder<T> {
    // Apply company filter
    if (!user.roles.includes('admin')) {
      query.andWhere('entity.companyId = :companyId', { 
        companyId: user.companyId 
      });
    }
    
    // Apply owner filter for non-managers
    if (!user.roles.includes('manager')) {
      query.andWhere('entity.createdBy = :userId', { 
        userId: user.id 
      });
    }
    
    return query;
  }
}

// 2. Use in repository/service
@Injectable()
export class JournalEntryService {
  constructor(
    @InjectRepository(JournalEntry)
    private repository: Repository<JournalEntry>,
    private permissionService: PermissionService,
  ) {}

  async findAll(user: User, filters: any) {
    let query = this.repository.createQueryBuilder('entry');
    
    // Apply record-level security
    query = this.permissionService.applyRecordLevelSecurity(
      query, 
      user, 
      'JournalEntry'
    );
    
    // Apply user filters
    if (filters.date) {
      query.andWhere('entry.date = :date', { date: filters.date });
    }
    
    return query.getMany();
  }
}

// 3. Use in controller
@Controller('journal-entries')
export class JournalEntryController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('accountant', 'manager')
  async findAll(
    @CurrentUser() user: User,
    @Query() filters: FilterDto,
  ) {
    return this.service.findAll(user, filters);
  }
}
```

**Key Learnings**:
- ✅ Create centralized `PermissionService`
- ✅ Apply filters in query builder (not after fetch)
- ✅ Combine with role-based guards
- ✅ Test with different user roles

---

### 2.2. Field-Level Permissions

**ERPNext Pattern**:
```json
{
  "fieldname": "discount_amount",
  "fieldtype": "Currency",
  "permlevel": 1  // Only users with permlevel 1 can edit
}
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Use DTOs with conditional fields

// 1. Define field permissions
export const FIELD_PERMISSIONS = {
  'JournalEntry.totalDebit': ['accountant', 'manager'],
  'JournalEntry.approvedBy': ['manager'],
};

// 2. Create DTO transformer
export class FieldPermissionTransformer {
  static filterFields<T>(
    entity: T,
    user: User,
    entityName: string,
  ): Partial<T> {
    const result: any = {};
    
    for (const [key, value] of Object.entries(entity)) {
      const permKey = `${entityName}.${key}`;
      const requiredRoles = FIELD_PERMISSIONS[permKey];
      
      // If no permission defined, allow all
      if (!requiredRoles) {
        result[key] = value;
        continue;
      }
      
      // Check if user has required role
      if (user.roles.some(role => requiredRoles.includes(role))) {
        result[key] = value;
      }
    }
    
    return result;
  }
}

// 3. Use in controller
@Get(':id')
async findOne(
  @Param('id') id: string,
  @CurrentUser() user: User,
) {
  const entry = await this.service.findOne(id);
  
  // Filter fields based on permissions
  return FieldPermissionTransformer.filterFields(
    entry,
    user,
    'JournalEntry',
  );
}
```

**Key Learnings**:
- ✅ Define field permissions in config
- ✅ Filter fields in response (not query)
- ✅ Use interceptors for automatic filtering
- ✅ Document field permissions

---

## 3. 🔄 Workflow Patterns

### 3.1. State Machine

**Odoo Pattern**:
```python
# Odoo: State field + action methods
class SalesOrder(models.Model):
    state = fields.Selection([
        ('draft', 'Draft'),
        ('sent', 'Quotation Sent'),
        ('sale', 'Sales Order'),
        ('done', 'Done'),
        ('cancel', 'Cancelled'),
    ], default='draft')
    
    def action_confirm(self):
        self.write({'state': 'sale'})
        self.create_invoice()
    
    def action_cancel(self):
        self.write({'state': 'cancel'})
```

**ERPNext Pattern**:
```python
# ERPNext: Workflow + docstatus
class SalesInvoice(Document):
    def on_submit(self):
        """Called when docstatus changes to 1 (submitted)"""
        self.update_stock()
        self.make_gl_entries()
    
    def on_cancel(self):
        """Called when docstatus changes to 2 (cancelled)"""
        self.reverse_gl_entries()
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Enum + state transition methods

// 1. Define states
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 2. Define transitions
const STATE_TRANSITIONS = {
  [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

// 3. Entity with state
@Entity('sales_orders')
export class SalesOrder {
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  // Validate state transition
  canTransitionTo(newStatus: OrderStatus): boolean {
    return STATE_TRANSITIONS[this.status]?.includes(newStatus) ?? false;
  }
}

// 4. Service with state actions
@Injectable()
export class SalesOrderService {
  async confirm(id: string, user: User) {
    const order = await this.findOne(id);
    
    // Check permission
    if (!user.roles.includes('sales_manager')) {
      throw new ForbiddenException('Only managers can confirm orders');
    }
    
    // Validate transition
    if (!order.canTransitionTo(OrderStatus.CONFIRMED)) {
      throw new BadRequestException(
        `Cannot confirm order in ${order.status} state`
      );
    }
    
    // Perform transition
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    order.confirmedBy = user.id;
    
    // Side effects
    await this.reserveStock(order);
    await this.sendConfirmationEmail(order);
    
    return this.repository.save(order);
  }
  
  async cancel(id: string, user: User, reason: string) {
    const order = await this.findOne(id);
    
    if (!order.canTransitionTo(OrderStatus.CANCELLED)) {
      throw new BadRequestException('Cannot cancel this order');
    }
    
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelledBy = user.id;
    order.cancellationReason = reason;
    
    // Reverse side effects
    await this.releaseStock(order);
    await this.sendCancellationEmail(order);
    
    return this.repository.save(order);
  }
}
```


**Key Learnings**:
- ✅ Use enum for states
- ✅ Define allowed transitions
- ✅ Validate transitions before state change
- ✅ Track who/when changed state
- ✅ Handle side effects in service methods
- ✅ Use transactions for atomic operations

---

### 3.2. Approval Workflows

**ERPNext Pattern**:
```json
{
  "name": "Sales Invoice Approval",
  "states": [
    {"state": "Draft", "doc_status": 0},
    {"state": "Pending Approval", "doc_status": 0},
    {"state": "Approved", "doc_status": 1}
  ],
  "transitions": [
    {
      "state": "Draft",
      "action": "Submit for Approval",
      "next_state": "Pending Approval",
      "allowed": "Sales User"
    }
  ]
}
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Workflow engine with approval chain

// 1. Define workflow entity
@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  entityType: string; // 'SalesInvoice', 'PurchaseOrder', etc.

  @Column('jsonb')
  states: WorkflowState[];

  @Column('jsonb')
  transitions: WorkflowTransition[];
}

interface WorkflowState {
  name: string;
  allowedRoles: string[];
  actions: string[];
}

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  condition?: string;
  requiredRole: string;
}

// 2. Approval request entity
@Entity('approval_requests')
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  currentState: string;

  @ManyToOne(() => User)
  requestedBy: User;

  @Column()
  requestedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  approvedBy?: User;

  @Column({ nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;
}

// 3. Workflow service
@Injectable()
export class WorkflowService {
  async submitForApproval(
    entityType: string,
    entityId: string,
    user: User,
  ) {
    const workflow = await this.getWorkflow(entityType);
    
    // Create approval request
    const request = this.approvalRepository.create({
      entityType,
      entityId,
      currentState: 'pending_approval',
      requestedBy: user,
      requestedAt: new Date(),
      status: 'pending',
    });
    
    await this.approvalRepository.save(request);
    
    // Notify approvers
    await this.notifyApprovers(workflow, request);
    
    return request;
  }

  async approve(requestId: string, user: User) {
    const request = await this.approvalRepository.findOne(requestId);
    
    // Check permission
    const workflow = await this.getWorkflow(request.entityType);
    if (!this.canApprove(workflow, user)) {
      throw new ForbiddenException('You cannot approve this request');
    }
    
    // Update request
    request.status = 'approved';
    request.approvedBy = user;
    request.approvedAt = new Date();
    
    await this.approvalRepository.save(request);
    
    // Update entity state
    await this.updateEntityState(
      request.entityType,
      request.entityId,
      'approved',
    );
    
    // Notify requester
    await this.notifyRequester(request);
    
    return request;
  }

  async reject(requestId: string, user: User, reason: string) {
    const request = await this.approvalRepository.findOne(requestId);
    
    request.status = 'rejected';
    request.approvedBy = user;
    request.approvedAt = new Date();
    request.rejectionReason = reason;
    
    await this.approvalRepository.save(request);
    
    // Update entity state
    await this.updateEntityState(
      request.entityType,
      request.entityId,
      'rejected',
    );
    
    await this.notifyRequester(request);
    
    return request;
  }
}
```

**Key Learnings**:
- ✅ Create generic workflow engine
- ✅ Store workflow definitions in DB
- ✅ Track approval history
- ✅ Send notifications to approvers
- ✅ Support multi-level approvals
- ✅ Allow rejection with reason

---

## 4. 📋 Metadata-Driven Patterns

### 4.1. Dynamic Schema (DocType-like)

**ERPNext Pattern**:
```json
{
  "doctype": "Sales Invoice",
  "fields": [
    {
      "fieldname": "customer",
      "fieldtype": "Link",
      "options": "Customer",
      "reqd": 1
    }
  ]
}
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: TypeScript decorators + metadata

// 1. Create field metadata decorator
export function Field(options: FieldOptions) {
  return function (target: any, propertyKey: string) {
    const metadata = Reflect.getMetadata('fields', target.constructor) || [];
    metadata.push({
      name: propertyKey,
      ...options,
    });
    Reflect.defineMetadata('fields', metadata, target.constructor);
  };
}

interface FieldOptions {
  label: string;
  type: 'string' | 'number' | 'date' | 'link' | 'table';
  required?: boolean;
  readonly?: boolean;
  options?: string; // For link/select fields
  default?: any;
}

// 2. Use in entity
@Entity('sales_invoices')
export class SalesInvoice {
  @Column()
  @Field({
    label: 'Customer',
    type: 'link',
    options: 'Customer',
    required: true,
  })
  customerId: string;

  @Column({ type: 'date' })
  @Field({
    label: 'Invoice Date',
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  date: Date;

  @Column({ type: 'decimal' })
  @Field({
    label: 'Grand Total',
    type: 'number',
    readonly: true,
  })
  grandTotal: number;
}

// 3. Generate UI from metadata
export class FormGenerator {
  static generateForm(entityClass: any) {
    const fields = Reflect.getMetadata('fields', entityClass) || [];
    
    return fields.map(field => ({
      name: field.name,
      label: field.label,
      type: this.mapFieldType(field.type),
      required: field.required,
      readonly: field.readonly,
      options: field.options,
      default: field.default,
    }));
  }
  
  private static mapFieldType(type: string) {
    const mapping = {
      'string': 'text',
      'number': 'number',
      'date': 'date',
      'link': 'select',
      'table': 'table',
    };
    return mapping[type] || 'text';
  }
}

// 4. Use in frontend
const formConfig = FormGenerator.generateForm(SalesInvoice);
// Returns:
// [
//   { name: 'customerId', label: 'Customer', type: 'select', required: true },
//   { name: 'date', label: 'Invoice Date', type: 'date', required: true },
//   { name: 'grandTotal', label: 'Grand Total', type: 'number', readonly: true },
// ]
```

**Key Learnings**:
- ✅ Use TypeScript decorators for metadata
- ✅ Store metadata with Reflect API
- ✅ Generate UI from metadata
- ✅ Keep type safety with TypeScript
- ✅ Better than JSON (version control, IDE support)

---

## 5. 🌐 API Patterns

### 5.1. Auto-Generated CRUD API

**ERPNext Pattern**:
```python
# Auto-generated endpoints for every DocType
GET /api/resource/Sales Invoice
POST /api/resource/Sales Invoice
PUT /api/resource/Sales Invoice/{name}
DELETE /api/resource/Sales Invoice/{name}
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Generic CRUD controller factory

// 1. Create base CRUD controller
export function CrudController<T>(
  entityClass: Type<T>,
  createDto: Type<any>,
  updateDto: Type<any>,
) {
  @Controller()
  class BaseCrudController {
    constructor(
      @Inject(getRepositoryToken(entityClass))
      private repository: Repository<T>,
    ) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
      @Query() query: QueryDto,
      @CurrentUser() user: User,
    ) {
      const qb = this.repository.createQueryBuilder('entity');
      
      // Apply filters
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          qb.andWhere(`entity.${key} = :${key}`, { [key]: value });
        });
      }
      
      // Apply pagination
      qb.skip(query.skip || 0).take(query.limit || 20);
      
      return qb.getManyAndCount();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
      const entity = await this.repository.findOne(id);
      if (!entity) {
        throw new NotFoundException();
      }
      return entity;
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
      @Body() dto: createDto,
      @CurrentUser() user: User,
    ) {
      const entity = this.repository.create({
        ...dto,
        createdBy: user.id,
        tenantId: user.tenantId,
      });
      return this.repository.save(entity);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(
      @Param('id') id: string,
      @Body() dto: updateDto,
    ) {
      await this.repository.update(id, dto);
      return this.findOne(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string) {
      await this.repository.delete(id);
      return { deleted: true };
    }
  }

  return BaseCrudController;
}

// 2. Use in specific controller
@Controller('sales-invoices')
export class SalesInvoiceController extends CrudController(
  SalesInvoice,
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
) {
  // Add custom endpoints
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    // Custom logic
  }
}
```

**Key Learnings**:
- ✅ Create generic CRUD controller
- ✅ Extend for custom endpoints
- ✅ Apply guards and permissions
- ✅ Support filtering and pagination
- ✅ Reduce boilerplate code

---

### 5.2. Custom API Methods

**Odoo Pattern**:
```python
@api.model
def create_from_template(self, template_id):
    template = self.browse(template_id)
    return self.create({
        'name': template.name,
        'lines': [(0, 0, line.copy_data()[0]) for line in template.lines]
    })
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Custom endpoints in controller

@Controller('sales-invoices')
export class SalesInvoiceController {
  // Standard CRUD inherited from base
  
  // Custom method
  @Post('from-template/:templateId')
  @UseGuards(JwtAuthGuard)
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @CurrentUser() user: User,
  ) {
    const template = await this.service.findOne(templateId);
    
    return this.service.create({
      customerId: template.customerId,
      items: template.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      createdBy: user.id,
    });
  }

  // Bulk operation
  @Post('bulk-approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  async bulkApprove(
    @Body() dto: BulkApproveDto,
    @CurrentUser() user: User,
  ) {
    const results = await Promise.all(
      dto.ids.map(id => this.service.approve(id, user))
    );
    return { approved: results.length };
  }

  // Report endpoint
  @Get('reports/aged-receivables')
  @UseGuards(JwtAuthGuard)
  async agedReceivables(@Query() query: ReportQueryDto) {
    return this.service.getAgedReceivables(query);
  }
}
```

**Key Learnings**:
- ✅ Add custom endpoints for business logic
- ✅ Use descriptive endpoint names
- ✅ Support bulk operations
- ✅ Create report endpoints
- ✅ Apply proper guards and roles

---

## 6. 🧪 Testing Patterns

### 6.1. Unit Tests

**Odoo Pattern**:
```python
# Odoo: TransactionCase
class TestAccountMove(TransactionCase):
    def test_balanced_entry(self):
        move = self.env['account.move'].create({
            'date': '2026-03-07',
            'line_ids': [
                (0, 0, {'account_id': 1, 'debit': 100}),
                (0, 0, {'account_id': 2, 'credit': 100}),
            ]
        })
        self.assertEqual(move.state, 'draft')
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Jest + TypeORM testing utilities

describe('JournalEntryService', () => {
  let service: JournalEntryService;
  let repository: Repository<JournalEntry>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JournalEntryService,
        {
          provide: getRepositoryToken(JournalEntry),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get(JournalEntryService);
    repository = module.get(getRepositoryToken(JournalEntry));
  });

  describe('create', () => {
    it('should create balanced entry', async () => {
      const dto = {
        date: new Date('2026-03-07'),
        lines: [
          { accountId: '1', debit: 100, credit: 0 },
          { accountId: '2', debit: 0, credit: 100 },
        ],
      };

      jest.spyOn(repository, 'save').mockResolvedValue({
        id: '123',
        ...dto,
      } as any);

      const result = await service.create(dto);

      expect(result.id).toBe('123');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw error for unbalanced entry', async () => {
      const dto = {
        date: new Date('2026-03-07'),
        lines: [
          { accountId: '1', debit: 100, credit: 0 },
          { accountId: '2', debit: 0, credit: 50 },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(
        'Entry must be balanced'
      );
    });
  });
});
```


**Key Learnings**:
- ✅ Use Jest for testing
- ✅ Mock repository methods
- ✅ Test both success and error cases
- ✅ Aim for 80%+ coverage
- ✅ Test business logic, not just CRUD

---

### 6.2. Integration Tests

**ERPNext Pattern**:
```python
# ERPNext: Integration tests
class TestSalesInvoice(unittest.TestCase):
    def test_gl_entries(self):
        invoice = make_sales_invoice()
        invoice.submit()
        
        gl_entries = frappe.get_all('GL Entry',
            filters={'voucher_no': invoice.name})
        
        self.assertEqual(len(gl_entries), 2)
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: E2E tests with test database

describe('JournalEntry (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<JournalEntry>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get(getRepositoryToken(JournalEntry));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    await repository.delete({});
  });

  it('POST /journal-entries should create entry and GL entries', async () => {
    const dto = {
      date: '2026-03-07',
      lines: [
        { accountId: 'acc1', debit: 100, credit: 0 },
        { accountId: 'acc2', debit: 0, credit: 100 },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/journal-entries')
      .set('Authorization', `Bearer ${token}`)
      .send(dto)
      .expect(201);

    expect(response.body.id).toBeDefined();

    // Verify GL entries created
    const glEntries = await glRepository.find({
      where: { journalEntryId: response.body.id },
    });
    expect(glEntries).toHaveLength(2);
  });

  it('should enforce record-level security', async () => {
    // Create entry as user1
    const entry = await createEntry(user1Token);

    // Try to access as user2 (different company)
    await request(app.getHttpServer())
      .get(`/journal-entries/${entry.id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404); // Should not see other company's data
  });
});
```

**Key Learnings**:
- ✅ Use separate test database
- ✅ Clean data between tests
- ✅ Test full request/response cycle
- ✅ Test security and permissions
- ✅ Test side effects (GL entries, stock moves, etc.)

---

## 7. 📦 Module Patterns

### 7.1. Module Structure

**Odoo Pattern**:
```
account/
├── __manifest__.py
├── models/
├── views/
├── security/
├── data/
└── controllers/
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: NestJS module structure

accounting/
├── accounting.module.ts          # Module definition
├── entities/                     # Database entities
│   ├── journal-entry.entity.ts
│   ├── journal-line.entity.ts
│   ├── account.entity.ts
│   └── gl-entry.entity.ts
├── dto/                          # Data transfer objects
│   ├── create-journal-entry.dto.ts
│   ├── update-journal-entry.dto.ts
│   └── query-journal-entry.dto.ts
├── controllers/                  # HTTP controllers
│   ├── journal-entry.controller.ts
│   ├── account.controller.ts
│   └── report.controller.ts
├── services/                     # Business logic
│   ├── journal-entry.service.ts
│   ├── account.service.ts
│   ├── gl-entry.service.ts
│   └── report.service.ts
├── guards/                       # Authorization guards
│   └── accounting-permission.guard.ts
├── decorators/                   # Custom decorators
│   └── field.decorator.ts
├── constants/                    # Constants and enums
│   └── account-types.ts
└── tests/                        # Tests
    ├── journal-entry.service.spec.ts
    └── journal-entry.e2e-spec.ts

// accounting.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalEntry,
      JournalLine,
      Account,
      GLEntry,
    ]),
  ],
  controllers: [
    JournalEntryController,
    AccountController,
    ReportController,
  ],
  providers: [
    JournalEntryService,
    AccountService,
    GLEntryService,
    ReportService,
  ],
  exports: [
    JournalEntryService,
    AccountService,
  ],
})
export class AccountingModule {}
```

**Key Learnings**:
- ✅ One module per business domain
- ✅ Separate entities, DTOs, services, controllers
- ✅ Export services for other modules
- ✅ Keep tests in same directory
- ✅ Use barrel exports (index.ts)

---

### 7.2. Module Dependencies

**Odoo Pattern**:
```python
# __manifest__.py
{
    'depends': ['base', 'product', 'stock'],
}
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Import dependent modules

@Module({
  imports: [
    // Core modules
    CommonModule,
    AuthModule,
    
    // Business modules
    ProductModule,
    InventoryModule,
    
    // Database
    TypeOrmModule.forFeature([SalesOrder, SalesOrderLine]),
  ],
  controllers: [SalesOrderController],
  providers: [SalesOrderService],
  exports: [SalesOrderService],
})
export class SalesModule {}
```

**Key Learnings**:
- ✅ Import only what you need
- ✅ Avoid circular dependencies
- ✅ Use forwardRef() if circular is unavoidable
- ✅ Export services for reuse

---

## 8. 🔒 Security Patterns

### 8.1. Multi-Tenancy

**Odoo Pattern**:
```python
# Database-per-tenant
company_id = fields.Many2one('res.company', required=True)
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: Schema-based multi-tenancy (already implemented)

// 1. Tenant entity
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  schema: string;

  @Column()
  name: string;
}

// 2. Tenant middleware
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'];
    if (tenantId) {
      req['tenantId'] = tenantId;
    }
    next();
  }
}

// 3. Tenant interceptor
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    
    // Set schema for this request
    if (tenantId) {
      // TypeORM will use this schema
      request.connection.schema = tenantId;
    }
    
    return next.handle();
  }
}
```

**Key Learnings**:
- ✅ SmartERP's schema-based approach is better
- ✅ Use middleware to extract tenant
- ✅ Use interceptor to set schema
- ✅ Ensure all queries use tenant schema

---

### 8.2. Input Validation

**Odoo Pattern**:
```python
@api.constrains('amount')
def _check_amount(self):
    if self.amount < 0:
        raise ValidationError("Amount must be positive")
```

**SmartERP Implementation**:
```typescript
// ✅ RECOMMENDED: class-validator + custom validators

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  @ArrayMinSize(2)
  lines: JournalLineDto[];
}

export class JournalLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @ValidateIf(o => o.debit === 0 && o.credit === 0)
  @IsNotEmpty({ message: 'Either debit or credit must be non-zero' })
  _validation?: any;
}
```

**Key Learnings**:
- ✅ Use class-validator decorators
- ✅ Validate at DTO level
- ✅ Create custom validators for complex rules
- ✅ Return descriptive error messages

---

## 📊 Summary: Pattern Adoption Priority

### 🔴 HIGH Priority (Implement First)

1. **Record-Level Security** - Critical for multi-user systems
2. **Computed Fields** - Reduce manual calculations
3. **State Machine** - Proper workflow management
4. **Validation** - Data integrity
5. **Testing** - Quality assurance

### 🟡 MEDIUM Priority (Implement Next)

6. **Approval Workflows** - Business process automation
7. **Field-Level Permissions** - Fine-grained access control
8. **Auto-Generated CRUD** - Reduce boilerplate
9. **Module Structure** - Better organization

### 🟢 LOW Priority (Nice to Have)

10. **Metadata-Driven UI** - Dynamic forms
11. **Custom API Methods** - Advanced features
12. **Integration Tests** - Additional quality checks

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- ✅ Implement record-level security
- ✅ Add computed fields pattern
- ✅ Create state machine base
- ✅ Add validation decorators

### Phase 2: Workflows (Weeks 5-8)
- ✅ Build approval workflow engine
- ✅ Add state transitions
- ✅ Implement notifications

### Phase 3: Advanced (Weeks 9-12)
- ✅ Metadata-driven forms
- ✅ Auto-generated CRUD
- ✅ Field-level permissions
- ✅ Integration tests

---

## 📚 References

- [Odoo Documentation](https://www.odoo.com/documentation/17.0/)
- [ERPNext Documentation](https://docs.erpnext.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- Source code: `research/competitors/odoo/`, `research/competitors/erpnext/`

---

**Next Steps**:
1. Review this guide with team
2. Create implementation specs for each pattern
3. Start with HIGH priority patterns
4. Update steering files with learned patterns

---

**Created**: 2026-03-07  
**Status**: ✅ Complete  
**Next Document**: `IMPLEMENTATION-RECOMMENDATIONS.md`

