import api from './api';
import { SettingCategory, SettingDataType, settingsService, type Setting } from '../utils/settingsService';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  types: {
    lowStock: boolean;
    newOrder: boolean;
    orderStatusChange: boolean;
    overdueDebt: boolean;
    deliveryDate: boolean;
  };
}

type NotificationResponse = Notification & {
  status?: string;
};

function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function normalizeNotification(notification: NotificationResponse): Notification {
  return {
    ...notification,
    isRead:
      typeof notification.isRead === 'boolean'
        ? notification.isRead
        : notification.status === 'READ',
  };
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  userId: '',
  emailEnabled: false,
  inAppEnabled: true,
  types: {
    lowStock: true,
    newOrder: true,
    orderStatusChange: true,
    overdueDebt: true,
    deliveryDate: true,
  },
};

function parseBooleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

function mapSettingsToPreferences(settings: Setting[]): NotificationPreferences {
  const preferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    types: { ...DEFAULT_NOTIFICATION_PREFERENCES.types },
  };

  settings.forEach((setting) => {
    switch (setting.key) {
      case 'notifications.emailEnabled':
        preferences.emailEnabled = parseBooleanSetting(setting.value, preferences.emailEnabled);
        break;
      case 'notifications.inAppEnabled':
        preferences.inAppEnabled = parseBooleanSetting(setting.value, preferences.inAppEnabled);
        break;
      case 'notifications.types.lowStock':
        preferences.types.lowStock = parseBooleanSetting(setting.value, preferences.types.lowStock);
        break;
      case 'notifications.types.newOrder':
        preferences.types.newOrder = parseBooleanSetting(setting.value, preferences.types.newOrder);
        break;
      case 'notifications.types.orderStatusChange':
        preferences.types.orderStatusChange = parseBooleanSetting(
          setting.value,
          preferences.types.orderStatusChange,
        );
        break;
      case 'notifications.types.overdueDebt':
        preferences.types.overdueDebt = parseBooleanSetting(
          setting.value,
          preferences.types.overdueDebt,
        );
        break;
      case 'notifications.types.deliveryDate':
        preferences.types.deliveryDate = parseBooleanSetting(
          setting.value,
          preferences.types.deliveryDate,
        );
        break;
      default:
        break;
    }
  });

  return preferences;
}

function buildPreferenceSettings(
  preferences: Partial<NotificationPreferences>,
): Array<{
  key: string;
  value: string;
  dataType: SettingDataType;
  category: SettingCategory;
  description: string;
}> {
  const mergedPreferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...preferences,
    types: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.types,
      ...(preferences.types ?? {}),
    },
  };

  return [
    {
      key: 'notifications.emailEnabled',
      value: String(mergedPreferences.emailEnabled),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable email notifications',
    },
    {
      key: 'notifications.inAppEnabled',
      value: String(mergedPreferences.inAppEnabled),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable in-app notifications',
    },
    {
      key: 'notifications.types.lowStock',
      value: String(mergedPreferences.types.lowStock),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable low stock alerts',
    },
    {
      key: 'notifications.types.newOrder',
      value: String(mergedPreferences.types.newOrder),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable new order alerts',
    },
    {
      key: 'notifications.types.orderStatusChange',
      value: String(mergedPreferences.types.orderStatusChange),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable order status change alerts',
    },
    {
      key: 'notifications.types.overdueDebt',
      value: String(mergedPreferences.types.overdueDebt),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable overdue debt alerts',
    },
    {
      key: 'notifications.types.deliveryDate',
      value: String(mergedPreferences.types.deliveryDate),
      dataType: SettingDataType.BOOLEAN,
      category: SettingCategory.NOTIFICATION,
      description: 'Enable delivery date reminders',
    },
  ];
}

const notificationService = {
  getAll: async (params: NotificationQueryParams) => {
    const response = await api.get('/notifications', { params });
    const data = unwrapApiData<NotificationResponse[] | { data?: NotificationResponse[] }>(
      response.data,
    );
    if (Array.isArray(data)) {
      return data.map(normalizeNotification);
    }

    return {
      ...data,
      data: Array.isArray(data?.data) ? data.data.map(normalizeNotification) : [],
    };
  },

  getById: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`);
    return normalizeNotification(unwrapApiData<NotificationResponse>(response.data));
  },

  create: async (data: CreateNotificationDto): Promise<Notification> => {
    const response = await api.post('/notifications', data);
    return normalizeNotification(unwrapApiData<NotificationResponse>(response.data));
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/${id}/read`);
    return normalizeNotification(unwrapApiData<NotificationResponse>(response.data));
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread/count');
    return unwrapApiData<{ count: number }>(response.data).count;
  },

  bulkCreate: async (notifications: CreateNotificationDto[]): Promise<Notification[]> => {
    const response = await api.post('/notifications/bulk', notifications);
    return unwrapApiData<NotificationResponse[]>(response.data).map(normalizeNotification);
  },

  // Legacy methods for backward compatibility
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<{ data: Notification[]; total: number }> => {
    const response = await api.get('/notifications', { params });
    const payload = response.data as
      | NotificationResponse[]
      | { data?: NotificationResponse[]; meta?: { total?: number } };
    const notifications = Array.isArray(payload)
      ? payload.map(normalizeNotification)
      : Array.isArray(payload.data)
        ? payload.data.map(normalizeNotification)
        : [];

    return {
      data: notifications,
      total: Array.isArray(payload) ? payload.length : payload.meta?.total || notifications.length,
    };
  },

  getNotification: async (id: string): Promise<Notification> => {
    return notificationService.getById(id);
  },

  deleteNotification: async (id: string): Promise<void> => {
    return notificationService.delete(id);
  },

  // Preferences (to be implemented in backend)
  getPreferences: async (): Promise<NotificationPreferences> => {
    const settings = await settingsService.getByCategory(SettingCategory.NOTIFICATION);
    return mapSettingsToPreferences(settings);
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    await settingsService.bulkUpsert(buildPreferenceSettings(preferences));
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...preferences,
      types: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.types,
        ...(preferences.types ?? {}),
      },
    };
  },

  testEmail: async (): Promise<{ connected: boolean; message: string }> => {
    try {
      const emailSettings = await settingsService.getByCategory(SettingCategory.EMAIL);
      return {
        connected: emailSettings.length > 0,
        message:
          emailSettings.length > 0 ? 'Email service is available' : 'Email service is unavailable',
      };
    } catch {
      return {
        connected: false,
        message: 'Email service is unavailable',
      };
    }
  },
};

export default notificationService;
