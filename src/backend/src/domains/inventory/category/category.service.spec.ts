import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let _categoryRepository: Repository<Category>;
  let _cacheService: CacheService;
  let _permissionService: PermissionService;
  let secureCategoryRepo: any;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockCategory: Category = {
    id: 'cat-1',
    tenantId: 'tenant-1',
    code: 'CAT-001',
    name: 'Electronics',
    description: 'Electronic products',
    parentId: null,
    level: 0,
    path: '',
    icon: null,
    image: null,
    sortOrder: 0,
    isActive: true,
    metadata: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Category;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
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
        CategoryService,
        {
          provide: getRepositoryToken(Category),
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

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    cacheService = module.get<CacheService>(CacheService);
    permissionService = module.get<PermissionService>(PermissionService);

    // Access private secureCategoryRepo
    secureCategoryRepo = (service as any).secureCategoryRepo;

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      code: 'CAT-002',
      name: 'Computers',
      description: 'Computer products',
    };

    it('should create root category successfully', async () => {
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(null);
      secureCategoryRepo.save = jest.fn().mockResolvedValue({
        ...createDto,
        id: 'cat-2',
        tenantId: 'tenant-1',
        level: 0,
        path: '',
      });

      const result = await service.create(mockUser, createDto);

      expect(result.code).toBe('CAT-002');
      expect(result.level).toBe(0);
      expect(result.path).toBe('');
      expect(secureCategoryRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { code: 'CAT-002' },
      });
    });

    it('should create child category with correct level and path', async () => {
      const parentCategory = { ...mockCategory, id: 'cat-1' };
      const createDtoWithParent = { ...createDto, parentId: 'cat-1' };

      secureCategoryRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce(null) // Check code
        .mockResolvedValueOnce(parentCategory); // Get parent

      secureCategoryRepo.save = jest.fn().mockResolvedValue({
        ...createDtoWithParent,
        id: 'cat-2',
        level: 1,
        path: 'cat-1',
      });

      const result = await service.create(mockUser, createDtoWithParent);

      expect(result.level).toBe(1);
      expect(result.path).toBe('cat-1');
    });

    it('should throw ConflictException when code already exists', async () => {
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(mockCategory);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        "Category with code 'CAT-002' already exists",
      );
    });

    it('should throw BadRequestException when parent not found', async () => {
      const createDtoWithParent = { ...createDto, parentId: 'nonexistent' };

      secureCategoryRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce(null) // Check code
        .mockResolvedValueOnce(null); // Get parent

      await expect(service.create(mockUser, createDtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, createDtoWithParent)).rejects.toThrow(
        'Parent category not found',
      );
    });

    it('should create nested category with correct path', async () => {
      const parentCategory = {
        ...mockCategory,
        id: 'cat-1',
        level: 1,
        path: 'root-1',
      };
      const createDtoWithParent = { ...createDto, parentId: 'cat-1' };

      secureCategoryRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(parentCategory);

      secureCategoryRepo.save = jest.fn().mockResolvedValue({
        ...createDtoWithParent,
        id: 'cat-2',
        level: 2,
        path: 'root-1/cat-1',
      });

      const result = await service.create(mockUser, createDtoWithParent);

      expect(result.level).toBe(2);
      expect(result.path).toBe('root-1/cat-1');
    });
  });

  describe('findAll', () => {
    it('should return all categories sorted by sortOrder and name', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1', sortOrder: 1, name: 'B Category' },
        { ...mockCategory, id: 'cat-2', sortOrder: 0, name: 'A Category' },
        { ...mockCategory, id: 'cat-3', sortOrder: 0, name: 'C Category' },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(3);
      expect(secureCategoryRepo.find).toHaveBeenCalledWith(mockUser, {
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
    });

    it('should return empty array when no categories exist', async () => {
      secureCategoryRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return category from cache if available', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockUser, 'cat-1');

      expect(result).toEqual(mockCategory);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'category:tenant-1:cat-1',
        expect.any(Function),
        3600, // CacheTTL.MEDIUM
      );
    });

    it('should fetch from database when cache miss', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(mockCategory);

      const result = await service.findOne(mockUser, 'cat-1');

      expect(result).toEqual(mockCategory);
      expect(secureCategoryRepo.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'nonexistent')).rejects.toThrow(
        'Category with ID nonexistent not found',
      );
    });
  });

  describe('findByCode', () => {
    it('should return category by code', async () => {
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(mockCategory);

      const result = await service.findByCode(mockUser, 'CAT-001');

      expect(result).toEqual(mockCategory);
      expect(secureCategoryRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { code: 'CAT-001' },
      });
    });

    it('should throw NotFoundException when code not found', async () => {
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findByCode(mockUser, 'INVALID')).rejects.toThrow(NotFoundException);
      await expect(service.findByCode(mockUser, 'INVALID')).rejects.toThrow(
        "Category with code 'INVALID' not found",
      );
    });
  });

  describe('findRootCategories', () => {
    it('should return only root categories', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1', parentId: null },
        { ...mockCategory, id: 'cat-2', parentId: 'cat-1' },
        { ...mockCategory, id: 'cat-3', parentId: null },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findRootCategories(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[1].id).toBe('cat-3');
    });

    it('should return empty array when no root categories exist', async () => {
      const categories = [{ ...mockCategory, id: 'cat-1', parentId: 'parent-1' }];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findRootCategories(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('findChildren', () => {
    it('should return children of parent category', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1', parentId: null },
        { ...mockCategory, id: 'cat-2', parentId: 'cat-1' },
        { ...mockCategory, id: 'cat-3', parentId: 'cat-1' },
        { ...mockCategory, id: 'cat-4', parentId: 'cat-2' },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findChildren(mockUser, 'cat-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-2');
      expect(result[1].id).toBe('cat-3');
    });

    it('should return empty array when no children exist', async () => {
      const categories = [{ ...mockCategory, id: 'cat-1', parentId: null }];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findChildren(mockUser, 'cat-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('findTree', () => {
    it('should build tree structure correctly', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1', parentId: null, name: 'Root 1' },
        { ...mockCategory, id: 'cat-2', parentId: 'cat-1', name: 'Child 1-1' },
        { ...mockCategory, id: 'cat-3', parentId: 'cat-1', name: 'Child 1-2' },
        { ...mockCategory, id: 'cat-4', parentId: null, name: 'Root 2' },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findTree(mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect((result[0] as any).children).toHaveLength(2);
      expect(result[1].id).toBe('cat-4');
      expect((result[1] as any).children).toBeUndefined();
    });

    it('should handle nested tree structure', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1', parentId: null },
        { ...mockCategory, id: 'cat-2', parentId: 'cat-1' },
        { ...mockCategory, id: 'cat-3', parentId: 'cat-2' },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.findTree(mockUser);

      expect(result).toHaveLength(1);
      expect((result[0] as any).children).toHaveLength(1);
      expect((result[0] as any).children[0].children).toHaveLength(1);
    });

    it('should return empty array when no categories exist', async () => {
      secureCategoryRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.findTree(mockUser);

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Category',
    };

    it('should update category successfully', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.save = jest.fn().mockResolvedValue({
        ...freshCategory,
        ...updateDto,
      });

      const result = await service.update(mockUser, 'cat-1', updateDto);

      expect(result.name).toBe('Updated Category');
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:cat-1');
    });

    it('should check code uniqueness when updating code', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(null);
      secureCategoryRepo.save = jest.fn().mockResolvedValue({
        ...freshCategory,
        code: 'NEW-CODE',
      });

      const result = await service.update(mockUser, 'cat-1', { code: 'NEW-CODE' });

      expect(result.code).toBe('NEW-CODE');
      expect(secureCategoryRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { code: 'NEW-CODE' },
      });
    });

    it('should throw ConflictException when new code already exists', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue({
        ...mockCategory,
        id: 'other-cat',
      });

      await expect(service.update(mockUser, 'cat-1', { code: 'EXISTING' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating same code', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.save = jest.fn().mockResolvedValue(freshCategory);

      const result = await service.update(mockUser, 'cat-1', { code: 'CAT-001' });

      expect(result.code).toBe('CAT-001');
    });

    it('should throw BadRequestException when category is its own parent', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);

      await expect(service.update(mockUser, 'cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockUser, 'cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        'Category cannot be its own parent',
      );
    });

    it('should throw BadRequestException when parent not found', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.update(mockUser, 'cat-1', { parentId: 'nonexistent' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockUser, 'cat-1', { parentId: 'nonexistent' })).rejects.toThrow(
        'Parent category not found',
      );
    });

    it('should throw BadRequestException when creating circular reference', async () => {
      // Setup: cat-1 (root) -> cat-2 (child)
      // Try to update: cat-1.parentId = cat-2 (would create circular: cat-2 -> cat-1 -> cat-2)
      const cat1 = { ...mockCategory, id: 'cat-1', parentId: null };
      const cat2 = { ...mockCategory, id: 'cat-2', parentId: 'cat-1' };

      mockCacheService.getOrSet.mockResolvedValue(cat1); // Get cat-1

      // Mock findOne to return correct category based on where clause
      secureCategoryRepo.findOne = jest.fn().mockImplementation((user, options) => {
        const id = options.where?.id;
        if (id === 'cat-2') return Promise.resolve(cat2);
        if (id === 'cat-1') return Promise.resolve(cat1);
        return Promise.resolve(null);
      });

      await expect(service.update(mockUser, 'cat-1', { parentId: 'cat-2' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockUser, 'cat-1', { parentId: 'cat-2' })).rejects.toThrow(
        'Cannot create circular reference',
      );
    });

    it('should update level and path when changing parent', async () => {
      const freshCategory = { ...mockCategory, id: 'cat-2', parentId: null, level: 0, path: '' };
      const newParent = { ...mockCategory, id: 'cat-1', level: 0, path: '' };

      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.findOne = jest
        .fn()
        .mockResolvedValueOnce(newParent) // Get parent
        .mockResolvedValueOnce(null); // Check circular (no parent)

      secureCategoryRepo.save = jest.fn().mockImplementation((user, category) => {
        return Promise.resolve(category);
      });

      const result = await service.update(mockUser, 'cat-2', { parentId: 'cat-1' });

      expect(result.level).toBe(1);
      expect(result.path).toBe('cat-1');
    });

    it('should reset level and path when removing parent', async () => {
      const freshCategory = {
        ...mockCategory,
        id: 'cat-2',
        parentId: 'cat-1',
        level: 1,
        path: 'cat-1',
      };

      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.save = jest.fn().mockImplementation((user, category) => {
        return Promise.resolve(category);
      });

      const result = await service.update(mockUser, 'cat-2', { parentId: null });

      expect(result.level).toBe(0);
      expect(result.path).toBe('');
    });
  });

  describe('remove', () => {
    it('should remove category successfully', async () => {
      const freshCategory = { ...mockCategory };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.find = jest.fn().mockResolvedValue([]);
      secureCategoryRepo.remove = jest.fn().mockResolvedValue(freshCategory);

      await service.remove(mockUser, 'cat-1');

      expect(secureCategoryRepo.remove).toHaveBeenCalledWith(mockUser, freshCategory);
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:cat-1');
    });

    it('should throw BadRequestException when category has children', async () => {
      const freshCategory = { ...mockCategory };
      const children = [{ ...mockCategory, id: 'cat-2', parentId: 'cat-1' }];

      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.find = jest.fn().mockResolvedValue(children);

      await expect(service.remove(mockUser, 'cat-1')).rejects.toThrow(BadRequestException);
      await expect(service.remove(mockUser, 'cat-1')).rejects.toThrow(
        'Cannot delete category with subcategories',
      );
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      const categories = [
        { ...mockCategory, id: 'cat-1' },
        { ...mockCategory, id: 'cat-2' },
      ];
      secureCategoryRepo.find = jest.fn().mockResolvedValue(categories);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no categories exist', async () => {
      secureCategoryRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('activate', () => {
    it('should activate category successfully', async () => {
      const inactiveCategory = { ...mockCategory, isActive: false };
      mockCacheService.getOrSet.mockResolvedValue(inactiveCategory);
      secureCategoryRepo.save = jest.fn().mockImplementation((user, category) => {
        return Promise.resolve(category);
      });

      const result = await service.activate(mockUser, 'cat-1');

      expect(result.isActive).toBe(true);
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:cat-1');
    });
  });

  describe('deactivate', () => {
    it('should deactivate category successfully', async () => {
      const activeCategory = { ...mockCategory, isActive: true };
      mockCacheService.getOrSet.mockResolvedValue(activeCategory);
      secureCategoryRepo.save = jest.fn().mockImplementation((user, category) => {
        return Promise.resolve(category);
      });

      const result = await service.deactivate(mockUser, 'cat-1');

      expect(result.isActive).toBe(false);
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:cat-1');
    });
  });

  describe('reorder', () => {
    it('should reorder category successfully', async () => {
      const freshCategory = { ...mockCategory, sortOrder: 0 };
      mockCacheService.getOrSet.mockResolvedValue(freshCategory);
      secureCategoryRepo.save = jest.fn().mockImplementation((user, category) => {
        return Promise.resolve(category);
      });

      const result = await service.reorder(mockUser, 'cat-1', 5);

      expect(result.sortOrder).toBe(5);
      expect(mockCacheService.del).toHaveBeenCalledWith('category:tenant-1:cat-1');
    });
  });
});
