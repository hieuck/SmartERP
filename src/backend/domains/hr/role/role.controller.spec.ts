import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Request as ExpressRequest } from 'express';
import { createMockUser } from '@/common/test/test-helpers';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  const mockRole: Role = {
    id: 'role-123',
    tenantId: mockTenantId,
    name: 'Manager',
    description: 'Manager role',
    isSystem: false,
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: mockUserId,
    updatedBy: mockUserId,
  };

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    addPermissions: jest.fn(),
    removePermissions: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a role', async () => {
      const createDto: CreateRoleDto = {
        name: 'Manager',
        description: 'Manager role',
      };

      const mockRequest = {
        user: { id: mockUserId },
      } as ExpressRequest & { user?: { id: string } };

      mockRoleService.create.mockResolvedValue(mockRole);

      const result = await controller.create(createDto, mockTenantId, mockRequest);

      expect(result).toEqual(mockRole);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId, mockUserId);
    });

    it('should create role without user ID if not in request', async () => {
      const createDto: CreateRoleDto = {
        name: 'Manager',
      };

      const mockRequest = {} as ExpressRequest & { user?: { id: string } };

      mockRoleService.create.mockResolvedValue(mockRole);

      await controller.create(createDto, mockTenantId, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId, undefined);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      const roles = [mockRole];
      mockRoleService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(roles);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });

    it('should return empty array if no roles', async () => {
      mockRoleService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a role by ID', async () => {
      mockRoleService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne(mockRole.id, mockTenantId);

      expect(result).toEqual(mockRole);
      expect(service.findOne).toHaveBeenCalledWith(mockRole.id, mockTenantId);
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      mockRoleService.findByName.mockResolvedValue(mockRole);

      const result = await controller.findByName(mockRole.name, mockTenantId);

      expect(result).toEqual(mockRole);
      expect(service.findByName).toHaveBeenCalledWith(mockRole.name, mockTenantId);
    });
  });

  describe('count', () => {
    it('should return role count', async () => {
      mockRoleService.count.mockResolvedValue(5);

      const result = await controller.count(mockTenantId);

      expect(result).toBe(5);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });

    it('should return 0 if no roles', async () => {
      mockRoleService.count.mockResolvedValue(0);

      const result = await controller.count(mockTenantId);

      expect(result).toBe(0);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateDto: UpdateRoleDto = {
        name: 'Senior Manager',
        description: 'Updated description',
      };

      const updatedRole = { ...mockRole, ...updateDto };
      const mockRequest = {
        user: { id: mockUserId },
      } as ExpressRequest & { user?: { id: string } };

      mockRoleService.update.mockResolvedValue(updatedRole);

      const result = await controller.update(
        mockRole.id,
        updateDto,
        mockTenantId,
        mockRequest,
      );

      expect(result).toEqual(updatedRole);
      expect(service.update).toHaveBeenCalledWith(
        mockRole.id,
        updateDto,
        mockTenantId,
        mockUserId,
      );
    });

    it('should update role without user ID if not in request', async () => {
      const updateDto: UpdateRoleDto = {
        description: 'Updated',
      };

      const mockRequest = {} as ExpressRequest & { user?: { id: string } };

      mockRoleService.update.mockResolvedValue(mockRole);

      await controller.update(mockRole.id, updateDto, mockTenantId, mockRequest);

      expect(service.update).toHaveBeenCalledWith(
        mockRole.id,
        updateDto,
        mockTenantId,
        undefined,
      );
    });
  });

  describe('addPermissions', () => {
    it('should add permissions to role', async () => {
      const body = { permissionIds: ['perm-123', 'perm-456'] };
      const roleWithPerms = { ...mockRole, permissions: [] };

      mockRoleService.addPermissions.mockResolvedValue(roleWithPerms);

      const result = await controller.addPermissions(
        mockRole.id,
        body,
        mockTenantId,
      );

      expect(result).toEqual(roleWithPerms);
      expect(service.addPermissions).toHaveBeenCalledWith(
        mockRole.id,
        body.permissionIds,
        mockTenantId,
      );
    });

    it('should handle empty permission array', async () => {
      const body = { permissionIds: [] };

      mockRoleService.addPermissions.mockResolvedValue(mockRole);

      await controller.addPermissions(mockRole.id, body, mockTenantId);

      expect(service.addPermissions).toHaveBeenCalledWith(
        mockRole.id,
        [],
        mockTenantId,
      );
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role', async () => {
      const body = { permissionIds: ['perm-123'] };

      mockRoleService.removePermissions.mockResolvedValue(mockRole);

      const result = await controller.removePermissions(
        mockRole.id,
        body,
        mockTenantId,
      );

      expect(result).toEqual(mockRole);
      expect(service.removePermissions).toHaveBeenCalledWith(
        mockRole.id,
        body.permissionIds,
        mockTenantId,
      );
    });

    it('should handle empty permission array', async () => {
      const body = { permissionIds: [] };

      mockRoleService.removePermissions.mockResolvedValue(mockRole);

      await controller.removePermissions(mockRole.id, body, mockTenantId);

      expect(service.removePermissions).toHaveBeenCalledWith(
        mockRole.id,
        [],
        mockTenantId,
      );
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      mockRoleService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRole.id, mockTenantId);

      expect(result).toEqual({ message: 'Role deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockRole.id, mockTenantId);
    });
  });
});
