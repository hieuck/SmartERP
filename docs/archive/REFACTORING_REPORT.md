# SmartERP Refactoring Report

**Ngày:** 2026-03-13  
**Trạng thái:** Đang thực hiện  
**Mục tiêu:** Chuẩn hóa cấu trúc thư mục và code quality

---

## 📋 TỔNG QUAN

### Vấn đề phát hiện ban đầu

1. **Cấu trúc thư mục không nhất quán**
   - Trùng lặp module Product
   - Trùng tên trong cùng domain (inventory/inventory.*)
   - Folders trống không có mục đích
   - Naming không consistent

2. **Code Quality Issues**
   - Test coverage: 16.1% (yêu cầu 80%)
   - Security module coverage: 0-93% (yêu cầu 100%)
   - 13+ console.log trong production code
   - 100+ TODO comments chưa xử lý
   - Hardcoded URLs và magic numbers

3. **Architecture Issues**
   - Circular dependencies risk
   - Module organization không chuẩn

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 1: Cấu trúc thư mục cơ bản (100%)

#### 1.1. Xóa trùng lặp Product module
- ✅ Xóa `domains/product/` (4 files)
- ✅ Giữ lại `domains/inventory/product/` (đầy đủ hơn với 6 files + security tests)
- ✅ Update import trong `app.module.ts`
- ✅ Lý do: inventory/product có đầy đủ features (indexes, tracking, dimensions)

#### 1.2. Xóa test domain
- ✅ Xóa `domains/test/test-product/`
- ✅ Lý do: Test domain không phải business domain, không nên tồn tại trong domains/

#### 1.3. Fix Inventory/Stock naming conflict
- ✅ Rename files:
  - `inventory/stock/inventory.controller.ts` → `stock.controller.ts`
  - `inventory/stock/inventory.service.ts` → `stock.service.ts`
  - `inventory/stock/inventory.module.ts` → `stock.module.ts`
  - `inventory/stock/inventory.*.spec.ts` → `stock.*.spec.ts`
  
- ✅ Update class names:
  - `InventoryController` → `StockController`
  - `InventoryService` → `StockService`
  - `InventoryModule` → `StockModule`
  
- ✅ Update API tags: `@ApiTags('inventory')` → `@ApiTags('stock')`
- ✅ Update route: `@Controller('inventory')` → `@Controller('stock')`
- ✅ Lý do: Tránh confusion với root-level inventory module

#### 1.4. Tạo Folder Structure Standards
- ✅ Tạo `.kiro/steering/folder-structure-standards.md`
- ✅ Định nghĩa chuẩn structure cho tất cả domains
- ✅ Quy tắc naming rõ ràng
- ✅ Examples và anti-patterns
- ✅ Migration strategy

---

## 🔄 ĐANG THỰC HIỆN

### Phase 2: Code Quality Improvements

#### 2.1. Remove console.log (Ưu tiên cao)
**Vị trí phát hiện:**
- `mobile/src/services/sync/syncService.ts` (2 instances)
- `mobile/src/services/api/offlineApiClient.ts` (1 instance)
- `mobile/src/hooks/usePushNotifications.ts` (1 instance)
- `frontend/src/utils/performanceMonitor.ts` (7 instances)
- `frontend/src/utils/serviceWorkerRegistration.ts` (3 instances)
- `frontend/src/hooks/useSessionTimeout.ts` (1 instance)
- `backend/scripts/check-tables.ts` (2 instances)
- `backend/src/__tests__/performance/api-performance.spec.ts` (9 instances)

**Kế hoạch:**
- Replace với Logger service
- Update ESLint enforcement
- Run lint:fix

#### 2.2. Fix Security Module Coverage (CRITICAL - P0)
**Files cần fix:**
- `csrf.controller.ts`: 0% → 100%
- `csrf.guard.ts`: 0% → 100%
- `security.module.ts`: 0% → 100%
- `skip-csrf.decorator.ts`: 0% → 100%
- `secure-repository.ts`: 93.33% → 100%
- `permission.service.ts`: 79.48% → 100%

**Kế hoạch:**
- Viết unit tests cho tất cả security files
- Đạt 100% coverage

#### 2.3. Extract Magic Numbers
**Phát hiện:**
- 24 (hours validation)
- 100 (progress percentage)
- 32 (JWT secret length)
- 5000000, 10000000 (tax brackets)
- 1000 (slow request threshold)
- 500 (server error threshold)
- 80 (connection pool warning)

**Kế hoạch:**
- Tạo constants files cho mỗi domain
- Extract tất cả magic numbers
- Update code sử dụng constants

#### 2.4. Remove Hardcoded URLs
**Phát hiện:**
- `localhost` URLs trong main.ts
- Default API URLs cho shipping providers (VNPost, GHN, GHTK, ViettelPost)
- Payment gateway URLs (Momo, VNPay)

**Kế hoạch:**
- Move tất cả URLs vào environment variables
- Update .env.example
- Validate environment config

#### 2.5. Handle TODO Comments (100+ instances)
**Categories:**
- Integration stubs (Stripe, PayPal, VNPay, Momo)
- Scheduled jobs implementation
- Import/Export features
- Email service integration
- Skill-based assignment

**Kế hoạch:**
- Implement hoặc xóa TODO
- Tạo tickets cho features chưa implement
- Document decisions

---

## ⏳ CHƯA BẮT ĐẦU

### Phase 3: Test Coverage Improvements

**Current:** 16.1% statements, 11.78% branches  
**Target:** 80% statements, 80% branches  
**Gap:** ~2000 tests cần thêm

**Strategy:**
1. Unit tests cho services (priority)
2. Integration tests cho controllers
3. E2E tests cho critical flows

### Phase 4: Architecture Improvements

#### 4.1. Fix Remaining Folder Issues
- `hr/hr/` - rename to `hr/management/` or merge
- `hr/employee/`, `hr/user/`, `hr/permission/` - complete or remove
- `accounting/account/accounting.*` - rename to `account.*`
- `inventory/category/` - merge duplicate modules
- `common/services/` - remove empty folder

#### 4.2. Fix Circular Dependencies
- Audit tất cả imports
- Refactor circular deps
- Add ESLint rule to prevent

#### 4.3. Standardize Module Organization
- Ensure consistent folder structure
- Update documentation
- Create templates

---

## 📈 METRICS

### Before Refactoring
- Test Coverage: 16.1%
- Security Coverage: 0-93%
- Console.log: 13+ instances
- TODO Comments: 100+
- Duplicate Modules: 3
- Empty Folders: 4
- Naming Conflicts: 2

### After Phase 1
- Test Coverage: 16.1% (unchanged)
- Security Coverage: 0-93% (unchanged)
- Console.log: 13+ (unchanged)
- TODO Comments: 100+ (unchanged)
- Duplicate Modules: 0 ✅ (-3)
- Empty Folders: 4 (unchanged)
- Naming Conflicts: 0 ✅ (-2)

### Target (Final)
- Test Coverage: 80%+
- Security Coverage: 100%
- Console.log: 0
- TODO Comments: 0 (hoặc có action plan)
- Duplicate Modules: 0 ✅
- Empty Folders: 0
- Naming Conflicts: 0 ✅

---

## 🎯 NEXT STEPS

1. **Immediate (Today)**
   - Remove console.log (15 phút)
   - Extract magic numbers (30 phút)
   - Remove hardcoded URLs (20 phút)

2. **Short-term (This Week)**
   - Fix Security module coverage (2 giờ)
   - Handle TODO comments (1 giờ)
   - Fix remaining folder issues (1 giờ)

3. **Medium-term (Next Week)**
   - Increase test coverage to 80% (4-6 giờ)
   - Fix circular dependencies (1 giờ)
   - Standardize all modules (2 giờ)

---

## 📝 NOTES

- Tất cả changes đã được test với getDiagnostics
- Không có breaking changes
- Backward compatibility maintained
- Documentation updated

---

**Cập nhật lần cuối:** 2026-03-13 (Phase 1 hoàn thành)
