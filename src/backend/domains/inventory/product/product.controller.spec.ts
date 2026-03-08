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
      const createDto = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
        categoryId: 'cat-1',
      };
      const mockProduct = { id: 'prod-1', ...createDto, tenantId: mockUser.tenantId };
      mockProductService.create.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.create(mockUser, createDto as any, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', tenantId: mockUser.tenantId },
        { id: 'prod-2', name: 'Product 2', tenantId: mockUser.tenantId },
      ];
      mockProductService.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(mockUser);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should filter products by status', async () => {
      // Arrange
      const status = ProductStatus.ACTIVE;
      const mockProducts = [{ id: 'prod-1', status, tenantId: mockUser.tenantId }];
      mockProductService.findByStatus.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(mockUser, status);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findByStatus).toHaveBeenCalledWith(mockUser, status);
    });

    it('should filter products by category', async () => {
      // Arrange
      const categoryId = 'cat-1';
      const mockProducts = [{ id: 'prod-1', categoryId, tenantId: mockUser.tenantId }];
      mockProductService.findByCategory.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.findAll(mockUser, undefined, categoryId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.findByCategory).toHaveBeenCalledWith(mockUser, categoryId);
    });
  });

  describe('count', () => {
    it('should return product count', async () => {
      // Arrange
      mockProductService.count.mockResolvedValue(10);

      // Act
      const result = await controller.count(mockUser);

      // Assert
      expect(result).toBe(10);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return count by status', async () => {
      // Arrange
      const status = ProductStatus.ACTIVE;
      mockProductService.countByStatus.mockResolvedValue(5);

      // Act
      const result = await controller.count(mockUser, status);

      // Assert
      expect(result).toBe(5);
      expect(service.countByStatus).toHaveBeenCalledWith(mockUser, status);
    });
  });

  describe('search', () => {
    it('should search products', async () => {
      // Arrange
      const query = 'test';
      const mockProducts = [{ id: 'prod-1', name: 'Test Product', tenantId: mockUser.tenantId }];
      mockProductService.search.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.search(mockUser, query);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.search).toHaveBeenCalledWith(mockUser, query);
    });
  });

  describe('getLowStock', () => {
    it('should return low stock products', async () => {
      // Arrange
      const mockProducts = [{ id: 'prod-1', stock: 5, tenantId: mockUser.tenantId }];
      mockProductService.getLowStockProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.getLowStock(mockUser);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.getLowStockProducts).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getFeatured', () => {
    it('should return featured products', async () => {
      // Arrange
      const mockProducts = [{ id: 'prod-1', featured: true, tenantId: mockUser.tenantId }];
      mockProductService.getFeaturedProducts.mockResolvedValue(mockProducts);

      // Act
      const result = await controller.getFeatured(mockUser);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(service.getFeaturedProducts).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findBySku', () => {
    it('should find product by SKU', async () => {
      // Arrange
      const sku = 'TEST-001';
      const mockProduct = { id: 'prod-1', sku, tenantId: mockUser.tenantId };
      mockProductService.findBySku.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findBySku(mockUser, sku);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.findBySku).toHaveBeenCalledWith(mockUser, sku);
    });
  });

  describe('findOne', () => {
    it('should find product by id', async () => {
      // Arrange
      const productId = 'prod-1';
      const mockProduct = { id: productId, name: 'Test', tenantId: mockUser.tenantId };
      mockProductService.findOne.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findOne(mockUser, productId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, productId);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      // Arrange
      const productId = 'prod-1';
      const updateDto = { name: 'Updated Product' };
      const mockProduct = { id: productId, ...updateDto, tenantId: mockUser.tenantId };
      mockProductService.update.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.update(productId, mockUser, updateDto as any, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith(mockUser, productId, updateDto);
    });
  });

  describe('partialUpdate', () => {
    it('should partially update product', async () => {
      // Arrange
      const productId = 'prod-1';
      const updateDto = { price: 150 };
      const mockProduct = { id: productId, ...updateDto, tenantId: mockUser.tenantId };
      mockProductService.update.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.partialUpdate(productId, mockUser, updateDto as any, mockRequest as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith(mockUser, productId, updateDto);
    });
  });

  describe('updateStock', () => {
    it('should update product stock', async () => {
      // Arrange
      const productId = 'prod-1';
      const quantity = 100;
      const mockProduct = { id: productId, stock: quantity, tenantId: mockUser.tenantId };
      mockProductService.updateStock.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.updateStock(productId, { quantity }, mockUser);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.updateStock).toHaveBeenCalledWith(mockUser, productId, quantity);
    });
  });

  describe('adjustStock', () => {
    it('should adjust product stock', async () => {
      // Arrange
      const productId = 'prod-1';
      const adjustment = -5;
      const mockProduct = { id: productId, stock: 95, tenantId: mockUser.tenantId };
      mockProductService.adjustStock.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.adjustStock(productId, { adjustment }, mockUser);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.adjustStock).toHaveBeenCalledWith(mockUser, productId, adjustment);
    });
  });

  describe('activate', () => {
    it('should activate product', async () => {
      // Arrange
      const productId = 'prod-1';
      const mockProduct = { id: productId, status: ProductStatus.ACTIVE, tenantId: mockUser.tenantId };
      mockProductService.activate.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.activate(mockUser, productId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.activate).toHaveBeenCalledWith(mockUser, productId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate product', async () => {
      // Arrange
      const productId = 'prod-1';
      const mockProduct = { id: productId, status: ProductStatus.INACTIVE, tenantId: mockUser.tenantId };
      mockProductService.deactivate.mockResolvedValue(mockProduct);

      // Act
      const result = await controller.deactivate(mockUser, productId);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(service.deactivate).toHaveBeenCalledWith(mockUser, productId);
    });
  });

  describe('remove', () => {
    it('should delete product', async () => {
      // Arrange
      const productId = 'prod-1';
      mockProductService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(mockUser, productId);

      // Assert
      expect(result).toEqual({ message: 'Product deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, productId);
    });
  });
});
