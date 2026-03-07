import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockCategory = {
    id: '1',
    code: 'CAT-001',
    name: 'Category 1',
    level: 0,
    path: '',
    tenantId: 'tenant-1',
    isActive: true,
    sortOrder: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create category', async () => {
      const categoryData = { code: 'CAT-001', name: 'Category 1' };
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(categoryData);
      mockCategoryRepository.save.mockResolvedValue(categoryData);

      const result = await service.create(categoryData as any, mockUser);

      expect(result).toEqual(categoryData);
    });

    it('should throw ConflictException if code exists', async () => {
      const categoryData = { code: 'CAT-001' };
      mockCategoryRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(categoryData as any, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      const categoryData = { code: 'CAT-002', parentId: 'parent-1' };
      mockCategoryRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(service.create(categoryData as any, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create category with parent', async () => {
      const categoryData = { code: 'CAT-002', parentId: 'parent-1' };
      const parentCategory = { id: 'parent-1', level: 0, path: '' };
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(parentCategory);
      mockCategoryRepository.create.mockReturnValue(categoryData);
      mockCategoryRepository.save.mockResolvedValue(categoryData);

      const result = await service.create(categoryData as any, mockUser);

      expect(result).toEqual(categoryData);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockCategories);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return category from cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockCategory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return category by code', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findByCode('CAT-001', mockUser);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if code not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('INVALID', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRootCategories', () => {
    it('should return root categories', async () => {
      const rootCategories = [mockCategory];
      mockQueryBuilder.getMany.mockResolvedValue(rootCategories);

      const result = await service.findRootCategories(mockUser);

      expect(result).toEqual(rootCategories);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.parentId IS NULL');
    });
  });

  describe('findChildren', () => {
    it('should return child categories', async () => {
      const children = [{ id: '2', parentId: '1' }];
      mockQueryBuilder.getMany.mockResolvedValue(children);

      const result = await service.findChildren('1', mockUser);

      expect(result).toEqual(children);
    });
  });

  describe('findTree', () => {
    it('should return category tree', async () => {
      const categories = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(categories);

      const result = await service.findTree(mockUser);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const updateData = { name: 'Updated Category' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategory, ...updateData });

      const result = await service.update('1', updateData, mockUser);

      expect(result.name).toBe('Updated Category');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new code exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue({ id: '2', code: 'CAT-002' });

      await expect(service.update('1', { code: 'CAT-002' }, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if category is its own parent', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      await expect(service.update('1', { parentId: '1' }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { parentId: 'invalid-parent' }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if circular reference detected', async () => {
      const parent = { id: 'parent-1', parentId: '1', tenantId: 'tenant-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(parent);

      await expect(service.update('1', { parentId: 'parent-1' }, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update category with new parent', async () => {
      const parent = { id: 'parent-1', level: 0, path: '', tenantId: 'tenant-1' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValueOnce(parent).mockResolvedValueOnce(null);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategory, parentId: 'parent-1', level: 1 });

      const result = await service.update('1', { parentId: 'parent-1' }, mockUser);

      expect(result.level).toBe(1);
    });

    it('should update category to root (remove parent)', async () => {
      const categoryWithParent = { ...mockCategory, parentId: 'parent-1', level: 1, path: 'parent-1' };
      mockCacheService.getOrSet.mockResolvedValue(categoryWithParent);
      mockCategoryRepository.save.mockResolvedValue({ ...categoryWithParent, parentId: null, level: 0, path: '' });

      const result = await service.update('1', { parentId: null }, mockUser);

      expect(result.level).toBe(0);
      expect(result.path).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCategoryRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('1', mockUser);

      expect(mockCategoryRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category has children', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: '2' }]);

      await expect(service.remove('1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      mockCategoryRepository.count.mockResolvedValue(5);

      const result = await service.count(mockUser);

      expect(result).toBe(5);
    });
  });

  describe('activate', () => {
    it('should activate category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategory, isActive: true });

      const result = await service.activate('1', mockUser);

      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategory, isActive: false });

      const result = await service.deactivate('1', mockUser);

      expect(result.isActive).toBe(false);
    });
  });

  describe('reorder', () => {
    it('should reorder category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue({ ...mockCategory, sortOrder: 10 });

      const result = await service.reorder('1', 10, mockUser);

      expect(result.sortOrder).toBe(10);
    });
  });
});
