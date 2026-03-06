import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

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

      const result = await service.create(categoryData as any, 'tenant-1');

      expect(result).toEqual(categoryData);
    });

    it('should throw ConflictException if code exists', async () => {
      const categoryData = { code: 'CAT-001' };
      mockCategoryRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(categoryData as any, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if parent not found', async () => {
      const categoryData = { code: 'CAT-002', parentId: 'parent-1' };
      mockCategoryRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(service.create(categoryData as any, 'tenant-1')).rejects.toThrow(
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

      const result = await service.create(categoryData as any, 'tenant-1');

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

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalled();
    });
  });
});
