import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('UserService', () => {
  let service: UserService;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '0901234567',
    avatar: null,
    role: 'user',
    status: 'active',
    emailVerified: false,
    emailVerificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Reset mockUser to original state
    Object.assign(mockUser, {
      id: 'user-123',
      tenantId: 'tenant-123',
      email: 'test@example.com',
      password: '$2b$12$hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0901234567',
      avatar: null,
      role: 'user',
      status: 'active',
      emailVerified: false,
      emailVerificationToken: null,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', status: 'active' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
        phone: '0987654321',
        avatar: 'https://example.com/avatar.jpg',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        avatar: 'https://example.com/avatar.jpg',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateDto);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.phone).toBe('0987654321');
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const updateDto: UpdateProfileDto = {
        phone: '0999999999',
      };

      const updatedUser = {
        ...mockUser,
        phone: '0999999999',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', updateDto);

      expect(result.phone).toBe('0999999999');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '0999999999',
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
      };

      await expect(service.updateProfile('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('$2b$12$newhashedpassword'));

      const result = await service.changePassword('user-123', changePasswordDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword',
      };

      await expect(service.changePassword('user-123', changePasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword('user-123', changePasswordDto)).rejects.toThrow(
        'New password and confirmation do not match',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword('non-existent', changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.changePassword('user-123', changePasswordDto)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword('user-123', changePasswordDto)).rejects.toThrow(
        'Current password is incorrect',
      );
    });
  });
});
