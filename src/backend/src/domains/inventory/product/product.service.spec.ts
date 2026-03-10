import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn()
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn()
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasPermission: jest.fn().mockResolvedValue(true),
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canDelete: jest.fn().mockReturnValue(true),
    canUpdate: jest.fn().mockReturnValue(true),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true)
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository
  },
        {
          provide: CacheService,
          useValue: mockCacheService
  },
        {
          provide: PermissionService,
          useValue: mockPermissionService
  },
      ]
  }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create product', async () => {
      const productData = { sku: 'PROD-001', name: 'Product 1', price: 100 };
      mockProductRepository.findOne.mockResolvedValue(null);
      mockProductRepository.create.mockReturnValue(productData);
      mockProductRepository.save.mockResolvedValue(productData);

      const result = await service.create(mockUser, productData as any);

      expect(result).toEqual(productData);
    });

    it('should throw ConflictException if SKU exists', async () => {
      const productData = { sku: 'PROD-001' };
      mockProductRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(mockUser, productData as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', sku: 'PROD-001', description: 'Desc 1' },
        { id: '2', name: 'Product 2', sku: 'PROD-002', description: 'Desc 2' },
      ];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mockProducts);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should find product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockProduct);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySku', () => {
    it('should find product by SKU', async () => {
      const mockProduct = { id: '1', sku: 'PROD-001' };
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku(mockUser, 'PROD-001');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if SKU not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySku(mockUser, 'INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const mockProducts = [{ id: '1', categoryId: 'cat-1' }];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findByCategory(mockUser, 'cat-1');

      expect(result).toEqual(mockProducts);
    });
  });

  describe('findByStatus', () => {
    it('should find products by status', async () => {
      const mockProducts = [{ id: '1', status: 'ACTIVE' }];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findByStatus(mockUser, 'ACTIVE' as any);

      expect(result).toEqual(mockProducts);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const mockProduct = { id: '1', sku: 'PROD-001', name: 'Old Name' };
      const updateDto = { name: 'New Name' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update(mockUser, '1', updateDto);

      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new SKU exists', async () => {
      const mockProduct = { id: '1', sku: 'PROD-001' };
      const updateDto = { sku: 'PROD-002' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.findOne.mockResolvedValue({ id: '2', sku: 'PROD-002' });

      await expect(service.update(mockUser, '1', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove product', async () => {
      const mockProduct = { id: '1' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.remove.mockResolvedValue(mockProduct);

      await service.remove(mockUser, '1');

      expect(mockProductRepository.remove).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      const mockProducts = [
        { id: '1', name: 'Test Product', sku: 'TEST-001', description: 'Test description' },
      ];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.search(mockUser, 'test');

      expect(result).toEqual(mockProducts);
    });
  });

  describe('count', () => {
    it('should return product count', async () => {
      const mockProducts = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Product ${i + 1}`
  }));
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.count(mockUser);

      expect(result).toBe(100);
    });
  });

  describe('countByStatus', () => {
    it('should return count by status', async () => {
      const mockProducts = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        status: 'ACTIVE'
  }));
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.countByStatus(mockUser, 'ACTIVE' as any);

      expect(result).toBe(50);
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const mockProduct = { id: '1', stockQuantity: 10, status: 'ACTIVE' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({ ...mockProduct, stockQuantity: 20 });

      const result = await service.updateStock(mockUser, '1', 20);

      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative quantity', async () => {
      const mockProduct = { id: '1' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      await expect(service.updateStock(mockUser, '1', -5)).rejects.toThrow(
        'Stock quantity cannot be negative',
      );
    });

    it('should set status to OUT_OF_STOCK when quantity is 0', async () => {
      const mockProduct = { id: '1', stockQuantity: 10, status: 'ACTIVE' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 0,
        status: 'OUT_OF_STOCK'
  });

      const result = await service.updateStock(mockUser, '1', 0);

      expect(mockProductRepository.save).toHaveBeenCalled();
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock positively', async () => {
      const mockProduct = { id: '1', stockQuantity: 10 };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({ ...mockProduct, stockQuantity: 15 });

      const result = await service.adjustStock(mockUser, '1', 5);

      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const mockProduct = { id: '1', stockQuantity: 5 };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      await expect(service.adjustStock(mockUser, '1', -10)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      const mockProducts = [{ id: '1', stockQuantity: 2, minStockLevel: 10 }];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.getLowStockProducts(mockUser);

      expect(result).toEqual(mockProducts);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      const mockProducts = [{ id: '1', isFeatured: true, isActive: true }];
      mockProductRepository.find.mockResolvedValue(mockProducts);

      const result = await service.getFeaturedProducts(mockUser);

      expect(result).toEqual(mockProducts);
    });
  });

  describe('activate', () => {
    it('should activate product', async () => {
      const mockProduct = { id: '1', isActive: false, status: 'INACTIVE' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        isActive: true,
        status: 'ACTIVE'
  });

      const result = await service.activate(mockUser, '1');

      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate product', async () => {
      const mockProduct = { id: '1', isActive: true, status: 'ACTIVE' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        isActive: false,
        status: 'INACTIVE'
  });

      const result = await service.deactivate(mockUser, '1');

      expect(result.isActive).toBe(false);
      expect(result.status).toBe('INACTIVE');
    });
  });
});
