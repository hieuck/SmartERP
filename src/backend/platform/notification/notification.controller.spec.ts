import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    findAll: jest.fn(),
    findUnread: jest.fn(),
    getUnreadCount: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockNotificationId = 'notif-123';
  const mockReq = { user: { id: mockUserId } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all notifications for user', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1', isRead: false },
        { id: '2', title: 'Notification 2', isRead: true },
      ];
      mockNotificationService.findAll.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(mockUser, mockReq);

      expect(result).toEqual(mockNotifications);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications', async () => {
      const mockUnread = [{ id: '1', title: 'Unread', isRead: false }];
      mockNotificationService.findUnread.mockResolvedValue(mockUnread);

      const result = await controller.findUnread(mockUser, mockReq);

      expect(result).toEqual(mockUnread);
      expect(service.findUnread).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const count = 5;
      mockNotificationService.getUnreadCount.mockResolvedValue(count);

      const result = await controller.getUnreadCount(mockUser, mockReq);

      expect(result).toEqual({ count });
      expect(service.getUnreadCount).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findById', () => {
    it('should return notification by id', async () => {
      const mockNotification = { id: mockNotificationId, title: 'Test' };
      mockNotificationService.findById.mockResolvedValue(mockNotification);

      const result = await controller.findById(mockUser, mockNotificationId);

      expect(result).toEqual(mockNotification);
      expect(service.findById).toHaveBeenCalledWith(mockUser, mockNotificationId);
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const title = 'New Notification';
      const message = 'Test message';
      const type = NotificationType.INFO;
      const mockCreated = { id: mockNotificationId, title, message, type };
      mockNotificationService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(mockUser, mockUserId, title, message, type);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(mockUser, title, message, type, undefined, undefined);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockRead = { id: mockNotificationId, isRead: true };
      mockNotificationService.markAsRead.mockResolvedValue(mockRead);

      const result = await controller.markAsRead(mockUser, mockNotificationId);

      expect(result).toEqual(mockRead);
      expect(service.markAsRead).toHaveBeenCalledWith(mockUser, mockNotificationId);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockUser, mockReq);

      expect(result).toBeUndefined();
      expect(service.markAllAsRead).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('archive', () => {
    it('should archive notification', async () => {
      const mockArchived = { id: mockNotificationId, isArchived: true };
      mockNotificationService.archive.mockResolvedValue(mockArchived);

      const result = await controller.archive(mockUser, mockNotificationId);

      expect(result).toEqual(mockArchived);
      expect(service.archive).toHaveBeenCalledWith(mockUser, mockNotificationId);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      mockNotificationService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser, mockNotificationId);

      expect(result).toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(mockUser, mockNotificationId);
    });
  });
});
