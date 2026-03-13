import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

/**
 * Performance Test Suite
 * 
 * Tests API response times to ensure < 200ms (p95) requirement
 * Run with: npm run test:e2e -- api-performance.spec.ts
 */
describe('API Performance Tests (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  const tenantId = 'test-tenant';

  // Performance thresholds
  const THRESHOLDS = {
    fast: 50, // < 50ms for cached/simple queries
    normal: 200, // < 200ms for most endpoints (p95 requirement)
    slow: 500, // < 500ms for complex queries
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper function to measure response time
   */
  const measureResponseTime = async (
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    body?: any,
  ): Promise<number> => {
    const startTime = Date.now();

    const req = request(app.getHttpServer())[method](endpoint)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-tenant-id', tenantId);

    if (body) {
      req.send(body);
    }

    await req;

    return Date.now() - startTime;
  };

  /**
   * Run multiple requests and calculate statistics
   */
  const runBenchmark = async (
    name: string,
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    iterations: number = 10,
    body?: any,
  ) => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const time = await measureResponseTime(method, endpoint, body);
      times.push(time);
    }

    // Calculate statistics
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    console.log(`\n📊 ${name}:`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Avg: ${avg.toFixed(2)}ms`);
    console.log(`   P50: ${p50}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms`);
    console.log(`   Max: ${max}ms`);

    return { avg, min, max, p50, p95, p99 };
  };

  describe('Product Catalog Performance', () => {
    it('should list products < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /product-catalog',
        'get',
        '/product-catalog?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should search products < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /product-catalog/search',
        'get',
        '/product-catalog/search?query=test&limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should get single product < 50ms (cached)', async () => {
      // First request to warm cache
      await measureResponseTime('get', '/product-catalog/1');

      // Measure cached request
      const stats = await runBenchmark(
        'GET /product-catalog/:id (cached)',
        'get',
        '/product-catalog/1',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.fast);
    });
  });

  describe('Order Performance', () => {
    it('should list orders < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /orders',
        'get',
        '/orders?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should get order statistics < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /orders/statistics',
        'get',
        '/orders/statistics',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });
  });

  describe('Report Performance', () => {
    it('should list reports < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /reports',
        'get',
        '/reports?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should execute simple report < 500ms (p95)', async () => {
      const stats = await runBenchmark(
        'POST /reports/:id/execute',
        'post',
        '/reports/1/execute',
        5, // Fewer iterations for expensive operation
        { parameters: {} },
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.slow);
    });
  });

  describe('Project Management Performance', () => {
    it('should list projects < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /projects',
        'get',
        '/projects?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should get project statistics < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /projects/statistics',
        'get',
        '/projects/statistics',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });
  });

  describe('Accounting Performance', () => {
    it('should list accounts < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /accounts',
        'get',
        '/accounts?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should get trial balance < 500ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /accounting/trial-balance',
        'get',
        '/accounting/trial-balance',
        5,
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.slow);
    });
  });

  describe('HR Performance', () => {
    it('should list employees < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /employees',
        'get',
        '/employees?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should list attendance < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /attendance',
        'get',
        '/attendance?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });
  });

  describe('Manufacturing Performance', () => {
    it('should list work orders < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /work-orders',
        'get',
        '/work-orders?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });

    it('should list BOMs < 200ms (p95)', async () => {
      const stats = await runBenchmark(
        'GET /boms',
        'get',
        '/boms?limit=20',
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.normal);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent requests < 300ms (p95)', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => measureResponseTime('get', '/product-catalog?limit=20'));

      const startTime = Date.now();
      const times = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];

      console.log(`\n📊 10 Concurrent Requests:`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Avg response: ${avg.toFixed(2)}ms`);
      console.log(`   P95 response: ${p95}ms`);

      expect(p95).toBeLessThan(300);
    });
  });

  describe('Cache Effectiveness', () => {
    it('should show significant improvement with cache', async () => {
      // Clear cache first (if possible)
      // Measure uncached request
      const uncachedTime = await measureResponseTime(
        'get',
        '/product-catalog/1',
      );

      // Measure cached request
      const cachedTime = await measureResponseTime('get', '/product-catalog/1');

      console.log(`\n📊 Cache Effectiveness:`);
      console.log(`   Uncached: ${uncachedTime}ms`);
      console.log(`   Cached: ${cachedTime}ms`);
      console.log(
        `   Improvement: ${((1 - cachedTime / uncachedTime) * 100).toFixed(1)}%`,
      );

      // Cached should be at least 30% faster
      expect(cachedTime).toBeLessThan(uncachedTime * 0.7);
    });
  });
});
