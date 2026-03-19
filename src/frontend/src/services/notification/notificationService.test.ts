import notificationService, {
  NotificationPriority,
  NotificationType,
  type CreateNotificationDto,
  type NotificationPreferences,
} from './notificationService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets notifications with query params', async () => {
    const params = { page: 2, limit: 20, isRead: false };
    const mockResponse = { data: { data: [], meta: { total: 0 } } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await notificationService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/notifications', { params });
    expect(result).toEqual(mockResponse.data);
  });

  it('gets a notification by id', async () => {
    const mockNotification = { id: 'noti-1', title: 'Test notification' };
    mockApiGet.mockResolvedValue({ data: mockNotification });

    const result = await notificationService.getById('noti-1');

    expect(api.get).toHaveBeenCalledWith('/notifications/noti-1');
    expect(result).toEqual(mockNotification);
  });

  it('creates a notification', async () => {
    const payload: CreateNotificationDto = {
      userId: 'user-1',
      type: NotificationType.INFO,
      priority: NotificationPriority.HIGH,
      title: 'Low stock',
      message: 'Product needs restock',
    };
    const mockNotification = { id: 'noti-1', ...payload, isRead: false };
    mockApiPost.mockResolvedValue({ data: mockNotification });

    const result = await notificationService.create(payload);

    expect(api.post).toHaveBeenCalledWith('/notifications', payload);
    expect(result).toEqual(mockNotification);
  });

  it('marks a notification as read', async () => {
    const mockNotification = { id: 'noti-1', isRead: true };
    mockApiPatch.mockResolvedValue({ data: mockNotification });

    const result = await notificationService.markAsRead('noti-1');

    expect(api.patch).toHaveBeenCalledWith('/notifications/noti-1/read');
    expect(result).toEqual(mockNotification);
  });

  it('marks all notifications as read', async () => {
    mockApiPatch.mockResolvedValue({ data: undefined });

    await notificationService.markAllAsRead();

    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('deletes a notification', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await notificationService.delete('noti-1');

    expect(api.delete).toHaveBeenCalledWith('/notifications/noti-1');
  });

  it('returns unread count', async () => {
    mockApiGet.mockResolvedValue({ data: { count: 7 } });

    const result = await notificationService.getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toBe(7);
  });

  it('bulk creates notifications', async () => {
    const payload: CreateNotificationDto[] = [
      {
        userId: 'user-1',
        type: NotificationType.WARNING,
        priority: NotificationPriority.MEDIUM,
        title: 'Reminder',
        message: 'Follow up order',
      },
    ];
    const mockNotifications = [{ id: 'noti-1', ...payload[0], isRead: false }];
    mockApiPost.mockResolvedValue({ data: mockNotifications });

    const result = await notificationService.bulkCreate(payload);

    expect(api.post).toHaveBeenCalledWith('/notifications/bulk', payload);
    expect(result).toEqual(mockNotifications);
  });

  it('unwraps legacy getNotifications response with meta total', async () => {
    const mockData = [{ id: 'noti-1' }];
    mockApiGet.mockResolvedValue({
      data: {
        data: mockData,
        meta: { total: 15 },
      },
    });

    const result = await notificationService.getNotifications({ page: 1, limit: 10 });

    expect(result).toEqual({
      data: mockData,
      total: 15,
    });
  });

  it('falls back to array length in legacy getNotifications response', async () => {
    const mockData = [{ id: 'noti-1' }, { id: 'noti-2' }];
    mockApiGet.mockResolvedValue({ data: mockData });

    const result = await notificationService.getNotifications();

    expect(result).toEqual({
      data: mockData,
      total: 2,
    });
  });

  it('unwraps notification preferences response', async () => {
    const preferences: NotificationPreferences = {
      userId: 'user-1',
      emailEnabled: true,
      inAppEnabled: true,
      types: {
        lowStock: true,
        newOrder: true,
        orderStatusChange: false,
        overdueDebt: true,
        deliveryDate: false,
      },
    };
    mockApiGet.mockResolvedValue({ data: { data: preferences } });

    const result = await notificationService.getPreferences();

    expect(api.get).toHaveBeenCalledWith('/notification-preferences');
    expect(result).toEqual(preferences);
  });

  it('updates preferences and unwraps response', async () => {
    const patch: Partial<NotificationPreferences> = {
      emailEnabled: false,
    };
    const updated = {
      userId: 'user-1',
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
    mockApiPatch.mockResolvedValue({ data: { data: updated } });

    const result = await notificationService.updatePreferences(patch);

    expect(api.patch).toHaveBeenCalledWith('/notification-preferences', patch);
    expect(result).toEqual(updated);
  });

  it('unwraps test email response', async () => {
    const mockResponse = { connected: true, message: 'SMTP ready' };
    mockApiGet.mockResolvedValue({ data: { data: mockResponse } });

    const result = await notificationService.testEmail();

    expect(api.get).toHaveBeenCalledWith('/notifications/test-email');
    expect(result).toEqual(mockResponse);
  });
});
