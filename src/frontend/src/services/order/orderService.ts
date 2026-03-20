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
  totalAmount?: number;
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

function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    ...(typeof order.total === 'number' ? { totalAmount: order.total } : {}),
    ...('shipping' in order &&
    typeof (order as Order & { shipping?: number }).shipping === 'number' &&
    typeof order.shippingFee !== 'number'
      ? { shippingFee: (order as Order & { shipping?: number }).shipping ?? 0 }
      : {}),
  };
}

export const orderServiceNew = {
  getAll: async (params: OrderQueryParams) => {
    const response = await api.get('/orders', { params });
    const payload = response.data as Order[] | { data?: Order[]; meta?: { total?: number } };

    if (Array.isArray(payload)) {
      return {
        data: payload.map((order) => normalizeOrder(order)),
        meta: { total: payload.length },
      };
    }

    const orders = Array.isArray(payload?.data)
      ? payload.data.map((order) => normalizeOrder(order))
      : [];
    return {
      ...payload,
      data: orders,
      meta: payload?.meta ?? { total: orders.length },
    };
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await api.post('/orders', data);
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  update: async (id: string, data: UpdateOrderDto): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  confirm: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/confirm`);
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  recordPayment: async (id: string, amount: number): Promise<Order> => {
    const response = await api.post(`/orders/${id}/payment`, { amount });
    return normalizeOrder(unwrapApiData<Order>(response.data));
  },

  getStatistics: async (): Promise<OrderStatistics> => {
    const response = await api.get('/orders/statistics');
    return unwrapApiData<OrderStatistics>(response.data);
  },
};

export default orderServiceNew;
