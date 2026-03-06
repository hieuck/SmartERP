import api from './api';

export interface Return {
  id: string;
  code: string;
  orderId: string;
  customerId: string;
  returnDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  items: ReturnItem[];
  refundAmount: number;
  refundMethod: 'cash' | 'bank_transfer' | 'exchange';
  notes?: string;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

const returnService = {
  getReturns: async (params?: any): Promise<{ data: Return[]; total: number }> => {
    const response = await api.get('/returns', { params });
    return { data: response.data.data, total: response.data.meta.total };
  },

  getReturn: async (id: string): Promise<Return> => {
    const response = await api.get(`/returns/${id}`);
    return response.data.data;
  },

  createReturn: async (data: Partial<Return>): Promise<Return> => {
    const response = await api.post('/returns', data);
    return response.data.data;
  },

  updateReturn: async (id: string, data: Partial<Return>): Promise<Return> => {
    const response = await api.put(`/returns/${id}`, data);
    return response.data.data;
  },

  approveReturn: async (id: string): Promise<Return> => {
    const response = await api.post(`/returns/${id}/approve`);
    return response.data.data;
  },

  rejectReturn: async (id: string, reason: string): Promise<Return> => {
    const response = await api.post(`/returns/${id}/reject`, { reason });
    return response.data.data;
  },
};

export default returnService;
