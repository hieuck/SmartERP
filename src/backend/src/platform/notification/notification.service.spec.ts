import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationStatus, NotificationType } from './entities/notification.entity';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let cacheService: CacheService;

  const mockNotification: Partial<Notification> = {
    id: 'notif-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Test message',
    type: NotificationType.INFO,
    status: NotificationStatus.UNREAD,
    createdAt: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => where),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all notifications for user', async () => {
      mockRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockNotification]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications for user', async () => {
      mockRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.findUnread(mockUser);

      expect(result).toEqual([mockNotification]);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return notification by id with caching', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);

      const result = await service.findById(mockUser, 'notif-1');

      expect(result).toEqual(mockNotification);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(mockUser, 'notif-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create notification with default type', async () => {
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(mockUser, 'Test Title', 'Test Message');

      expect(result).toEqual(mockNotification);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create notification with custom type and link', async () => {
      const customNotif = {
        ...mockNotification,
        type: NotificationType.WARNING,
        link: '/orders/123',
      };
      mockRepository.save.mockResolvedValue(customNotif);

      const result = await service.create(
        mockUser,
        'Warning',
        'Check this',
        NotificationType.WARNING,
        '/orders/123',
      );

      expect(result).toEqual(customNotif);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create notification with metadata', async () => {
      const metadata = { orderId: '123', amount: 1000 };
      mockRepository.save.mockResolvedValue(mockNotification);

      await service.create(
        mockUser,
        'Order Update',
        'Order processed',
        NotificationType.SUCCESS,
        '/orders/123',
        metadata,
      );

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and invalidate cache', async () => {
      const readNotif = {
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date(),
      };
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);
      mockRepository.save.mockResolvedValue(readNotif);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.markAsRead(mockUser, 'notif-1');

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
      expect(result.status).toBe(NotificationStatus.READ);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockRepository.find.mockResolvedValue([mockNotification]);
      mockRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
      });

      await service.markAllAsRead(mockUser);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should archive notification and invalidate cache', async () => {
      const archivedNotif = { ...mockNotification, status: NotificationStatus.ARCHIVED };
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);
      mockRepository.save.mockResolvedValue(archivedNotif);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.archive(mockUser, 'notif-1');

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
      expect(result.status).toBe(NotificationStatus.ARCHIVED);
    });
  });

  describe('delete', () => {
    it('should delete notification and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);
      mockRepository.findOne.mockResolvedValue(mockNotification);
      mockRepository.remove.mockResolvedValue(mockNotification);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.delete(mockUser, 'notif-1');

      expect(mockRepository.remove).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockRepository.find.mockResolvedValue([mockNotification, mockNotification, mockNotification]);

      const result = await service.getUnreadCount(mockUser);

      expect(result).toBe(3);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});
