import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockCustomer: Customer = {
    id: '1',
    name: 'Test Customer',
    email: 'test@customer.com',
    phone: '0123456789',
    address: '123 Test St',
    status: 'active',
    creditLimit: 10000,
    currentBalance: 5000,
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customers for tenant', async () => {
      const customers = [mockCustomer];
      mockRepository.findAndCount.mockResolvedValue([customers, 1]);

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result).toEqual({
        data: customers,
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

    it('should return empty array if no customers found', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('tenant-1');

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const customers = [mockCustomer];
      mockRepository.findAndCount.mockResolvedValue([customers, 50]);

      const result = await service.findAll('tenant-1', 2, 10);

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockCustomer);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return customer by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail('test@customer.com', 'tenant-1');

      expect(result).toEqual(mockCustomer);
    });

    it('should return null if customer not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@customer.com', 'tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto: CreateCustomerDto = {
      name: 'New Customer',
      email: 'new@customer.com',
      phone: '0987654321',
      address: '456 New St',
    };

    it('should create a new customer', async () => {
      mockRepository.findOne.mockResolvedValue(null); // Email doesn't exist
      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(createDto, 'tenant-1');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenantId: 'tenant-1',
          status: 'active',
          creditLimit: 0,
          currentBalance: 0,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should use provided status if given', async () => {
      const dtoWithStatus = { ...createDto, status: 'inactive' };
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      await service.create(dtoWithStatus, 'tenant-1');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'inactive',
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCustomerDto = {
      name: 'Updated Customer',
      phone: '0111111111',
    };

    it('should update a customer', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateDto };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(updatedCustomer);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateDto, 'tenant-1');

      expect(result).toEqual(updatedCustomer);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.update('999', updateDto, 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating email to existing one', async () => {
      const updateWithEmail: UpdateCustomerDto = { email: 'existing@customer.com' };
      const existingCustomer = { ...mockCustomer, id: '2', email: 'existing@customer.com' };

      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne
        .mockResolvedValueOnce(mockCustomer) // First call: find customer to update
        .mockResolvedValueOnce(existingCustomer); // Second call: check email exists

      await expect(service.update('1', updateWithEmail, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating email to same email', async () => {
      const updateWithSameEmail: UpdateCustomerDto = { email: mockCustomer.email };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.update('1', updateWithSameEmail, 'tenant-1');

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} });
      mockCacheService.del.mockResolvedValue(undefined);

      await service.remove('1', 'tenant-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith(mockCustomer.id);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new NotFoundException());

      await expect(service.remove('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance', async () => {
      const updatedCustomer = { ...mockCustomer, currentBalance: 6000 };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(updatedCustomer);

      const result = await service.updateBalance('1', 1000, 'tenant-1');

      expect(result.currentBalance).toBe(6000);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle negative balance updates', async () => {
      const updatedCustomer = { ...mockCustomer, currentBalance: 4000 };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(updatedCustomer);

      const result = await service.updateBalance('1', -1000, 'tenant-1');

      expect(result.currentBalance).toBe(4000);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update customer credit limit', async () => {
      const updatedCustomer = { ...mockCustomer, creditLimit: 20000 };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(updatedCustomer);

      const result = await service.updateCreditLimit('1', 20000, 'tenant-1');

      expect(result.creditLimit).toBe(20000);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative credit limit', async () => {
      await expect(service.updateCreditLimit('1', -1000, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activate', () => {
    it('should activate a customer', async () => {
      const inactiveCustomer = { ...mockCustomer, status: 'inactive' };
      const activatedCustomer = { ...mockCustomer, status: 'active' };
      mockCacheService.getOrSet.mockResolvedValue(inactiveCustomer);
      mockRepository.findOne.mockResolvedValue(inactiveCustomer);
      mockRepository.save.mockResolvedValue(activatedCustomer);

      const result = await service.activate('1', 'tenant-1');

      expect(result.status).toBe('active');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate a customer', async () => {
      const deactivatedCustomer = { ...mockCustomer, status: 'inactive' };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockRepository.findOne.mockResolvedValue(mockCustomer);
      mockRepository.save.mockResolvedValue(deactivatedCustomer);

      const result = await service.deactivate('1', 'tenant-1');

      expect(result.status).toBe('inactive');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search customers by name, email, or phone', async () => {
      const customers = [mockCustomer];
      mockRepository.find.mockResolvedValue(customers);

      const result = await service.search('test', 'tenant-1');

      expect(result).toEqual(customers);
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([expect.objectContaining({ tenantId: 'tenant-1' })]),
        }),
      );
    });
  });

  describe('findByStatus', () => {
    it('should return customers by status', async () => {
      const customers = [mockCustomer];
      mockRepository.find.mockResolvedValue(customers);

      const result = await service.findByStatus('active', 'tenant-1');

      expect(result).toEqual(customers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'active', tenantId: 'tenant-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('count', () => {
    it('should return count of customers', async () => {
      mockRepository.count.mockResolvedValue(10);

      const result = await service.count('tenant-1');

      expect(result).toBe(10);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const customers = [mockCustomer];
      mockRepository.find.mockResolvedValue(customers);

      const result = await service.getTopCustomers(10, 'tenant-1');

      expect(result).toEqual(customers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        order: { currentBalance: 'DESC' },
        take: 10,
      });
    });
  });

  describe('getCustomersWithHighBalance', () => {
    it('should return customers with balance above threshold', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCustomer]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getCustomersWithHighBalance(1000, 'tenant-1');

      expect(result).toEqual([mockCustomer]);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('customer.currentBalance >= :threshold', {
        threshold: 1000,
      });
    });
  });
});
