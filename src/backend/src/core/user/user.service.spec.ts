import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { UserService } from './user.service';
import { User as UserEntity } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { createMockUser } from '@/test/factories/user.factory';

describe('UserService', () => {
  let service: UserService;
  let _userRepository: jest.Mocked<Repository<UserEntity>>;
  let _permissionService: jest.Mocked<PermissionService>;
  let secureUserRepo: jest.Mocked<SecureRepository<UserEntity>>;

  const mockCurrentUser: User = {
    id: 'current-user-id',
    tenantId: 'test-tenant-id',
    roles: ['admin'],
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
    };

    const mockPermissionService = {
      hasPermission: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    permissionService = module.get(PermissionService);

    // Mock SecureRepository methods
    secureUserRepo = (service as any).secureUserRepo;
    secureUserRepo.findOne = jest.fn();
    secureUserRepo.save = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });
      secureUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockCurrentUser, 'user-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect((result as any).password).toBeUndefined();
      expect(secureUserRepo.findOne).toHaveBeenCalledWith(mockCurrentUser, {
        where: { id: 'user-123', status: 'active' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      secureUserRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile(mockCurrentUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfile(mockCurrentUser, 'non-existent')).rejects.toThrow(
        'User not found',
      );
    });

    it('should only return active users', async () => {
      secureUserRepo.findOne.mockResolvedValue(null);

      await service.getProfile(mockCurrentUser, 'inactive-user').catch(() => {});

      expect(secureUserRepo.findOne).toHaveBeenCalledWith(mockCurrentUser, {
        where: { id: 'inactive-user', status: 'active' },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const updateDto: UpdateProfileDto = {
        fullName: 'John Doe',
        phone: '+84901234567',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue({
        ...mockUser,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+84901234567',
      });

      const result = await service.updateProfile(mockCurrentUser, 'user-123', updateDto);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.phone).toBe('+84901234567');
      expect((result as any).password).toBeUndefined();
    });

    it('should split fullName into firstName and lastName', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const updateDto: UpdateProfileDto = {
        fullName: 'John Michael Doe',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue({
        ...mockUser,
        firstName: 'John',
        lastName: 'Michael Doe',
      });

      await service.updateProfile(mockCurrentUser, 'user-123', updateDto);

      expect(mockUser.firstName).toBe('John');
      expect(mockUser.lastName).toBe('Michael Doe');
    });

    it('should update avatar when provided', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const updateDto: UpdateProfileDto = {
        avatar: 'https://example.com/avatar.jpg',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue({
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      });

      const result = await service.updateProfile(mockCurrentUser, 'user-123', updateDto);

      expect(result.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should throw NotFoundException when user not found', async () => {
      secureUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(mockCurrentUser, 'non-existent', { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty fullName', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const updateDto: UpdateProfileDto = {
        phone: '+84901234567',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue(mockUser);

      await service.updateProfile(mockCurrentUser, 'user-123', updateDto);

      // firstName and lastName should not be modified
      expect(secureUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        password: '$2b$12$oldHashedPassword',
      });

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$12$newHashedPassword' as never);

      const result = await service.changePassword(mockCurrentUser, 'user-123', changePasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', '$2b$12$oldHashedPassword');
      expect(hashSpy).toHaveBeenCalledWith('newPassword456', 12);
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword',
      };

      await expect(
        service.changePassword(mockCurrentUser, 'user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockCurrentUser, 'user-123', changePasswordDto),
      ).rejects.toThrow('New password and confirmation do not match');
    });

    it('should throw NotFoundException when user not found', async () => {
      secureUserRepo.findOne.mockResolvedValue(null);

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      await expect(
        service.changePassword(mockCurrentUser, 'non-existent', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        password: '$2b$12$oldHashedPassword',
      });

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword(mockCurrentUser, 'user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockCurrentUser, 'user-123', changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should use 12 salt rounds for password hashing', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        password: '$2b$12$oldHashedPassword',
      });

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      secureUserRepo.findOne.mockResolvedValue(mockUser);
      secureUserRepo.save.mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2b$12$newHashedPassword' as never);

      await service.changePassword(mockCurrentUser, 'user-123', changePasswordDto);

      expect(hashSpy).toHaveBeenCalledWith('newPassword456', 12);
    });
  });
});
