import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: '@offline_products',
  INVENTORY: '@offline_inventory',
  ORDERS: '@offline_orders',
  PENDING_SYNC: '@pending_sync',
  LAST_SYNC: '@last_sync',
  OFFLINE_MODE: '@offline_mode',
};

export interface PendingSyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'product' | 'inventory' | 'order';
  data: any;
  timestamp: number;
}

class OfflineStorage {
  // Generic storage methods
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // Products
  async saveProducts(products: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  async getProducts(): Promise<any[]> {
    return (await this.getItem<any[]>(STORAGE_KEYS.PRODUCTS)) || [];
  }

  // Inventory
  async saveInventory(inventory: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.INVENTORY, inventory);
  }

  async getInventory(): Promise<any[]> {
    return (await this.getItem<any[]>(STORAGE_KEYS.INVENTORY)) || [];
  }

  // Orders
  async saveOrders(orders: any[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  async getOrders(): Promise<any[]> {
    return (await this.getItem<any[]>(STORAGE_KEYS.ORDERS)) || [];
  }

  // Pending sync queue
  async addPendingSync(item: PendingSyncItem): Promise<void> {
    const queue = await this.getPendingSync();
    queue.push(item);
    await this.setItem(STORAGE_KEYS.PENDING_SYNC, queue);
  }

  async getPendingSync(): Promise<PendingSyncItem[]> {
    return (await this.getItem<PendingSyncItem[]>(STORAGE_KEYS.PENDING_SYNC)) || [];
  }

  async removePendingSync(id: string): Promise<void> {
    const queue = await this.getPendingSync();
    const filtered = queue.filter((item) => item.id !== id);
    await this.setItem(STORAGE_KEYS.PENDING_SYNC, filtered);
  }

  async clearPendingSync(): Promise<void> {
    await this.setItem(STORAGE_KEYS.PENDING_SYNC, []);
  }

  // Last sync timestamp
  async setLastSync(timestamp: number): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  async getLastSync(): Promise<number | null> {
    return await this.getItem<number>(STORAGE_KEYS.LAST_SYNC);
  }

  // Offline mode flag
  async setOfflineMode(isOffline: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.OFFLINE_MODE, isOffline);
  }

  async getOfflineMode(): Promise<boolean> {
    return (await this.getItem<boolean>(STORAGE_KEYS.OFFLINE_MODE)) || false;
  }

  // Clear all offline data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PRODUCTS,
      STORAGE_KEYS.INVENTORY,
      STORAGE_KEYS.ORDERS,
      STORAGE_KEYS.PENDING_SYNC,
      STORAGE_KEYS.LAST_SYNC,
      STORAGE_KEYS.OFFLINE_MODE,
    ]);
  }
}

export const offlineStorage = new OfflineStorage();
