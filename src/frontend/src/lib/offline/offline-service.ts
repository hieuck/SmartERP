import { db } from './db';
import { syncManager } from './sync-manager';
import { SyncStatus } from './db';

/**
 * Generic Offline Service
 * Wraps API calls with offline-first support for any entity
 */
export class OfflineService<T extends { id: string }> {
  constructor(
    private entityName: string,
    private tableName: keyof typeof db,
  ) {}

  /**
   * Get all records (offline-first)
   */
  async getAll(): Promise<T[]> {
    try {
      const table = db[this.tableName] as any;
      return await table.toArray();
    } catch (error) {
      console.error(`[Offline] Failed to get ${this.entityName}`, error);
      throw error;
    }
  }

  /**
   * Get single record by ID (offline-first)
   */
  async getById(id: string): Promise<T | undefined> {
    try {
      const table = db[this.tableName] as any;
      return await table.get(id);
    } catch (error) {
      console.error(`[Offline] Failed to get ${this.entityName} ${id}`, error);
      throw error;
    }
  }

  /**
   * Create record (offline-first)
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      const record = {
        ...data,
        id: crypto.randomUUID(),
        offlineId: crypto.randomUUID(),
        syncStatus: SyncStatus.PENDING,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as T;

      const table = db[this.tableName] as any;
      await table.add(record);

      // Queue for sync
      await syncManager.queueOperation(
        this.entityName,
        'create',
        record,
      );

      return record;
    } catch (error) {
      console.error(`[Offline] Failed to create ${this.entityName}`, error);
      throw error;
    }
  }

  /**
   * Update record (offline-first)
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const table = db[this.tableName] as any;
      const existing = await table.get(id);

      if (!existing) {
        throw new Error(`${this.entityName} not found: ${id}`);
      }

      const updated = {
        ...existing,
        ...data,
        id, // Preserve ID
        version: existing.version + 1,
        syncStatus: SyncStatus.PENDING,
        updatedAt: new Date(),
      };

      await table.put(updated);

      // Queue for sync
      await syncManager.queueOperation(
        this.entityName,
        'update',
        updated,
        existing.version,
      );

      return updated;
    } catch (error) {
      console.error(`[Offline] Failed to update ${this.entityName} ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete record (offline-first)
   */
  async delete(id: string): Promise<void> {
    try {
      const table = db[this.tableName] as any;
      const existing = await table.get(id);

      if (!existing) {
        throw new Error(`${this.entityName} not found: ${id}`);
      }

      // Soft delete
      const deleted = {
        ...existing,
        deletedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
      };

      await table.put(deleted);

      // Queue for sync
      await syncManager.queueOperation(
        this.entityName,
        'delete',
        { id },
      );
    } catch (error) {
      console.error(`[Offline] Failed to delete ${this.entityName} ${id}`, error);
      throw error;
    }
  }

  /**
   * Search records (offline-first)
   */
  async search(predicate: (record: T) => boolean): Promise<T[]> {
    try {
      const table = db[this.tableName] as any;
      const all = await table.toArray();
      return all.filter(predicate);
    } catch (error) {
      console.error(`[Offline] Failed to search ${this.entityName}`, error);
      throw error;
    }
  }

  /**
   * Count records (offline-first)
   */
  async count(): Promise<number> {
    try {
      const table = db[this.tableName] as any;
      return await table.count();
    } catch (error) {
      console.error(`[Offline] Failed to count ${this.entityName}`, error);
      throw error;
    }
  }

  /**
   * Clear all records (use with caution)
   */
  async clear(): Promise<void> {
    try {
      const table = db[this.tableName] as any;
      await table.clear();
    } catch (error) {
      console.error(`[Offline] Failed to clear ${this.entityName}`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create offline service for any entity
 */
export function createOfflineService<T extends { id: string }>(
  entityName: string,
  tableName: keyof typeof db,
): OfflineService<T> {
  return new OfflineService<T>(entityName, tableName);
}
