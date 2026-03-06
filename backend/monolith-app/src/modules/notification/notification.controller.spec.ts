import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.entity';

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

      const result = await controller.findAll(mockTenantId, mockReq);

      expect(result).toEqual(mockNotifications);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, mockUserId);
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications', async () => {
      const mockUnread = [{ id: '1', title: 'Unread', isRead: false }];
      mockNotificationService.findUnread.mockResolvedValue(mockUnread);

      const result = await controller.findUnread(mockTenantId, mockReq);

      expect(result).toEqual(mockUnread);
      expect(service.findUnread).toHaveBeenCalledWith(mockTenantId, mockUserId);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const count = 5;
      mockNotificationService.getUnreadCount.mockResolvedValue(count);

      const result = await controller.getUnreadCount(mockTenantId, mockReq);

      expect(result).toEqual({ count });
      expect(service.getUnreadCount).toHaveBeenCalledWith(mockTenantId, mockUserId);
    });
  });

  describe('findById', () => {
    it('should return notification by id', async () => {
      const mockNotification = { id: mockNotificationId, title: 'Test' };
      mockNotificationService.findById.mockResolvedValue(mockNotification);

      const result = await controller.findById(mockTenantId, mockNotificationId);

      expect(result).toEqual(mockNotification);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, mockNotificationId);
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const title = 'New Notification';
      const message = 'Test message';
      const type = NotificationType.INFO;
      const mockCreated = { id: mockNotificationId, title, message, type };
      mockNotificationService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(mockTenantId, mockUserId, title, message, type);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, mockUserId, title, message, type, undefined, undefined);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockRead = { id: mockNotificationId, isRead: true };
      mockNotificationService.markAsRead.mockResolvedValue(mockRead);

      const result = await controller.markAsRead(mockTenantId, mockNotificationId);

      expect(result).toEqual(mockRead);
      expect(service.markAsRead).toHaveBeenCalledWith(mockTenantId, mockNotificationId);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(undefined);

      const result = await controller.markAllAsRead(mockTenantId, mockReq);

      expect(result).toBeUndefined();
      expect(service.markAllAsRead).toHaveBeenCalledWith(mockTenantId, mockUserId);
    });
  });

  describe('archive', () => {
    it('should archive notification', async () => {
      const mockArchived = { id: mockNotificationId, isArchived: true };
      mockNotificationService.archive.mockResolvedValue(mockArchived);

      const result = await controller.archive(mockTenantId, mockNotificationId);

      expect(result).toEqual(mockArchived);
      expect(service.archive).toHaveBeenCalledWith(mockTenantId, mockNotificationId);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      mockNotificationService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockTenantId, mockNotificationId);

      expect(result).toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(mockTenantId, mockNotificationId);
    });
  });
});
