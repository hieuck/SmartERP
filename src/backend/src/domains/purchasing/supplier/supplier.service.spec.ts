import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';

describe('SupplierService', () => {
  let service: SupplierService;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let cacheService: jest.Mocked<CacheService>;
  let permissionService: jest.Mocked<PermissionService>;

  const tenantId = 'tenant-123';
  const userId = 'user-123';
  const supplierId = 'supplier-123';

  const mockUser: User = {
    id: userId,
    tenantId,
    roles: ['user'],
  };

  const mockSupplier: Supplier = {
    id: supplierId,
    tenantId,
    name: 'ABC Supplies',
    email: 'supplier@example.com',
    phone: '+1234567890',
    address: '456 Supply St',
    city: 'Supply City',
    state: 'SC',
    country: 'USA',
    postalCode: '12345',
    taxId: 'TAX456',
    website: 'https://abc-supplies.com',
    notes: 'Reliable supplier',
    status: 'active',
    paymentTerms: 30,
    currentBalance: 5000,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  } as Supplier;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            checkPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    supplierRepository = module.get(getRepositoryToken(Supplier));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);

    // Mock SecureRepository methods
    jest.spyOn(SecureRepository.prototype, 'find').mockImplementation(async () => [mockSupplier]);
    jest.spyOn(SecureRepository.prototype, 'findOne').mockImplementation(async () => mockSupplier);
    jest.spyOn(SecureRepository.prototype, 'save').mockImplementation(async (user, entity) => entity as Supplier);
    jest.spyOn(SecureRepository.prototype, 'remove').mockImplementation(async () => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, id: 'supplier-456' }];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(suppliers);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const suppliers = Array.from({ length: 50 }, (_, i) => ({
        ...mockSupplier,
        id: `supplier-${i}`,
      }));
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.findAll(mockUser, 2, 20);

      expect(result.data.length).toBe(20);
      expect(result.meta).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
      });
    });

    it('should return empty array when no suppliers', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return supplier from cache', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);

      const result = await service.findOne(mockUser, supplierId);

      expect(result).toEqual(mockSupplier);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when supplier not found', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.findOne(mockUser, supplierId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, supplierId)).rejects.toThrow(
        `Supplier with ID ${supplierId} not found`,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return supplier by email', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(mockSupplier);

      const result = await service.findByEmail(mockUser, 'supplier@example.com');

      expect(result).toEqual(mockSupplier);
    });

    it('should return null when supplier not found', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail(mockUser, 'notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto: CreateSupplierDto = {
      name: 'New Supplier',
      email: 'new@example.com',
      phone: '+9876543210',
      address: '789 New St',
      taxId: 'TAX789',
      status: 'active',
    };

    it('should create supplier successfully', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(null);
      const newSupplier = { ...mockSupplier, ...createDto };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(newSupplier);

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.email).toBe(createDto.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(mockSupplier);

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        `Supplier with email ${createDto.email} already exists`,
      );
    });

    it('should set default status to active if not provided', async () => {
      const dtoWithoutStatus = { ...createDto };
      delete dtoWithoutStatus.status;
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(null);
      jest.spyOn(SecureRepository.prototype, 'save').mockImplementation(async (user, entity) => ({
        ...mockSupplier,
        ...entity,
      } as Supplier));

      const result = await service.create(mockUser, dtoWithoutStatus);

      expect(result.status).toBe('active');
    });
  });

  describe('update', () => {
    const updateDto: UpdateSupplierDto = {
      name: 'Updated Supplier',
      phone: '+1111111111',
    };

    it('should update supplier successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const updatedSupplier = { ...mockSupplier, ...updateDto };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(updatedSupplier);

      const result = await service.update(mockUser, supplierId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingSupplier = { ...mockSupplier, id: 'other-supplier' };
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(existingSupplier);

      await expect(
        service.update(mockUser, supplierId, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(mockSupplier);

      const result = await service.update(mockUser, supplierId, {
        email: mockSupplier.email,
      });

      expect(result.email).toBe(mockSupplier.email);
    });
  });

  describe('remove', () => {
    it('should remove supplier successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      jest.spyOn(SecureRepository.prototype, 'remove').mockResolvedValue(undefined);

      await service.remove(mockUser, supplierId);

      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException when supplier not found', async () => {
      jest.spyOn(SecureRepository.prototype, 'findOne').mockResolvedValue(null);
      cacheService.getOrSet.mockImplementation(async (key, fn) => fn());

      await expect(service.remove(mockUser, supplierId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should update supplier balance successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const updatedSupplier = { ...mockSupplier, currentBalance: 6000 };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(updatedSupplier);

      const result = await service.updateBalance(mockUser, supplierId, 1000);

      expect(result.currentBalance).toBe(6000);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should handle negative balance updates', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const updatedSupplier = { ...mockSupplier, currentBalance: 4000 };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(updatedSupplier);

      const result = await service.updateBalance(mockUser, supplierId, -1000);

      expect(result.currentBalance).toBe(4000);
    });
  });

  describe('updatePaymentTerms', () => {
    it('should update payment terms successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const updatedSupplier = { ...mockSupplier, paymentTerms: 60 };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(updatedSupplier);

      const result = await service.updatePaymentTerms(mockUser, supplierId, 60);

      expect(result.paymentTerms).toBe(60);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative payment terms', async () => {
      await expect(service.updatePaymentTerms(mockUser, supplierId, -10)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updatePaymentTerms(mockUser, supplierId, -10)).rejects.toThrow(
        'Payment terms cannot be negative',
      );
    });

    it('should allow zero payment terms', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const updatedSupplier = { ...mockSupplier, paymentTerms: 0 };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(updatedSupplier);

      const result = await service.updatePaymentTerms(mockUser, supplierId, 0);

      expect(result.paymentTerms).toBe(0);
    });
  });

  describe('activate', () => {
    it('should activate supplier successfully', async () => {
      const inactiveSupplier = { ...mockSupplier, status: 'inactive' };
      cacheService.getOrSet.mockResolvedValue(inactiveSupplier);
      const activatedSupplier = { ...inactiveSupplier, status: 'active' };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(activatedSupplier);

      const result = await service.activate(mockUser, supplierId);

      expect(result.status).toBe('active');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate supplier successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockSupplier);
      const deactivatedSupplier = { ...mockSupplier, status: 'inactive' };
      jest.spyOn(SecureRepository.prototype, 'save').mockResolvedValue(deactivatedSupplier);

      const result = await service.deactivate(mockUser, supplierId);

      expect(result.status).toBe('inactive');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search suppliers by name', async () => {
      const suppliers = [
        mockSupplier,
        { ...mockSupplier, id: 'supplier-456', name: 'XYZ Supplies' },
      ];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.search(mockUser, 'ABC');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('ABC Supplies');
    });

    it('should search suppliers by email', async () => {
      const suppliers = [mockSupplier];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.search(mockUser, 'supplier@example');

      expect(result.length).toBe(1);
      expect(result[0].email).toContain('supplier@example');
    });

    it('should search suppliers by phone', async () => {
      const suppliers = [mockSupplier];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.search(mockUser, '1234567890');

      expect(result.length).toBe(1);
      expect(result[0].phone).toContain('1234567890');
    });

    it('should return empty array when no match', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([mockSupplier]);

      const result = await service.search(mockUser, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should be case insensitive', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([mockSupplier]);

      const result = await service.search(mockUser, 'abc supplies');

      expect(result.length).toBe(1);
    });
  });

  describe('findByStatus', () => {
    it('should return suppliers by status', async () => {
      const activeSuppliers = [mockSupplier];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(activeSuppliers);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual(activeSuppliers);
    });

    it('should return empty array when no suppliers with status', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([]);

      const result = await service.findByStatus(mockUser, 'inactive');

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return total count of suppliers', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, id: 'supplier-456' }];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.count(mockUser);

      expect(result).toBe(2);
    });

    it('should return 0 when no suppliers', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTopSuppliers', () => {
    it('should return top suppliers by balance', async () => {
      const suppliers = [
        { ...mockSupplier, id: 'supplier-1', currentBalance: 10000 },
        { ...mockSupplier, id: 'supplier-2', currentBalance: 5000 },
        { ...mockSupplier, id: 'supplier-3', currentBalance: 15000 },
      ];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getTopSuppliers(mockUser, 2);

      expect(result.length).toBe(2);
      expect(result[0].currentBalance).toBe(15000);
      expect(result[1].currentBalance).toBe(10000);
    });

    it('should return all suppliers if limit exceeds count', async () => {
      const suppliers = [mockSupplier];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getTopSuppliers(mockUser, 10);

      expect(result.length).toBe(1);
    });
  });

  describe('getSuppliersWithHighBalance', () => {
    it('should return suppliers with balance above threshold', async () => {
      const suppliers = [
        { ...mockSupplier, id: 'supplier-1', currentBalance: 10000 },
        { ...mockSupplier, id: 'supplier-2', currentBalance: 3000 },
        { ...mockSupplier, id: 'supplier-3', currentBalance: 15000 },
      ];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 5000);

      expect(result.length).toBe(2);
      expect(result[0].currentBalance).toBe(15000);
      expect(result[1].currentBalance).toBe(10000);
    });

    it('should return empty array when no suppliers meet threshold', async () => {
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue([mockSupplier]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 100000);

      expect(result).toEqual([]);
    });

    it('should include suppliers with balance equal to threshold', async () => {
      const suppliers = [{ ...mockSupplier, currentBalance: 5000 }];
      jest.spyOn(SecureRepository.prototype, 'find').mockResolvedValue(suppliers as Supplier[]);

      const result = await service.getSuppliersWithHighBalance(mockUser, 5000);

      expect(result.length).toBe(1);
    });
  });
});
