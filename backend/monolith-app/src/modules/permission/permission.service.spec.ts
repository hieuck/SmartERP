import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';

describe('PermissionService', () => {
  let service: PermissionService;

  const mockPermission = {
    id: '1',
    resource: 'users',
    action: 'read',
    description: 'Read users',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockPermissionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return cached permissions if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockPermission]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockPermission]);
      expect(mockCacheManager.get).toHaveBeenCalledWith('permission:all:tenant-1');
      expect(mockPermissionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getMany.mockResolvedValue([mockPermission]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockPermission]);
      expect(mockPermissionRepository.createQueryBuilder).toHaveBeenCalledWith('permission');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'permission.id',
        'permission.resource',
        'permission.action',
        'permission.description',
        'permission.createdAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permission.resource', 'ASC');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'permission:all:tenant-1',
        [mockPermission],
        300000,
      );
    });
  });

  describe('count', () => {
    it('should return permission count', async () => {
      mockPermissionRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
      expect(mockPermissionRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });
  });
});
