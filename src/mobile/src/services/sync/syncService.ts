import { apiClient } from '../api/client';
import { offlineStorage, PendingSyncItem } from '../storage/offlineStorage';
import { networkStatusService } from '../network/networkStatus';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncService {
  private isSyncing: boolean = false;
  private syncListeners: Array<(result: SyncResult) => void> = [];

  constructor() {
    // Auto-sync when network comes back online
    networkStatusService.addListener((isOnline) => {
      if (isOnline && !this.isSyncing) {
        this.syncAll();
      }
    });
  }

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    if (!networkStatusService.getStatus()) {
      console.log('Cannot sync: offline');
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Sync pending changes first
      await this.syncPendingChanges(result);

      // Then pull latest data from server
      await this.pullDataFromServer();

      // Update last sync timestamp
      await offlineStorage.setLastSync(Date.now());

      // Notify listeners
      this.notifySyncListeners(result);
    } catch (error) {
      console.error('Sync error:', error);
      result.success = false;
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncPendingChanges(result: SyncResult): Promise<void> {
    const pendingItems = await offlineStorage.getPendingSync();

    for (const item of pendingItems) {
      try {
        await this.syncItem(item);
        await offlineStorage.removePendingSync(item.id);
        result.synced++;
      } catch (error: any) {
        console.error(`Failed to sync item ${item.id}:`, error);
        result.failed++;
        result.errors.push({
          id: item.id,
          error: error.message || 'Unknown error',
        });
      }
    }
  }

  private async syncItem(item: PendingSyncItem): Promise<void> {
    const endpoint = this.getEndpoint(item.entity);

    switch (item.type) {
      case 'create':
        await apiClient.post(endpoint, item.data);
        break;
      case 'update':
        await apiClient.put(`${endpoint}/${item.data.id}`, item.data);
        break;
      case 'delete':
        await apiClient.delete(`${endpoint}/${item.data.id}`);
        break;
    }
  }

  private async pullDataFromServer(): Promise<void> {
    try {
      // Fetch products
      const productsResponse = await apiClient.get('/api/v1/products');
      if (productsResponse.data?.data) {
        await offlineStorage.saveProducts(productsResponse.data.data);
      }

      // Fetch inventory
      const inventoryResponse = await apiClient.get('/api/v1/inventory/stock');
      if (inventoryResponse.data?.data) {
        await offlineStorage.saveInventory(inventoryResponse.data.data);
      }

      // Fetch orders
      const ordersResponse = await apiClient.get('/api/v1/orders/sales');
      if (ordersResponse.data?.data) {
        await offlineStorage.saveOrders(ordersResponse.data.data);
      }
    } catch (error) {
      console.error('Error pulling data from server:', error);
      throw error;
    }
  }

  private getEndpoint(entity: string): string {
    switch (entity) {
      case 'product':
        return '/api/v1/products';
      case 'inventory':
        return '/api/v1/inventory/stock';
      case 'order':
        return '/api/v1/orders/sales';
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
  }

  async queueChange(
    type: 'create' | 'update' | 'delete',
    entity: 'product' | 'inventory' | 'order',
    data: any,
  ): Promise<void> {
    const item: PendingSyncItem = {
      id: `${entity}_${type}_${Date.now()}_${Math.random()}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
    };

    await offlineStorage.addPendingSync(item);

    // Try to sync immediately if online
    if (networkStatusService.getStatus() && !this.isSyncing) {
      this.syncAll();
    }
  }

  addSyncListener(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getPendingSyncCount(): Promise<number> {
    const pending = await offlineStorage.getPendingSync();
    return pending.length;
  }
}

export const syncService = new SyncService();
