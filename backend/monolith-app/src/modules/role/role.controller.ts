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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  create(
    @Body() createRoleDto: CreateRoleDto,
    @TenantId() tenantId: string,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.roleService.create(createRoleDto, tenantId, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll(@TenantId() tenantId: string) {
    return this.roleService.findAll(tenantId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get role count' })
  count(@TenantId() tenantId: string) {
    return this.roleService.count(tenantId);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get role by name' })
  findByName(@Param('name') name: string, @TenantId() tenantId: string) {
    return this.roleService.findByName(name, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.roleService.findOne(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @TenantId() tenantId: string,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.roleService.update(id, updateRoleDto, tenantId, req.user?.id);
  }

  @Patch(':id/permissions/add')
  @ApiOperation({ summary: 'Add permissions to role' })
  addPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
    @TenantId() tenantId: string,
  ) {
    return this.roleService.addPermissions(id, body.permissionIds, tenantId);
  }

  @Patch(':id/permissions/remove')
  @ApiOperation({ summary: 'Remove permissions from role' })
  removePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
    @TenantId() tenantId: string,
  ) {
    return this.roleService.removePermissions(id, body.permissionIds, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.roleService.remove(id, tenantId);
    return { message: 'Role deleted successfully' };
  }
}
