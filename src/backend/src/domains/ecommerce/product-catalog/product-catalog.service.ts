import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCatalog } from './entities/product-catalog.entity';
import { ProductStatus } from './enums/product-status.enum';

@Injectable()
export class ProductCatalogService {
  private readonly secureProductRepo: SecureRepository<ProductCatalog>;

  constructor(
    @InjectRepository(ProductCatalog)
    private readonly productRepository: Repository<ProductCatalog>,
    private readonly permissionService: PermissionService,
  ) {
    this.secureProductRepo = new SecureRepository(
      this.productRepository,
      this.permissionService,
      'ProductCatalog',
    );
  }

  async create(data: Partial<ProductCatalog>, user: User): Promise<ProductCatalog> {
    const product = {
      ...data,
      tenantId: user.tenantId,
      createdBy: user.id,
    } as ProductCatalog;
    return this.secureProductRepo.save(user, product);
  }

  async findOne(id: string, user: User): Promise<ProductCatalog> {
    const product = await this.secureProductRepo.findOne(user, {
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string, user: User): Promise<ProductCatalog> {
    const product = await this.secureProductRepo.findOne(user, {
      where: { sku },
    });
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async findBySlug(slug: string, user: User): Promise<ProductCatalog> {
    const product = await this.secureProductRepo.findOne(user, {
      where: { slug },
    });
    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    return product;
  }

  async findAll(
    user: User,
    filters?: {
      status?: ProductStatus;
      categoryId?: string;
      tags?: string[];
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isPublished?: boolean;
    },
  ): Promise<ProductCatalog[]> {
    const qb = this.productRepository.createQueryBuilder('product');

    // Apply tenant isolation
    qb.andWhere('product.tenantId = :tenantId', { tenantId: user.tenantId });

    if (filters?.status) {
      qb.andWhere('product.status = :status', { status: filters.status });
    }
    if (filters?.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters?.tags && filters.tags.length > 0) {
      qb.andWhere('product.tags && :tags', { tags: filters.tags });
    }
    if (filters?.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters?.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        qb.andWhere('product.stockQuantity > 0');
      } else {
        qb.andWhere('product.stockQuantity = 0');
      }
    }
    if (filters?.isPublished !== undefined) {
      qb.andWhere('product.isPublished = :isPublished', {
        isPublished: filters.isPublished,
      });
    }

    qb.orderBy('product.displayOrder', 'ASC').addOrderBy('product.name', 'ASC');

    return qb.getMany();
  }

  async findPublished(user: User): Promise<ProductCatalog[]> {
    return this.secureProductRepo.find(user, {
      where: {
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });
  }

  async search(
    query: string,
    user: User,
    filters?: {
      categoryId?: string;
      tags?: string[];
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<ProductCatalog[]> {
    return this.findAll(user, {
      search: query,
      isPublished: true,
      status: ProductStatus.ACTIVE,
      ...filters,
    });
  }

  async update(id: string, data: Partial<ProductCatalog>, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, user);
    Object.assign(product, data);
    return this.secureProductRepo.save(user, product);
  }

  async remove(id: string, user: User): Promise<void> {
    const product = await this.findOne(id, user);
    await this.secureProductRepo.remove(user, product);
  }

  async updateStock(id: string, quantity: number, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, user);
    product.stockQuantity = quantity;
    if (product.trackInventory && quantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK && quantity > 0) {
      product.status = ProductStatus.ACTIVE;
    }
    return this.secureProductRepo.save(user, product);
  }

  async publish(id: string, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, user);
    product.isPublished = true;
    product.publishedAt = new Date();
    return this.secureProductRepo.save(user, product);
  }

  async unpublish(id: string, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, user);
    product.isPublished = false;
    return this.secureProductRepo.save(user, product);
  }

  async findByCategory(categoryId: string, user: User): Promise<ProductCatalog[]> {
    return this.secureProductRepo.find(user, {
      where: {
        categoryId,
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findByTags(tags: string[], user: User): Promise<ProductCatalog[]> {
    const qb = this.productRepository.createQueryBuilder('product');

    qb.andWhere('product.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.tags && :tags', { tags })
      .orderBy('product.displayOrder', 'ASC')
      .addOrderBy('product.name', 'ASC');

    return qb.getMany();
  }

  async findLowStock(user: User): Promise<ProductCatalog[]> {
    const qb = this.productRepository.createQueryBuilder('product');

    qb.andWhere('product.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('product.trackInventory = :trackInventory', { trackInventory: true })
      .andWhere('product.stockQuantity > 0')
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .orderBy('product.stockQuantity', 'ASC');

    return qb.getMany();
  }

  async findOutOfStock(user: User): Promise<ProductCatalog[]> {
    return this.secureProductRepo.find(user, {
      where: {
        trackInventory: true,
        stockQuantity: 0,
      },
      order: {
        name: 'ASC',
      },
    });
  }
}
