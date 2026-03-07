# Folder Structure Migration Plan

**Date**: 2026-03-07  
**Phase**: Phase 0 - Week 0.1  
**Goal**: Migrate from flat 33 modules to domain-grouped structure

---

## 📋 Module Grouping Analysis

### Core Modules (5 modules)
- auth
- user
- tenant
- permission
- settings

### Accounting Domain (4 modules)
- accounting → account
- invoice
- payment
- currency

### Sales Domain (3 modules)
- crm
- order
- customer

### Inventory Domain (5 modules)
- inventory → stock
- warehouse
- barcode
- product
- category

### Purchasing Domain (1 module)
- supplier

### Manufacturing Domain (2 modules)
- manufacturing → mrp
- asset

### HR Domain (1 module)
- hr

### Platform Modules (9 modules)
- workflow
- notification
- email
- document
- report
- dashboard
- analytics
- audit
- search

### Integration Modules (4 modules)
- payment-gateway
- shipping
- webhook
- integration

### Extension Modules (4 modules)
- custom-fields
- module-marketplace
- collaboration
- subscription

### Utility Modules (2 modules)
- import-export
- scheduled-jobs

**Total**: 39 modules (33 original + 6 from grouping)

---

## 🎯 Migration Strategy

Due to the complexity of moving 39 modules and updating all imports, I will use a **phased approach**:

1. Create new folder structure
2. Move modules one domain at a time
3. Update imports after each domain
4. Test after each domain
5. Continue to next domain

This ensures we can catch and fix issues early, rather than moving everything at once and having hundreds of broken imports.

---

**Status**: 📋 Plan created  
**Next**: Begin Phase 0 Week 0.1 execution
