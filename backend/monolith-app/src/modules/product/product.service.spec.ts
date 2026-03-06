import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product, ProductStatus, ProductType } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('ProductService', () => {
  let service: ProductService;

  const mockProduct: Partial<Product> = {
    id: '1',
    sku: 'PROD-001',
    name: 'Test Product',
    description: 'Test Description',
    type: ProductType.PHYSICAL,
    status: ProductStatus.ACTIVE,
    price: 100,
    cost: 50,
    stockQuantity: 10,
    minStockLevel: 5,
    maxStockLevel: 100,
    categoryId: 'cat-1',
    tenantId: 'tenant-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateProductDto = {
      sku: 'PROD-001',
      name: 'Test Product',
      description: 'Test Description',
      type: ProductType.PHYSICAL,
      price: 100,
      cost: 50,
      categoryId: 'cat-1',
    };

    it('should create a new product', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto, 'tenant-1', 'user-1');

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sku: createDto.sku, tenantId: 'tenant-1' },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createDto, 'tenant-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products for tenant', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      const result = await service.findAll('tenant-1');

      expect(result.data).toEqual([mockProduct]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { name: 'ASC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockProduct);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku('PROD-001', 'tenant-1');

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sku: 'PROD-001', tenantId: 'tenant-1' },
      });
    });

    it('should throw NotFoundException if SKU not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySku('INVALID', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      mockRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.findByCategory('cat-1', 'tenant-1');

      expect(result).toEqual([mockProduct]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1', tenantId: 'tenant-1' },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return products by status', async () => {
      mockRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.findByStatus(ProductStatus.ACTIVE, 'tenant-1');

      expect(result).toEqual([mockProduct]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ProductStatus.ACTIVE, tenantId: 'tenant-1' },
        order: { name: 'ASC' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 150,
    };

    it('should update a product', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1', 'user-1');

      expect(result).toEqual(updatedProduct);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new SKU already exists', async () => {
      const updateDtoWithSku: UpdateProductDto = { sku: 'PROD-002' };
      mockRepository.findOne
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, id: '2' });

      await expect(service.update('1', updateDtoWithSku, 'tenant-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.search('test', 'tenant-1');

      expect(result).toEqual([mockProduct]);
      expect(queryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should count all products for tenant', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });
  });

  describe('countByStatus', () => {
    it('should count products by status', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countByStatus(ProductStatus.ACTIVE, 'tenant-1');

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { status: ProductStatus.ACTIVE, tenantId: 'tenant-1' },
      });
    });
  });

  describe('updateStock', () => {
    it('should update product stock quantity', async () => {
      const updatedProduct = { ...mockProduct, stockQuantity: 20 };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.updateStock('1', 20, 'tenant-1');

      expect(result.stockQuantity).toBe(20);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative stock', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.updateStock('1', -5, 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should set status to OUT_OF_STOCK when quantity is 0', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        stockQuantity: 0,
        status: ProductStatus.OUT_OF_STOCK,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(outOfStockProduct);

      const result = await service.updateStock('1', 0, 'tenant-1');

      expect(result.status).toBe(ProductStatus.OUT_OF_STOCK);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock by positive amount', async () => {
      const adjustedProduct = { ...mockProduct, stockQuantity: 15 };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(adjustedProduct);

      const result = await service.adjustStock('1', 5, 'tenant-1');

      expect(result.stockQuantity).toBe(15);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.adjustStock('1', -20, 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with low stock', async () => {
      const lowStockProduct = { ...mockProduct, stockQuantity: 3, minStockLevel: 5 };
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([lowStockProduct]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getLowStockProducts('tenant-1');

      expect(result).toEqual([lowStockProduct]);
    });
  });

  describe('activate', () => {
    it('should activate a product', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false, status: ProductStatus.INACTIVE };
      const activatedProduct = { ...mockProduct, isActive: true, status: ProductStatus.ACTIVE };
      mockCacheService.getOrSet.mockResolvedValue(inactiveProduct);
      mockRepository.findOne.mockResolvedValue(inactiveProduct);
      mockRepository.save.mockResolvedValue(activatedProduct);

      const result = await service.activate('1', 'tenant-1');

      expect(result.isActive).toBe(true);
      expect(result.status).toBe(ProductStatus.ACTIVE);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a product', async () => {
      const deactivatedProduct = {
        ...mockProduct,
        isActive: false,
        status: ProductStatus.INACTIVE,
      };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(deactivatedProduct);

      const result = await service.deactivate('1', 'tenant-1');

      expect(result.isActive).toBe(false);
      expect(result.status).toBe(ProductStatus.INACTIVE);
    });
  });
});
