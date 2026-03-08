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

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(response);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('search', () => {
    it('should search customers by query', async () => {
      const query = 'test';
      const customers = [mockCustomer];
      service.search.mockResolvedValue(customers);

      const result = await controller.search(mockUser, query);

      expect(result).toEqual(customers);
      expect(service.search).toHaveBeenCalledWith(mockUser, query);
    });
  });

  describe('findByStatus', () => {
    it('should return customers by status', async () => {
      const status = 'active';
      const customers = [mockCustomer];
      service.findByStatus.mockResolvedValue(customers);

      const result = await controller.findByStatus(mockUser, status);

      expect(result).toEqual(customers);
      expect(service.findByStatus).toHaveBeenCalledWith(mockUser, status);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by balance', async () => {
      const limit = 10;
      const customers = [mockCustomer];
      service.getTopCustomers.mockResolvedValue(customers);

      const result = await controller.getTopCustomers(mockUser, limit);

      expect(result).toEqual(customers);
      expect(service.getTopCustomers).toHaveBeenCalledWith(mockUser, limit);
    });
  });

  describe('count', () => {
    it('should return customer count', async () => {
      const count = 42;
      service.count.mockResolvedValue(count);

      const result = await controller.count(mockUser);

      expect(result).toEqual(count);
      expect(service.count).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return customer by id', async () => {
      service.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne(mockUser, mockCustomer.id);

      expect(result).toEqual(mockCustomer);
      expect(service.findOne).toHaveBeenCalledWith(mockUser, mockCustomer.id);
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

      const result = await controller.create(mockUser, createDto);

      expect(result).toEqual(mockCustomer);
      expect(service.create).toHaveBeenCalledWith(mockUser, createDto);
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const updateDto: UpdateCustomerDto = {
        name: 'Updated Customer',
      };
      const updatedCustomer = { ...mockCustomer, ...updateDto };
      service.update.mockResolvedValue(updatedCustomer);

      const result = await controller.update(mockCustomer.id, mockUser, updateDto);

      expect(result).toEqual(updatedCustomer);
      expect(service.update).toHaveBeenCalledWith(mockUser, mockCustomer.id, updateDto);
    });
  });

  describe('updateBalance', () => {
    it('should update customer balance', async () => {
      const amount = 500;
      const updatedCustomer = { ...mockCustomer, currentBalance: mockCustomer.currentBalance + amount };
      service.updateBalance.mockResolvedValue(updatedCustomer);

      const result = await controller.updateBalance(mockCustomer.id, mockUser, amount);

      expect(result).toEqual(updatedCustomer);
      expect(service.updateBalance).toHaveBeenCalledWith(mockUser, mockCustomer.id, amount);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update customer credit limit', async () => {
      const creditLimit = 10000;
      const updatedCustomer = { ...mockCustomer, creditLimit };
      service.updateCreditLimit.mockResolvedValue(updatedCustomer);

      const result = await controller.updateCreditLimit(mockCustomer.id, mockUser, creditLimit);

      expect(result).toEqual(updatedCustomer);
      expect(service.updateCreditLimit).toHaveBeenCalledWith(mockUser, mockCustomer.id, creditLimit);
    });
  });

  describe('activate', () => {
    it('should activate customer', async () => {
      const activatedCustomer = { ...mockCustomer, status: 'active' };
      service.activate.mockResolvedValue(activatedCustomer);

      const result = await controller.activate(mockUser, mockCustomer.id);

      expect(result).toEqual(activatedCustomer);
      expect(service.activate).toHaveBeenCalledWith(mockUser, mockCustomer.id);
    });
  });

  describe('deactivate', () => {
    it('should deactivate customer', async () => {
      const deactivatedCustomer = { ...mockCustomer, status: 'inactive' };
      service.deactivate.mockResolvedValue(deactivatedCustomer);

      const result = await controller.deactivate(mockUser, mockCustomer.id);

      expect(result).toEqual(deactivatedCustomer);
      expect(service.deactivate).toHaveBeenCalledWith(mockUser, mockCustomer.id);
    });
  });

  describe('remove', () => {
    it('should delete customer', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, mockCustomer.id);

      expect(result).toEqual({ message: 'Customer deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockUser, mockCustomer.id);
    });
  });
});
