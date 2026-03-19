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
import { Permission } from '../../../core/permission/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class RoleService {
  private secureRoleRepo: SecureRepository<Role>;

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly permissionService: PermissionService,
  ) {
    this.secureRoleRepo = new SecureRepository(roleRepository, permissionService, 'Role');
  }

  async create(createRoleDto: CreateRoleDto, user: User): Promise<Role> {
    // Check if role name already exists for this tenant
    const existing = await this.secureRoleRepo.findOne(user, {
      where: { name: createRoleDto.name },
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
      const invalidPermissions = permissions.filter((p) => p.tenantId !== user.tenantId);
      if (invalidPermissions.length > 0) {
        throw new BadRequestException('Some permissions do not belong to this tenant');
      }
    }

    const role = {
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissions,
    };

    return await this.secureRoleRepo.save(user, role);
  }

  async findAll(user: User): Promise<Role[]> {
    const cacheKey = `role:all:${user.tenantId}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const roles = await this.secureRoleRepo.find(user, {
      order: { name: 'ASC' },
    });

    // Store in cache (5 minutes - roles rarely change)
    await this.cacheManager.set(cacheKey, roles, 300000);

    return roles;
  }

  async findOne(id: string, user: User): Promise<Role> {
    const cacheKey = `role:${user.tenantId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const role = await this.secureRoleRepo.findOne(user, {
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, role, 300000);

    return role;
  }

  async findByName(name: string, user: User): Promise<Role> {
    const cacheKey = `role:${user.tenantId}:name:${name}`;

    // Try cache first
    const cached = await this.cacheManager.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const role = await this.secureRoleRepo.findOne(user, {
      where: { name },
    });

    if (!role) {
      throw new NotFoundException(`Role '${name}' not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, role, 300000);

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: User): Promise<Role> {
    const role = await this.findOne(id, user);

    // Check if role is system role
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    // Check if new name conflicts
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.secureRoleRepo.findOne(user, {
        where: { name: updateRoleDto.name },
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
      const invalidPermissions = permissions.filter((p) => p.tenantId !== user.tenantId);
      if (invalidPermissions.length > 0) {
        throw new BadRequestException('Some permissions do not belong to this tenant');
      }

      role.permissions = permissions;
    }

    // Update other fields
    if (updateRoleDto.name) role.name = updateRoleDto.name;
    if (updateRoleDto.description !== undefined) role.description = updateRoleDto.description;

    const updated = await this.secureRoleRepo.save(user, role);

    // Invalidate caches
    await this.cacheManager.del(`role:${user.tenantId}:${id}`);
    await this.cacheManager.del(`role:all:${user.tenantId}`);
    if (role.name) {
      await this.cacheManager.del(`role:${user.tenantId}:name:${role.name}`);
    }

    return updated;
  }

  async remove(id: string, user: User): Promise<void> {
    const role = await this.findOne(id, user);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.secureRoleRepo.remove(user, role);

    // Invalidate caches
    await this.cacheManager.del(`role:${user.tenantId}:${id}`);
    await this.cacheManager.del(`role:all:${user.tenantId}`);
    if (role.name) {
      await this.cacheManager.del(`role:${user.tenantId}:name:${role.name}`);
    }
  }

  async count(user: User): Promise<number> {
    const roles = await this.secureRoleRepo.find(user, {});
    return roles.length;
  }

  async addPermissions(id: string, permissionIds: string[], user: User): Promise<Role> {
    const role = await this.findOne(id, user);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    const permissions = await this.permissionRepository.findByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permission IDs are invalid');
    }

    // Verify all permissions belong to the same tenant
    const invalidPermissions = permissions.filter((p) => p.tenantId !== user.tenantId);
    if (invalidPermissions.length > 0) {
      throw new BadRequestException('Some permissions do not belong to this tenant');
    }

    // Add new permissions (avoid duplicates)
    const existingPermissionIds = role.permissions.map((p) => p.id);
    const newPermissions = permissions.filter((p) => !existingPermissionIds.includes(p.id));
    role.permissions = [...role.permissions, ...newPermissions];

    return await this.secureRoleRepo.save(user, role);
  }

  async removePermissions(id: string, permissionIds: string[], user: User): Promise<Role> {
    const role = await this.findOne(id, user);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    role.permissions = role.permissions.filter((p) => !permissionIds.includes(p.id));
    return await this.secureRoleRepo.save(user, role);
  }
}
