import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
;
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockUser = createMockUser({ tenantId: 'tenant1' });

  const mockCategory = {
    id: '1',
    code: 'CAT-001',
    name: 'Category 1',
    level: 0,
    path: '',
    tenantId: 'tenant1',
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
        {
          provide: PermissionService,
          useValue: {
            buildSecureQuery: jest.fn(),
            canRead: jest.fn().mockResolvedValue(true),
            canWrite: jest.fn().mockResolvedValue(true),
            canDelete: jest.fn().mockResolvedValue(true),
          },
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
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(null);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue(mockCategory as any);

      const result = await service.create(mockUser, categoryData as any);

      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException if code exists', async () => {
      const categoryData = { code: 'CAT-001' };
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(mockCategory as any);

      await expect(service.create(mockUser, categoryData as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      const categoryData = { code: 'CAT-002', parentId: 'parent-1' };
      jest.spyOn(service['secureCategoryRepo'], 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.create(mockUser, categoryData as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create category with parent', async () => {
      const categoryData = { code: 'CAT-002', parentId: 'parent-1' };
      const parentCategory = { id: 'parent-1', level: 0, path: '', tenantId: 'tenant1' };
      jest.spyOn(service['secureCategoryRepo'], 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(parentCategory as any);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...categoryData,
        level: 1,
        path: 'parent-1',
      } as any);

      const result = await service.create(mockUser, categoryData as any);

      expect(result.level).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(mockCategories as any);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(mockCategories);
    });
  });

  describe('findOne', () => {
    it('should return category from cache', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockCategory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return category by code', async () => {
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(mockCategory as any);

      const result = await service.findByCode(mockUser, 'CAT-001');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if code not found', async () => {
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findByCode(mockUser, 'INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRootCategories', () => {
    it('should return root categories', async () => {
      const allCategories = [mockCategory, { ...mockCategory, id: '2', parentId: '1' }];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(allCategories as any);

      const result = await service.findRootCategories(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('findChildren', () => {
    it('should return child categories', async () => {
      const allCategories = [
        mockCategory,
        { ...mockCategory, id: '2', parentId: '1' },
        { ...mockCategory, id: '3', parentId: '1' },
      ];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(allCategories as any);

      const result = await service.findChildren(mockUser, '1');

      expect(result).toHaveLength(2);
      expect(result[0].parentId).toBe('1');
    });
  });

  describe('findTree', () => {
    it('should return category tree', async () => {
      const categories = [
        { ...mockCategory, parentId: null },
        { ...mockCategory, id: '2', parentId: '1' },
      ];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(categories as any);

      const result = await service.findTree(mockUser);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const updateData = { name: 'Updated Category' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...mockCategory,
        ...updateData,
      } as any);

      const result = await service.update(mockUser, '1', updateData);

      expect(result.name).toBe('Updated Category');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new code exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue({
        id: '2',
        code: 'CAT-002',
      } as any);

      await expect(service.update(mockUser, '1', { code: 'CAT-002' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if category is its own parent', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      await expect(service.update(mockUser, '1', { parentId: '1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.update(mockUser, '1', { parentId: 'invalid-parent' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if circular reference detected', async () => {
      const parent = { id: 'parent-1', parentId: '1', tenantId: 'tenant1' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'findOne').mockResolvedValue(parent as any);

      await expect(service.update(mockUser, '1', { parentId: 'parent-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update category with new parent', async () => {
      const parent = { id: 'parent-1', level: 0, path: '', tenantId: 'tenant1' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'findOne')
        .mockResolvedValueOnce(parent as any)
        .mockResolvedValueOnce(null);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...mockCategory,
        parentId: 'parent-1',
        level: 1,
      } as any);

      const result = await service.update(mockUser, '1', { parentId: 'parent-1' });

      expect(result.level).toBe(1);
    });

    it('should update category to root (remove parent)', async () => {
      const categoryWithParent = {
        ...mockCategory,
        parentId: 'parent-1',
        level: 1,
        path: 'parent-1',
      };
      mockCacheService.getOrSet.mockResolvedValue(categoryWithParent);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...categoryWithParent,
        parentId: null,
        level: 0,
        path: '',
      } as any);

      const result = await service.update(mockUser, '1', { parentId: null });

      expect(result.level).toBe(0);
      expect(result.path).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue([mockCategory] as any);
      jest.spyOn(service['secureCategoryRepo'], 'remove').mockResolvedValue(undefined);

      await service.remove(mockUser, '1');

      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category has children', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      const allCategories = [
        mockCategory,
        { ...mockCategory, id: '2', parentId: '1' },
      ];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(allCategories as any);

      await expect(service.remove(mockUser, '1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: '2' }];
      jest.spyOn(service['secureCategoryRepo'], 'find').mockResolvedValue(mockCategories as any);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });
  });

  describe('activate', () => {
    it('should activate category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...mockCategory,
        isActive: true,
      } as any);

      const result = await service.activate(mockUser, '1');

      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...mockCategory,
        isActive: false,
      } as any);

      const result = await service.deactivate(mockUser, '1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('reorder', () => {
    it('should reorder category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      jest.spyOn(service['secureCategoryRepo'], 'save').mockResolvedValue({
        ...mockCategory,
        sortOrder: 10,
      } as any);

      const result = await service.reorder(mockUser, '1', 10);

      expect(result.sortOrder).toBe(10);
    });
  });
});
