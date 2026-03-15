# Day 2-3: Manual Testing Plan

**Date:** 2026-03-15  
**Duration:** 2 days  
**Objective:** Verify offline-first functionality, sync, CRUD operations, and authentication

---

## Prerequisites

### 1. Services Running

**Backend:**
```bash
cd smart-erp/src/backend
npm run start:dev
# Expected: Backend running on http://localhost:3000
```

**Frontend:**
```bash
cd smart-erp/src/frontend
npm run dev
# Expected: Frontend running on http://localhost:5175
```

**Database:**
- PostgreSQL running on localhost:5432
- Database: erp_production
- User: postgres / Password: postgres

**Redis:**
- Redis running on localhost:6379

### 2. Test User Account

**Create test user:**
```bash
cd smart-erp/src/backend
npm run seed:test-users
```

**Test credentials:**
- Email: admin@test.com
- Password: Admin123!

---

## Test Scenarios

### Scenario 1: Authentication Flow ✅

**Test Steps:**
1. Open http://localhost:5175
2. Click "Login"
3. Enter credentials: admin@test.com / Admin123!
4. Click "Sign In"

**Expected Results:**
- ✅ Redirect to /dashboard
- ✅ User info displayed in header
- ✅ JWT token stored in localStorage
- ✅ Tenant context initialized

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 2: Offline-First - Products (Entity 1/14) ✅

**Test Steps:**

**2.1. Create Product Offline**
1. Go to Products page
2. Open DevTools → Network → Set "Offline"
3. Click "Add Product"
4. Fill form:
   - Name: "Test Product Offline"
   - SKU: "TEST-001"
   - Price: 100000
   - Stock: 50
5. Click "Save"

**Expected Results:**
- ✅ Product saved to IndexedDB
- ✅ Success message shown
- ✅ Product appears in list with sync status "pending"
- ✅ No API call made (offline)

**2.2. Edit Product Offline**
1. Still offline
2. Click "Edit" on product
3. Change name to "Test Product Offline - Updated"
4. Click "Save"

**Expected Results:**
- ✅ Product updated in IndexedDB
- ✅ Version incremented
- ✅ Sync status still "pending"

**2.3. Sync When Online**
1. DevTools → Network → Set "Online"
2. Wait for auto-sync (or click "Sync Now")

**Expected Results:**
- ✅ Product synced to server
- ✅ Sync status changed to "synced"
- ✅ Server returns product with ID
- ✅ IndexedDB updated with server ID

**2.4. Delete Product**
1. Click "Delete" on product
2. Confirm deletion

**Expected Results:**
- ✅ Product marked as deleted in IndexedDB
- ✅ Sync to server
- ✅ Product removed from list

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 3: Offline-First - Customers (Entity 2/14) ✅

**Test Steps:**

**3.1. Create Customer Offline**
1. Go to Customers page
2. Set offline
3. Click "Add Customer"
4. Fill form:
   - Name: "Test Customer"
   - Email: "customer@test.com"
   - Phone: "0123456789"
5. Click "Save"

**Expected Results:**
- ✅ Customer saved to IndexedDB
- ✅ Sync status "pending"

**3.2. Sync Customer**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Customer synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 4: Offline-First - Suppliers (Entity 3/14) ✅

**Test Steps:**

**4.1. Create Supplier Offline**
1. Go to Suppliers page
2. Set offline
3. Click "Add Supplier"
4. Fill form:
   - Name: "Test Supplier"
   - Email: "supplier@test.com"
   - Phone: "0987654321"
5. Click "Save"

**Expected Results:**
- ✅ Supplier saved to IndexedDB
- ✅ Sync status "pending"

**4.2. Sync Supplier**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Supplier synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 5: Offline-First - Sales Orders (Entity 4/14) ✅

**Test Steps:**

**5.1. Create Sales Order Offline**
1. Go to Sales Orders page
2. Set offline
3. Click "Add Order"
4. Fill form:
   - Customer: Select "Test Customer"
   - Products: Add "Test Product Offline"
   - Quantity: 2
5. Click "Save"

**Expected Results:**
- ✅ Order saved to IndexedDB
- ✅ Sync status "pending"
- ✅ Total calculated correctly

**5.2. Sync Order**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Order synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 6: Offline-First - Purchase Orders (Entity 5/14) ✅

**Test Steps:**

**6.1. Create Purchase Order Offline**
1. Go to Purchase Orders page
2. Set offline
3. Click "Add Order"
4. Fill form:
   - Supplier: Select "Test Supplier"
   - Products: Add "Test Product Offline"
   - Quantity: 10
5. Click "Save"

**Expected Results:**
- ✅ Order saved to IndexedDB
- ✅ Sync status "pending"

**6.2. Sync Order**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Order synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 7: Offline-First - Invoices (Entity 6/14) ✅

**Test Steps:**

**7.1. Create Invoice Offline**
1. Go to Invoices page
2. Set offline
3. Click "Add Invoice"
4. Fill form:
   - Customer: Select "Test Customer"
   - Items: Add products
5. Click "Save"

**Expected Results:**
- ✅ Invoice saved to IndexedDB
- ✅ Sync status "pending"

**7.2. Sync Invoice**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Invoice synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 8: Offline-First - Payments (Entity 7/14) ✅

**Test Steps:**

**8.1. Create Payment Offline**
1. Go to Payments page
2. Set offline
3. Click "Add Payment"
4. Fill form:
   - Invoice: Select invoice
   - Amount: 100000
   - Method: Cash
5. Click "Save"

**Expected Results:**
- ✅ Payment saved to IndexedDB
- ✅ Sync status "pending"

**8.2. Sync Payment**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Payment synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 9: Offline-First - Stock (Entity 8/14) ✅

**Test Steps:**

**9.1. View Stock Offline**
1. Go to Stock page
2. Set offline
3. View stock list

**Expected Results:**
- ✅ Stock loaded from IndexedDB
- ✅ Data displayed correctly

**9.2. Update Stock Offline**
1. Still offline
2. Adjust stock quantity
3. Save changes

**Expected Results:**
- ✅ Stock updated in IndexedDB
- ✅ Sync status "pending"

**9.3. Sync Stock**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Stock synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 10: Offline-First - Stock Receipts (Entity 9/14) ✅

**Test Steps:**

**10.1. Create Stock Receipt Offline**
1. Go to Stock Receipts page
2. Set offline
3. Click "Add Receipt"
4. Fill form:
   - Warehouse: Select warehouse
   - Products: Add products
   - Quantity: 20
5. Click "Save"

**Expected Results:**
- ✅ Receipt saved to IndexedDB
- ✅ Sync status "pending"

**10.2. Sync Receipt**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Receipt synced to server
- ✅ Sync status "synced"
- ✅ Stock quantity updated

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 11: Offline-First - Warehouses (Entity 10/14) ✅

**Test Steps:**

**11.1. Create Warehouse Offline**
1. Go to Warehouses page
2. Set offline
3. Click "Add Warehouse"
4. Fill form:
   - Name: "Test Warehouse"
   - Address: "123 Test St"
5. Click "Save"

**Expected Results:**
- ✅ Warehouse saved to IndexedDB
- ✅ Sync status "pending"

**11.2. Sync Warehouse**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ Warehouse synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 12: Offline-First - Users (Entity 11/14) ✅

**Test Steps:**

**12.1. Create User Offline**
1. Go to Users page
2. Set offline
3. Click "Add User"
4. Fill form:
   - Email: "testuser@test.com"
   - Name: "Test User"
   - Role: "user"
5. Click "Save"

**Expected Results:**
- ✅ User saved to IndexedDB
- ✅ Sync status "pending"

**12.2. Sync User**
1. Set online
2. Wait for sync

**Expected Results:**
- ✅ User synced to server
- ✅ Sync status "synced"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 13: Conflict Resolution ✅

**Test Steps:**

**13.1. Create Conflict**
1. Device A: Edit product "Test Product" offline
2. Device B: Edit same product offline (different changes)
3. Device A: Go online, sync
4. Device B: Go online, sync

**Expected Results:**
- ✅ Last-write-wins strategy applied
- ✅ Device B changes overwrite Device A
- ✅ Version incremented correctly
- ✅ No data loss

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 14: Auto-Logout After Inactivity ✅

**Test Steps:**

**14.1. Test Inactivity Logout**
1. Login to app
2. Wait 30 minutes without interaction
3. Try to interact with app

**Expected Results:**
- ✅ User logged out automatically
- ✅ Redirect to login page
- ✅ Session cleared

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

### Scenario 15: Low Stock Alerts ✅

**Test Steps:**

**15.1. Test Low Stock Alert**
1. Go to Products page
2. Set product stock below minimum (e.g., 5 units)
3. Check notifications

**Expected Results:**
- ✅ Low stock alert shown
- ✅ Notification badge updated
- ✅ Alert details correct

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________

---

## Remaining Entities to Test (12-14)

### Entity 12: Categories ✅
- Create/Edit/Delete offline
- Sync when online

### Entity 13: Notifications ✅
- View notifications offline
- Mark as read offline
- Sync when online

### Entity 14: Settings ✅
- Update settings offline
- Sync when online

---

## Bug Tracking

### Critical Bugs (Blocker)
- [ ] Bug 1: _______________
- [ ] Bug 2: _______________

### Major Bugs (High Priority)
- [ ] Bug 1: _______________
- [ ] Bug 2: _______________

### Minor Bugs (Low Priority)
- [ ] Bug 1: _______________
- [ ] Bug 2: _______________

---

## Test Summary

**Total Scenarios:** 15  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Critical Bugs Found:** ___  
**Major Bugs Found:** ___  
**Minor Bugs Found:** ___  

**Overall Status:** [ ] Pass / [ ] Fail

**Recommendation:**
- [ ] Ready for Day 4-7 (Add Monitoring)
- [ ] Need to fix critical bugs first
- [ ] Need to fix major bugs first

---

**Tester:** _______________  
**Date Completed:** _______________  
**Sign-off:** _______________

