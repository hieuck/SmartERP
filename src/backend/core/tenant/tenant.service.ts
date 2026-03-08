import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User as UserEntity } from '../user/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant, TenantStatus } from './entities/tenant.entity';

@Injectable()
export class TenantService {
  private readonly secureTenantRepo: SecureRepository<Tenant>;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureTenantRepo = new SecureRepository(
      this.tenantRepository,
      this.permissionService,
      'Tenant',
    );
  }

  /**
   * Create tenant (system operation)
   * Uses raw repository - this is tenant creation, not tenant-scoped operation
   */
  async create(createTenantDto: CreateTenantDto, userId?: string): Promise<Tenant> {
    // Generate unique code if not provided
    const code = createTenantDto.code || this.generateTenantCode();

    // Check if code already exists
    const existing = await this.tenantRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Tenant with code ${code} already exists`);
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      code,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return await this.tenantRepository.save(tenant);
  }

  /**
   * Find all tenants (system operation)
   * Uses raw repository - admin operation to query all tenants across system
   */
  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepository
      .createQueryBuilder('tenant')
      .select([
        'tenant.id',
        'tenant.code',
        'tenant.name',
        'tenant.companyName',
        'tenant.status',
        'tenant.maxUsers',
        'tenant.maxStorage',
        'tenant.currentStorage',
        'tenant.subscriptionPlan',
        'tenant.subscriptionEndDate',
        'tenant.createdAt',
      ])
      .orderBy('tenant.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find tenant by user context (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async findOne(user: User): Promise<Tenant> {
    const id = user.tenantId;
    const cacheKey = generateCacheKey('tenant', 'global', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const tenant = await this.secureTenantRepo.findOne(user, { where: { id } });
        if (!tenant) {
          throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return tenant;
      },
      CacheTTL.MEDIUM, // 15 min - tenant data doesn't change frequently
    );
  }

  /**
   * Find tenant by code (system operation)
   * Uses raw repository - used for tenant lookup during login/registration
   */
  async findByCode(code: string): Promise<Tenant> {
    const cacheKey = generateCacheKey('tenant-code', 'global', code);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const tenant = await this.tenantRepository.findOne({ where: { code } });
        if (!tenant) {
          throw new NotFoundException(`Tenant with code ${code} not found`);
        }
        return tenant;
      },
      CacheTTL.MEDIUM, // 15 min
    );
  }

  /**
   * Update tenant (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async update(user: User, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(user);

    // If code is being updated, check for conflicts (use raw repo for global check)
    if (updateTenantDto.code && updateTenantDto.code !== tenant.code) {
      const existing = await this.tenantRepository.findOne({
        where: { code: updateTenantDto.code },
      });
      if (existing) {
        throw new ConflictException(`Tenant with code ${updateTenantDto.code} already exists`);
      }
    }

    Object.assign(tenant, updateTenantDto);
    tenant.updatedBy = user.id;

    const updated = await this.secureTenantRepo.save(user, tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', user.tenantId);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  /**
   * Remove tenant (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async remove(user: User): Promise<void> {
    const tenant = await this.findOne(user);

    // Check if tenant has users
    const userCount = await this.userRepository.count({
      where: { tenantId: user.tenantId },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete tenant with ${userCount} users. Please remove all users first.`,
      );
    }

    await this.secureTenantRepo.remove(user, tenant);
  }

  /**
   * Suspend tenant (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async suspend(user: User): Promise<Tenant> {
    const tenant = await this.findOne(user);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.updatedBy = user.id;
    const updated = await this.secureTenantRepo.save(user, tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', user.tenantId);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  /**
   * Activate tenant (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async activate(user: User): Promise<Tenant> {
    const tenant = await this.findOne(user);
    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedBy = user.id;
    const updated = await this.secureTenantRepo.save(user, tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', user.tenantId);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  /**
   * Cancel tenant (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async cancel(user: User): Promise<Tenant> {
    const tenant = await this.findOne(user);
    tenant.status = TenantStatus.CANCELLED;
    tenant.updatedBy = user.id;
    const updated = await this.secureTenantRepo.save(user, tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', user.tenantId);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  /**
   * Get users by tenant (system operation)
   * Uses raw repository - admin operation to query users of any tenant
   */
  async getUsersByTenant(tenantId: string): Promise<User[]> {
    // Note: This method keeps tenantId parameter as it's used by admin to query any tenant
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    return await this.userRepository.find({
      where: { tenantId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'status',
        'tenantId',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async getUsageReport(user: User): Promise<{
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    users: {
      current: number;
      max: number;
      percentage: number;
    };
    storage: {
      current: number;
      max: number;
      percentage: number;
    };
    subscription: {
      plan: string;
      startDate: Date;
      endDate: Date;
      amount: number;
      billingCycle: string;
      status: TenantStatus;
    };
    features: string[];
  }> {
    const tenant = await this.findOne(user);

    const userCount = await this.userRepository.count({
      where: { tenantId: user.tenantId, status: 'active' },
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantCode: tenant.code,
      users: {
        current: userCount,
        max: tenant.maxUsers,
        percentage: tenant.maxUsers > 0 ? (userCount / tenant.maxUsers) * 100 : 0,
      },
      storage: {
        current: tenant.currentStorage,
        max: tenant.maxStorage,
        percentage:
          tenant.maxStorage > 0
            ? (Number(tenant.currentStorage) / Number(tenant.maxStorage)) * 100
            : 0,
      },
      subscription: {
        plan: tenant.subscriptionPlan,
        startDate: tenant.subscriptionStartDate,
        endDate: tenant.subscriptionEndDate,
        amount: tenant.subscriptionAmount,
        billingCycle: tenant.billingCycle,
        status: tenant.status,
      },
      features: tenant.features || [],
    };
  }

  /**
   * Count tenants (system operation)
   * Uses raw repository - admin operation to count all tenants
   */
  async count(): Promise<number> {
    return await this.tenantRepository.count();
  }

  /**
   * Find tenants by status (system operation)
   * Uses raw repository - admin operation to query tenants by status
   */
  async findByStatus(status: TenantStatus): Promise<Tenant[]> {
    return await this.tenantRepository
      .createQueryBuilder('tenant')
      .select([
        'tenant.id',
        'tenant.code',
        'tenant.name',
        'tenant.companyName',
        'tenant.status',
        'tenant.maxUsers',
        'tenant.currentStorage',
        'tenant.subscriptionPlan',
        'tenant.createdAt',
      ])
      .where('tenant.status = :status', { status })
      .orderBy('tenant.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update storage (tenant-scoped operation)
   * Uses SecureRepository for automatic tenant isolation
   */
  async updateStorage(user: User, storageUsed: number): Promise<Tenant> {
    const tenant = await this.findOne(user);

    if (storageUsed > Number(tenant.maxStorage)) {
      throw new BadRequestException('Storage limit exceeded');
    }

    tenant.currentStorage = storageUsed;
    const updated = await this.secureTenantRepo.save(user, tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', user.tenantId);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  private generateTenantCode(): string {
    return `TNT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
}
