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
   * Full sync: pull then push
   */
  async sync(token: string): Promise<SyncResult> {
    if (this.syncing) {
      throw new Error('Sync already in progress');
    }

    this.syncing = true;
    const result: SyncResult = {
      success: true,
      pulled: 0,
      pushed: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Pull changes from server
      const pullResult = await this.pull(token);
      result.pulled = pullResult.count;

      // Push local changes
      const pushResult = await this.push(token);
      result.pushed = pushResult.applied;
      result.conflicts = pushResult.conflicts.length;

      this.lastSyncTime = new Date();
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    } finally {
      this.syncing = false;
    }

    return result;
  }

  /**
   * Pull changes from server
   */
  private async pull(token: string) {
    const since = this.lastSyncTime?.toISOString();
    
    const response = await axios.post(
      `${API_BASE_URL}/api/sync/pull`,
      { since, entities: ['users'] },
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
      // Add more entities as needed
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
