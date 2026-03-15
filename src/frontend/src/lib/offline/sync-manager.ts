import { db, SyncStatus } from './db';
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
  private syncing = false;
  private lastSyncTime: Date | null = null;
  private autoSyncEnabled = true;
  private retryCount = 0;
  private maxRetries = 5;
  private baseRetryDelay = 1000; // 1 second
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
          console.log('[AutoSync] Network detected, starting sync...');
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
          console.log(`[Sync] Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Sync failed after max retries');
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
    console.log('[Sync] Paused due to network loss');
  }

  /**
   * Resume sync (called when network restored)
   * Requirement 1.4: IF network lost during sync, pause and resume
   */
  async resumeSync(token: string) {
    if (this.syncPaused) {
      this.syncPaused = false;
      console.log('[Sync] Resuming...');
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
      throw new Error('Offline storage unavailable. Please use a modern browser.');
    }

    this.syncing = true;
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

      // Check if paused after pull
      if (this.syncPaused) {
        throw new Error('Sync paused during pull operation');
      }

      // Push local changes
      const pushResult = await this.push(token);
      result.pushed = pushResult.applied;
      result.conflicts = pushResult.conflicts.length;

      this.lastSyncTime = new Date();
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
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      retryCount: this.retryCount,
    };
    
    console.error('[Sync Error]', errorLog);
    
    // Store error in IndexedDB for admin review
    try {
      const errors = JSON.parse(localStorage.getItem('sync_errors') || '[]');
      errors.push(errorLog);
      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.shift();
      }
      localStorage.setItem('sync_errors', JSON.stringify(errors));
    } catch (e) {
      console.error('[Sync Error] Failed to store error log', e);
    }
  }

  /**
   * Pull changes from server
   */
  private async pull(token: string) {
    const since = this.lastSyncTime?.toISOString();
    
    const response = await axios.post(
      `${API_BASE_URL}/api/sync/pull`,
      { 
        since, 
        entities: ['users', 'products', 'customers', 'suppliers', 'salesOrders', 'invoices']
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
      return { applied: 0, conflicts: [] };
    }

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
   * Apply changes to local database
   */
  private async applyChanges(entity: string, records: any[]) {
    switch (entity) {
      case 'users':
        for (const record of records) {
          await db.users.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      case 'products':
        for (const record of records) {
          await db.products.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      case 'customers':
        for (const record of records) {
          await db.customers.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      case 'suppliers':
        for (const record of records) {
          await db.suppliers.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      case 'salesOrders':
        for (const record of records) {
          await db.salesOrders.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      case 'invoices':
        for (const record of records) {
          await db.invoices.put({
            ...record,
            syncStatus: SyncStatus.SYNCED,
            lastSyncedAt: new Date(),
          });
        }
        break;

      default:
        console.warn(`[Sync] Unknown entity: ${entity}`);
    }
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
    await db.syncQueue.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Auto-enable sync on module load
syncManager.enableAutoSync();
