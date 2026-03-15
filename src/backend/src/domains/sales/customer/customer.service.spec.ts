import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

describe('CustomerService', () => {
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let permissionService: jest.Mocked<PermissionService>;
  let service: CustomerService;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let cacheService: jest.Mocked<CacheService>;
  let secureCustomerRepo: jest.Mocked<SecureRepository<Customer>>;

  const mockUser: User = {
    id: 'user-123',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const createMockCustomer = (overrides?: Partial<Customer>): Customer => {
    return {
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '+84901234567',
      address: '123 Test St',
      status: 'active',
      creditLimit: 10000,
      currentBalance: 5000,
      tenantId: 'tenant-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as Customer;
  };

  beforeEach(async () => {
    const mockCustomerRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    };

    const mockPermissionService = {
      hasPermission: jest.fn().mockResolvedValue(true),
    };

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
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
    cacheService = module.get(CacheService);
    permissionService = module.get(PermissionService);

    secureCustomerRepo = (service as any).secureCustomerRepo;
    secureCustomerRepo.find = jest.fn();
    secureCustomerRepo.findOne = jest.fn();
    secureCustomerRepo.save = jest.fn();
    secureCustomerRepo.remove = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1' }),
        createMockCustomer({ id: 'customer-2' }),
        createMockCustomer({ id: 'customer-3' }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.findAll(mockUser, 1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should return empty array when no customers exist', async () => {
      secureCustomerRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      secureCustomerRepo.find.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return customer from cache if available', async () => {
      const mockCustomer = createMockCustomer();
      cacheService.getOrSet.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockUser, 'customer-1');

      expect(result).toEqual(mockCustomer);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      const mockCustomer = createMockCustomer();

      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureCustomerRepo.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockUser, 'customer-1');

      expect(result).toEqual(mockCustomer);
      expect(secureCustomerRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { id: 'customer-1' },
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      cacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return await fn();
      });
      secureCustomerRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUser, 'non-existent')).rejects.toThrow(
        'Customer with ID non-existent not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return customer by email', async () => {
      const mockCustomer = createMockCustomer({ email: 'test@example.com' });
      secureCustomerRepo.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findByEmail(mockUser, 'test@example.com');

      expect(result).toEqual(mockCustomer);
      expect(secureCustomerRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when email not found', async () => {
      secureCustomerRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail(mockUser, 'notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create customer successfully', async () => {
      const createDto: CreateCustomerDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+84901234567',
        address: '123 Test St',
      };

      secureCustomerRepo.findOne.mockResolvedValue(null);
      secureCustomerRepo.save.mockResolvedValue(createMockCustomer(createDto));

      const result = await service.create(mockUser, createDto);

      expect(result.name).toBe('New Customer');
      expect(result.email).toBe('new@example.com');
      expect(secureCustomerRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      const createDto: CreateCustomerDto = {
        name: 'Duplicate Customer',
        email: 'existing@example.com',
        phone: '+84901234567',
        address: '123 Test St',
      };

      secureCustomerRepo.findOne.mockResolvedValue(createMockCustomer());

      await expect(service.create(mockUser, createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockUser, createDto)).rejects.toThrow(
        'Customer with email existing@example.com already exists',
      );
    });

    it('should set default status to active', async () => {
      const createDto: CreateCustomerDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+84901234567',
        address: '123 Test St',
      };

      secureCustomerRepo.findOne.mockResolvedValue(null);
      secureCustomerRepo.save.mockImplementation(async (_user, customer) => {
        return { ...customer, id: 'customer-new' } as Customer;
      });

      await service.create(mockUser, createDto);

      expect(secureCustomerRepo.save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ status: 'active' }),
      );
    });

    it('should set default creditLimit and currentBalance to 0', async () => {
      const createDto: CreateCustomerDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '+84901234567',
        address: '123 Test St',
      };

      secureCustomerRepo.findOne.mockResolvedValue(null);
      secureCustomerRepo.save.mockImplementation(async (_user, customer) => {
        return { ...customer, id: 'customer-new' } as Customer;
      });

      await service.create(mockUser, createDto);

      expect(secureCustomerRepo.save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ creditLimit: 0, currentBalance: 0 }),
      );
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const mockCustomer = createMockCustomer();
      const updateDto: UpdateCustomerDto = {
        name: 'Updated Customer',
      };

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, ...updateDto });

      const result = await service.update(mockUser, 'customer-1', updateDto);

      expect(result.name).toBe('Updated Customer');
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should check email uniqueness when updating', async () => {
      const mockCustomer = createMockCustomer({ email: 'old@example.com' });
      const updateDto: UpdateCustomerDto = {
        email: 'new@example.com',
      };

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.findOne.mockResolvedValue(null);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, ...updateDto });

      await service.update(mockUser, 'customer-1', updateDto);

      expect(secureCustomerRepo.findOne).toHaveBeenCalledWith(mockUser, {
        where: { email: 'new@example.com' },
      });
    });

    it('should throw ConflictException when new email exists', async () => {
      const mockCustomer = createMockCustomer({ email: 'old@example.com' });
      const updateDto: UpdateCustomerDto = {
        email: 'existing@example.com',
      };

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.findOne.mockResolvedValue(createMockCustomer({ id: 'other-customer' }));

      await expect(service.update(mockUser, 'customer-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(mockUser, 'customer-1', updateDto)).rejects.toThrow(
        'Customer with email existing@example.com already exists',
      );
    });

    it('should allow updating same email', async () => {
      const mockCustomer = createMockCustomer({ email: 'same@example.com' });
      const updateDto: UpdateCustomerDto = {
        email: 'same@example.com',
        name: 'Updated Name',
      };

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, ...updateDto });

      const result = await service.update(mockUser, 'customer-1', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(secureCustomerRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove customer successfully', async () => {
      const mockCustomer = createMockCustomer();

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.remove.mockResolvedValue(undefined);

      await service.remove(mockUser, 'customer-1');

      expect(secureCustomerRepo.remove).toHaveBeenCalledWith(mockUser, mockCustomer);
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance successfully', async () => {
      const mockCustomer = createMockCustomer({ currentBalance: 5000 });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, currentBalance: 7000 });

      const result = await service.updateBalance(mockUser, 'customer-1', 2000);

      expect(result.currentBalance).toBe(7000);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should handle negative balance updates', async () => {
      const mockCustomer = createMockCustomer({ currentBalance: 5000 });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, currentBalance: 3000 });

      const result = await service.updateBalance(mockUser, 'customer-1', -2000);

      expect(result.currentBalance).toBe(3000);
    });

    it('should convert string balance to number', async () => {
      const mockCustomer = createMockCustomer({ currentBalance: '5000' as any });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockImplementation(async (_user, customer) => {
        return customer as Customer;
      });

      await service.updateBalance(mockUser, 'customer-1', 2000);

      expect(secureCustomerRepo.save).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ currentBalance: 7000 }),
      );
    });
  });

  describe('updateCreditLimit', () => {
    it('should update credit limit successfully', async () => {
      const mockCustomer = createMockCustomer({ creditLimit: 10000 });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, creditLimit: 20000 });

      const result = await service.updateCreditLimit(mockUser, 'customer-1', 20000);

      expect(result.creditLimit).toBe(20000);
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should throw BadRequestException when credit limit is negative', async () => {
      await expect(service.updateCreditLimit(mockUser, 'customer-1', -1000)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateCreditLimit(mockUser, 'customer-1', -1000)).rejects.toThrow(
        'Credit limit cannot be negative',
      );
    });

    it('should allow zero credit limit', async () => {
      const mockCustomer = createMockCustomer({ creditLimit: 10000 });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, creditLimit: 0 });

      const result = await service.updateCreditLimit(mockUser, 'customer-1', 0);

      expect(result.creditLimit).toBe(0);
    });
  });

  describe('activate', () => {
    it('should activate customer successfully', async () => {
      const mockCustomer = createMockCustomer({ status: 'inactive' });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, status: 'active' });

      const result = await service.activate(mockUser, 'customer-1');

      expect(result.status).toBe('active');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate customer successfully', async () => {
      const mockCustomer = createMockCustomer({ status: 'active' });

      cacheService.getOrSet.mockResolvedValue(mockCustomer);
      secureCustomerRepo.save.mockResolvedValue({ ...mockCustomer, status: 'inactive' });

      const result = await service.deactivate(mockUser, 'customer-1');

      expect(result.status).toBe('inactive');
      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search customers by name', async () => {
      const mockCustomers = [
        createMockCustomer({ name: 'John Doe', email: 'john@example.com' }),
        createMockCustomer({ name: 'Jane Smith', email: 'jane@example.com' }),
        createMockCustomer({ name: 'Bob Johnson', email: 'bob@example.com' }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, 'john');

      expect(result).toHaveLength(2);
      expect(result[0].name).toContain('John');
    });

    it('should search customers by email', async () => {
      const mockCustomers = [
        createMockCustomer({ name: 'John Doe', email: 'john@example.com' }),
        createMockCustomer({ name: 'Jane Smith', email: 'jane@example.com' }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, 'jane@example');

      expect(result).toHaveLength(1);
      expect(result[0].email).toContain('jane@example');
    });

    it('should search customers by phone', async () => {
      const mockCustomers = [
        createMockCustomer({ name: 'John Doe', phone: '+84901234567' }),
        createMockCustomer({ name: 'Jane Smith', phone: '+84907654321' }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, '901234');

      expect(result).toHaveLength(1);
      expect(result[0].phone).toContain('901234');
    });

    it('should return empty array when no matches found', async () => {
      const mockCustomers = [createMockCustomer({ name: 'John Doe' })];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should be case insensitive', async () => {
      const mockCustomers = [createMockCustomer({ name: 'John Doe' })];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.search(mockUser, 'JOHN');

      expect(result).toHaveLength(1);
    });
  });

  describe('findByStatus', () => {
    it('should return customers by status', async () => {
      const mockCustomers = [
        createMockCustomer({ status: 'active' }),
        createMockCustomer({ status: 'active' }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.findByStatus(mockUser, 'active');

      expect(result).toHaveLength(2);
      expect(secureCustomerRepo.find).toHaveBeenCalledWith(mockUser, {
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('count', () => {
    it('should return customer count', async () => {
      const mockCustomers = [createMockCustomer(), createMockCustomer(), createMockCustomer()];
      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.count(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 when no customers exist', async () => {
      secureCustomerRepo.find.mockResolvedValue([]);

      const result = await service.count(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1', currentBalance: 5000 }),
        createMockCustomer({ id: 'customer-2', currentBalance: 10000 }),
        createMockCustomer({ id: 'customer-3', currentBalance: 3000 }),
        createMockCustomer({ id: 'customer-4', currentBalance: 8000 }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getTopCustomers(mockUser, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('customer-2');
      expect(result[0].currentBalance).toBe(10000);
      expect(result[1].id).toBe('customer-4');
      expect(result[1].currentBalance).toBe(8000);
    });

    it('should handle string balance values', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1', currentBalance: '5000' as any }),
        createMockCustomer({ id: 'customer-2', currentBalance: '10000' as any }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getTopCustomers(mockUser, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('customer-2');
    });

    it('should return empty array when no customers exist', async () => {
      secureCustomerRepo.find.mockResolvedValue([]);

      const result = await service.getTopCustomers(mockUser, 5);

      expect(result).toEqual([]);
    });
  });

  describe('getCustomersWithHighBalance', () => {
    it('should return customers with balance above threshold', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1', currentBalance: 5000 }),
        createMockCustomer({ id: 'customer-2', currentBalance: 10000 }),
        createMockCustomer({ id: 'customer-3', currentBalance: 3000 }),
        createMockCustomer({ id: 'customer-4', currentBalance: 8000 }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(mockUser, 7000);

      expect(result).toHaveLength(2);
      expect(result[0].currentBalance).toBeGreaterThanOrEqual(7000);
      expect(result[1].currentBalance).toBeGreaterThanOrEqual(7000);
    });

    it('should sort by balance descending', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1', currentBalance: 8000 }),
        createMockCustomer({ id: 'customer-2', currentBalance: 10000 }),
        createMockCustomer({ id: 'customer-3', currentBalance: 9000 }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(mockUser, 5000);

      expect(result[0].currentBalance).toBe(10000);
      expect(result[1].currentBalance).toBe(9000);
      expect(result[2].currentBalance).toBe(8000);
    });

    it('should handle string balance values', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-1', currentBalance: '8000' as any }),
        createMockCustomer({ id: 'customer-2', currentBalance: '10000' as any }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(mockUser, 7000);

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no customers meet threshold', async () => {
      const mockCustomers = [
        createMockCustomer({ currentBalance: 1000 }),
        createMockCustomer({ currentBalance: 2000 }),
      ];

      secureCustomerRepo.find.mockResolvedValue(mockCustomers);

      const result = await service.getCustomersWithHighBalance(mockUser, 10000);

      expect(result).toEqual([]);
    });
  });
});
