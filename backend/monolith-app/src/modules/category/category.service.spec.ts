import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategory = {
    id: '1',
    tenantId: 'tenant-1',
    code: 'CAT001',
    name: 'Electronics',
    description: 'Electronic products',
    parentId: null,
    level: 0,
    path: '',
    sortOrder: 1,
    isActive: true,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a root category', async () => {
      const createDto = {
        code: 'CAT001',
        name: 'Electronics',
        description: 'Electronic products',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockCategory, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockCategory, ...createDto });

      const result = await service.create(createDto, 'tenant-1', 'user-1');

      expect(result.level).toBe(0);
      expect(result.path).toBe('');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-1',
        level: 0,
        path: '',
        createdBy: 'user-1',
        updatedBy: 'user-1',
      });
    });

    it('should create a child category', async () => {
      const parentCategory = { ...mockCategory, id: 'parent-1', path: '' };
      const createDto = {
        code: 'CAT002',
        name: 'Laptops',
        parentId: 'parent-1',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // Check for existing code
        .mockResolvedValueOnce(parentCategory); // Get parent

      mockRepository.create.mockReturnValue({
        ...mockCategory,
        ...createDto,
        level: 1,
        path: 'parent-1',
      });
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...createDto,
        level: 1,
        path: 'parent-1',
      });

      const result = await service.create(createDto, 'tenant-1', 'user-1');

      expect(result.level).toBe(1);
      expect(result.path).toBe('parent-1');
    });

    it('should throw ConflictException if code already exists', async () => {
      const createDto = {
        code: 'CAT001',
        name: 'Electronics',
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(createDto, 'tenant-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      const createDto = {
        code: 'CAT002',
        name: 'Laptops',
        parentId: 'invalid-parent',
      };

      mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(service.create(createDto, 'tenant-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([mockCategory]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.parentId',
        'category.level',
        'category.path',
        'category.sortOrder',
        'category.isActive',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('category.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('category.sortOrder', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockCategory);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a category by code', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findByCode('CAT001', 'tenant-1');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('INVALID', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRootCategories', () => {
    it('should return root categories', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockCategory]);

      const result = await service.findRootCategories('tenant-1');

      expect(result).toEqual([mockCategory]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.sortOrder',
        'category.isActive',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('category.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.parentId IS NULL');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('category.sortOrder', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
    });
  });

  describe('findChildren', () => {
    it('should return child categories', async () => {
      const childCategory = { ...mockCategory, parentId: '1' };
      mockQueryBuilder.getMany.mockResolvedValue([childCategory]);

      const result = await service.findChildren('1', 'tenant-1');

      expect(result).toEqual([childCategory]);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'category.id',
        'category.code',
        'category.name',
        'category.description',
        'category.level',
        'category.sortOrder',
        'category.isActive',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('category.parentId = :parentId', {
        parentId: '1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('category.sortOrder', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { name: 'Updated Electronics' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1', 'user-1');

      expect(result.name).toBe('Updated Electronics');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new code already exists', async () => {
      const existingCategory = { ...mockCategory, id: '2' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(existingCategory);

      await expect(service.update('1', { code: 'CAT002' }, 'tenant-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if category is its own parent', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.update('1', { parentId: '1' }, 'tenant-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update parent and recalculate level/path', async () => {
      const parentCategory = {
        ...mockCategory,
        id: 'parent-1',
        level: 0,
        path: '',
      };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(parentCategory);
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        parentId: 'parent-1',
        level: 1,
        path: 'parent-1',
      });

      const result = await service.update('1', { parentId: 'parent-1' }, 'tenant-1', 'user-1');

      expect(result.level).toBe(1);
      expect(result.path).toBe('parent-1');
    });
  });

  describe('remove', () => {
    it('should remove a category without children', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith({
        id: '1',
        tenantId: 'tenant-1',
      });
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category has children', async () => {
      const childCategory = { ...mockCategory, parentId: '1' };
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockQueryBuilder.getMany.mockResolvedValue([childCategory]);

      await expect(service.remove('1', 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
    });
  });

  describe('activate', () => {
    it('should activate a category', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });
      mockRepository.findOne.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        isActive: true,
      });

      const result = await service.activate('1', 'tenant-1');

      expect(result.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a category', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      const result = await service.deactivate('1', 'tenant-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('reorder', () => {
    it('should update category sort order', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCategory);
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        sortOrder: 5,
      });

      const result = await service.reorder('1', 5, 'tenant-1');

      expect(result.sortOrder).toBe(5);
    });
  });
});
