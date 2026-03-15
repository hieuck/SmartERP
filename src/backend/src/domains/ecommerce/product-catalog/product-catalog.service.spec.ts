import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductCatalogService } from './product-catalog.service';
import { ProductCatalog } from './entities/product-catalog.entity';
import { PermissionService, User } from '@common/security/permission.service';
import { ProductStatus } from './enums/product-status.enum';

describe('ProductCatalogService', () => {
  let permissionService: jest.Mocked<PermissionService>;
  let service: ProductCatalogService;
  let repository: jest.Mocked<Repository<ProductCatalog>>;
  let _permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    slug: 'test-product',
    sku: 'TEST-001',
    description: 'Test description',
    shortDescription: 'Short desc',
    price: 100000,
    compareAtPrice: 120000,
    costPrice: 80000,
    status: ProductStatus.ACTIVE,
    isPublished: true,
    publishedAt: new Date(),
    categoryId: 'category-123',
    brandId: null,
    tags: ['electronics', 'gadgets'],
    images: ['image1.jpg', 'image2.jpg'],
    featuredImage: 'image1.jpg',
    trackInventory: true,
    stockQuantity: 100,
    minStockLevel: 10,
    maxStockLevel: 500,
    weight: 0.5,
    length: 10,
    width: 5,
    height: 2,
    dimensions: { length: 10, width: 5, height: 2 },
    shippingRequired: true,
    requiresShipping: true,
    taxable: true,
    metaTitle: 'Test Product',
    metaDescription: 'Test meta description',
    metaKeywords: ['test', 'product'],
    displayOrder: 1,
    isFeatured: false,
    relatedProductIds: [],
    variants: [],
    customFields: {},
    tenantId: 'tenant-123',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    generateSlug: jest.fn(),
    validate: jest.fn(),
    get isOnSale() {
      return this.compareAtPrice > this.price;
    },
    get discountPercentage() {
      return this.compareAtPrice > 0
        ? ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
        : 0;
    },
  } as unknown as ProductCatalog;

  const createMockQueryBuilder = () => {
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn() as jest.Mock,
    };
    return qb as unknown as SelectQueryBuilder<ProductCatalog>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCatalogService,
        {
          provide: getRepositoryToken(ProductCatalog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            canRead: jest.fn().mockReturnValue(true),
            canWrite: jest.fn().mockReturnValue(true),
            canDelete: jest.fn().mockReturnValue(true),
            buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
          },
        },
      ],
    }).compile();

    service = module.get<ProductCatalogService>(ProductCatalogService);
    repository = module.get(getRepositoryToken(ProductCatalog));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      repository.save.mockResolvedValue(mockProduct);

      const result = await service.create(
        { name: 'Test Product', sku: 'TEST-001', price: 100000 },
        mockUser,
      );

      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should set tenantId and createdBy from user', async () => {
      repository.save.mockResolvedValue(mockProduct);

      await service.create({ name: 'Test Product' }, mockUser);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockUser.tenantId,
          createdBy: mockUser.id,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-123', mockUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySku', () => {
    it('should return a product by sku', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku('TEST-001', mockUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { sku: 'TEST-001' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findBySku('INVALID-SKU', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('test-product', mockUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('invalid-slug', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all products for tenant', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(mockUser);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(qb.andWhere).toHaveBeenCalledWith('product.tenantId = :tenantId', {
        tenantId: mockUser.tenantId,
      });
      expect(result).toEqual([mockProduct]);
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { status: ProductStatus.ACTIVE });

      expect(qb.andWhere).toHaveBeenCalledWith('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
    });

    it('should filter by categoryId', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { categoryId: 'category-123' });

      expect(qb.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', {
        categoryId: 'category-123',
      });
    });

    it('should filter by tags', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { tags: ['electronics'] });

      expect(qb.andWhere).toHaveBeenCalledWith('product.tags && :tags', {
        tags: ['electronics'],
      });
    });

    it('should filter by search query', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { search: 'test' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('should filter by price range', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { minPrice: 50000, maxPrice: 150000 });

      expect(qb.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', {
        minPrice: 50000,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.price <= :maxPrice', {
        maxPrice: 150000,
      });
    });

    it('should filter by inStock true', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { inStock: true });

      expect(qb.andWhere).toHaveBeenCalledWith('product.stockQuantity > 0');
    });

    it('should filter by inStock false', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { inStock: false });

      expect(qb.andWhere).toHaveBeenCalledWith('product.stockQuantity = 0');
    });

    it('should filter by isPublished', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockUser, { isPublished: true });

      expect(qb.andWhere).toHaveBeenCalledWith('product.isPublished = :isPublished', {
        isPublished: true,
      });
    });
  });

  describe('findPublished', () => {
    it('should return only published active products', async () => {
      repository.find.mockResolvedValue([mockProduct]);

      const result = await service.findPublished(mockUser);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          status: ProductStatus.ACTIVE,
          tenantId: mockUser.tenantId,
        },
        order: {
          displayOrder: 'ASC',
          name: 'ASC',
        },
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.search('test', mockUser);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: '%test%' },
      );
      expect(result).toEqual([mockProduct]);
    });

    it('should apply additional filters in search', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      await service.search('test', mockUser, {
        categoryId: 'category-123',
        minPrice: 50000,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', {
        categoryId: 'category-123',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', {
        minPrice: 50000,
      });
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
      } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(updatedProduct);

      const result = await service.update('product-123', { name: 'Updated Product' }, mockUser);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', { name: 'Updated' }, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product successfully', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      repository.remove.mockResolvedValue(mockProduct);

      await service.remove('product-123', mockUser);

      expect(repository.findOne).toHaveBeenCalled();
      expect(repository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const updatedProduct = { ...mockProduct, stockQuantity: 50 } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(updatedProduct);

      const result = await service.updateStock('product-123', 50, mockUser);

      expect(result.stockQuantity).toBe(50);
    });

    it('should set status to OUT_OF_STOCK when quantity is 0 and trackInventory is true', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const outOfStockProduct = {
        ...mockProduct,
        stockQuantity: 0,
        status: ProductStatus.OUT_OF_STOCK,
      } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(outOfStockProduct);

      const result = await service.updateStock('product-123', 0, mockUser);

      expect(result.status).toBe(ProductStatus.OUT_OF_STOCK);
    });

    it('should set status to ACTIVE when quantity > 0 and was OUT_OF_STOCK', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        status: ProductStatus.OUT_OF_STOCK,
        stockQuantity: 0,
      } as unknown as ProductCatalog;
      repository.findOne.mockResolvedValue(outOfStockProduct);
      const activeProduct = {
        ...outOfStockProduct,
        stockQuantity: 10,
        status: ProductStatus.ACTIVE,
      } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(activeProduct);

      const result = await service.updateStock('product-123', 10, mockUser);

      expect(result.status).toBe(ProductStatus.ACTIVE);
      expect(result.stockQuantity).toBe(10);
    });
  });

  describe('publish', () => {
    it('should publish a product', async () => {
      const unpublishedProduct = {
        ...mockProduct,
        isPublished: false,
        publishedAt: null,
      } as unknown as ProductCatalog;
      repository.findOne.mockResolvedValue(unpublishedProduct);
      const publishedProduct = {
        ...unpublishedProduct,
        isPublished: true,
        publishedAt: new Date(),
      } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(publishedProduct);

      const result = await service.publish('product-123', mockUser);

      expect(result.isPublished).toBe(true);
      expect(result.publishedAt).toBeDefined();
    });
  });

  describe('unpublish', () => {
    it('should unpublish a product', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const unpublishedProduct = {
        ...mockProduct,
        isPublished: false,
      } as unknown as ProductCatalog;
      repository.save.mockResolvedValue(unpublishedProduct);

      const result = await service.unpublish('product-123', mockUser);

      expect(result.isPublished).toBe(false);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      repository.find.mockResolvedValue([mockProduct]);

      const result = await service.findByCategory('category-123', mockUser);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          categoryId: 'category-123',
          isPublished: true,
          status: ProductStatus.ACTIVE,
          tenantId: mockUser.tenantId,
        },
        order: {
          displayOrder: 'ASC',
          name: 'ASC',
        },
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findByTags', () => {
    it('should return products by tags', async () => {
      const qb = createMockQueryBuilder();
      (qb.getMany as jest.Mock).mockResolvedValue([mockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByTags(['electronics'], mockUser);

      expect(qb.andWhere).toHaveBeenCalledWith('product.tenantId = :tenantId', {
        tenantId: mockUser.tenantId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.tags && :tags', {
        tags: ['electronics'],
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findLowStock', () => {
    it('should return products with low stock', async () => {
      const qb = createMockQueryBuilder();
      const lowStockProduct = { ...mockProduct, stockQuantity: 5 } as unknown as ProductCatalog;
      (qb.getMany as jest.Mock).mockResolvedValue([lowStockProduct]);
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findLowStock(mockUser);

      expect(qb.andWhere).toHaveBeenCalledWith('product.trackInventory = :trackInventory', {
        trackInventory: true,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('product.stockQuantity > 0');
      expect(qb.andWhere).toHaveBeenCalledWith('product.stockQuantity <= product.minStockLevel');
      expect(result).toEqual([lowStockProduct]);
    });
  });

  describe('findOutOfStock', () => {
    it('should return out of stock products', async () => {
      const outOfStockProduct = { ...mockProduct, stockQuantity: 0 } as unknown as ProductCatalog;
      repository.find.mockResolvedValue([outOfStockProduct]);

      const result = await service.findOutOfStock(mockUser);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          trackInventory: true,
          stockQuantity: 0,
          tenantId: mockUser.tenantId,
        },
        order: {
          name: 'ASC',
        },
      });
      expect(result).toEqual([outOfStockProduct]);
    });
  });
});
