/**
 * OrderController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. POST /orders - Create order manually
 * 2. GET /orders - Get all orders with filters
 * 3. GET /orders/statistics - Get order statistics
 * 4. GET /orders/customer/:customerId - Get orders by customer
 * 5. GET /orders/number/:orderNumber - Get order by order number
 * 6. GET /orders/:id - Get order by ID
 * 7. PATCH /orders/:id/status - Update order status
 * 8. POST /orders/:id/cancel - Cancel order
 * 9. POST /orders/payment/process - Process payment
 * 10. POST /orders/payment/verify - Verify payment
 * 11. POST /orders/payment/refund - Refund payment
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { ShippingStatus } from './enums/shipping-status.enum';

describe('OrderController (Integration)', () => {
  let app: INestApplication;
  let orderService: jest.Mocked<OrderService>;
  let paymentService: jest.Mocked<PaymentService>;

  const mockUser = {
    id: 'user-123',
    email: 'customer@example.com',
    tenantId: 'tenant-123',
    role: 'customer',
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-2024-001',
    customerId: 'user-123',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    shippingStatus: ShippingStatus.PENDING,
    customerEmail: 'customer@example.com',
    customerPhone: '+84901234567',
    subtotal: 500000,
    tax: 50000,
    shipping: 20000,
    discount: 50000,
    total: 520000,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        productSku: 'TS-001',
        price: 250000,
        quantity: 2,
      },
    ],
    createdAt: new Date('2024-01-01'),
  };

  const mockCreateOrderDto = {
    customerEmail: 'customer@example.com',
    customerPhone: '+84901234567',
    shippingAddress: {
      fullName: 'John Doe',
      phone: '+84901234567',
      address: '123 Main St',
      city: 'Ho Chi Minh',
      district: 'District 1',
      ward: 'Ward 1',
      postalCode: '700000',
      country: 'Vietnam',
    },
    shippingMethod: 'standard',
    paymentMethod: 'cod',
    items: [
      {
        productId: 'prod-1',
        productName: 'T-Shirt',
        productSku: 'TS-001',
        productImage: 'image.jpg',
        price: 250000,
        quantity: 2,
      },
    ],
  };

  beforeAll(async () => {
    const mockOrderService = {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      findByOrderNumber: jest.fn(),
      findByCustomer: jest.fn(),
      updateStatus: jest.fn(),
      cancel: jest.fn(),
      getStatistics: jest.fn(),
    };

    const mockPaymentService = {
      processPayment: jest.fn(),
      verifyPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer invalid-token') {
          request.user = mockUser;
          return true;
        }
        
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }),
    };

    const mockTenantGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const mockCacheInterceptor = {
      intercept: jest.fn().mockImplementation((context, next) => next.handle()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .overrideInterceptor(CacheInterceptor)
      .useValue(mockCacheInterceptor)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    orderService = moduleFixture.get(OrderService);
    paymentService = moduleFixture.get(PaymentService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /orders', () => {
    it('should create order successfully', async () => {
      orderService.create.mockResolvedValue(mockOrder as any);

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send(mockCreateOrderDto)
        .expect(201);

      expect(response.body).toEqual(mockOrder);
      expect(orderService.create).toHaveBeenCalledWith(mockCreateOrderDto, mockUser);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send(mockCreateOrderDto)
        .expect(401);
    });
  });

  describe('GET /orders', () => {
    it('should get all orders without filters', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([mockOrder]);
      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', {
        status: undefined,
        paymentStatus: undefined,
        shippingStatus: undefined,
        customerId: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should filter orders by status', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      await request(app.getHttpServer())
        .get('/orders?status=pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', expect.objectContaining({
        status: 'pending',
      }));
    });

    it('should filter orders by payment status', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      await request(app.getHttpServer())
        .get('/orders?paymentStatus=paid')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', expect.objectContaining({
        paymentStatus: 'paid',
      }));
    });

    it('should filter orders by shipping status', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      await request(app.getHttpServer())
        .get('/orders?shippingStatus=shipped')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', expect.objectContaining({
        shippingStatus: 'shipped',
      }));
    });

    it('should filter orders by customer ID', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      await request(app.getHttpServer())
        .get('/orders?customerId=user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', expect.objectContaining({
        customerId: 'user-123',
      }));
    });

    it('should filter orders by date range', async () => {
      orderService.findAll.mockResolvedValue([mockOrder] as any);

      await request(app.getHttpServer())
        .get('/orders?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.findAll).toHaveBeenCalledWith('tenant-123', expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }));
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .expect(401);
    });
  });

  describe('GET /orders/statistics', () => {
    it('should get order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        totalRevenue: 50000000,
        averageOrderValue: 500000,
        ordersByStatus: {
          [OrderStatus.PENDING]: 10,
          [OrderStatus.CONFIRMED]: 20,
          [OrderStatus.PROCESSING]: 0,
          [OrderStatus.SHIPPED]: 30,
          [OrderStatus.DELIVERED]: 35,
          [OrderStatus.CANCELLED]: 5,
          [OrderStatus.REFUNDED]: 0,
        } as Record<OrderStatus, number>,
      };

      orderService.getStatistics.mockResolvedValue(mockStats);

      const response = await request(app.getHttpServer())
        .get('/orders/statistics')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(orderService.getStatistics).toHaveBeenCalledWith('tenant-123', undefined, undefined);
    });

    it('should get statistics with date range', async () => {
      const mockStats = {
        totalOrders: 50,
        totalRevenue: 25000000,
        averageOrderValue: 500000,
        ordersByStatus: {} as Record<OrderStatus, number>,
      };

      orderService.getStatistics.mockResolvedValue(mockStats);

      await request(app.getHttpServer())
        .get('/orders/statistics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(orderService.getStatistics).toHaveBeenCalledWith(
        'tenant-123',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/orders/statistics')
        .expect(401);
    });
  });

  describe('GET /orders/customer/:customerId', () => {
    it('should get orders by customer', async () => {
      orderService.findByCustomer.mockResolvedValue([mockOrder] as any);

      const response = await request(app.getHttpServer())
        .get('/orders/customer/user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([mockOrder]);
      expect(orderService.findByCustomer).toHaveBeenCalledWith('user-123', mockUser);
    });

    it('should return empty array when customer has no orders', async () => {
      orderService.findByCustomer.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/orders/customer/user-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/orders/customer/user-123')
        .expect(401);
    });
  });

  describe('GET /orders/number/:orderNumber', () => {
    it('should get order by order number', async () => {
      orderService.findByOrderNumber.mockResolvedValue(mockOrder as any);

      const response = await request(app.getHttpServer())
        .get('/orders/number/ORD-2024-001')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOrder);
      expect(orderService.findByOrderNumber).toHaveBeenCalledWith('ORD-2024-001', mockUser);
    });

    it('should return 404 when order number not found', async () => {
      orderService.findByOrderNumber.mockRejectedValue(
        new HttpException('Order with number ORD-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/orders/number/ORD-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/orders/number/ORD-2024-001')
        .expect(401);
    });
  });

  describe('GET /orders/:id', () => {
    it('should get order by ID', async () => {
      orderService.findOne.mockResolvedValue(mockOrder as any);

      const response = await request(app.getHttpServer())
        .get('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOrder);
      expect(orderService.findOne).toHaveBeenCalledWith('order-123', mockUser);
    });

    it('should return 404 when order not found', async () => {
      orderService.findOne.mockRejectedValue(
        new HttpException('Order with ID order-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/orders/order-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/orders/order-123')
        .expect(401);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.CONFIRMED };
      orderService.updateStatus.mockResolvedValue(updatedOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: OrderStatus.CONFIRMED })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.CONFIRMED);
      expect(orderService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        { status: OrderStatus.CONFIRMED },
        mockUser,
        mockUser,
      );
    });

    it('should update payment status', async () => {
      const updatedOrder = { ...mockOrder, paymentStatus: PaymentStatus.PAID };
      orderService.updateStatus.mockResolvedValue(updatedOrder as any);

      await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ paymentStatus: PaymentStatus.PAID })
        .expect(200);
    });

    it('should update shipping status', async () => {
      const updatedOrder = { ...mockOrder, shippingStatus: ShippingStatus.SHIPPED };
      orderService.updateStatus.mockResolvedValue(updatedOrder as any);

      await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ shippingStatus: ShippingStatus.SHIPPED })
        .expect(200);
    });

    it('should update tracking number', async () => {
      const updatedOrder = { ...mockOrder, trackingNumber: 'TRACK-123' };
      orderService.updateStatus.mockResolvedValue(updatedOrder as any);

      await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ trackingNumber: 'TRACK-123' })
        .expect(200);
    });

    it('should return 404 when order not found', async () => {
      orderService.updateStatus.mockRejectedValue(
        new HttpException('Order with ID order-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-999/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: OrderStatus.CONFIRMED })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .send({ status: OrderStatus.CONFIRMED })
        .expect(401);
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      orderService.cancel.mockResolvedValue(cancelledOrder as any);

      const response = await request(app.getHttpServer())
        .post('/orders/order-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Customer requested cancellation' })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.CANCELLED);
      expect(orderService.cancel).toHaveBeenCalledWith(
        'order-123',
        { reason: 'Customer requested cancellation' },
        mockUser,
        mockUser,
      );
    });

    it('should return 400 when order cannot be cancelled', async () => {
      orderService.cancel.mockRejectedValue(
        new HttpException('Order cannot be cancelled. Current status: shipped', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/orders/order-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Changed mind' })
        .expect(400);
    });

    it('should return 404 when order not found', async () => {
      orderService.cancel.mockRejectedValue(
        new HttpException('Order with ID order-999 not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/orders/order-999/cancel')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Test' })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/orders/order-123/cancel')
        .send({ reason: 'Test' })
        .expect(401);
    });
  });

  describe('POST /orders/payment/process', () => {
    it('should process payment successfully', async () => {
      const paymentResult = {
        success: true,
        transactionId: 'TXN-123',
        message: 'Payment processed successfully',
      };

      paymentService.processPayment.mockResolvedValue(paymentResult);

      const response = await request(app.getHttpServer())
        .post('/orders/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orderId: 'order-123',
          paymentMethod: 'stripe',
          amount: 520000,
          paymentToken: 'tok_123',
        })
        .expect(200);

      expect(response.body).toEqual(paymentResult);
    });

    it('should return 400 with invalid payment data', async () => {
      await request(app.getHttpServer())
        .post('/orders/payment/process')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/orders/payment/process')
        .send({ orderId: 'order-123' })
        .expect(401);
    });
  });

  describe('POST /orders/payment/verify', () => {
    it('should verify payment successfully', async () => {
      const verifyResult = {
        verified: true,
        status: PaymentStatus.PAID,
        message: 'Payment verified successfully',
      };

      paymentService.verifyPayment.mockResolvedValue(verifyResult);

      const response = await request(app.getHttpServer())
        .post('/orders/payment/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orderId: 'order-123',
          paymentMethod: 'stripe',
          transactionId: 'TXN-123',
        })
        .expect(200);

      expect(response.body).toEqual(verifyResult);
    });

    it('should return 400 with invalid verification data', async () => {
      await request(app.getHttpServer())
        .post('/orders/payment/verify')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/orders/payment/verify')
        .send({ orderId: 'order-123' })
        .expect(401);
    });
  });

  describe('POST /orders/payment/refund', () => {
    it('should refund payment successfully', async () => {
      const refundResult = {
        success: true,
        refundId: 'REF-123',
        message: 'Payment refunded successfully',
      };

      paymentService.refundPayment.mockResolvedValue(refundResult);

      const response = await request(app.getHttpServer())
        .post('/orders/payment/refund')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orderId: 'order-123',
          reason: 'Defective product',
          amount: 520000,
        })
        .expect(200);

      expect(response.body).toEqual(refundResult);
    });

    it('should return 400 when order is not paid', async () => {
      paymentService.refundPayment.mockRejectedValue(
        new HttpException('Order must be paid before refunding', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/orders/payment/refund')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orderId: 'order-123',
          reason: 'Test',
        })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/orders/payment/refund')
        .send({ orderId: 'order-123' })
        .expect(401);
    });
  });
});
