import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cache } from 'cache-manager';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { createMockUser } from '@/common/test/test-helpers';
import { PermissionService } from '@/common/security/permission.service';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: Repository<Role>;
  let permissionRepository: Repository<Permission>;
  let cacheManager: Cache;

  const mockRoleRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn()
  };

  const mockPermissionRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn((data) => Promise.resolve({ id: '1', ...data })),
    remove: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findByIds: jest.fn()
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canCreate: jest.fn().mockReturnValue(true),
    canUpdate: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, where) => where)
  };

  const mockUser = createMockUser({ id: 'user1', tenantId: 'tenant1' });

  const mockPermission: Permission = {
    id: 'perm1',
    tenantId: 'tenant1',
    name: 'Manage Products',
    description: 'Manage products',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  };

  const mockRole: Role = {
    id: '1',
    tenantId: 'tenant1',
    name: 'Manager',
    description: 'Manager role',
    isSystem: false,
    permissions: [mockPermission],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user1',
    updatedBy: 'user1'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository
  },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository
  },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager
  },
        {
          provide: PermissionService,
          useValue: mockPermissionService
  },
      ]
  }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    permissionRepository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateRoleDto = {
      name: 'Manager',
      description: 'Manager role',
      permissionIds: ['perm1']
  };

    it('should create a new role with permissions', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.findByIds.mockResolvedValue([mockPermission]);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(mockRole);
      expect(mockPermissionRepository.findByIds).toHaveBeenCalledWith(['perm1']);
    });

    it('should create role without permissions', async () => {
      const dtoWithoutPerms: CreateRoleDto = {
        name: 'Manager',
        description: 'Manager role'
  };
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(dtoWithoutPerms, mockUser);

      expect(result).toEqual(mockRole);
      expect(mockPermissionRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if role name exists', async () => {
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        "Role 'Manager' already exists",
      );
    });

    it('should throw BadRequestException if permission IDs are invalid', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.findByIds.mockResolvedValue([]);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        'Some permission IDs are invalid',
      );
    });

    it('should throw BadRequestException if permissions belong to different tenant', async () => {
      const wrongTenantPerm = { ...mockPermission, tenantId: 'tenant2' };
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.findByIds.mockResolvedValue([wrongTenantPerm]);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        'Some permissions do not belong to this tenant',
      );
    });
  });

  describe('findAll', () => {
    it('should return cached roles', async () => {
      const roles = [mockRole];
      mockCacheManager.get.mockResolvedValue(roles);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(roles);
      expect(mockCacheManager.get).toHaveBeenCalledWith('role:all:tenant1');
    });

    it('should fetch from database and cache on cache miss', async () => {
      const roles = [mockRole];
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.find.mockResolvedValue(roles);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(roles);
      expect(mockCacheManager.set).toHaveBeenCalledWith('role:all:tenant1', roles, 300000);
    });
  });

  describe('findOne', () => {
    it('should return cached role', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockRole);
      expect(mockCacheManager.get).toHaveBeenCalledWith('role:tenant1:1');
    });

    it('should fetch from database and cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockRole);
      expect(mockCacheManager.set).toHaveBeenCalledWith('role:tenant1:1', mockRole, 300000);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999', mockUser)).rejects.toThrow(
        'Role with ID 999 not found',
      );
    });
  });

  describe('findByName', () => {
    it('should return cached role by name', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);

      const result = await service.findByName('Manager', mockUser);

      expect(result).toEqual(mockRole);
      expect(mockCacheManager.get).toHaveBeenCalledWith('role:tenant1:name:Manager');
    });

    it('should fetch from database and cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName('Manager', mockUser);

      expect(result).toEqual(mockRole);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'role:tenant1:name:Manager',
        mockRole,
        300000,
      );
    });

    it('should throw NotFoundException if role not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findByName('NonExistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByName('NonExistent', mockUser)).rejects.toThrow(
        "Role 'NonExistent' not found",
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateRoleDto = {
      description: 'Updated description'
  };

    it('should update role', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockRoleRepository.save.mockResolvedValue({ ...mockRole, ...updateDto });

      const result = await service.update('1', updateDto, mockUser);

      expect(result.description).toBe('Updated description');
      expect(mockRoleRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:tenant1:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:all:tenant1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:tenant1:name:Manager');
    });

    it('should throw BadRequestException if role is system role', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      mockCacheManager.get.mockResolvedValue(systemRole);

      await expect(service.update('1', updateDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('1', updateDto, mockUser)).rejects.toThrow(
        'Cannot modify system roles',
      );
    });

    it('should throw ConflictException if new name conflicts', async () => {
      const existingRole = { ...mockRole, id: '2' };
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue(existingRole);

      const updateDtoWithName: UpdateRoleDto = {
        name: 'Admin'
  };

      await expect(service.update('1', updateDtoWithName, mockUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('1', updateDtoWithName, mockUser)).rejects.toThrow(
        "Role 'Admin' already exists",
      );
    });

    it('should update permissions', async () => {
      const newPermission = { ...mockPermission, id: 'perm2' };
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockPermissionRepository.findByIds.mockResolvedValue([newPermission]);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const updateDtoWithPerms: UpdateRoleDto = {
        permissionIds: ['perm2']
  };

      await service.update('1', updateDtoWithPerms, mockUser);

      expect(mockPermissionRepository.findByIds).toHaveBeenCalledWith(['perm2']);
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if permission IDs are invalid', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockPermissionRepository.findByIds.mockResolvedValue([]);

      const updateDtoWithPerms: UpdateRoleDto = {
        permissionIds: ['invalid']
  };

      await expect(service.update('1', updateDtoWithPerms, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if permissions belong to different tenant', async () => {
      const wrongTenantPerm = { ...mockPermission, tenantId: 'tenant2' };
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockPermissionRepository.findByIds.mockResolvedValue([wrongTenantPerm]);

      const updateDtoWithPerms: UpdateRoleDto = {
        permissionIds: ['perm1']
  };

      await expect(service.update('1', updateDtoWithPerms, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete role and invalidate caches', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRoleRepository.remove.mockResolvedValue(mockRole);

      await service.remove('1', mockUser);

      expect(mockRoleRepository.remove).toHaveBeenCalledWith(mockRole);
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:tenant1:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:all:tenant1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('role:tenant1:name:Manager');
    });

    it('should throw BadRequestException if role is system role', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      mockCacheManager.get.mockResolvedValue(systemRole);

      await expect(service.remove('1', mockUser)).rejects.toThrow(BadRequestException);
      await expect(service.remove('1', mockUser)).rejects.toThrow('Cannot delete system roles');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return count of roles', async () => {
      const mockRoles = [mockRole, { ...mockRole, id: '2' }, { ...mockRole, id: '3' }];
      mockRoleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
      expect(mockRoleRepository.find).toHaveBeenCalled();
    });
  });

  describe('addPermissions', () => {
    it('should add new permissions to role', async () => {
      const newPermission = { ...mockPermission, id: 'perm2' };
      const roleWithPerms = { ...mockRole, permissions: [mockPermission] };
      mockCacheManager.get.mockResolvedValue(roleWithPerms);
      mockPermissionRepository.findByIds.mockResolvedValue([newPermission]);
      mockRoleRepository.save.mockResolvedValue({
        ...roleWithPerms,
        permissions: [mockPermission, newPermission]
  });

      const result = await service.addPermissions('1', ['perm2'], mockUser);

      expect(result.permissions).toHaveLength(2);
      expect(mockPermissionRepository.findByIds).toHaveBeenCalledWith(['perm2']);
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should not add duplicate permissions', async () => {
      const roleWithPerms = { ...mockRole, permissions: [mockPermission] };
      mockCacheManager.get.mockResolvedValue(roleWithPerms);
      mockPermissionRepository.findByIds.mockResolvedValue([mockPermission]);
      mockRoleRepository.save.mockResolvedValue(roleWithPerms);

      const result = await service.addPermissions('1', ['perm1'], mockUser);

      expect(result.permissions).toHaveLength(1);
    });

    it('should throw BadRequestException if role is system role', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      mockCacheManager.get.mockResolvedValue(systemRole);

      await expect(service.addPermissions('1', ['perm1'], mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if permission IDs are invalid', async () => {
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockPermissionRepository.findByIds.mockResolvedValue([]);

      await expect(service.addPermissions('1', ['invalid'], mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if permissions belong to different tenant', async () => {
      const wrongTenantPerm = { ...mockPermission, tenantId: 'tenant2' };
      mockCacheManager.get.mockResolvedValue(mockRole);
      mockPermissionRepository.findByIds.mockResolvedValue([wrongTenantPerm]);

      await expect(service.addPermissions('1', ['perm1'], mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role', async () => {
      const perm2 = { ...mockPermission, id: 'perm2' };
      const roleWithPerms = { ...mockRole, permissions: [mockPermission, perm2] };
      mockCacheManager.get.mockResolvedValue(roleWithPerms);
      mockRoleRepository.save.mockResolvedValue({
        ...roleWithPerms,
        permissions: [perm2]
  });

      const result = await service.removePermissions('1', ['perm1'], mockUser);

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].id).toBe('perm2');
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if role is system role', async () => {
      const systemRole = { ...mockRole, isSystem: true };
      mockCacheManager.get.mockResolvedValue(systemRole);

      await expect(service.removePermissions('1', ['perm1'], mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
