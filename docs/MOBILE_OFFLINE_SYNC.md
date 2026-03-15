# Mobile Offline Sync Strategy

## Overview

Mobile app implements offline-first architecture matching frontend pattern with SQLite database for robust data persistence.

## Architecture Decision

**Storage Choice: SQLite (expo-sqlite)**
- ✅ Powerful relational database
- ✅ Supports 14 entities with complex relationships
- ✅ Better performance than AsyncStorage for large datasets
- ✅ SQL queries for filtering/sorting
- ✅ Transactions for data integrity
- ✅ Matches frontend IndexedDB pattern

**Why NOT AsyncStorage:**
- ❌ Key-value store (too simple for 14 entities)
- ❌ No relationships, no indexes
- ❌ Poor performance with large data
- ❌ No transactions
- ❌ Limited to 6MB on Android

## Entities Coverage

**Target: 14 entities (matching frontend)**

1. User
2. Product
3. Customer
4. Supplier
5. SalesOrder
6. Invoice
7. Payment
8. PurchaseOrder
9. Warehouse
10. Stock
11. StockReceipt
12. Attendance
13. Notification
14. Category

**Current: 3 entities (21% coverage)**
- products
- inventory (Stock)
- orders (SalesOrder)

**Gap: 11 entities missing (79%)**


## Implementation Components

### 1. Database Layer (SQLite)

**File:** `src/mobile/src/lib/offline/db.ts`

**Schema:**
```typescript
// Base entity interface (matching frontend)
interface BaseEntity {
  id: string;
  tenantId: string;
  version: number;
  lastSyncedAt?: string; // ISO timestamp
  syncStatus: 'synced' | 'pending' | 'conflict';
  offlineId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Entity interfaces (14 entities matching frontend)
interface Product extends BaseEntity { ... }
interface Customer extends BaseEntity { ... }
// ... 12 more entities
```

**Tables:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenantId TEXT NOT NULL,
  email TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  lastSyncedAt TEXT,
  syncStatus TEXT DEFAULT 'synced',
  offlineId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

-- 13 more tables for remaining entities
```


### 2. Sync Manager

**File:** `src/mobile/src/lib/offline/sync-manager.ts`

**Features (matching frontend):**
- Bidirectional sync (pull + push)
- Auto-sync when network available
- Exponential backoff retry (1s, 2s, 4s, 8s, 16s)
- Pause/resume on network loss
- Sync queue management
- Network monitoring
- Conflict detection

**API Endpoints:**
- `POST /api/sync/pull` - Download changes since last sync
- `POST /api/sync/push` - Upload local changes
- `POST /api/sync/resolve` - Resolve conflicts

### 3. Conflict Resolver

**File:** `src/mobile/src/lib/offline/conflict-resolver.ts`

**Strategies:**
- Last-Write-Wins (default)
- Keep Local
- Keep Server
- Manual Merge

### 4. Offline Service

**File:** `src/mobile/src/lib/offline/offline-service.ts`

**Generic CRUD (matching frontend):**
```typescript
class OfflineService<T extends BaseEntity> {
  async getAll(): Promise<T[]>
  async getById(id: string): Promise<T | undefined>
  async create(data: Omit<T, keyof BaseEntity>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<void>
  async search(predicate: (record: T) => boolean): Promise<T[]>
  async count(): Promise<number>
}
```


## Implementation Plan

### Phase 1: Setup SQLite Database (Priority: HIGH)

**Tasks:**
1. Install expo-sqlite dependency
2. Create database schema (14 tables)
3. Create migration system
4. Implement database initialization
5. Add indexes for performance

**Files to create:**
- `src/mobile/src/lib/offline/db.ts`
- `src/mobile/src/lib/offline/migrations.ts`

### Phase 2: Port Sync Manager (Priority: HIGH)

**Tasks:**
1. Port frontend sync-manager.ts to React Native
2. Implement pull/push logic
3. Add retry with exponential backoff
4. Add network monitoring (NetInfo)
5. Add pause/resume on network loss

**Files to create:**
- `src/mobile/src/lib/offline/sync-manager.ts`

### Phase 3: Port Conflict Resolver (Priority: MEDIUM)

**Tasks:**
1. Port frontend conflict-resolver.ts
2. Implement resolution strategies
3. Add conflict UI components

**Files to create:**
- `src/mobile/src/lib/offline/conflict-resolver.ts`

### Phase 4: Port Offline Service (Priority: HIGH)

**Tasks:**
1. Port frontend offline-service.ts
2. Implement generic CRUD operations
3. Create pre-configured services for 14 entities

**Files to create:**
- `src/mobile/src/lib/offline/offline-service.ts`
- `src/mobile/src/services/offline-services.ts`


### Phase 5: Update Existing Services (Priority: HIGH)

**Tasks:**
1. Refactor offlineStorage.ts to use SQLite
2. Update syncService.ts to use new sync-manager
3. Update offlineApiClient.ts to use offline-service
4. Update offlineSlice.ts (Redux) for 14 entities

**Files to update:**
- `src/mobile/src/services/storage/offlineStorage.ts` → DELETE (replaced by db.ts)
- `src/mobile/src/services/sync/syncService.ts` → UPDATE
- `src/mobile/src/services/api/offlineApiClient.ts` → UPDATE
- `src/mobile/src/store/slices/offlineSlice.ts` → UPDATE

### Phase 6: Update Screens (Priority: MEDIUM)

**Tasks:**
1. Update existing screens to use new offline services
2. Add sync status indicators
3. Add manual sync buttons
4. Add network status badges

**Files to update:**
- `src/mobile/src/screens/main/ProductsScreen.tsx`
- `src/mobile/src/screens/main/InventoryScreen.tsx`
- `src/mobile/src/screens/main/OrdersScreen.tsx`
- `src/mobile/src/screens/main/DashboardScreen.tsx`

## Testing Strategy

### Unit Tests
- Database operations (CRUD)
- Sync manager logic
- Conflict resolution
- Queue management

### Integration Tests
- API sync endpoints
- Database transactions
- Network monitoring

### E2E Tests (Manual)
- Complete offline workflow
- Sync after reconnection
- Conflict resolution
- Multi-device sync


## Frontend vs Mobile Comparison

| Feature | Frontend | Mobile (Current) | Mobile (Target) |
|---------|----------|------------------|-----------------|
| Storage | IndexedDB (Dexie.js) | AsyncStorage | SQLite (expo-sqlite) |
| Entities | 14 entities | 3 entities | 14 entities |
| Coverage | 100% | 21% | 100% |
| Sync Manager | ✅ Full | ⚠️ Basic | ✅ Full (port) |
| Conflict Resolution | ✅ Yes | ❌ No | ✅ Yes (port) |
| Versioning | ✅ Yes | ❌ No | ✅ Yes |
| Metadata | ✅ Full | ⚠️ Partial | ✅ Full |
| Auto-sync | ✅ Yes | ✅ Yes | ✅ Yes |
| Retry Logic | ✅ Exponential backoff | ❌ No | ✅ Exponential backoff |
| Network Monitoring | ✅ Yes | ✅ Yes | ✅ Yes |
| Pause/Resume | ✅ Yes | ❌ No | ✅ Yes |
| Generic Service | ✅ Yes | ❌ No | ✅ Yes (port) |

## Performance Targets

### Database Operations
- Insert: < 50ms per record
- Query: < 100ms for 1000 records
- Update: < 50ms per record
- Delete: < 50ms per record

### Sync Performance
- Pull 1000 records: < 5s
- Push 100 changes: < 3s
- Full sync (14 entities): < 30s

### Storage Limits
- SQLite: No practical limit (tested up to 100MB)
- Target: Support 10,000+ records per entity


## Dependencies

### Required Packages

```json
{
  "expo-sqlite": "~13.2.0",
  "@react-native-async-storage/async-storage": "1.21.0",
  "@react-native-community/netinfo": "^11.2.1",
  "axios": "^1.6.2"
}
```

### Installation

```bash
cd src/mobile
npx expo install expo-sqlite
```

## Migration from AsyncStorage to SQLite

### Step 1: Backup existing data
```typescript
const products = await offlineStorage.getProducts();
const inventory = await offlineStorage.getInventory();
const orders = await offlineStorage.getOrders();
```

### Step 2: Initialize SQLite database
```typescript
await db.init();
await db.migrate();
```

### Step 3: Import data to SQLite
```typescript
await db.products.bulkInsert(products);
await db.stocks.bulkInsert(inventory);
await db.salesOrders.bulkInsert(orders);
```

### Step 4: Clear AsyncStorage
```typescript
await offlineStorage.clearAll();
```

## Best Practices

1. **Always use transactions** for multiple operations
2. **Index frequently queried fields** (tenantId, status, syncStatus)
3. **Batch operations** when possible (bulkInsert, bulkUpdate)
4. **Monitor database size** (warn at 50MB, cleanup at 100MB)
5. **Test offline scenarios** thoroughly on real devices
6. **Log all sync operations** for debugging
7. **Handle conflicts gracefully** with user-friendly UI
8. **Validate data** before sync to prevent server errors


## Troubleshooting

### Common Issues

**Issue: Database locked**
- Cause: Multiple concurrent writes
- Fix: Use transactions, serialize writes

**Issue: Sync conflicts**
- Cause: Concurrent updates from multiple devices
- Fix: Implement proper conflict resolution UI

**Issue: Large database size**
- Cause: Too many records, no cleanup
- Fix: Implement data retention policy (e.g., keep last 3 months)

**Issue: Slow queries**
- Cause: Missing indexes
- Fix: Add indexes on frequently queried fields

## Status Summary

### Current State (Before Implementation)
- ✅ AsyncStorage with 3 entities (21% coverage)
- ✅ Basic sync service
- ✅ Network monitoring
- ❌ No conflict resolution
- ❌ No versioning
- ❌ Missing 11 entities

### Target State (After Implementation)
- ✅ SQLite with 14 entities (100% coverage)
- ✅ Full sync manager (matching frontend)
- ✅ Conflict resolution
- ✅ Versioning and metadata
- ✅ Generic offline service
- ✅ All 14 entities supported

---

**Last Updated:** 2026-03-15
**Version:** 1.0.0
**Status:** 📝 DOCUMENTED - Ready for implementation

