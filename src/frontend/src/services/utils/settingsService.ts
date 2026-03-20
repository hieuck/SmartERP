import api from './api';

interface ApiEnvelope<T> {
  data?: T;
}

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

// Sync with backend: SettingDataType
export enum SettingDataType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

// Alias for backward compatibility
export type SettingType = SettingDataType;

// Sync with backend: SettingCategory
export enum SettingCategory {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  NOTIFICATION = 'NOTIFICATION',
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
  TAX = 'TAX',
  EMAIL = 'EMAIL',
  INTEGRATION = 'INTEGRATION',
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  dataType: SettingDataType;
  category: SettingCategory;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  dataType?: SettingDataType;
  category: SettingCategory;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingDto {
  value?: string;
  dataType?: SettingDataType;
  category?: SettingCategory;
  description?: string;
  isPublic?: boolean;
}

export const settingsService = {
  getAll: async (category?: SettingCategory): Promise<Setting[]> => {
    const response = await api.get('/settings', { params: { category } });
    return unwrapApiData(response.data);
  },

  getByCategory: async (category: SettingCategory): Promise<Setting[]> => {
    const response = await api.get('/settings', { params: { category } });
    return unwrapApiData(response.data);
  },

  getByKey: async (key: string): Promise<Setting> => {
    const response = await api.get(`/settings/${key}`);
    return unwrapApiData(response.data);
  },

  create: async (data: CreateSettingDto): Promise<Setting> => {
    const response = await api.post('/settings', data);
    return unwrapApiData(response.data);
  },

  update: async (key: string, data: UpdateSettingDto): Promise<Setting> => {
    const response = await api.patch(`/settings/${key}`, data);
    return unwrapApiData(response.data);
  },

  delete: async (key: string): Promise<void> => {
    await api.delete(`/settings/${key}`);
  },

  bulkUpsert: async (settings: CreateSettingDto[]): Promise<Setting[]> => {
    const response = await api.post('/settings/bulk', { settings });
    return unwrapApiData(response.data);
  },

  getPublic: async (): Promise<Setting[]> => {
    const response = await api.get('/settings/public');
    return unwrapApiData(response.data);
  },
};
