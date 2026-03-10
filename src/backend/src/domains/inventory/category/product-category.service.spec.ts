import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCategoryService } from './product-category.service';

describe('ProductCategoryService', () => {
  let service: ProductCategoryService;

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
  };

  const mockPermissionService = {
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  const mockUser = createMockUser({ id: 'user-1', tenantId: 'tenant-1' });

  const mockCategory: ProductCategory = {
    id: '1',
    name: 'Test Category',
    description: 'Test Description',
    isActive: true,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoryService,
        {
          provide: getRepositoryToken(ProductCategory),
          useValue: mockCategoryRepository,
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

    service = module.get<ProductCategoryService>(ProductCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createDto: CreateProductCategoryDto = {
        name: 'New Category',
        description: 'New Description',
      };

      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.save.mockResolvedValue({
        ...createDto,
        id: '1',
        tenantId: 'tenant-1',
        createdBy: 'user-1',
      });

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
      expect(mockCategoryRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if category name already exists', async () => {
      const createDto: CreateProductCategoryDto = {
        name: 'Existing Category',
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    });

    it('should set createdBy from user context', async () => {
      const createDto: CreateProductCategoryDto = {
        name: 'New Category',
      };

      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.save.mockImplementation((entity) =>
        Promise.resolve({ id: '1', ...entity }),
      );

      await service.create(mockUser, createDto);

      const savedEntity = mockCategoryRepository.save.mock.calls[0][0];
      expect(savedEntity.createdBy).toBe('user-1');
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const mockCategories = [
        { ...mockCategory, id: '1', name: 'Category 1' },
        { ...mockCategory, id: '2', name: 'Category 2' },
      ];

      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should apply tenant filter', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      await service.findAll(mockUser, 1, 20);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const mockCategories = Array.from({ length: 25 }, (_, i) => ({
        ...mockCategory,
        id: `${i + 1}`,
        name: `Category ${i + 1}`,
      }));

      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAll(mockUser, 2, 10);

      expect(result.data).toHaveLength(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return category from cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockCategory);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('tenant-1'),
        expect.any(Function),
        expect.any(Number),
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });

    it('should include tenantId in cache key', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      await service.findOne(mockUser, '1');

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0];
      expect(cacheKey).toContain('tenant-1');
      expect(cacheKey).toContain('1');
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const updateDto: UpdateProductCategoryDto = {
        name: 'Updated Category',
        description: 'Updated Description',
      };

      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
        updatedBy: 'user-1',
      });

      const result = await service.update(mockUser, '1', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto: UpdateProductCategoryDto = {
        name: 'Existing Category',
      };

      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue({
        ...mockCategory,
        id: '2',
        name: 'Existing Category',
      });

      await expect(service.update(mockUser, '1', updateDto)).rejects.toThrow(ConflictException);
    });

    it('should set updatedBy from user context', async () => {
      const updateDto: UpdateProductCategoryDto = {
        description: 'Updated Description',
      };

      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.update(mockUser, '1', updateDto);

      const savedEntity = mockCategoryRepository.save.mock.calls[0][0];
      expect(savedEntity.updatedBy).toBe('user-1');
    });

    it('should invalidate cache after update', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      await service.update(mockUser, '1', { description: 'New' });

      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:1');
    });
  });

  describe('remove', () => {
    it('should remove category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.remove.mockResolvedValue(mockCategory);

      await service.remove(mockUser, '1');

      expect(mockCategoryRepository.remove).toHaveBeenCalledWith(mockCategory);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, '999')).rejects.toThrow(NotFoundException);
      expect(mockCategoryRepository.remove).not.toHaveBeenCalled();
    });

    it('should invalidate cache after removal', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.remove.mockResolvedValue(mockCategory);

      await service.remove(mockUser, '1');

      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:1');
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      const mockCategories = Array.from({ length: 5 }, (_, i) => ({
        ...mockCategory,
        id: `${i + 1}`,
      }));

      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.count(mockUser);

      expect(result).toBe(5);
    });

    it('should apply tenant filter when counting', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      await service.count(mockUser);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });
  });

  describe('findActive', () => {
    it('should return only active categories', async () => {
      const mockCategories = [
        { ...mockCategory, id: '1', isActive: true },
        { ...mockCategory, id: '2', isActive: true },
      ];

      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findActive(mockUser);

      expect(result).toHaveLength(2);
      expect(result.every((cat) => cat.isActive)).toBe(true);
    });

    it('should apply tenant filter and isActive filter', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      await service.findActive(mockUser);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            isActive: true,
          }),
        }),
      );
    });

    it('should order by name', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      await service.findActive(mockUser);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        }),
      );
    });
  });
});
