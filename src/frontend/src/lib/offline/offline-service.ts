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

import { db, BaseEntity } from './db';
import { syncManager } from './sync-manager';
import { SyncStatus } from './db';
import { logger } from '../logger/logger.service';
import { tenantContext } from '../context/tenant-context.service';
import type { Table } from 'dexie';

/**
 * Generic Offline Service
 * Professional offline-first service with proper logging and error handling
 */
export class OfflineService<T extends BaseEntity> {
  private readonly context = `OfflineService:${this.entityName}`;

  constructor(
    private readonly entityName: string,
    private readonly tableName: keyof typeof db,
  ) {}

  /**
   * Get table instance with proper typing
   */
  private getTable(): Table<T, string> {
    return db[this.tableName] as Table<T, string>;
  }

  /**
   * Get all records (offline-first)
   */
  async getAll(): Promise<T[]> {
    try {
      logger.debug(this.context, `Getting all ${this.entityName}`);
      const records = await this.getTable().toArray();
      logger.debug(this.context, `Retrieved ${records.length} ${this.entityName}`);
      return records;
    } catch (error) {
      logger.error(this.context, `Failed to get all ${this.entityName}`, error as Error);
      throw new Error(`Failed to retrieve ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Get single record by ID (offline-first)
   */
  async getById(id: string): Promise<T | undefined> {
    try {
      logger.debug(this.context, `Getting ${this.entityName} by ID: ${id}`);
      const record = await this.getTable().get(id);
      
      if (!record) {
        logger.warn(this.context, `${this.entityName} not found: ${id}`);
      }
      
      return record;
    } catch (error) {
      logger.error(this.context, `Failed to get ${this.entityName} ${id}`, error as Error);
      throw new Error(`Failed to retrieve ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Create record (offline-first)
   */
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    try {
      logger.info(this.context, `Creating ${this.entityName}`);
      
      // Get tenant ID from context
      const tenantId = tenantContext.getTenantId();
      
      // Create record with proper typing
      const record: T = {
        ...data,
        id: crypto.randomUUID(),
        tenantId,
        offlineId: crypto.randomUUID(),
        syncStatus: SyncStatus.PENDING,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;

      await this.getTable().add(record);
      logger.info(this.context, `Created ${this.entityName} with ID: ${record.id}`);

      // Queue for sync
      await syncManager.queueOperation(this.entityName, 'create', record);
      logger.debug(this.context, `Queued ${this.entityName} for sync`);

      return record;
    } catch (error) {
      logger.error(this.context, `Failed to create ${this.entityName}`, error as Error, { data });
      throw new Error(`Failed to create ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Update record (offline-first)
   */
  async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    try {
      logger.info(this.context, `Updating ${this.entityName}: ${id}`);
      
      const existing = await this.getTable().get(id);

      if (!existing) {
        const error = new Error(`${this.entityName} not found: ${id}`);
        logger.error(this.context, error.message, error);
        throw error;
      }

      const updated: T = {
        ...existing,
        ...data,
        id, // Preserve ID
        tenantId: existing.tenantId, // Preserve tenant ID
        version: existing.version + 1,
        syncStatus: SyncStatus.PENDING,
        updatedAt: new Date(),
      } as T;

      await this.getTable().put(updated);
      logger.info(this.context, `Updated ${this.entityName}: ${id}`);

      // Queue for sync
      await syncManager.queueOperation(
        this.entityName,
        'update',
        updated,
        existing.version,
      );
      logger.debug(this.context, `Queued ${this.entityName} update for sync`);

      return updated;
    } catch (error) {
      logger.error(this.context, `Failed to update ${this.entityName} ${id}`, error as Error, { data });
      throw new Error(`Failed to update ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Delete record (offline-first with soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      logger.info(this.context, `Deleting ${this.entityName}: ${id}`);
      
      const existing = await this.getTable().get(id);

      if (!existing) {
        const error = new Error(`${this.entityName} not found: ${id}`);
        logger.error(this.context, error.message, error);
        throw error;
      }

      // Soft delete
      const deleted: T = {
        ...existing,
        deletedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
      } as T;

      await this.getTable().put(deleted);
      logger.info(this.context, `Soft deleted ${this.entityName}: ${id}`);

      // Queue for sync
      await syncManager.queueOperation(this.entityName, 'delete', { id });
      logger.debug(this.context, `Queued ${this.entityName} deletion for sync`);
    } catch (error) {
      logger.error(this.context, `Failed to delete ${this.entityName} ${id}`, error as Error);
      throw new Error(`Failed to delete ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Search records with predicate (offline-first)
   */
  async search(predicate: (record: T) => boolean): Promise<T[]> {
    try {
      logger.debug(this.context, `Searching ${this.entityName}`);
      const all = await this.getTable().toArray();
      const results = all.filter(predicate);
      logger.debug(this.context, `Found ${results.length} ${this.entityName}`);
      return results;
    } catch (error) {
      logger.error(this.context, `Failed to search ${this.entityName}`, error as Error);
      throw new Error(`Failed to search ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Count records (offline-first)
   */
  async count(): Promise<number> {
    try {
      const count = await this.getTable().count();
      logger.debug(this.context, `Counted ${count} ${this.entityName}`);
      return count;
    } catch (error) {
      logger.error(this.context, `Failed to count ${this.entityName}`, error as Error);
      throw new Error(`Failed to count ${this.entityName}: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all records (use with caution)
   */
  async clear(): Promise<void> {
    try {
      logger.warn(this.context, `Clearing all ${this.entityName}`);
      await this.getTable().clear();
      logger.info(this.context, `Cleared all ${this.entityName}`);
    } catch (error) {
      logger.error(this.context, `Failed to clear ${this.entityName}`, error as Error);
      throw new Error(`Failed to clear ${this.entityName}: ${(error as Error).message}`);
    }
  }
}

/**
 * Factory function to create offline service for any entity
 */
export function createOfflineService<T extends BaseEntity>(
  entityName: string,
  tableName: keyof typeof db,
): OfflineService<T> {
  return new OfflineService<T>(entityName, tableName);
}
