import Dexie, { Table } from 'dexie';

// Sync status enum matching backend
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
}

// Base interface for all entities
export interface BaseEntity {
  id: string;
  tenantId: string;
  version: number;
  lastSyncedAt?: Date;
  syncStatus: SyncStatus;
  offlineId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// User entity
export interface User extends BaseEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
}

// Sync queue item
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  version?: number;
  offlineId?: string;
  createdAt: Date;
  retryCount: number;
}

// Offline database class
export class OfflineDB extends Dexie {
  users!: Table<User, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SmartERP');
    
    this.version(1).stores({
      users: 'id, tenantId, email, syncStatus, lastSyncedAt',
      syncQueue: '++id, entity, operation, createdAt',
    });
  }
}

// Export singleton instance
export const db = new OfflineDB();
