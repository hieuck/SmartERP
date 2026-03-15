# Phase 3: Core Entities Offline Support

## Overview

Phase 3 extends offline-first support from Users to 5 core business entities: Products, Customers, Suppliers, Sales Orders, and Invoices.

---

## Implementation Approach

### Strategy: Generic Offline Service

Instead of modifying each page individually, we created a **generic offline service** that works for any entity.

**Benefits:**
- ✅ Reusable across all entities
- ✅ Consistent offline behavior
- ✅ Easy to add new entities
- ✅ Minimal code duplication

---

## Components Implemented

### 1. Generic OfflineService Class

**File:** `src/frontend/src/lib/offline/offline-service.ts`

**Features:**
- `getAll()` - Get all records from IndexedDB
- `getById(id)` - Get single record
- `create(data)` - Create with auto-queue for sync
- `update(id, data)` - Update with version increment
- `delete(id)` - Soft delete with sync queue
- `search(predicate)` - Client-side search
- `count()` - Count records
- `clear()` - Clear all records

**Usage:**
```typescript
const service = createOfflineService<Product>('products', 'products');

// Create product offline
const product = await service.create({
  sku: 'P001',
  name: 'Product 1',
  price: 100,
});

// Auto-queued for sync when online
```

### 2. Extended IndexedDB Schema

**File:** `src/frontend/src/lib/offline/db.ts`

**Added Tables:**
- `products` - Product catalog
- `customers` - Customer records
- `suppliers` - Supplier records
- `salesOrders` - Sales orders
- `invoices` - Invoices

**Schema Version:** Upgraded from v1 to v2

**Indexes:**
- Primary: `id`
- Tenant isolation: `tenantId`
- Business keys: `sku`, `code`, `orderNumber`, `invoiceNumber`
- Sync tracking: `syncStatus`, `lastSyncedAt`

### 3. Pre-configured Services

**File:** `src/frontend/src/services/offline-services.ts`

**Exported Services:**
```typescript
export const offlineServices = {
  users: userOfflineService,
  products: productOfflineService,
  customers: customerOfflineService,
  suppliers: supplierOfflineService,
  salesOrders: salesOrderOfflineService,
  invoices: invoiceOfflineService,
};
```

**Usage in Pages:**
```typescript
import { offlineServices } from '@/services/offline-services';

// In ProductList.tsx
const products = await offlineServices.products.getAll();

// In ProductForm.tsx
await offlineServices.products.create(formData);
```

### 4. Updated SyncManager

**File:** `src/frontend/src/lib/offline/sync-manager.ts`

**Changes:**
- Pull all 6 entities: `['users', 'products', 'customers', 'suppliers', 'salesOrders', 'invoices']`
- Apply changes to correct tables
- Support for all entity types

### 5. Updated Backend SyncService

**File:** `src/backend/src/common/sync/sync.service.ts`

**Changes:**
- Entity map includes all 6 entities
- Repository resolution for all types
- Conflict resolution for all entities

---

## Entity Schemas

### Product
```typescript
interface Product extends BaseEntity {
  sku: string;              // Unique product code
  name: string;             // Product name
  description?: string;     // Description
  price: number;            // Selling price
  cost?: number;            // Cost price
  categoryId?: string;      // Category reference
  unit?: string;            // Unit of measure
  barcode?: string;         // Barcode
  imageUrl?: string;        // Product image
  status: string;           // active, inactive
}
```

### Customer
```typescript
interface Customer extends BaseEntity {
  code: string;             // Unique customer code
  name: string;             // Customer name
  email?: string;           // Email
  phone?: string;           // Phone
  address?: string;         // Address
  taxCode?: string;         // Tax ID
  contactPerson?: string;   // Contact person
  status: string;           // active, inactive
}
```

### Supplier
```typescript
interface Supplier extends BaseEntity {
  code: string;             // Unique supplier code
  name: string;             // Supplier name
  email?: string;           // Email
  phone?: string;           // Phone
  address?: string;         // Address
  taxCode?: string;         // Tax ID
  contactPerson?: string;   // Contact person
  paymentTerms?: string;    // Payment terms
  status: string;           // active, inactive
}
```

### SalesOrder
```typescript
interface SalesOrder extends BaseEntity {
  orderNumber: string;      // Unique order number
  customerId: string;       // Customer reference
  orderDate: Date;          // Order date
  deliveryDate?: Date;      // Expected delivery
  status: string;           // draft, confirmed, shipped, completed
  totalAmount: number;      // Total amount
  notes?: string;           // Notes
}
```

### Invoice
```typescript
interface Invoice extends BaseEntity {
  invoiceNumber: string;    // Unique invoice number
  customerId: string;       // Customer reference
  orderId?: string;         // Order reference
  invoiceDate: Date;        // Invoice date
  dueDate?: Date;           // Payment due date
  status: string;           // draft, sent, paid, overdue
  totalAmount: number;      // Total amount
  paidAmount: number;       // Amount paid
  notes?: string;           // Notes
}
```

---

## Migration Guide

### For Existing Pages

**Before (API-only):**
```typescript
// ProductList.tsx
const fetchProducts = async () => {
  const response = await axios.get('/api/products');
  setProducts(response.data);
};
```

**After (Offline-first):**
```typescript
// ProductList.tsx
import { offlineServices } from '@/services/offline-services';

const fetchProducts = async () => {
  // Load from IndexedDB (works offline)
  const products = await offlineServices.products.getAll();
  setProducts(products);
};

// Auto-sync in background when online
useEffect(() => {
  if (navigator.onLine) {
    syncManager.sync(token); // Syncs all entities
  }
}, []);
```

### For Create/Update/Delete

**Before:**
```typescript
const handleCreate = async (data) => {
  await axios.post('/api/products', data);
  fetchProducts();
};
```

**After:**
```typescript
const handleCreate = async (data) => {
  // Works offline, auto-queued for sync
  await offlineServices.products.create(data);
  fetchProducts(); // Loads from IndexedDB
};
```

---

## Testing Scenarios

### Scenario 1: Create Product Offline
1. Turn off internet
2. Create new product
3. **Expected**: Product saved to IndexedDB, queued for sync
4. Turn on internet
5. **Expected**: Auto-sync pushes product to server

### Scenario 2: Edit Customer Offline
1. Load customer list (from IndexedDB)
2. Turn off internet
3. Edit customer
4. **Expected**: Changes saved locally, queued
5. Turn on internet
6. **Expected**: Auto-sync updates server

### Scenario 3: Delete Supplier Offline
1. Turn off internet
2. Delete supplier
3. **Expected**: Soft delete in IndexedDB, queued
4. Turn on internet
5. **Expected**: Auto-sync deletes on server

### Scenario 4: Conflict Resolution
1. Edit product on device 1 (offline)
2. Edit same product on device 2 (online)
3. Device 1 comes online
4. **Expected**: Last-write-wins, newer timestamp wins

---

## Performance Considerations

### IndexedDB Performance
- **Read**: ~1ms per record
- **Write**: ~2ms per record
- **Bulk operations**: Use `bulkPut()` for better performance

### Sync Performance
- **Pull**: Fetches only changes since last sync
- **Push**: Batches all queued operations
- **Conflict detection**: O(1) version check

### Memory Usage
- IndexedDB: ~50MB typical usage
- Sync queue: ~1MB for 1000 operations

---

## Limitations & Future Work

### Current Limitations
1. ❌ No support for related entities (e.g., order items)
2. ❌ No support for file attachments
3. ❌ No support for complex queries (joins)
4. ❌ No support for real-time updates

### Future Enhancements
1. ✅ Add support for order items, invoice items
2. ✅ Add support for file sync
3. ✅ Add support for complex queries with Dexie
4. ✅ Add WebSocket for real-time sync

---

## Summary

### What's Done ✅
- Generic OfflineService for any entity
- Extended IndexedDB schema (6 entities)
- Pre-configured services for all entities
- Updated SyncManager for all entities
- Updated Backend SyncService
- Migration guide for existing pages

### What's Next ❌
- Integrate into existing pages (ProductList, CustomerList, etc.)
- Add support for related entities (order items, invoice items)
- Add support for remaining entities (inventory, warehouses, etc.)
- Mobile app with React Native

---

**Last Updated:** 2026-03-15
**Version:** 3.0.0
**Status:** Infrastructure Complete, Integration Pending
