# Odoo & ERPNext Sales/CRM Architecture Research

**Date:** 2026-03-08  
**Researcher:** Tech Lead (Kiro)  
**Purpose:** Research patterns for refactoring SmartERP Sales/CRM services

---

## 📚 RESEARCH SOURCES

**Odoo:**

- [Detailed Analysis of Odoo 15 Sales & CRM Modules](https://www.cybrosys.com/blog/detailed-analysis-of-odoo-15-sales-crm-modules)
- [How to customize an existing module in Odoo](https://www.zen8labs.com/insights/programming/how-to-customize-an-existing-module-in-odoo-a-comprehensive-guide/)

**ERPNext:**

- [Understanding DocTypes in ERPNext](https://nexeves.com/blog/ERPNext/understanding-doctypes-in-erpnext)
- [ERPNext Database Schema Design Principles](https://nexeves.com/blog/ERPNext/erpnext-database-schema-design-principles)
- [ERPNext CRM System Overview](https://www.sigzen.com/erpnext/crm/)

---

## 🏗️ ODOO SALES/CRM ARCHITECTURE

### Core Concepts

**1. Module-based Architecture:**

- Sales and CRM are separate but integrated modules
- Each module is independent addon that extends core
- Modules can depend on each other (`depends: ["sale"]`)

**2. Model Inheritance Pattern:**

```python
class CustomSaleOrder(models.Model):
    _inherit = 'sale.order'  # Extend existing model
    x_custom_field = fields.Char(string="Custom Field")
```

**3. Key Models:**

- `sale.order` - Sales Orders
- `sale.order.line` - Order Lines
- `crm.lead` - Leads/Opportunities
- `res.partner` - Customers/Contacts

**4. Workflow:**

```
Lead (CRM) → Opportunity → Quotation (Sales) → Sales Order → Invoice
```

**5. Integration Points:**

- CRM creates leads → Sales converts to quotations
- Quotations → Sales Orders → Invoicing (automatic)
- Customer data shared between CRM and Sales
- Reporting unified across modules

### Best Practices from Odoo

✅ **Separation of Concerns:**

- CRM handles lead management, pipelines, activities
- Sales handles quotations, orders, pricing, delivery

✅ **Model Inheritance:**

- Don't modify core models
- Extend via `_inherit` attribute
- Add custom fields with `x_` prefix

✅ **View Inheritance:**

- Extend views using XPath
- Don't duplicate entire views
- Position: inside, after, before, replace

✅ **State Management:**

- Clear stages: New → Qualified → Proposition → Won
- Color coding for urgency (red=overdue, orange=today)
- State transitions with validation

---

## 🏗️ ERPNEXT SALES/CRM ARCHITECTURE

### Core Concepts

**1. DocType-based Architecture:**

- DocType = data model + behavioral contract
- Each DocType maps to one database table (`tab{doctype}`)
- Metadata-driven: Schema is derived, not authored

**2. DocType Structure:**

```
DocType metadata defined
  ↓
Schema generated
  ↓
Runtime validation enforced
  ↓
Data persisted
```

**3. Key DocTypes:**

- `Lead` - Potential customers
- `Opportunity` - Qualified leads
- `Quotation` - Sales quotes
- `Sales Order` - Confirmed orders
- `Customer` - Customer master data

**4. Workflow:**

```
Lead → Opportunity → Quotation → Sales Order → Delivery Note → Sales Invoice
```

**5. Permission System:**

- Role-based permissions at DocType level
- Field-level permissions
- Document-level permissions (own vs all)
- Workflow-based permissions

### Best Practices from ERPNext

✅ **Metadata-Driven:**

- Define structure in DocType metadata
- Framework generates schema automatically
- Runtime validation enforced

✅ **Multi-tenancy:**

- Built-in tenant isolation
- Permission checks at every level
- Audit trail automatic

✅ **Document Numbering:**

- Auto-generated: `LEAD-2024-00001`
- Format: `{PREFIX}-{YEAR}-{SEQUENCE}`
- Configurable per DocType

✅ **Audit Trail:**

- Every change tracked automatically
- `created_by`, `modified_by`, `creation`, `modified`
- Version history built-in

---

## 🎯 SMARTERP DESIGN DECISIONS

### What to Adopt from Odoo

1. **Module Separation:**
   - Keep CRM and Sales as separate domains
   - Clear integration points
   - Independent but connected

2. **Model Inheritance Pattern:**
   - Use TypeScript/NestJS equivalent
   - Extend base entities
   - Don't modify core

3. **State Management:**
   - Clear stages with color coding
   - State machine pattern
   - Validation on transitions

### What to Adopt from ERPNext

1. **SecureRepository Pattern:**
   - Already implemented in SmartERP
   - Tenant isolation built-in
   - Permission checks automatic

2. **Document Numbering:**
   - Auto-generate: `SO-2024-00001`, `LEAD-2024-00001`
   - Consistent format across modules

3. **Audit Trail:**
   - Track all changes
   - `createdBy`, `updatedBy`, `createdAt`, `updatedAt`
   - Soft delete with `deletedAt`

### SmartERP Sales/CRM Architecture

**Entities:**

```typescript
// CRM Domain
- Lead (LEAD-2024-00001)
- Opportunity (OPP-2024-00001)
- Activity (task, call, meeting)

// Sales Domain
- Customer (CUST-2024-00001)
- Quotation (QUO-2024-00001)
- SalesOrder (SO-2024-00001)
- OrderLine
```

**Service Pattern:**

```typescript
@Injectable()
export class SalesOrderService {
  private secureOrderRepo: SecureRepository<SalesOrder>;

  constructor(
    @InjectRepository(SalesOrder)
    private readonly orderRepository: Repository<SalesOrder>,
    private readonly permissionService: PermissionService,
    private readonly cacheService: CacheService,
  ) {
    this.secureOrderRepo = new SecureRepository(orderRepository, permissionService, 'SalesOrder');
  }

  // User parameter FIRST (ERPNext style)
  async findAllOrders(user: User, filters?: OrderFilters): Promise<SalesOrder[]> {
    return this.secureOrderRepo.find(user, { where: filters });
  }

  async createOrder(user: User, data: CreateOrderDto): Promise<SalesOrder> {
    // Auto-generate order number (ERPNext style)
    const orderNumber = await this.generateOrderNumber(user.tenantId);

    const order = {
      ...data,
      orderNumber,
      status: OrderStatus.DRAFT, // Odoo style state
    };

    return this.secureOrderRepo.save(user, order);
  }

  // Document numbering (ERPNext style)
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.orderRepository.count({ where: { tenantId } });
    return `SO-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
```

**Workflow Integration:**

```typescript
// CRM → Sales conversion
async convertLeadToOpportunity(user: User, leadId: string): Promise<Opportunity> {
  const lead = await this.secureLeadRepo.findOne(user, { where: { id: leadId } });

  // Create opportunity from lead
  const opportunity = {
    leadId: lead.id,
    customerId: lead.customerId,
    expectedRevenue: lead.estimatedValue,
    stage: OpportunityStage.QUALIFIED,
  };

  return this.secureOpportunityRepo.save(user, opportunity);
}

async convertOpportunityToQuotation(user: User, oppId: string): Promise<Quotation> {
  const opp = await this.secureOpportunityRepo.findOne(user, { where: { id: oppId } });

  // Create quotation from opportunity
  const quotation = {
    opportunityId: opp.id,
    customerId: opp.customerId,
    quotationNumber: await this.generateQuotationNumber(user.tenantId),
    status: QuotationStatus.DRAFT,
  };

  return this.secureQuotationRepo.save(user, quotation);
}
```

---

## 📋 REFACTORING CHECKLIST

**For Each Service:**

1. ✅ Inject PermissionService
2. ✅ Initialize SecureRepository in constructor
3. ✅ User parameter FIRST in all methods
4. ✅ Use secureRepo.find/findOne/save/remove
5. ✅ Implement document numbering
6. ✅ Add status enum with clear stages
7. ✅ Cache with tenant-aware keys
8. ✅ Audit trail (createdBy, updatedBy, etc.)
9. ✅ Soft delete (deletedAt)
10. ✅ Update tests to mock SecureRepository

---

## 🎓 KEY LEARNINGS

**From Odoo:**

- Module separation is powerful
- Inheritance > Modification
- Clear state management
- Integration points well-defined

**From ERPNext:**

- Metadata-driven is flexible
- Multi-tenancy built-in
- Audit trail automatic
- Permission system comprehensive

**For SmartERP:**

- Combine best of both worlds
- SecureRepository = ERPNext permissions + Odoo flexibility
- Document numbering = ERPNext style
- State management = Odoo style
- Module structure = Odoo style
- Security = ERPNext style

---

**Research Complete:** 2026-03-08  
**Time Spent:** 1 hour  
**Next Step:** Create refactoring template
