---
inclusion: manual
description: 'ERP-specific implementation guide for SmartERP. Covers Odoo/ERPNext research workflow, ERP domain patterns, module structure, and plaster manufacturing workflows. Use when implementing ERP features or researching ERP best practices.'
---

# ERP Implementation Guide

**Odoo & ERPNext patterns for SmartERP development**

---

## 🎯 Overview

This guide covers ERP-specific patterns and SmartERP implementation details:

- Odoo/ERPNext research workflow
- ERP module structure
- Domain-specific patterns (Accounting, Inventory, Manufacturing)
- SmartERP business logic (Plaster manufacturing)

**Use this guide when:**

- Implementing ERP modules (Accounting, Inventory, HR, etc.)
- Need to research Odoo/ERPNext patterns
- Working on SmartERP-specific features
- Designing manufacturing workflows

---

## ⚠️ CRITICAL: Research Workflow

**MANDATORY:** Before implementing any ERP module, follow this research workflow:

### Step 1: Research Odoo Architecture

**Time**: 10-60 minutes (adaptive based on complexity)

**Simple modules** (10-15 min):

- Settings, Logs, Simple lookups
- Basic CRUD operations
- No complex business logic

**Moderate modules** (20-30 min):

- Email templates, Notifications
- User management
- Some business logic, relationships

**Complex modules** (30-60 min):

- Accounting, Inventory, Manufacturing
- Approval workflows
- State machines, integrations

**Research Steps:**

1. 🔍 Search: "Odoo [module-name] architecture"
2. 📖 Read: Official Odoo documentation
3. 💡 Understand: Module structure, inheritance, workflow patterns
4. 📝 Note: Key patterns to adopt

**Example:**

```
Task: Implement Accounting Module
↓
Search: "Odoo accounting architecture"
Read: https://www.odoo.com/documentation/17.0/applications/finance/accounting.html
Understand:
  - Chart of Accounts structure
  - Journal Entry workflow
  - Multi-currency handling
  - Reconciliation process
Note:
  - Use hierarchical account structure
  - Implement double-entry bookkeeping
  - Support multi-currency from day 1
```

---

### Step 2: Research ERPNext Architecture

**Time**: 10-60 minutes (same as Odoo)

**Research Steps:**

1. 🔍 Search: "ERPNext [module-name] implementation"
2. 📖 Read: ERPNext GitHub source code
3. 💡 Understand: DocType, permissions, hooks, workflows
4. 📝 Note: Key patterns to adopt

**Example:**

```
Task: Implement Accounting Module
↓
Search: "ERPNext accounting implementation"
Read: https://github.com/frappe/erpnext/tree/develop/erpnext/accounts
Understand:
  - Account DocType structure
  - GL Entry patterns
  - Cost Center & Profit Center
  - Payment reconciliation
Note:
  - Use GL Entry for all transactions
  - Implement Cost Center for department tracking
  - Support Profit Center for business units
```

---

### Step 3: Compare & Decide

**Time**: 15-30 minutes

**Comparison Framework:**

| Aspect        | Odoo Approach       | ERPNext Approach   | SmartERP Decision |
| ------------- | ------------------- | ------------------ | ----------------- |
| Data Model    | ORM models          | DocType            | TypeORM entities  |
| Permissions   | Record rules        | Permission Manager | PermissionService |
| Workflows     | State machine       | Workflow DocType   | WorkflowService   |
| Multi-tenancy | Database per tenant | Company field      | tenantId field    |
| Audit Trail   | Chatter             | Version control    | Audit fields      |

**Decision Criteria:**

1. Which approach is simpler?
2. Which fits our tech stack better?
3. Which is more maintainable?
4. Which has better performance?

**Document Decision:**

```typescript
/**
 * Accounting Module Implementation
 *
 * Research Summary:
 * - Odoo: Uses hierarchical chart of accounts with account.account model
 * - ERPNext: Uses flat account structure with Account DocType
 *
 * Decision: Hybrid approach
 * - Use hierarchical structure (Odoo) for better organization
 * - Use GL Entry pattern (ERPNext) for transaction tracking
 * - Implement Cost Center (ERPNext) for department tracking
 *
 * Reasoning:
 * - Hierarchical accounts easier to manage
 * - GL Entry provides clear audit trail
 * - Cost Center needed for multi-department tracking
 */
```

---

### Step 4: Implement with Confidence

After research, implement following multi-tenant patterns:

1. SecureRepository for tenant isolation
2. PermissionService for access control
3. Audit trail for compliance
4. Caching for performance

---

## 🏗️ ERP Module Structure

### Module-based Architecture (Odoo Style)

**Structure:**

```
src/backend/domains/
├── accounting/
│   ├── entities/
│   │   ├── account.entity.ts
│   │   ├── journal-entry.entity.ts
│   │   └── gl-entry.entity.ts
│   ├── services/
│   │   ├── account.service.ts
│   │   ├── journal-entry.service.ts
│   │   └── gl-entry.service.ts
│   ├── controllers/
│   │   ├── account.controller.ts
│   │   └── journal-entry.controller.ts
│   ├── dto/
│   │   ├── create-account.dto.ts
│   │   └── create-journal-entry.dto.ts
│   └── accounting.module.ts
│
├── inventory/
│   ├── entities/
│   ├── services/
│   ├── controllers/
│   └── inventory.module.ts
│
└── manufacturing/
    ├── entities/
    ├── services/
    ├── controllers/
    └── manufacturing.module.ts
```

**Key Principles:**

- Each domain is independent module
- Modules can depend on other modules
- Clear separation of concerns
- Easy to enable/disable modules

---

## 📊 ERP Domain Patterns

### 1. Accounting Patterns

**Chart of Accounts:**

```typescript
@Entity()
export class Account extends BaseEntity {
  @Column()
  code: string; // 1000, 1100, 1110

  @Column()
  name: string; // Assets, Current Assets, Cash

  @Column()
  type: AccountType; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

  @Column({ nullable: true })
  parentId: string; // Hierarchical structure

  @Column()
  tenantId: string;
}
```

**Journal Entry (Double-Entry):**

```typescript
@Entity()
export class JournalEntry extends BaseEntity {
  @Column()
  number: string; // JE-2024-00001

  @Column()
  date: Date;

  @Column()
  status: JournalEntryStatus; // DRAFT, POSTED, CANCELLED

  @OneToMany(() => GLEntry, (entry) => entry.journalEntry)
  entries: GLEntry[];

  // Must balance: sum(debit) = sum(credit)
}

@Entity()
export class GLEntry extends BaseEntity {
  @ManyToOne(() => JournalEntry)
  journalEntry: JournalEntry;

  @ManyToOne(() => Account)
  account: Account;

  @Column('decimal')
  debit: number;

  @Column('decimal')
  credit: number;

  @Column()
  tenantId: string;
}
```

---

### 2. Inventory Patterns

**Stock Movement:**

```typescript
@Entity()
export class StockEntry extends BaseEntity {
  @Column()
  number: string; // SE-2024-00001

  @Column()
  type: StockEntryType; // RECEIPT, ISSUE, TRANSFER

  @Column()
  date: Date;

  @OneToMany(() => StockEntryItem, (item) => item.stockEntry)
  items: StockEntryItem[];

  @Column()
  tenantId: string;
}

@Entity()
export class StockEntryItem extends BaseEntity {
  @ManyToOne(() => StockEntry)
  stockEntry: StockEntry;

  @ManyToOne(() => Item)
  item: Item;

  @Column('decimal')
  quantity: number;

  @Column()
  fromWarehouse: string;

  @Column()
  toWarehouse: string;

  @Column()
  tenantId: string;
}
```

**Stock Balance:**

```typescript
@Entity()
export class StockBalance extends BaseEntity {
  @ManyToOne(() => Item)
  item: Item;

  @ManyToOne(() => Warehouse)
  warehouse: Warehouse;

  @Column('decimal')
  quantity: number;

  @Column()
  tenantId: string;

  // Unique constraint: item + warehouse + tenant
}
```

---

### 3. Manufacturing Patterns

**Bill of Materials (BOM):**

```typescript
@Entity()
export class BOM extends BaseEntity {
  @Column()
  number: string; // BOM-2024-00001

  @ManyToOne(() => Item)
  finishedGood: Item;

  @Column('decimal')
  quantity: number; // Output quantity

  @OneToMany(() => BOMItem, (item) => item.bom)
  items: BOMItem[];

  @Column()
  tenantId: string;
}

@Entity()
export class BOMItem extends BaseEntity {
  @ManyToOne(() => BOM)
  bom: BOM;

  @ManyToOne(() => Item)
  rawMaterial: Item;

  @Column('decimal')
  quantity: number; // Required quantity

  @Column()
  tenantId: string;
}
```

**Work Order:**

```typescript
@Entity()
export class WorkOrder extends BaseEntity {
  @Column()
  number: string; // WO-2024-00001

  @ManyToOne(() => BOM)
  bom: BOM;

  @Column('decimal')
  plannedQuantity: number;

  @Column('decimal')
  producedQuantity: number;

  @Column()
  status: WorkOrderStatus; // DRAFT, IN_PROGRESS, COMPLETED

  @Column()
  plannedStartDate: Date;

  @Column()
  plannedEndDate: Date;

  @Column()
  tenantId: string;
}
```

---

## 🏭 SmartERP Business Logic

### Plaster Manufacturing Workflow

**1. Raw Material Receipt:**

```
Purchase Order → Goods Receipt → Stock Entry (Receipt)
↓
Update Stock Balance
↓
Create GL Entry (Debit: Raw Material, Credit: Payable)
```

**2. Production Planning:**

```
Sales Order → Production Plan → Work Orders
↓
Check BOM
↓
Check Raw Material Availability
↓
Schedule Production
```

**3. Production Execution:**

```
Work Order (Draft) → Start Production → In Progress
↓
Issue Raw Materials (Stock Entry - Issue)
↓
Quality Check (Batch-wise)
↓
Finish Production (Stock Entry - Receipt)
↓
Complete Work Order
```

**4. Quality Control:**

```typescript
@Entity()
export class QualityInspection extends BaseEntity {
  @Column()
  number: string; // QI-2024-00001

  @ManyToOne(() => WorkOrder)
  workOrder: WorkOrder;

  @Column()
  batchNumber: string;

  @Column()
  inspectionDate: Date;

  @Column()
  status: QualityStatus; // PASS, FAIL, PENDING

  @Column('json')
  parameters: {
    thickness: number;
    strength: number;
    moisture: number;
  };

  @Column()
  tenantId: string;
}
```

**5. Batch Tracking:**

```typescript
@Entity()
export class Batch extends BaseEntity {
  @Column()
  number: string; // BATCH-2024-00001

  @ManyToOne(() => Item)
  item: Item;

  @Column()
  manufactureDate: Date;

  @Column()
  expiryDate: Date;

  @Column('decimal')
  quantity: number;

  @Column()
  status: BatchStatus; // ACTIVE, EXPIRED, QUARANTINE

  @Column()
  tenantId: string;
}
```

---

## 🎯 Implementation Checklist

When implementing ERP module:

**Research Phase:**

- [ ] Research Odoo architecture (10-60 min)
- [ ] Research ERPNext implementation (10-60 min)
- [ ] Compare approaches (15-30 min)
- [ ] Document decision with reasoning

**Implementation Phase:**

- [ ] Follow multi-tenant patterns
- [ ] Use SecureRepository for all queries
- [ ] Implement audit trail
- [ ] Add caching where appropriate
- [ ] Write comprehensive tests

**ERP-Specific:**

- [ ] Document numbering implemented
- [ ] Status management with state machine
- [ ] Workflow/approval if needed
- [ ] Multi-currency support (if applicable)
- [ ] Batch tracking (if applicable)

---

## 📚 Resources

**Odoo Documentation:**

- Official Docs: https://www.odoo.com/documentation/
- Developer Guide: https://www.odoo.com/documentation/17.0/developer.html
- ORM Reference: https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html

**ERPNext Documentation:**

- Official Docs: https://docs.erpnext.com/
- GitHub: https://github.com/frappe/erpnext
- Frappe Framework: https://frappeframework.com/docs

**SmartERP Documentation:**

- Architecture: `docs/architecture/`
- Odoo Analysis: `docs/ODOO-ARCHITECTURE-ANALYSIS.md`
- ERPNext Analysis: `docs/ERPNEXT-ARCHITECTURE-ANALYSIS.md`

---

## 🔗 Related Guides

- **General Patterns**: `.kiro/steering/multi-tenant-architecture-patterns.md`
- **SecureRepository**: `.kiro/skills/secure-repository-pattern/`
- **Migration**: `.kiro/steering/migration-guide.md`
- **Troubleshooting**: `.kiro/steering/troubleshooting-guide.md`

---

**Last Updated**: 2026-03-09  
**Version**: 1.0.0  
**Type**: ERP-Specific (SmartERP)
