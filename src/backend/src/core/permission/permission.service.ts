import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { User } from '@/common/security/permission.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(user: User, createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const tenantId = user.tenantId;
    // Check if permission already exists for this resource and tenant
    const existing = await this.permissionRepository.findOne({
      where: { resource: createPermissionDto.resource, tenantId },
    });

    if (existing) {
      throw new ConflictException(
        `Permission for resource '${createPermissionDto.resource}' already exists`,
      );
    }

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      tenantId,
    });

    return await this.permissionRepository.save(permission);
  }

  async findAll(user: User): Promise<Permission[]> {
    const tenantId = user.tenantId;
    const cacheKey = `permission:all:${tenantId}`;

    // Try cache first
    const cached = await this.cacheManager.get<Permission[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database with query builder
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .select([
        'permission.id',
        'permission.resource',
        'permission.action',
        'permission.description',
        'permission.createdAt',
      ])
      .where('permission.tenantId = :tenantId', { tenantId })
      .orderBy('permission.resource', 'ASC')
      .getMany();

    // Store in cache (5 minutes - permissions rarely change)
    await this.cacheManager.set(cacheKey, permissions, 300000);

    return permissions;
  }

  async findOne(user: User, id: string): Promise<Permission> {
    const tenantId = user.tenantId;
    const cacheKey = `permission:${tenantId}:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<Permission>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const permission = await this.permissionRepository.findOne({
      where: { id, tenantId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, permission, 300000);

    return permission;
  }

  async findByIds(ids: string[], tenantId: string): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { id: In(ids), tenantId },
    });
  }

  async findByResource(user: User, resource: string): Promise<Permission> {
    const cacheKey = `permission:${user.tenantId}:resource:${resource}`;

    // Try cache first
    const cached = await this.cacheManager.get<Permission>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const permission = await this.permissionRepository.findOne({
      where: { resource, tenantId: user.tenantId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission for resource '${resource}' not found`);
    }

    // Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, permission, 300000);

    return permission;
  }

  async update(
    user: User,
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(user, id);

    // Check if new resource name conflicts
    if (updatePermissionDto.resource && updatePermissionDto.resource !== permission.resource) {
      const existing = await this.permissionRepository.findOne({
        where: { resource: updatePermissionDto.resource, tenantId: user.tenantId },
      });

      if (existing) {
        throw new ConflictException(
          `Permission for resource '${updatePermissionDto.resource}' already exists`,
        );
      }
    }

    Object.assign(permission, updatePermissionDto);
    const updated = await this.permissionRepository.save(permission);

    // Invalidate caches
    await this.cacheManager.del(`permission:${user.tenantId}:${id}`);
    await this.cacheManager.del(`permission:all:${user.tenantId}`);
    if (permission.resource) {
      await this.cacheManager.del(`permission:${user.tenantId}:resource:${permission.resource}`);
    }

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    // Check if permission exists (will throw if not found)
    const permission = await this.findOne(user, id);
    await this.permissionRepository.softDelete({ id, tenantId: user.tenantId });

    // Invalidate caches
    await this.cacheManager.del(`permission:${user.tenantId}:${id}`);
    await this.cacheManager.del(`permission:all:${user.tenantId}`);
    if (permission.resource) {
      await this.cacheManager.del(`permission:${user.tenantId}:resource:${permission.resource}`);
    }
  }

  async count(user: User): Promise<number> {
    const tenantId = user.tenantId;
    return await this.permissionRepository.count({
      where: { tenantId },
    });
  }
}
