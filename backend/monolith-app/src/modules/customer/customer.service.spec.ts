import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@/common/cache/cache.service';

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
    count: jest.fn(),
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

      const result = await service.findAll('tenant-1', 1, 20);

      expect(result.data).toEqual(mockCustomers);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find customer by id', async () => {
      const mockCustomer = { id: '1', email: 'customer@test.com' };
      mockCacheService.getOrSet.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(mockCustomer);
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find customer by email', async () => {
      const mockCustomer = { id: '1', email: 'customer@test.com' };
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail('customer@test.com', 'tenant-1');

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('create', () => {
    it('should create customer', async () => {
      const customerData = { email: 'new@customer.com', name: 'New Customer' };
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customerData);
      mockCustomerRepository.save.mockResolvedValue(customerData);

      const result = await service.create(customerData as any, 'tenant-1');

      expect(result).toEqual(customerData);
    });

    it('should throw ConflictException if email exists', async () => {
      const customerData = { email: 'existing@customer.com' };
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(customerData as any, 'tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
