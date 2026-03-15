/**
 * CustomerController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. GET /customers - Get all customers
 * 2. GET /customers/search - Search customers
 * 3. GET /customers/status/:status - Get customers by status
 * 4. GET /customers/top/:limit - Get top customers by balance
 * 5. GET /customers/count - Get customer count
 * 6. GET /customers/:id - Get customer by ID
 * 7. POST /customers - Create customer
 * 8. PATCH /customers/:id - Update customer
 * 9. PATCH /customers/:id/balance - Update customer balance
 * 10. PATCH /customers/:id/credit-limit - Update customer credit limit
 * 11. PATCH /customers/:id/activate - Activate customer
 * 12. PATCH /customers/:id/deactivate - Deactivate customer
 * 13. DELETE /customers/:id - Delete customer
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { SyncStatus } from '../../../common/enums/sync-status.enum';

describe('CustomerController (Integration)', () => {
  let app: INestApplication;
  let customerService: jest.Mocked<CustomerService>;

  const mockUser = {
    id: 'user-123',
    email: 'sales@example.com',
    tenantId: 'tenant-123',
    roles: ['sales'],
  };

  const mockCustomer = {
    id: 'customer-123',
    name: 'ABC Company',
    email: 'contact@abc.com',
    phone: '+84901234567',
    address: '123 Main St',
    status: 'active',
    balance: 10000,
    currentBalance: 10000,
    creditLimit: 50000,
    tenantId: 'tenant-123',
    version: 1,
    syncStatus: SyncStatus.SYNCED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
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

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.tenantId) {
          return true;
        }
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    customerService = moduleFixture.get(CustomerService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /customers', () => {
    it('should return all customers', async () => {
      const paginatedResponse = {
        data: [mockCustomer],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      customerService.findAll.mockResolvedValue(paginatedResponse) as any;

      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(paginatedResponse);
      expect(customerService.findAll).toHaveBeenCalledWith(mockUser, 1, 20);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .expect(401);
    });

    it('should require tenant context', async () => {
      const mockJwtAuthGuardNoTenant = {
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { ...mockUser, tenantId: undefined };
          return true;
        }),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [CustomerController],
        providers: [{ provide: CustomerService, useValue: customerService }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuardNoTenant)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      await testApp.close();
    });

    it('should return empty array when no customers', async () => {
      const emptyResponse = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      customerService.findAll.mockResolvedValue(emptyResponse) as any;

      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(emptyResponse);
    });
  });

  describe('GET /customers/search', () => {
    it('should search customers by query', async () => {
      const customers = [mockCustomer];
      customerService.search.mockResolvedValue(customers as any) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/search?q=ABC')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(customers);
      expect(customerService.search).toHaveBeenCalledWith(mockUser, 'ABC');
    });

    it('should return empty array when no matches', async () => {
      customerService.search.mockResolvedValue([]) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/search?q=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle empty query parameter', async () => {
      customerService.search.mockResolvedValue([mockCustomer]) as any;

      await request(app.getHttpServer())
        .get('/customers/search?q=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(customerService.search).toHaveBeenCalledWith(mockUser, '');
    });

    it('should handle missing query parameter', async () => {
      customerService.search.mockResolvedValue([mockCustomer]) as any;

      await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(customerService.search).toHaveBeenCalledWith(mockUser, undefined);
    });
  });

  describe('GET /customers/status/:status', () => {
    it('should return customers by status', async () => {
      const customers = [mockCustomer];
      customerService.findByStatus.mockResolvedValue(customers) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/status/active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(customers);
      expect(customerService.findByStatus).toHaveBeenCalledWith(mockUser, 'active');
    });

    it('should handle inactive status', async () => {
      customerService.findByStatus.mockResolvedValue([]) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/status/inactive')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(customerService.findByStatus).toHaveBeenCalledWith(mockUser, 'inactive');
    });

    it('should handle invalid status', async () => {
      customerService.findByStatus.mockResolvedValue([]) as any;

      await request(app.getHttpServer())
        .get('/customers/status/invalid')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /customers/top/:limit', () => {
    it('should return top customers by balance', async () => {
      const topCustomers = [mockCustomer];
      customerService.getTopCustomers.mockResolvedValue(topCustomers) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/top/10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(topCustomers);
      expect(customerService.getTopCustomers).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should handle limit as string and convert to number', async () => {
      customerService.getTopCustomers.mockResolvedValue([mockCustomer]) as any;

      await request(app.getHttpServer())
        .get('/customers/top/5')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(customerService.getTopCustomers).toHaveBeenCalledWith(mockUser, 5);
    });

    it('should handle zero limit', async () => {
      customerService.getTopCustomers.mockResolvedValue([]) as any;

      await request(app.getHttpServer())
        .get('/customers/top/0')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle negative limit', async () => {
      customerService.getTopCustomers.mockResolvedValue([]) as any;

      await request(app.getHttpServer())
        .get('/customers/top/-1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /customers/count', () => {
    it('should return customer count', async () => {
      customerService.count.mockResolvedValue(25) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(25);
      expect(customerService.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no customers', async () => {
      customerService.count.mockResolvedValue(0) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /customers/:id', () => {
    it('should return customer by ID', async () => {
      customerService.findOne.mockResolvedValue(mockCustomer as any) as any;

      const response = await request(app.getHttpServer())
        .get('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockCustomer);
      expect(customerService.findOne).toHaveBeenCalledWith(mockUser, 'customer-123');
    });

    it('should return 404 when customer not found', async () => {
      customerService.findOne.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/customers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 403 when accessing customer from different tenant', async () => {
      customerService.findOne.mockRejectedValue(
        new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      );

      await request(app.getHttpServer())
        .get('/customers/other-tenant-customer')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });

  describe('POST /customers', () => {
    it('should create customer successfully', async () => {
      const createDto = {
        name: 'New Customer',
        email: 'new@customer.com',
        phone: '+84901234567',
        address: '456 New St',
      };

      customerService.create.mockResolvedValue({
        ...mockCustomer,
        ...createDto,
      }) as any;

      const response = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('New Customer');
      expect(customerService.create).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should return 409 when customer email already exists', async () => {
      const createDto = {
        name: 'Duplicate Customer',
        email: 'existing@customer.com',
        phone: '+84901234567',
      };

      customerService.create.mockRejectedValue(
        new HttpException('Customer with this email already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test Customer',
          email: 'invalid-email',
          phone: '+84901234567',
        })
        .expect(400);
    });

    it('should handle optional fields', async () => {
      const createDto = {
        name: 'Minimal Customer',
        email: 'minimal@customer.com',
      };

      customerService.create.mockResolvedValue({
        ...mockCustomer,
        ...createDto,
      }) as any;

      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('should update customer successfully', async () => {
      const updateDto = {
        name: 'Updated Customer',
        phone: '+84909999999',
      };

      const updatedCustomer = { ...mockCustomer, ...updateDto };
      customerService.update.mockResolvedValue(updatedCustomer) as any;

      const response = await request(app.getHttpServer())
        .patch('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Customer');
      expect(customerService.update).toHaveBeenCalledWith(mockUser, 'customer-123', updateDto);
    });

    it('should return 404 when customer not found', async () => {
      customerService.update.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/customers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 409 when new email conflicts', async () => {
      customerService.update.mockRejectedValue(
        new HttpException('Customer with this email already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'existing@customer.com' })
        .expect(409);
    });

    it('should allow partial updates', async () => {
      const updateDto = { phone: '+84909999999' };
      customerService.update.mockResolvedValue({ ...mockCustomer, ...updateDto }) as any;

      await request(app.getHttpServer())
        .patch('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);
    });
  });

  describe('PATCH /customers/:id/balance', () => {
    it('should update customer balance successfully', async () => {
      const updatedCustomer = { ...mockCustomer, balance: 15000 };
      customerService.updateBalance.mockResolvedValue(updatedCustomer) as any;

      const response = await request(app.getHttpServer())
        .patch('/customers/customer-123/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 5000 })
        .expect(200);

      expect(response.body.balance).toBe(15000);
      expect(customerService.updateBalance).toHaveBeenCalledWith(mockUser, 'customer-123', 5000);
    });

    it('should handle negative balance adjustment', async () => {
      const updatedCustomer = { ...mockCustomer, balance: 5000 };
      customerService.updateBalance.mockResolvedValue(updatedCustomer) as any;

      await request(app.getHttpServer())
        .patch('/customers/customer-123/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: -5000 })
        .expect(200);
    });

    it('should return 404 when customer not found', async () => {
      customerService.updateBalance.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/customers/non-existent/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 1000 })
        .expect(404);
    });

    it('should return 400 when amount exceeds credit limit', async () => {
      customerService.updateBalance.mockRejectedValue(
        new HttpException('Balance would exceed credit limit', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/customers/customer-123/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 100000 })
        .expect(400);
    });
  });

  describe('PATCH /customers/:id/credit-limit', () => {
    it('should update customer credit limit successfully', async () => {
      const updatedCustomer = { ...mockCustomer, creditLimit: 100000 };
      customerService.updateCreditLimit.mockResolvedValue(updatedCustomer) as any;

      const response = await request(app.getHttpServer())
        .patch('/customers/customer-123/credit-limit')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditLimit: 100000 })
        .expect(200);

      expect(response.body.creditLimit).toBe(100000);
      expect(customerService.updateCreditLimit).toHaveBeenCalledWith(mockUser, 'customer-123', 100000);
    });

    it('should return 404 when customer not found', async () => {
      customerService.updateCreditLimit.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/customers/non-existent/credit-limit')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditLimit: 50000 })
        .expect(404);
    });

    it('should return 400 when credit limit is negative', async () => {
      customerService.updateCreditLimit.mockRejectedValue(
        new HttpException('Credit limit must be positive', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/customers/customer-123/credit-limit')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditLimit: -1000 })
        .expect(400);
    });

    it('should handle zero credit limit', async () => {
      const updatedCustomer = { ...mockCustomer, creditLimit: 0 };
      customerService.updateCreditLimit.mockResolvedValue(updatedCustomer) as any;

      await request(app.getHttpServer())
        .patch('/customers/customer-123/credit-limit')
        .set('Authorization', 'Bearer valid-token')
        .send({ creditLimit: 0 })
        .expect(200);
    });
  });

  describe('PATCH /customers/:id/activate', () => {
    it('should activate customer successfully', async () => {
      const activatedCustomer = { ...mockCustomer, status: 'active' };
      customerService.activate.mockResolvedValue(activatedCustomer) as any;

      const response = await request(app.getHttpServer())
        .patch('/customers/customer-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(customerService.activate).toHaveBeenCalledWith(mockUser, 'customer-123');
    });

    it('should return 404 when customer not found', async () => {
      customerService.activate.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/customers/non-existent/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should handle already active customer', async () => {
      customerService.activate.mockResolvedValue(mockCustomer) as any;

      await request(app.getHttpServer())
        .patch('/customers/customer-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('PATCH /customers/:id/deactivate', () => {
    it('should deactivate customer successfully', async () => {
      const deactivatedCustomer = { ...mockCustomer, status: 'inactive' };
      customerService.deactivate.mockResolvedValue(deactivatedCustomer) as any;

      const response = await request(app.getHttpServer())
        .patch('/customers/customer-123/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('inactive');
      expect(customerService.deactivate).toHaveBeenCalledWith(mockUser, 'customer-123');
    });

    it('should return 404 when customer not found', async () => {
      customerService.deactivate.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/customers/non-existent/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when customer has outstanding balance', async () => {
      customerService.deactivate.mockRejectedValue(
        new HttpException('Cannot deactivate customer with outstanding balance', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/customers/customer-123/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should delete customer successfully', async () => {
      customerService.remove.mockResolvedValue(undefined) as any;

      const response = await request(app.getHttpServer())
        .delete('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Customer deleted successfully');
      expect(customerService.remove).toHaveBeenCalledWith(mockUser, 'customer-123');
    });

    it('should return 404 when customer not found', async () => {
      customerService.remove.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/customers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when customer has active orders', async () => {
      customerService.remove.mockRejectedValue(
        new HttpException('Cannot delete customer with active orders', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 when customer has outstanding balance', async () => {
      customerService.remove.mockRejectedValue(
        new HttpException('Cannot delete customer with outstanding balance', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/customers/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });
});

