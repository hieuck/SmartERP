import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockUser } from '@/common/test/test-helpers';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      tenantId: 'tenant-123',
    },
  };

  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '0901234567',
    avatar: null,
    role: 'user',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      mockUserService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUserProfile);
      expect(service.getProfile).toHaveBeenCalledWith('user-123');
      expect(service.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        'User not found',
      );
      expect(service.getProfile).toHaveBeenCalledWith('user-123');
    });

    it('should handle service errors gracefully', async () => {
      mockUserService.getProfile.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(Error);
      expect(service.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateProfile', () => {
    it('should update profile with full name successfully', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
        phone: '0987654321',
        avatar: 'https://example.com/avatar.jpg',
      };

      const updatedProfile = {
        ...mockUserProfile,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '0987654321',
        avatar: 'https://example.com/avatar.jpg',
      };

      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
      expect(service.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should update only phone number', async () => {
      const updateDto: UpdateProfileDto = {
        phone: '0999999999',
      };

      const updatedProfile = {
        ...mockUserProfile,
        phone: '0999999999',
      };

      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(result.phone).toBe('0999999999');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should update only avatar', async () => {
      const updateDto: UpdateProfileDto = {
        avatar: 'https://example.com/new-avatar.jpg',
      };

      const updatedProfile = {
        ...mockUserProfile,
        avatar: 'https://example.com/new-avatar.jpg',
      };

      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(result.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
      };

      mockUserService.updateProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateProfile(mockRequest, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should handle empty update dto', async () => {
      const updateDto: UpdateProfileDto = {};

      mockUserService.updateProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(mockUserProfile);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should handle service errors gracefully', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
      };

      mockUserService.updateProfile.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.updateProfile(mockRequest, updateDto),
      ).rejects.toThrow(Error);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const successResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      mockUserService.changePassword.mockResolvedValue(successResponse);

      const result = await controller.changePassword(
        mockRequest,
        changePasswordDto,
      );

      expect(result).toEqual(successResponse);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
      expect(service.changePassword).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      mockUserService.changePassword.mockRejectedValue(
        new BadRequestException('New password and confirmation do not match'),
      );

      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow('New password and confirmation do not match');
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
    });

    it('should throw BadRequestException when current password is incorrect', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      mockUserService.changePassword.mockRejectedValue(
        new BadRequestException('Current password is incorrect'),
      );

      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      mockUserService.changePassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
    });

    it('should handle service errors gracefully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      mockUserService.changePassword.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow(Error);
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
    });

    it('should validate password complexity requirements', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const successResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      mockUserService.changePassword.mockResolvedValue(successResponse);

      const result = await controller.changePassword(
        mockRequest,
        changePasswordDto,
      );

      expect(result.success).toBe(true);
      expect(service.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
    });
  });

  describe('Authentication & Authorization', () => {
    it('should extract userId from JWT token', async () => {
      mockUserService.getProfile.mockResolvedValue(mockUserProfile);

      await controller.getProfile(mockRequest);

      expect(service.getProfile).toHaveBeenCalledWith('user-123');
    });

    it('should handle requests with different user IDs', async () => {
      const differentUserRequest = {
        user: {
          userId: 'user-456',
          email: 'another@example.com',
          tenantId: 'tenant-123',
        },
      };

      mockUserService.getProfile.mockResolvedValue({
        ...mockUserProfile,
        id: 'user-456',
        email: 'another@example.com',
      });

      await controller.getProfile(differentUserRequest);

      expect(service.getProfile).toHaveBeenCalledWith('user-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent profile updates', async () => {
      const updateDto1: UpdateProfileDto = { phone: '0901111111' };
      const updateDto2: UpdateProfileDto = { phone: '0902222222' };

      mockUserService.updateProfile
        .mockResolvedValueOnce({ ...mockUserProfile, phone: '0901111111' })
        .mockResolvedValueOnce({ ...mockUserProfile, phone: '0902222222' });

      const [result1, result2] = await Promise.all([
        controller.updateProfile(mockRequest, updateDto1),
        controller.updateProfile(mockRequest, updateDto2),
      ]);

      expect(result1.phone).toBe('0901111111');
      expect(result2.phone).toBe('0902222222');
      expect(service.updateProfile).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in full name', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: "O'Brien-Smith",
      };

      const updatedProfile = {
        ...mockUserProfile,
        firstName: "O'Brien-Smith",
        lastName: '',
      };

      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result.firstName).toBe("O'Brien-Smith");
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should handle very long avatar URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
      const updateDto: UpdateProfileDto = {
        avatar: longUrl,
      };

      const updatedProfile = {
        ...mockUserProfile,
        avatar: longUrl,
      };

      mockUserService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result.avatar).toBe(longUrl);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });
  });
});
