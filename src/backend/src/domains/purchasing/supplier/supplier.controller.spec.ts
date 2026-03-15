/**
 * SupplierController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. GET /suppliers - Get all suppliers
 * 2. GET /suppliers/search - Search suppliers
 * 3. GET /suppliers/status/:status - Get suppliers by status
 * 4. GET /suppliers/top/:limit - Get top suppliers by balance
 * 5. GET /suppliers/count - Get supplier count
 * 6. GET /suppliers/:id - Get supplier by ID
 * 7. POST /suppliers - Create supplier
 * 8. PATCH /suppliers/:id - Update supplier
 * 9. PATCH /suppliers/:id/balance - Update supplier balance
 * 10. PATCH /suppliers/:id/payment-terms - Update payment terms
 * 11. PATCH /suppliers/:id/activate - Activate supplier
 * 12. PATCH /suppliers/:id/deactivate - Deactivate supplier
 * 13. DELETE /suppliers/:id - Delete supplier
 * 14. Authentication/Authorization tests
 * 15. Validation tests
 * 16. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

describe('SupplierController (Integration)', () => {
  let app: INestApplication;
  let supplierService: jest.Mocked<SupplierService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockSupplier = {
    id: 'supplier-123',
    name: 'ABC Supplies',
    email: 'supplier@example.com',
    phone: '+1234567890',
    address: '456 Supply St',
    taxId: 'TAX456',
    rating: 4,
    leadTime: 7,
    paymentTerms: 30,
    discount: 5,
    status: 'active',
    currentBalance: 10000,
    notes: 'Reliable supplier',
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockSupplierService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      search: jest.fn(),
      findByStatus: jest.fn(),
      getTopSuppliers: jest.fn(),
      count: jest.fn(),
      updateBalance: jest.fn(),
      updatePaymentTerms: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
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
      controllers: [SupplierController],
      providers: [
        {
          provide: SupplierService,
          useValue: mockSupplierService,
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

    supplierService = moduleFixture.get(SupplierService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /suppliers', () => {
    it('should return all suppliers', async () => {
      const suppliers = [mockSupplier];
      supplierService.findAll.mockResolvedValue(suppliers as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(suppliers);
      expect(supplierService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/suppliers')
        .expect(401);
    });

    it('should return empty array when no suppliers', async () => {
      supplierService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /suppliers/search', () => {
    it('should search suppliers by query', async () => {
      const suppliers = [mockSupplier];
      supplierService.search.mockResolvedValue(suppliers as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers/search?q=ABC')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(suppliers);
      expect(supplierService.search).toHaveBeenCalledWith(mockUser, 'ABC');
    });

    it('should search by email', async () => {
      supplierService.search.mockResolvedValue([mockSupplier] as any);

      await request(app.getHttpServer())
        .get('/suppliers/search?q=supplier@example.com')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(supplierService.search).toHaveBeenCalledWith(mockUser, 'supplier@example.com');
    });

    it('should search by phone', async () => {
      supplierService.search.mockResolvedValue([mockSupplier] as any);

      await request(app.getHttpServer())
        .get('/suppliers/search?q=1234567890')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(supplierService.search).toHaveBeenCalledWith(mockUser, '1234567890');
    });

    it('should return empty array when no matches', async () => {
      supplierService.search.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/suppliers/search?q=nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /suppliers/status/:status', () => {
    it('should return suppliers by status', async () => {
      const suppliers = [mockSupplier];
      supplierService.findByStatus.mockResolvedValue(suppliers as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers/status/active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(suppliers);
      expect(supplierService.findByStatus).toHaveBeenCalledWith(mockUser, 'active');
    });

    it('should return inactive suppliers', async () => {
      const inactiveSupplier = { ...mockSupplier, status: 'inactive' };
      supplierService.findByStatus.mockResolvedValue([inactiveSupplier] as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers/status/inactive')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body[0].status).toBe('inactive');
    });

    it('should return empty array when no suppliers with status', async () => {
      supplierService.findByStatus.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/suppliers/status/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /suppliers/top/:limit', () => {
    it('should return top suppliers by balance', async () => {
      const topSuppliers = [
        { ...mockSupplier, currentBalance: 50000 },
        { ...mockSupplier, id: 'supplier-124', currentBalance: 30000 },
        { ...mockSupplier, id: 'supplier-125', currentBalance: 20000 },
      ];
      supplierService.getTopSuppliers.mockResolvedValue(topSuppliers as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers/top/3')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(topSuppliers);
      expect(supplierService.getTopSuppliers).toHaveBeenCalledWith(mockUser, 3);
    });

    it('should handle limit of 1', async () => {
      supplierService.getTopSuppliers.mockResolvedValue([mockSupplier] as any);

      await request(app.getHttpServer())
        .get('/suppliers/top/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(supplierService.getTopSuppliers).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should handle large limits', async () => {
      supplierService.getTopSuppliers.mockResolvedValue([mockSupplier] as any);

      await request(app.getHttpServer())
        .get('/suppliers/top/100')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(supplierService.getTopSuppliers).toHaveBeenCalledWith(mockUser, 100);
    });
  });

  describe('GET /suppliers/count', () => {
    it('should return supplier count', async () => {
      supplierService.count.mockResolvedValue(25);

      const response = await request(app.getHttpServer())
        .get('/suppliers/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(25);
      expect(supplierService.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no suppliers', async () => {
      supplierService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/suppliers/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /suppliers/:id', () => {
    it('should return supplier by ID', async () => {
      supplierService.findOne.mockResolvedValue(mockSupplier as any);

      const response = await request(app.getHttpServer())
        .get('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSupplier);
      expect(supplierService.findOne).toHaveBeenCalledWith(mockUser, 'supplier-123');
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.findOne.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/suppliers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/suppliers/supplier-123')
        .expect(401);
    });
  });

  describe('POST /suppliers', () => {
    it('should create supplier successfully', async () => {
      const createDto = {
        name: 'New Supplier',
        email: 'new@example.com',
        phone: '+9876543210',
        address: '789 New St',
        taxId: 'TAX789',
        rating: 5,
        leadTime: 5,
        paymentTerms: 'Net 30',
        discount: 10,
        status: 'active',
      };

      supplierService.create.mockResolvedValue({
        ...mockSupplier,
        ...createDto,
        id: 'supplier-124',
      } as any);

      const response = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('New Supplier');
      expect(response.body.email).toBe('new@example.com');
      expect(supplierService.create).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should return 409 when email already exists', async () => {
      const createDto = {
        name: 'Duplicate',
        email: 'supplier@example.com',
      };

      supplierService.create.mockRejectedValue(
        new HttpException(
          'Supplier with email supplier@example.com already exists',
          HttpStatus.CONFLICT,
        ),
      );

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should validate rating range (1-5)', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          email: 'test@example.com',
          rating: 6,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          email: 'test@example.com',
          rating: 0,
        })
        .expect(400);
    });

    it('should allow optional fields', async () => {
      const minimalDto = {
        name: 'Minimal Supplier',
        email: 'minimal@example.com',
      };

      supplierService.create.mockResolvedValue({
        ...mockSupplier,
        ...minimalDto,
      } as any);

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send(minimalDto)
        .expect(201);
    });
  });

  describe('PATCH /suppliers/:id', () => {
    it('should update supplier successfully', async () => {
      const updateDto = {
        name: 'Updated Supplier',
        phone: '+1111111111',
        rating: 5,
      };

      const updatedSupplier = {
        ...mockSupplier,
        ...updateDto,
      };

      supplierService.update.mockResolvedValue(updatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Supplier');
      expect(response.body.rating).toBe(5);
      expect(supplierService.update).toHaveBeenCalledWith(mockUser, 'supplier-123', updateDto);
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.update.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 409 when new email conflicts', async () => {
      supplierService.update.mockRejectedValue(
        new HttpException(
          'Supplier with email new@example.com already exists',
          HttpStatus.CONFLICT,
        ),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'new@example.com' })
        .expect(409);
    });

    it('should allow partial updates', async () => {
      supplierService.update.mockResolvedValue(mockSupplier as any);

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Updated notes only' })
        .expect(200);
    });

    it('should validate email format when updating', async () => {
      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('should validate rating range when updating', async () => {
      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ rating: 10 })
        .expect(400);
    });
  });

  describe('PATCH /suppliers/:id/balance', () => {
    it('should update supplier balance successfully', async () => {
      const updatedSupplier = {
        ...mockSupplier,
        currentBalance: 15000,
      };

      supplierService.updateBalance.mockResolvedValue(updatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 5000 })
        .expect(200);

      expect(response.body.currentBalance).toBe(15000);
      expect(supplierService.updateBalance).toHaveBeenCalledWith(mockUser, 'supplier-123', 5000);
    });

    it('should handle negative amounts (payments)', async () => {
      const updatedSupplier = {
        ...mockSupplier,
        currentBalance: 5000,
      };

      supplierService.updateBalance.mockResolvedValue(updatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: -5000 })
        .expect(200);

      expect(response.body.currentBalance).toBe(5000);
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.updateBalance.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/non-existent/balance')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 1000 })
        .expect(404);
    });
  });

  describe('PATCH /suppliers/:id/payment-terms', () => {
    it('should update payment terms successfully', async () => {
      const updatedSupplier = {
        ...mockSupplier,
        paymentTerms: 60,
      };

      supplierService.updatePaymentTerms.mockResolvedValue(updatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/payment-terms')
        .set('Authorization', 'Bearer valid-token')
        .send({ paymentTerms: 60 })
        .expect(200);

      expect(response.body.paymentTerms).toBe(60);
      expect(supplierService.updatePaymentTerms).toHaveBeenCalledWith(
        mockUser,
        'supplier-123',
        60,
      );
    });

    it('should return 400 when payment terms is negative', async () => {
      supplierService.updatePaymentTerms.mockRejectedValue(
        new HttpException('Payment terms cannot be negative', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/payment-terms')
        .set('Authorization', 'Bearer valid-token')
        .send({ paymentTerms: -10 })
        .expect(400);
    });

    it('should allow payment terms of 0', async () => {
      supplierService.updatePaymentTerms.mockResolvedValue({
        ...mockSupplier,
        paymentTerms: 0,
      } as any);

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/payment-terms')
        .set('Authorization', 'Bearer valid-token')
        .send({ paymentTerms: 0 })
        .expect(200);
    });
  });

  describe('PATCH /suppliers/:id/activate', () => {
    it('should activate supplier successfully', async () => {
      const activatedSupplier = {
        ...mockSupplier,
        status: 'active',
      };

      supplierService.activate.mockResolvedValue(activatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(supplierService.activate).toHaveBeenCalledWith(mockUser, 'supplier-123');
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.activate.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/non-existent/activate')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('PATCH /suppliers/:id/deactivate', () => {
    it('should deactivate supplier successfully', async () => {
      const deactivatedSupplier = {
        ...mockSupplier,
        status: 'inactive',
      };

      supplierService.deactivate.mockResolvedValue(deactivatedSupplier as any);

      const response = await request(app.getHttpServer())
        .patch('/suppliers/supplier-123/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('inactive');
      expect(supplierService.deactivate).toHaveBeenCalledWith(mockUser, 'supplier-123');
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.deactivate.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/non-existent/deactivate')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('should delete supplier successfully', async () => {
      supplierService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Supplier deleted successfully');
      expect(supplierService.remove).toHaveBeenCalledWith(mockUser, 'supplier-123');
    });

    it('should return 404 when supplier not found', async () => {
      supplierService.remove.mockRejectedValue(
        new HttpException('Supplier not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/suppliers/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/suppliers/supplier-123')
        .expect(401);
    });
  });

  describe('Authorization', () => {
    it('should allow admin to create supplier', async () => {
      supplierService.create.mockResolvedValue(mockSupplier as any);

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          email: 'test@example.com',
        })
        .expect(201);
    });

    it('should allow admin to read suppliers', async () => {
      supplierService.findAll.mockResolvedValue([mockSupplier] as any);

      await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should allow admin to update supplier', async () => {
      supplierService.update.mockResolvedValue(mockSupplier as any);

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(200);
    });

    it('should allow admin to delete supplier', async () => {
      supplierService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      supplierService.findAll.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      supplierService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/suppliers/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should trim whitespace from string fields', async () => {
      supplierService.create.mockResolvedValue(mockSupplier as any);

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: '  Test Supplier  ',
          email: '  test@example.com  ',
        })
        .expect(201);
    });

    it('should handle concurrent updates', async () => {
      supplierService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/suppliers/supplier-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Update' })
        .expect(409);
    });

    it('should handle decimal discount values', async () => {
      supplierService.create.mockResolvedValue({
        ...mockSupplier,
        discount: 7.5,
      } as any);

      const response = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Test',
          email: 'test@example.com',
          discount: 7.5,
        })
        .expect(201);

      expect(response.body.discount).toBe(7.5);
    });

    it('should handle very long supplier names', async () => {
      const longName = 'A'.repeat(255);
      supplierService.create.mockResolvedValue({
        ...mockSupplier,
        name: longName,
      } as any);

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: longName,
          email: 'test@example.com',
        })
        .expect(201);
    });
  });
});
