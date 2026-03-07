import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Like } from 'typeorm';
import { SupplierService } from './supplier.service';
import { Supplier } from './entities/supplier.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
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
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
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
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated suppliers for a tenant', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockSupplier], 1]);

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
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockSupplier], 50]);

      const result = await service.findAll(mockUser, 3, 10);

      expect(result.meta).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockSupplier);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a supplier by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findByEmail('abc@supplier.com', mockUser);

      expect(result).toEqual(mockSupplier);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'abc@supplier.com', tenantId: 'tenant-1' },
      });
    });

    it('should return null if supplier not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@supplier.com', mockUser);

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

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockSupplier, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockSupplier, ...createDto });

      const result = await service.create(createDto, mockUser);

      expect(result.name).toBe('New Supplier');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'tenant-1',
        status: 'active',
        paymentTerms: 0,
        currentBalance: 0,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'abc@supplier.com',
        phone: '0987654321',
      };

      mockRepository.findOne.mockResolvedValue(mockSupplier);

      await expect(service.create(createDto, mockUser)).rejects.toThrow(ConflictException);
    });

    it('should create supplier with custom status', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '0987654321',
        status: 'inactive',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({ ...mockSupplier, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockSupplier, ...createDto });

      const result = await service.create(createDto, mockUser);

      expect(result.status).toBe('inactive');
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateDto = { name: 'Updated Supplier' };
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        ...updateDto,
      });
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, mockUser);

      expect(result.name).toBe('Updated Supplier');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { name: 'Updated' }, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingSupplier = { ...mockSupplier, id: '2' };
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.findOne.mockResolvedValue(existingSupplier);

      await expect(
        service.update('1', { email: 'existing@supplier.com' }, mockUser),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue(mockSupplier);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', { email: 'abc@supplier.com' }, mockUser);

      expect(result).toEqual(mockSupplier);
    });
  });

  describe('remove', () => {
    it('should soft delete a supplier', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', mockUser);

      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, fn) => {
        return fn();
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should update supplier balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        currentBalance: 1000,
      });

      const result = await service.updateBalance('1', 1000, mockUser);

      expect(result.currentBalance).toBe(1000);
    });

    it('should add to existing balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...mockSupplier,
        currentBalance: 500,
      });
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        currentBalance: 1500,
      });

      const result = await service.updateBalance('1', 1000, mockUser);

      expect(result.currentBalance).toBe(1500);
    });
  });

  describe('updatePaymentTerms', () => {
    it('should update payment terms', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        paymentTerms: 60,
      });

      const result = await service.updatePaymentTerms('1', 60, mockUser);

      expect(result.paymentTerms).toBe(60);
    });

    it('should throw BadRequestException for negative payment terms', async () => {
      await expect(service.updatePaymentTerms('1', -10, mockUser)).rejects.toThrow(
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
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        status: 'active',
      });

      const result = await service.activate('1', mockUser);

      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a supplier', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockSupplier);
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        status: 'inactive',
      });

      const result = await service.deactivate('1', mockUser);

      expect(result.status).toBe('inactive');
    });
  });

  describe('search', () => {
    it('should search suppliers by name', async () => {
      mockRepository.find.mockResolvedValue([mockSupplier]);

      const result = await service.search('ABC', mockUser);

      expect(result).toEqual([mockSupplier]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { name: Like('%ABC%'), tenantId: 'tenant-1' },
          { email: Like('%ABC%'), tenantId: 'tenant-1' },
          { phone: Like('%ABC%'), tenantId: 'tenant-1' },
        ],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return suppliers by status', async () => {
      mockRepository.find.mockResolvedValue([mockSupplier]);

      const result = await service.findByStatus('active', mockUser);

      expect(result).toEqual([mockSupplier]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'active', tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('count', () => {
    it('should return supplier count', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count(mockUser);

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });
  });

  describe('getTopSuppliers', () => {
    it('should return top suppliers by balance', async () => {
      const suppliers = [
        { ...mockSupplier, currentBalance: 5000 },
        { ...mockSupplier, currentBalance: 3000 },
        { ...mockSupplier, currentBalance: 1000 },
      ];
      mockRepository.find.mockResolvedValue(suppliers);

      const result = await service.getTopSuppliers(3, mockUser);

      expect(result).toEqual(suppliers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { currentBalance: 'DESC' },
        take: 3,
      });
    });
  });

  describe('getSuppliersWithHighBalance', () => {
    it('should return suppliers with balance above threshold', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockSupplier]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getSuppliersWithHighBalance(1000, mockUser);

      expect(result).toEqual([mockSupplier]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('supplier.tenantId = :tenantId', {
        tenantId: 'tenant-1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'supplier.currentBalance >= :threshold',
        { threshold: 1000 },
      );
    });
  });
});
