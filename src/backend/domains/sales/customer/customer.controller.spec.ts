import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { createMockUser } from '@/common/test/test-helpers';

describe('CustomerController', () => {
  let controller: CustomerController;
  let service: jest.Mocked<CustomerService>;

  const mockCustomerService = {
    findAll: jest.fn(),
    search: jest.fn(),
    findByStatus: jest.fn(),
    getTopCustomers: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateBalance: jest.fn(),
    updateCreditLimit: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = createMockUser();

  const mockTenantId = 'tenant-123';
  const mockCustomer = {
    id: 'customer-1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test St',
    currentBalance: 1000,
    creditLimit: 5000,
    status: 'active',
    tenantId: mockTenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    service = module.get(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all customers for tenant', async () => {
      const customers = [mockCustomer];
      const response = {
        data: customers,
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      service.findAll.mockResolvedValue(response);

      const result = await controller.findAll(mockTenantId);

      expect(result).toEqual(response);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('search', () => {
    it('should search customers by query', async () => {
      const query = 'test';
      const customers = [mockCustomer];
      service.search.mockResolvedValue(customers);

      const result = await controller.search(query, mockTenantId);

      expect(result).toEqual(customers);
      expect(service.search).toHaveBeenCalledWith(query, mockTenantId);
    });
  });

  describe('findByStatus', () => {
    it('should return customers by status', async () => {
      const status = 'active';
      const customers = [mockCustomer];
      service.findByStatus.mockResolvedValue(customers);

      const result = await controller.findByStatus(status, mockTenantId);

      expect(result).toEqual(customers);
      expect(service.findByStatus).toHaveBeenCalledWith(status, mockTenantId);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const limit = 10;
      const customers = [mockCustomer];
      service.getTopCustomers.mockResolvedValue(customers);

      const result = await controller.getTopCustomers(limit, mockTenantId);

      expect(result).toEqual(customers);
      expect(service.getTopCustomers).toHaveBeenCalledWith(limit, mockTenantId);
    });
  });

  describe('count', () => {
    it('should return customer count', async () => {
      const count = 42;
      service.count.mockResolvedValue(count);

      const result = await controller.count(mockTenantId);

      expect(result).toEqual(count);
      expect(service.count).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('findOne', () => {
    it('should return customer by id', async () => {
      service.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne(mockCustomer.id, mockTenantId);

      expect(result).toEqual(mockCustomer);
      expect(service.findOne).toHaveBeenCalledWith(mockCustomer.id, mockTenantId);
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createDto: CreateCustomerDto = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '9876543210',
        address: '456 New St',
      };
      service.create.mockResolvedValue(mockCustomer);

      const result = await controller.create(createDto, mockTenantId);

      expect(result).toEqual(mockCustomer);
      expect(service.create).toHaveBeenCalledWith(createDto, mockTenantId);
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const updateDto: UpdateCustomerDto = {
        name: 'Updated Customer',
      };
      const updatedCustomer = { ...mockCustomer, ...updateDto };
      service.update.mockResolvedValue(updatedCustomer);

      const result = await controller.update(mockCustomer.id, updateDto, mockTenantId);

      expect(result).toEqual(updatedCustomer);
      expect(service.update).toHaveBeenCalledWith(mockCustomer.id, updateDto, mockTenantId);
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance', async () => {
      const amount = 500;
      const updatedCustomer = { ...mockCustomer, currentBalance: mockCustomer.currentBalance + amount };
      service.updateBalance.mockResolvedValue(updatedCustomer);

      const result = await controller.updateBalance(mockCustomer.id, amount, mockTenantId);

      expect(result).toEqual(updatedCustomer);
      expect(service.updateBalance).toHaveBeenCalledWith(mockCustomer.id, amount, mockTenantId);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update customer credit limit', async () => {
      const creditLimit = 10000;
      const updatedCustomer = { ...mockCustomer, creditLimit };
      service.updateCreditLimit.mockResolvedValue(updatedCustomer);

      const result = await controller.updateCreditLimit(mockCustomer.id, creditLimit, mockTenantId);

      expect(result).toEqual(updatedCustomer);
      expect(service.updateCreditLimit).toHaveBeenCalledWith(mockCustomer.id, creditLimit, mockTenantId);
    });
  });

  describe('activate', () => {
    it('should activate customer', async () => {
      const activatedCustomer = { ...mockCustomer, status: 'active' };
      service.activate.mockResolvedValue(activatedCustomer);

      const result = await controller.activate(mockCustomer.id, mockTenantId);

      expect(result).toEqual(activatedCustomer);
      expect(service.activate).toHaveBeenCalledWith(mockCustomer.id, mockTenantId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate customer', async () => {
      const deactivatedCustomer = { ...mockCustomer, status: 'inactive' };
      service.deactivate.mockResolvedValue(deactivatedCustomer);

      const result = await controller.deactivate(mockCustomer.id, mockTenantId);

      expect(result).toEqual(deactivatedCustomer);
      expect(service.deactivate).toHaveBeenCalledWith(mockCustomer.id, mockTenantId);
    });
  });

  describe('remove', () => {
    it('should delete customer', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockCustomer.id, mockTenantId);

      expect(result).toEqual({ message: 'Customer deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockCustomer.id, mockTenantId);
    });
  });
});
