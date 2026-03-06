import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
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
          useValue: mockProductRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
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

      const result = await service.create(productData as any, 'tenant-1');

      expect(result).toEqual(productData);
    });

    it('should throw ConflictException if SKU exists', async () => {
      const productData = { sku: 'PROD-001' };
      mockProductRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(productData as any, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];
      mockProductRepository.findAndCount.mockResolvedValue([mockProducts, 2]);

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result.data).toEqual(mockProducts);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should find product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1' };
      mockCacheService.getOrSet.mockResolvedValue(mockProduct);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockProduct);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
