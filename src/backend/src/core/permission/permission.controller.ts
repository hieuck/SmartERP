import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { User } from '@/common/security/permission.service';
@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create permission' })
  create(@CurrentUser() user: User, @Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(user, createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  findAll(@CurrentUser() user: User) {
    return this.permissionService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get permission count' })
  count(@CurrentUser() user: User) {
    return this.permissionService.count(user);
  }

  @Get('resource/:resource')
  @ApiOperation({ summary: 'Get permission by resource' })
  findByResource(@CurrentUser() user: User, @Param('resource') resource: string) {
    return this.permissionService.findByResource(user, resource);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.permissionService.findOne(user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update permission' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(user, id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.permissionService.remove(user, id);
    return { message: 'Permission deleted successfully' };
  }
}
