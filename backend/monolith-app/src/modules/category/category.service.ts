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

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    tenantId: string,
    userId?: string,
  ): Promise<Category> {
    // Check if code already exists for this tenant
    const existing = await this.categoryRepository.findOne({
      where: { code: createCategoryDto.code, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Category with code '${createCategoryDto.code}' already exists`);
    }

    // Validate parent category if provided
    let level = 0;
    let path = '';

    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId, tenantId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      level = parent.level + 1;
      path = parent.path ? `${parent.path}/${parent.id}` : parent.id;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
      level,
      path,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(tenantId: string): Promise<Category[]> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.parentId',
        'category.level',
        'category.path',
        'category.sortOrder',
        'category.isActive',
      ])
      .where('category.tenantId = :tenantId', { tenantId })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Category> {
    const cacheKey = generateCacheKey('category', tenantId, id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const category = await this.categoryRepository.findOne({
          where: { id, tenantId },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findByCode(code: string, tenantId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { code, tenantId },
    });

    if (!category) {
      throw new NotFoundException(`Category with code '${code}' not found`);
    }

    return category;
  }

  async findRootCategories(tenantId: string): Promise<Category[]> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.sortOrder',
        'category.isActive',
      ])
      .where('category.tenantId = :tenantId', { tenantId })
      .andWhere('category.parentId IS NULL')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }

  async findChildren(parentId: string, tenantId: string): Promise<Category[]> {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.level',
        'category.sortOrder',
        'category.isActive',
      ])
      .where('category.parentId = :parentId', { parentId })
      .andWhere('category.tenantId = :tenantId', { tenantId })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }

  async findTree(tenantId: string): Promise<Category[]> {
    const allCategories = await this.findAll(tenantId);
    return this.buildTree(allCategories);
  }

  private buildTree(categories: Category[], parentId: string = null): Category[] {
    const tree: Category[] = [];

    for (const category of categories) {
      if (category.parentId === parentId) {
        const children = this.buildTree(categories, category.id);
        if (children.length > 0) {
          (category as Category & { children?: Category[] }).children = children;
        }
        tree.push(category);
      }
    }

    return tree;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    tenantId: string,
    userId?: string,
  ): Promise<Category> {
    const category = await this.findOne(id, tenantId);

    // Check if new code conflicts
    if (updateCategoryDto.code && updateCategoryDto.code !== category.code) {
      const existing = await this.categoryRepository.findOne({
        where: { code: updateCategoryDto.code, tenantId },
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
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parentId, tenantId },
        });

        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }

        // Check for circular reference
        if (await this.wouldCreateCircularReference(id, updateCategoryDto.parentId, tenantId)) {
          throw new BadRequestException('Cannot create circular reference');
        }

        category.level = parent.level + 1;
        category.path = parent.path ? `${parent.path}/${parent.id}` : parent.id;
      } else {
        category.level = 0;
        category.path = '';
      }
    }

    Object.assign(category, updateCategoryDto);
    category.updatedBy = userId || 'system';

    const updated = await this.categoryRepository.save(category);

    // Invalidate cache
    const cacheKey = generateCacheKey('category', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  private async wouldCreateCircularReference(
    categoryId: string,
    newParentId: string,
    tenantId: string,
  ): Promise<boolean> {
    let currentId = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: currentId, tenantId },
      });

      if (!parent) {
        break;
      }

      currentId = parent.parentId;
    }

    return false;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    // Check if category exists (will throw if not found)
    await this.findOne(id, tenantId);

    // Check if category has children
    const children = await this.findChildren(id, tenantId);
    if (children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    await this.categoryRepository.softDelete({ id, tenantId });

    // Invalidate cache
    const cacheKey = generateCacheKey('category', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async count(tenantId: string): Promise<number> {
    return await this.categoryRepository.count({
      where: { tenantId },
    });
  }

  async activate(id: string, tenantId: string): Promise<Category> {
    const category = await this.findOne(id, tenantId);
    category.isActive = true;
    return await this.categoryRepository.save(category);
  }

  async deactivate(id: string, tenantId: string): Promise<Category> {
    const category = await this.findOne(id, tenantId);
    category.isActive = false;
    return await this.categoryRepository.save(category);
  }

  async reorder(id: string, newOrder: number, tenantId: string): Promise<Category> {
    const category = await this.findOne(id, tenantId);
    category.sortOrder = newOrder;
    return await this.categoryRepository.save(category);
  }
}
