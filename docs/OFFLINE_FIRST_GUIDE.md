# Offline-First Architecture Guide

## Overview

SmartERP implements offline-first architecture to ensure business continuity regardless of internet connectivity.

## Architecture Components

### 1. Frontend Layer

**IndexedDB (Dexie.js)**
- Local database storing all business data
- Fast read/write operations
- Structured data with indexes
- Supports complex queries

**Sync Manager**
- Orchestrates bidirectional synchronization
- Handles conflict detection and resolution
- Implements retry logic with exponential backoff
- Manages sync queue for offline operations

**Service Worker (Workbox)**
- Intercepts network requests
- Implements caching strategies
- Enables background sync
- Handles push notifications

### 2. Backend Layer

**Sync API Endpoints**
- `POST /api/sync/pull` - Download changes since last sync
- `POST /api/sync/push` - Upload local changes
- `POST /api/sync/resolve` - Resolve conflicts

**Database Schema**
- `version` field for optimistic locking
- `lastSyncedAt` timestamp
- `syncStatus` enum (synced, pending, conflict)
- `offlineId` for temporary records

## Sync Strategies

### Version-Based Conflict Resolution (Recommended)

**How it works:**
1. Each record has a version number
2. Version increments on every update
3. Client sends version with update
4. Server checks if version matches
5. If mismatch → conflict detected
6. User resolves conflict manually

**Pros:**
- No data loss
- User has full control
- Audit trail preserved

**Cons:**
- Requires user intervention
- More complex implementation

### Last-Write-Wins (LWW)

**How it works:**
1. Server timestamp is source of truth
2. Latest update always wins
3. No conflict resolution needed

**Pros:**
- Simple implementation
- No user intervention

**Cons:**
- May lose data
- No audit trail

## Implementation Guide

### Phase 1: Database Schema Enhancement

Add sync metadata to BaseEntity:

```typescript
@Entity()
export class BaseEntity {
  @Column({ type: 'int', default: 1 })
  version: number;
  
  @Column({ type: 'timestamp' })
  lastSyncedAt: Date;
  
  @Column({ type: 'enum', enum: SyncStatus })
  syncStatus: SyncStatus;
  
  @Column({ type: 'uuid', nullable: true })
  offlineId?: string;
}
```

### Phase 2: Frontend Offline Storage

Setup IndexedDB with Dexie.js:

```typescript
import Dexie from 'dexie';

class OfflineDB extends Dexie {
  constructor() {
    super('SmartERP');
    this.version(1).stores({
      products: 'id, tenantId, sku, lastSyncedAt',
      orders: 'id, tenantId, status, lastSyncedAt',
      syncQueue: '++id, operation, entity, data'
    });
  }
}
```

### Phase 3: Sync Manager

Implement bidirectional sync:

```typescript
class SyncManager {
  async sync() {
    await this.pull(); // Download server changes
    await this.push(); // Upload local changes
  }
  
  async pull() {
    const lastSync = await this.getLastSyncTime();
    const response = await api.sync.pull({ since: lastSync });
    await this.applyChanges(response.changes);
  }
  
  async push() {
    const queue = await db.syncQueue.toArray();
    for (const item of queue) {
      const result = await api.sync.push(item);
      if (result.conflict) {
        await this.handleConflict(result.conflict);
      } else {
        await db.syncQueue.delete(item.id);
      }
    }
  }
}
```

### Phase 4: Service Worker

Register service worker with Workbox:

```javascript
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

registerRoute(
  /\/api\//,
  new NetworkFirst({
    plugins: [
      new BackgroundSyncPlugin('api-queue', {
        maxRetentionTime: 24 * 60
      })
    ]
  })
);
```

## Conflict Resolution

### Conflict Detection

Conflict occurs when:
- Version mismatch (version-based)
- Concurrent updates to same record
- Delete vs Update conflict

### Resolution Strategies

**1. Manual Resolution**
- Show both versions to user
- User chooses: keep local, keep server, or merge
- Best for critical data

**2. Automatic Resolution**
- Apply predefined rules
- Example: Server always wins for prices
- Best for non-critical data

**3. Merge Strategy**
- Combine changes from both versions
- Field-level merging
- Best for independent fields

## Testing Strategy

### Unit Tests
- Sync manager logic
- Conflict detection
- Queue management

### Integration Tests
- API sync endpoints
- Database operations
- Service worker caching

### E2E Tests
- Complete offline workflow
- Sync after reconnection
- Conflict resolution UI

## Performance Optimization

### Indexing
- Index frequently queried fields
- Composite indexes for multi-field queries

### Batch Operations
- Batch sync operations
- Reduce API calls

### Incremental Sync
- Only sync changed records
- Use lastSyncedAt timestamp

### Compression
- Compress sync payloads
- Reduce bandwidth usage

## Security Considerations

### Data Encryption
- Encrypt sensitive data in IndexedDB
- Use Web Crypto API

### Authentication
- JWT tokens stored securely
- Refresh tokens for long sessions

### Authorization
- Tenant isolation in sync
- Row-level security

## Monitoring & Debugging

### Metrics
- Sync success rate
- Conflict frequency
- Sync duration
- Queue size

### Logging
- Sync operations
- Conflicts detected
- Errors and retries

### Debug Tools
- IndexedDB inspector
- Service Worker inspector
- Network tab for sync API

## Best Practices

1. **Always sync on app start**
2. **Show sync status to user**
3. **Handle conflicts gracefully**
4. **Test offline scenarios thoroughly**
5. **Monitor sync performance**
6. **Implement retry logic**
7. **Use optimistic UI updates**
8. **Cache static assets**
9. **Validate data before sync**
10. **Document sync behavior**

## Troubleshooting

### Sync Not Working
- Check network connectivity
- Verify JWT token validity
- Check sync queue for errors
- Review server logs

### Conflicts Not Resolving
- Check version numbers
- Verify conflict resolution logic
- Review user permissions

### Performance Issues
- Check IndexedDB size
- Review sync batch size
- Optimize queries
- Add indexes

## Future Enhancements

- Real-time sync with WebSocket
- Collaborative editing
- Offline file uploads
- Progressive sync (priority-based)
- Conflict prediction
- Auto-merge strategies

---

**Last Updated:** 2026-03-15
**Version:** 1.0.0
