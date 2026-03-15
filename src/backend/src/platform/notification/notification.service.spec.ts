import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationType, NotificationStatus } from './enums';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: jest.Mocked<Repository<Notification>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockNotification: Notification = {
    id: 'notification-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    title: 'Test Notification',
    message: 'Test notification message',
    type: NotificationType.INFO,
    status: NotificationStatus.UNREAD,
    link: null,
    metadata: null,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockNotificationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
      canRead: jest.fn().mockReturnValue(true),
      canWrite: jest.fn().mockReturnValue(true),
      canDelete: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all notifications for user', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 'notification-2' }];
      notificationRepository.find.mockResolvedValue(notifications as Notification[]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(2);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id, tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should limit to 50 most recent notifications', async () => {
      const notifications = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotification,
        id: `notification-${i}`,
      }));
      notificationRepository.find.mockResolvedValue(notifications as Notification[]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(50);
    });

    it('should return empty array when no notifications', async () => {
      notificationRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findUnread', () => {
    it('should return only unread notifications', async () => {
      const unreadNotifications = [mockNotification];
      notificationRepository.find.mockResolvedValue(unreadNotifications as Notification[]);

      const result = await service.findUnread(mockUser);

      expect(result).toEqual(unreadNotifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: NotificationStatus.UNREAD,
          tenantId: mockUser.tenantId,
        },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no unread notifications', async () => {
      notificationRepository.find.mockResolvedValue([]);

      const result = await service.findUnread(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return notification from cache if available', async () => {
      cacheService.getOrSet.mockResolvedValue(mockNotification);

      const result = await service.findById(mockUser, 'notification-1');

      expect(result).toEqual(mockNotification);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);
      cacheService.getOrSet.mockImplementation(async (_key, fn) => fn());

      const result = await service.findById(mockUser, 'notification-1');

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.findById(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findById(mockUser, 'non-existent')).rejects.toThrow(
        'Notification with ID non-existent not found',
      );
    });
  });

  describe('create', () => {
    it('should create notification with all params', async () => {
      const newNotification = {
        ...mockNotification,
        title: 'New Notification',
        message: 'New message',
        type: NotificationType.SUCCESS,
        link: '/dashboard',
        metadata: { key: 'value' },
      };
      notificationRepository.save = jest.fn().mockResolvedValue(newNotification);

      const result = await service.create(
        mockUser,
        'New Notification',
        'New message',
        NotificationType.SUCCESS,
        '/dashboard',
        { key: 'value' },
      );

      expect(result.title).toBe('New Notification');
      expect(result.message).toBe('New message');
      expect(result.type).toBe(NotificationType.SUCCESS);
      expect(result.link).toBe('/dashboard');
      expect(result.metadata).toEqual({ key: 'value' });
    });

    it('should create notification with default type INFO', async () => {
      notificationRepository.save = jest.fn().mockResolvedValue(mockNotification);

      const result = await service.create(mockUser, 'Title', 'Message');

      expect(result.type).toBe(NotificationType.INFO);
    });

    it('should create notification without optional params', async () => {
      notificationRepository.save = jest.fn().mockResolvedValue(mockNotification);

      const result = await service.create(mockUser, 'Title', 'Message', NotificationType.WARNING);

      expect(result.link).toBeNull();
      expect(result.metadata).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: expect.any(Date),
      };
      cacheService.getOrSet.mockResolvedValue(mockNotification);
      notificationRepository.save = jest.fn().mockResolvedValue(readNotification as Notification);

      const result = await service.markAsRead(mockUser, 'notification-1');

      expect(result.status).toBe(NotificationStatus.READ);
      expect(result.readAt).toBeDefined();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.markAsRead(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const unreadNotifications = [
        mockNotification,
        { ...mockNotification, id: 'notification-2' },
        { ...mockNotification, id: 'notification-3' },
      ];
      notificationRepository.find.mockResolvedValue(unreadNotifications as Notification[]);
      notificationRepository.save = jest.fn().mockResolvedValue({} as Notification);

      await service.markAllAsRead(mockUser);

      expect(notificationRepository.save).toHaveBeenCalledTimes(3);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: NotificationStatus.UNREAD,
          tenantId: mockUser.tenantId,
        },
      });
    });

    it('should handle when no unread notifications', async () => {
      notificationRepository.find.mockResolvedValue([]);

      await service.markAllAsRead(mockUser);

      expect(notificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should archive notification', async () => {
      const archivedNotification = {
        ...mockNotification,
        status: NotificationStatus.ARCHIVED,
      };
      cacheService.getOrSet.mockResolvedValue(mockNotification);
      notificationRepository.save = jest
        .fn()
        .mockResolvedValue(archivedNotification as Notification);

      const result = await service.archive(mockUser, 'notification-1');

      expect(result.status).toBe(NotificationStatus.ARCHIVED);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.archive(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      cacheService.getOrSet.mockResolvedValue(mockNotification);
      notificationRepository.findOne.mockResolvedValue(mockNotification); // SecureRepository needs this
      notificationRepository.remove = jest.fn().mockResolvedValue(mockNotification);

      // Mock canDelete to return true (SecureRepository checks canDelete, not canWrite)
      permissionService.canDelete = jest.fn().mockReturnValue(true);

      await service.delete(mockUser, 'notification-1');

      expect(notificationRepository.remove).toHaveBeenCalledWith(mockNotification);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.delete(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const unreadNotifications = [
        mockNotification,
        { ...mockNotification, id: 'notification-2' },
        { ...mockNotification, id: 'notification-3' },
      ];
      notificationRepository.find.mockResolvedValue(unreadNotifications as Notification[]);

      const result = await service.getUnreadCount(mockUser);

      expect(result).toBe(3);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: NotificationStatus.UNREAD,
          tenantId: mockUser.tenantId,
        },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      notificationRepository.find.mockResolvedValue([]);

      const result = await service.getUnreadCount(mockUser);

      expect(result).toBe(0);
    });
  });
});
