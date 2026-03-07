import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission, PermissionAction } from './entities/permission.entity';
import { createMockUser } from '@/common/test/test-helpers';

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

      const result = await controller.create(createDto, mockTenantId);

      expect(result).toEqual(mockPermission);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];
      mockPermissionService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(permissions);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });

    it('should return empty array if no permissions', async () => {
      mockPermissionService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a permission by ID', async () => {
      mockPermissionService.findOne.mockResolvedValue(mockPermission);

      const result = await controller.findOne(mockPermission.id, mockTenantId);

      expect(result).toEqual(mockPermission);
      expect(service.findOne).toHaveBeenCalledWith(mockPermission.id, mockTenantId);
    });
  });

  describe('findByResource', () => {
    it('should return a permission by resource', async () => {
      mockPermissionService.findByResource.mockResolvedValue(mockPermission);

      const result = await controller.findByResource(mockPermission.resource, mockTenantId);

      expect(result).toEqual(mockPermission);
      expect(service.findByResource).toHaveBeenCalledWith(mockPermission.resource, mockTenantId);
    });
  });

  describe('count', () => {
    it('should return permission count', async () => {
      mockPermissionService.count.mockResolvedValue(5);

      const result = await controller.count(mockTenantId);

      expect(result).toBe(5);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });

    it('should return 0 if no permissions', async () => {
      mockPermissionService.count.mockResolvedValue(0);

      const result = await controller.count(mockTenantId);

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

      const result = await controller.update(
        mockPermission.id,
        updateDto,
        mockTenantId,
      );

      expect(result).toEqual(updatedPermission);
      expect(service.update).toHaveBeenCalledWith(
        mockPermission.id,
        updateDto,
        mockTenantId,
      );
    });
  });

  describe('remove', () => {
    it('should delete a permission', async () => {
      mockPermissionService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockPermission.id, mockTenantId);

      expect(result).toEqual({ message: 'Permission deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockPermission.id, mockTenantId);
    });
  });
});
