import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL } from '@/common/cache/cache.config';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    tenantId: string,
    userId?: string,
  ): Promise<Product> {
    // Check if SKU already exists for this tenant
    const existing = await this.productRepository.findOne({
      where: { sku: createProductDto.sku, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Product with SKU '${createProductDto.sku}' already exists`);
    }

    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return await this.productRepository.save(product);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const [data, total] = await this.productRepository.findAndCount({
      where: { tenantId },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(id: string, tenantId: string): Promise<Product> {
    const cacheKey = `product:${tenantId}:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await this.productRepository.findOne({
          where: { id, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
      },
      CacheTTL.LONG, // 15 minutes - products don't change often
    );
  }

  async findBySku(sku: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { sku, tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }

    return product;
  }

  async findByCategory(categoryId: string, tenantId: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { categoryId, tenantId },
      order: { name: 'ASC' },
    });
  }

  async findByStatus(status: ProductStatus, tenantId: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { status, tenantId },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    tenantId: string,
    userId?: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    // Check if new SKU conflicts
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku, tenantId },
      });

      if (existing) {
        throw new ConflictException(`Product with SKU '${updateProductDto.sku}' already exists`);
      }
    }

    Object.assign(product, updateProductDto);
    product.updatedBy = userId || 'system';

    const updated = await this.productRepository.save(product);

    // Invalidate cache
    await this.cacheService.del(`product:${tenantId}:${id}`);

    return updated;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    // Check if product exists (will throw if not found)
    await this.findOne(id, tenantId);
    await this.productRepository.softDelete({ id, tenantId });

    // Invalidate cache
    await this.cacheService.del(`product:${tenantId}:${id}`);
  }

  async search(query: string, tenantId: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(product.name ILIKE :query OR product.sku ILIKE :query OR product.description ILIKE :query)',
        {
          query: `%${query}%`,
        },
      )
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  async count(tenantId: string): Promise<number> {
    return await this.productRepository.count({
      where: { tenantId },
    });
  }

  async countByStatus(status: ProductStatus, tenantId: string): Promise<number> {
    return await this.productRepository.count({
      where: { status, tenantId },
    });
  }

  async updateStock(id: string, quantity: number, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    product.stockQuantity = quantity;

    // Auto-update status based on stock
    if (quantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK) {
      product.status = ProductStatus.ACTIVE;
    }

    return await this.productRepository.save(product);
  }

  async adjustStock(id: string, adjustment: number, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    const newQuantity = product.stockQuantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return await this.updateStock(id, newQuantity, tenantId);
  }

  async getLowStockProducts(tenantId: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.minStockLevel > 0')
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();
  }

  async getFeaturedProducts(tenantId: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { tenantId, isFeatured: true, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async activate(id: string, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.isActive = true;
    if (product.status === ProductStatus.INACTIVE) {
      product.status = ProductStatus.ACTIVE;
    }
    return await this.productRepository.save(product);
  }

  async deactivate(id: string, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.isActive = false;
    product.status = ProductStatus.INACTIVE;
    return await this.productRepository.save(product);
  }
}
