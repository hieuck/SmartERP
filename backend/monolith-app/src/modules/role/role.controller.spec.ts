import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findByName: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    addPermissions: jest.fn(),
    removePermissions: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockRoleId = 'role-123';
  const mockRequest = { user: { id: mockUserId } };

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create new role', async () => {
      const createDto: CreateRoleDto = {
        name: 'Admin',
        description: 'Administrator role',
      } as CreateRoleDto;
      const mockCreated = { id: mockRoleId, ...createDto };
      mockRoleService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(createDto, mockTenantId, mockRequest as any);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId, mockUserId);
    });
  });

  describe('findAll', () => {
    it('should return all roles for tenant', async () => {
      const mockRoles = [
        { id: '1', name: 'Admin', description: 'Administrator' },
        { id: '2', name: 'User', description: 'Regular user' },
      ];
      mockRoleService.findAll.mockResolvedValue(mockRoles);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(mockRoles);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('count', () => {
    it('should return role count', async () => {
      const mockCount = 5;
      mockRoleService.count.mockResolvedValue(mockCount);

      const result = await controller.count(mockTenantId);

      expect(result).toEqual(mockCount);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findByName', () => {
    it('should return role by name', async () => {
      const roleName = 'Admin';
      const mockRole = { id: mockRoleId, name: roleName };
      mockRoleService.findByName.mockResolvedValue(mockRole);

      const result = await controller.findByName(roleName, mockTenantId);

      expect(result).toEqual(mockRole);
      expect(service.findByName).toHaveBeenCalledWith(roleName, mockTenantId);
    });
  });

  describe('findOne', () => {
    it('should return role by id', async () => {
      const mockRole = { id: mockRoleId, name: 'Admin' };
      mockRoleService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne(mockRoleId, mockTenantId);

      expect(result).toEqual(mockRole);
      expect(service.findOne).toHaveBeenCalledWith(mockRoleId, mockTenantId);
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      const updateDto: UpdateRoleDto = { description: 'Updated description' };
      const mockUpdated = { id: mockRoleId, ...updateDto };
      mockRoleService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockRoleId, updateDto, mockTenantId, mockRequest as any);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockRoleId, updateDto, mockTenantId, mockUserId);
    });
  });

  describe('addPermissions', () => {
    it('should add permissions to role', async () => {
      const permissionIds = ['perm-1', 'perm-2'];
      const mockUpdated = { id: mockRoleId, permissions: permissionIds };
      mockRoleService.addPermissions.mockResolvedValue(mockUpdated);

      const result = await controller.addPermissions(
        mockRoleId,
        { permissionIds },
        mockTenantId,
      );

      expect(result).toEqual(mockUpdated);
      expect(service.addPermissions).toHaveBeenCalledWith(mockRoleId, permissionIds, mockTenantId);
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role', async () => {
      const permissionIds = ['perm-1'];
      const mockUpdated = { id: mockRoleId, permissions: [] };
      mockRoleService.removePermissions.mockResolvedValue(mockUpdated);

      const result = await controller.removePermissions(
        mockRoleId,
        { permissionIds },
        mockTenantId,
      );

      expect(result).toEqual(mockUpdated);
      expect(service.removePermissions).toHaveBeenCalledWith(mockRoleId, permissionIds, mockTenantId);
    });
  });

  describe('remove', () => {
    it('should delete role', async () => {
      mockRoleService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRoleId, mockTenantId);

      expect(result).toEqual({ message: 'Role deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockRoleId, mockTenantId);
    });
  });
});
