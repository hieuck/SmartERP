import api from './api';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateInventoryDto {
  productId: string;
  warehouseId: string;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface UpdateInventoryDto {
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface StockMovementDto {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reference?: string;
  notes?: string;
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  warehouseId?: string;
  lowStock?: boolean;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  minQuantity: number;
}

export const inventoryServiceNew = {
  getAll: async (params: InventoryQueryParams) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Inventory> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: CreateInventoryDto): Promise<Inventory> => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInventoryDto): Promise<Inventory> => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  getLowStock: async (): Promise<LowStockItem[]> => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  getByProduct: async (productId: string): Promise<Inventory[]> => {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  getByWarehouse: async (warehouseId: string): Promise<Inventory[]> => {
    const response = await api.get(`/inventory/warehouse/${warehouseId}`);
    return response.data;
  },

  // Stock Movements
  createMovement: async (data: StockMovementDto): Promise<StockMovement> => {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  },

  getMovements: async (params: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    type?: StockMovementType;
  }) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  // Stock Operations
  stockIn: async (
    productId: string,
    warehouseId: string,
    quantity: number,
    reference?: string,
    notes?: string,
  ): Promise<StockMovement> => {
    const response = await api.post('/inventory/stock-in', {
      productId,
      warehouseId,
      quantity,
      reference,
      notes,
    });
    return response.data;
  },

  stockOut: async (
    productId: string,
    warehouseId: string,
    quantity: number,
    reference?: string,
    notes?: string,
  ): Promise<StockMovement> => {
    const response = await api.post('/inventory/stock-out', {
      productId,
      warehouseId,
      quantity,
      reference,
      notes,
    });
    return response.data;
  },

  transfer: async (
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    notes?: string,
  ): Promise<StockMovement> => {
    const response = await api.post('/inventory/transfer', {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes,
    });
    return response.data;
  },

  adjust: async (
    productId: string,
    warehouseId: string,
    quantity: number,
    reason: string,
  ): Promise<StockMovement> => {
    const response = await api.post('/inventory/adjust', {
      productId,
      warehouseId,
      quantity,
      reason,
    });
    return response.data;
  },
};

export default inventoryServiceNew;
