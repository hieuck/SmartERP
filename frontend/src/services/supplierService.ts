import api from './api';

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  status: SupplierStatus;
  rating: number;
  creditLimit: number;
  balance: number;
  paymentTerms?: string;
  leadTime?: number;
  discountPercentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  rating?: number;
  creditLimit?: number;
  paymentTerms?: string;
  leadTime?: number;
  discountPercentage?: number;
  notes?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  status?: SupplierStatus;
  rating?: number;
  creditLimit?: number;
  paymentTerms?: string;
  leadTime?: number;
  discountPercentage?: number;
  notes?: string;
}

export interface SupplierQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplierStatus;
  minRating?: number;
}

export interface SupplierStatistics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchases: number;
  averagePurchaseValue: number;
}

export const supplierService = {
  getAll: async (params: SupplierQueryParams) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  updateBalance: async (id: string, amount: number): Promise<Supplier> => {
    const response = await api.patch(`/suppliers/${id}/balance`, { amount });
    return response.data;
  },

  updateRating: async (id: string, rating: number): Promise<Supplier> => {
    const response = await api.patch(`/suppliers/${id}/rating`, { rating });
    return response.data;
  },

  getStatistics: async (): Promise<SupplierStatistics> => {
    const response = await api.get('/suppliers/statistics');
    return response.data;
  },

  // Legacy methods for backward compatibility
  getSuppliers: async (params?: any) => {
    return supplierService.getAll(params);
  },

  getSupplier: async (id: string): Promise<Supplier> => {
    return supplierService.getById(id);
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    return supplierService.create(data as CreateSupplierDto);
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    return supplierService.update(id, data);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    return supplierService.delete(id);
  },
};
