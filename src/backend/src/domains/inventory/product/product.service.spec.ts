import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { ProductStatus } from './enums/product-status.enum';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let _productRepository: Repository<Product>;
  let _cacheService: CacheService;
  let _permissionService: PermissionService;
  let secureProductRepo: any;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockProduct: Product = {
    id: 'product-1',
    tenantId: 'tenant-1',
    name: 'Test Product',
    sku: 'SKU-001',
    description: 'Test description',
    price: 100,
    cost: 50,
    categoryId: 'cat-1',
    status: ProductStatus.ACTIVE,
    stockQuantity: 100,
    minStockLevel: 10,
    maxStockLevel: 500,
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    del: jest.fn(),
  };

  const mockPermissionService = {
    checkPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    cacheService = module.get<CacheService>(CacheService);
    permissionService = module.get<PermissionService>(PermissionService);

    // Access private secureProductRepo
    secureProductRepo = (service as any).secureProductRepo;

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateProductDto = {
      name: 'New Product',
      sku: 'SKU-002',
      price: 150,
      cost: 75,
    } as CreateProductDto;

    it('should create product successfully', async () => {
      secureProductRepo.findOne = jest.fn().mockResolvedValue(null);
      secureProductRepo.save = jest.fn().mockResolvedValue({
        ...createDto,
        id: 'product-2',
        tenantId: 'tenant-1',
      });

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe('New Product');
      expect(result.sku).toBe('SKU-002');
      expect(secureProductRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { sku: 'SKU-002' },
      });
      expect(secureProductRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already exists', async () => {
      secureProductRepo.findOne = jest.fn().mockResolvedValue(mockProduct);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        "Product with SKU 'SKU-002' already exists",
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2', name: 'Product 2' }];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should return empty array when no products exist', async () => {
      secureProductRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      secureProductRepo.find = jest.fn().mockResolvedValue([mockProduct]);

      const result = await service.findAll(mockUser);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should handle pagination correctly', async () => {
      const products = Array.from({ length: 25 }, (_, i) => ({
        ...mockProduct,
        id: `product-${i}`,
        name: `Product ${i}`,
      }));
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.findAll(mockUser, 2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return product from cache if available', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUser, 'product-1');

      expect(result).toEqual(mockProduct);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'product:tenant-1:product-1',
        expect.any(Function),
        86400, // CacheTTL.LONG = 24 hours = 86400 seconds
      );
    });

    it('should fetch from database when cache miss', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureProductRepo.findOne = jest.fn().mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUser, 'product-1');

      expect(result).toEqual(mockProduct);
      expect(secureProductRepo.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureProductRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(
        'Product with ID nonexistent not found',
      );
    });
  });

  describe('findBySku', () => {
    it('should return product by SKU', async () => {
      secureProductRepo.findOne = jest.fn().mockResolvedValue(mockProduct);

      const result = await service.findBySku(mockUser, 'SKU-001');

      expect(result).toEqual(mockProduct);
      expect(secureProductRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { sku: 'SKU-001' },
      });
    });

    it('should throw NotFoundException when SKU not found', async () => {
      secureProductRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findBySku(mockUser, 'INVALID-SKU')).rejects.toThrow(NotFoundException);
      await expect(service.findBySku(mockUser, 'INVALID-SKU')).rejects.toThrow(
        "Product with SKU 'INVALID-SKU' not found",
      );
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.findByCategory(mockUser, 'cat-1');

      expect(result).toHaveLength(2);
      expect(secureProductRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { categoryId: 'cat-1' },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no products in category', async () => {
      secureProductRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.findByCategory(mockUser, 'empty-cat');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should return products by status', async () => {
      const products = [mockProduct];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.findByStatus(mockUser, ProductStatus.ACTIVE);

      expect(result).toHaveLength(1);
      expect(secureProductRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { status: ProductStatus.ACTIVE },
        order: { name: 'ASC' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 200,
    };

    it('should update product successfully', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.save = jest.fn().mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update(mockUser, 'product-1', updateDto);

      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(200);
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should check SKU uniqueness when updating SKU', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.findOne = jest.fn().mockResolvedValue(null);
      secureProductRepo.save = jest.fn().mockResolvedValue({
        ...mockProduct,
        sku: 'NEW-SKU',
      });

      const result = await service.update(mockUser, 'product-1', { sku: 'NEW-SKU' });

      expect(result.sku).toBe('NEW-SKU');
      expect(secureProductRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { sku: 'NEW-SKU' },
      });
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should throw ConflictException when new SKU already exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.findOne = jest.fn().mockResolvedValue({
        ...mockProduct,
        id: 'other-product',
      });

      await expect(service.update(mockUser, 'product-1', { sku: 'EXISTING-SKU' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating same SKU', async () => {
      const productCopy = { ...mockProduct };
      mockCacheService.getOrSet.mockResolvedValue(productCopy);
      secureProductRepo.save = jest.fn().mockResolvedValue(productCopy);

      const result = await service.update(mockUser, 'product-1', { sku: 'SKU-001' });

      expect(result.sku).toBe('SKU-001');
      // Should not check for conflicts when SKU is the same
      // findOne is not called because SKU hasn't changed
    });
  });

  describe('remove', () => {
    it('should remove product successfully', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.remove = jest.fn().mockResolvedValue(mockProduct);

      await service.remove(mockUser, 'product-1');

      expect(secureProductRepo.remove).toHaveBeenCalledWith(mockUser, mockProduct);
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });
  });

  describe('search', () => {
    it('should search products by name', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Product description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const products = [
        freshProduct,
        {
          ...freshProduct,
          id: 'product-2',
          name: 'Another Product',
          sku: 'SKU-002',
          description: 'Different description',
        },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.search(mockUser, 'Test');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
    });

    it('should search products by SKU', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Product description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const products = [
        freshProduct,
        {
          ...freshProduct,
          id: 'product-2',
          name: 'Another Product',
          sku: 'SKU-002',
          description: 'Different description',
        },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.search(mockUser, 'SKU-001');

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('SKU-001');
    });

    it('should search products by description', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Product One',
        sku: 'SKU-001',
        description: 'Test description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const products = [
        freshProduct,
        {
          ...freshProduct,
          id: 'product-2',
          name: 'Product Two',
          sku: 'SKU-002',
          description: 'Different description',
        },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.search(mockUser, 'Test description');

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Test description');
    });

    it('should be case insensitive', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Product description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const products = [
        freshProduct,
        {
          ...freshProduct,
          id: 'product-2',
          name: 'Another Product',
          sku: 'SKU-002',
          description: 'Different description',
        },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.search(mockUser, 'TEST');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
    });

    it('should return empty array when no matches found', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Product description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      const products = [freshProduct];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.search(mockUser, 'nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('should return product count', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no products exist', async () => {
      secureProductRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('countByStatus', () => {
    it('should return count by status', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.countByStatus(mockUser, ProductStatus.ACTIVE);

      expect(result).toBe(2);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity successfully', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.save = jest.fn().mockResolvedValue({
        ...mockProduct,
        stockQuantity: 50,
      });

      const result = await service.updateStock(mockUser, 'product-1', 50);

      expect(result.stockQuantity).toBe(50);
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should throw BadRequestException when quantity is negative', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      await expect(service.updateStock(mockUser, 'product-1', -10)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateStock(mockUser, 'product-1', -10)).rejects.toThrow(
        'Stock quantity cannot be negative',
      );
    });

    it('should set status to OUT_OF_STOCK when quantity is 0', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.updateStock(mockUser, 'product-1', 0);

      expect(result.stockQuantity).toBe(0);
      expect(result.status).toBe(ProductStatus.OUT_OF_STOCK);
    });

    it('should set status to ACTIVE when restocking OUT_OF_STOCK product', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        stockQuantity: 0,
        status: ProductStatus.OUT_OF_STOCK,
      };
      mockCacheService.getOrSet.mockResolvedValue(outOfStockProduct);
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.updateStock(mockUser, 'product-1', 50);

      expect(result.stockQuantity).toBe(50);
      expect(result.status).toBe(ProductStatus.ACTIVE);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock with positive adjustment', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Test description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      // Mock findOne (called by adjustStock)
      mockCacheService.getOrSet.mockResolvedValue(freshProduct);

      // Mock save (called by updateStock)
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.adjustStock(mockUser, 'product-1', 20);

      expect(result.stockQuantity).toBe(120); // 100 + 20
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should adjust stock with negative adjustment', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Test description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      // Mock findOne (called by adjustStock)
      mockCacheService.getOrSet.mockResolvedValue(freshProduct);

      // Mock save (called by updateStock)
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.adjustStock(mockUser, 'product-1', -30);

      expect(result.stockQuantity).toBe(70); // 100 - 30
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should throw BadRequestException when adjustment results in negative stock', async () => {
      const freshProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Test description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockCacheService.getOrSet.mockResolvedValue(freshProduct);

      await expect(service.adjustStock(mockUser, 'product-1', -150)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.adjustStock(mockUser, 'product-1', -150)).rejects.toThrow(
        'Insufficient stock',
      );
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with stock below minimum level', async () => {
      const products = [
        { ...mockProduct, id: 'p1', stockQuantity: 5, minStockLevel: 10 },
        { ...mockProduct, id: 'p2', stockQuantity: 15, minStockLevel: 10 },
        { ...mockProduct, id: 'p3', stockQuantity: 8, minStockLevel: 10 },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.getLowStockProducts(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].stockQuantity).toBe(5);
      expect(result[1].stockQuantity).toBe(8);
    });

    it('should sort by stock quantity ascending', async () => {
      const products = [
        { ...mockProduct, id: 'p1', stockQuantity: 8, minStockLevel: 10 },
        { ...mockProduct, id: 'p2', stockQuantity: 3, minStockLevel: 10 },
        { ...mockProduct, id: 'p3', stockQuantity: 5, minStockLevel: 10 },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.getLowStockProducts(mockUser);

      expect(result[0].stockQuantity).toBe(3);
      expect(result[1].stockQuantity).toBe(5);
      expect(result[2].stockQuantity).toBe(8);
    });

    it('should return empty array when no low stock products', async () => {
      const products = [{ ...mockProduct, stockQuantity: 100, minStockLevel: 10 }];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.getLowStockProducts(mockUser);

      expect(result).toHaveLength(0);
    });

    it('should ignore products with minStockLevel = 0', async () => {
      const products = [
        { ...mockProduct, id: 'p1', stockQuantity: 5, minStockLevel: 0 },
        { ...mockProduct, id: 'p2', stockQuantity: 5, minStockLevel: 10 },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.getLowStockProducts(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p2');
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured and active products', async () => {
      const products = [
        { ...mockProduct, isFeatured: true, isActive: true },
        { ...mockProduct, id: 'p2', isFeatured: true, isActive: true },
      ];
      secureProductRepo.find = jest.fn().mockResolvedValue(products);

      const result = await service.getFeaturedProducts(mockUser);

      expect(result).toHaveLength(2);
      expect(secureProductRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { isFeatured: true, isActive: true },
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no featured products', async () => {
      secureProductRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.getFeaturedProducts(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('activate', () => {
    it('should activate product successfully', async () => {
      const inactiveProduct = {
        ...mockProduct,
        isActive: false,
        status: ProductStatus.INACTIVE,
      };
      mockCacheService.getOrSet.mockResolvedValue(inactiveProduct);
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.activate(mockUser, 'product-1');

      expect(result.isActive).toBe(true);
      expect(result.status).toBe(ProductStatus.ACTIVE);
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });

    it('should not change status if already active', async () => {
      const activeProduct = {
        id: 'product-1',
        tenantId: 'tenant-1',
        name: 'Test Product',
        sku: 'SKU-001',
        description: 'Test description',
        price: 100,
        cost: 50,
        categoryId: 'cat-1',
        status: ProductStatus.ACTIVE,
        stockQuantity: 100,
        minStockLevel: 10,
        maxStockLevel: 500,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;

      mockCacheService.getOrSet.mockResolvedValue(activeProduct);
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.activate(mockUser, 'product-1');

      expect(result.isActive).toBe(true);
      expect(result.status).toBe(ProductStatus.ACTIVE);
    });
  });

  describe('deactivate', () => {
    it('should deactivate product successfully', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      secureProductRepo.save = jest.fn().mockImplementation((user, product) => {
        return Promise.resolve(product);
      });

      const result = await service.deactivate(mockUser, 'product-1');

      expect(result.isActive).toBe(false);
      expect(result.status).toBe(ProductStatus.INACTIVE);
      expect(mockCacheService.del).toHaveBeenCalledWith('product:tenant-1:product-1');
    });
  });
});
