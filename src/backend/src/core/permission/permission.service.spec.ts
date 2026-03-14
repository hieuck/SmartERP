import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository, In } from 'typeorm';
import { User } from '@/common/security/permission.service';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionAction } from './enums/permission-action.enum';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let cacheManager: jest.Mocked<Cache>;

  const mockCurrentUser: User = {
    id: 'current-user-id',
    tenantId: 'test-tenant-id',
    roles: ['admin'],
  };

  const createMockPermission = (overrides?: Partial<Permission>): Permission => {
    return {
      id: 'permission-1',
      resource: 'users',
      actions: [PermissionAction.READ],
      description: 'Read users',
      tenantId: 'test-tenant-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Permission;
  };

  beforeEach(async () => {
    const mockPermissionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

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
    permissionRepository = module.get(getRepositoryToken(Permission));
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create permission successfully', async () => {
      const createDto: CreatePermissionDto = {
        resource: 'products',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        description: 'Create products',
      };

      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(createDto as any);
      permissionRepository.save.mockResolvedValue({
        id: 'permission-1',
        ...createDto,
        tenantId: 'test-tenant-id',
      } as any);

      const result = await service.create(mockCurrentUser, createDto);

      expect(result.resource).toBe('products');
      expect(result.actions).toEqual([PermissionAction.CREATE, PermissionAction.READ]);
      expect(result.tenantId).toBe('test-tenant-id');
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'products', tenantId: 'test-tenant-id' },
      });
    });

    it('should throw ConflictException when permission already exists', async () => {
      const createDto: CreatePermissionDto = {
        resource: 'products',
        actions: [PermissionAction.CREATE],
        description: 'Create products',
      };

      permissionRepository.findOne.mockResolvedValue(createMockPermission());

      await expect(service.create(mockCurrentUser, createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCurrentUser, createDto)).rejects.toThrow(
        "Permission for resource 'products' already exists",
      );
    });

    it('should include tenantId from current user', async () => {
      const createDto: CreatePermissionDto = {
        resource: 'orders',
        actions: [PermissionAction.READ],
        description: 'Read orders',
      };

      permissionRepository.findOne.mockResolvedValue(null);
      permissionRepository.create.mockReturnValue(createDto as any);
      permissionRepository.save.mockResolvedValue({
        id: 'permission-1',
        ...createDto,
        tenantId: 'test-tenant-id',
      } as any);

      await service.create(mockCurrentUser, createDto);

      expect(permissionRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'test-tenant-id',
      });
    });
  });

  describe('findAll', () => {
    it('should return permissions from cache if available', async () => {
      const mockPermissions = [
        createMockPermission({ id: 'permission-1' }),
        createMockPermission({ id: 'permission-2' }),
      ];

      cacheManager.get.mockResolvedValue(mockPermissions);

      const result = await service.findAll(mockCurrentUser);

      expect(result).toEqual(mockPermissions);
      expect(cacheManager.get).toHaveBeenCalledWith('permission:all:test-tenant-id');
      expect(permissionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockPermissions = [
        createMockPermission({ id: 'permission-1' }),
        createMockPermission({ id: 'permission-2' }),
      ];

      cacheManager.get.mockResolvedValue(null);
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissions),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockCurrentUser);

      expect(result).toEqual(mockPermissions);
      expect(queryBuilder.where).toHaveBeenCalledWith('permission.tenantId = :tenantId', {
        tenantId: 'test-tenant-id',
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'permission:all:test-tenant-id',
        mockPermissions,
        300000,
      );
    });

    it('should order permissions by resource', async () => {
      cacheManager.get.mockResolvedValue(null);
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.findAll(mockCurrentUser);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('permission.resource', 'ASC');
    });

    it('should return empty array when no permissions exist', async () => {
      cacheManager.get.mockResolvedValue(null);
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findAll(mockCurrentUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return permission from cache if available', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1' });
      cacheManager.get.mockResolvedValue(mockPermission);

      const result = await service.findOne(mockCurrentUser, 'permission-1');

      expect(result).toEqual(mockPermission);
      expect(cacheManager.get).toHaveBeenCalledWith('permission:test-tenant-id:permission-1');
      expect(permissionRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1' });

      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findOne(mockCurrentUser, 'permission-1');

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'permission-1', tenantId: 'test-tenant-id' },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'permission:test-tenant-id:permission-1',
        mockPermission,
        300000,
      );
    });

    it('should throw NotFoundException when permission not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCurrentUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockCurrentUser, 'non-existent')).rejects.toThrow(
        'Permission with ID non-existent not found',
      );
    });

    it('should filter by tenantId', async () => {
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(null);

      await service.findOne(mockCurrentUser, 'permission-1').catch(() => {});

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'permission-1', tenantId: 'test-tenant-id' },
      });
    });
  });

  describe('findByIds', () => {
    it('should return permissions by ids', async () => {
      const mockPermissions = [
        createMockPermission({ id: 'permission-1' }),
        createMockPermission({ id: 'permission-2' }),
      ];

      permissionRepository.find.mockResolvedValue(mockPermissions);

      const result = await service.findByIds(['permission-1', 'permission-2'], 'test-tenant-id');

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(['permission-1', 'permission-2']), tenantId: 'test-tenant-id' },
      });
    });

    it('should return empty array when no ids match', async () => {
      permissionRepository.find.mockResolvedValue([]);

      const result = await service.findByIds(['non-existent'], 'test-tenant-id');

      expect(result).toEqual([]);
    });

    it('should filter by tenantId', async () => {
      permissionRepository.find.mockResolvedValue([]);

      await service.findByIds(['permission-1'], 'tenant-123');

      expect(permissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(['permission-1']), tenantId: 'tenant-123' },
      });
    });
  });

  describe('findByResource', () => {
    it('should return permission from cache if available', async () => {
      const mockPermission = createMockPermission({ resource: 'products' });
      cacheManager.get.mockResolvedValue(mockPermission);

      const result = await service.findByResource(mockCurrentUser, 'products');

      expect(result).toEqual(mockPermission);
      expect(cacheManager.get).toHaveBeenCalledWith(
        'permission:test-tenant-id:resource:products',
      );
    });

    it('should fetch from database and cache when cache miss', async () => {
      const mockPermission = createMockPermission({ resource: 'products' });

      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findByResource(mockCurrentUser, 'products');

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'products', tenantId: 'test-tenant-id' },
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'permission:test-tenant-id:resource:products',
        mockPermission,
        300000,
      );
    });

    it('should throw NotFoundException when resource not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(service.findByResource(mockCurrentUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByResource(mockCurrentUser, 'non-existent')).rejects.toThrow(
        "Permission for resource 'non-existent' not found",
      );
    });
  });

  describe('update', () => {
    it('should update permission successfully', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });
      const updateDto: UpdatePermissionDto = {
        description: 'Updated description',
      };

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.save.mockResolvedValue({ ...mockPermission, ...updateDto });

      const result = await service.update(mockCurrentUser, 'permission-1', updateDto);

      expect(result.description).toBe('Updated description');
      expect(permissionRepository.save).toHaveBeenCalled();
    });

    it('should check for resource conflicts when updating resource', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });
      const updateDto: UpdatePermissionDto = {
        resource: 'orders',
      };

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.findOne.mockResolvedValue(null); // No conflict
      permissionRepository.save.mockResolvedValue({ ...mockPermission, ...updateDto });

      await service.update(mockCurrentUser, 'permission-1', updateDto);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'orders', tenantId: 'test-tenant-id' },
      });
    });

    it('should throw ConflictException when new resource already exists', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });
      const updateDto: UpdatePermissionDto = {
        resource: 'orders',
      };

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.findOne.mockResolvedValue({ id: 'other-permission' } as any);

      await expect(
        service.update(mockCurrentUser, 'permission-1', updateDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockCurrentUser, 'permission-1', updateDto),
      ).rejects.toThrow("Permission for resource 'orders' already exists");
    });

    it('should invalidate all related caches after update', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });
      const updateDto: UpdatePermissionDto = {
        description: 'Updated',
      };

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.save.mockResolvedValue({ ...mockPermission, ...updateDto });

      await service.update(mockCurrentUser, 'permission-1', updateDto);

      expect(cacheManager.del).toHaveBeenCalledWith('permission:test-tenant-id:permission-1');
      expect(cacheManager.del).toHaveBeenCalledWith('permission:all:test-tenant-id');
      expect(cacheManager.del).toHaveBeenCalledWith(
        'permission:test-tenant-id:resource:products',
      );
    });

    it('should allow updating same resource name', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });
      const updateDto: UpdatePermissionDto = {
        resource: 'products',
        description: 'Updated',
      };

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.save.mockResolvedValue({ ...mockPermission, ...updateDto });

      await service.update(mockCurrentUser, 'permission-1', updateDto);

      // Should not check for conflicts when resource name unchanged
      expect(permissionRepository.findOne).toHaveBeenCalledTimes(0);
    });
  });

  describe('remove', () => {
    it('should soft delete permission successfully', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(mockCurrentUser, 'permission-1');

      expect(permissionRepository.softDelete).toHaveBeenCalledWith({
        id: 'permission-1',
        tenantId: 'test-tenant-id',
      });
    });

    it('should invalidate all related caches after remove', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1', resource: 'products' });

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(mockCurrentUser, 'permission-1');

      expect(cacheManager.del).toHaveBeenCalledWith('permission:test-tenant-id:permission-1');
      expect(cacheManager.del).toHaveBeenCalledWith('permission:all:test-tenant-id');
      expect(cacheManager.del).toHaveBeenCalledWith(
        'permission:test-tenant-id:resource:products',
      );
    });

    it('should throw NotFoundException when permission not found', async () => {
      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockCurrentUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter by tenantId when deleting', async () => {
      const mockPermission = createMockPermission({ id: 'permission-1' });

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(mockCurrentUser, 'permission-1');

      expect(permissionRepository.softDelete).toHaveBeenCalledWith({
        id: 'permission-1',
        tenantId: 'test-tenant-id',
      });
    });
  });

  describe('count', () => {
    it('should return permission count for tenant', async () => {
      permissionRepository.count.mockResolvedValue(15);

      const result = await service.count(mockCurrentUser);

      expect(result).toBe(15);
      expect(permissionRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant-id' },
      });
    });

    it('should return 0 when no permissions exist', async () => {
      permissionRepository.count.mockResolvedValue(0);

      const result = await service.count(mockCurrentUser);

      expect(result).toBe(0);
    });

    it('should filter by tenantId', async () => {
      const customUser: User = {
        ...mockCurrentUser,
        tenantId: 'custom-tenant-id',
      };

      permissionRepository.count.mockResolvedValue(5);

      await service.count(customUser);

      expect(permissionRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'custom-tenant-id' },
      });
    });
  });

  describe('cache behavior', () => {
    it('should use 5 minute TTL for cache', async () => {
      const mockPermission = createMockPermission();

      cacheManager.get.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await service.findOne(mockCurrentUser, 'permission-1');

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        mockPermission,
        300000, // 5 minutes in milliseconds
      );
    });

    it('should invalidate multiple cache keys on update', async () => {
      const mockPermission = createMockPermission({ resource: 'products' });

      cacheManager.get.mockResolvedValue(mockPermission);
      permissionRepository.save.mockResolvedValue(mockPermission);

      await service.update(mockCurrentUser, 'permission-1', { description: 'Updated' });

      expect(cacheManager.del).toHaveBeenCalledTimes(3);
    });
  });
});
