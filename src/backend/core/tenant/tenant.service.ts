import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

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

  async findOne(id: string): Promise<Tenant> {
    const cacheKey = generateCacheKey('tenant', 'global', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const tenant = await this.tenantRepository.findOne({ where: { id } });
        if (!tenant) {
          throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return tenant;
      },
      CacheTTL.MEDIUM, // 15 min - tenant data doesn't change frequently
    );
  }

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

  async update(id: string, updateTenantDto: UpdateTenantDto, userId?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // If code is being updated, check for conflicts
    if (updateTenantDto.code && updateTenantDto.code !== tenant.code) {
      const existing = await this.tenantRepository.findOne({
        where: { code: updateTenantDto.code },
      });
      if (existing) {
        throw new ConflictException(`Tenant with code ${updateTenantDto.code} already exists`);
      }
    }

    Object.assign(tenant, updateTenantDto);
    tenant.updatedBy = userId || 'system';

    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', id);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Check if tenant has users
    const userCount = await this.userRepository.count({
      where: { tenantId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete tenant with ${userCount} users. Please remove all users first.`,
      );
    }

    await this.tenantRepository.softDelete(id);
  }

  async suspend(id: string, userId?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.SUSPENDED;
    tenant.updatedBy = userId || 'system';
    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', id);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  async activate(id: string, userId?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.ACTIVE;
    tenant.updatedBy = userId || 'system';
    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', id);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  async cancel(id: string, userId?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.CANCELLED;
    tenant.updatedBy = userId || 'system';
    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', id);
    await this.cacheService.del(cacheKey);

    if (tenant.code) {
      const codeKey = generateCacheKey('tenant-code', 'global', tenant.code);
      await this.cacheService.del(codeKey);
    }

    return updated;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    await this.findOne(tenantId); // Verify tenant exists

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

  async getUsageReport(tenantId: string): Promise<{
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
    const tenant = await this.findOne(tenantId);

    const userCount = await this.userRepository.count({
      where: { tenantId, status: 'active' },
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

  async count(): Promise<number> {
    return await this.tenantRepository.count();
  }

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

  async updateStorage(tenantId: string, storageUsed: number): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);

    if (storageUsed > Number(tenant.maxStorage)) {
      throw new BadRequestException('Storage limit exceeded');
    }

    tenant.currentStorage = storageUsed;
    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    const cacheKey = generateCacheKey('tenant', 'global', tenantId);
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
