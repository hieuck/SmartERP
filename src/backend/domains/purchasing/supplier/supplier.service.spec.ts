import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SupplierService } from './supplier.service';
import { Supplier } from './entities/supplier.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('SupplierService', () => {
  let service: SupplierService;

  const mockSupplier = {
    id: '1',
    tenantId: 'tenant-1',
    name: 'ABC Supplier',
    email: 'abc@supplier.com',
    phone: '0123456789',
    address: '123 Street',
    status: 'active',
    paymentTerms: 30,
    currentBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
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
    invalidateEntity: jest.fn(),
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, where) => ({ ...where, tenantId: user.tenantId })),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true),
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
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

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated suppliers for a tenant', async () => {
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue([mockSupplier]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result).toEqual({
        data: [mockSupplier],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const suppliers = Array(50).fill(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue(suppliers);

      const result = await service.findAll(mockUser, 3, 10);

      expect(result.meta).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(result.data.length).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockSupplier);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      jest.spyOn(service['secureSupplierRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a supplier by email', async () => {
      jest.spyOn(service['secureSupplierRepo'], 'findOne').mockResolvedValue(mockSupplier);

      const result = await service.findByEmail(mockUser, 'abc@supplier.com');

      expect(result).toEqual(mockSupplier);
    });

    it('should return null if supplier not found', async () => {
      jest.spyOn(service['secureSupplierRepo'], 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail(mockUser, 'notfound@supplier.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '0987654321',
        address: '456 Street',
      };

      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
      const newSupplier = { ...mockSupplier, ...createDto };
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue(newSupplier);

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe('New Supplier');
    });

    it('should throw ConflictException if email already exists', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'abc@supplier.com',
        phone: '0987654321',
      };

      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockSupplier);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
    });

    it('should create supplier with custom status', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '0987654321',
        status: 'inactive',
      };

      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
      const newSupplier = { ...mockSupplier, ...createDto, status: 'inactive' };
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue(newSupplier);

      const result = await service.create(mockUser, createDto);

      expect(result.status).toBe('inactive');
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto = { name: 'Updated Supplier' };
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        ...updateDto,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update(mockUser, '1', updateDto);

      expect(result.name).toBe('Updated Supplier');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      jest.spyOn(service['secureSupplierRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.update(mockUser, '999', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingSupplier = { ...mockSupplier, id: '2' };
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service, 'findByEmail').mockResolvedValue(existingSupplier);

      await expect(
        service.update(mockUser, '1', { email: 'existing@supplier.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue(mockSupplier);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update(mockUser, '1', { email: 'abc@supplier.com' });

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('remove', () => {
    it('should soft delete a supplier', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'remove').mockResolvedValue(mockSupplier);
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove(mockUser, '1');

      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      jest.spyOn(service['secureSupplierRepo'], 'findOne').mockResolvedValue(null);

      await expect(service.remove(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should update supplier balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        currentBalance: 1000,
      });

      const result = await service.updateBalance(mockUser, '1', 1000);

      expect(result.currentBalance).toBe(1000);
    });

    it('should add to existing balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockSupplier,
        currentBalance: 500,
      });
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        currentBalance: 1500,
      });

      const result = await service.updateBalance(mockUser, '1', 1000);

      expect(result.currentBalance).toBe(1500);
    });
  });

  describe('updatePaymentTerms', () => {
    it('should update payment terms', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        paymentTerms: 60,
      });

      const result = await service.updatePaymentTerms(mockUser, '1', 60);

      expect(result.paymentTerms).toBe(60);
    });

    it('should throw BadRequestException for negative payment terms', async () => {
      await expect(service.updatePaymentTerms(mockUser, '1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activate', () => {
    it('should activate a supplier', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockSupplier,
        status: 'inactive',
      });
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        status: 'active',
      });

      const result = await service.activate(mockUser, '1');

      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a supplier', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'save').mockResolvedValue({
        ...mockSupplier,
        status: 'inactive',
      });

      const result = await service.deactivate(mockUser, '1');

      expect(result.status).toBe('inactive');
    });
  });

  describe('search', () => {
    it('should search suppliers by name', async () => {
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue([mockSupplier]);

      const result = await service.search(mockUser, 'ABC');

      expect(result).toEqual([mockSupplier]);
    });
  });

  describe('findByStatus', () => {
    it('should return suppliers by status', async () => {
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue([mockSupplier]);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual([mockSupplier]);
    });
  });

  describe('count', () => {
    it('should return supplier count', async () => {
      const suppliers = Array(10).fill(mockSupplier);
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue(suppliers);

      const result = await service.count(mockUser);

      expect(result).toBe(10);
    });
  });

  describe('getTopSuppliers', () => {
    it('should return top suppliers by balance', async () => {
      const suppliers = [
        { ...mockSupplier, currentBalance: 5000 },
        { ...mockSupplier, currentBalance: 3000 },
        { ...mockSupplier, currentBalance: 1000 },
      ];
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue(suppliers);

      const result = await service.getTopSuppliers(mockUser, 3);

      expect(result).toEqual(suppliers);
    });
  });

  describe('getSuppliersWithHighBalance', () => {
    it('should return suppliers with balance above threshold', async () => {
      const suppliers = [
        { ...mockSupplier, currentBalance: 5000 },
        { ...mockSupplier, currentBalance: 3000 },
      ];
      jest.spyOn(service['secureSupplierRepo'], 'find').mockResolvedValue(suppliers);

      const result = await service.getSuppliersWithHighBalance(mockUser, 1000);

      expect(result).toEqual(suppliers);
    });
  });
});
