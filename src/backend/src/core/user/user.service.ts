import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User as UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly secureUserRepo: SecureRepository<UserEntity>;

  constructor(
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureUserRepo = new SecureRepository(userRepository, permissionService, 'User');
  }

  async getProfile(currentUser: User, userId: string): Promise<Omit<UserEntity, 'password'>> {
    const user = await this.secureUserRepo.findOne(currentUser, {
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...profile } = user;
    return profile;
  }

  async updateProfile(
    currentUser: User,
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Omit<UserEntity, 'password'>> {
    const user = await this.secureUserRepo.findOne(currentUser, {
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.fullName) {
      const nameParts = updateProfileDto.fullName.split(' ');
      user.firstName = nameParts[0];
      user.lastName = nameParts.slice(1).join(' ');
    }

    if (updateProfileDto.phone !== undefined) {
      user.phone = updateProfileDto.phone;
    }

    if (updateProfileDto.avatar !== undefined) {
      user.avatar = updateProfileDto.avatar;
    }

    const updatedUser = await this.secureUserRepo.save(currentUser, user);

    const { password: _, ...profile } = updatedUser;
    return profile;
  }

  async changePassword(
    currentUser: User,
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.secureUserRepo.findOne(currentUser, {
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, SALT_ROUNDS);

    user.password = hashedPassword;
    await this.secureUserRepo.save(currentUser, user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
