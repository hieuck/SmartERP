# Pattern Usage Examples

Real-world examples showing how to use solution patterns.

---

## Example 1: Product CRUD Service

**Scenario:** Need to implement Product management with full CRUD operations.

**Before (Manual - 2.7 hours):**

```typescript
// Write everything from scratch
// - Service boilerplate
// - Permission checks
// - Caching logic
// - Error handling
// - Tests
// Total: 160 minutes
```

**After (Automated - 18 minutes):**

### Step 1: Generate Service (1 min)

```powershell
.\scripts\generate-crud-service.ps1 -EntityName Product -Domain inventory
```

### Step 2: Customize (15 min)

```typescript
// product.service.ts - Add business logic
async create(dto: CreateProductDto, tenantId: string, userId: string) {
  await this.permissionService.canWrite(userId, 'Product');

  // Custom validation
  if (dto.price < 0) {
    throw new BadRequestException('Price cannot be negative');
  }

  // Check duplicate SKU
  const existing = await this.secureRepo.findOne({
    where: { sku: dto.sku, tenantId },
  });
  if (existing) {
    throw new ConflictException('SKU already exists');
  }

  const product = await this.secureRepo.save({
    ...dto,
    tenantId,
    createdBy: userId,
  });

  await this.cacheService.invalidate(`product:${tenantId}`);
  return product;
}
```

### Step 3: Run Tests (2 min)

```powershell
npm test product.service.spec.ts
```

### Step 4: Log Velocity (30 sec)

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Product CRUD"
```

**Result:** 88% time reduction, same quality

---

## Example 2: Fixing Security Import Errors

**Scenario:** 15 test files have SecurityModule import errors after refactoring.

**Before (Manual - 2 hours):**

```typescript
// Manually edit each file:
// 1. Add SecurityModule to imports
// 2. Fix PermissionService mock
// 3. Run tests
// 4. Fix any remaining issues
// Repeat 15 times...
```

**After (Automated - 5 minutes):**

### Step 1: Dry Run (1 min)

```powershell
.\scripts\fix-security-imports.ps1 -DryRun
# Output:
# 🔍 Would fix: product.service.spec.ts
# 🔍 Would fix: order.service.spec.ts
# ...
# 📊 Summary: 15 files would be fixed
```

### Step 2: Apply Fixes (2 min)

```powershell
.\scripts\fix-security-imports.ps1
# Output:
# ✅ Fixed: product.service.spec.ts
# ✅ Fixed: order.service.spec.ts
# ...
# 📊 Summary: 15 files fixed
```

### Step 3: Verify (1 min)

```powershell
npm test
# All tests pass ✅
```

### Step 4: Log Velocity (30 sec)

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 2 -Task "Fixed 15 security imports"
```

**Result:** 96% time reduction

---

## Example 3: Implementing Caching

**Scenario:** Order service queries are slow, need caching.

**Before (Manual - 45 minutes):**

```typescript
// Research caching patterns
// Implement cache logic
// Add invalidation
// Test cache behavior
```

**After (Pattern - 10 minutes):**

### Step 1: Reference Pattern (2 min)

```powershell
# Open docs/SOLUTION-PATTERNS.md
# Find "Pattern 3: Caching Strategy"
```

### Step 2: Apply Pattern (5 min)

```typescript
// order.service.ts
async findAll(tenantId: string, userId: string) {
  await this.permissionService.canRead(userId, 'Order');

  // Add caching (from pattern)
  const cacheKey = `order:${tenantId}:all`;
  const cached = await this.cacheService.get<Order[]>(cacheKey);
  if (cached) return cached;

  const orders = await this.secureRepo.find({
    where: { tenantId },
    relations: ['customer', 'items'], // Eager load
    order: { createdAt: 'DESC' },
  });

  await this.cacheService.set(cacheKey, orders, CacheTTL.SHORT);
  return orders;
}

async update(id: string, dto: UpdateOrderDto, tenantId: string, userId: string) {
  // ... update logic ...

  // Invalidate cache (from pattern)
  await this.cacheService.invalidate(`order:${tenantId}`);
  return updated;
}
```

### Step 3: Test (2 min)

```typescript
// order.service.spec.ts
it('should return cached data if available', async () => {
  const mockOrders = [mockOrder];
  cacheService.get.mockResolvedValue(mockOrders);

  const result = await service.findAll(mockTenantId, mockUserId);

  expect(secureRepo.find).not.toHaveBeenCalled();
  expect(result).toEqual(mockOrders);
});
```

### Step 4: Log Velocity (30 sec)

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 2 -Task "Added caching to Order service"
```

**Result:** 78% time reduction, proven pattern

---

## Example 4: Weekly Velocity Tracking

**Scenario:** Track team velocity over a week.

### Monday

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 8 -Task "Product CRUD + tests"
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Fixed security imports"
```

### Tuesday

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 5 -Task "Order workflow"
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Added caching"
```

### Wednesday

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 8 -Task "Customer CRUD"
.\scripts\velocity-tracker.ps1 -Action log -Points 2 -Task "Query optimization"
```

### Thursday

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 5 -Task "Invoice generation"
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "PDF export"
```

### Friday

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 5 -Task "Payment integration"
.\scripts\velocity-tracker.ps1 -Action log -Points 2 -Task "Bug fixes"

# Weekly report
.\scripts\velocity-tracker.ps1 -Action report
```

**Output:**

```
📊 VELOCITY REPORT
==================

📅 2026-03-09: 11 points
   [09:00] Product CRUD + tests (+8)
   [15:00] Fixed security imports (+3)

📅 2026-03-10: 8 points
   [09:00] Order workflow (+5)
   [14:00] Added caching (+3)

📅 2026-03-11: 10 points
   [09:00] Customer CRUD (+8)
   [15:00] Query optimization (+2)

📅 2026-03-12: 8 points
   [09:00] Invoice generation (+5)
   [14:00] PDF export (+3)

📅 2026-03-13: 7 points
   [09:00] Payment integration (+5)
   [15:00] Bug fixes (+2)

📈 METRICS:
   Total Points: 44
   Total Days: 5
   Avg Velocity: 8.8 points/day
   Rating: ✅ GREAT (8-9/10)
```

**Insight:** Consistent 8-9 points/day = sustainable velocity

---

## Example 5: Full Feature Implementation

**Scenario:** Implement complete Inventory Management module.

### Phase 1: Planning (30 min)

```powershell
# Break down into tasks
# - Product CRUD (3 points)
# - Category CRUD (2 points)
# - Stock Movement (5 points)
# - Inventory Report (3 points)
# Total: 13 points
```

### Phase 2: Generate Services (5 min)

```powershell
.\scripts\generate-crud-service.ps1 -EntityName Product -Domain inventory
.\scripts\generate-crud-service.ps1 -EntityName Category -Domain inventory
.\scripts\generate-crud-service.ps1 -EntityName StockMovement -Domain inventory
```

### Phase 3: Customize Business Logic (2 hours)

```typescript
// product.service.ts - Add SKU validation
// category.service.ts - Add hierarchy logic
// stock-movement.service.ts - Add inventory tracking
```

### Phase 4: Add Caching (30 min)

```typescript
// Apply Pattern 3 to all services
// Cache product list, category tree, stock levels
```

### Phase 5: Optimize Queries (45 min)

```typescript
// Apply Pattern 4 to avoid N+1
// Eager load relations
// Add indexes
```

### Phase 6: Tests (1 hour)

```powershell
# Tests already generated, just customize
npm test inventory
```

### Phase 7: Fix Issues (30 min)

```powershell
.\scripts\fix-security-imports.ps1
.\scripts\fix-test-parameters.ps1
npm test
```

### Phase 8: Track Velocity

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Product CRUD"
.\scripts\velocity-tracker.ps1 -Action log -Points 2 -Task "Category CRUD"
.\scripts\velocity-tracker.ps1 -Action log -Points 5 -Task "Stock Movement"
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Inventory Report"
```

**Total Time:** 5.5 hours (vs 13 hours manual)  
**Time Saved:** 7.5 hours (58% reduction)  
**Velocity:** 13 points / 5.5 hours = 2.4 points/hour (9/10)

---

## Example 6: Bug Fix Sprint

**Scenario:** Fix 20 bugs in test suite after refactoring.

### Step 1: Categorize (10 min)

```
- 10 security import errors
- 5 parameter order errors
- 3 mock configuration errors
- 2 logic errors
```

### Step 2: Auto-fix (5 min)

```powershell
.\scripts\fix-security-imports.ps1
.\scripts\fix-test-parameters.ps1
npm test
```

### Step 3: Manual fixes (30 min)

```typescript
// Fix remaining 5 errors manually
// - 3 mock configuration errors
// - 2 logic errors
```

### Step 4: Verify (5 min)

```powershell
npm test
# All tests pass ✅
```

### Step 5: Track (1 min)

```powershell
.\scripts\velocity-tracker.ps1 -Action log -Points 5 -Task "Fixed 20 test bugs"
```

**Total Time:** 51 minutes (vs 4 hours manual)  
**Time Saved:** 3.15 hours (79% reduction)

---

## Key Takeaways

1. **Use automation first** - Scripts handle 90% of repetitive work
2. **Reference patterns** - Don't reinvent, apply proven solutions
3. **Track velocity** - Data-driven improvement
4. **Iterate quickly** - Automation enables rapid experimentation
5. **Focus on business logic** - Let tools handle boilerplate

**Result:** 6.5/10 → 10/10 velocity in 1 week
