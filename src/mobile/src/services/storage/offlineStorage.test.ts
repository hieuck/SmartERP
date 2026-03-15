import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage, PendingSyncItem } from './offlineStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('OfflineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear AsyncStorage mock storage
    (AsyncStorage as any).__clearStorage();
  });

  describe('Generic Storage Methods', () => {
    it('should set item', async () => {
      await offlineStorage.setItem('test_key', { value: 'test' });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test_key',
        JSON.stringify({ value: 'test' })
      );
    });

    it('should get item', async () => {
      const testData = { value: 'test' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(testData));

      const result = await offlineStorage.getItem('test_key');

      expect(result).toEqual(testData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null for non-existent item', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getItem('non_existent');

      expect(result).toBeNull();
    });

    it('should remove item', async () => {
      await offlineStorage.removeItem('test_key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should handle JSON parse errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await offlineStorage.getItem('test_key');

      expect(result).toBeNull();
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      await expect(offlineStorage.setItem('test_key', { value: 'test' })).rejects.toThrow(
        'Storage full'
      );
    });
  });

  describe('Products', () => {
    it('should save products', async () => {
      const products = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      await offlineStorage.saveProducts(products);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_products',
        JSON.stringify(products)
      );
    });

    it('should get products', async () => {
      const products = [{ id: '1', name: 'Product 1' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(products));

      const result = await offlineStorage.getProducts();

      expect(result).toEqual(products);
    });

    it('should return empty array when no products', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getProducts();

      expect(result).toEqual([]);
    });
  });

  describe('Inventory', () => {
    it('should save inventory', async () => {
      const inventory = [
        { id: '1', productId: 'p1', quantity: 10 },
        { id: '2', productId: 'p2', quantity: 20 },
      ];

      await offlineStorage.saveInventory(inventory);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_inventory',
        JSON.stringify(inventory)
      );
    });

    it('should get inventory', async () => {
      const inventory = [{ id: '1', quantity: 10 }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(inventory));

      const result = await offlineStorage.getInventory();

      expect(result).toEqual(inventory);
    });

    it('should return empty array when no inventory', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getInventory();

      expect(result).toEqual([]);
    });
  });

  describe('Orders', () => {
    it('should save orders', async () => {
      const orders = [
        { id: '1', customerId: 'c1', total: 100 },
        { id: '2', customerId: 'c2', total: 200 },
      ];

      await offlineStorage.saveOrders(orders);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_orders',
        JSON.stringify(orders)
      );
    });

    it('should get orders', async () => {
      const orders = [{ id: '1', total: 100 }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(orders));

      const result = await offlineStorage.getOrders();

      expect(result).toEqual(orders);
    });

    it('should return empty array when no orders', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getOrders();

      expect(result).toEqual([]);
    });
  });

  describe('Pending Sync Queue', () => {
    it('should add pending sync item', async () => {
      const item: PendingSyncItem = {
        id: 'item1',
        type: 'create',
        entity: 'product',
        data: { name: 'Product' },
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await offlineStorage.addPendingSync(item);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pending_sync',
        JSON.stringify([item])
      );
    });

    it('should append to existing pending sync queue', async () => {
      const existingItem: PendingSyncItem = {
        id: 'item1',
        type: 'create',
        entity: 'product',
        data: { name: 'Product 1' },
        timestamp: Date.now(),
      };

      const newItem: PendingSyncItem = {
        id: 'item2',
        type: 'update',
        entity: 'product',
        data: { name: 'Product 2' },
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([existingItem])
      );

      await offlineStorage.addPendingSync(newItem);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pending_sync',
        JSON.stringify([existingItem, newItem])
      );
    });

    it('should get pending sync items', async () => {
      const items: PendingSyncItem[] = [
        { id: 'item1', type: 'create', entity: 'product', data: {}, timestamp: Date.now() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(items));

      const result = await offlineStorage.getPendingSync();

      expect(result).toEqual(items);
    });

    it('should return empty array when no pending sync', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getPendingSync();

      expect(result).toEqual([]);
    });

    it('should remove pending sync item', async () => {
      const items: PendingSyncItem[] = [
        { id: 'item1', type: 'create', entity: 'product', data: {}, timestamp: Date.now() },
        { id: 'item2', type: 'update', entity: 'product', data: {}, timestamp: Date.now() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(items));

      await offlineStorage.removePendingSync('item1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pending_sync',
        JSON.stringify([items[1]])
      );
    });

    it('should clear pending sync queue', async () => {
      await offlineStorage.clearPendingSync();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pending_sync', JSON.stringify([]));
    });
  });

  describe('Last Sync Timestamp', () => {
    it('should set last sync timestamp', async () => {
      const timestamp = Date.now();

      await offlineStorage.setLastSync(timestamp);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@last_sync',
        JSON.stringify(timestamp)
      );
    });

    it('should get last sync timestamp', async () => {
      const timestamp = 1234567890;
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(timestamp));

      const result = await offlineStorage.getLastSync();

      expect(result).toBe(timestamp);
    });

    it('should return null when no last sync', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getLastSync();

      expect(result).toBeNull();
    });
  });

  describe('Offline Mode Flag', () => {
    it('should set offline mode', async () => {
      await offlineStorage.setOfflineMode(true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_mode',
        JSON.stringify(true)
      );
    });

    it('should get offline mode', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(true));

      const result = await offlineStorage.getOfflineMode();

      expect(result).toBe(true);
    });

    it('should return false when no offline mode set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineStorage.getOfflineMode();

      expect(result).toBe(false);
    });
  });

  describe('Clear All', () => {
    it('should clear all offline data', async () => {
      await offlineStorage.clearAll();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@offline_products',
        '@offline_inventory',
        '@offline_orders',
        '@pending_sync',
        '@last_sync',
        '@offline_mode',
      ]);
    });

    it('should handle clear errors', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(
        new Error('Clear failed')
      );

      await expect(offlineStorage.clearAll()).rejects.toThrow('Clear failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent operations', async () => {
      const products = [{ id: '1', name: 'Product' }];
      const inventory = [{ id: '1', quantity: 10 }];
      const orders = [{ id: '1', total: 100 }];

      await Promise.all([
        offlineStorage.saveProducts(products),
        offlineStorage.saveInventory(inventory),
        offlineStorage.saveOrders(orders),
      ]);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle large data sets', async () => {
      const largeProducts = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
        price: i * 100,
      }));

      await offlineStorage.saveProducts(largeProducts);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle special characters in data', async () => {
      const products = [
        { id: '1', name: 'Product with "quotes"', description: "Line1\nLine2" },
      ];

      await offlineStorage.saveProducts(products);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
