import { CacheTTL } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './entities/product-category.entity';

@Injectable()
export class ProductCategoryService {
  private secureCategoryRepo: SecureRepository<ProductCategory>;

  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureCategoryRepo = new SecureRepository(
      categoryRepository,
      permissionService,
      'ProductCategory',
    );
  }

  async create(user: User, createDto: CreateProductCategoryDto): Promise<ProductCategory> {
    // Check if name already exists for this tenant
    const existing = await this.secureCategoryRepo.findOne(user, {
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException(`Category '${createDto.name}' already exists`);
    }

    const category = {
      ...createDto,
      createdBy: user.id,
    };

    return await this.secureCategoryRepo.save(user, category);
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: ProductCategory[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allCategories = await this.secureCategoryRepo.find(user, {
      order: { name: 'ASC' },
    });

    const total = allCategories.length;
    const data = allCategories.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<ProductCategory> {
    const cacheKey = `category:${user.tenantId}:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const category = await this.secureCategoryRepo.findOne(user, {
          where: { id, tenantId: user.tenantId } as any,
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
      },
      CacheTTL.LONG,
    );
  }

  async update(
    user: User,
    id: string,
    updateDto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.findOne(user, id);

    // Check permission first before validation
    if (!this.permissionService.canWrite(user, category, 'ProductCategory')) {
      throw new ForbiddenException('Access denied to update this category');
    }

    // Check if new name conflicts
    if (updateDto.name && updateDto.name !== category.name) {
      const existing = await this.secureCategoryRepo.findOne(user, {
        where: { name: updateDto.name },
      });

      if (existing) {
        throw new ConflictException(`Category '${updateDto.name}' already exists`);
      }
    }

    Object.assign(category, updateDto);
    category.updatedBy = user.id;

    const updated = await this.secureCategoryRepo.save(user, category);

    // Invalidate cache
    await this.cacheService.del(`category:${user.tenantId}:${id}`);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const category = await this.findOne(user, id);
    await this.secureCategoryRepo.remove(user, category);

    // Invalidate cache
    await this.cacheService.del(`category:${user.tenantId}:${id}`);
  }

  async count(user: User): Promise<number> {
    const categories = await this.secureCategoryRepo.find(user, {});
    return categories.length;
  }

  async findActive(user: User): Promise<ProductCategory[]> {
    return await this.secureCategoryRepo.find(user, {
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
