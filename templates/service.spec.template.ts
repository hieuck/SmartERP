import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { {{EntityName}}Service } from './{{entity-name}}.service';
import { {{EntityName}} } from './entities/{{entity-name}}.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';
import { Create{{EntityName}}Dto } from './dto/create-{{entity-name}}.dto';
import { Update{{EntityName}}Dto } from './dto/update-{{entity-name}}.dto';

/**
 * {{EntityName}}Service Unit Tests
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
describe('{{EntityName}}Service', () => {
  let service: {{EntityName}}Service;

  // Mock TypeORM Repository
  const mock{{EntityName}}Repository = {
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
        {{EntityName}}Service,
        {
          provide: getRepositoryToken({{EntityName}}),
          useValue: mock{{EntityName}}Repository,
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

    service = module.get<{{EntityName}}Service>({{EntityName}}Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // CRUD OPERATIONS TESTS
  // ==========================================

  describe('findAll', () => {
    it('should return paginated {{entityName}}s', async () => {
      const mock{{EntityName}}s = [
        { id: '1', tenantId: mockUser.tenantId, name: 'Test 1' },
        { id: '2', tenantId: mockUser.tenantId, name: 'Test 2' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(mock{{EntityName}}s);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mock{{EntityName}}s);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(mock{{EntityName}}Repository.find).toHaveBeenCalled();
    });

    it('should apply tenant isolation', async () => {
      mock{{EntityName}}Repository.find.mockResolvedValue([]);

      await service.findAll(mockUser, 1, 20);

      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        '{{EntityName}}',
      );
    });

    it('should handle pagination correctly', async () => {
      const mock{{EntityName}}s = Array(50)
        .fill(null)
        .map((_, i) => ({ id: `${i}`, tenantId: mockUser.tenantId }));
      mock{{EntityName}}Repository.find.mockResolvedValue(mock{{EntityName}}s);

      const result = await service.findAll(mockUser, 2, 10);

      expect(result.data.length).toBe(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should find {{entityName}} by id', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId, name: 'Test' };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mock{{EntityName}});
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mock{{EntityName}}Repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });

    it('should check read permission', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mock{{EntityName}}Repository.findOne.mockResolvedValue(mock{{EntityName}});

      await service.findOne(mockUser, '1');

      expect(mockPermissionService.canRead).toHaveBeenCalledWith(
        mockUser,
        mock{{EntityName}},
        '{{EntityName}}',
      );
    });
  });

  describe('create', () => {
    it('should create {{entityName}}', async () => {
      const create{{EntityName}}Dto: Create{{EntityName}}Dto = {
        name: 'New {{EntityName}}',
        // Add other required fields
      };
      const created{{EntityName}} = {
        id: '1',
        ...create{{EntityName}}Dto,
        tenantId: mockUser.tenantId,
        createdBy: mockUser.id,
      };
      mock{{EntityName}}Repository.save.mockResolvedValue(created{{EntityName}});

      const result = await service.create(mockUser, create{{EntityName}}Dto);

      expect(result).toEqual(created{{EntityName}});
      expect(mock{{EntityName}}Repository.save).toHaveBeenCalled();
    });

    it('should set tenantId and createdBy automatically', async () => {
      const create{{EntityName}}Dto: Create{{EntityName}}Dto = {
        name: 'New {{EntityName}}',
      };
      mock{{EntityName}}Repository.save.mockResolvedValue({
        id: '1',
        ...create{{EntityName}}Dto,
        tenantId: mockUser.tenantId,
        createdBy: mockUser.id,
      });

      await service.create(mockUser, create{{EntityName}}Dto);

      const savedEntity = mock{{EntityName}}Repository.save.mock.calls[0][0];
      expect(savedEntity.tenantId).toBe(mockUser.tenantId);
      expect(savedEntity.createdBy).toBe(mockUser.id);
    });

    // Add business logic validation tests here
    // Example: Uniqueness check, reference validation, etc.
  });

  describe('update', () => {
    it('should update {{entityName}}', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId, name: 'Old Name' };
      const update{{EntityName}}Dto: Update{{EntityName}}Dto = { name: 'New Name' };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.save.mockResolvedValue({
        ...mock{{EntityName}},
        ...update{{EntityName}}Dto,
      });

      const result = await service.update(mockUser, '1', update{{EntityName}}Dto);

      expect(result.name).toBe('New Name');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should check write permission', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.save.mockResolvedValue(mock{{EntityName}});

      await service.update(mockUser, '1', {});

      expect(mockPermissionService.canWrite).toHaveBeenCalledWith(
        mockUser,
        mock{{EntityName}},
        '{{EntityName}}',
      );
    });

    it('should invalidate cache after update', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.save.mockResolvedValue(mock{{EntityName}});

      await service.update(mockUser, '1', {});

      expect(mockCacheService.del).toHaveBeenCalledWith(
        expect.stringContaining('{{entity-name}}'),
      );
    });
  });

  describe('remove', () => {
    it('should remove {{entityName}}', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.remove.mockResolvedValue(mock{{EntityName}});

      await service.remove(mockUser, '1');

      expect(mock{{EntityName}}Repository.remove).toHaveBeenCalledWith(mock{{EntityName}});
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should check delete permission', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.remove.mockResolvedValue(mock{{EntityName}});

      await service.remove(mockUser, '1');

      expect(mockPermissionService.canDelete).toHaveBeenCalledWith(
        mockUser,
        mock{{EntityName}},
        '{{EntityName}}',
      );
    });
  });

  describe('count', () => {
    it('should return {{entityName}} count', async () => {
      const mock{{EntityName}}s = Array(25)
        .fill(null)
        .map((_, i) => ({ id: `${i}`, tenantId: mockUser.tenantId }));
      mock{{EntityName}}Repository.find.mockResolvedValue(mock{{EntityName}}s);

      const result = await service.count(mockUser);

      expect(result).toBe(25);
    });
  });

  // ==========================================
  // CUSTOM BUSINESS LOGIC TESTS
  // Add your domain-specific tests below
  // ==========================================

  describe('findByStatus', () => {
    it('should find {{entityName}}s by status', async () => {
      const mock{{EntityName}}s = [
        { id: '1', tenantId: mockUser.tenantId, status: 'active' },
        { id: '2', tenantId: mockUser.tenantId, status: 'active' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(mock{{EntityName}}s);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual(mock{{EntityName}}s);
      expect(mock{{EntityName}}Repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update {{entityName}} status', async () => {
      const mock{{EntityName}} = { id: '1', tenantId: mockUser.tenantId, status: 'draft' };
      mockCacheService.getOrSet.mockResolvedValue(mock{{EntityName}});
      mock{{EntityName}}Repository.save.mockResolvedValue({
        ...mock{{EntityName}},
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
      mock{{EntityName}}Repository.find.mockResolvedValue([]);

      await service.findAll(mockUser, 1, 20);

      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
        '{{EntityName}}',
      );
    });

    it('should block access to other tenant data', async () => {
      const otherTenant{{EntityName}} = { id: '1', tenantId: 'other-tenant-id' };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mock{{EntityName}}Repository.findOne.mockResolvedValue(otherTenant{{EntityName}});
      mockPermissionService.canRead.mockReturnValue(false);

      await expect(service.findOne(mockUser, '1')).rejects.toThrow();
    });
  });
});
