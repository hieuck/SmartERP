import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

/* eslint-disable @typescript-eslint/no-unused-vars */
describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    id: '1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashedPassword');
    (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockRepository.findAndCount.mockResolvedValue([[userWithoutPassword], 1]);

      const result = await service.findAll('tenant-1');

      expect(result.data).toEqual([userWithoutPassword]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        select: expect.not.arrayContaining(['password']),
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty('password');
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com', 'tenant-1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      });

      const result = await service.create(createDto, 'tenant-1');

      expect(result).not.toHaveProperty('password');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashedPassword',
        tenantId: 'tenant-1',
        role: 'user',
        status: 'active',
      });
    });

    it('should create user with custom role', async () => {
      const createDto = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...createDto,
        password: 'hashedPassword',
      });

      const result = await service.create(createDto, 'tenant-1');

      expect(result.role).toBe('admin');
    });

    it('should throw ConflictException if email already exists', async () => {
      const createDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { firstName: 'Updated' };
      const { password, ...userWithoutPassword } = mockUser;

      // Mock cache to return user
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.save.mockResolvedValue({
        ...userWithoutPassword,
        ...updateDto,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1');

      expect(result.firstName).toBe('Updated');
      expect(result).not.toHaveProperty('password');
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.changePassword('1', changePasswordDto, 'tenant-1');

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if old password is incorrect', async () => {
      const changePasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('1', changePasswordDto, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const changePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword123',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword('999', changePasswordDto, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update only allowed fields', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'admin', // Should be filtered out
      };

      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.save.mockResolvedValue({
        ...userWithoutPassword,
        firstName: 'Updated',
        lastName: 'Name',
      });

      const result = await service.updateProfile('1', updateData, 'tenant-1');

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.role).toBe('user'); // Should not be changed
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should activate a user', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.save.mockResolvedValue({
        ...userWithoutPassword,
        status: 'active',
      });

      const result = await service.activate('1', 'tenant-1');

      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.save.mockResolvedValue({
        ...userWithoutPassword,
        status: 'inactive',
      });

      const result = await service.deactivate('1', 'tenant-1');

      expect(result.status).toBe('inactive');
    });
  });

  describe('suspend', () => {
    it('should suspend a user', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockCacheService.getOrSet.mockResolvedValue(userWithoutPassword);
      mockRepository.findOne.mockResolvedValue(userWithoutPassword);
      mockRepository.save.mockResolvedValue({
        ...userWithoutPassword,
        status: 'suspended',
      });

      const result = await service.suspend('1', 'tenant-1');

      expect(result.status).toBe('suspended');
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
    });
  });

  describe('findByRole', () => {
    it('should return users by role', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      mockRepository.find.mockResolvedValue([userWithoutPassword]);

      const result = await service.findByRole('admin', 'tenant-1');

      expect(result).toEqual([userWithoutPassword]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: 'admin', tenantId: 'tenant-1' },
        select: expect.not.arrayContaining(['password']),
      });
    });
  });
});
