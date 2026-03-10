import { CacheTTL } from '@/common/cache/cache.config';
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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from './entities/product.entity';

@Injectable()
export class ProductService {
  private secureProductRepo: SecureRepository<Product>;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureProductRepo = new SecureRepository(productRepository, permissionService, 'Product');
  }

  async create(user: User, createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists for this tenant
    const existing = await this.secureProductRepo.findOne(user, {
      where: { sku: createProductDto.sku },
    });

    if (existing) {
      throw new ConflictException(`Product with SKU '${createProductDto.sku}' already exists`);
    }

    const product = {
      ...createProductDto,
    };

    return await this.secureProductRepo.save(user, product);
  }

  async findAll(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const allProducts = await this.secureProductRepo.find(user, {
      order: { name: 'ASC' },
    });

    const total = allProducts.length;
    const data = allProducts.slice((page - 1) * limit, page * limit);

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

  async findOne(user: User, id: string): Promise<Product> {
    const cacheKey = `product:${user.tenantId}:${id}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const product = await this.secureProductRepo.findOne(user, {
          where: { id, tenantId: user.tenantId } as any,
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
      },
      CacheTTL.LONG, // 15 minutes - products don't change often
    );
  }

  async findBySku(user: User, sku: string): Promise<Product> {
    const product = await this.secureProductRepo.findOne(user, {
      where: { sku },
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found`);
    }

    return product;
  }

  async findByCategory(user: User, categoryId: string): Promise<Product[]> {
    return await this.secureProductRepo.find(user, {
      where: { categoryId },
      order: { name: 'ASC' },
    });
  }

  async findByStatus(user: User, status: ProductStatus): Promise<Product[]> {
    return await this.secureProductRepo.find(user, {
      where: { status },
      order: { name: 'ASC' },
    });
  }

  async update(user: User, id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(user, id);

    // Check if new SKU conflicts
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.secureProductRepo.findOne(user, {
        where: { sku: updateProductDto.sku },
      });

      if (existing) {
        throw new ConflictException(`Product with SKU '${updateProductDto.sku}' already exists`);
      }
    }

    Object.assign(product, updateProductDto);

    const updated = await this.secureProductRepo.save(user, product);

    // Invalidate cache
    await this.cacheService.del(`product:${user.tenantId}:${id}`);

    return updated;
  }

  async remove(user: User, id: string): Promise<void> {
    const product = await this.findOne(user, id);
    await this.secureProductRepo.remove(user, product);

    // Invalidate cache
    await this.cacheService.del(`product:${user.tenantId}:${id}`);
  }

  async search(user: User, query: string): Promise<Product[]> {
    const allProducts = await this.secureProductRepo.find(user, {});

    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase())),
    );
  }

  async count(user: User): Promise<number> {
    const products = await this.secureProductRepo.find(user, {});
    return products.length;
  }

  async countByStatus(user: User, status: ProductStatus): Promise<number> {
    const products = await this.findByStatus(user, status);
    return products.length;
  }

  async updateStock(user: User, id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(user, id);

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

    const updated = await this.secureProductRepo.save(user, product);

    // Invalidate cache
    await this.cacheService.del(`product:${user.tenantId}:${id}`);

    return updated;
  }

  async adjustStock(user: User, id: string, adjustment: number): Promise<Product> {
    const product = await this.findOne(user, id);

    const newQuantity = product.stockQuantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return await this.updateStock(user, id, newQuantity);
  }

  async getLowStockProducts(user: User): Promise<Product[]> {
    const allProducts = await this.secureProductRepo.find(user, {});

    return allProducts
      .filter((p) => p.minStockLevel > 0 && p.stockQuantity <= p.minStockLevel)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }

  async getFeaturedProducts(user: User): Promise<Product[]> {
    return await this.secureProductRepo.find(user, {
      where: { isFeatured: true, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async activate(user: User, id: string): Promise<Product> {
    const product = await this.findOne(user, id);
    product.isActive = true;
    if (product.status === ProductStatus.INACTIVE) {
      product.status = ProductStatus.ACTIVE;
    }
    const updated = await this.secureProductRepo.save(user, product);

    // Invalidate cache
    await this.cacheService.del(`product:${user.tenantId}:${id}`);

    return updated;
  }

  async deactivate(user: User, id: string): Promise<Product> {
    const product = await this.findOne(user, id);
    product.isActive = false;
    product.status = ProductStatus.INACTIVE;
    const updated = await this.secureProductRepo.save(user, product);

    // Invalidate cache
    await this.cacheService.del(`product:${user.tenantId}:${id}`);

    return updated;
  }
}
