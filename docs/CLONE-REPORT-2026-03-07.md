# Clone Report - Odoo & ERPNext - 2026-03-07

## Mục đích

Clone source code của Odoo và ERPNext để nghiên cứu architecture, best practices, và implementation patterns.

---

## ✅ Repositories Cloned

### 1. Odoo (Python - v17.0)

**Repository**: https://github.com/odoo/odoo.git  
**Branch**: 17.0  
**Commit**: d176c7ab - [FIX] l10n_in_edi: error hide for second EDI  
**Location**: `research/competitors/odoo/`

**Statistics**:
- Total files: 38,283
- Python files: 7,090
- JavaScript files: 3,273
- XML files: ~15,000+ (estimated)

**Key Directories**:
```
odoo/
├── addons/          # Core modules (30+ modules)
├── odoo/            # Framework core
├── doc/             # Documentation
└── setup/           # Setup scripts
```

**Notable Modules** (in `addons/`):
- `base/` - Core framework
- `account/` - Accounting
- `sale/` - Sales management
- `stock/` - Inventory/warehouse
- `hr/` - Human resources
- `crm/` - Customer relationship
- `purchase/` - Purchasing
- `manufacturing/` - MRP
- `website/` - Website builder
- `point_of_sale/` - POS

---

### 2. ERPNext (Python - v15.100.2)

**Repository**: https://github.com/frappe/erpnext.git  
**Branch**: version-15  
**Commit**: 1ee03f4 - chore(release): Bumped to Version 15.100.2  
**Location**: `research/competitors/erpnext/`

**Statistics**:
- Total files: 4,591
- Python files: ~1,500+ (estimated)
- JavaScript files: ~800+ (estimated)
- JSON files: ~1,000+ (estimated)

**Key Directories**:
```
erpnext/
└── erpnext/         # Main application
    ├── accounts/    # Accounting
    ├── selling/     # Sales
    ├── buying/      # Purchasing
    ├── stock/       # Inventory
    ├── manufacturing/ # MRP
    ├── hr/          # Human resources
    ├── crm/         # CRM
    ├── projects/    # Project management
    ├── assets/      # Asset management
    └── setup/       # Setup/configuration
```

---

### 3. Frappe Framework (Python - v15.101.5)

**Repository**: https://github.com/frappe/frappe.git  
**Branch**: version-15  
**Commit**: 816d8aa - chore(release): Bumped to Version 15.101.5  
**Location**: `research/competitors/frappe/`

**Statistics**:
- Total files: 3,230
- Python files: 1,384
- JavaScript files: 641
- JSON files: ~500+ (estimated)

**Key Directories**:
```
frappe/
├── frappe/          # Framework core
│   ├── model/       # ORM and DocType system
│   ├── desk/        # UI framework
│   ├── core/        # Core doctypes
│   ├── database/    # Database abstraction
│   ├── email/       # Email handling
│   ├── integrations/ # Third-party integrations
│   └── website/     # Website framework
├── cypress/         # E2E tests
└── realtime/        # WebSocket/realtime
```

---

## 📊 Size Comparison

| Repository | Total Files | Python | JavaScript | Size (MB) |
|-----------|-------------|--------|------------|-----------|
| **Odoo** | 38,283 | 7,090 | 3,273 | ~163 |
| **ERPNext** | 4,591 | ~1,500 | ~800 | ~17 |
| **Frappe** | 3,230 | 1,384 | 641 | ~19 |
| **Total** | **46,104** | **~9,974** | **~4,714** | **~199** |

---

## 🎯 Next Steps (Phase 2: Architecture Analysis)

### Odoo Analysis Focus

1. **Module Structure**
   - Study `addons/` directory organization
   - Understand module dependencies
   - Analyze `__manifest__.py` files

2. **ORM Implementation**
   - `odoo/models.py` - Base model classes
   - `odoo/fields.py` - Field types and definitions
   - `odoo/api.py` - API decorators and patterns

3. **View System**
   - XML view definitions
   - QWeb templating engine
   - Form/List/Kanban views

4. **Security Model**
   - Access rights (ir.model.access)
   - Record rules (ir.rule)
   - Groups and permissions

5. **API Design**
   - RPC endpoints
   - REST API patterns
   - Controller architecture

---

### ERPNext/Frappe Analysis Focus

1. **DocType System**
   - Metadata-driven architecture
   - JSON-based schema definitions
   - Form/List/Report patterns

2. **Frappe Framework**
   - `frappe/model/` - ORM implementation
   - `frappe/desk/` - UI framework
   - `frappe/database/` - DB abstraction layer

3. **Module Structure**
   - ERPNext module organization
   - DocType definitions
   - Controller patterns

4. **Permission System**
   - Role-based permissions
   - Document-level permissions
   - Field-level permissions

5. **API Design**
   - REST API patterns
   - WebSocket/realtime
   - RPC methods

---

## 📁 Files to Study First

### Odoo Priority Files

```
odoo/odoo/
├── models.py          # ⭐ ORM base classes
├── fields.py          # ⭐ Field definitions
├── api.py             # ⭐ API decorators
├── http.py            # ⭐ HTTP controllers
└── service/
    ├── model.py       # Model service
    └── db.py          # Database service

odoo/addons/base/
├── models/
│   ├── ir_model.py    # ⭐ Model metadata
│   ├── ir_ui_view.py  # ⭐ View system
│   └── res_users.py   # ⭐ User/auth
└── security/
    ├── ir.model.access.csv  # ⭐ Access rights
    └── base_security.xml    # ⭐ Security rules
```

### ERPNext/Frappe Priority Files

```
frappe/frappe/
├── model/
│   ├── document.py    # ⭐ Base document class
│   ├── meta.py        # ⭐ DocType metadata
│   └── db_query.py    # ⭐ Query builder
├── desk/
│   ├── form/          # ⭐ Form framework
│   └── listview.js    # ⭐ List view
└── database/
    ├── database.py    # ⭐ DB abstraction
    └── mariadb/       # ⭐ MariaDB impl

erpnext/erpnext/
├── accounts/
│   ├── doctype/       # ⭐ Accounting doctypes
│   └── report/        # ⭐ Financial reports
└── stock/
    ├── doctype/       # ⭐ Inventory doctypes
    └── stock_ledger.py # ⭐ Stock ledger
```

---

## 🔍 Analysis Tools

### Code Statistics

```bash
# Count lines of code
cd research/competitors/odoo
find . -name "*.py" -exec wc -l {} + | tail -1

cd ../erpnext
find . -name "*.py" -exec wc -l {} + | tail -1

cd ../frappe
find . -name "*.py" -exec wc -l {} + | tail -1
```

### Module Analysis

```bash
# List all Odoo modules
cd research/competitors/odoo/addons
ls -d */ | wc -l

# List all ERPNext modules
cd research/competitors/erpnext/erpnext
ls -d */ | wc -l
```

### Dependency Analysis

```bash
# Odoo dependencies
cd research/competitors/odoo
cat requirements.txt

# ERPNext dependencies
cd ../erpnext
cat pyproject.toml

# Frappe dependencies
cd ../frappe
cat pyproject.toml
```

---

## 📝 Research Documents to Create

Based on Phase 2-5 of RESEARCH-PLAN-ODOO-ERPNEXT.md:

1. **ODOO-ARCHITECTURE-ANALYSIS.md**
   - Module system
   - ORM patterns
   - View system
   - Security model
   - API design

2. **ERPNEXT-ARCHITECTURE-ANALYSIS.md**
   - DocType system
   - Frappe framework
   - Module structure
   - Permission system
   - API design

3. **FEATURE-COMPARISON-MATRIX.md**
   - Accounting module comparison
   - Inventory module comparison
   - Sales module comparison
   - HR module comparison
   - CRM module comparison

4. **TECHNICAL-PATTERNS-GUIDE.md**
   - ORM patterns
   - API design patterns
   - Security patterns
   - Testing patterns
   - Performance patterns

5. **IMPLEMENTATION-RECOMMENDATIONS.md**
   - What to adopt from Odoo
   - What to adopt from ERPNext
   - What to avoid
   - SmartERP refactoring plan

---

## ✅ Completion Status

- [x] Create research directory
- [x] Clone Odoo (17.0)
- [x] Clone ERPNext (version-15)
- [x] Clone Frappe (version-15)
- [x] Verify commits
- [x] Document statistics
- [x] Create clone report
- [ ] Phase 2: Architecture analysis (next)
- [ ] Phase 3: Feature deep dive
- [ ] Phase 4: Technical patterns
- [ ] Phase 5: Documentation

---

## 📚 References

- [Odoo Documentation](https://www.odoo.com/documentation/17.0/)
- [ERPNext Documentation](https://docs.erpnext.com/)
- [Frappe Framework Documentation](https://frappeframework.com/docs)
- [RESEARCH-PLAN-ODOO-ERPNEXT.md](./RESEARCH-PLAN-ODOO-ERPNEXT.md)

---

**Date**: 2026-03-07  
**Status**: ✅ Phase 1 Complete  
**Next**: Phase 2 - Architecture Analysis
