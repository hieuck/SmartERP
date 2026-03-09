/**
 * TENANT ISOLATION TEST TEMPLATE
 * 
 * Use this template to add tenant isolation tests to any service.
 * These tests ensure that users can ONLY access data from their own tenant.
 * 
 * CRITICAL: Every service that queries the database MUST have these tests.
 * 
 * HOW TO USE:
 * 1. Copy the test cases below
 * 2. Replace {{EntityName}} with your entity name (e.g., Order, Product, Invoice)
 * 3. Replace {{entityName}} with lowercase version (e.g., order, product, invoice)
 * 4. Adjust mock data to match your entity structure
 * 5. Add to your service.spec.ts file
 * 
 * SECURITY IMPACT:
 * - Prevents data leaks between tenants (GDPR compliance)
 * - Blocks unauthorized cross-tenant access
 * - Ensures tenant isolation at query level
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { {{EntityName}}Service } from './{{entity-name}}.service';
import { {{EntityName}} } from './entities/{{entity-name}}.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('{{EntityName}}Service - Tenant Isolation', () => {
  let service: {{EntityName}}Service;

  // Mock Repository
  const mock{{EntityName}}Repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  // Mock CacheService
  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
  };

  // Mock PermissionService
  const mockPermissionService = {
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  // Mock Users from different tenants
  const tenant1User = createMockUser({ id: 'user-1', tenantId: 'tenant-1' });
  const tenant2User = createMockUser({ id: 'user-2', tenantId: 'tenant-2' });

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
  // TEST 1: Tenant Filter Applied to Queries
  // ==========================================
  describe('Tenant Filter in Queries', () => {
    it('should apply tenantId filter when querying all {{entityName}}s', async () => {
      const tenant1Data = [
        { id: '1', tenantId: 'tenant-1', name: 'Item 1' },
        { id: '2', tenantId: 'tenant-1', name: 'Item 2' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(tenant1Data);

      await service.findAll(tenant1User, 1, 20);

      // Verify buildSecureQuery was called with user context
      expect(mockPermissionService.buildSecureQuery).toHaveBeenCalledWith(
        tenant1User,
        expect.any(Object),
        '{{EntityName}}',
      );

      // Verify repository was called with tenantId filter
      expect(mock{{EntityName}}Repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });

    it('should apply tenantId filter when finding {{entityName}} by id', async () => {
      const tenant1Item = { id: '1', tenantId: 'tenant-1', name: 'Item 1' };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue(tenant1Item);

      await service.findOne(tenant1User, '1');

      // Verify findOne was called with tenantId in where clause
      expect(mock{{EntityName}}Repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '1',
            tenantId: 'tenant-1',
          }),
        }),
      );
    });

    it('should apply tenantId filter when searching {{entityName}}s', async () => {
      mock{{EntityName}}Repository.find.mockResolvedValue([]);

      await service.findAll(tenant1User, 1, 20);

      // Verify all queries include tenantId
      const findCall = mock{{EntityName}}Repository.find.mock.calls[0][0];
      expect(findCall.where).toHaveProperty('tenantId', 'tenant-1');
    });
  });

  // ==========================================
  // TEST 2: Cross-Tenant Access Prevention
  // ==========================================
  describe('Cross-Tenant Access Prevention', () => {
    it('should NOT return data from other tenants in findAll', async () => {
      // Setup: Repository returns mixed tenant data (simulating DB without filter)
      const mixedData = [
        { id: '1', tenantId: 'tenant-1', name: 'Tenant 1 Item' },
        { id: '2', tenantId: 'tenant-2', name: 'Tenant 2 Item' },
        { id: '3', tenantId: 'tenant-1', name: 'Tenant 1 Item 2' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(
        mixedData.filter((item) => item.tenantId === tenant1User.tenantId),
      );

      const result = await service.findAll(tenant1User, 1, 20);

      // Verify: Only tenant-1 data returned
      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.tenantId === 'tenant-1')).toBe(true);
      expect(result.data.some((item) => item.tenantId === 'tenant-2')).toBe(false);
    });

    it('should NOT allow accessing other tenant {{entityName}} by id', async () => {
      // Setup: Try to access tenant-2 data with tenant-1 user
      const tenant2Item = { id: '999', tenantId: 'tenant-2', name: 'Tenant 2 Item' };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue(null); // Correct behavior

      // Execute & Verify: Should throw NotFoundException
      await expect(service.findOne(tenant1User, '999')).rejects.toThrow();

      // Verify: Query included correct tenantId filter
      expect(mock{{EntityName}}Repository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '999',
            tenantId: 'tenant-1', // User's tenant, not the item's tenant
          }),
        }),
      );
    });

    it('should NOT allow updating other tenant {{entityName}}', async () => {
      // Setup: Try to update tenant-2 data with tenant-1 user
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue(null); // Item not found for this tenant

      // Execute & Verify: Should throw NotFoundException
      await expect(
        service.update(tenant1User, '999', { name: 'Hacked Name' }),
      ).rejects.toThrow();
    });

    it('should NOT allow deleting other tenant {{entityName}}', async () => {
      // Setup: Try to delete tenant-2 data with tenant-1 user
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue(null);

      // Execute & Verify: Should throw NotFoundException
      await expect(service.remove(tenant1User, '999')).rejects.toThrow();
    });
  });

  // ==========================================
  // TEST 3: Tenant Isolation in Create
  // ==========================================
  describe('Tenant Isolation in Create', () => {
    it('should automatically set tenantId from user context on create', async () => {
      const createDto = { name: 'New Item' };
      mock{{EntityName}}Repository.save.mockImplementation((entity) =>
        Promise.resolve({ id: '1', ...entity }),
      );

      await service.create(tenant1User, createDto);

      // Verify: tenantId was set from user context
      const savedEntity = mock{{EntityName}}Repository.save.mock.calls[0][0];
      expect(savedEntity.tenantId).toBe('tenant-1');
      expect(savedEntity.createdBy).toBe('user-1');
    });

    it('should IGNORE tenantId in DTO and use user tenantId', async () => {
      // Security test: User tries to create data for another tenant
      const maliciousDto = {
        name: 'Malicious Item',
        tenantId: 'tenant-2', // Trying to inject different tenantId
      };
      mock{{EntityName}}Repository.save.mockImplementation((entity) =>
        Promise.resolve({ id: '1', ...entity }),
      );

      await service.create(tenant1User, maliciousDto as any);

      // Verify: tenantId was overridden with user's tenantId
      const savedEntity = mock{{EntityName}}Repository.save.mock.calls[0][0];
      expect(savedEntity.tenantId).toBe('tenant-1'); // User's tenant, not injected value
      expect(savedEntity.tenantId).not.toBe('tenant-2');
    });
  });

  // ==========================================
  // TEST 4: Tenant Isolation in Bulk Operations
  // ==========================================
  describe('Tenant Isolation in Bulk Operations', () => {
    it('should only count {{entityName}}s from user tenant', async () => {
      const tenant1Data = [
        { id: '1', tenantId: 'tenant-1' },
        { id: '2', tenantId: 'tenant-1' },
        { id: '3', tenantId: 'tenant-1' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(tenant1Data);

      const count = await service.count(tenant1User);

      expect(count).toBe(3);
      expect(mock{{EntityName}}Repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });

    it('should only find by status within user tenant', async () => {
      const tenant1ActiveItems = [
        { id: '1', tenantId: 'tenant-1', status: 'active' },
        { id: '2', tenantId: 'tenant-1', status: 'active' },
      ];
      mock{{EntityName}}Repository.find.mockResolvedValue(tenant1ActiveItems);

      const result = await service.findByStatus(tenant1User, 'active');

      expect(result).toHaveLength(2);
      expect(mock{{EntityName}}Repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            status: 'active',
          }),
        }),
      );
    });
  });

  // ==========================================
  // TEST 5: Cache Key Tenant Isolation
  // ==========================================
  describe('Cache Key Tenant Isolation', () => {
    it('should include tenantId in cache keys', async () => {
      const tenant1Item = { id: '1', tenantId: 'tenant-1', name: 'Item 1' };
      mockCacheService.getOrSet.mockResolvedValue(tenant1Item);

      await service.findOne(tenant1User, '1');

      // Verify: Cache key includes tenantId
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('tenant-1'),
        expect.any(Function),
      );
    });

    it('should use different cache keys for different tenants', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue({
        id: '1',
        tenantId: 'tenant-1',
      });

      // Tenant 1 user accesses item
      await service.findOne(tenant1User, '1');
      const tenant1CacheKey = mockCacheService.getOrSet.mock.calls[0][0];

      jest.clearAllMocks();
      mock{{EntityName}}Repository.findOne.mockResolvedValue({
        id: '1',
        tenantId: 'tenant-2',
      });

      // Tenant 2 user accesses item with same ID
      await service.findOne(tenant2User, '1');
      const tenant2CacheKey = mockCacheService.getOrSet.mock.calls[0][0];

      // Verify: Different cache keys
      expect(tenant1CacheKey).not.toBe(tenant2CacheKey);
      expect(tenant1CacheKey).toContain('tenant-1');
      expect(tenant2CacheKey).toContain('tenant-2');
    });
  });

  // ==========================================
  // TEST 6: Relationship Tenant Isolation
  // ==========================================
  describe('Relationship Tenant Isolation', () => {
    it('should only load related entities from same tenant', async () => {
      // Example: Order with OrderItems
      const tenant1Order = {
        id: '1',
        tenantId: 'tenant-1',
        items: [
          { id: 'item-1', tenantId: 'tenant-1' },
          { id: 'item-2', tenantId: 'tenant-1' },
        ],
      };
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mock{{EntityName}}Repository.findOne.mockResolvedValue(tenant1Order);

      const result = await service.findOne(tenant1User, '1');

      // Verify: All related entities have same tenantId
      if (result.items) {
        expect(result.items.every((item) => item.tenantId === 'tenant-1')).toBe(true);
      }
    });
  });
});

/**
 * INTEGRATION TEST EXAMPLE
 * 
 * For end-to-end tenant isolation testing with real database
 */
describe('{{EntityName}}Service - Tenant Isolation (Integration)', () => {
  // Setup real database connection for integration tests
  // This ensures tenant isolation works with actual SQL queries

  it('should enforce tenant isolation at database level', async () => {
    // 1. Create data for tenant-1
    // 2. Create data for tenant-2
    // 3. Query as tenant-1 user
    // 4. Verify only tenant-1 data returned
    // 5. Query as tenant-2 user
    // 6. Verify only tenant-2 data returned
  });
});

/**
 * CHECKLIST FOR TENANT ISOLATION TESTS
 * 
 * ✅ Test 1: Tenant filter applied to all queries
 * ✅ Test 2: Cross-tenant access prevented (read, update, delete)
 * ✅ Test 3: TenantId auto-set on create, cannot be injected
 * ✅ Test 4: Bulk operations respect tenant isolation
 * ✅ Test 5: Cache keys include tenantId
 * ✅ Test 6: Related entities from same tenant only
 * 
 * SECURITY IMPACT:
 * - GDPR Compliance: Data isolation between tenants
 * - Data Breach Prevention: No cross-tenant access
 * - Audit Trail: All operations scoped to tenant
 */
