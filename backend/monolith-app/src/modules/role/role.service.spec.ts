import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';

describe('RoleService', () => {
  let service: RoleService;

  const mockRole = {
    id: '1',
    name: 'Admin',
    description: 'Administrator role',
    tenantId: 'tenant-1',
    isSystem: false,
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRoleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    findByIds: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockPermissionRepository = {
    findByIds: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
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

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return cached roles if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockRole]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockRole]);
      expect(mockCacheManager.get).toHaveBeenCalledWith('role:all:tenant-1');
      expect(mockRoleRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getMany.mockResolvedValue([mockRole]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockRole]);
      expect(mockRoleRepository.createQueryBuilder).toHaveBeenCalledWith('role');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'role.id',
        'role.name',
        'role.description',
        'role.isSystem',
        'role.createdAt',
        'role.updatedAt',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('role.name', 'ASC');
      expect(mockCacheManager.set).toHaveBeenCalledWith('role:all:tenant-1', [mockRole], 300000);
    });
  });

  describe('count', () => {
    it('should return role count', async () => {
      mockRoleRepository.count.mockResolvedValue(5);

      const result = await service.count('tenant-1');

      expect(result).toBe(5);
      expect(mockRoleRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });
  });
});
