import api from './api';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableCustomerTypes?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  promotionId?: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  minOrderAmount?: number;
  isActive: boolean;
  createdAt: string;
}

const promotionService = {
  // Promotions
  getPromotions: async (params?: any): Promise<{ data: Promotion[]; total: number }> => {
    const response = await api.get('/promotions', { params });
    return { data: response.data.data, total: response.data.meta.total };
  },

  getPromotion: async (id: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data.data;
  },

  createPromotion: async (data: Partial<Promotion>): Promise<Promotion> => {
    const response = await api.post('/promotions', data);
    return response.data.data;
  },

  updatePromotion: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data.data;
  },

  deletePromotion: async (id: string): Promise<void> => {
    await api.delete(`/promotions/${id}`);
  },

  // Coupons
  getCoupons: async (params?: any): Promise<{ data: Coupon[]; total: number }> => {
    const response = await api.get('/coupons', { params });
    return { data: response.data.data, total: response.data.meta.total };
  },

  getCoupon: async (id: string): Promise<Coupon> => {
    const response = await api.get(`/coupons/${id}`);
    return response.data.data;
  },

  createCoupon: async (data: Partial<Coupon>): Promise<Coupon> => {
    const response = await api.post('/coupons', data);
    return response.data.data;
  },

  updateCoupon: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  },

  validateCoupon: async (
    code: string,
    orderAmount: number,
  ): Promise<{ valid: boolean; discount: number; message?: string }> => {
    const response = await api.post('/coupons/validate', { code, orderAmount });
    return response.data;
  },

  // Reports
  getPromotionReport: async (
    promotionId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> => {
    const response = await api.get(`/promotions/${promotionId}/report`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default promotionService;
