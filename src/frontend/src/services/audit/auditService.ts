import api from './api';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditEntity {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  INVENTORY = 'INVENTORY',
  ORDER = 'ORDER',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  SETTINGS = 'SETTINGS',
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStatistics {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  byEntity: Record<AuditEntity, number>;
  topUsers: Array<{ userId: string; count: number }>;
}

export interface ActivityTimeline {
  date: string;
  count: number;
  actions: Array<{
    action: AuditAction;
    count: number;
  }>;
}

export const auditService = {
  getAll: async (params: AuditQueryParams) => {
    const response = await api.get('/audit', { params });
    return response.data;
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<AuditStatistics> => {
    const response = await api.get('/audit/statistics');
    return response.data;
  },

  getTimeline: async (days: number = 30): Promise<ActivityTimeline[]> => {
    const response = await api.get('/audit/timeline', { params: { days } });
    return response.data;
  },

  getByEntity: async (entity: AuditEntity, entityId: string): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/entity/${entity}/${entityId}`);
    return response.data;
  },

  getByUser: async (userId: string): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/user/${userId}`);
    return response.data;
  },
};

export default auditService;
