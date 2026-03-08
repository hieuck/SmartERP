import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductCatalogService } from './product-catalog.service';
import { ProductCatalog, ProductStatus } from './entities/product-catalog.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductCatalogService', () => {
  let service: ProductCatalogService;
  let repository: Repository<ProductCatalog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
  };

  const mockProduct = {
    id: 'prod-123',
    sku: 'PROD-001',
    name: 'Test Product',
    price: 100000,
    stockQuantity: 50,
    status: ProductStatus.ACTIVE,
    tenantId: 'tenant-123',
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCatalogService,
        {
          provide: getRepositoryToken(ProductCatalog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductCatalogService>(ProductCatalogService);
    repository = module.get<Repository<ProductCatalog>>(
      getRepositoryToken(ProductCatalog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const dto = {
        sku: 'PROD-001',
        name: 'Test Product',
        price: 100000,
      };

      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(mockUser, dto, mockUser);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-123',
        createdBy: 'user-123',
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUser, 'prod-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'prod-123', tenantId: 'tenant-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(mockUser, 'prod-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku('PROD-001', mockUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sku: 'PROD-001', tenantId: 'tenant-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findBySku('PROD-999', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('test-product', mockUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-product', tenantId: 'tenant-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findBySlug('invalid-slug', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search products with filters', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const dto = {
        search: 'test',
        status: ProductStatus.ACTIVE,
        page: 1,
        limit: 20,
      };

      const result = await service.search(dto, mockUser);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const dto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...dto };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(mockUser, 'prod-123', dto);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('prod-999', {}, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.remove.mockResolvedValue(mockProduct);

      await service.remove(mockUser, 'prod-123');

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(mockUser, 'prod-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish a product', async () => {
      const unpublishedProduct = { ...mockProduct, isPublished: false };
      const publishedProduct = { ...mockProduct, isPublished: true };

      mockRepository.findOne.mockResolvedValue(unpublishedProduct);
      mockRepository.save.mockResolvedValue(publishedProduct);

      const result = await service.publish('prod-123', mockUser);

      expect(result.isPublished).toBe(true);
      expect(result.publishedAt).toBeDefined();
    });
  });

  describe('unpublish', () => {
    it('should unpublish a product', async () => {
      const publishedProduct = { ...mockProduct, isPublished: true };
      const unpublishedProduct = { ...mockProduct, isPublished: false };

      mockRepository.findOne.mockResolvedValue(publishedProduct);
      mockRepository.save.mockResolvedValue(unpublishedProduct);

      const result = await service.unpublish('prod-123', mockUser);

      expect(result.isPublished).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      const updatedProduct = { ...mockProduct, stockQuantity: 100 };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.updateStock('prod-123', 100, mockUser);

      expect(result.stockQuantity).toBe(100);
    });

    it('should update status to OUT_OF_STOCK when quantity is 0', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        stockQuantity: 0,
        status: ProductStatus.OUT_OF_STOCK,
      };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(outOfStockProduct);

      const result = await service.updateStock('prod-123', 0, mockUser);

      expect(result.stockQuantity).toBe(0);
      expect(result.status).toBe(ProductStatus.OUT_OF_STOCK);
    });
  });

  describe('findLowStock', () => {
    it('should return products with low stock', async () => {
      const lowStockProducts = [
        { ...mockProduct, stockQuantity: 5, minStockLevel: 10 },
      ];

      mockRepository.find.mockResolvedValue(lowStockProducts);

      const result = await service.findLowStock(mockUser);

      expect(result).toEqual(lowStockProducts);
    });
  });

  describe('findOutOfStock', () => {
    it('should return out of stock products', async () => {
      const outOfStockProducts = [
        { ...mockProduct, stockQuantity: 0, status: ProductStatus.OUT_OF_STOCK },
      ];

      mockRepository.find.mockResolvedValue(outOfStockProducts);

      const result = await service.findOutOfStock(mockUser);

      expect(result).toEqual(outOfStockProducts);
    });
  });
});
