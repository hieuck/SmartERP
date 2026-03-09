import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';
import { {{EntityName}} } from './entities/{{entity-name}}.entity';
import { Create{{EntityName}}Dto } from './dto/create-{{entity-name}}.dto';
import { Update{{EntityName}}Dto } from './dto/update-{{entity-name}}.dto';

/**
 * {{EntityName}}Service - Odoo/ERPNext Style Service
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Module-based structure (Odoo style)
 * - Multi-tenancy & security (ERPNext style)
 * - SecureRepository for all data access
 * - Tenant isolation on every query
 * - Permission checks before operations
 * - Audit trail fields (createdBy, updatedBy)
 * - Soft delete support
 * - Caching strategy for performance
 * 
 * SECURITY CHECKLIST:
 * ✅ SecureRepository usage
 * ✅ Tenant isolation
 * ✅ Permission checks (canRead, canWrite, canDelete)
 * ✅ Audit trail
 * ✅ Cache invalidation
 */
@Injectable()
export class {{EntityName}}Service {
  private secure{{EntityName}}Repo: SecureRepository<{{EntityName}}>;

  constructor(
    @InjectRepository({{EntityName}})
    private readonly {{entityName}}Repository: Repository<{{EntityName}}>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository with tenant isolation & permission checks
    this.secure{{EntityName}}Repo = new SecureRepository(
      {{entityName}}Repository,
      permissionService,
      '{{EntityName}}',
    );
  }

  /**
   * Find all {{entityName}}s with pagination
   * Uses SecureRepository for automatic tenant isolation
   */
  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: {{EntityName}}[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    // SecureRepository automatically filters by tenantId
    const all{{EntityName}}s = await this.secure{{EntityName}}Repo.find(user, {
      relations: [], // Add relations as needed
      order: { createdAt: 'DESC' },
    });

    const total = all{{EntityName}}s.length;
    const data = all{{EntityName}}s.slice((page - 1) * limit, page * limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one {{entityName}} by ID
   * Uses caching for performance
   * Throws NotFoundException if not found
   */
  async findOne(user: User, id: string): Promise<{{EntityName}}> {
    const cacheKey = generateCacheKey('{{entity-name}}', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const {{entityName}} = await this.secure{{EntityName}}Repo.findOne(user, {
          where: { id },
          relations: [], // Add relations as needed
        });

        if (!{{entityName}}) {
          throw new NotFoundException(`{{EntityName}} with ID ${id} not found`);
        }

        return {{entityName}};
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * Create new {{entityName}}
   * Automatically sets tenantId and createdBy
   */
  async create(user: User, create{{EntityName}}Dto: Create{{EntityName}}Dto): Promise<{{EntityName}}> {
    // Add business logic validation here
    // Example: Check uniqueness, validate references, etc.

    const {{entityName}} = {
      ...create{{EntityName}}Dto,
      // tenantId and createdBy are set automatically by SecureRepository
    };

    return this.secure{{EntityName}}Repo.save(user, {{entityName}});
  }

  /**
   * Update existing {{entityName}}
   * Checks permissions before update
   * Invalidates cache after update
   */
  async update(
    user: User,
    id: string,
    update{{EntityName}}Dto: Update{{EntityName}}Dto,
  ): Promise<{{EntityName}}> {
    const {{entityName}} = await this.findOne(user, id);

    // Add business logic validation here
    // Example: Check status transitions, validate changes, etc.

    Object.assign({{entityName}}, update{{EntityName}}Dto);
    const updated = await this.secure{{EntityName}}Repo.save(user, {{entityName}});

    // Invalidate cache
    const cacheKey = generateCacheKey('{{entity-name}}', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  /**
   * Remove {{entityName}}
   * Checks delete permission
   * Invalidates cache after deletion
   */
  async remove(user: User, id: string): Promise<void> {
    const {{entityName}} = await this.findOne(user, id);

    // Add business logic validation here
    // Example: Check if can be deleted, cascade deletes, etc.

    await this.secure{{EntityName}}Repo.remove(user, {{entityName}});

    // Invalidate cache
    const cacheKey = generateCacheKey('{{entity-name}}', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  /**
   * Count {{entityName}}s for current tenant
   */
  async count(user: User): Promise<number> {
    const {{entityName}}s = await this.secure{{EntityName}}Repo.find(user, {});
    return {{entityName}}s.length;
  }

  // ==========================================
  // CUSTOM BUSINESS LOGIC METHODS
  // Add your domain-specific methods below
  // ==========================================

  /**
   * Example: Find by status
   */
  async findByStatus(user: User, status: string): Promise<{{EntityName}}[]> {
    return this.secure{{EntityName}}Repo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Example: Update status with validation
   */
  async updateStatus(user: User, id: string, status: string): Promise<{{EntityName}}> {
    const {{entityName}} = await this.findOne(user, id);

    // Add status transition validation here
    // Example: Draft -> Submitted -> Approved -> Cancelled

    {{entityName}}.status = status;
    const updated = await this.secure{{EntityName}}Repo.save(user, {{entityName}});

    // Invalidate cache
    const cacheKey = generateCacheKey('{{entity-name}}', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }
}
