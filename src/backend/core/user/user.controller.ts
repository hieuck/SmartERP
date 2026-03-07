import { Controller, Get, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { User } from '@/common/security/permission.service';
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.userId, changePasswordDto);
  }
}
