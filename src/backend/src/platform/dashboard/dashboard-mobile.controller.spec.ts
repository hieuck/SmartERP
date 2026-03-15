/**
 * DashboardMobileController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /api/v1/dashboard/stats - Get mobile dashboard stats
 * 2. GET /api/v1/dashboard/revenue-chart - Get revenue chart data
 * 3. GET /api/v1/dashboard/top-products - Get top products (mobile format)
 * 4. GET /api/v1/dashboard/recent-orders - Get recent orders
 * 5. GET /api/v1/dashboard/low-stock - Get low stock products
 * 6. Query parameter validation
 * 7. Authentication/Authorization tests
 * 8. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ChartPeriod } from './dto';

describe('DashboardMobileController (Integration)', () => {
  let app: INestApplication;
  let dashboardService: jest.Mocked<DashboardService>;

  const mockUser = {
    id: 'user-123',
    email: 'mobile@example.com',
    tenantId: 'tenant-123',
    roles: ['sales'],
  };

  const mockMobileStats = {
    revenue: {
      today: 2000000,
      week: 15000000,
      month: 60000000,
    },
    orders: {
      today: 5,
      week: 35,
      month: 150,
      pending: 8,
    },
    inventory: {
      totalValue: 300000000,
      lowStockCount: 15,
      outOfStockCount: 3,
    },
    customers: {
      total: 120,
      new: 10,
    },
    receivables: 5000000,
    payables: 3000000,
  };

  const mockRevenueChart = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1000000, 1500000, 2000000, 1800000, 2200000, 2500000, 1900000],
  };

  const mockTopProductsChart = {
    labels: ['Product A', 'Product B', 'Product C'],
    values: [5000000, 4000000, 3000000],
  };

  const mockRecentOrders = [
    {
      id: 'order-1',
      code: 'ORD-001',
      customerName: 'Customer A',
      totalAmount: 1000000,
      status: 'pending',
      orderDate: '2024-01-15T10:00:00Z',
    },
    {
      id: 'order-2',
      code: 'ORD-002',
      customerName: 'Customer B',
      totalAmount: 1500000,
      status: 'completed',
      orderDate: '2024-01-15T09:00:00Z',
    },
  ];

  const mockLowStockProducts = [
    {
      id: 'prod-1',
      name: 'Product A',
      sku: 'SKU-001',
      currentStock: 5,
      minStock: 10,
    },
    {
      id: 'prod-2',
      name: 'Product B',
      sku: 'SKU-002',
      currentStock: 2,
      minStock: 15,
    },
  ];

  beforeAll(async () => {
    const mockDashboardService = {
      getMobileStats: jest.fn(),
      getRevenueChart: jest.fn(),
      getTopProducts: jest.fn(),
      getRecentOrders: jest.fn(),
      getLowStockProducts: jest.fn(),
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
      controllers: [DashboardMobileController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
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

    dashboardService = moduleFixture.get(DashboardService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/stats', () => {
    it('should return mobile dashboard stats successfully', async () => {
      dashboardService.getMobileStats.mockResolvedValue(mockMobileStats as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockMobileStats);
      expect(dashboardService.getMobileStats).toHaveBeenCalledWith(mockUser);
    });

    it('should return stats with zero values when no data', async () => {
      const emptyStats = {
        revenue: { today: 0, week: 0, month: 0 },
        orders: { today: 0, week: 0, month: 0, pending: 0 },
        inventory: { totalValue: 0, lowStockCount: 0, outOfStockCount: 0 },
        customers: { total: 0, new: 0 },
        receivables: 0,
        payables: 0,
      };

      dashboardService.getMobileStats.mockResolvedValue(emptyStats as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.revenue.today).toBe(0);
      expect(response.body.orders.today).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });

    it('should require tenant context', async () => {
      const mockJwtAuthGuard = {
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 'user-123', email: 'test@example.com' }; // No tenantId
          return true;
        }),
      };

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [DashboardMobileController],
        providers: [{ provide: DashboardService, useValue: dashboardService }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(mockJwtAuthGuard)
        .overrideGuard(TenantGuard)
        .useValue({
          canActivate: jest.fn().mockImplementation((context) => {
            const request = context.switchToHttp().getRequest();
            if (!request.user?.tenantId) {
              throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
            }
            return true;
          }),
        })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      await request(testApp.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      await testApp.close();
    });

    it('should handle service errors', async () => {
      dashboardService.getMobileStats.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /api/v1/dashboard/revenue-chart', () => {
    it('should return revenue chart for week period', async () => {
      dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=week')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRevenueChart);
      expect(dashboardService.getRevenueChart).toHaveBeenCalledWith(mockUser, 'week');
    });

    it('should return revenue chart for month period', async () => {
      dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=month')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRevenueChart);
      expect(dashboardService.getRevenueChart).toHaveBeenCalledWith(mockUser, 'month');
    });

    it('should return revenue chart for year period', async () => {
      dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=year')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRevenueChart);
      expect(dashboardService.getRevenueChart).toHaveBeenCalledWith(mockUser, 'year');
    });

    it('should handle all period values', async () => {
      const periods: ChartPeriod[] = [ChartPeriod.WEEK, ChartPeriod.MONTH, ChartPeriod.YEAR];

      for (const period of periods) {
        dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

        await request(app.getHttpServer())
          .get(`/api/v1/dashboard/revenue-chart?period=${period}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getRevenueChart).toHaveBeenCalledWith(mockUser, period);
      }
    });

    it('should return empty chart when no data', async () => {
      const emptyChart = { labels: [], values: [] };
      dashboardService.getRevenueChart.mockResolvedValue(emptyChart as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=week')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.labels).toEqual([]);
      expect(response.body.values).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=week')
        .expect(401);
    });
  });

  describe('GET /api/v1/dashboard/top-products', () => {
    it('should return top products in chart format with default limit (5)', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product A', revenue: 5000000, quantity: 100 },
        { id: 'p2', name: 'Product B', revenue: 4000000, quantity: 80 },
        { id: 'p3', name: 'Product C', revenue: 3000000, quantity: 60 },
      ];

      dashboardService.getTopProducts.mockResolvedValue(mockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/top-products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.labels).toEqual(['Product A', 'Product B', 'Product C']);
      expect(response.body.values).toEqual([5000000, 4000000, 3000000]);
      expect(dashboardService.getTopProducts).toHaveBeenCalledWith(mockUser, 5);
    });

    it('should return top products with custom limit', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product A', revenue: 5000000, quantity: 100 },
        { id: 'p2', name: 'Product B', revenue: 4000000, quantity: 80 },
      ];

      dashboardService.getTopProducts.mockResolvedValue(mockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/top-products?limit=2')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.labels).toHaveLength(2);
      expect(response.body.values).toHaveLength(2);
      expect(dashboardService.getTopProducts).toHaveBeenCalledWith(mockUser, 2);
    });

    it('should return empty chart when no products', async () => {
      dashboardService.getTopProducts.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/top-products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.labels).toEqual([]);
      expect(response.body.values).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/top-products')
        .expect(401);
    });
  });

  describe('GET /api/v1/dashboard/recent-orders', () => {
    it('should return recent orders with default limit (5)', async () => {
      dashboardService.getRecentOrders.mockResolvedValue(mockRecentOrders as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRecentOrders);
      expect(dashboardService.getRecentOrders).toHaveBeenCalledWith(mockUser, 5);
    });

    it('should return recent orders with custom limit', async () => {
      dashboardService.getRecentOrders.mockResolvedValue(mockRecentOrders as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders?limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRecentOrders);
      expect(dashboardService.getRecentOrders).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should handle different limit values', async () => {
      const limits = [5, 10, 20];

      for (const limit of limits) {
        dashboardService.getRecentOrders.mockResolvedValue(mockRecentOrders as any);

        await request(app.getHttpServer())
          .get(`/api/v1/dashboard/recent-orders?limit=${limit}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getRecentOrders).toHaveBeenCalledWith(mockUser, limit);
      }
    });

    it('should return empty array when no orders', async () => {
      dashboardService.getRecentOrders.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders')
        .expect(401);
    });

    it('should handle service errors', async () => {
      dashboardService.getRecentOrders.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /api/v1/dashboard/low-stock', () => {
    it('should return low stock products with default limit (10)', async () => {
      dashboardService.getLowStockProducts.mockResolvedValue(mockLowStockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockLowStockProducts);
      expect(dashboardService.getLowStockProducts).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should return low stock products with custom limit', async () => {
      dashboardService.getLowStockProducts.mockResolvedValue(mockLowStockProducts as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock?limit=20')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockLowStockProducts);
      expect(dashboardService.getLowStockProducts).toHaveBeenCalledWith(mockUser, 20);
    });

    it('should handle different limit values', async () => {
      const limits = [5, 10, 20, 50];

      for (const limit of limits) {
        dashboardService.getLowStockProducts.mockResolvedValue(mockLowStockProducts as any);

        await request(app.getHttpServer())
          .get(`/api/v1/dashboard/low-stock?limit=${limit}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getLowStockProducts).toHaveBeenCalledWith(mockUser, limit);
      }
    });

    it('should return empty array when no low stock products', async () => {
      dashboardService.getLowStockProducts.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock')
        .expect(401);
    });

    it('should handle service errors', async () => {
      dashboardService.getLowStockProducts.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      dashboardService.getMobileStats.mockResolvedValue(mockMobileStats as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/v1/dashboard/stats')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle negative limit values', async () => {
      dashboardService.getRecentOrders.mockResolvedValue(mockRecentOrders as any);

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders?limit=-5')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle zero limit values', async () => {
      dashboardService.getRecentOrders.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/recent-orders?limit=0')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle very large limit values', async () => {
      dashboardService.getLowStockProducts.mockResolvedValue(mockLowStockProducts as any);

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/low-stock?limit=10000')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle invalid period values', async () => {
      dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart?period=invalid')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle missing period parameter', async () => {
      dashboardService.getRevenueChart.mockResolvedValue(mockRevenueChart as any);

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/revenue-chart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });
});
