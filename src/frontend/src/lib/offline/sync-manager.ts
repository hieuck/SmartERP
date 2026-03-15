import { db, SyncStatus } from './db';
import { logger } from '../logger/logger.service';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  conflicts: number;
  errors: string[];
}

export class SyncManager {
  private readonly context = 'SyncManager';
  private syncing = false;
  private lastSyncTime: Date | null = null;
  private autoSyncEnabled = true;
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly baseRetryDelay = 1000; // 1 second
  private syncPaused = false;
  private onlineListener: (() => void) | null = null;

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Enable auto sync when network available
   */
  enableAutoSync() {
    this.autoSyncEnabled = true;
    this.setupAutoSync();
    logger.info(this.context, 'Auto-sync enabled');
  }

  /**
   * Disable auto sync
   */
  disableAutoSync() {
    this.autoSyncEnabled = false;
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
    logger.info(this.context, 'Auto-sync disabled');
  }

  /**
   * Setup auto sync on network connection
   * Requirement 2.1: WHEN network connection is detected, auto start sync
   */
  private setupAutoSync() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }

    this.onlineListener = async () => {
      if (this.autoSyncEnabled && !this.syncing) {
        const token = localStorage.getItem('token');
        if (token) {
          logger.info(this.context, 'Network detected, starting auto-sync');
          await this.syncWithRetry(token);
        }
      }
    };

    window.addEventListener('online', this.onlineListener);
  }

  /**
   * Sync with exponential backoff retry
   * Requirement 2.3: IF sync fails, retry with exponential backoff
   */
  private async syncWithRetry(token: string): Promise<SyncResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.sync(token);
        this.retryCount = 0; // Reset on success
        return result;
      } catch (error: any) {
        lastError = error;
        this.retryCount = attempt + 1;

        if (attempt < this.maxRetries) {
          const delay = this.baseRetryDelay * Math.pow(2, attempt);
          logger.warn(this.context, `Sync failed, retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`, { error: error.message });
          await this.sleep(delay);
        }
      }
    }

    const error = lastError || new Error('Sync failed after max retries');
    logger.error(this.context, 'Sync failed after max retries', error);
    throw error;
  }

  /**
   * Sleep utility for retry delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pause sync (called when network lost during sync)
   * Requirement 1.4: IF network lost during sync, pause and resume
   */
  pauseSync() {
    this.syncPaused = true;
    logger.warn(this.context, 'Sync paused due to network loss');
  }

  /**
   * Resume sync (called when network restored)
   * Requirement 1.4: IF network lost during sync, pause and resume
   */
  async resumeSync(token: string) {
    if (this.syncPaused) {
      this.syncPaused = false;
      logger.info(this.context, 'Resuming sync');
      await this.syncWithRetry(token);
    }
  }

  /**
   * Full sync: pull then push
   * Requirement 1.4: Monitor network during sync
   */
  async sync(token: string): Promise<SyncResult> {
    if (this.syncing) {
      throw new Error('Sync already in progress');
    }

    // Requirement 1.5: Check if offline storage available
    if (!this.isIndexedDBAvailable()) {
      const error = new Error('Offline storage unavailable. Please use a modern browser.');
      logger.error(this.context, error.message, error);
      throw error;
    }

    this.syncing = true;
    logger.info(this.context, 'Starting sync');
    
    const result: SyncResult = {
      success: true,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    // Setup network monitoring during sync
    const offlineHandler = () => {
      this.pauseSync();
    };
    window.addEventListener('offline', offlineHandler);

    try {
      // Check if paused
      if (this.syncPaused) {
        throw new Error('Sync paused due to network loss');
      }

      // Pull changes from server
      const pullResult = await this.pull(token);
      result.pulled = pullResult.count;
      logger.info(this.context, `Pulled ${result.pulled} changes from server`);

      // Check if paused after pull
      if (this.syncPaused) {
        throw new Error('Sync paused during pull operation');
      }

      // Push local changes
      const pushResult = await this.push(token);
      result.pushed = pushResult.applied;
      result.conflicts = pushResult.conflicts.length;
      logger.info(this.context, `Pushed ${result.pushed} changes to server, ${result.conflicts} conflicts`);

      this.lastSyncTime = new Date();
      logger.info(this.context, 'Sync completed successfully');
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      
      // Log error for admin notification
      // Requirement 3.5: Log error and notify administrator
      this.logSyncError(error);
    } finally {
      this.syncing = false;
      window.removeEventListener('offline', offlineHandler);
    }

    return result;
  }

  /**
   * Check if IndexedDB is available
   * Requirement 1.5: WHERE offline storage unavailable, show error
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return 'indexedDB' in window && window.indexedDB !== null;
    } catch {
      return false;
    }
  }

  /**
   * Log sync error for admin notification
   * Requirement 3.5: IF conflict resolution fails, log error and notify admin
   */
  private logSyncError(error: Error) {
    logger.error(this.context, 'Sync error occurred', error, {
      retryCount: this.retryCount,
      lastSyncTime: this.lastSyncTime,
    });
  }

  /**
   * Pull changes from server
   */
  private async pull(token: string) {
    const since = this.lastSyncTime?.toISOString();
    
    logger.debug(this.context, 'Pulling changes from server', { since });
    
    const response = await axios.post(
      `${API_BASE_URL}/api/sync/pull`,
      { 
        since, 
        entities: [
          'users', 
          'products', 
          'customers', 
          'suppliers', 
          'salesOrders', 
          'invoices',
          'payments',
          'purchaseOrders',
          'warehouses',
          'stocks',
          'stockReceipts',
          'materials',
          'molds',
          'productionOrders',
          'attendances',
          'notifications',
          'categories'
        ]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { changes } = response.data.data;

    // Apply changes to local database
    for (const change of changes) {
      await this.applyChanges(change.entity, change.records);
    }

    return { count: changes.reduce((sum: number, c: any) => sum + c.records.length, 0) };
  }

  /**
   * Push local changes to server
   */
  private async push(token: string) {
    const queue = await db.syncQueue.toArray();
    
    if (queue.length === 0) {
      logger.debug(this.context, 'No changes to push');
      return { applied: 0, conflicts: [] };
    }

    logger.debug(this.context, `Pushing ${queue.length} changes to server`);

    const changes = queue.map(item => ({
      entity: item.entity,
      operation: item.operation,
      data: item.data,
      version: item.version,
      offlineId: item.offlineId,
    }));

    const response = await axios.post(
      `${API_BASE_URL}/api/sync/push`,
      { changes },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { applied, conflicts } = response.data.data;

    // Remove successfully applied items from queue
    const appliedIds = queue.slice(0, applied).map(item => item.id!);
    await db.syncQueue.bulkDelete(appliedIds);

    return { applied, conflicts };
  }

  /**
   * Apply changes to local database (DRY - no duplication)
   */
  private async applyChanges(entity: string, records: any[]) {
    logger.debug(this.context, `Applying ${records.length} changes for ${entity}`);

    // Entity to table mapping
    const tableMap: Record<string, keyof typeof db> = {
      users: 'users',
      products: 'products',
      customers: 'customers',
      suppliers: 'suppliers',
      salesOrders: 'salesOrders',
      invoices: 'invoices',
      payments: 'payments',
      purchaseOrders: 'purchaseOrders',
      warehouses: 'warehouses',
      stocks: 'stocks',
      stockReceipts: 'stockReceipts',
      materials: 'materials',
      molds: 'molds',
      productionOrders: 'productionOrders',
      attendances: 'attendances',
      notifications: 'notifications',
      categories: 'categories',
    };

    const tableName = tableMap[entity];
    
    if (!tableName) {
      logger.warn(this.context, `Unknown entity: ${entity}`);
      return;
    }

    const table = db[tableName] as any;

    // Apply all records
    for (const record of records) {
      await table.put({
        ...record,
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: new Date(),
      });
    }

    logger.debug(this.context, `Applied ${records.length} changes for ${entity}`);
  }

  /**
   * Queue operation for sync
   */
  async queueOperation(
    entity: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    version?: number,
    offlineId?: string
  ) {
    await db.syncQueue.add({
      entity,
      operation,
      data,
      version,
      offlineId,
      createdAt: new Date(),
      retryCount: 0,
    });
    
    logger.debug(this.context, `Queued ${operation} operation for ${entity}`);
  }

  /**
   * Get sync queue size
   */
  async getQueueSize(): Promise<number> {
    return await db.syncQueue.count();
  }

  /**
   * Clear sync queue (use with caution)
   */
  async clearQueue() {
    logger.warn(this.context, 'Clearing sync queue');
    await db.syncQueue.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Auto-enable sync on module load
syncManager.enableAutoSync();
