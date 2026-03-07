import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockCustomer = {
    id: '1',
    email: 'customer@test.com',
    name: 'Test Customer',
    tenantId: 'tenant-1',
    status: 'active',
    creditLimit: 1000,
    currentBalance: 500,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: '1', email: 'customer1@test.com' },
        { id: '2', email: 'customer2@test.com' },
      ];
      mockCustomerRepository.findAndCount.mockResolvedValue([mockCustomers, 2]);

      const result = await service.findAll(mockUser, 1, 20);

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find customer by id', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockCustomer);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find customer by email', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail('customer@test.com', mockUser);

      expect(result).toEqual(mockCustomer);
    });

    it('should return null if customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@test.com', mockUser);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create customer', async () => {
      const customerData = { email: 'new@customer.com', name: 'New Customer' };
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customerData);
      mockCustomerRepository.save.mockResolvedValue(customerData);

      const result = await service.create(customerData as any, mockUser);

      expect(result).toEqual(customerData);
    });

    it('should throw ConflictException if email exists', async () => {
      const customerData = { email: 'existing@customer.com' };
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(customerData as any, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const updateData = { name: 'Updated Customer' };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, ...updateData });

      const result = await service.update('1', updateData, mockUser);

      expect(result.name).toBe('Updated Customer');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.findOne.mockResolvedValue({ id: '2', email: 'other@test.com' });

      await expect(service.update('1', { email: 'other@test.com' }, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('1', mockUser);

      expect(mockCustomerRepository.softDelete).toHaveBeenCalledWith('1');
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, currentBalance: 600 });

      const result = await service.updateBalance('1', 100, mockUser);

      expect(result.currentBalance).toBe(600);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update credit limit', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, creditLimit: 2000 });

      const result = await service.updateCreditLimit('1', 2000, mockUser);

      expect(result.creditLimit).toBe(2000);
    });

    it('should throw BadRequestException if credit limit is negative', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);

      await expect(service.updateCreditLimit('1', -100, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activate', () => {
    it('should activate customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, status: 'active' });

      const result = await service.activate('1', mockUser);

      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, status: 'inactive' });

      const result = await service.deactivate('1', mockUser);

      expect(result.status).toBe('inactive');
    });
  });

  describe('search', () => {
    it('should search customers by query', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.search('test', mockUser);

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('findByStatus', () => {
    it('should find customers by status', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.findByStatus('active', mockUser);

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('count', () => {
    it('should return customer count', async () => {
      mockCustomerRepository.count.mockResolvedValue(10);

      const result = await service.count(mockUser);

      expect(result).toBe(10);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.getTopCustomers(5, mockUser);

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('getCustomersWithHighBalance', () => {
    it('should return customers with high balance', async () => {
      const mockCustomers = [mockCustomer];
      mockQueryBuilder.getMany.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(1000, mockUser);

      expect(result).toEqual(mockCustomers);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'customer.currentBalance >= :threshold',
        { threshold: 1000 },
      );
    });
  });
});
