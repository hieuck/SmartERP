import api from './api';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  E_WALLET = 'E_WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  invoiceId?: string;
  orderId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  customerId: string;
  invoiceId?: string;
  orderId?: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

export interface RefundPaymentDto {
  amount: number;
  reason: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentService = {
  getAll: async (params: PaymentQueryParams) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getPayments: async (params: PaymentQueryParams) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: CreatePaymentDto): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePaymentDto): Promise<Payment> => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },

  complete: async (id: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/complete`);
    return response.data;
  },

  refund: async (id: string, data: RefundPaymentDto): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/refund`, data);
    return response.data;
  },

  reconcile: async (id: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/reconcile`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/payments/statistics');
    return response.data;
  },

  getByMethod: async (method: PaymentMethod) => {
    const response = await api.get(`/payments/method/${method}`);
    return response.data;
  },
};

export default paymentService;
