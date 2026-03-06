import api from './api';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingFee: number;
  total: number;
  paidAmount: number;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  customerId: string;
  orderDate: string;
  items: Omit<OrderItem, 'productName' | 'total'>[];
  tax?: number;
  discount?: number;
  shippingFee?: number;
  shippingAddress?: string;
  notes?: string;
}

export interface UpdateOrderDto {
  orderDate?: string;
  items?: Omit<OrderItem, 'productName' | 'total'>[];
  tax?: number;
  discount?: number;
  shippingFee?: number;
  shippingAddress?: string;
  notes?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
}

export const orderServiceNew = {
  getAll: async (params: OrderQueryParams) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrderDto): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  confirm: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/confirm`);
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  recordPayment: async (id: string, amount: number): Promise<Order> => {
    const response = await api.post(`/orders/${id}/payment`, { amount });
    return response.data;
  },

  getStatistics: async (): Promise<OrderStatistics> => {
    const response = await api.get('/orders/statistics');
    return response.data;
  },
};

export default orderServiceNew;
