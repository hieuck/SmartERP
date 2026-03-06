import api from './api';

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export enum SettingCategory {
  GENERAL = 'GENERAL',
  BUSINESS = 'BUSINESS',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  FINANCIAL = 'FINANCIAL',
  NOTIFICATION = 'NOTIFICATION',
  SECURITY = 'SECURITY',
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingDto {
  value: string;
  description?: string;
  isPublic?: boolean;
}

export const settingsService = {
  getAll: async (category?: SettingCategory): Promise<Setting[]> => {
    const response = await api.get('/settings', { params: { category } });
    return response.data;
  },

  getByKey: async (key: string): Promise<Setting> => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  create: async (data: CreateSettingDto): Promise<Setting> => {
    const response = await api.post('/settings', data);
    return response.data;
  },

  update: async (key: string, data: UpdateSettingDto): Promise<Setting> => {
    const response = await api.put(`/settings/${key}`, data);
    return response.data;
  },

  delete: async (key: string): Promise<void> => {
    await api.delete(`/settings/${key}`);
  },

  bulkUpsert: async (settings: CreateSettingDto[]): Promise<Setting[]> => {
    const response = await api.post('/settings/bulk', settings);
    return response.data;
  },

  getPublic: async (): Promise<Setting[]> => {
    const response = await api.get('/settings/public');
    return response.data;
  },

  getByCategory: async (category: SettingCategory): Promise<Setting[]> => {
    const response = await api.get(`/settings/category/${category}`);
    return response.data;
  },
};
