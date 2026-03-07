import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;
  let cacheService: CacheService;

  const mockAuditLog: Partial<AuditLog> = {
    id: 'audit-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    entityType: 'Product',
    entityId: 'product-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('log', () => {
    it('should create audit log', async () => {
      jest.spyOn(repository, 'create').mockReturnValue(mockAuditLog as AuditLog);
      jest.spyOn(repository, 'save').mockResolvedValue(mockAuditLog as AuditLog);

      const result = await service.log(
        mockUser,
        'user-1',
        AuditAction.CREATE,
        'Product',
        'product-1',
      );

      expect(result).toEqual(mockAuditLog);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create audit log with all optional parameters', async () => {
      const fullAuditLog = {
        ...mockAuditLog,
        oldValue: { name: 'Old Product' },
        newValue: { name: 'New Product' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        description: 'Product updated',
      };
      jest.spyOn(repository, 'create').mockReturnValue(fullAuditLog as AuditLog);
      jest.spyOn(repository, 'save').mockResolvedValue(fullAuditLog as AuditLog);

      const result = await service.log(
        mockUser,
        'user-1',
        AuditAction.UPDATE,
        'Product',
        'product-1',
        { name: 'Old Product' },
        { name: 'New Product' },
        '192.168.1.1',
        'Mozilla/5.0',
        'Product updated',
      );

      expect(result).toEqual(fullAuditLog);
      expect(repository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: AuditAction.UPDATE,
        entityType: 'Product',
        entityId: 'product-1',
        oldValue: { name: 'Old Product' },
        newValue: { name: 'New Product' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        description: 'Product updated',
      });
    });
  });

  describe('findAll', () => {
    it('should return all audit logs for tenant', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);

      await service.findAll(mockUser, startDate, endDate);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: Between(startDate, endDate),
          }),
        }),
      );
    });

    it('should filter by userId', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);

      await service.findAll(mockUser, undefined, undefined, 'user-1');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            userId: 'user-1',
          }),
        }),
      );
    });

    it('should filter by entityType', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);

      await service.findAll(mockUser, undefined, undefined, undefined, 'Product');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            entityType: 'Product',
          }),
        }),
      );
    });

    it('should filter by all parameters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);

      await service.findAll(mockUser, startDate, endDate, 'user-1', 'Product');

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            createdAt: Between(startDate, endDate),
            userId: 'user-1',
            entityType: 'Product',
          }),
        }),
      );
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockAuditLog as AuditLog]);

      const result = await service.findByEntity(mockUser, 'Product', 'product-1');

      expect(result).toHaveLength(1);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from repository on cache miss', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, factory) => {
        return factory();
      });

      const result = await service.findByEntity(mockUser, 'Product', 'product-1');

      expect(result).toHaveLength(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', entityType: 'Product', entityId: 'product-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for specific user', async () => {
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([mockAuditLog as AuditLog]);

      const result = await service.findByUser(mockUser, 'user-1');

      expect(result).toHaveLength(1);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from repository on cache miss', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAuditLog as AuditLog]);
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, factory) => {
        return factory();
      });

      const result = await service.findByUser(mockUser, 'user-1');

      expect(result).toHaveLength(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary', async () => {
      const mockSummary = {
        total: 1,
        byAction: { [AuditAction.CREATE]: 1 } as Record<AuditAction, number>,
        byEntityType: { Product: 1 },
        byUser: { 'user-1': 1 },
      };
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(mockSummary);

      const result = await service.getActivitySummary(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(result.total).toBe(1);
      expect(result.byAction[AuditAction.CREATE]).toBe(1);
    });

    it('should calculate summary from repository on cache miss', async () => {
      const mockLogs = [
        { ...mockAuditLog, action: AuditAction.CREATE, entityType: 'Product', userId: 'user-1' },
        { ...mockAuditLog, action: AuditAction.UPDATE, entityType: 'Product', userId: 'user-1' },
        { ...mockAuditLog, action: AuditAction.CREATE, entityType: 'Order', userId: 'user-2' },
        { ...mockAuditLog, action: AuditAction.DELETE, entityType: 'Order', userId: 'user-2' },
      ] as AuditLog[];

      jest.spyOn(repository, 'find').mockResolvedValue(mockLogs);
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (key, factory) => {
        return factory();
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = await service.getActivitySummary(mockUser, startDate, endDate);

      expect(result.total).toBe(4);
      expect(result.byAction[AuditAction.CREATE]).toBe(2);
      expect(result.byAction[AuditAction.UPDATE]).toBe(1);
      expect(result.byAction[AuditAction.DELETE]).toBe(1);
      expect(result.byEntityType['Product']).toBe(2);
      expect(result.byEntityType['Order']).toBe(2);
      expect(result.byUser['user-1']).toBe(2);
      expect(result.byUser['user-2']).toBe(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          createdAt: Between(startDate, endDate),
        },
      });
    });
  });
});
