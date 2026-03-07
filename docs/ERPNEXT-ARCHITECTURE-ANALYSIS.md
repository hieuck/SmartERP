# ERPNext/Frappe Architecture Analysis

**Version**: ERPNext 15.100.2 / Frappe 15.101.5  
**Date**: 2026-03-07  
**Purpose**: Phân tích kiến trúc ERPNext/Frappe để học hỏi best practices cho SmartERP

---

## 📊 Overview

ERPNext là một ERP open-source được xây dựng trên Frappe Framework. Khác với Odoo, ERPNext sử dụng kiến trúc **metadata-driven** với DocType system.

### Key Statistics

**ERPNext**:
- **Total Files**: 4,591
- **Python Files**: ~1,500
- **JavaScript Files**: ~800
- **JSON Files**: ~1,000
- **Total Modules**: 18+ modules
- **Size**: ~17 MB

**Frappe Framework**:
- **Total Files**: 3,230
- **Python Files**: 1,384
- **JavaScript Files**: 641
- **Size**: ~19 MB

---

## 🏗️ Architecture Overview

### 1. Frappe Framework (`frappe/`)

Frappe là low-code framework, core của ERPNext:

```
frappe/
├── model/              # ⭐ ORM và DocType system
│   ├── document.py     # Base Document class
│   ├── meta.py         # DocType metadata
│   ├── db_query.py     # Query builder
│   └── naming.py       # Auto-naming rules
├── database/           # ⭐ Database abstraction
│   ├── database.py     # DB interface
│   ├── mariadb/        # MariaDB implementation
│   └── postgres/       # PostgreSQL implementation
├── desk/               # ⭐ UI framework (admin interface)
│   ├── form/           # Form builder
│   ├── listview.py     # List view
│   └── reportview.py   # Report builder
├── core/               # Core doctypes
├── api/                # REST API (v1, v2)
├── auth.py             # Authentication
├── permissions.py      # Permission system
├── workflow/           # Workflow engine
├── email/              # Email handling
├── integrations/       # Third-party integrations
├── website/            # Website framework
└── utils/              # Utilities
```

### 2. ERPNext Modules (`erpnext/`)

ERPNext có **18 modules** được tổ chức theo domain:

```
erpnext/
├── accounts/           # ⭐ Accounting (GL, invoices, payments)
├── stock/              # ⭐ Inventory/warehouse management
├── selling/            # Sales management
├── buying/             # Purchasing
├── manufacturing/      # MRP (Bill of Materials, Work Orders)
├── crm/                # Customer relationship management
├── projects/           # Project management
├── support/            # Help desk/ticketing
├── assets/             # Asset management
├── quality_management/ # Quality control
├── maintenance/        # Maintenance management
├── subcontracting/     # Subcontracting
├── erpnext_integrations/ # Integrations (Shopify, WooCommerce, etc.)
├── regional/           # Country-specific features
├── setup/              # Setup and configuration
├── utilities/          # Utilities
├── controllers/        # ⭐ Base controllers (shared logic)
└── domains/            # Domain-specific features
```

---

## 🎯 DocType System (Metadata-Driven)

### Core Concept

ERPNext/Frappe sử dụng **DocType** (Document Type) - một metadata-driven approach:

- **DocType** = Table definition + Business logic + UI definition
- Tất cả được định nghĩa trong **JSON files**
- No need to write SQL or create tables manually
- Framework tự động generate UI, API, permissions

### DocType Structure

Mỗi DocType có cấu trúc sau:

```
module_name/doctype/doctype_name/
├── doctype_name.json           # ⭐ Metadata (fields, permissions, etc.)
├── doctype_name.py             # ⭐ Business logic (controller)
├── doctype_name.js             # Client-side logic
├── doctype_name_list.js        # List view customization
├── doctype_name_calendar.js    # Calendar view
├── doctype_name_dashboard.py   # Dashboard widgets
└── test_doctype_name.py        # Unit tests
```

### Example: Sales Invoice DocType

#### 1. Metadata (`sales_invoice.json`)

```json
{
 "name": "Sales Invoice",
 "module": "Accounts",
 "doctype": "DocType",
 "is_submittable": 1,
 "track_changes": 1,
 "fields": [
  {
   "fieldname": "customer",
   "label": "Customer",
   "fieldtype": "Link",
   "options": "Customer",
   "reqd": 1
  },
  {
   "fieldname": "posting_date",
   "label": "Date",
   "fieldtype": "Date",
   "reqd": 1,
   "default": "Today"
  },
  {
   "fieldname": "items",
   "label": "Items",
   "fieldtype": "Table",
   "options": "Sales Invoice Item"
  },
  {
   "fieldname": "grand_total",
   "label": "Grand Total",
   "fieldtype": "Currency",
   "read_only": 1
  }
 ],
 "permissions": [
  {
   "role": "Accounts User",
   "read": 1,
   "write": 1,
   "create": 1,
   "submit": 1
  }
 ]
}
```

#### 2. Controller (`sales_invoice.py`)

```python
# erpnext/accounts/doctype/sales_invoice/sales_invoice.py

import frappe
from frappe.model.document import Document

class SalesInvoice(Document):
    """Sales Invoice controller"""
    
    def validate(self):
        """Validation before save"""
        self.calculate_totals()
        self.validate_posting_date()
    
    def on_submit(self):
        """Actions when document is submitted"""
        self.update_stock()
        self.make_gl_entries()
        self.update_customer_balance()
    
    def on_cancel(self):
        """Actions when document is cancelled"""
        self.reverse_gl_entries()
        self.update_customer_balance()
    
    def calculate_totals(self):
        """Calculate grand total"""
        self.grand_total = sum(item.amount for item.items)
    
    def make_gl_entries(self):
        """Create General Ledger entries"""
        from erpnext.accounts.general_ledger import make_gl_entries
        
        gl_entries = []
        
        # Debit: Accounts Receivable
        gl_entries.append({
            "account": self.debit_to,
            "debit": self.grand_total,
            "party_type": "Customer",
            "party": self.customer
        })
        
        # Credit: Sales Account
        gl_entries.append({
            "account": self.income_account,
            "credit": self.grand_total
        })
        
        make_gl_entries(gl_entries, cancel=(self.docstatus == 2))
```

---

## 🔧 Field Types

Frappe hỗ trợ nhiều field types:

### Basic Fields
- `Data` - Short text (varchar)
- `Text` - Long text
- `Int` - Integer
- `Float` - Decimal number
- `Currency` - Money
- `Date` - Date
- `Datetime` - Date and time
- `Check` - Boolean
- `Select` - Dropdown

### Relational Fields
- `Link` - Foreign key (Many-to-one)
- `Table` - Child table (One-to-many)
- `Dynamic Link` - Polymorphic relation

### Special Fields
- `Attach` - File upload
- `Attach Image` - Image upload
- `HTML` - Rich text editor
- `Code` - Code editor
- `Signature` - Digital signature
- `Geolocation` - GPS coordinates
- `Rating` - Star rating

---

## 🔐 Permission System

Frappe có permission system rất linh hoạt:

### 1. Role-Based Permissions

Defined trong DocType JSON:

```json
{
  "permissions": [
    {
      "role": "Sales User",
      "read": 1,
      "write": 1,
      "create": 1,
      "delete": 0,
      "submit": 1,
      "cancel": 1,
      "amend": 1
    }
  ]
}
```

### 2. Document-Level Permissions

```python
# Permission query (row-level security)
def get_permission_query_conditions(user):
    if not user:
        user = frappe.session.user
    
    if "Sales Manager" in frappe.get_roles(user):
        return None  # Can see all
    
    return f"""(`tabSales Invoice`.owner = '{user}')"""
```

### 3. Field-Level Permissions

```json
{
  "fieldname": "discount_amount",
  "label": "Discount",
  "fieldtype": "Currency",
  "permlevel": 1  // Only users with permlevel 1 can edit
}
```

---

## 🎨 UI Framework (Desk)

Frappe tự động generate UI từ DocType metadata:

### Form View

```javascript
// sales_invoice.js - Client-side customization

frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        // Add custom button
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Make Payment'), function() {
                // Create payment entry
                frappe.model.open_mapped_doc({
                    method: "erpnext.accounts.doctype.sales_invoice.sales_invoice.make_payment_entry",
                    frm: frm
                });
            });
        }
    },
    
    customer: function(frm) {
        // Fetch customer details
        if (frm.doc.customer) {
            frappe.call({
                method: "erpnext.accounts.party.get_party_details",
                args: {
                    party: frm.doc.customer,
                    party_type: "Customer"
                },
                callback: function(r) {
                    frm.set_value("customer_name", r.message.customer_name);
                    frm.set_value("currency", r.message.currency);
                }
            });
        }
    }
});
```

### List View

```javascript
// sales_invoice_list.js

frappe.listview_settings['Sales Invoice'] = {
    add_fields: ["customer", "grand_total", "outstanding_amount"],
    get_indicator: function(doc) {
        if (doc.outstanding_amount > 0) {
            return [__("Unpaid"), "orange", "outstanding_amount,>,0"];
        } else {
            return [__("Paid"), "green", "outstanding_amount,=,0"];
        }
    }
};
```

---

## 🌐 REST API

Frappe tự động generate REST API cho mọi DocType:

### Auto-Generated Endpoints

```bash
# Get list
GET /api/resource/Sales Invoice

# Get single document
GET /api/resource/Sales Invoice/{name}

# Create
POST /api/resource/Sales Invoice
{
  "customer": "CUST-001",
  "posting_date": "2026-03-07",
  "items": [...]
}

# Update
PUT /api/resource/Sales Invoice/{name}

# Delete
DELETE /api/resource/Sales Invoice/{name}
```

### Custom API Methods

```python
# sales_invoice.py

@frappe.whitelist()
def make_payment_entry(source_name):
    """Create Payment Entry from Sales Invoice"""
    from frappe.model.mapper import get_mapped_doc
    
    def set_missing_values(source, target):
        target.paid_amount = source.outstanding_amount
    
    doclist = get_mapped_doc("Sales Invoice", source_name, {
        "Sales Invoice": {
            "doctype": "Payment Entry",
            "field_map": {
                "grand_total": "paid_amount"
            }
        }
    }, None, set_missing_values)
    
    return doclist
```

---

## 🔄 Workflow Engine

Frappe có built-in workflow engine:

### Workflow Definition

```json
{
  "name": "Sales Invoice Approval",
  "document_type": "Sales Invoice",
  "states": [
    {
      "state": "Draft",
      "doc_status": 0,
      "allow_edit": "Sales User"
    },
    {
      "state": "Pending Approval",
      "doc_status": 0,
      "allow_edit": "Sales Manager"
    },
    {
      "state": "Approved",
      "doc_status": 1,
      "allow_edit": null
    }
  ],
  "transitions": [
    {
      "state": "Draft",
      "action": "Submit for Approval",
      "next_state": "Pending Approval",
      "allowed": "Sales User"
    },
    {
      "state": "Pending Approval",
      "action": "Approve",
      "next_state": "Approved",
      "allowed": "Sales Manager"
    }
  ]
}
```

---

## 📦 Multi-Tenancy

Frappe sử dụng **site-based multi-tenancy**:

- Mỗi tenant = 1 site (subdomain)
- Mỗi site = 1 database
- Shared application code
- Site-specific configurations

```bash
# Create new site
bench new-site site1.localhost

# Install ERPNext on site
bench --site site1.localhost install-app erpnext

# Switch between sites
bench use site1.localhost
```

---

## 🎯 Key Patterns

### 1. Document Lifecycle

```python
class Document:
    def validate(self):
        """Called before save"""
        pass
    
    def before_save(self):
        """Called before save (after validate)"""
        pass
    
    def on_update(self):
        """Called after save"""
        pass
    
    def on_submit(self):
        """Called when document is submitted"""
        pass
    
    def on_cancel(self):
        """Called when document is cancelled"""
        pass
    
    def on_trash(self):
        """Called before delete"""
        pass
```

### 2. Naming Rules

```python
# Auto-naming patterns
{
  "autoname": "field:customer_name",  # Use field value
  "autoname": "SINV-.YYYY.-.#####",   # Pattern with year and counter
  "autoname": "naming_series:",       # User-defined series
  "autoname": "Prompt"                # Ask user for name
}
```

### 3. Child Tables

```python
# Parent document
class SalesInvoice(Document):
    def validate(self):
        for item in self.items:  # Child table
            item.amount = item.qty * item.rate
```

---

## 🎯 Key Takeaways for SmartERP

### ✅ What to Adopt

1. **Metadata-Driven Approach**
   - Define schema in JSON/TypeScript
   - Auto-generate UI and API
   - Reduce boilerplate code

2. **Document Lifecycle Hooks**
   - validate(), before_save(), on_update()
   - on_submit(), on_cancel()
   - Clean separation of concerns

3. **Permission System**
   - Role-based + document-level + field-level
   - Permission query for row-level security
   - Very flexible and powerful

4. **Workflow Engine**
   - Built-in state machine
   - Configurable transitions
   - Approval workflows

5. **Child Tables**
   - One-to-many relationships
   - Inline editing
   - Automatic CRUD

### ⚠️ What to Avoid

1. **JSON-Based Schema**
   - Hard to version control
   - No type safety
   - Use TypeScript decorators instead

2. **Site-Based Multi-Tenancy**
   - Hard to scale
   - Use schema-based or row-level

3. **Python-Only Backend**
   - SmartERP uses NestJS (TypeScript)
   - Adapt patterns to TypeScript

### 🔄 What to Adapt

1. **DocType → Entity Decorator**
   ```typescript
   @Entity()
   @DocType({
     module: 'accounts',
     isSubmittable: true,
     trackChanges: true
   })
   class SalesInvoice {
     @Column()
     @Field({ label: 'Customer', required: true })
     customer: string;
   }
   ```

2. **Lifecycle Hooks → TypeORM Hooks**
   ```typescript
   @BeforeInsert()
   @BeforeUpdate()
   validate() {
     this.calculateTotals();
   }
   
   @AfterInsert()
   onSubmit() {
     this.makeGLEntries();
   }
   ```

3. **Permission Query → Query Builder**
   ```typescript
   getPermissionQuery(user: User) {
     return this.createQueryBuilder()
       .where('owner = :userId', { userId: user.id });
   }
   ```

---

## 📊 Comparison: Odoo vs ERPNext

| Feature | Odoo | ERPNext | SmartERP | Recommendation |
|---------|------|---------|----------|----------------|
| **Architecture** | Python ORM | Metadata-driven | TypeORM | Adopt metadata approach |
| **Modules** | 500+ | 18 | 33 | ERPNext size is good |
| **Schema Definition** | Python classes | JSON files | TypeORM entities | Use TypeScript decorators |
| **UI Generation** | XML views | Auto from JSON | React manual | Adopt auto-generation |
| **API** | RPC + REST | Auto REST | REST manual | Adopt auto-generation |
| **Permissions** | 2-level | 3-level | Guards only | Adopt 3-level |
| **Workflow** | State machine | Workflow engine | Manual | Adopt workflow engine |
| **Multi-tenancy** | DB-per-tenant | Site-per-tenant | Schema-based | Keep schema-based |
| **Child Tables** | One2many | Table field | Relations | Adopt inline editing |
| **Lifecycle Hooks** | @api decorators | Document methods | Manual | Adopt lifecycle hooks |

---

## 📚 Next Steps

1. ✅ Analyzed Odoo architecture
2. ✅ Analyzed ERPNext/Frappe architecture
3. ⏳ Create comparison matrix
4. ⏳ Design implementation guide for SmartERP
5. ⏳ Create refactoring plan

---

**References**:
- [ERPNext Documentation](https://docs.erpnext.com/)
- [Frappe Framework Documentation](https://frappeframework.com/docs)
- [ERPNext GitHub](https://github.com/frappe/erpnext)
- [Frappe GitHub](https://github.com/frappe/frappe)
- Source code: `research/competitors/erpnext/`, `research/competitors/frappe/`
