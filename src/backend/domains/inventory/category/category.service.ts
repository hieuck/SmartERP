import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class CategoryService {
  private secureCategoryRepo: SecureRepository<Category>;

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureCategoryRepo = new SecureRepository(
      categoryRepository,
      permissionService,
      'Category',
    );
  }

  async create(user: User, createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if code already exists for this tenant
    const existing = await this.secureCategoryRepo.findOne(user, {
      where: { code: createCategoryDto.code },
    });

    if (existing) {
      throw new ConflictException(`Category with code '${createCategoryDto.code}' already exists`);
    }

    // Validate parent category if provided
    let level = 0;
    let path = '';

    if (createCategoryDto.parentId) {
      const parent = await this.secureCategoryRepo.findOne(user, {
        where: { id: createCategoryDto.parentId } as any,
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      level = parent.level + 1;
      path = parent.path ? `${parent.path}/${(parent as any).id}` : (parent as any).id;
    }

    const category = {
      ...createCategoryDto,
      level,
      path,
    };

    return await this.secureCategoryRepo.save(user, category);
  }

  async findAll(user: User): Promise<Category[]> {
    const allCategories = await this.secureCategoryRepo.find(user, {
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return allCategories;
  }

  async findOne(user: User, id: string): Promise<Category> {
    const cacheKey = generateCacheKey('category', user.tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const category = await this.secureCategoryRepo.findOne(user, {
          where: { id } as any,
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByCode(user: User, code: string): Promise<Category> {
    const category = await this.secureCategoryRepo.findOne(user, {
      where: { code },
    });

    if (!category) {
      throw new NotFoundException(`Category with code '${code}' not found`);
    }

    return category;
  }

  async findRootCategories(user: User): Promise<Category[]> {
    const allCategories = await this.secureCategoryRepo.find(user, {
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return allCategories.filter((c) => !c.parentId);
  }

  async findChildren(user: User, parentId: string): Promise<Category[]> {
    const allCategories = await this.secureCategoryRepo.find(user, {
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return allCategories.filter((c) => c.parentId === parentId);
  }

  async findTree(user: User): Promise<Category[]> {
    const allCategories = await this.findAll(user);
    return this.buildTree(allCategories);
  }

  private buildTree(categories: Category[], parentId: string = null): Category[] {
    const tree: Category[] = [];

    for (const category of categories) {
      if (category.parentId === parentId) {
        const children = this.buildTree(categories, (category as any).id);
        if (children.length > 0) {
          (category as Category & { children?: Category[] }).children = children;
        }
        tree.push(category);
      }
    }

    return tree;
  }

  async update(user: User, id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(user, id);

    // Check if new code conflicts
    if (updateCategoryDto.code && updateCategoryDto.code !== category.code) {
      const existing = await this.secureCategoryRepo.findOne(user, {
        where: { code: updateCategoryDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Category with code '${updateCategoryDto.code}' already exists`,
        );
      }
    }

    // Validate parent change
    if (
      updateCategoryDto.parentId !== undefined &&
      updateCategoryDto.parentId !== category.parentId
    ) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId) {
        const parent = await this.secureCategoryRepo.findOne(user, {
          where: { id: updateCategoryDto.parentId } as any,
        });

        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }

        // Check for circular reference
        if (await this.wouldCreateCircularReference(user, id, updateCategoryDto.parentId)) {
          throw new BadRequestException('Cannot create circular reference');
        }

        category.level = parent.level + 1;
        category.path = parent.path ? `${parent.path}/${(parent as any).id}` : (parent as any).id;
      } else {
        category.level = 0;
        category.path = '';
      }
    }

    Object.assign(category, updateCategoryDto);

    const updated = await this.secureCategoryRepo.save(user, category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  private async wouldCreateCircularReference(
    user: User,
    categoryId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }

      const parent = await this.secureCategoryRepo.findOne(user, {
        where: { id: currentId } as any,
      });

      if (!parent) {
        break;
      }

      currentId = parent.parentId;
    }

    return false;
  }

  async remove(user: User, id: string): Promise<void> {
    const category = await this.findOne(user, id);

    // Check if category has children
    const children = await this.findChildren(user, id);
    if (children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    await this.secureCategoryRepo.remove(user, category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async count(user: User): Promise<number> {
    const categories = await this.secureCategoryRepo.find(user, {});
    return categories.length;
  }

  async activate(user: User, id: string): Promise<Category> {
    const category = await this.findOne(user, id);
    category.isActive = true;
    const updated = await this.secureCategoryRepo.save(user, category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deactivate(user: User, id: string): Promise<Category> {
    const category = await this.findOne(user, id);
    category.isActive = false;
    const updated = await this.secureCategoryRepo.save(user, category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async reorder(user: User, id: string, newOrder: number): Promise<Category> {
    const category = await this.findOne(user, id);
    category.sortOrder = newOrder;
    const updated = await this.secureCategoryRepo.save(user, category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }
}
