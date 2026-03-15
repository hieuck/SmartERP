import { syncService, SyncResult } from './syncService';
import { apiClient } from '../api/client';
import { offlineStorage, PendingSyncItem } from '../storage/offlineStorage';
import { networkStatusService } from '../network/networkStatus';

// Mock dependencies
jest.mock('../api/client');
jest.mock('../storage/offlineStorage');
jest.mock('../network/networkStatus');

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    (networkStatusService.getStatus as jest.Mock).mockReturnValue(true);
    (networkStatusService.addListener as jest.Mock).mockReturnValue(jest.fn());
    (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([]);
    (offlineStorage.removePendingSync as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.addPendingSync as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.setLastSync as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.saveProducts as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.saveInventory as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.saveOrders as jest.Mock).mockResolvedValue(undefined);

    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });
  });

  describe('syncAll', () => {
    it('should sync successfully when online', async () => {
      const result = await syncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should not sync when already syncing', async () => {
      // Start first sync
      const firstSync = syncService.syncAll();

      // Try to start second sync
      const secondSync = await syncService.syncAll();

      expect(secondSync.success).toBe(false);
      expect(secondSync.synced).toBe(0);

      await firstSync;
    });

    it('should not sync when offline', async () => {
      (networkStatusService.getStatus as jest.Mock).mockReturnValue(false);

      const result = await syncService.syncAll();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should sync pending changes', async () => {
      const pendingItems: PendingSyncItem[] = [
        {
          id: 'item1',
          type: 'create',
          entity: 'product',
          data: { name: 'Product 1', price: 100 },
          timestamp: Date.now(),
        },
        {
          id: 'item2',
          type: 'update',
          entity: 'product',
          data: { id: '123', name: 'Product 2', price: 200 },
          timestamp: Date.now(),
        },
      ];

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue(pendingItems);

      const result = await syncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products', pendingItems[0].data);
      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/v1/products/123',
        pendingItems[1].data
      );
      expect(offlineStorage.removePendingSync).toHaveBeenCalledTimes(2);
    });

    it('should handle sync errors for individual items', async () => {
      const pendingItems: PendingSyncItem[] = [
        {
          id: 'item1',
          type: 'create',
          entity: 'product',
          data: { name: 'Product 1' },
          timestamp: Date.now(),
        },
        {
          id: 'item2',
          type: 'create',
          entity: 'product',
          data: { name: 'Product 2' },
          timestamp: Date.now(),
        },
      ];

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue(pendingItems);
      (apiClient.post as jest.Mock)
        .mockResolvedValueOnce({ data: { success: true } })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await syncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Network error');
    });

    it('should pull data from server after syncing changes', async () => {
      const mockProducts = [{ id: '1', name: 'Product 1' }];
      const mockInventory = [{ id: '1', quantity: 10 }];
      const mockOrders = [{ id: '1', total: 100 }];

      (apiClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { data: mockProducts } })
        .mockResolvedValueOnce({ data: { data: mockInventory } })
        .mockResolvedValueOnce({ data: { data: mockOrders } });

      await syncService.syncAll();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/inventory/stock');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/orders/sales');
      expect(offlineStorage.saveProducts).toHaveBeenCalledWith(mockProducts);
      expect(offlineStorage.saveInventory).toHaveBeenCalledWith(mockInventory);
      expect(offlineStorage.saveOrders).toHaveBeenCalledWith(mockOrders);
    });

    it('should update last sync timestamp', async () => {
      await syncService.syncAll();

      expect(offlineStorage.setLastSync).toHaveBeenCalled();
    });

    it('should notify sync listeners', async () => {
      const listener = jest.fn();
      syncService.addSyncListener(listener);

      await syncService.syncAll();

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          synced: expect.any(Number),
          failed: expect.any(Number),
          errors: expect.any(Array),
        })
      );
    });

    it('should handle pull data errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Server error'));

      const result = await syncService.syncAll();

      expect(result.success).toBe(false);
    });
  });

  describe('queueChange', () => {
    it('should queue create operation', async () => {
      const data = { name: 'New Product', price: 100 };

      await syncService.queueChange('create', 'product', data);

      expect(offlineStorage.addPendingSync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create',
          entity: 'product',
          data,
        })
      );
    });

    it('should queue update operation', async () => {
      const data = { id: '123', name: 'Updated Product', price: 150 };

      await syncService.queueChange('update', 'product', data);

      expect(offlineStorage.addPendingSync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          entity: 'product',
          data,
        })
      );
    });

    it('should queue delete operation', async () => {
      const data = { id: '123' };

      await syncService.queueChange('delete', 'product', data);

      expect(offlineStorage.addPendingSync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delete',
          entity: 'product',
          data,
        })
      );
    });

    it('should generate unique IDs for queued items', async () => {
      const data = { name: 'Product' };

      await syncService.queueChange('create', 'product', data);
      await syncService.queueChange('create', 'product', data);

      const calls = (offlineStorage.addPendingSync as jest.Mock).mock.calls;
      expect(calls[0][0].id).not.toBe(calls[1][0].id);
    });

    it('should trigger immediate sync when online', async () => {
      (networkStatusService.getStatus as jest.Mock).mockReturnValue(true);

      const syncAllSpy = jest.spyOn(syncService, 'syncAll');

      await syncService.queueChange('create', 'product', { name: 'Product' });

      // Wait a bit for async sync to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(syncAllSpy).toHaveBeenCalled();
    });

    it('should not trigger immediate sync when offline', async () => {
      (networkStatusService.getStatus as jest.Mock).mockReturnValue(false);

      const syncAllSpy = jest.spyOn(syncService, 'syncAll');

      await syncService.queueChange('create', 'product', { name: 'Product' });

      expect(syncAllSpy).not.toHaveBeenCalled();
    });
  });

  describe('Sync Listeners', () => {
    it('should add sync listener', () => {
      const listener = jest.fn();
      const unsubscribe = syncService.addSyncListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove sync listener', async () => {
      const listener = jest.fn();
      const unsubscribe = syncService.addSyncListener(listener);

      unsubscribe();

      await syncService.syncAll();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      syncService.addSyncListener(listener1);
      syncService.addSyncListener(listener2);

      await syncService.syncAll();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      syncService.addSyncListener(errorListener);
      syncService.addSyncListener(normalListener);

      await syncService.syncAll();

      // Should not crash and should call other listeners
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('getPendingSyncCount', () => {
    it('should return pending sync count', async () => {
      const pendingItems: PendingSyncItem[] = [
        { id: '1', type: 'create', entity: 'product', data: {}, timestamp: Date.now() },
        { id: '2', type: 'update', entity: 'product', data: {}, timestamp: Date.now() },
        { id: '3', type: 'delete', entity: 'product', data: {}, timestamp: Date.now() },
      ];

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue(pendingItems);

      const count = await syncService.getPendingSyncCount();

      expect(count).toBe(3);
    });

    it('should return 0 when no pending items', async () => {
      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([]);

      const count = await syncService.getPendingSyncCount();

      expect(count).toBe(0);
    });
  });

  describe('isSyncInProgress', () => {
    it('should return false when not syncing', () => {
      expect(syncService.isSyncInProgress()).toBe(false);
    });

    it('should return true when syncing', async () => {
      const syncPromise = syncService.syncAll();

      expect(syncService.isSyncInProgress()).toBe(true);

      await syncPromise;

      expect(syncService.isSyncInProgress()).toBe(false);
    });
  });

  describe('Entity Endpoints', () => {
    it('should use correct endpoint for product entity', async () => {
      const item: PendingSyncItem = {
        id: 'item1',
        type: 'create',
        entity: 'product',
        data: { name: 'Product' },
        timestamp: Date.now(),
      };

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([item]);

      await syncService.syncAll();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/products', item.data);
    });

    it('should use correct endpoint for inventory entity', async () => {
      const item: PendingSyncItem = {
        id: 'item1',
        type: 'create',
        entity: 'inventory',
        data: { quantity: 10 },
        timestamp: Date.now(),
      };

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([item]);

      await syncService.syncAll();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/inventory/stock', item.data);
    });

    it('should use correct endpoint for order entity', async () => {
      const item: PendingSyncItem = {
        id: 'item1',
        type: 'create',
        entity: 'order',
        data: { total: 100 },
        timestamp: Date.now(),
      };

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([item]);

      await syncService.syncAll();

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/orders/sales', item.data);
    });
  });

  describe('Network Status Integration', () => {
    it('should auto-sync when network comes back online', () => {
      let networkListener: any;
      (networkStatusService.addListener as jest.Mock).mockImplementation((listener) => {
        networkListener = listener;
        return jest.fn();
      });

      // Re-import to trigger constructor
      jest.resetModules();
      require('./syncService');

      const syncAllSpy = jest.spyOn(syncService, 'syncAll');

      // Simulate network coming online
      networkListener(true);

      expect(syncAllSpy).toHaveBeenCalled();
    });

    it('should not auto-sync when going offline', () => {
      let networkListener: any;
      (networkStatusService.addListener as jest.Mock).mockImplementation((listener) => {
        networkListener = listener;
        return jest.fn();
      });

      const syncAllSpy = jest.spyOn(syncService, 'syncAll');

      // Simulate network going offline
      networkListener(false);

      expect(syncAllSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pending sync queue', async () => {
      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([]);

      const result = await syncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should handle delete operation correctly', async () => {
      const item: PendingSyncItem = {
        id: 'item1',
        type: 'delete',
        entity: 'product',
        data: { id: '123' },
        timestamp: Date.now(),
      };

      (offlineStorage.getPendingSync as jest.Mock).mockResolvedValue([item]);

      await syncService.syncAll();

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/products/123');
    });

    it('should handle concurrent sync attempts', async () => {
      const sync1 = syncService.syncAll();
      const sync2 = syncService.syncAll();
      const sync3 = syncService.syncAll();

      const results = await Promise.all([sync1, sync2, sync3]);

      // Only first sync should succeed
      expect(results.filter((r) => r.success).length).toBe(1);
      expect(results.filter((r) => !r.success).length).toBe(2);
    });
  });
});
