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
import { TestProduct } from './entities/test-product.entity';
import { CreateTestProductDto } from './dto/create-test-product.dto';
import { UpdateTestProductDto } from './dto/update-test-product.dto';

/**
 * TestProductService - Odoo/ERPNext Style Service
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
export class TestProductService {
  private secureTestProductRepo: SecureRepository<TestProduct>;

  constructor(
    @InjectRepository(TestProduct)
    private readonly TestProductRepository: Repository<TestProduct>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    // Initialize SecureRepository with tenant isolation & permission checks
    this.secureTestProductRepo = new SecureRepository(
      TestProductRepository,
      permissionService,
      'TestProduct',
    );
  }

  /**
   * Find all TestProducts with pagination
   * Uses SecureRepository for automatic tenant isolation
   */
  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: TestProduct[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    // SecureRepository automatically filters by tenantId
    const allTestProducts = await this.secureTestProductRepo.find(user, {
      relations: [], // Add relations as needed
      order: { createdAt: 'DESC' },
    });

    const total = allTestProducts.length;
    const data = allTestProducts.slice((page - 1) * limit, page * limit);

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
   * Find one TestProduct by ID
   * Uses caching for performance
   * Throws NotFoundException if not found
   */
  async findOne(user: User, id: string): Promise<TestProduct> {
    const cacheKey = generateCacheKey('test-product', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const TestProduct = await this.secureTestProductRepo.findOne(user, {
          where: { id },
          relations: [], // Add relations as needed
        });

        if (!TestProduct) {
          throw new NotFoundException(`TestProduct with ID ${id} not found`);
        }

        return TestProduct;
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * Create new TestProduct
   * Automatically sets tenantId and createdBy
   */
  async create(user: User, createTestProductDto: CreateTestProductDto): Promise<TestProduct> {
    // Add business logic validation here
    // Example: Check uniqueness, validate references, etc.

    const TestProduct = {
      ...createTestProductDto,
      // tenantId and createdBy are set automatically by SecureRepository
    };

    return this.secureTestProductRepo.save(user, TestProduct);
  }

  /**
   * Update existing TestProduct
   * Checks permissions before update
   * Invalidates cache after update
   */
  async update(
    user: User,
    id: string,
    updateTestProductDto: UpdateTestProductDto,
  ): Promise<TestProduct> {
    const TestProduct = await this.findOne(user, id);

    // Add business logic validation here
    // Example: Check status transitions, validate changes, etc.

    Object.assign(TestProduct, updateTestProductDto);
    const updated = await this.secureTestProductRepo.save(user, TestProduct);

    // Invalidate cache
    const cacheKey = generateCacheKey('test-product', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  /**
   * Remove TestProduct
   * Checks delete permission
   * Invalidates cache after deletion
   */
  async remove(user: User, id: string): Promise<void> {
    const TestProduct = await this.findOne(user, id);

    // Add business logic validation here
    // Example: Check if can be deleted, cascade deletes, etc.

    await this.secureTestProductRepo.remove(user, TestProduct);

    // Invalidate cache
    const cacheKey = generateCacheKey('test-product', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  /**
   * Count TestProducts for current tenant
   */
  async count(user: User): Promise<number> {
    const TestProducts = await this.secureTestProductRepo.find(user, {});
    return TestProducts.length;
  }

  // ==========================================
  // CUSTOM BUSINESS LOGIC METHODS
  // Add your domain-specific methods below
  // ==========================================

  /**
   * Example: Find by status
   */
  async findByStatus(user: User, status: string): Promise<TestProduct[]> {
    return this.secureTestProductRepo.find(user, {
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Example: Update status with validation
   */
  async updateStatus(user: User, id: string, status: string): Promise<TestProduct> {
    const TestProduct = await this.findOne(user, id);

    // Add status transition validation here
    // Example: Draft -> Submitted -> Approved -> Cancelled

    TestProduct.status = status;
    const updated = await this.secureTestProductRepo.save(user, TestProduct);

    // Invalidate cache
    const cacheKey = generateCacheKey('test-product', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }
}
