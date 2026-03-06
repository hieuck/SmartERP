import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionAction } from './entities/permission.entity';

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: PermissionService;

  const mockPermissionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findByResource: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockPermissionId = 'permission-123';

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create new permission', async () => {
      const createDto: CreatePermissionDto = {
        resource: 'user',
        actions: [PermissionAction.CREATE, PermissionAction.READ],
        description: 'Create user permission',
      };
      const mockCreated = { id: mockPermissionId, ...createDto };
      mockPermissionService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(createDto, mockTenantId);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });
  });

  describe('findAll', () => {
    it('should return all permissions for tenant', async () => {
      const mockPermissions = [
        { id: '1', resource: 'user', actions: [PermissionAction.CREATE] },
        { id: '2', resource: 'user', actions: [PermissionAction.READ] },
      ];
      mockPermissionService.findAll.mockResolvedValue(mockPermissions);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(mockPermissions);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('count', () => {
    it('should return permission count', async () => {
      const mockCount = 25;
      mockPermissionService.count.mockResolvedValue(mockCount);

      const result = await controller.count(mockTenantId);

      expect(result).toEqual(mockCount);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findByResource', () => {
    it('should return permissions for specific resource', async () => {
      const resource = 'user';
      const mockPermissions = [
        { id: '1', resource, actions: [PermissionAction.CREATE] },
        { id: '2', resource, actions: [PermissionAction.READ] },
      ];
      mockPermissionService.findByResource.mockResolvedValue(mockPermissions);

      const result = await controller.findByResource(resource, mockTenantId);

      expect(result).toEqual(mockPermissions);
      expect(service.findByResource).toHaveBeenCalledWith(resource, mockTenantId);
    });
  });

  describe('findOne', () => {
    it('should return permission by id', async () => {
      const mockPermission = {
        id: mockPermissionId,
        resource: 'user',
        actions: [PermissionAction.CREATE],
      };
      mockPermissionService.findOne.mockResolvedValue(mockPermission);

      const result = await controller.findOne(mockPermissionId, mockTenantId);

      expect(result).toEqual(mockPermission);
      expect(service.findOne).toHaveBeenCalledWith(mockPermissionId, mockTenantId);
    });
  });

  describe('update', () => {
    it('should update permission', async () => {
      const updateDto: UpdatePermissionDto = {
        description: 'Updated description',
      };
      const mockUpdated = { id: mockPermissionId, ...updateDto };
      mockPermissionService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(mockPermissionId, updateDto, mockTenantId);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(mockPermissionId, updateDto, mockTenantId);
    });
  });

  describe('remove', () => {
    it('should delete permission', async () => {
      mockPermissionService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockPermissionId, mockTenantId);

      expect(result).toEqual({ message: 'Permission deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockPermissionId, mockTenantId);
    });
  });
});
