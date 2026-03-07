import { apiClient } from './client';
import { offlineStorage } from '../storage/offlineStorage';
import { syncService } from '../sync/syncService';
import { networkStatusService } from '../network/networkStatus';

/**
 * Offline-aware API client wrapper
 * Automatically falls back to local storage when offline
 */
class OfflineApiClient {
  // GET requests - read from cache when offline
  async get<T>(url: string, useCache: boolean = true): Promise<T> {
    const isOnline = networkStatusService.getStatus();

    if (isOnline) {
      try {
        const response = await apiClient.get(url);

        // Cache the response for offline use
        if (useCache) {
          await this.cacheResponse(url, response.data);
        }

        return response.data;
      } catch (error) {
        // If request fails, try to use cached data
        if (useCache) {
          const cached = await this.getCachedResponse(url);
          if (cached) {
            console.log('Using cached data due to request failure');
            return cached;
          }
        }
        throw error;
      }
    } else {
      // Offline - use cached data
      if (useCache) {
        const cached = await this.getCachedResponse(url);
        if (cached) {
          return cached;
        }
      }
      throw new Error('No cached data available for offline use');
    }
  }

  // POST requests - queue when offline
  async post<T>(url: string, data: any, entity?: 'product' | 'inventory' | 'order'): Promise<T> {
    const isOnline = networkStatusService.getStatus();

    if (isOnline) {
      const response = await apiClient.post(url, data);
      return response.data;
    } else {
      // Queue for sync when back online
      if (entity) {
        await syncService.queueChange('create', entity, data);
      }

      // Return optimistic response
      return {
        success: true,
        message: 'Queued for sync when online',
        data: { ...data, id: `temp_${Date.now()}` },
      } as T;
    }
  }

  // PUT requests - queue when offline
  async put<T>(url: string, data: any, entity?: 'product' | 'inventory' | 'order'): Promise<T> {
    const isOnline = networkStatusService.getStatus();

    if (isOnline) {
      const response = await apiClient.put(url, data);
      return response.data;
    } else {
      // Queue for sync when back online
      if (entity) {
        await syncService.queueChange('update', entity, data);
      }

      // Return optimistic response
      return {
        success: true,
        message: 'Queued for sync when online',
        data,
      } as T;
    }
  }

  // DELETE requests - queue when offline
  async delete<T>(url: string, id: string, entity?: 'product' | 'inventory' | 'order'): Promise<T> {
    const isOnline = networkStatusService.getStatus();

    if (isOnline) {
      const response = await apiClient.delete(url);
      return response.data;
    } else {
      // Queue for sync when back online
      if (entity) {
        await syncService.queueChange('delete', entity, { id });
      }

      // Return optimistic response
      return {
        success: true,
        message: 'Queued for sync when online',
      } as T;
    }
  }

  private async cacheResponse(url: string, data: any): Promise<void> {
    try {
      // Determine which cache to use based on URL
      if (url.includes('/products')) {
        if (Array.isArray(data.data)) {
          await offlineStorage.saveProducts(data.data);
        }
      } else if (url.includes('/inventory')) {
        if (Array.isArray(data.data)) {
          await offlineStorage.saveInventory(data.data);
        }
      } else if (url.includes('/orders')) {
        if (Array.isArray(data.data)) {
          await offlineStorage.saveOrders(data.data);
        }
      }
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  private async getCachedResponse(url: string): Promise<any> {
    try {
      // Determine which cache to use based on URL
      if (url.includes('/products')) {
        const products = await offlineStorage.getProducts();
        return { success: true, data: products };
      } else if (url.includes('/inventory')) {
        const inventory = await offlineStorage.getInventory();
        return { success: true, data: inventory };
      } else if (url.includes('/orders')) {
        const orders = await offlineStorage.getOrders();
        return { success: true, data: orders };
      }
      return null;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }
}

export const offlineApiClient = new OfflineApiClient();
