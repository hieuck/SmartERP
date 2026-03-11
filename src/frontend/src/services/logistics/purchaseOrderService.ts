import api from './api';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Omit<PurchaseOrderItem, 'productName' | 'receivedQuantity' | 'total'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDto {
  orderDate?: string;
  expectedDeliveryDate?: string;
  items?: Omit<PurchaseOrderItem, 'productName' | 'receivedQuantity' | 'total'>[];
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface ReceiveItemsDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseOrderStatistics {
  totalOrders: number;
  totalAmount: number;
  byStatus: Record<PurchaseOrderStatus, number>;
}

export const purchaseOrderService = {
  getAll: async (params: PurchaseOrderQueryParams) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/purchase-orders/${id}`);
  },

  approve: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  receiveItems: async (id: string, data: ReceiveItemsDto): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/receive`, data);
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchase-orders/${id}/cancel`, { reason });
    return response.data;
  },

  getStatistics: async (): Promise<PurchaseOrderStatistics> => {
    const response = await api.get('/purchase-orders/statistics');
    return response.data;
  },
};

export default purchaseOrderService;
