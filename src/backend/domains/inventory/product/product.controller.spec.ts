import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductStatus } from './entities/product.entity';
import { createMockUser } from '@/common/test/test-helpers';

describe('ProductController (Unit)', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByStatus: jest.fn(),
    findByCategory: jest.fn(),
    count: jest.fn(),
    countByStatus: jest.fn(),
    search: jest.fn(),
    getLowStockProducts: jest.fn(),
    getFeaturedProducts: jest.fn(),
    findBySku: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStock: jest.fn(),
    adjustStock: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockRequest = {
    user: { id: 'user-123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create new product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const createDto = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
        categoryId: 'cat-1',
      };
      const mockProduct = { id: 'prod-1', ...createDto, tenantId };
      mockProductService.create.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.create(createDto as any, tenantId, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createDto, tenantId, 'user-123');
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', tenantId },
        { id: 'prod-2', name: 'Product 2', tenantId },
      ];
      mockProductService.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(tenantId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findAll).toHaveBeenCalledWith(tenantId);
    });

    it('should filter products by status', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const status = ProductStatus.ACTIVE;
      const mockProducts = [{ id: 'prod-1', status, tenantId }];
      mockProductService.findByStatus.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(tenantId, status);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findByStatus).toHaveBeenCalledWith(status, tenantId);
    });

    it('should filter products by category', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const categoryId = 'cat-1';
      const mockProducts = [{ id: 'prod-1', categoryId, tenantId }];
      mockProductService.findByCategory.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(tenantId, undefined, categoryId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findByCategory).toHaveBeenCalledWith(categoryId, tenantId);
    });
  });

  describe('count', () => {
    it('should return product count', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      mockProductService.count.mockResolvedValue(10);

      // Act
      const result = await controller.count(tenantId);

      // Assert
      expect(result).toBe(10);
      expect(service.count).toHaveBeenCalledWith(tenantId);
    });

    it('should return count by status', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const status = ProductStatus.ACTIVE;
      mockProductService.countByStatus.mockResolvedValue(5);

      // Act
      const result = await controller.count(tenantId, status);

      // Assert
      expect(result).toBe(5);
      expect(service.countByStatus).toHaveBeenCalledWith(status, tenantId);
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const query = 'test';
      const mockProducts = [{ id: 'prod-1', name: 'Test Product', tenantId }];
      mockProductService.search.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.search(query, tenantId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.search).toHaveBeenCalledWith(query, tenantId);
    });
  });

  describe('getLowStock', () => {
    it('should return low stock products', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockProducts = [{ id: 'prod-1', stock: 5, tenantId }];
      mockProductService.getLowStockProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.getLowStock(tenantId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.getLowStockProducts).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('getFeatured', () => {
    it('should return featured products', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockProducts = [{ id: 'prod-1', featured: true, tenantId }];
      mockProductService.getFeaturedProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.getFeatured(tenantId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.getFeaturedProducts).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findBySku', () => {
    it('should find product by SKU', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const sku = 'TEST-001';
      const mockProduct = { id: 'prod-1', sku, tenantId };
      mockProductService.findBySku.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findBySku(sku, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.findBySku).toHaveBeenCalledWith(sku, tenantId);
    });
  });

  describe('findOne', () => {
    it('should find product by id', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const mockProduct = { id: productId, name: 'Test', tenantId };
      mockProductService.findOne.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findOne(productId, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith(productId, tenantId);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const updateDto = { name: 'Updated Product' };
      const mockProduct = { id: productId, ...updateDto, tenantId };
      mockProductService.update.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.update(productId, updateDto as any, tenantId, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith(productId, updateDto, tenantId, 'user-123');
    });
  });

  describe('partialUpdate', () => {
    it('should partially update product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const updateDto = { price: 150 };
      const mockProduct = { id: productId, ...updateDto, tenantId };
      mockProductService.update.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.partialUpdate(productId, updateDto as any, tenantId, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith(productId, updateDto, tenantId, 'user-123');
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const quantity = 100;
      const mockProduct = { id: productId, stock: quantity, tenantId };
      mockProductService.updateStock.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.updateStock(productId, { quantity }, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.updateStock).toHaveBeenCalledWith(productId, quantity, tenantId);
    });
  });

  describe('adjustStock', () => {
    it('should adjust product stock', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const adjustment = -5;
      const mockProduct = { id: productId, stock: 95, tenantId };
      mockProductService.adjustStock.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.adjustStock(productId, { adjustment }, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.adjustStock).toHaveBeenCalledWith(productId, adjustment, tenantId);
    });
  });

  describe('activate', () => {
    it('should activate product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const mockProduct = { id: productId, status: ProductStatus.ACTIVE, tenantId };
      mockProductService.activate.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.activate(productId, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.activate).toHaveBeenCalledWith(productId, tenantId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      const mockProduct = { id: productId, status: ProductStatus.INACTIVE, tenantId };
      mockProductService.deactivate.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.deactivate(productId, tenantId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.deactivate).toHaveBeenCalledWith(productId, tenantId);
    });
  });

  describe('remove', () => {
    it('should delete product', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const productId = 'prod-1';
      mockProductService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(productId, tenantId);

      // Assert
      expect(result).toEqual({ message: 'Product deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(productId, tenantId);
    });
  });
});
