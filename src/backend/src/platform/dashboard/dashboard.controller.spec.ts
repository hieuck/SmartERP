/**
 * DashboardController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /dashboard/overview - Get dashboard overview
 * 2. GET /dashboard/sales-chart - Get sales chart data
 * 3. GET /dashboard/top-products - Get top selling products
 * 4. GET /dashboard/top-customers - Get top customers
 * 5. GET /dashboard/revenue-by-category - Get revenue by category
 * 6. Query parameter validation
 * 7. Authentication/Authorization tests
 * 8. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

describe('DashboardController (Integration)', () => {
  let app: INestApplication;
  let dashboardService: jest.Mocked<DashboardService>;

  const mockUser = {
    id: 'user-123',
    email: 'manager@example.com',
    tenantId: 'tenant-123',
    roles: ['manager'],
  };

  const mockOverview = {
    revenue: {
      today: 5000000,
      thisWeek: 30000000,
      thisMonth: 120000000,
      growth: 15.5,
    },
    orders: {
      total: 250,
      pending: 15,
      completed: 220,
      cancelled: 15,
    },
    inventory: {
      totalProducts: 500,
      lowStock: 25,
      outOfStock: 5,
      totalValue: 500000000,
    },
    customers: {
      total: 180,
      active: 150,
      new: 20,
    },
    payments: {
      pending: 10,
      completed: 200,
      totalAmount: 100000000,
    },
  };

  const mockSalesChart = [
    { date: '2024-01-01', revenue: 1000000, orders: 10 },
    { date: '2024-01-02', revenue: 1500000, orders: 15 },
    { date: '2024-01-03', revenue: 2000000, orders: 20 },
  ];

  const mockTopProducts = [
    { id: 'prod-1', name: 'Product A', revenue: 5000000, quantity: 100 },
    { id: 'prod-2', name: 'Product B', revenue: 4000000, quantity: 80 },
    { id: 'prod-3', name: 'Product C', revenue: 3000000, quantity: 60 },
  ];

  const mockTopCustomers = [
    { id: 'cust-1', name: 'Customer A', totalSpent: 10000000, orderCount: 25 },
    { id: 'cust-2', name: 'Customer B', totalSpent: 8000000, orderCount: 20 },
    { id: 'cust-3', name: 'Customer C', totalSpent: 6000000, orderCount: 15 },
  ];

  const mockRevenueByCategory = [
    { category: 'Electronics', revenue: 50000000, percentage: 40 },
    { category: 'Clothing', revenue: 30000000, percentage: 24 },
    { category: 'Food', revenue: 20000000, percentage: 16 },
  ];

  beforeAll(async () => {
    const mockDashboardService = {
      getOverview: jest.fn(),
      getSalesChart: jest.fn(),
      getTopProducts: jest.fn(),
      getTopCustomers: jest.fn(),
      getRevenueByCategory: jest.fn(),
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
      controllers: [DashboardController],
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

  describe('GET /dashboard/overview', () => {
    it('should return dashboard overview successfully', async () => {
      dashboardService.getOverview.mockResolvedValue(mockOverview as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOverview);
      expect(dashboardService.getOverview).toHaveBeenCalledWith(mockUser);
    });

    it('should return overview with zero values when no data', async () => {
      const emptyOverview = {
        revenue: { today: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
        orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
        inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
        customers: { total: 0, active: 0, new: 0 },
        payments: { pending: 0, completed: 0, totalAmount: 0 },
      };

      dashboardService.getOverview.mockResolvedValue(emptyOverview as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.revenue.today).toBe(0);
      expect(response.body.orders.total).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/overview')
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
        controllers: [DashboardController],
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
        .get('/dashboard/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      await testApp.close();
    });

    it('should handle service errors', async () => {
      dashboardService.getOverview.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /dashboard/sales-chart', () => {
    it('should return sales chart with default days (30)', async () => {
      dashboardService.getSalesChart.mockResolvedValue(mockSalesChart as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/sales-chart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSalesChart);
      expect(dashboardService.getSalesChart).toHaveBeenCalledWith(mockUser, 30);
    });

    it('should return sales chart with custom days', async () => {
      dashboardService.getSalesChart.mockResolvedValue(mockSalesChart as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/sales-chart?days=7')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockSalesChart);
      expect(dashboardService.getSalesChart).toHaveBeenCalledWith(mockUser, 7);
    });

    it('should handle different day ranges', async () => {
      const dayRanges = [7, 14, 30, 60, 90, 365];

      for (const days of dayRanges) {
        dashboardService.getSalesChart.mockResolvedValue(mockSalesChart as any);

        await request(app.getHttpServer())
          .get(`/dashboard/sales-chart?days=${days}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getSalesChart).toHaveBeenCalledWith(mockUser, days);
      }
    });

    it('should return empty array when no sales data', async () => {
      dashboardService.getSalesChart.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/dashboard/sales-chart')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle invalid days parameter', async () => {
      dashboardService.getSalesChart.mockResolvedValue(mockSalesChart as any);

      await request(app.getHttpServer())
        .get('/dashboard/sales-chart?days=invalid')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/sales-chart')
        .expect(401);
    });
  });

  describe('GET /dashboard/top-products', () => {
    it('should return top products with default limit (10)', async () => {
      dashboardService.getTopProducts.mockResolvedValue(mockTopProducts as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTopProducts);
      expect(dashboardService.getTopProducts).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should return top products with custom limit', async () => {
      dashboardService.getTopProducts.mockResolvedValue(mockTopProducts as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-products?limit=5')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTopProducts);
      expect(dashboardService.getTopProducts).toHaveBeenCalledWith(mockUser, 5);
    });

    it('should handle different limit values', async () => {
      const limits = [5, 10, 20, 50];

      for (const limit of limits) {
        dashboardService.getTopProducts.mockResolvedValue(mockTopProducts as any);

        await request(app.getHttpServer())
          .get(`/dashboard/top-products?limit=${limit}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getTopProducts).toHaveBeenCalledWith(mockUser, limit);
      }
    });

    it('should return empty array when no products', async () => {
      dashboardService.getTopProducts.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-products')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/top-products')
        .expect(401);
    });
  });

  describe('GET /dashboard/top-customers', () => {
    it('should return top customers with default limit (10)', async () => {
      dashboardService.getTopCustomers.mockResolvedValue(mockTopCustomers as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTopCustomers);
      expect(dashboardService.getTopCustomers).toHaveBeenCalledWith(mockUser, 10);
    });

    it('should return top customers with custom limit', async () => {
      dashboardService.getTopCustomers.mockResolvedValue(mockTopCustomers as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-customers?limit=5')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockTopCustomers);
      expect(dashboardService.getTopCustomers).toHaveBeenCalledWith(mockUser, 5);
    });

    it('should handle different limit values', async () => {
      const limits = [5, 10, 20, 50];

      for (const limit of limits) {
        dashboardService.getTopCustomers.mockResolvedValue(mockTopCustomers as any);

        await request(app.getHttpServer())
          .get(`/dashboard/top-customers?limit=${limit}`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(dashboardService.getTopCustomers).toHaveBeenCalledWith(mockUser, limit);
      }
    });

    it('should return empty array when no customers', async () => {
      dashboardService.getTopCustomers.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/dashboard/top-customers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/top-customers')
        .expect(401);
    });
  });

  describe('GET /dashboard/revenue-by-category', () => {
    it('should return revenue by category', async () => {
      dashboardService.getRevenueByCategory.mockResolvedValue(mockRevenueByCategory as any);

      const response = await request(app.getHttpServer())
        .get('/dashboard/revenue-by-category')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockRevenueByCategory);
      expect(dashboardService.getRevenueByCategory).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array when no categories', async () => {
      dashboardService.getRevenueByCategory.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/dashboard/revenue-by-category')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/revenue-by-category')
        .expect(401);
    });

    it('should handle service errors', async () => {
      dashboardService.getRevenueByCategory.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/dashboard/revenue-by-category')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      dashboardService.getOverview.mockResolvedValue(mockOverview as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/dashboard/overview')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle negative limit values', async () => {
      dashboardService.getTopProducts.mockResolvedValue(mockTopProducts as any);

      await request(app.getHttpServer())
        .get('/dashboard/top-products?limit=-5')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle zero limit values', async () => {
      dashboardService.getTopProducts.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/dashboard/top-products?limit=0')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle very large limit values', async () => {
      dashboardService.getTopProducts.mockResolvedValue(mockTopProducts as any);

      await request(app.getHttpServer())
        .get('/dashboard/top-products?limit=10000')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle negative days values', async () => {
      dashboardService.getSalesChart.mockResolvedValue(mockSalesChart as any);

      await request(app.getHttpServer())
        .get('/dashboard/sales-chart?days=-7')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle zero days values', async () => {
      dashboardService.getSalesChart.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/dashboard/sales-chart?days=0')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle cache timeout gracefully', async () => {
      dashboardService.getOverview.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockOverview as any), 100);
        });
      });

      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockOverview);
    });
  });
});
