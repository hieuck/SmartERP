import notificationService, {
  NotificationPriority,
  NotificationType,
  type CreateNotificationDto,
  type NotificationPreferences,
} from './notificationService';
import api from './api';
import { settingsService } from '../utils/settingsService';
import { vi } from 'vitest';

vi.mock('./api');
vi.mock('../utils/settingsService', () => ({
  SettingCategory: {
    NOTIFICATION: 'NOTIFICATION',
    EMAIL: 'EMAIL',
  },
  SettingDataType: {
    BOOLEAN: 'BOOLEAN',
  },
  settingsService: {
    getByCategory: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}));

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiDelete = vi.mocked(api.delete);
const mockSettingsGetByCategory = vi.mocked(settingsService.getByCategory);
const mockSettingsBulkUpsert = vi.mocked(settingsService.bulkUpsert);

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
    expect(result).toEqual([]);
  });

  it('gets a notification by id', async () => {
    const mockNotification = { id: 'noti-1', title: 'Test notification' };
    mockApiGet.mockResolvedValue({ data: mockNotification });

    const result = await notificationService.getById('noti-1');

    expect(api.get).toHaveBeenCalledWith('/notifications/noti-1');
    expect(result).toEqual({ ...mockNotification, isRead: false });
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
    const mockNotification = { id: 'noti-1', status: 'READ' };
    mockApiPost.mockResolvedValue({ data: mockNotification });

    const result = await notificationService.markAsRead('noti-1');

    expect(api.post).toHaveBeenCalledWith('/notifications/noti-1/read');
    expect(result).toEqual({ ...mockNotification, isRead: true });
  });

  it('marks all notifications as read', async () => {
    mockApiPost.mockResolvedValue({ data: undefined });

    await notificationService.markAllAsRead();

    expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('deletes a notification', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await notificationService.delete('noti-1');

    expect(api.delete).toHaveBeenCalledWith('/notifications/noti-1');
  });

  it('returns unread count', async () => {
    mockApiGet.mockResolvedValue({ data: { count: 7 } });

    const result = await notificationService.getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/unread/count');
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
    const mockPayload = {
      data: [{ id: 'noti-1', status: 'UNREAD' }],
      meta: { total: 15 },
    };
    mockApiGet.mockResolvedValue({
      data: mockPayload,
    });

    const result = await notificationService.getNotifications({ page: 1, limit: 10 });

    expect(result).toEqual({
      data: [{ ...mockPayload.data[0], isRead: false }],
      total: 15,
    });
  });

  it('falls back to array length in legacy getNotifications response', async () => {
    const mockData = [{ id: 'noti-1', status: 'READ' }, { id: 'noti-2', status: 'UNREAD' }];
    mockApiGet.mockResolvedValue({ data: mockData });

    const result = await notificationService.getNotifications();

    expect(result).toEqual({
      data: [
        { ...mockData[0], isRead: true },
        { ...mockData[1], isRead: false },
      ],
      total: 2,
    });
  });

  it('unwraps notification preferences response', async () => {
    mockSettingsGetByCategory.mockResolvedValue([
      { key: 'notifications.emailEnabled', value: 'true' },
      { key: 'notifications.inAppEnabled', value: 'false' },
      { key: 'notifications.types.lowStock', value: 'true' },
      { key: 'notifications.types.newOrder', value: 'false' },
      { key: 'notifications.types.orderStatusChange', value: 'true' },
      { key: 'notifications.types.overdueDebt', value: 'false' },
      { key: 'notifications.types.deliveryDate', value: 'true' },
    ] as never);

    const result = await notificationService.getPreferences();

    expect(settingsService.getByCategory).toHaveBeenCalledWith('NOTIFICATION');
    expect(result).toEqual({
      userId: '',
      emailEnabled: true,
      inAppEnabled: false,
      types: {
        lowStock: true,
        newOrder: false,
        orderStatusChange: true,
        overdueDebt: false,
        deliveryDate: true,
      },
    });
  });

  it('updates preferences and unwraps response', async () => {
    const patch: Partial<NotificationPreferences> = {
      emailEnabled: false,
    };
    const updated = {
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
    mockSettingsBulkUpsert.mockResolvedValue([] as never);

    const result = await notificationService.updatePreferences(patch);

    expect(settingsService.bulkUpsert).toHaveBeenCalled();
    expect(result).toEqual(updated);
  });

  it('checks email connectivity via email logs', async () => {
    mockSettingsGetByCategory.mockResolvedValue([{ key: 'smtp.host', value: 'localhost' }] as never);

    const result = await notificationService.testEmail();

    expect(settingsService.getByCategory).toHaveBeenCalledWith('EMAIL');
    expect(result).toEqual({
      connected: true,
      message: 'Email service is available',
    });
  });

  it('returns disconnected email status when logs endpoint fails', async () => {
    mockSettingsGetByCategory.mockRejectedValue(new Error('boom'));

    const result = await notificationService.testEmail();

    expect(result).toEqual({
      connected: false,
      message: 'Email service is unavailable',
    });
  });
});
