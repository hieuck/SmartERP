# Odoo Architecture Analysis

**Version**: 17.0  
**Date**: 2026-03-07  
**Purpose**: Phân tích kiến trúc Odoo để học hỏi best practices cho SmartERP

---

## 📊 Overview

Odoo là một ERP open-source được viết bằng Python với kiến trúc modular mạnh mẽ. Hệ thống có hơn 500+ modules và framework ORM rất tinh vi.

### Key Statistics

- **Total Files**: 38,283
- **Python Files**: 7,090
- **JavaScript Files**: 3,273
- **XML Files**: ~15,000+
- **Total Modules**: 500+ (trong `addons/`)
- **Size**: ~163 MB

---

## 🏗️ Architecture Overview

### 1. Core Framework (`odoo/`)

```
odoo/
├── models.py          # ⭐ ORM base classes (BaseModel, Model, TransientModel)
├── fields.py          # ⭐ Field types (Char, Integer, Many2one, One2many, etc.)
├── api.py             # ⭐ API decorators (@api.model, @api.depends, etc.)
├── http.py            # ⭐ HTTP controllers and routing
├── sql_db.py          # Database connection and cursor management
├── exceptions.py      # Custom exceptions
├── modules/           # Module loading and registry
├── service/           # RPC services (model, db, common)
├── tools/             # Utilities (cache, config, translate, etc.)
└── addons/base/       # Core base module
```

### 2. Module System (`addons/`)

Odoo có **500+ modules** được tổ chức theo domain:

#### Core Business Modules
- `account/` - Accounting (chart of accounts, invoices, payments)
- `sale/` - Sales management
- `purchase/` - Purchasing
- `stock/` - Inventory/warehouse management
- `mrp/` - Manufacturing (MRP)
- `hr/` - Human resources
- `crm/` - Customer relationship management
- `project/` - Project management
- `point_of_sale/` - POS system

#### Integration Modules
- `payment_*` - 20+ payment gateways (Stripe, PayPal, Adyen, etc.)
- `l10n_*` - 100+ localization modules (countries, tax, accounting)
- `auth_*` - Authentication (OAuth, LDAP, TOTP)
- `google_*`, `microsoft_*` - Third-party integrations

#### Website/eCommerce
- `website/` - Website builder
- `website_sale/` - eCommerce
- `website_blog/` - Blog
- `website_forum/` - Forum

---

## 🎯 Module Structure Pattern

Mỗi module Odoo tuân theo cấu trúc chuẩn:

```
module_name/
├── __init__.py              # Module initialization
├── __manifest__.py          # ⭐ Module metadata (dependencies, data files)
├── models/                  # ⭐ Business logic (ORM models)
│   ├── __init__.py
│   ├── model_name.py
│   └── ...
├── views/                   # ⭐ XML view definitions
│   ├── model_name_views.xml
│   └── menu_views.xml
├── security/                # ⭐ Access rights and record rules
│   ├── ir.model.access.csv  # Model-level permissions
│   └── security.xml         # Record rules (row-level security)
├── data/                    # Master data (loaded on install)
├── demo/                    # Demo data (for testing)
├── controllers/             # HTTP controllers (web routes)
├── static/                  # Frontend assets (JS, CSS, images)
│   ├── src/
│   │   ├── js/
│   │   ├── css/
│   │   └── xml/            # QWeb templates
│   └── description/        # Module icon and description
├── wizard/                  # Transient models (wizards/dialogs)
├── report/                  # Reports (PDF, Excel)
├── tests/                   # Unit tests
└── README.md
```

### Example: `__manifest__.py`

```python
{
    'name': 'Accounting',
    'version': '1.0',
    'category': 'Accounting/Accounting',
    'summary': 'Accounting Reports, Asset Management and Account Budget',
    'description': """
Accounting Access Rights, Accounting Valuation, Accounting Reporting
    """,
    'website': 'https://www.odoo.com/app/accounting',
    'depends': ['base', 'mail', 'product', 'analytic'],
    'data': [
        'security/account_security.xml',
        'security/ir.model.access.csv',
        'data/account_data.xml',
        'views/account_views.xml',
        'views/account_menu.xml',
    ],
    'demo': [
        'demo/account_demo.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
```

---

## 🔧 ORM System

### Base Classes

Odoo ORM có 3 base classes chính:

```python
# odoo/models.py

class BaseModel(metaclass=MetaModel):
    """Base class for all Odoo models"""
    # Common methods: create(), write(), unlink(), search(), read()
    
class Model(BaseModel):
    """Persistent models (stored in database)"""
    _auto = True  # Auto-create table
    _table = None  # Table name (default: model name with _ instead of .)
    
class TransientModel(BaseModel):
    """Temporary models (wizards, not persistent)"""
    _auto = True
    _transient = True
    _transient_max_hours = 1.0  # Auto-cleanup after 1 hour
```

### Field Types

```python
# odoo/fields.py

# Basic fields
Char(string, size=None, required=False, readonly=False, default=None)
Text(string, ...)
Integer(string, ...)
Float(string, digits=None, ...)
Boolean(string, ...)
Date(string, ...)
Datetime(string, ...)
Selection(selection, string, ...)  # Dropdown

# Relational fields
Many2one(comodel_name, string, ondelete='set null', ...)
One2many(comodel_name, inverse_name, string, ...)
Many2many(comodel_name, relation, column1, column2, string, ...)

# Computed fields
field_name = fields.Char(compute='_compute_field_name', store=True)

# Special fields
Binary(string, attachment=True, ...)  # File storage
Html(string, sanitize=True, ...)
Monetary(string, currency_field='currency_id', ...)
```

### API Decorators

```python
# odoo/api.py

@api.model
def method(self):
    """Class-level method (no recordset)"""
    pass

@api.depends('field1', 'field2')
def _compute_field(self):
    """Computed field (auto-recalculate when dependencies change)"""
    for record in self:
        record.computed_field = record.field1 + record.field2

@api.constrains('field1', 'field2')
def _check_constraint(self):
    """Validation constraint"""
    for record in self:
        if record.field1 > record.field2:
            raise ValidationError("Field1 must be <= Field2")

@api.onchange('field1')
def _onchange_field1(self):
    """UI onchange handler (client-side)"""
    if self.field1:
        self.field2 = self.field1 * 2
```

### Example Model

```python
# addons/account/models/account_move.py

from odoo import models, fields, api

class AccountMove(models.Model):
    _name = 'account.move'
    _description = 'Journal Entry'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date desc, name desc, id desc'
    
    # Fields
    name = fields.Char(string='Number', required=True, readonly=True, default='/')
    date = fields.Date(string='Date', required=True, index=True)
    ref = fields.Char(string='Reference')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('posted', 'Posted'),
        ('cancel', 'Cancelled'),
    ], string='Status', default='draft', tracking=True)
    
    partner_id = fields.Many2one('res.partner', string='Partner')
    line_ids = fields.One2many('account.move.line', 'move_id', string='Journal Items')
    amount_total = fields.Monetary(string='Total', compute='_compute_amount', store=True)
    
    # Computed field
    @api.depends('line_ids.debit', 'line_ids.credit')
    def _compute_amount(self):
        for move in self:
            move.amount_total = sum(move.line_ids.mapped('debit'))
    
    # Constraint
    @api.constrains('line_ids')
    def _check_balanced(self):
        for move in self:
            if move.line_ids:
                debit = sum(move.line_ids.mapped('debit'))
                credit = sum(move.line_ids.mapped('credit'))
                if abs(debit - credit) > 0.01:
                    raise ValidationError("Journal entry must be balanced!")
    
    # Business logic
    def action_post(self):
        """Post journal entry"""
        self.write({'state': 'posted'})
        return True
```

---

## 🔐 Security Model

Odoo có 2 levels of security:

### 1. Model-Level Access Rights (`ir.model.access.csv`)

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_account_move_user,account.move.user,model_account_move,group_account_user,1,1,1,0
access_account_move_manager,account.move.manager,model_account_move,group_account_manager,1,1,1,1
```

- `perm_read`: Can read records
- `perm_write`: Can update records
- `perm_create`: Can create records
- `perm_unlink`: Can delete records

### 2. Record Rules (Row-Level Security) (`security.xml`)

```xml
<record id="account_move_rule_user" model="ir.rule">
    <field name="name">Account Move: User can only see own company</field>
    <field name="model_id" ref="model_account_move"/>
    <field name="domain_force">[('company_id', 'in', company_ids)]</field>
    <field name="groups" eval="[(4, ref('group_account_user'))]"/>
</record>
```

---

## 🎨 View System

Odoo sử dụng XML để định nghĩa views:

### View Types

1. **Form View** - Detail view (CRUD)
2. **Tree View** - List view (table)
3. **Kanban View** - Card view
4. **Calendar View** - Calendar
5. **Pivot View** - Pivot table
6. **Graph View** - Charts
7. **Search View** - Filters and search

### Example: Form View

```xml
<record id="view_account_move_form" model="ir.ui.view">
    <field name="name">account.move.form</field>
    <field name="model">account.move</field>
    <field name="arch" type="xml">
        <form string="Journal Entry">
            <header>
                <button name="action_post" string="Post" type="object" 
                        states="draft" class="oe_highlight"/>
                <field name="state" widget="statusbar"/>
            </header>
            <sheet>
                <group>
                    <group>
                        <field name="name"/>
                        <field name="date"/>
                        <field name="partner_id"/>
                    </group>
                    <group>
                        <field name="ref"/>
                        <field name="amount_total"/>
                    </group>
                </group>
                <notebook>
                    <page string="Journal Items">
                        <field name="line_ids">
                            <tree editable="bottom">
                                <field name="account_id"/>
                                <field name="debit"/>
                                <field name="credit"/>
                            </tree>
                        </field>
                    </page>
                </notebook>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
```

---

## 🌐 HTTP Controllers

```python
# addons/account/controllers/portal.py

from odoo import http
from odoo.http import request

class AccountPortal(http.Controller):
    
    @http.route('/my/invoices', type='http', auth='user', website=True)
    def portal_my_invoices(self, **kw):
        """Customer portal: list invoices"""
        invoices = request.env['account.move'].search([
            ('partner_id', '=', request.env.user.partner_id.id),
            ('move_type', '=', 'out_invoice'),
        ])
        return request.render('account.portal_my_invoices', {
            'invoices': invoices,
        })
    
    @http.route('/my/invoices/<int:invoice_id>', type='http', auth='user', website=True)
    def portal_invoice_detail(self, invoice_id, **kw):
        """Customer portal: invoice detail"""
        invoice = request.env['account.move'].browse(invoice_id)
        return request.render('account.portal_invoice_detail', {
            'invoice': invoice,
        })
```

---

## 📦 Multi-Tenancy

Odoo sử dụng **database-level multi-tenancy**:

- Mỗi tenant = 1 PostgreSQL database
- Shared application code
- Isolated data per database
- Company field for multi-company within same database

```python
# Multi-company support
class AccountMove(models.Model):
    _name = 'account.move'
    
    company_id = fields.Many2one('res.company', required=True, 
                                  default=lambda self: self.env.company)
    
    # Record rule ensures users only see their company's data
```

---

## 🔄 Inheritance Mechanisms

Odoo có 3 types of inheritance:

### 1. Classical Inheritance (`_inherit` + `_name`)

```python
class SaleOrder(models.Model):
    _name = 'sale.order'
    _inherit = 'mail.thread'  # Inherit from mail.thread
```

### 2. Extension Inheritance (`_inherit` only)

```python
class SaleOrder(models.Model):
    _inherit = 'sale.order'  # Extend existing model
    
    custom_field = fields.Char('Custom Field')
```

### 3. Delegation Inheritance (`_inherits`)

```python
class ProductProduct(models.Model):
    _name = 'product.product'
    _inherits = {'product.template': 'product_tmpl_id'}
    
    product_tmpl_id = fields.Many2one('product.template', required=True)
```

---

## 🎯 Key Takeaways for SmartERP

### ✅ What to Adopt

1. **Module Structure**
   - Clear separation: models/, views/, security/, controllers/
   - Manifest file for dependencies
   - Security files (access rights + record rules)

2. **ORM Patterns**
   - API decorators (@api.depends, @api.constrains)
   - Computed fields with dependencies
   - Onchange handlers for UI reactivity

3. **Security Model**
   - Two-level security (model + record)
   - Group-based permissions
   - Company-based data isolation

4. **View System**
   - XML-based view definitions
   - Multiple view types (form, tree, kanban, etc.)
   - Statusbar for workflow states

5. **Inheritance**
   - Extension inheritance for modularity
   - Mixin classes for reusable functionality

### ⚠️ What to Avoid

1. **Over-modularization**
   - 500+ modules is too much for small team
   - Start with monolith, extract modules later

2. **XML Views**
   - XML is verbose and hard to maintain
   - Consider React components instead

3. **Database-per-tenant**
   - Hard to scale and maintain
   - Use schema-based or row-level multi-tenancy

### 🔄 What to Adapt

1. **Module System**
   - Use NestJS modules instead of Python modules
   - Keep manifest concept for dependencies

2. **ORM**
   - TypeORM decorators similar to Odoo's @api decorators
   - Computed properties with @AfterLoad

3. **Security**
   - Guards for model-level access
   - Query filters for record-level security

---

## 📊 Comparison with SmartERP

| Feature | Odoo | SmartERP | Gap |
|---------|------|----------|-----|
| **Module System** | 500+ modules | 33 modules | Need more modules |
| **ORM** | Custom ORM | TypeORM | TypeORM is good |
| **Security** | 2-level (model + record) | Guards only | Need record-level security |
| **Views** | XML | React | React is better |
| **Multi-tenancy** | DB-per-tenant | Schema-based | SmartERP is better |
| **API** | RPC + REST | REST only | Need RPC? |
| **Inheritance** | 3 types | TypeScript extends | Need mixin pattern |
| **Computed Fields** | @api.depends | Manual | Need auto-compute |
| **Constraints** | @api.constrains | class-validator | class-validator is good |
| **Workflow** | State machine | Manual | Need workflow engine |

---

## 📚 Next Steps

1. Analyze ERPNext/Frappe architecture
2. Compare Odoo vs ERPNext patterns
3. Create implementation guide for SmartERP
4. Design refactoring plan

---

**References**:
- [Odoo Documentation](https://www.odoo.com/documentation/17.0/)
- [Odoo GitHub](https://github.com/odoo/odoo)
- Source code: `research/competitors/odoo/`
