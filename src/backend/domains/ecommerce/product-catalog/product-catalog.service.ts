import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCatalog, ProductStatus } from './entities/product-catalog.entity';
import { User } from '../../../core/user/entities/user.entity';

@Injectable()
export class ProductCatalogService {
  constructor(
    @InjectRepository(ProductCatalog)
    private readonly productRepository: Repository<ProductCatalog>,
  ) {}

  async create(
    data: Partial<ProductCatalog>,
    tenantId: string,
    user: User,
  ): Promise<ProductCatalog> {
    const product = this.productRepository.create({
      ...data,
      tenantId,
      createdBy: user.id,
    });
    return this.productRepository.save(product);
  }

  async findOne(id: string, tenantId: string): Promise<ProductCatalog> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string, tenantId: string): Promise<ProductCatalog> {
    const product = await this.productRepository.findOne({
      where: { sku, tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async findBySlug(slug: string, tenantId: string): Promise<ProductCatalog> {
    const product = await this.productRepository.findOne({
      where: { slug, tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    return product;
  }

  async findAll(
    tenantId: string,
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
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId });

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }
    if (filters?.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('product.tags && :tags', { tags: filters.tags });
    }
    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters?.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        query.andWhere('product.stockQuantity > 0');
      } else {
        query.andWhere('product.stockQuantity = 0');
      }
    }
    if (filters?.isPublished !== undefined) {
      query.andWhere('product.isPublished = :isPublished', {
        isPublished: filters.isPublished,
      });
    }

    query.orderBy('product.displayOrder', 'ASC').addOrderBy('product.name', 'ASC');
    return query.getMany();
  }

  async findPublished(tenantId: string): Promise<ProductCatalog[]> {
    return this.productRepository.find({
      where: {
        tenantId,
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
    tenantId: string,
    filters?: {
      categoryId?: string;
      tags?: string[];
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<ProductCatalog[]> {
    return this.findAll(tenantId, {
      search: query,
      isPublished: true,
      status: ProductStatus.ACTIVE,
      ...filters,
    });
  }

  async update(
    id: string,
    data: Partial<ProductCatalog>,
    tenantId: string,
    user: User,
  ): Promise<ProductCatalog> {
    const product = await this.findOne(id, tenantId);
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async remove(id: string, tenantId: string, user: User): Promise<void> {
    const product = await this.findOne(id, tenantId);
    await this.productRepository.remove(product);
  }

  async updateStock(
    id: string,
    quantity: number,
    tenantId: string,
  ): Promise<ProductCatalog> {
    const product = await this.findOne(id, tenantId);
    product.stockQuantity = quantity;
    if (product.trackInventory && quantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK && quantity > 0) {
      product.status = ProductStatus.ACTIVE;
    }
    return this.productRepository.save(product);
  }

  async publish(id: string, tenantId: string, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, tenantId);
    product.isPublished = true;
    product.publishedAt = new Date();
    return this.productRepository.save(product);
  }

  async unpublish(id: string, tenantId: string, user: User): Promise<ProductCatalog> {
    const product = await this.findOne(id, tenantId);
    product.isPublished = false;
    return this.productRepository.save(product);
  }

  async findByCategory(
    categoryId: string,
    tenantId: string,
  ): Promise<ProductCatalog[]> {
    return this.productRepository.find({
      where: {
        categoryId,
        tenantId,
        isPublished: true,
        status: ProductStatus.ACTIVE,
      },
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findByTags(tags: string[], tenantId: string): Promise<ProductCatalog[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.tags && :tags', { tags })
      .orderBy('product.displayOrder', 'ASC')
      .addOrderBy('product.name', 'ASC');
    return query.getMany();
  }

  async findLowStock(tenantId: string): Promise<ProductCatalog[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.trackInventory = :trackInventory', { trackInventory: true })
      .andWhere('product.stockQuantity > 0')
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .orderBy('product.stockQuantity', 'ASC');
    return query.getMany();
  }

  async findOutOfStock(tenantId: string): Promise<ProductCatalog[]> {
    return this.productRepository.find({
      where: {
        tenantId,
        trackInventory: true,
        stockQuantity: 0,
      },
      order: {
        name: 'ASC',
      },
    });
  }
}
