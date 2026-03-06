import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController (Unit)', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findByRole: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    updateProfile: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    suspend: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users for tenant', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com', tenantId },
        { id: 'user-2', email: 'user2@example.com', tenantId },
      ];
      mockUserService.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await controller.findAll(tenantId);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledWith(tenantId);
    });

    it('should filter users by role', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const role = 'admin';
      const mockAdmins = [{ id: 'user-1', role: 'admin', tenantId }];
      mockUserService.findByRole.mockResolvedValue(mockAdmins);

      // Act
      const result = await controller.findAll(tenantId, role);

      // Assert
      expect(result).toEqual(mockAdmins);
      expect(service.findByRole).toHaveBeenCalledWith(role, tenantId);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      mockUserService.count.mockResolvedValue(5);

      // Act
      const result = await controller.count(tenantId);

      // Assert
      expect(result).toBe(5);
      expect(service.count).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const mockUser = { id: userId, email: 'test@example.com', tenantId };
      mockUserService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await controller.findOne(userId, tenantId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(userId, tenantId);
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const createDto = {
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };
      const mockCreatedUser = { id: 'user-new', ...createDto, tenantId };
      mockUserService.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.create(createDto as any, tenantId);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(service.create).toHaveBeenCalledWith(createDto, tenantId);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const updateDto = { firstName: 'Updated', lastName: 'Name' };
      const mockUpdatedUser = { id: userId, ...updateDto, tenantId };
      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.update(userId, updateDto as any, tenantId);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(service.update).toHaveBeenCalledWith(userId, updateDto, tenantId);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const changePasswordDto = {
        oldPassword: 'Old123!',
        newPassword: 'New123!',
      };
      const mockResponse = { success: true, message: 'Password changed' };
      mockUserService.changePassword.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.changePassword(
        userId,
        changePasswordDto as any,
        tenantId,
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(service.changePassword).toHaveBeenCalledWith(
        userId,
        changePasswordDto,
        tenantId,
      );
    });
  });

  describe('activate', () => {
    it('should activate user', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const mockUser = { id: userId, status: 'active', tenantId };
      mockUserService.activate.mockResolvedValue(mockUser);

      // Act
      const result = await controller.activate(userId, tenantId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(service.activate).toHaveBeenCalledWith(userId, tenantId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate user', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const mockUser = { id: userId, status: 'inactive', tenantId };
      mockUserService.deactivate.mockResolvedValue(mockUser);

      // Act
      const result = await controller.deactivate(userId, tenantId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(service.deactivate).toHaveBeenCalledWith(userId, tenantId);
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      // Arrange
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      mockUserService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(userId, tenantId);

      // Assert
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(userId, tenantId);
    });
  });
});
