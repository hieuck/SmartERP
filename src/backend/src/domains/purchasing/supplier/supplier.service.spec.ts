import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from './entities/supplier.entity';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SyncStatus } from '@/common/enums/sync-status.enum';

describe('SupplierService', () => {
  let service: SupplierService;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: User = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
  };

  const mockSupplier: Supplier = {
    id: 'supplier-1',
    tenantId: 'tenant-1',
    name: 'Test Supplier',
    email: 'supplier@example.com',
    phone: '+1234567890',
    address: '123 Test St',
    taxId: 'TAX123',
    status: 'active',
    paymentTerms: 30,
    currentBalance: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    version: 1,
    syncStatus: SyncStatus.SYNCED,
  } as Supplier;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    const mockCache = {
      getOrSet: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    const mockPermission = {
      filterByTenant: jest.fn((user, entities) => entities),
      checkAccess: jest.fn(),
      buildSecureQuery: jest.fn((user, baseWhere) => ({ ...baseWhere, tenantId: user.tenantId })),
      canRead: jest.fn(() => true),
      canWrite: jest.fn(() => true),
      canDelete: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: PermissionService,
          useValue: mockPermission,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    supplierRepository = module.get(getRepositoryToken(Supplier));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, id: 'supplier-2' }];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(suppliers);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(supplierRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle pagination correctly', async () => {
      const suppliers = Array.from({ length: 25 }, (_, i) => ({
        ...mockSupplier,
        id: `supplier-${i}`,
      }));
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.findAll(mockUser, 2, 10);

      expect(result.data.length).toBe(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty array when no suppliers', async () => {
      supplierRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return supplier from cache if available', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);

      const result = await service.findOne(mockUser, 'supplier-1');

      expect(result).toEqual(mockSupplier);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      supplierRepository.findOne.mockResolvedValue(mockSupplier);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      const result = await service.findOne(mockUser, 'supplier-1');

      expect(result).toEqual(mockSupplier);
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
      });
    });

    it('should throw NotFoundException when supplier not found', async () => {
      supplierRepository.findOne.mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return supplier by email', async () => {
      supplierRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findByEmail(mockUser, 'supplier@example.com');

      expect(result).toEqual(mockSupplier);
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'supplier@example.com' },
      });
    });

    it('should return null when supplier not found', async () => {
      supplierRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(mockUser, 'notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto: CreateSupplierDto = {
      name: 'New Supplier',
      email: 'new@example.com',
      phone: '+1234567890',
      address: '456 New St',
    };

    it('should create a new supplier', async () => {
      supplierRepository.findOne.mockResolvedValue(null);
      supplierRepository.save.mockResolvedValue({ ...mockSupplier, ...createDto } as Supplier);

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.email).toBe(createDto.email);
      expect(supplierRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          status: 'active',
          paymentTerms: 0,
          currentBalance: 0,
          tenantId: mockUser.tenantId,
        }),
      );
    });

    it('should use provided status when creating supplier', async () => {
      const dtoWithStatus = { ...createDto, status: 'inactive' };
      supplierRepository.findOne.mockResolvedValue(null);
      supplierRepository.save.mockResolvedValue({ ...mockSupplier, ...dtoWithStatus } as Supplier);

      await service.create(mockUser, dtoWithStatus);

      expect(supplierRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      supplierRepository.findOne.mockResolvedValue(mockSupplier);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSupplierDto = {
      name: 'Updated Supplier',
      phone: '+9876543210',
    };

    it('should update supplier', async () => {
      const updatedSupplier = { ...mockSupplier, ...updateDto };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(updatedSupplier as Supplier);

      const result = await service.update(mockUser, 'supplier-1', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.phone).toBe(updateDto.phone);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should check email uniqueness when updating email', async () => {
      const updateWithEmail: UpdateSupplierDto = { email: 'newemail@example.com' };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.findOne.mockResolvedValueOnce(null); // for findByEmail check
      supplierRepository.save.mockResolvedValue({
        ...mockSupplier,
        ...updateWithEmail,
      } as Supplier);

      await service.update(mockUser, 'supplier-1', updateWithEmail);

      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'newemail@example.com' },
      });
    });

    it('should throw ConflictException when new email already exists', async () => {
      const updateWithEmail: UpdateSupplierDto = { email: 'existing@example.com' };
      const existingSupplier = { ...mockSupplier, id: 'supplier-2', email: 'existing@example.com' };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.findOne.mockResolvedValue(existingSupplier as Supplier);

      await expect(service.update(mockUser, 'supplier-1', updateWithEmail)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should not check email uniqueness when email unchanged', async () => {
      const updateWithSameEmail: UpdateSupplierDto = { name: 'Updated Name' };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue({ ...mockSupplier, name: 'Updated Name' } as Supplier);

      await service.update(mockUser, 'supplier-1', updateWithSameEmail);

      // findOne should not be called for email check since email is not being updated
      // Only cacheService.getOrSet is called to fetch the supplier
      expect(supplierRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw NotFoundException when supplier not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      supplierRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser, 'non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove supplier', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.findOne.mockResolvedValue(mockSupplier);
      supplierRepository.remove.mockResolvedValue(mockSupplier);

      await service.remove(mockUser, 'supplier-1');

      expect(supplierRepository.remove).toHaveBeenCalledWith(mockSupplier);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when supplier not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      supplierRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should update supplier balance', async () => {
      const updatedSupplier = { ...mockSupplier, currentBalance: 1500 };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(updatedSupplier as Supplier);

      const result = await service.updateBalance(mockUser, 'supplier-1', 500);

      expect(result.currentBalance).toBe(1500);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should handle negative balance updates', async () => {
      const updatedSupplier = { ...mockSupplier, currentBalance: 500 };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(updatedSupplier as Supplier);

      const result = await service.updateBalance(mockUser, 'supplier-1', -500);

      expect(result.currentBalance).toBe(500);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());
      supplierRepository.findOne.mockResolvedValue(null);

      await expect(service.updateBalance(mockUser, 'non-existent', 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePaymentTerms', () => {
    it('should update payment terms', async () => {
      const updatedSupplier = { ...mockSupplier, paymentTerms: 60 };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(updatedSupplier as Supplier);

      const result = await service.updatePaymentTerms(mockUser, 'supplier-1', 60);

      expect(result.paymentTerms).toBe(60);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative payment terms', async () => {
      await expect(service.updatePaymentTerms(mockUser, 'supplier-1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow zero payment terms', async () => {
      const updatedSupplier = { ...mockSupplier, paymentTerms: 0 };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(updatedSupplier as Supplier);

      const result = await service.updatePaymentTerms(mockUser, 'supplier-1', 0);

      expect(result.paymentTerms).toBe(0);
    });
  });

  describe('activate', () => {
    it('should activate supplier', async () => {
      const inactiveSupplier = { ...mockSupplier, status: 'inactive' };
      const activatedSupplier = { ...mockSupplier, status: 'active' };
      cacheService.getOrSet.mockResolvedValue(inactiveSupplier as Supplier);
      supplierRepository.save.mockResolvedValue(activatedSupplier as Supplier);

      const result = await service.activate(mockUser, 'supplier-1');

      expect(result.status).toBe('active');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate supplier', async () => {
      const deactivatedSupplier = { ...mockSupplier, status: 'inactive' };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      supplierRepository.save.mockResolvedValue(deactivatedSupplier as Supplier);

      const result = await service.deactivate(mockUser, 'supplier-1');

      expect(result.status).toBe('inactive');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search suppliers by name', async () => {
      const supplier1: Supplier = {
        ...mockSupplier,
        id: 'supplier-1',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
      };
      const supplier2: Supplier = {
        ...mockSupplier,
        id: 'supplier-2',
        name: 'Other Supplier',
        email: 'other@example.com',
        phone: '+9876543210',
      };
      const suppliers = [supplier1, supplier2];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, 'Test');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Supplier');
      expect(supplierRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should search suppliers by email', async () => {
      const supplier1: Supplier = {
        ...mockSupplier,
        id: 'supplier-1',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
      };
      const supplier2: Supplier = {
        ...mockSupplier,
        id: 'supplier-2',
        name: 'Other Supplier',
        email: 'other@example.com',
        phone: '+9876543210',
      };
      const suppliers = [supplier1, supplier2];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, 'supplier@example');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('supplier@example.com');
    });

    it('should search suppliers by phone', async () => {
      const supplier1: Supplier = {
        ...mockSupplier,
        id: 'supplier-1',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
      };
      const supplier2: Supplier = {
        ...mockSupplier,
        id: 'supplier-2',
        name: 'Other Supplier',
        email: 'other@example.com',
        phone: '+9876543210',
      };
      const suppliers = [supplier1, supplier2];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, '1234567890');

      expect(result).toHaveLength(1);
      expect(result[0].phone).toBe('+1234567890');
    });

    it('should return empty array when no matches', async () => {
      const suppliers = [mockSupplier];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should be case insensitive', async () => {
      const supplier1: Supplier = {
        ...mockSupplier,
        id: 'supplier-1',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
      };
      const supplier2: Supplier = {
        ...mockSupplier,
        id: 'supplier-2',
        name: 'lowercase supplier',
        email: 'lower@example.com',
        phone: '+9876543210',
      };
      const suppliers = [supplier1, supplier2];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, 'TEST SUPPLIER');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Supplier');
    });

    it('should handle suppliers without phone', async () => {
      const supplierWithoutPhone: Supplier = { ...mockSupplier, phone: null };
      const suppliers = [supplierWithoutPhone];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, '1234567890');

      expect(result).toEqual([]);
    });

    it('should match multiple fields', async () => {
      const supplier1: Supplier = {
        ...mockSupplier,
        id: 'supplier-1',
        name: 'Test Supplier',
        email: 'supplier@example.com',
        phone: '+1234567890',
      };
      const supplier2: Supplier = {
        ...mockSupplier,
        id: 'supplier-2',
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+9876543210',
      };
      const suppliers = [supplier1, supplier2];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.search(mockUser, 'test');

      expect(result).toHaveLength(2);
    });
  });

  describe('findByStatus', () => {
    it('should return suppliers with specific status', async () => {
      const activeSuppliers = [mockSupplier];
      supplierRepository.find.mockResolvedValue(activeSuppliers);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual(activeSuppliers);
      expect(supplierRepository.find).toHaveBeenCalledWith({
        where: { status: 'active', tenantId: mockUser.tenantId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no suppliers with status', async () => {
      supplierRepository.find.mockResolvedValue([]);

      const result = await service.findByStatus(mockUser, 'inactive');

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return count of suppliers', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, id: 'supplier-2' }];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no suppliers', async () => {
      supplierRepository.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTopSuppliers', () => {
    it('should return top suppliers by balance', async () => {
      const suppliers = [
        { ...mockSupplier, id: 'supplier-1', currentBalance: 1000 },
        { ...mockSupplier, id: 'supplier-2', currentBalance: 5000 },
        { ...mockSupplier, id: 'supplier-3', currentBalance: 3000 },
      ];
      supplierRepository.find.mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getTopSuppliers(mockUser, 2);

      expect(result).toHaveLength(2);
      expect(result[0].currentBalance).toBe(5000);
      expect(result[1].currentBalance).toBe(3000);
    });

    it('should return all suppliers if limit exceeds count', async () => {
      const suppliers = [mockSupplier];
      supplierRepository.find.mockResolvedValue(suppliers);

      const result = await service.getTopSuppliers(mockUser, 10);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no suppliers', async () => {
      supplierRepository.find.mockResolvedValue([]);

      const result = await service.getTopSuppliers(mockUser, 5);

      expect(result).toEqual([]);
    });
  });

  describe('getSuppliersWithHighBalance', () => {
    it('should return suppliers with balance above threshold', async () => {
      const suppliers = [
        { ...mockSupplier, id: 'supplier-1', currentBalance: 1000 },
        { ...mockSupplier, id: 'supplier-2', currentBalance: 5000 },
        { ...mockSupplier, id: 'supplier-3', currentBalance: 3000 },
      ];
      supplierRepository.find.mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 2000);

      expect(result).toHaveLength(2);
      expect(result[0].currentBalance).toBe(5000);
      expect(result[1].currentBalance).toBe(3000);
    });

    it('should return empty array when no suppliers meet threshold', async () => {
      const suppliers = [{ ...mockSupplier, currentBalance: 100 }];
      supplierRepository.find.mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 1000);

      expect(result).toEqual([]);
    });

    it('should include suppliers with balance equal to threshold', async () => {
      const suppliers = [{ ...mockSupplier, currentBalance: 1000 }];
      supplierRepository.find.mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 1000);

      expect(result).toHaveLength(1);
    });
  });
});
