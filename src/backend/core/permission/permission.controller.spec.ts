import { createMockUser } from '@/common/test/test-helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission, PermissionAction } from './entities/permission.entity';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: PermissionService;

  const mockTenantId = 'tenant-123';

  const mockPermission: Permission = {
    id: 'perm-123',
    tenantId: mockTenantId,
    resource: 'products',
    actions: [PermissionAction.READ, PermissionAction.CREATE],
    description: 'Manage products',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPermissionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByResource: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    service = module.get<PermissionService>(PermissionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a permission', async () => {
      const createDto: CreatePermissionDto = {
        resource: 'products',
        actions: [PermissionAction.READ, PermissionAction.CREATE],
        description: 'Manage products',
      };

      mockPermissionService.create.mockResolvedValue(mockPermission);

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockPermission);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];
      mockPermissionService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(permissions);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array if no permissions', async () => {
      mockPermissionService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a permission by ID', async () => {
      mockPermissionService.findOne.mockResolvedValue(mockPermission);

      const result = await controller.findOne(mockUser, mockPermission.id);

      expect(result).toEqual(mockPermission);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, mockPermission.id);
    });
  });

  describe('findByResource', () => {
    it('should return a permission by resource', async () => {
      mockPermissionService.findByResource.mockResolvedValue(mockPermission);

      const result = await controller.findByResource(mockUser, mockPermission.resource);

      expect(result).toEqual(mockPermission);
      expect(service.findByResource).toHaveBeenCalledWith(mockUser, mockPermission.resource);
    });
  });

  describe('count', () => {
    it('should return permission count', async () => {
      mockPermissionService.count.mockResolvedValue(5);

      const result = await controller.count(mockUser);

      expect(result).toBe(5);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 if no permissions', async () => {
      mockPermissionService.count.mockResolvedValue(0);

      const result = await controller.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const updateDto: UpdatePermissionDto = {
        description: 'Updated description',
      };

      const updatedPermission = { ...mockPermission, ...updateDto };
      mockPermissionService.update.mockResolvedValue(updatedPermission);

      const result = await controller.update(mockUser, mockPermission.id, updateDto);

      expect(result).toEqual(updatedPermission);
      expect(service.update).toHaveBeenCalledWith(mockUser, mockPermission.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a permission', async () => {
      mockPermissionService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, mockPermission.id);

      expect(result).toEqual({ message: 'Permission deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, mockPermission.id);
    });
  });
});
