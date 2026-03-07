import api from '../api';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionDto {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export const permissionService = {
  // Get all permissions
  getAll: async (): Promise<Permission[]> => {
    const response = await api.get('/permissions');
    return response.data;
  },

  // Get permission by ID
  getById: async (id: string): Promise<Permission> => {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },

  // Get permissions by resource
  getByResource: async (resource: string): Promise<Permission[]> => {
    const response = await api.get(`/permissions/resource/${resource}`);
    return response.data;
  },

  // Get permission count
  getCount: async (): Promise<number> => {
    const response = await api.get('/permissions/count');
    return response.data;
  },

  // Create permission
  create: async (data: CreatePermissionDto): Promise<Permission> => {
    const response = await api.post('/permissions', data);
    return response.data;
  },

  // Update permission
  update: async (id: string, data: UpdatePermissionDto): Promise<Permission> => {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data;
  },

  // Delete permission
  delete: async (id: string): Promise<void> => {
    await api.delete(`/permissions/${id}`);
  },
};

export default permissionService;
