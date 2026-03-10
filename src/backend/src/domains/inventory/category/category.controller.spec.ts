import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: jest.Mocked<CategoryService>;

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findTree: jest.fn(),
    findRootCategories: jest.fn(),
    findByCode: jest.fn(),
    findOne: jest.fn(),
    findChildren: jest.fn(),
    update: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    reorder: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockUserId = 'user-123';
  const mockRequest = { user: { id: mockUserId } } as any;
  const mockCategory = {
    id: 'category-1',
    name: 'Test Category',
    code: 'TEST-CAT',
    description: 'Test description',
    parentId: null,
    sortOrder: 1,
    isActive: true,
    level: 0,
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createDto: CreateCategoryDto = {
        name: 'New Category',
        code: 'NEW-CAT',
        description: 'New description',
      };
      service.create.mockResolvedValue(mockCategory);

      const result = await controller.create(mockUser, createDto, mockRequest);

      expect(result).toEqual(mockCategory);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const categories = [mockCategory];
      service.findAll.mockResolvedValue(categories);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(categories);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('count', () => {
    it('should return category count', async () => {
      const count = 10;
      service.count.mockResolvedValue(count);

      const result = await controller.count(mockUser);

      expect(result).toBe(count);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getTree', () => {
    it('should return category tree', async () => {
      const tree = [mockCategory];
      service.findTree.mockResolvedValue(tree);

      const result = await controller.getTree(mockUser);

      expect(result).toEqual(tree);
      expect(service.findTree).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRootCategories', () => {
    it('should return root categories', async () => {
      const rootCategories = [mockCategory];
      service.findRootCategories.mockResolvedValue(rootCategories);

      const result = await controller.getRootCategories(mockUser);

      expect(result).toEqual(rootCategories);
      expect(service.findRootCategories).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findByCode', () => {
    it('should return category by code', async () => {
      service.findByCode.mockResolvedValue(mockCategory);

      const result = await controller.findByCode(mockUser, mockCategory.code);

      expect(result).toEqual(mockCategory);
      expect(service.findByCode).toHaveBeenCalledWith(mockUser, mockCategory.code);
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      service.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(mockUser, mockCategory.id);

      expect(result).toEqual(mockCategory);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, mockCategory.id);
    });
  });

  describe('getChildren', () => {
    it('should return category children', async () => {
      const children = [mockCategory];
      service.findChildren.mockResolvedValue(children);

      const result = await controller.getChildren(mockUser, mockCategory.id);

      expect(result).toEqual(children);
      expect(service.findChildren).toHaveBeenCalledWith(mockUser, mockCategory.id);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };
      const updatedCategory = { ...mockCategory, ...updateDto };
      service.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(mockCategory.id, mockUser, updateDto, mockRequest);

      expect(result).toEqual(updatedCategory);
      expect(service.update).toHaveBeenCalledWith(mockUser, mockCategory.id, updateDto);
    });
  });

  describe('activate', () => {
    it('should activate category', async () => {
      const activatedCategory = { ...mockCategory, isActive: true };
      service.activate.mockResolvedValue(activatedCategory);

      const result = await controller.activate(mockUser, mockCategory.id);

      expect(result).toEqual(activatedCategory);
      expect(service.activate).toHaveBeenCalledWith(mockUser, mockCategory.id);
    });
  });

  describe('deactivate', () => {
    it('should deactivate category', async () => {
      const deactivatedCategory = { ...mockCategory, isActive: false };
      service.deactivate.mockResolvedValue(deactivatedCategory);

      const result = await controller.deactivate(mockUser, mockCategory.id);

      expect(result).toEqual(deactivatedCategory);
      expect(service.deactivate).toHaveBeenCalledWith(mockUser, mockCategory.id);
    });
  });

  describe('reorder', () => {
    it('should reorder category', async () => {
      const sortOrder = 5;
      const reorderedCategory = { ...mockCategory, sortOrder };
      service.reorder.mockResolvedValue(reorderedCategory);

      const result = await controller.reorder(mockCategory.id, { sortOrder }, mockUser);

      expect(result).toEqual(reorderedCategory);
      expect(service.reorder).toHaveBeenCalledWith(mockUser, mockCategory.id, sortOrder);
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, mockCategory.id);

      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, mockCategory.id);
    });
  });
});
