import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
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

    const updatedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = updatedUser;
    return profile;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, status: 'active' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const SALT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, SALT_ROUNDS);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
