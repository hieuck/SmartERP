import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';

describe('AuditService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: AuditService;
  let auditRepository: jest.Mocked<Repository<AuditLog>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockAuditLog: AuditLog = {
    id: 'audit-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    entityType: 'Product',
    entityId: 'product-1',
    oldValue: null,
    newValue: { name: 'Test Product', price: 100 },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    description: 'Created product',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuditRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
      checkPermission: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepository,
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

    service = module.get<AuditService>(AuditService);
    auditRepository = module.get(getRepositoryToken(AuditLog));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
    void permissionService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log successfully', async () => {
      auditRepository.create.mockReturnValue(mockAuditLog as any);
      auditRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(
        mockUser,
        AuditAction.CREATE,
        'Product',
        'product-1',
        null,
        { name: 'Test Product', price: 100 },
        '127.0.0.1',
        'Mozilla/5.0',
        'Created product',
      );

      expect(result).toEqual(mockAuditLog);
      expect(auditRepository.create).toHaveBeenCalled();
      expect(auditRepository.save).toHaveBeenCalled();
    });

    it('should create log with minimal params', async () => {
      auditRepository.create.mockReturnValue(mockAuditLog as any);
      auditRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(mockUser, AuditAction.UPDATE, 'Product');

      expect(result).toEqual(mockAuditLog);
      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          action: AuditAction.UPDATE,
          entityType: 'Product',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return audit logs', async () => {
      const logs = [mockAuditLog];
      auditRepository.find = jest.fn().mockResolvedValue(logs);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(logs);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      auditRepository.find = jest.fn().mockResolvedValue([mockAuditLog]);

      await service.findAll(mockUser, startDate, endDate);

      expect(auditRepository.find).toHaveBeenCalled();
    });

    it('should filter by userId', async () => {
      auditRepository.find = jest.fn().mockResolvedValue([mockAuditLog]);

      await service.findAll(mockUser, undefined, undefined, 'user-1');

      expect(auditRepository.find).toHaveBeenCalled();
    });

    it('should filter by entityType', async () => {
      auditRepository.find = jest.fn().mockResolvedValue([mockAuditLog]);

      await service.findAll(mockUser, undefined, undefined, undefined, 'Product');

      expect(auditRepository.find).toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('should return logs for specific entity', async () => {
      const logs = [mockAuditLog];
      cacheService.getOrSet = jest.fn().mockImplementation(async (_key, fn) => fn());
      auditRepository.find = jest.fn().mockResolvedValue(logs);

      const result = await service.findByEntity(mockUser, 'Product', 'product-1');

      expect(result).toEqual(logs);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return logs for specific user', async () => {
      const logs = [mockAuditLog];
      cacheService.getOrSet = jest.fn().mockImplementation(async (_key, fn) => fn());
      auditRepository.find = jest.fn().mockResolvedValue(logs);

      const result = await service.findByUser(mockUser, 'user-1');

      expect(result).toEqual(logs);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('getActivitySummary', () => {
    it('should return activity summary', async () => {
      const logs = [
        mockAuditLog,
        { ...mockAuditLog, id: 'audit-2', action: AuditAction.UPDATE },
        { ...mockAuditLog, id: 'audit-3', action: AuditAction.DELETE },
      ];
      cacheService.getOrSet = jest.fn().mockImplementation(async (_key, fn) => fn());
      auditRepository.find = jest.fn().mockResolvedValue(logs);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getActivitySummary(mockUser, startDate, endDate);

      expect(result.total).toBe(3);
      expect(result.byAction[AuditAction.CREATE]).toBe(1);
      expect(result.byAction[AuditAction.UPDATE]).toBe(1);
      expect(result.byAction[AuditAction.DELETE]).toBe(1);
      expect(result.byEntityType['Product']).toBe(3);
      expect(result.byUser['user-1']).toBe(3);
    });

    it('should return empty summary when no logs', async () => {
      cacheService.getOrSet = jest.fn().mockImplementation(async (_key, fn) => fn());
      auditRepository.find = jest.fn().mockResolvedValue([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getActivitySummary(mockUser, startDate, endDate);

      expect(result.total).toBe(0);
      expect(Object.keys(result.byAction).length).toBe(0);
      expect(Object.keys(result.byEntityType).length).toBe(0);
      expect(Object.keys(result.byUser).length).toBe(0);
    });
  });
});
