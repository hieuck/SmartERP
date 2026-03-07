import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create permission' })
  create(@Body() createPermissionDto: CreatePermissionDto, @CurrentUser() user: User) {
    return this.permissionService.create(createPermissionDto, user);
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
  findByResource(@Param('resource') resource: string, @CurrentUser() user: User) {
    return this.permissionService.findByResource(resource, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.permissionService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update permission' })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: User,
  ) {
    return this.permissionService.update(id, updatePermissionDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.permissionService.remove(id, user);
    return { message: 'Permission deleted successfully' };
  }
}
