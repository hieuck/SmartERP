import api from '../api/apiService';

export interface CreatePaymentDto {
  gateway: 'vnpay' | 'momo' | 'stripe';
  amount: number;
  orderId: string;
  returnUrl?: string;
  ipnUrl?: string;
  description?: string;
}

export interface VerifyPaymentDto {
  gateway: string;
  transactionId: string;
  params: Record<string, unknown>;
}

export interface RefundPaymentDto {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  gateway: string;
  orderId: string;
  amount: number;
  status: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionQueryParams {
  orderId?: string;
  gateway?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

const paymentGatewayService = {
  async createPayment(data: CreatePaymentDto): Promise<any> {
    const response = await api.post('/payment-gateway', data);
    return response.data;
  },

  async verifyPayment(data: VerifyPaymentDto): Promise<any> {
    const response = await api.post('/payment-gateway/verify', data);
    return response.data;
  },

  async refundPayment(data: RefundPaymentDto): Promise<any> {
    const response = await api.post('/payment-gateway/refund', data);
    return response.data;
  },

  async getTransaction(id: string): Promise<Transaction> {
    const response = await api.get(`/payment-gateway/transactions/${id}`);
    return response.data;
  },

  async listTransactions(params?: TransactionQueryParams): Promise<Transaction[]> {
    const response = await api.get('/payment-gateway/transactions', { params });
    return response.data;
  },
};

export default paymentGatewayService;
