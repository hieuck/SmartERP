import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: 'Create permission' })
  create(@Body() createPermissionDto: CreatePermissionDto, @TenantId() tenantId: string) {
    return this.permissionService.create(createPermissionDto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  findAll(@TenantId() tenantId: string) {
    return this.permissionService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get permission count' })
  count(@TenantId() tenantId: string) {
    return this.permissionService.count(tenantId);
  }

  @Get('resource/:resource')
  @ApiOperation({ summary: 'Get permission by resource' })
  findByResource(@Param('resource') resource: string, @TenantId() tenantId: string) {
    return this.permissionService.findByResource(resource, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.permissionService.findOne(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update permission' })
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @TenantId() tenantId: string,
  ) {
    return this.permissionService.update(id, updatePermissionDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.permissionService.remove(id, tenantId);
    return { message: 'Permission deleted successfully' };
  }
}
