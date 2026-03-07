import api from './api';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  images?: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  minStock?: number;
  maxStock?: number;
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
  status?: ProductStatus;
  minStock?: number;
  maxStock?: number;
  images?: string[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  lowStock?: boolean;
}

export const productService = {
  getAll: async (params: ProductQueryParams) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },

  updateStock: async (id: string, quantity: number): Promise<Product> => {
    const response = await api.patch(`/products/${id}/stock`, { quantity });
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<ProductCategory[]> => {
    const response = await api.get('/products/categories');
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  },

  createCategory: async (category: {
    name: string;
    description?: string;
    parentId?: string;
  }): Promise<ProductCategory> => {
    const response = await api.post('/products/categories', category);
    return response.data.data || response.data;
  },

  updateCategory: async (
    id: string,
    category: { name?: string; description?: string; parentId?: string },
  ): Promise<ProductCategory> => {
    const response = await api.put(`/products/categories/${id}`, category);
    return response.data.data || response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/products/categories/${id}`);
  },

  uploadImage: async (productId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data?.url || response.data.url;
  },

  // Legacy methods for backward compatibility
  getProducts: async (params: ProductQueryParams) => {
    return productService.getAll(params);
  },

  getProduct: async (id: string): Promise<Product> => {
    return productService.getById(id);
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    return productService.create(data as CreateProductDto);
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    return productService.update(id, data);
  },

  deleteProduct: async (id: string): Promise<void> => {
    return productService.delete(id);
  },
};
