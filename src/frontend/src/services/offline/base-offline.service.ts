import { SyncStatus, BaseEntity } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';
import { Table } from 'dexie';

/**
 * Base offline service for CRUD operations
 * Provides common functionality for all offline entities
 */
export class BaseOfflineService<T extends BaseEntity> {
  constructor(
    private table: Table<T, string>,
    private entityName: string
  ) {}

  /**
   * Get all records
   */
  async getAll(): Promise<T[]> {
    return this.table.toArray();
  }

  /**
   * Get record by ID
   */
  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  /**
   * Get records by tenant
   */
  async getByTenant(tenantId: string): Promise<T[]> {
    return this.table.where('tenantId').equals(tenantId).toArray();
  }

  /**
   * Get pending records (not synced)
   */
  async getPending(): Promise<T[]> {
    return this.table
      .where('syncStatus')
      .equals(SyncStatus.PENDING)
      .toArray();
  }

  /**
   * Create new record
   */
  async create(data: Omit<T, 'id' | 'version' | 'syncStatus' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const record: T = {
      ...data,
      id: this.generateOfflineId(),
      version: 1,
      syncStatus: SyncStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    } as T;

    await this.table.add(record);
    
    // Queue for sync
    await syncManager.queueOperation(
      this.entityName,
      'create',
      record,
      record.version,
      record.id
    );

    return record;
  }

  /**
   * Update existing record
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const existing = await this.table.get(id);
    if (!existing) {
      throw new Error(`${this.entityName} not found: ${id}`);
    }

    const updated: T = {
      ...existing,
      ...data,
      version: existing.version + 1,
      syncStatus: SyncStatus.PENDING,
      updatedAt: new Date(),
    };

    await this.table.put(updated);
    
    // Queue for sync
    await syncManager.queueOperation(
      this.entityName,
      'update',
      updated,
      updated.version,
      updated.id
    );

    return updated;
  }

  /**
   * Delete record (soft delete)
   */
  async delete(id: string): Promise<void> {
    const existing = await this.table.get(id);
    if (!existing) {
      throw new Error(`${this.entityName} not found: ${id}`);
    }

    const deleted: T = {
      ...existing,
      deletedAt: new Date(),
      syncStatus: SyncStatus.PENDING,
      updatedAt: new Date(),
    };

    await this.table.put(deleted);
    
    // Queue for sync
    await syncManager.queueOperation(
      this.entityName,
      'delete',
      deleted,
      deleted.version,
      deleted.id
    );
  }

  /**
   * Hard delete record
   */
  async hardDelete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  /**
   * Search records
   */
  async search(query: string, fields: (keyof T)[]): Promise<T[]> {
    const all = await this.table.toArray();
    const lowerQuery = query.toLowerCase();

    return all.filter(record => 
      fields.some(field => {
        const value = record[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }

  /**
   * Count records
   */
  async count(): Promise<number> {
    return this.table.count();
  }

  /**
   * Clear all records (use with caution)
   */
  async clear(): Promise<void> {
    await this.table.clear();
  }

  /**
   * Generate offline ID
   */
  private generateOfflineId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
