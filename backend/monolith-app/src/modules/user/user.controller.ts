import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@TenantId() tenantId: string, @Query('role') role?: string) {
    if (role) {
      return this.userService.findByRole(role, tenantId);
    }
    return this.userService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get user count' })
  count(@TenantId() tenantId: string) {
    return this.userService.count(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() createUserDto: CreateUserDto, @TenantId() tenantId: string) {
    return this.userService.create(createUserDto, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TenantId() tenantId: string,
  ) {
    return this.userService.update(id, updateUserDto, tenantId);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Change user password' })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @TenantId() tenantId: string,
  ) {
    return this.userService.changePassword(id, changePasswordDto, tenantId);
  }

  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TenantId() tenantId: string,
  ) {
    return this.userService.updateProfile(id, updateUserDto, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate user' })
  activate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.activate(id, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.deactivate(id, tenantId);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  suspend(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.suspend(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.userService.remove(id, tenantId);
  }
}
