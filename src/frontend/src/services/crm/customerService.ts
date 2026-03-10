import api from './api';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  status: CustomerStatus;
  creditLimit: number;
  balance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  status?: CustomerStatus;
  creditLimit?: number;
  notes?: string;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
}

export interface CustomerStatistics {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  totalSpent: number;
  orderCount: number;
}

export const customerService = {
  getAll: async (params: CustomerQueryParams) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  updateBalance: async (id: string, amount: number): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}/balance`, { amount });
    return response.data;
  },

  getStatistics: async (): Promise<CustomerStatistics> => {
    const response = await api.get('/customers/statistics');
    return response.data;
  },

  getTopCustomers: async (limit: number = 10): Promise<TopCustomer[]> => {
    const response = await api.get('/customers/top', { params: { limit } });
    return response.data;
  },

  // Legacy methods for backward compatibility
  getCustomers: async (params?: any) => {
    return customerService.getAll(params);
  },

  getCustomer: async (id: string): Promise<Customer> => {
    return customerService.getById(id);
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    return customerService.create(data as CreateCustomerDto);
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return customerService.update(id, data);
  },

  deleteCustomer: async (id: string): Promise<void> => {
    return customerService.delete(id);
  },
};

export default customerService;
