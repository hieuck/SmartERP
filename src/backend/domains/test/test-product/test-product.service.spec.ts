import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TestProductService } from './test-product.service';
import { TestProduct } from './entities/test-product.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { CreateTestProductDto } from './dto/create-test-product.dto';
import { UpdateTestProductDto } from './dto/update-test-product.dto';

/**
 * TestProductService Unit Tests
 * 
 * TESTING PRINCIPLES:
 * - Mock SecureRepository methods (find, findOne, save, remove)
 * - Mock PermissionService (canRead, canWrite, canDelete, buildSecureQuery)
 * - Mock CacheService (get, set, del, getOrSet)
 * - DO NOT mock TypeORM QueryBuilder methods
 * - Test tenant isolation
 * - Test permission checks
 * - Test business logic validation
 * - Test cache invalidation
 * 
 * SECURITY TESTING:
 * ✅ Tenant isolation enforced
 * ✅ Permission checks work correctly
 * ✅ User context passed to all operations
 * ✅ Unauthorized access blocked
 */
describe('TestProductService', () => {
  let service: TestProductService;

  // Mock TypeORM Repository
  const mockTestProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  // Mock CacheService
  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  // Mock PermissionService
  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasPermission: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  // Mock User
  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestProductService,
        {
          provide: getRepositoryToken(TestProduct),
          useValue: mockTestProductRepository,
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

    service = module.get<TestProductService>(TestProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // CRUD OPERATIONS TESTS
  // ==========================================

  describe('findAll', () => {
    it('should return paginated TestProducts', async () => {
      const mockTestProducts = [
        { id: '1', tenantId: mockUser.tenantId, name: 'Test 1' },
        { id: '2', tenantId: mockUser.tenantId, name: 'Test 2' },
      ];
      mockTestProductRepository.find.mockResolvedValue(mockTestProducts);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mockTestProducts);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mockTestProductRepository.find).toHaveBeenCalled();
    });

    it('should apply tenant isolation', async () => {
      mockTestProductRepository.find.mockResolvedValue([]);

      await service.findAll(mockUser, 1, 20);

      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        'TestProduct',
      );
    });

    it('should handle pagination correctly', async () => {
      const mockTestProducts = Array(50)
        .fill(null)
        .map((_, i) => ({ id: `${i}`, tenantId: mockUser.tenantId }));
      mockTestProductRepository.find.mockResolvedValue(mockTestProducts);

      const result = await service.findAll(mockUser, 2, 10);

      expect(result.data.length).toBe(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should find TestProduct by id', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId, name: 'Test' };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockTestProduct);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockTestProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });

    it('should check read permission', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockTestProductRepository.findOne.mockResolvedValue(mockTestProduct);

      await service.findOne(mockUser, '1');

      expect(mockPermissionService.canRead).toHaveBeenCalledWith(
        mockUser,
        mockTestProduct,
        'TestProduct',
      );
    });
  });

  describe('create', () => {
    it('should create TestProduct', async () => {
      const createTestProductDto: CreateTestProductDto = {
        name: 'New TestProduct',
        // Add other required fields
      };
      const createdTestProduct = {
        id: '1',
        ...createTestProductDto,
        tenantId: mockUser.tenantId,
        createdBy: mockUser.id,
      };
      mockTestProductRepository.save.mockResolvedValue(createdTestProduct);

      const result = await service.create(mockUser, createTestProductDto);

      expect(result).toEqual(createdTestProduct);
      expect(mockTestProductRepository.save).toHaveBeenCalled();
    });

    it('should set tenantId and createdBy automatically', async () => {
      const createTestProductDto: CreateTestProductDto = {
        name: 'New TestProduct',
      };
      mockTestProductRepository.save.mockResolvedValue({
        id: '1',
        ...createTestProductDto,
        tenantId: mockUser.tenantId,
        createdBy: mockUser.id,
      });

      await service.create(mockUser, createTestProductDto);

      const savedEntity = mockTestProductRepository.save.mock.calls[0][0];
      expect(savedEntity.tenantId).toBe(mockUser.tenantId);
      expect(savedEntity.createdBy).toBe(mockUser.id);
    });

    // Add business logic validation tests here
    // Example: Uniqueness check, reference validation, etc.
  });

  describe('update', () => {
    it('should update TestProduct', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId, name: 'Old Name' };
      const updateTestProductDto: UpdateTestProductDto = { name: 'New Name' };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.save.mockResolvedValue({
        ...mockTestProduct,
        ...updateTestProductDto,
      });

      const result = await service.update(mockUser, '1', updateTestProductDto);

      expect(result.name).toBe('New Name');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should check write permission', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.save.mockResolvedValue(mockTestProduct);

      await service.update(mockUser, '1', {});

      expect(mockPermissionService.canWrite).toHaveBeenCalledWith(
        mockUser,
        mockTestProduct,
        'TestProduct',
      );
    });

    it('should invalidate cache after update', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.save.mockResolvedValue(mockTestProduct);

      await service.update(mockUser, '1', {});

      expect(mockCacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('test-product'),
      );
    });
  });

  describe('remove', () => {
    it('should remove TestProduct', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.remove.mockResolvedValue(mockTestProduct);

      await service.remove(mockUser, '1');

      expect(mockTestProductRepository.remove).toHaveBeenCalledWith(mockTestProduct);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should check delete permission', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.remove.mockResolvedValue(mockTestProduct);

      await service.remove(mockUser, '1');

      expect(mockPermissionService.canDelete).toHaveBeenCalledWith(
        mockUser,
        mockTestProduct,
        'TestProduct',
      );
    });
  });

  describe('count', () => {
    it('should return TestProduct count', async () => {
      const mockTestProducts = Array(25)
        .fill(null)
        .map((_, i) => ({ id: `${i}`, tenantId: mockUser.tenantId }));
      mockTestProductRepository.find.mockResolvedValue(mockTestProducts);

      const result = await service.count(mockUser);

      expect(result).toBe(25);
    });
  });

  // ==========================================
  // CUSTOM BUSINESS LOGIC TESTS
  // Add your domain-specific tests below
  // ==========================================

  describe('findByStatus', () => {
    it('should find TestProducts by status', async () => {
      const mockTestProducts = [
        { id: '1', tenantId: mockUser.tenantId, status: 'active' },
        { id: '2', tenantId: mockUser.tenantId, status: 'active' },
      ];
      mockTestProductRepository.find.mockResolvedValue(mockTestProducts);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual(mockTestProducts);
      expect(mockTestProductRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update TestProduct status', async () => {
      const mockTestProduct = { id: '1', tenantId: mockUser.tenantId, status: 'draft' };
      mockCacheService.getOrSet.mockResolvedValue(mockTestProduct);
      mockTestProductRepository.save.mockResolvedValue({
        ...mockTestProduct,
        status: 'active',
      });

      const result = await service.updateStatus(mockUser, '1', 'active');

      expect(result.status).toBe('active');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    // Add status transition validation tests here
    // Example: Draft -> Submitted -> Approved -> Cancelled
  });

  // ==========================================
  // SECURITY TESTS
  // ==========================================

  describe('Security', () => {
    it('should enforce tenant isolation on all queries', async () => {
      mockTestProductRepository.find.mockResolvedValue([]);

      await service.findAll(mockUser, 1, 20);

      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        'TestProduct',
      );
    });

    it('should block access to other tenant data', async () => {
      const otherTenantTestProduct = { id: '1', tenantId: 'other-tenant-id' };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockTestProductRepository.findOne.mockResolvedValue(otherTenantTestProduct);
      mockPermissionService.canRead.mockReturnValue(false);

      await expect(service.findOne(mockUser, '1')).rejects.toThrow();
    });
  });
});
