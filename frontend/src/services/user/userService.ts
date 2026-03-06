import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'locked';
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  roles?: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'locked';
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

const userService = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  async getUser(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  async createUser(data: CreateUserDto): Promise<User> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Update user
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Assign roles to user
  async assignRoles(id: string, roleIds: string[]): Promise<User> {
    const response = await api.put(`/users/${id}/roles`, { roleIds });
    return response.data;
  },

  // Change password
  async changePassword(userId: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { userId, newPassword });
  },

  // Get all roles
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/roles');
    return response.data;
  },

  // Get role by ID
  async getRole(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },
};

export default userService;
