---
inclusion: manual
description: '⚠️ DEPRECATED: File này đã được split thành 2 files mới. Redirect to multi-tenant-architecture-patterns.md (general) và erp-implementation-guide.md (ERP-specific). File này sẽ bị xóa trong v3.0.0. Use #odoo-erpnext-architecture to load legacy content.'
---

# ⚠️ DEPRECATED: Kiến trúc Odoo & ERPNext

**Status**: 🚫 Deprecated (v2.1.0)  
**Removal**: v3.0.0 (2026-06-30)

---

## 📢 Important Notice

File này đã được **refactored** thành 2 files mới để tách biệt general patterns và ERP-specific content:

### ✅ NEW: Multi-Tenant Architecture Patterns (General)

**File**: `.kiro/steering/multi-tenant-architecture-patterns.md`  
**Type**: Auto-included  
**Content**: 70% general, domain-agnostic patterns

- Tenant isolation pattern
- Permission system
- Audit trail
- Caching strategies
- Testing patterns
- API design
- Status management
- Workflow patterns

**Use for**: Any multi-tenant application (SaaS, B2B, Enterprise)

---

### ✅ NEW: ERP Implementation Guide (Specific)

**File**: `.kiro/steering/erp-implementation-guide.md`  
**Type**: Manual inclusion (`#erp-implementation-guide`)  
**Content**: 30% ERP-specific patterns

- Odoo/ERPNext research workflow
- ERP module structure
- Accounting patterns
- Inventory patterns
- Manufacturing patterns
- SmartERP business logic

**Use for**: ERP features, Odoo/ERPNext research

---

## 🔄 Migration Guide

**Old way** (deprecated):

```typescript
// All patterns mixed in one file
// Hard to reuse for non-ERP projects
```

**New way** (recommended):

```typescript
// General patterns: Always included
// ERP patterns: Include when needed with #erp-implementation-guide
```

---

## 📚 Quick Reference

**For general multi-tenant development:**
→ Read: `.kiro/steering/multi-tenant-architecture-patterns.md` (auto-included)

**For ERP-specific features:**
→ Include: `#erp-implementation-guide` in chat
→ Read: `.kiro/steering/erp-implementation-guide.md`

**For SecureRepository implementation:**
→ Activate skill: `discloseContext({ name: 'secure-repository-pattern' })`

---

## ⚠️ Legacy Content Below (For Reference Only)

**Note**: Content below is kept for backward compatibility until v3.0.0.  
**Please use new files above for all new development.**

---

# Kiến trúc Odoo & ERPNext - Nguyên tắc bắt buộc (LEGACY)

## ⚠️ QUAN TRỌNG: Research Trước Khi Code

**BẮT BUỘC:** Trước khi implement hoặc refactor bất kỳ module/service nào, PHẢI:

1. **Research Odoo Architecture:**
   - 🔍 Search: "Odoo [module-name] architecture"
   - 📖 Đọc: Official Odoo documentation
   - 💡 Hiểu: Module structure, inheritance, workflow patterns
   - ⏱️ Time: 30-60 phút/module

2. **Research ERPNext Architecture:**
   - 🔍 Search: "ERPNext [module-name] implementation"
   - 📖 Đọc: ERPNext GitHub source code
   - 💡 Hiểu: DocType, permissions, hooks, workflows
   - ⏱️ Time: 30-60 phút/module

3. **Compare & Decide:**
   - 📊 So sánh approaches của Odoo vs ERPNext
   - 🎯 Chọn best practices phù hợp với SmartERP
   - 📝 Document reasoning trong code comments
   - ⏱️ Time: 15-30 phút

**KHÔNG BAO GIỜ:**

- ❌ Code dựa trên assumption
- ❌ Copy-paste mà không hiểu
- ❌ Skip research vì "đã biết"
- ❌ Implement mà không verify với Odoo/ERPNext patterns

**VÍ DỤ WORKFLOW:**

```
Task: Implement Accounting Module
↓
1. Research Odoo Accounting (30 min)
   - Chart of Accounts structure
   - Journal Entry workflow
   - Multi-currency handling
↓
2. Research ERPNext Accounting (30 min)
   - Account DocType
   - GL Entry patterns
   - Cost Center & Profit Center
↓
3. Design SmartERP Accounting (30 min)
   - Combine best of both
   - Adapt to SecureRepository
   - Plan implementation
↓
4. Implement với confidence
```

---

## QUAN TRỌNG: Luôn tuân thủ các nguyên tắc sau

### 1. Kiến trúc Module-based (Odoo Style)

- **Mỗi domain phải là một module độc lập** (như Odoo apps)
- Module có thể hoạt động độc lập hoặc phụ thuộc vào module khác
- Cấu trúc: `domains/{domain-name}/` chứa entities, services, controllers
- Ví dụ: `domains/accounting/`, `domains/inventory/`, `domains/hr/`

### 2. Multi-tenancy & Security (ERPNext Style)

- **Mọi query phải có tenant isolation** thông qua `SecureRepository`
- Sử dụng `PermissionService` để kiểm tra quyền: `canRead`, `canWrite`, `canDelete`
- Không bao giờ query trực tiếp TypeORM repository, luôn dùng `SecureRepository`

### 3. Workflow & Approval System (Odoo Style)

- Sử dụng `WorkflowService` cho các quy trình phê duyệt
- Các entity quan trọng cần có workflow: Purchase Order, Sales Order, Leave Request, etc.
- Workflow có các bước (steps) và người phê duyệt (approvers)

### 4. Audit Trail & History (ERPNext Style)

- Mọi thay đổi quan trọng phải được ghi log
- Sử dụng soft delete (`deletedAt`) thay vì hard delete
- Tracking: `createdBy`, `updatedBy`, `createdAt`, `updatedAt`

### 5. Caching Strategy

- Cache các entity ít thay đổi với `CacheService`
- Sử dụng `CacheTTL.SHORT`, `CacheTTL.MEDIUM`, `CacheTTL.LONG`
- Invalidate cache sau khi update/delete

### 6. Naming Conventions (Odoo Style)

- Entity names: PascalCase (e.g., `SalesOrder`, `PurchaseOrder`)
- Service methods: camelCase với prefix rõ ràng
  - `findAll{Entity}`, `find{Entity}ById`, `create{Entity}`, `update{Entity}`, `delete{Entity}`
- Controller routes: kebab-case (e.g., `/api/sales-orders`)

### 7. Document Numbering (ERPNext Style)

- Tự động generate số chứng từ: `SO-2024-00001`, `PO-2024-00001`
- Format: `{PREFIX}-{YEAR}-{SEQUENCE}`
- Sử dụng service riêng hoặc helper function

### 8. Status Management (Odoo Style)

- Sử dụng enum cho status: `DRAFT`, `SUBMITTED`, `APPROVED`, `CANCELLED`
- State machine pattern cho chuyển đổi trạng thái
- Validate trạng thái trước khi chuyển đổi

### 9. Testing với SecureRepository

- **QUAN TRỌNG**: Mock `SecureRepository` methods, không mock raw TypeORM
- Mock `find()`, `findOne()`, `save()`, `remove()` - KHÔNG mock `createQueryBuilder()`, `update()`, `delete()`
- Luôn mock `PermissionService` với `canRead`, `canWrite`, `canDelete`

### 10. API Response Format

- Success: `{ success: true, data: {...}, message?: string }`
- Error: `{ success: false, error: string, statusCode: number }`
- Pagination: `{ data: [], total: number, page: number, limit: number }`

## Khi code mới hoặc refactor:

1. ✅ Kiểm tra xem có dùng `SecureRepository` không
2. ✅ Kiểm tra xem có tenant isolation không
3. ✅ Kiểm tra xem có permission check không
4. ✅ Kiểm tra xem có audit trail không
5. ✅ Kiểm tra xem có caching hợp lý không
6. ✅ Kiểm tra xem tests có mock đúng SecureRepository không

## Tài liệu tham khảo

- Odoo Architecture: Module-based, Workflow, State Machine
- ERPNext Architecture: Multi-tenancy, Document Numbering, Audit Trail
- Project docs: `docs/ODOO-ARCHITECTURE-ANALYSIS.md`, `docs/ERPNEXT-ARCHITECTURE-ANALYSIS.md`
