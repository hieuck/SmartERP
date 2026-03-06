import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotification = {
    id: '1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: NotificationType.INFO,
    status: NotificationStatus.UNREAD,
    link: null,
    metadata: null,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all notifications for a user', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockNotification]);

      const result = await service.findAll('tenant-1', 'user-1');

      expect(result).toEqual([mockNotification]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('notification');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'notification.status',
        'notification.link',
        'notification.readAt',
        'notification.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.userId = :userId', {
        userId: 'user-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should limit results to 50 notifications', async () => {
      const notifications = Array(60).fill(mockNotification);
      mockQueryBuilder.getMany.mockResolvedValue(notifications.slice(0, 50));

      const result = await service.findAll('tenant-1', 'user-1');

      expect(result.length).toBeLessThanOrEqual(50);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });
  });

  describe('findUnread', () => {
    it('should return only unread notifications', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockNotification]);

      const result = await service.findUnread('tenant-1', 'user-1');

      expect(result).toEqual([mockNotification]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('notification');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'notification.status',
        'notification.link',
        'notification.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.userId = :userId', {
        userId: 'user-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.status = :status', {
        status: NotificationStatus.UNREAD,
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
    });
  });

  describe('findById', () => {
    it('should return a notification by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);

      const result = await service.findById('tenant-1', '1');

      expect(result).toEqual(mockNotification);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const createData = {
        title: 'New Notification',
        message: 'New message',
      };

      mockRepository.create.mockReturnValue({
        ...mockNotification,
        ...createData,
      });
      mockRepository.save.mockResolvedValue({
        ...mockNotification,
        ...createData,
      });

      const result = await service.create(
        'tenant-1',
        'user-1',
        createData.title,
        createData.message,
      );

      expect(result.title).toBe('New Notification');
      expect(result.message).toBe('New message');
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: createData.title,
        message: createData.message,
        type: NotificationType.INFO,
        link: undefined,
        metadata: undefined,
      });
    });

    it('should create notification with custom type', async () => {
      mockRepository.create.mockReturnValue({
        ...mockNotification,
        type: NotificationType.SUCCESS,
      });
      mockRepository.save.mockResolvedValue({
        ...mockNotification,
        type: NotificationType.SUCCESS,
      });

      const result = await service.create(
        'tenant-1',
        'user-1',
        'Success',
        'Operation successful',
        NotificationType.SUCCESS,
      );

      expect(result.type).toBe(NotificationType.SUCCESS);
    });

    it('should create notification with link and metadata', async () => {
      const metadata = { orderId: '123' };
      mockRepository.create.mockReturnValue({
        ...mockNotification,
        link: '/orders/123',
        metadata,
      });
      mockRepository.save.mockResolvedValue({
        ...mockNotification,
        link: '/orders/123',
        metadata,
      });

      const result = await service.create(
        'tenant-1',
        'user-1',
        'Order Created',
        'New order created',
        NotificationType.INFO,
        '/orders/123',
        metadata,
      );

      expect(result.link).toBe('/orders/123');
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNotification);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.getOrSet.mockResolvedValueOnce({
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: expect.any(Date),
      });

      await service.markAsRead('tenant-1', '1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: '1' },
        {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead('tenant-1', 'user-1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          tenantId: 'tenant-1',
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
        {
          status: NotificationStatus.READ,
          readAt: expect.any(Date),
        },
      );
    });
  });

  describe('archive', () => {
    it('should archive a notification', async () => {
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNotification);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);
      mockCacheService.getOrSet.mockResolvedValueOnce({
        ...mockNotification,
        status: NotificationStatus.ARCHIVED,
      });

      await service.archive('tenant-1', '1');

      expect(mockRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', id: '1' },
        { status: NotificationStatus.ARCHIVED },
      );
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.archive('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockNotification);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.delete('tenant-1', '1');

      expect(mockRepository.delete).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        id: '1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('tenant-1', 'user-1');

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          status: NotificationStatus.UNREAD,
        },
      });
    });

    it('should return 0 if no unread notifications', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('tenant-1', 'user-1');

      expect(result).toBe(0);
    });
  });
});
