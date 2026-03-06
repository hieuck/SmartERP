/**
 * Warehouse Service
 * Handles API calls for multi-warehouse management
 * Requirements: 27.1, 27.3, 27.4
 */

import api from './api';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  id: string;
  code: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: string;
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';
  items: StockTransferItem[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  notes?: string;
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

class WarehouseService {
  // Warehouse CRUD
  async getWarehouses(params?: { status?: string; search?: string }) {
    const response = await api.get('/api/v1/inventory/warehouses', { params });
    return response.data;
  }

  async getWarehouse(id: string) {
    const response = await api.get(`/api/v1/inventory/warehouses/${id}`);
    return response.data;
  }

  async createWarehouse(data: Partial<Warehouse>) {
    const response = await api.post('/api/v1/inventory/warehouses', data);
    return response.data;
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>) {
    const response = await api.put(`/api/v1/inventory/warehouses/${id}`, data);
    return response.data;
  }

  async deleteWarehouse(id: string) {
    const response = await api.delete(`/api/v1/inventory/warehouses/${id}`);
    return response.data;
  }

  // Stock by warehouse
  async getStockByWarehouse(
    warehouseId: string,
    params?: { search?: string; page?: number; limit?: number },
  ) {
    const response = await api.get(`/api/v1/inventory/warehouses/${warehouseId}/stock`, { params });
    return response.data;
  }

  async getConsolidatedStock(params?: { search?: string; page?: number; limit?: number }) {
    const response = await api.get('/api/v1/inventory/stock/consolidated', { params });
    return response.data;
  }

  // Stock transfers
  async getStockTransfers(params?: {
    status?: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/api/v1/inventory/transfers', { params });
    return response.data;
  }

  async getStockTransfer(id: string) {
    const response = await api.get(`/api/v1/inventory/transfers/${id}`);
    return response.data;
  }

  async createStockTransfer(data: Partial<StockTransfer>) {
    const response = await api.post('/api/v1/inventory/transfers', data);
    return response.data;
  }

  async updateStockTransfer(id: string, data: Partial<StockTransfer>) {
    const response = await api.put(`/api/v1/inventory/transfers/${id}`, data);
    return response.data;
  }

  async approveStockTransfer(id: string) {
    const response = await api.post(`/api/v1/inventory/transfers/${id}/approve`);
    return response.data;
  }

  async cancelStockTransfer(id: string) {
    const response = await api.post(`/api/v1/inventory/transfers/${id}/cancel`);
    return response.data;
  }

  // Warehouse reports
  async getWarehouseStockReport(
    warehouseId: string,
    params?: { startDate?: string; endDate?: string },
  ) {
    const response = await api.get(`/api/v1/reports/warehouses/${warehouseId}/stock`, { params });
    return response.data;
  }

  async getConsolidatedStockReport(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/api/v1/reports/warehouses/consolidated', { params });
    return response.data;
  }
}

export default new WarehouseService();
