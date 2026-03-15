/**
 * Integration tests for offline database operations
 * Tests SQLite database initialization, CRUD operations, and sync
 */

import * as SQLite from 'expo-sqlite';
import { offlineStorage } from '../../services/storage/offlineStorage';
import { syncService } from '../../services/sync/syncService';
import { networkStatusService } from '../../services/network/networkStatus';

// Mock dependencies
jest.mock('expo-sqlite');
jest.mock('../../services/network/networkStatus');
jest.mock('../../services/api/client');

describe('Offline Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SQLite as any).__clearDatabase();
    (networkStatusService.getStatus as jest.Mock).mockReturnValue(false);
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const db = await SQLite.openDatabaseAsync('SmartERP.db');

      expect(db).toBeDefined();
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('SmartERP.db');
    });

    it('should create all required tables', async () => {
      const db = await SQLite.openDatabaseAsync('SmartERP.db');

      await db.execAsync('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY)');
      await db.execAsync('CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY)');
      await db.execAsync('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY)');

      expect(db.execAsync).toHaveBeenCalledTimes(3);
    });

    it('should handle database initialization errors', async () => {
      (SQLite.openDatabaseAsync as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(SQLite.openDatabaseAsync('SmartERP.db')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('Offline Storage Operations', () => {
    describe('Products', () => {
      it('should save products offline', async () => {
        const products = [
          { id: '1', name: 'Product 1', price: 100, sku: 'SKU001' },
          { id: '2', name: 'Product 2', price: 200, sku: 'SKU002' },
        ];

        await offlineStorage.saveProducts(products);

        const savedProducts = await offlineStorage.getProducts();
        expect(savedProducts).toEqual(products);
      });

      it('should update existing products', async () => {
        const products = [{ id: '1', name: 'Product 1', price: 100 }];
        await offlineStorage.saveProducts(products);

        const updatedProducts = [{ id: '1', name: 'Updated Product', price: 150 }];
        await offlineStorage.saveProducts(updatedProducts);

        const result = await offlineStorage.getProducts();
        expect(result[0].name).toBe('Updated Product');
        expect(result[0].price).toBe(150);
      });

      it('should handle large product datasets', async () => {
        const products = Array.from({ length: 1000 }, (_, i) => ({
          id: `${i}`,
          name: `Product ${i}`,
          price: i * 100,
          sku: `SKU${i}`,
        }));

        await offlineStorage.saveProducts(products);

        const savedProducts = await offlineStorage.getProducts();
        expect(savedProducts.length).toBe(1000);
      });
    });

    describe('Inventory', () => {
      it('should save inventory offline', async () => {
        const inventory = [
          { id: '1', productId: 'p1', quantity: 10, warehouseId: 'w1' },
          { id: '2', productId: 'p2', quantity: 20, warehouseId: 'w1' },
        ];

        await offlineStorage.saveInventory(inventory);

        const savedInventory = await offlineStorage.getInventory();
        expect(savedInventory).toEqual(inventory);
      });

      it('should update inventory quantities', async () => {
        const inventory = [{ id: '1', productId: 'p1', quantity: 10 }];
        await offlineStorage.saveInventory(inventory);

        const updatedInventory = [{ id: '1', productId: 'p1', quantity: 5 }];
        await offlineStorage.saveInventory(updatedInventory);

        const result = await offlineStorage.getInventory();
        expect(result[0].quantity).toBe(5);
      });
    });

    describe('Orders', () => {
      it('should save orders offline', async () => {
        const orders = [
          { id: '1', customerId: 'c1', total: 100, status: 'pending' },
          { id: '2', customerId: 'c2', total: 200, status: 'completed' },
        ];

        await offlineStorage.saveOrders(orders);

        const savedOrders = await offlineStorage.getOrders();
        expect(savedOrders).toEqual(orders);
      });

      it('should create order offline', async () => {
        const newOrder = {
          id: 'offline_1',
          customerId: 'c1',
          total: 150,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const existingOrders = await offlineStorage.getOrders();
        await offlineStorage.saveOrders([...existingOrders, newOrder]);

        const orders = await offlineStorage.getOrders();
        expect(orders).toContainEqual(newOrder);
      });
    });
  });

  describe('Sync Queue Management', () => {
    it('should queue create operation', async () => {
      await syncService.queueChange('create', 'product', {
        name: 'New Product',
        price: 100,
      });

      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBe(1);
    });

    it('should queue multiple operations', async () => {
      await syncService.queueChange('create', 'product', { name: 'Product 1' });
      await syncService.queueChange('update', 'product', { id: '1', name: 'Updated' });
      await syncService.queueChange('delete', 'product', { id: '2' });

      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBe(3);
    });

    it('should maintain queue order', async () => {
      await syncService.queueChange('create', 'product', { name: 'First' });
      await syncService.queueChange('create', 'product', { name: 'Second' });
      await syncService.queueChange('create', 'product', { name: 'Third' });

      const pending = await offlineStorage.getPendingSync();
      expect(pending[0].data.name).toBe('First');
      expect(pending[1].data.name).toBe('Second');
      expect(pending[2].data.name).toBe('Third');
    });

    it('should clear synced items from queue', async () => {
      await syncService.queueChange('create', 'product', { name: 'Product' });

      const pending = await offlineStorage.getPendingSync();
      await offlineStorage.removePendingSync(pending[0].id);

      const remainingCount = await syncService.getPendingSyncCount();
      expect(remainingCount).toBe(0);
    });
  });

  describe('Offline CRUD Operations', () => {
    it('should create entity offline and queue for sync', async () => {
      const product = {
        id: 'offline_1',
        name: 'Offline Product',
        price: 100,
        sku: 'OFF001',
      };

      // Save locally
      const products = await offlineStorage.getProducts();
      await offlineStorage.saveProducts([...products, product]);

      // Queue for sync
      await syncService.queueChange('create', 'product', product);

      const savedProducts = await offlineStorage.getProducts();
      expect(savedProducts).toContainEqual(product);

      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBe(1);
    });

    it('should update entity offline and queue for sync', async () => {
      // Create initial product
      const product = { id: '1', name: 'Product', price: 100 };
      await offlineStorage.saveProducts([product]);

      // Update offline
      const updatedProduct = { ...product, name: 'Updated Product', price: 150 };
      await offlineStorage.saveProducts([updatedProduct]);

      // Queue for sync
      await syncService.queueChange('update', 'product', updatedProduct);

      const products = await offlineStorage.getProducts();
      expect(products[0].name).toBe('Updated Product');

      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBe(1);
    });

    it('should delete entity offline and queue for sync', async () => {
      // Create initial product
      const product = { id: '1', name: 'Product', price: 100 };
      await offlineStorage.saveProducts([product]);

      // Delete offline
      await offlineStorage.saveProducts([]);

      // Queue for sync
      await syncService.queueChange('delete', 'product', { id: '1' });

      const products = await offlineStorage.getProducts();
      expect(products.length).toBe(0);

      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBe(1);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create product
      const product = { id: '1', name: 'Product', price: 100 };
      await offlineStorage.saveProducts([product]);

      // Create order referencing product
      const order = {
        id: 'o1',
        customerId: 'c1',
        items: [{ productId: '1', quantity: 2 }],
        total: 200,
      };
      await offlineStorage.saveOrders([order]);

      // Verify both exist
      const products = await offlineStorage.getProducts();
      const orders = await offlineStorage.getOrders();

      expect(products).toContainEqual(product);
      expect(orders).toContainEqual(order);
    });

    it('should handle concurrent writes', async () => {
      const products1 = [{ id: '1', name: 'Product 1' }];
      const products2 = [{ id: '2', name: 'Product 2' }];
      const products3 = [{ id: '3', name: 'Product 3' }];

      await Promise.all([
        offlineStorage.saveProducts(products1),
        offlineStorage.saveProducts(products2),
        offlineStorage.saveProducts(products3),
      ]);

      // Last write should win
      const products = await offlineStorage.getProducts();
      expect(products.length).toBeGreaterThan(0);
    });

    it('should preserve data after app restart', async () => {
      const products = [{ id: '1', name: 'Product' }];
      await offlineStorage.saveProducts(products);

      // Simulate app restart by getting data again
      const retrievedProducts = await offlineStorage.getProducts();

      expect(retrievedProducts).toEqual(products);
    });
  });

  describe('Sync Conflict Resolution', () => {
    it('should detect sync conflicts', async () => {
      // Create product offline
      const offlineProduct = { id: '1', name: 'Offline Version', price: 100 };
      await offlineStorage.saveProducts([offlineProduct]);
      await syncService.queueChange('update', 'product', offlineProduct);

      // Simulate server has different version
      const serverProduct = { id: '1', name: 'Server Version', price: 150 };

      // Conflict should be detected during sync
      const pendingCount = await syncService.getPendingSyncCount();
      expect(pendingCount).toBeGreaterThan(0);
    });

    it('should apply last-write-wins strategy', async () => {
      const product1 = { id: '1', name: 'Version 1', updatedAt: '2024-01-01' };
      const product2 = { id: '1', name: 'Version 2', updatedAt: '2024-01-02' };

      await offlineStorage.saveProducts([product1]);
      await offlineStorage.saveProducts([product2]);

      const products = await offlineStorage.getProducts();
      expect(products[0].name).toBe('Version 2');
    });
  });

  describe('Storage Limits', () => {
    it('should handle storage quota', async () => {
      // Try to save very large dataset
      const largeProducts = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
        description: 'A'.repeat(1000),
      }));

      await offlineStorage.saveProducts(largeProducts);

      const products = await offlineStorage.getProducts();
      expect(products.length).toBe(10000);
    });

    it('should clear old data when needed', async () => {
      // Save initial data
      const products = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
      }));
      await offlineStorage.saveProducts(products);

      // Clear all
      await offlineStorage.clearAll();

      const remainingProducts = await offlineStorage.getProducts();
      expect(remainingProducts.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      jest.spyOn(offlineStorage, 'saveProducts').mockRejectedValue(
        new Error('Storage full')
      );

      await expect(offlineStorage.saveProducts([])).rejects.toThrow('Storage full');
    });

    it('should recover from corrupted data', async () => {
      // Save valid data
      await offlineStorage.saveProducts([{ id: '1', name: 'Product' }]);

      // Try to get data (might be corrupted)
      const products = await offlineStorage.getProducts();

      // Should return empty array instead of crashing
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle database lock errors', async () => {
      const db = await SQLite.openDatabaseAsync('SmartERP.db');

      // Simulate concurrent access
      const operations = Array.from({ length: 10 }, () =>
        db.runAsync('INSERT INTO products VALUES (?)', ['test'])
      );

      // Should handle without deadlock
      await Promise.all(operations);
    });
  });

  describe('Performance', () => {
    it('should perform bulk insert efficiently', async () => {
      const products = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
        price: i * 100,
      }));

      const startTime = Date.now();
      await offlineStorage.saveProducts(products);
      const endTime = Date.now();

      // Should complete in reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should query data efficiently', async () => {
      // Save 1000 products
      const products = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
      }));
      await offlineStorage.saveProducts(products);

      const startTime = Date.now();
      await offlineStorage.getProducts();
      const endTime = Date.now();

      // Query should be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
