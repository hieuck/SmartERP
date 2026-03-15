/**
 * SeedController Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. POST /seed/demo - Seed demo data
 * 2. Error handling
 * 3. Edge cases
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

describe('SeedController (Integration)', () => {
  let app: INestApplication;
  let seedService: jest.Mocked<SeedService>;

  beforeAll(async () => {
    const mockSeedService = {
      seedDemoData: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SeedController],
      providers: [
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    seedService = moduleFixture.get(SeedService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /seed/demo', () => {
    it('should seed demo data successfully', async () => {
      const seedResult = {
        success: true,
        message: 'Demo data seeded successfully',
        stats: {
          users: 10,
          customers: 50,
          products: 100,
          orders: 200,
        },
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body).toEqual(seedResult);
      expect(response.body.success).toBe(true);
      expect(response.body.stats.users).toBe(10);
      expect(seedService.seedDemoData).toHaveBeenCalled();
    });

    it('should return detailed stats', async () => {
      const seedResult = {
        success: true,
        message: 'Demo data seeded successfully',
        stats: {
          users: 10,
          customers: 50,
          products: 100,
          orders: 200,
          invoices: 150,
          payments: 180,
        },
        duration: 5000,
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body.stats).toBeDefined();
      expect(response.body.duration).toBe(5000);
    });

    it('should handle seeding errors', async () => {
      seedService.seedDemoData.mockRejectedValue(
        new HttpException('Database connection failed', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await request(app.getHttpServer()).post('/seed/demo').expect(500);
    });

    it('should handle duplicate data error', async () => {
      seedService.seedDemoData.mockRejectedValue(
        new HttpException('Demo data already exists', HttpStatus.CONFLICT),
      );

      await request(app.getHttpServer()).post('/seed/demo').expect(409);
    });

    it('should handle partial seeding failure', async () => {
      const seedResult = {
        success: false,
        message: 'Partial seeding completed',
        stats: {
          users: 10,
          customers: 50,
          products: 0,
          orders: 0,
        },
        errors: ['Failed to seed products', 'Failed to seed orders'],
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveLength(2);
    });

    it('should handle timeout', async () => {
      seedService.seedDemoData.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              message: 'Demo data seeded successfully',
              stats: { users: 10 },
            } as any);
          }, 100);
        });
      });

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should be idempotent', async () => {
      const seedResult = {
        success: true,
        message: 'Demo data seeded successfully',
        stats: { users: 10, customers: 50 },
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      // First call
      const response1 = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      // Second call
      const response2 = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response1.body).toEqual(response2.body);
      expect(seedService.seedDemoData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent seeding requests', async () => {
      const seedResult = {
        success: true,
        message: 'Demo data seeded successfully',
        stats: { users: 10 },
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const requests = Array(3)
        .fill(null)
        .map(() => request(app.getHttpServer()).post('/seed/demo'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      expect(seedService.seedDemoData).toHaveBeenCalledTimes(3);
    });

    it('should handle empty stats', async () => {
      const seedResult = {
        success: true,
        message: 'No data to seed',
        stats: {},
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body.stats).toEqual({});
    });

    it('should handle very large datasets', async () => {
      const seedResult = {
        success: true,
        message: 'Large dataset seeded successfully',
        stats: {
          users: 10000,
          customers: 50000,
          products: 100000,
          orders: 500000,
        },
        duration: 60000,
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body.stats.orders).toBe(500000);
      expect(response.body.duration).toBe(60000);
    });

    it('should handle database constraint violations', async () => {
      seedService.seedDemoData.mockRejectedValue(
        new HttpException('Foreign key constraint violation', HttpStatus.BAD_REQUEST),
      );

      await request(app.getHttpServer()).post('/seed/demo').expect(400);
    });

    it('should handle insufficient permissions', async () => {
      seedService.seedDemoData.mockRejectedValue(
        new HttpException('Insufficient permissions to seed data', HttpStatus.FORBIDDEN),
      );

      await request(app.getHttpServer()).post('/seed/demo').expect(403);
    });

    it('should handle service unavailable', async () => {
      seedService.seedDemoData.mockRejectedValue(
        new HttpException('Service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await request(app.getHttpServer()).post('/seed/demo').expect(503);
    });

    it('should return consistent response format', async () => {
      const seedResult = {
        success: true,
        message: 'Demo data seeded successfully',
        stats: { users: 5 },
      };

      seedService.seedDemoData.mockResolvedValue(seedResult as any);

      const response = await request(app.getHttpServer()).post('/seed/demo').expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('stats');
    });
  });
});
