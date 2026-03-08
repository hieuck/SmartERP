import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService } from '@/common/security/permission.service';
import { createMockUser } from '@/common/test/test-helpers';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockCustomerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    => mockQueryBuilder)
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
    invalidateEntity: jest.fn()
  };

  const mockPermissionService = {
    checkPermission: jest.fn().mockResolvedValue(true),
    hasPermission: jest.fn().mockReturnValue(true),
    buildSecureQuery: jest.fn((user, where) => where),
    canRead: jest.fn().mockReturnValue(true),
    canWrite: jest.fn().mockReturnValue(true),
    canDelete: jest.fn().mockReturnValue(true)
  };

  const mockUser = createMockUser();

  const mockCustomer = {
    id: '1',
    email: 'customer@test.com',
    name: 'Test Customer',
    tenantId: 'tenant-1',
    status: 'active',
    creditLimit: 1000,
    currentBalance: 1500
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository
  },
        {
          provide: CacheService,
          useValue: mockCacheService
  },
        {
          provide: PermissionService,
          useValue: mockPermissionService
  },
      ]
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
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

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

      const result = await service.findOne(mockUser, '1');

      expect(result).toEqual(mockCustomer);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find customer by email', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail(mockUser, 'customer@test.com');

      expect(result).toEqual(mockCustomer);
    });

    it('should return null if customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(mockUser, 'notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create customer', async () => {
      const customerData = { email: 'new@customer.com', name: 'New Customer' };
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customerData);
      mockCustomerRepository.save.mockResolvedValue(customerData);

      const result = await service.create(mockUser, customerData as any);

      expect(result).toEqual(customerData);
    });

    it('should throw ConflictException if email exists', async () => {
      const customerData = { email: 'existing@customer.com' };
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(mockUser, customerData as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const updateData = { name: 'Updated Customer' };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, ...updateData });

      const result = await service.update(mockUser, '1', updateData);

      expect(result.name).toBe('Updated Customer');
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email exists', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.findOne.mockResolvedValue({ id: '2', email: 'other@test.com' });

      await expect(service.update(mockUser, '1', { email: 'other@test.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.remove.mockResolvedValue(mockCustomer);

      await service.remove(mockUser, '1');

      expect(mockCustomerRepository.remove).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, currentBalance: 600 });

      const result = await service.updateBalance(mockUser, '1', 100);

      expect(result.currentBalance).toBe(600);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update credit limit', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, creditLimit: 2000 });

      const result = await service.updateCreditLimit(mockUser, '1', 2000);

      expect(result.creditLimit).toBe(2000);
    });

    it('should throw BadRequestException if credit limit is negative', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);

      await expect(service.updateCreditLimit(mockUser, '1', -100)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activate', () => {
    it('should activate customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, status: 'active' });

      const result = await service.activate(mockUser, '1');

      expect(result.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should deactivate customer', async () => {
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue({ ...mockCustomer, status: 'inactive' });

      const result = await service.deactivate(mockUser, '1');

      expect(result.status).toBe('inactive');
    });
  });

  describe('search', () => {
    it('should search customers by query', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, 'test');

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('findByStatus', () => {
    it('should find customers by status', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('count', () => {
    it('should return customer count', async () => {
      const mockCustomers = Array(10).fill(mockCustomer);
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.count(mockUser);

      expect(result).toBe(10);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.getTopCustomers(mockUser, 5);

      expect(result).toEqual(mockCustomers);
    });
  });

  describe('getCustomersWithHighBalance', () => {
    it('should return customers with high balance', async () => {
      const mockCustomers = [mockCustomer];
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(mockUser, 1000);

      expect(result).toEqual(mockCustomers);
    });
  });
});
