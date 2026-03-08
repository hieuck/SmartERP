import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Cache } from 'cache-manager';
import { PermissionService } from './permission.service';
import { Permission, PermissionAction } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    roles: ['admin'],
  };

  describe('PermissionService', () => {
  let service: PermissionService;
  let repository: Repository<Permission>;
  let cacheManager: Cache;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPermission: Permission = {
    id: '1',
    tenantId: 'tenant1',
    resource: 'products',
    actions: [PermissionAction.CREATE, PermissionAction.READ],
    description: 'Manage products',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    repository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePermissionDto = {
      resource: 'products',
      actions: [PermissionAction.CREATE, PermissionAction.READ],
      description: 'Manage products',
    };

    it('should create a new permission', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockPermission);
      mockRepository.save.mockResolvedValue(mockPermission);

      const result = await service.create(mockUser, createDto);

      expect(result).toEqual(mockPermission);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'products', tenantId: 'tenant1' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant1',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if permission already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockPermission);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        "Permission for resource 'products' already exists",
      );
    });
  });

  describe('findAll', () => {
    it('should return cached permissions', async () => {
      const permissions = [mockPermission];
      mockCacheManager.get.mockResolvedValue(permissions);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(permissions);
      expect(mockCacheManager.get).toHaveBeenCalledWith('permission:all:tenant1');
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache on cache miss', async () => {
      const permissions = [mockPermission];
      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(permissions),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(permissions);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('permission');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission.tenantId = :tenantId', {
        tenantId: 'tenant1',
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith('permission:all:tenant1', permissions, 300000);
    });
  });

  describe('findOne', () => {
    it('should return cached permission', async () => {
      mockCacheManager.get.mockResolvedValue(mockPermission);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockPermission);
      expect(mockCacheManager.get).toHaveBeenCalledWith('permission:tenant1:1');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockPermission);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant1' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith('permission:tenant1:1', mockPermission, 300000);
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, '999')).rejects.toThrow(
        'Permission with ID 999 not found',
      );
    });
  });

  describe('findByIds', () => {
    it('should return permissions by IDs', async () => {
      const permissions = [mockPermission];
      mockRepository.find.mockResolvedValue(permissions);

      const result = await service.findByIds(['1', '2'], 'tenant1');

      expect(result).toEqual(permissions);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: In(['1', '2']), tenantId: 'tenant1' },
      });
    });
  });

  describe('findByResource', () => {
    it('should return cached permission by resource', async () => {
      mockCacheManager.get.mockResolvedValue(mockPermission);

      const result = await service.findByResource(mockUser, 'products');

      expect(result).toEqual(mockPermission);
      expect(mockCacheManager.get).toHaveBeenCalledWith('permission:tenant1:resource:products');
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findByResource(mockUser, 'products');

      expect(result).toEqual(mockPermission);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { resource: 'products', tenantId: 'tenant1' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'permission:tenant1:resource:products',
        mockPermission,
        300000,
      );
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByResource(mockUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByResource(mockUser, 'nonexistent')).rejects.toThrow(
        "Permission for resource 'nonexistent' not found",
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdatePermissionDto = {
      description: 'Updated description',
    };

    it('should update permission', async () => {
      mockCacheManager.get.mockResolvedValue(mockPermission);
      mockRepository.save.mockResolvedValue({ ...mockPermission, ...updateDto });

      const result = await service.update(mockUser, '1', updateDto);

      expect(result.description).toBe('Updated description');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:tenant1:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:all:tenant1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:tenant1:resource:products');
    });

    it('should throw ConflictException if new resource name conflicts', async () => {
      const existingPermission = { ...mockPermission, id: '2' };
      mockCacheManager.get.mockResolvedValue(mockPermission);
      mockRepository.findOne.mockResolvedValue(existingPermission);

      const updateDtoWithResource: UpdatePermissionDto = {
        resource: 'orders',
      };

      await expect(service.update(mockUser, '1', updateDtoWithResource)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(mockUser, '1', updateDtoWithResource)).rejects.toThrow(
        "Permission for resource 'orders' already exists",
      );
    });

    it('should allow updating to same resource name', async () => {
      mockCacheManager.get.mockResolvedValue(mockPermission);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockPermission);

      const updateDtoSameResource: UpdatePermissionDto = {
        resource: 'products',
      };

      const result = await service.update(mockUser, '1', updateDtoSameResource);

      expect(result).toEqual(mockPermission);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete permission and invalidate caches', async () => {
      mockCacheManager.get.mockResolvedValue(mockPermission);
      mockRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockUser, '1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith({ id: '1', tenantId: 'tenant1' });
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:tenant1:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:all:tenant1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('permission:tenant1:resource:products');
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return count of permissions', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.count(mockUser);

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
      });
    });
  });
});
