import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CacheService } from '@/common/cache/cache.service';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditLog = {
    id: '1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    entityType: 'Product',
    entityId: 'product-1',
    oldValue: null,
    newValue: { name: 'Test Product', price: 100 },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    description: 'Created new product',
    createdAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(
        'tenant-1',
        'user-1',
        AuditAction.CREATE,
        'Product',
        'product-1',
        null,
        { name: 'Test Product', price: 100 },
        '192.168.1.1',
        'Mozilla/5.0',
        'Created new product',
      );

      expect(result).toEqual(mockAuditLog);
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: AuditAction.CREATE,
        entityType: 'Product',
        entityId: 'product-1',
        oldValue: null,
        newValue: { name: 'Test Product', price: 100 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        description: 'Created new product',
      });
    });

    it('should create audit log for UPDATE action', async () => {
      const updateLog = {
        ...mockAuditLog,
        action: AuditAction.UPDATE,
        oldValue: { name: 'Old Product', price: 100 },
        newValue: { name: 'Updated Product', price: 150 },
      };

      mockRepository.create.mockReturnValue(updateLog);
      mockRepository.save.mockResolvedValue(updateLog);

      const result = await service.log(
        'tenant-1',
        'user-1',
        AuditAction.UPDATE,
        'Product',
        'product-1',
        { name: 'Old Product', price: 100 },
        { name: 'Updated Product', price: 150 },
      );

      expect(result.action).toBe(AuditAction.UPDATE);
      expect(result.oldValue).toEqual({ name: 'Old Product', price: 100 });
      expect(result.newValue).toEqual({ name: 'Updated Product', price: 150 });
    });

    it('should create audit log for DELETE action', async () => {
      const deleteLog = {
        ...mockAuditLog,
        action: AuditAction.DELETE,
        oldValue: { name: 'Deleted Product', price: 100 },
        newValue: null,
      };

      mockRepository.create.mockReturnValue(deleteLog);
      mockRepository.save.mockResolvedValue(deleteLog);

      const result = await service.log(
        'tenant-1',
        'user-1',
        AuditAction.DELETE,
        'Product',
        'product-1',
        { name: 'Deleted Product', price: 100 },
        null,
      );

      expect(result.action).toBe(AuditAction.DELETE);
    });

    it('should create audit log without optional fields', async () => {
      const minimalLog = {
        ...mockAuditLog,
        entityId: undefined,
        oldValue: undefined,
        newValue: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        description: undefined,
      };

      mockRepository.create.mockReturnValue(minimalLog);
      mockRepository.save.mockResolvedValue(minimalLog);

      const result = await service.log('tenant-1', 'user-1', AuditAction.CREATE, 'Product');

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: AuditAction.CREATE,
        entityType: 'Product',
        entityId: undefined,
        oldValue: undefined,
        newValue: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        description: undefined,
      });
    });
  });

  describe('findAll', () => {
    it('should return all audit logs for a tenant', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll('tenant-1', startDate, endDate);

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          createdAt: Between(startDate, endDate),
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should filter by userId', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll('tenant-1', undefined, undefined, 'user-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          userId: 'user-1',
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should filter by entityType', async () => {
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findAll('tenant-1', undefined, undefined, undefined, 'Product');

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          entityType: 'Product',
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('should filter by multiple criteria', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRepository.find.mockResolvedValue([mockAuditLog]);

      await service.findAll('tenant-1', startDate, endDate, 'user-1', 'Product');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          createdAt: Between(startDate, endDate),
          userId: 'user-1',
          entityType: 'Product',
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for a specific entity', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByEntity('tenant-1', 'Product', 'product-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          entityType: 'Product',
          entityId: 'product-1',
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByUser('tenant-1', 'user-1');

      expect(result).toEqual([mockAuditLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          userId: 'user-1',
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary', async () => {
      const logs = [
        { ...mockAuditLog, action: AuditAction.CREATE, entityType: 'Product', userId: 'user-1' },
        { ...mockAuditLog, action: AuditAction.CREATE, entityType: 'Order', userId: 'user-1' },
        { ...mockAuditLog, action: AuditAction.UPDATE, entityType: 'Product', userId: 'user-2' },
        { ...mockAuditLog, action: AuditAction.DELETE, entityType: 'Product', userId: 'user-1' },
      ];

      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.find.mockResolvedValue(logs);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getActivitySummary('tenant-1', startDate, endDate);

      expect(result).toEqual({
        total: 4,
        byAction: {
          [AuditAction.CREATE]: 2,
          [AuditAction.UPDATE]: 1,
          [AuditAction.DELETE]: 1,
        },
        byEntityType: {
          Product: 3,
          Order: 1,
        },
        byUser: {
          'user-1': 3,
          'user-2': 1,
        },
      });
    });

    it('should return empty summary for no logs', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      mockRepository.find.mockResolvedValue([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getActivitySummary('tenant-1', startDate, endDate);

      expect(result).toEqual({
        total: 0,
        byAction: {},
        byEntityType: {},
        byUser: {},
      });
    });
  });
});
