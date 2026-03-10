import api from './api';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export const roleService = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },

  // Get role by ID
  getById: async (id: string): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // Get role by name
  getByName: async (name: string): Promise<Role> => {
    const response = await api.get(`/roles/name/${name}`);
    return response.data;
  },

  // Get role count
  getCount: async (): Promise<number> => {
    const response = await api.get('/roles/count');
    return response.data;
  },

  // Create role
  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  // Update role
  update: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  // Add permissions to role
  addPermissions: async (id: string, permissionIds: string[]): Promise<Role> => {
    const response = await api.patch(`/roles/${id}/permissions/add`, { permissionIds });
    return response.data;
  },

  // Remove permissions from role
  removePermissions: async (id: string, permissionIds: string[]): Promise<Role> => {
    const response = await api.patch(`/roles/${id}/permissions/remove`, { permissionIds });
    return response.data;
  },

  // Delete role
  delete: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};

export default roleService;
