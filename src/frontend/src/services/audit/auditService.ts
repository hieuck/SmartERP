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
  entity: AuditEntity | string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface BackendAuditLog extends Omit<AuditLog, 'entity'> {
  entity?: AuditEntity | string;
  entityType?: string;
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
  byEntity: Record<string, number>;
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

function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function normalizeAuditLog(log: BackendAuditLog): AuditLog {
  return {
    ...log,
    entity: log.entity ?? log.entityType ?? 'UNKNOWN',
    entityId: log.entityId ?? '',
  };
}

function defaultDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

function buildTimeline(logs: AuditLog[]): ActivityTimeline[] {
  const grouped = new Map<string, Map<AuditAction, number>>();

  logs.forEach((log) => {
    const date = log.createdAt.slice(0, 10);
    if (!grouped.has(date)) {
      grouped.set(date, new Map<AuditAction, number>());
    }

    const actionMap = grouped.get(date)!;
    const action = log.action;
    actionMap.set(action, (actionMap.get(action) ?? 0) + 1);
  });

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, actions]) => ({
      date,
      count: [...actions.values()].reduce((total, value) => total + value, 0),
      actions: [...actions.entries()].map(([action, count]) => ({ action, count })),
    }));
}

export const auditService = {
  getAll: async (params: AuditQueryParams) => {
    const response = await api.get('/audit/logs', {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        userId: params.userId,
        entityType: params.entity,
      },
    });

    let logs = unwrapApiData<BackendAuditLog[]>(response.data).map(normalizeAuditLog);

    if (params.action) {
      logs = logs.filter((log) => log.action === params.action);
    }

    if (params.entityId) {
      logs = logs.filter((log) => log.entityId === params.entityId);
    }

    const total = logs.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    return {
      data: paginate(logs, page, limit),
      total,
    };
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get('/audit/logs');
    const logs = unwrapApiData<BackendAuditLog[]>(response.data).map(normalizeAuditLog);
    const auditLog = logs.find((log) => log.id === id);

    if (!auditLog) {
      throw new Error(`Audit log ${id} not found`);
    }

    return auditLog;
  },

  getStatistics: async (days: number = 30): Promise<AuditStatistics> => {
    const { startDate, endDate } = defaultDateRange(days);
    const response = await api.get('/audit/summary', {
      params: { startDate, endDate },
    });

    const summary = unwrapApiData<{
      total: number;
      byAction: Record<AuditAction, number>;
      byEntityType: Record<string, number>;
      byUser: Record<string, number>;
    }>(response.data);

    return {
      totalLogs: summary.total ?? 0,
      byAction: summary.byAction ?? ({} as Record<AuditAction, number>),
      byEntity: summary.byEntityType ?? {},
      topUsers: Object.entries(summary.byUser ?? {})
        .map(([userId, count]) => ({ userId, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5),
    };
  },

  getTimeline: async (days: number = 30): Promise<ActivityTimeline[]> => {
    const { startDate, endDate } = defaultDateRange(days);
    const response = await api.get('/audit/logs', {
      params: { startDate, endDate },
    });

    const logs = unwrapApiData<BackendAuditLog[]>(response.data).map(normalizeAuditLog);
    return buildTimeline(logs);
  },

  getByEntity: async (entity: AuditEntity, entityId: string): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/logs/entity/${entity}/${entityId}`);
    return unwrapApiData<BackendAuditLog[]>(response.data).map(normalizeAuditLog);
  },

  getByUser: async (userId: string): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/logs/user/${userId}`);
    return unwrapApiData<BackendAuditLog[]>(response.data).map(normalizeAuditLog);
  },
};

export default auditService;
