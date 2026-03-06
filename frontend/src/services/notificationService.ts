import api from './api';

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
  metadata?: any;
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
  metadata?: any;
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

const notificationService = {
  getAll: async (params: NotificationQueryParams) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  create: async (data: CreateNotificationDto): Promise<Notification> => {
    const response = await api.post('/notifications', data);
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  getStatistics: async () => {
    const response = await api.get('/notifications/statistics');
    return response.data;
  },

  bulkCreate: async (notifications: CreateNotificationDto[]): Promise<Notification[]> => {
    const response = await api.post('/notifications/bulk', notifications);
    return response.data;
  },

  // Legacy methods for backward compatibility
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }): Promise<{ data: Notification[]; total: number }> => {
    const response = await api.get('/notifications', { params });
    return {
      data: response.data.data || response.data,
      total: response.data.meta?.total || response.data.length,
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
    const response = await api.get('/notification-preferences');
    return response.data.data || response.data;
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    const response = await api.patch('/notification-preferences', preferences);
    return response.data.data || response.data;
  },

  testEmail: async (): Promise<{ connected: boolean; message: string }> => {
    const response = await api.get('/notifications/test-email');
    return response.data.data || response.data;
  },
};

export default notificationService;
