import api from '../api';

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  level: number;
  path: string;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}

export const categoryService = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Get category by code
  getByCode: async (code: string): Promise<Category> => {
    const response = await api.get(`/categories/code/${code}`);
    return response.data;
  },

  // Get category tree
  getTree: async (): Promise<Category[]> => {
    const response = await api.get('/categories/tree');
    return response.data;
  },

  // Get root categories
  getRootCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories/root');
    return response.data;
  },

  // Get category children
  getChildren: async (id: string): Promise<Category[]> => {
    const response = await api.get(`/categories/${id}/children`);
    return response.data;
  },

  // Get category count
  getCount: async (): Promise<number> => {
    const response = await api.get('/categories/count');
    return response.data;
  },

  // Create category
  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Activate category
  activate: async (id: string): Promise<Category> => {
    const response = await api.patch(`/categories/${id}/activate`);
    return response.data;
  },

  // Deactivate category
  deactivate: async (id: string): Promise<Category> => {
    const response = await api.patch(`/categories/${id}/deactivate`);
    return response.data;
  },

  // Reorder category
  reorder: async (id: string, sortOrder: number): Promise<Category> => {
    const response = await api.patch(`/categories/${id}/reorder`, { sortOrder });
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export default categoryService;
