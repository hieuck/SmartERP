import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Role } from './entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createRoleDto: CreateRoleDto, tenantId: string, userId?: string): Promise<Role> {
    // Check if role name already exists for this tenant
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Role '${createRoleDto.name}' already exists`);
    }

    // Get permissions if provided
    let permissions: Permission[] = [];
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.findByIds(createRoleDto.permissionIds);

      if (permissions.length !== createRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      // Verify all permissions belong to the same tenant
      const invalidPermissions = permissions.filter((p) => p.tenantId !== tenantId);
      if (invalidPermissions.length > 0) {
        throw new BadRequestException('Some permissions do not belong to this tenant');
      }
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      tenantId,
      permissions,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return await this.roleRepository.save(role);
  }

  async findAll(tenantId: string): Promise<Role[]> {
    const cacheKey = `role:all:${tenantId}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database with query builder
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .select([
        'role.id',
        'role.name',
        'role.description',
        'role.isSystem',
        'role.createdAt',
        'role.updatedAt',
      ])
      .where('role.tenantId = :tenantId', { tenantId })
      .orderBy('role.name', 'ASC')
      .getMany();

    // Store in cache (5 minutes - roles rarely change)
    await this.cacheManager.set(cacheKey, roles, 300000);

    return roles;
  }

  async findOne(id: string, tenantId: string): Promise<Role> {
    const cacheKey = `role:${tenantId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, role, 300000);

    return role;
  }

  async findByName(name: string, tenantId: string): Promise<Role> {
    const cacheKey = `role:${tenantId}:name:${name}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const role = await this.roleRepository.findOne({
      where: { name, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role '${name}' not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, role, 300000);

    return role;
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    tenantId: string,
    userId?: string,
  ): Promise<Role> {
    const role = await this.findOne(id, tenantId);

    // Check if role is system role
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    // Check if new name conflicts
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, tenantId },
      });

      if (existing) {
        throw new ConflictException(`Role '${updateRoleDto.name}' already exists`);
      }
    }

    // Update permissions if provided
    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.findByIds(updateRoleDto.permissionIds);

      if (permissions.length !== updateRoleDto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      // Verify all permissions belong to the same tenant
      const invalidPermissions = permissions.filter((p) => p.tenantId !== tenantId);
      if (invalidPermissions.length > 0) {
        throw new BadRequestException('Some permissions do not belong to this tenant');
      }

      role.permissions = permissions;
    }

    // Update other fields
    if (updateRoleDto.name) role.name = updateRoleDto.name;
    if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;
    role.updatedBy = userId || 'system';

    const updated = await this.roleRepository.save(role);

    // Invalidate caches
    await this.cacheManager.del(`role:${tenantId}:${id}`);
    await this.cacheManager.del(`role:all:${tenantId}`);
    if (role.name) {
      await this.cacheManager.del(`role:${tenantId}:name:${role.name}`);
    }

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const role = await this.findOne(id, tenantId);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.roleRepository.softDelete({ id, tenantId });

    // Invalidate caches
    await this.cacheManager.del(`role:${tenantId}:${id}`);
    await this.cacheManager.del(`role:all:${tenantId}`);
    if (role.name) {
      await this.cacheManager.del(`role:${tenantId}:name:${role.name}`);
    }
  }

  async count(tenantId: string): Promise<number> {
    return await this.roleRepository.count({
      where: { tenantId },
    });
  }

  async addPermissions(id: string, permissionIds: string[], tenantId: string): Promise<Role> {
    const role = await this.findOne(id, tenantId);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    const permissions = await this.permissionRepository.findByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permission IDs are invalid');
    }

    // Verify all permissions belong to the same tenant
    const invalidPermissions = permissions.filter((p) => p.tenantId !== tenantId);
    if (invalidPermissions.length > 0) {
      throw new BadRequestException('Some permissions do not belong to this tenant');
    }

    // Add new permissions (avoid duplicates)
    const existingPermissionIds = role.permissions.map((p) => p.id);
    const newPermissions = permissions.filter((p) => !existingPermissionIds.includes(p.id));
    role.permissions = [...role.permissions, ...newPermissions];

    return await this.roleRepository.save(role);
  }

  async removePermissions(id: string, permissionIds: string[], tenantId: string): Promise<Role> {
    const role = await this.findOne(id, tenantId);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    role.permissions = role.permissions.filter((p) => !permissionIds.includes(p.id));
    return await this.roleRepository.save(role);
  }
}
