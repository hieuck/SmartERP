/**
 * OrderController Integration Tests
 * Coverage target: 95%
 * 
 * Test cases:
 * 1. GET /orders - Get all orders
 * 2. GET /orders/pending - Get pending orders
 * 3. GET /orders/count - Get order count
 * 4. GET /orders/recent/:limit - Get recent orders
 * 5. GET /orders/revenue/total - Get total revenue
 * 6. GET /orders/revenue/range - Get revenue by date range
 * 7. GET /orders/date-range - Get orders by date range
 * 8. GET /orders/customer/:customerId - Get orders by customer
 * 9. GET /orders/status/:status - Get orders by status
 * 10. GET /orders/:id - Get order by ID
 * 11. POST /orders - Create order
 * 12. PATCH /orders/:id - Update order
 * 13. PATCH /orders/:id/status - Update order status
 * 14. PATCH /orders/:id/cancel - Cancel order
 * 15. PATCH /orders/:id/ship - Ship order
 * 16. PATCH /orders/:id/deliver - Deliver order
 * 17. DELETE /orders/:id - Delete order
 * 18. Authentication/Authorization tests
 * 19. Validation tests
 * 20. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

describe('OrderController (Integration)', () => {
  let app: INestApplication;
  let orderService: jest.Mocked<OrderService>;

  const mockUser = {
    id: 'user-123',
    email: 'sales@example.com',
    tenantId: 'tenant-123',
    roles: ['sales'],
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-001',
    customerId: 'customer-123',
    status: 'pending',
    totalAmount: 1000000,
    items: [
      {
        id: 'item-123',
        productId: 'prod-123',
        quantity: 2,
        unitPrice: 500000,
        totalPrice: 1000000,
      },
    ],
    orderDate: new Date('2024-01-15'),
    tenantId: 'tenant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const mockOrderService = {
      findAll: jest.fn(),
      getPendingOrders: jest.fn(),
      count: jest.fn(),
      getRecentOrders: jest.fn(),
      getTotalRevenue: jest.fn(),
      getRevenueByDateRange: jest.fn(),
      findByDateRange: jest.fn(),
      findByCustomer: jest.fn(),
      findByStatus: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      cancel: jest.fn(),
      ship: jest.fn(),
      deliver: jest.fn(),
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
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
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

    orderService = moduleFixture.get(OrderService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return all orders', async () => {
      const orders = [mockOrder];
      orderService.findAll.mockResolvedValue(orders as any);

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(orders);
      expect(orderService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .expect(401);
    });

    it('should return empty array when no orders', async () => {
      orderService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /orders/pending', () => {
    it('should return pending orders', async () => {
      const pendingOrders = [mockOrder];
      orderService.getPendingOrders.mockResolvedValue(pendingOrders as any);

      const response = await request(app.getHttpServer())
        .get('/orders/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(pendingOrders);
      expect(orderService.getPendingOrders).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no pending orders', async () => {
      orderService.getPendingOrders.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/orders/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /orders/count', () => {
    it('should return order count', async () => {
      orderService.count.mockResolvedValue(50);

      const response = await request(app.getHttpServer())
        .get('/orders/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(50);
      expect(orderService.count).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no orders', async () => {
      orderService.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/orders/count')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /orders/recent/:limit', () => {
    it('should return recent orders with valid limit', async () => {
      const recentOrders = [mockOrder];
      orderService.getRecentOrders.mockResolvedValue(recentOrders as any);

      const response = await request(app.getHttpServer())
        .get('/orders/recent/10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(recentOrders);
      expect(orderService.getRecentOrders).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should return 400 for invalid limit', async () => {
      await request(app.getHttpServer())
        .get('/orders/recent/invalid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 for negative limit', async () => {
      await request(app.getHttpServer())
        .get('/orders/recent/-5')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should return 400 for zero limit', async () => {
      await request(app.getHttpServer())
        .get('/orders/recent/0')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('GET /orders/revenue/total', () => {
    it('should return total revenue', async () => {
      orderService.getTotalRevenue.mockResolvedValue(50000000);

      const response = await request(app.getHttpServer())
        .get('/orders/revenue/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(50000000);
      expect(orderService.getTotalRevenue).toHaveBeenCalledWith(mockUser);
    });

    it('should return 0 when no revenue', async () => {
      orderService.getTotalRevenue.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/orders/revenue/total')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(0);
    });
  });

  describe('GET /orders/revenue/range', () => {
    it('should return revenue by date range', async () => {
      orderService.getRevenueByDateRange.mockResolvedValue(10000000);

      const response = await request(app.getHttpServer())
        .get('/orders/revenue/range?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toBe(10000000);
      expect(orderService.getRevenueByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should handle invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/orders/revenue/range?startDate=invalid&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });

  describe('GET /orders/date-range', () => {
    it('should return orders by date range', async () => {
      const orders = [mockOrder];
      orderService.findByDateRange.mockResolvedValue(orders as any);

      const response = await request(app.getHttpServer())
        .get('/orders/date-range?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(orders);
      expect(orderService.findByDateRange).toHaveBeenCalledWith(
        mockUser,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should return empty array when no orders in range', async () => {
      orderService.findByDateRange.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/orders/date-range?startDate=2024-12-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /orders/customer/:customerId', () => {
    it('should return orders by customer', async () => {
      const orders = [mockOrder];
      orderService.findByCustomer.mockResolvedValue(orders as any);

      const response = await request(app.getHttpServer())
        .get('/orders/customer/customer-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(orders);
      expect(orderService.findByCustomer).toHaveBeenCalledWith(mockUser, 'customer-123');
    });

    it('should return empty array when customer has no orders', async () => {
      orderService.findByCustomer.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/orders/customer/customer-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /orders/status/:status', () => {
    it('should return orders by status', async () => {
      const orders = [mockOrder];
      orderService.findByStatus.mockResolvedValue(orders as any);

      const response = await request(app.getHttpServer())
        .get('/orders/status/pending')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(orders);
      expect(orderService.findByStatus).toHaveBeenCalledWith(mockUser, 'pending');
    });

    it('should handle all status values', async () => {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

      for (const status of statuses) {
        orderService.findByStatus.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get(`/orders/status/${status}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(orderService.findByStatus).toHaveBeenCalledWith(mockUser, status);
      }
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order by ID', async () => {
      orderService.findOne.mockResolvedValue(mockOrder as any);

      const response = await request(app.getHttpServer())
        .get('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOrder);
      expect(orderService.findOne).toHaveBeenCalledWith(mockUser, 'order-123');
    });

    it('should return 404 when order not found', async () => {
      orderService.findOne.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .get('/orders/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/orders/order-123')
        .expect(401);
    });
  });

  describe('POST /orders', () => {
    it('should create order successfully', async () => {
      const createDto = {
        customerId: 'customer-123',
        items: [
          {
            productId: 'prod-123',
            quantity: 2,
            unitPrice: 500000,
          },
        ],
      };

      orderService.create.mockResolvedValue(mockOrder as any);

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(201);

      expect(response.body.orderNumber).toBe('ORD-001');
      expect(orderService.create).toHaveBeenCalledWith(mockUser, createDto);
    });

    it('should return 404 when customer not found', async () => {
      const createDto = {
        customerId: 'non-existent',
        items: [{ productId: 'prod-123', quantity: 1, unitPrice: 100000 }],
      };

      orderService.create.mockRejectedValue(
        new HttpException('Customer not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send(createDto)
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);
    });

    it('should validate items array not empty', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send({ customerId: 'customer-123', items: [] })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ customerId: 'customer-123' })
        .expect(401);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('should update order successfully', async () => {
      const updateDto = {
        items: [
          {
            productId: 'prod-456',
            quantity: 3,
            unitPrice: 600000,
          },
        ],
      };

      const updatedOrder = { ...mockOrder, ...updateDto };
      orderService.update.mockResolvedValue(updatedOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateDto)
        .expect(200);

      expect(orderService.update).toHaveBeenCalledWith(mockUser, 'order-123', updateDto);
    });

    it('should return 404 when order not found', async () => {
      orderService.update.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({ items: [] })
        .expect(404);
    });

    it('should return 400 when order already shipped', async () => {
      orderService.update.mockRejectedValue(
        new HttpException('Cannot update shipped order', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ items: [] })
        .expect(400);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'confirmed' };
      orderService.updateStatus.mockResolvedValue(updatedOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
      expect(orderService.updateStatus).toHaveBeenCalledWith(mockUser, 'order-123', 'confirmed');
    });

    it('should return 404 when order not found', async () => {
      orderService.updateStatus.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/non-existent/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'confirmed' })
        .expect(404);
    });

    it('should return 400 for invalid status transition', async () => {
      orderService.updateStatus.mockRejectedValue(
        new HttpException('Invalid status transition', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123/status')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'invalid' })
        .expect(400);
    });
  });

  describe('PATCH /orders/:id/cancel', () => {
    it('should cancel order successfully', async () => {
      const cancelledOrder = { ...mockOrder, status: 'cancelled' };
      orderService.cancel.mockResolvedValue(cancelledOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('cancelled');
      expect(orderService.cancel).toHaveBeenCalledWith(mockUser, 'order-123');
    });

    it('should return 404 when order not found', async () => {
      orderService.cancel.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/non-existent/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when order already shipped', async () => {
      orderService.cancel.mockRejectedValue(
        new HttpException('Cannot cancel shipped order', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('PATCH /orders/:id/ship', () => {
    it('should ship order successfully', async () => {
      const shippedOrder = { ...mockOrder, status: 'shipped', trackingNumber: 'TRACK-123' };
      orderService.ship.mockResolvedValue(shippedOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123/ship')
        .set('Authorization', 'Bearer valid-token')
        .send({ trackingNumber: 'TRACK-123' })
        .expect(200);

      expect(response.body.status).toBe('shipped');
      expect(response.body.trackingNumber).toBe('TRACK-123');
      expect(orderService.ship).toHaveBeenCalledWith(mockUser, 'order-123', 'TRACK-123');
    });

    it('should return 404 when order not found', async () => {
      orderService.ship.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/non-existent/ship')
        .set('Authorization', 'Bearer valid-token')
        .send({ trackingNumber: 'TRACK-123' })
        .expect(404);
    });

    it('should return 400 when order not confirmed', async () => {
      orderService.ship.mockRejectedValue(
        new HttpException('Order must be confirmed before shipping', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123/ship')
        .set('Authorization', 'Bearer valid-token')
        .send({ trackingNumber: 'TRACK-123' })
        .expect(400);
    });
  });

  describe('PATCH /orders/:id/deliver', () => {
    it('should deliver order successfully', async () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      orderService.deliver.mockResolvedValue(deliveredOrder as any);

      const response = await request(app.getHttpServer())
        .patch('/orders/order-123/deliver')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.status).toBe('delivered');
      expect(orderService.deliver).toHaveBeenCalledWith(mockUser, 'order-123');
    });

    it('should return 404 when order not found', async () => {
      orderService.deliver.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .patch('/orders/non-existent/deliver')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when order not shipped', async () => {
      orderService.deliver.mockRejectedValue(
        new HttpException('Order must be shipped before delivery', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123/deliver')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete order successfully', async () => {
      orderService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.message).toBe('Order deleted successfully');
      expect(orderService.remove).toHaveBeenCalledWith(mockUser, 'order-123');
    });

    it('should return 404 when order not found', async () => {
      orderService.remove.mockRejectedValue(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );

      await request(app.getHttpServer())
        .delete('/orders/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });

    it('should return 400 when order already processed', async () => {
      orderService.remove.mockRejectedValue(
        new HttpException('Cannot delete processed order', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .delete('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete('/orders/order-123')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      orderService.findOne.mockRejectedValue(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });

    it('should handle invalid UUID format', async () => {
      orderService.findOne.mockRejectedValue(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .get('/orders/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);
    });

    it('should handle concurrent updates', async () => {
      orderService.update.mockRejectedValue(
        new HttpException('Resource has been modified by another user', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer())
        .patch('/orders/order-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ items: [] })
        .expect(409);
    });

    it('should handle insufficient stock', async () => {
      orderService.create.mockRejectedValue(
        new HttpException('Insufficient stock for product', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', 'Bearer valid-token')
        .send({
          customerId: 'customer-123',
          items: [{ productId: 'prod-123', quantity: 1000, unitPrice: 100000 }],
        })
        .expect(400);
    });
  });
});
