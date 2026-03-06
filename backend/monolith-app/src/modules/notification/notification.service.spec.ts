import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CacheService } from '@/common/cache/cache.service';

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

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

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
      mockQueryBuilder.getMany.mockResolvedValue([mockNotification]);

      const result = await service.findAll('tenant-1', 'user-1');

      expect(result).toEqual([mockNotification]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('notification');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.userId = :userId', {
        userId: 'user-1',
      });
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications for user', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockNotification]);

      const result = await service.findUnread('tenant-1', 'user-1');

      expect(result).toEqual([mockNotification]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.status = :status', {
        status: NotificationStatus.UNREAD,
      });
    });
  });

  describe('findById', () => {
    it('should return notification by id with caching', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);

      const result = await service.findById('tenant-1', 'notif-1');

      expect(result).toEqual(mockNotification);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'notif-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create notification with default type', async () => {
      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(
        'tenant-1',
        'user-1',
        'Test Title',
        'Test Message',
      );

      expect(result).toEqual(mockNotification);
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Test Title',
        message: 'Test Message',
        type: NotificationType.INFO,
        link: undefined,
        metadata: undefined,
      });
    });

    it('should create notification with custom type and link', async () => {
      const customNotif = { ...mockNotification, type: NotificationType.WARNING, link: '/orders/123' };
      mockRepository.create.mockReturnValue(customNotif);
      mockRepository.save.mockResolvedValue(customNotif);

      const result = await service.create(
        'tenant-1',
        'user-1',
        'Warning',
        'Check this',
        NotificationType.WARNING,
        '/orders/123',
      );

      expect(result).toEqual(customNotif);
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Warning',
        message: 'Check this',
        type: NotificationType.WARNING,
        link: '/orders/123',
        metadata: undefined,
      });
    });

    it('should create notification with metadata', async () => {
      const metadata = { orderId: '123', amount: 1000 };
      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      await service.create(
        'tenant-1',
        'user-1',
        'Order Update',
        'Order processed',
        NotificationType.SUCCESS,
        '/orders/123',
        metadata,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Order Update',
        message: 'Order processed',
        type: NotificationType.SUCCESS,
        link: '/orders/123',
        metadata,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and invalidate cache', async () => {
      const readNotif = { ...mockNotification, status: NotificationStatus.READ, readAt: new Date() };
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNotification).mockResolvedValueOnce(readNotif);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.markAsRead('tenant-1', 'notif-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'notif-1' },
        expect.objectContaining({
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        }),
      );
      expect(mockCacheService.del).toHaveBeenCalled();
      expect(result).toEqual(readNotif);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead('tenant-1', 'user-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', userId: 'user-1', status: NotificationStatus.UNREAD },
        expect.objectContaining({
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        }),
      );
    });
  });

  describe('archive', () => {
    it('should archive notification and invalidate cache', async () => {
      const archivedNotif = { ...mockNotification, status: NotificationStatus.ARCHIVED };
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNotification).mockResolvedValueOnce(archivedNotif);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.archive('tenant-1', 'notif-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: 'notif-1' },
        { status: NotificationStatus.ARCHIVED },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
      expect(result).toEqual(archivedNotif);
    });
  });

  describe('delete', () => {
    it('should delete notification and invalidate cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.delete('tenant-1', 'notif-1');

      expect(mockRepository.delete).toHaveBeenCalledWith({ tenantId: 'tenant-1', id: 'notif-1' });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('tenant-1', 'user-1');

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', userId: 'user-1', status: NotificationStatus.UNREAD },
      });
    });
  });
});
