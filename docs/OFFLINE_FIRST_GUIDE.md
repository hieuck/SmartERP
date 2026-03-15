# Offline-First Architecture Guide

**Version:** 1.0  
**Last Updated:** 2026-03-15

---

## Overview

SmartERP implements offline-first architecture for uninterrupted business operations.

**Current Coverage:** 17% (14/82 entities)

**Implemented Entities:**
- Products, Customers, Suppliers, Users
- Orders, Payments, Invoices, Warehouses
- Stock, Stock Receipts, Notifications, Attendance

---

## Architecture

```
User Interface (React/React Native)
    ↓
Local Database (IndexedDB/SQLite)
    ↓
Sync Manager (Conflict Resolution)
    ↓
Backend API (NestJS)
    ↓
PostgreSQL Database
```

---

## Frontend Implementation

### 1. Database Schema (IndexedDB + Dexie.js)

Location: `src/frontend/src/lib/offline/db.ts`

```typescript
import Dexie, { Table } from 'dexie';

export class OfflineDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  orders!: Table<Order>;

  constructor() {
    super('SmartERPOffline');
    
    this.version(1).stores({
      products: 'id, code, name, tenantId, lastSyncedAt, syncStatus',
      customers: 'id, code, name, tenantId, lastSyncedAt, syncStatus',
      orders: 'id, orderNumber, tenantId, lastSyncedAt, syncStatus',
    });
  }
}

export const db = new OfflineDatabase();
```

### 2. Sync Manager

Location: `src/frontend/src/lib/offline/sync-manager.ts`

```typescript
export class SyncManager {
  async syncEntity(entityName: string): Promise<void> {
    // 1. Get pending changes from local DB
    const pendingChanges = await this.getPendingChanges(entityName);
    
    // 2. Push changes to backend
    for (const change of pendingChanges) {
      try {
        await this.pushChange(entityName, change);
        await this.markAsSynced(entityName, change.id);
      } catch (error) {
        await this.handleSyncError(entityName, change, error);
      }
    }
    
    // 3. Pull latest data from backend
    const latestData = await this.pullLatestData(entityName);
    
    // 4. Merge with local data (conflict resolution)
    await this.mergeData(entityName, latestData);
  }
}
```

### 3. Conflict Resolution

Location: `src/frontend/src/lib/offline/conflict-resolver.ts`

```typescript
export class ConflictResolver {
  resolve(local: Entity, remote: Entity): Entity {
    // Strategy: Last-write-wins based on updatedAt
    if (local.updatedAt > remote.updatedAt) {
      return local;
    }
    return remote;
  }
}
```

---

## Mobile Implementation

### 1. Database (SQLite + TypeORM)

Location: `src/mobile/src/lib/offline/db.ts`

```typescript
import { DataSource } from 'typeorm';

export const mobileDataSource = new DataSource({
  type: 'react-native',
  database: 'smarterp.db',
  location: 'default',
  entities: [Product, Customer, Order],
  synchronize: true,
});
```

### 2. Sync Service

Location: `src/mobile/src/lib/offline/sync-service.ts`

```typescript
export class MobileSyncService {
  async syncAll(): Promise<void> {
    const entities = ['products', 'customers', 'orders'];
    
    for (const entity of entities) {
      await this.syncEntity(entity);
    }
  }
}
```

---

## Backend Support

### 1. Sync Metadata

All entities include sync metadata:

```typescript
@Column({ type: 'timestamp', nullable: true })
lastSyncedAt: Date;

@Column({ type: 'enum', enum: SyncStatus, default: SyncStatus.SYNCED })
syncStatus: SyncStatus;

@Column({ type: 'int', default: 1 })
version: number;
```

### 2. Sync Endpoints

```typescript
// GET /api/products/sync?since=2024-01-01T00:00:00Z
async getChanges(@Query('since') since: string) {
  return this.productService.getChangesSince(new Date(since));
}

// POST /api/products/sync
async pushChanges(@Body() changes: Product[]) {
  return this.productService.applyChanges(changes);
}
```

---

## Adding Offline Support to New Entity

### Step 1: Update Frontend Database

```typescript
// src/frontend/src/lib/offline/db.ts
this.version(2).stores({
  // ... existing stores
  invoices: 'id, invoiceNumber, tenantId, lastSyncedAt, syncStatus',
});
```

### Step 2: Create Offline Service

```typescript
// src/frontend/src/services/invoice-offline.service.ts
export class InvoiceOfflineService {
  async getAll(): Promise<Invoice[]> {
    return db.invoices.toArray();
  }

  async create(invoice: Invoice): Promise<Invoice> {
    invoice.syncStatus = SyncStatus.PENDING;
    await db.invoices.add(invoice);
    return invoice;
  }
}
```

### Step 3: Update Sync Manager

```typescript
// src/frontend/src/lib/offline/sync-manager.ts
async syncAll(): Promise<void> {
  await this.syncEntity('products');
  await this.syncEntity('customers');
  await this.syncEntity('invoices'); // ← Add new entity
}
```

### Step 4: Add Backend Sync Support

```typescript
// src/backend/src/domains/accounting/invoice/invoice.service.ts
async getChangesSince(since: Date): Promise<Invoice[]> {
  return this.repository.find({
    where: {
      updatedAt: MoreThan(since),
    },
  });
}
```

---

## Conflict Resolution Strategies

### 1. Last-Write-Wins (Default)

```typescript
if (local.updatedAt > remote.updatedAt) {
  return local;
}
return remote;
```

### 2. Manual Resolution

```typescript
if (hasConflict(local, remote)) {
  // Show conflict UI to user
  return await showConflictDialog(local, remote);
}
```

### 3. Field-Level Merge

```typescript
return {
  ...remote,
  // Keep local changes for specific fields
  notes: local.notes,
  customFields: local.customFields,
};
```

---

## Network Detection

```typescript
// Frontend
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Mobile
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
};
```

---

## Background Sync

### Frontend (Service Worker)

```typescript
// src/frontend/public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAllData());
  }
});

async function syncAllData() {
  const syncManager = new SyncManager();
  await syncManager.syncAll();
}
```

### Mobile (Background Task)

```typescript
// src/mobile/src/lib/background-sync.ts
import BackgroundFetch from 'react-native-background-fetch';

BackgroundFetch.configure({
  minimumFetchInterval: 15, // minutes
}, async (taskId) => {
  const syncService = new MobileSyncService();
  await syncService.syncAll();
  BackgroundFetch.finish(taskId);
});
```

---

## Testing Offline Functionality

### 1. Simulate Offline Mode

```typescript
// Frontend
window.dispatchEvent(new Event('offline'));

// Mobile
import NetInfo from '@react-native-community/netinfo';
NetInfo.fetch().then(state => {
  state.isConnected = false;
});
```

### 2. Test Sync

```typescript
describe('Offline Sync', () => {
  it('should sync pending changes when online', async () => {
    // Create offline change
    await offlineService.create({ name: 'Test Product' });

    // Go online
    window.dispatchEvent(new Event('online'));

    // Wait for sync
    await waitFor(() => {
      expect(syncManager.isSyncing).toBe(false);
    });

    // Verify synced
    const product = await db.products.get(1);
    expect(product.syncStatus).toBe(SyncStatus.SYNCED);
  });
});
```

---

## Troubleshooting

### Issue: Data not syncing

**Solution:**
1. Check network connection
2. Check sync status in local DB
3. Check backend logs for errors
4. Verify sync endpoints are accessible

### Issue: Conflicts not resolving

**Solution:**
1. Check conflict resolution strategy
2. Verify `updatedAt` timestamps
3. Check version numbers
4. Review conflict logs

### Issue: Local DB full

**Solution:**
1. Implement data cleanup policy
2. Remove old synced data
3. Increase storage quota
4. Implement pagination

---

## Best Practices

1. **Always check network status** before API calls
2. **Store data locally first** then sync
3. **Handle conflicts gracefully** with user feedback
4. **Implement retry logic** for failed syncs
5. **Clean up old data** regularly
6. **Test offline scenarios** thoroughly
7. **Monitor sync performance** and errors
8. **Provide sync status** to users

---

## References

- [Dexie.js Documentation](https://dexie.org/)
- [Offline-First Design](https://offlinefirst.org/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Last Updated:** 2026-03-15  
**Maintained By:** Engineering Team
