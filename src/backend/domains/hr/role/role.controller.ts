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
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/common/security/permission.service';
@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  create(
    @CurrentUser() user: User, @Body() createRoleDto: CreateRoleDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.roleService.create(createRoleDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll(@CurrentUser() user: User) {
    return this.roleService.findAll(user);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get role count' })
  count(@CurrentUser() user: User) {
    return this.roleService.count(user);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get role by name' })
  findByName(@CurrentUser() user: User, @Param('name') name: string) {
    return this.roleService.findByName(name, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.roleService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User, @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: ExpressRequest & { user?: { id: string } },
  ) {
    return this.roleService.update(id, updateRoleDto, user);
  }

  @Patch(':id/permissions/add')
  @ApiOperation({ summary: 'Add permissions to role' })
  addPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser() user: User,
  ) {
    return this.roleService.addPermissions(id, body.permissionIds, user);
  }

  @Patch(':id/permissions/remove')
  @ApiOperation({ summary: 'Remove permissions from role' })
  removePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser() user: User,
  ) {
    return this.roleService.removePermissions(id, body.permissionIds, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.roleService.remove(id, user);
    return { message: 'Role deleted successfully' };
  }
}
