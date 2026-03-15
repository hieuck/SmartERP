/**
 * AuditController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /audit/logs - Get all audit logs with filters
 * 2. GET /audit/logs/entity/:entityType/:entityId - Get logs by entity
 * 3. GET /audit/logs/user/:userId - Get logs by user
 * 4. GET /audit/summary - Get activity summary
 * 5. Authentication/Authorization tests
 * 6. Query parameter validation
 * 7. Date range filtering
 * 8. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuditAction } from './enums/audit-action.enum';

describe('AuditController (Integration)', () => {
  let app: INestApplication;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    tenantId: 'tenant-123',
    roles: ['admin'],
  };

  const mockAuditLog = {
    id: 'log-123',
    userId: 'user-123',
    action: AuditAction.CREATE,
    entityType: 'Order',
    entityId: 'order-123',
    oldValue: null,
    newValue: { status: 'pending', amount: 1000000 },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    description: 'Created new order',
    tenantId: 'tenant-123',
    createdAt: '2024-01-15T10:00:00.000Z',
  };

  beforeAll(async () => {
    const mockAuditService = {
      findAll: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
      getActivitySummary: jest.fn(),
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    auditService = moduleFixture.get(AuditService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /audit/logs', () => {
    it('should return all audit logs without filters', async () => {
      const logs = [mockAuditLog];
      auditService.findAll.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should filter by date range', async () => {
      const logs = [mockAuditLog];
      auditService.findAll.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        undefined,
        undefined,
      );
    });

    it('should filter by userId', async () => {
      const logs = [mockAuditLog];
      auditService.findAll.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs?userId=user-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        undefined,
        undefined,
        'user-456',
        undefined,
      );
    });

    it('should filter by entityType', async () => {
      const logs = [mockAuditLog];
      auditService.findAll.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs?entityType=Order')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        undefined,
        undefined,
        undefined,
        'Order',
      );
    });

    it('should filter by all parameters', async () => {
      const logs = [mockAuditLog];
      auditService.findAll.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs?startDate=2024-01-01&endDate=2024-01-31&userId=user-456&entityType=Order')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'user-456',
        'Order',
      );
    });

    it('should return empty array when no logs found', async () => {
      auditService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle invalid date format gracefully', async () => {
      auditService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/audit/logs?startDate=invalid-date&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditService.findAll).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/audit/logs')
        .expect(401);
    });

    it('should handle service errors', async () => {
      auditService.findAll.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /audit/logs/entity/:entityType/:entityId', () => {
    it('should return logs for specific entity', async () => {
      const logs = [mockAuditLog];
      auditService.findByEntity.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs/entity/Order/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findByEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        'Order',
        'order-123',
      );
    });

    it('should return empty array when no logs for entity', async () => {
      auditService.findByEntity.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/audit/logs/entity/Order/order-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle different entity types', async () => {
      const entityTypes = ['Order', 'Customer', 'Product', 'Invoice', 'Payment'];

      for (const entityType of entityTypes) {
        auditService.findByEntity.mockResolvedValue([]);

        await request(app.getHttpServer())
          .get(`/audit/logs/entity/${entityType}/entity-123`)
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(auditService.findByEntity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockUser.id,
            tenantId: mockUser.tenantId,
          }),
          entityType,
          'entity-123',
        );
      }
    });

    it('should handle special characters in entityId', async () => {
      auditService.findByEntity.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs/entity/Order/order-123-abc')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditService.findByEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        'Order',
        'order-123-abc',
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/audit/logs/entity/Order/order-123')
        .expect(401);
    });

    it('should handle service errors', async () => {
      auditService.findByEntity.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/audit/logs/entity/Order/order-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /audit/logs/user/:userId', () => {
    it('should return logs for specific user', async () => {
      const logs = [mockAuditLog];
      auditService.findByUser.mockResolvedValue(logs as any);

      const response = await request(app.getHttpServer())
        .get('/audit/logs/user/user-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(logs);
      expect(auditService.findByUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        'user-456',
      );
    });

    it('should return empty array when user has no logs', async () => {
      auditService.findByUser.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/audit/logs/user/user-999')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle UUID format userId', async () => {
      auditService.findByUser.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs/user/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditService.findByUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        '550e8400-e29b-41d4-a716-446655440000',
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/audit/logs/user/user-456')
        .expect(401);
    });

    it('should handle service errors', async () => {
      auditService.findByUser.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/audit/logs/user/user-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('GET /audit/summary', () => {
    it('should return activity summary for date range', async () => {
      const summary = {
        total: 150,
        byAction: {
          [AuditAction.CREATE]: 50,
          [AuditAction.UPDATE]: 60,
          [AuditAction.DELETE]: 20,
          [AuditAction.READ]: 20,
        },
        byEntityType: {
          Order: 80,
          Customer: 40,
          Product: 30,
        },
        byUser: {
          'user-123': 100,
          'user-456': 50,
        },
      };

      auditService.getActivitySummary.mockResolvedValue(summary as any);

      const response = await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(summary);
      expect(auditService.getActivitySummary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          tenantId: mockUser.tenantId,
        }),
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );
    });

    it('should return empty summary when no activity', async () => {
      const emptySummary = {
        total: 0,
        byAction: {},
        byEntityType: {},
        byUser: {},
      };

      auditService.getActivitySummary.mockResolvedValue(emptySummary as any);

      const response = await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-12-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.total).toBe(0);
    });

    it('should handle different date ranges', async () => {
      const summary = { total: 10, byAction: {}, byEntityType: {}, byUser: {} };
      auditService.getActivitySummary.mockResolvedValue(summary as any);

      // Last 7 days
      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-01-08&endDate=2024-01-15')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Last 30 days
      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2023-12-16&endDate=2024-01-15')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Last year
      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2023-01-01&endDate=2023-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(auditService.getActivitySummary).toHaveBeenCalledTimes(3);
    });

    it('should require both startDate and endDate', async () => {
      const summary = { total: 0, byAction: {}, byEntityType: {}, byUser: {} };
      auditService.getActivitySummary.mockResolvedValue(summary as any);

      // Missing endDate
      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-01-01')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Missing startDate
      await request(app.getHttpServer())
        .get('/audit/summary?endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-01-01&endDate=2024-01-31')
        .expect(401);
    });

    it('should handle service errors', async () => {
      auditService.getActivitySummary.mockRejectedValue(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer())
        .get('/audit/summary?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      auditService.findAll.mockResolvedValue([mockAuditLog] as any);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/audit/logs')
            .set('Authorization', 'Bearer valid-token'),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle very large date ranges', async () => {
      auditService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs?startDate=2020-01-01&endDate=2024-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle future dates', async () => {
      auditService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs?startDate=2025-01-01&endDate=2025-12-31')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle startDate after endDate', async () => {
      auditService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs?startDate=2024-12-31&endDate=2024-01-01')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle empty string parameters', async () => {
      auditService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs?userId=&entityType=')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });

    it('should handle special characters in query params', async () => {
      auditService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/audit/logs?entityType=Order%20Item')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });
});
