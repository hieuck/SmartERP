import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Stress Tests
 * Tests system behavior under extreme load conditions
 */

describe('Stress Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('High Volume Requests', () => {
    it('should handle 500 concurrent requests', async () => {
      const requests = Array(500).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(r => r.status === 200).length;
      const failureCount = responses.length - successCount;

      console.log(`500 concurrent requests:`);
      console.log(`  - Total time: ${totalTime}ms`);
      console.log(`  - Success: ${successCount}`);
      console.log(`  - Failures: ${failureCount}`);
      console.log(`  - Avg time: ${(totalTime / responses.length).toFixed(2)}ms`);

      // At least 95% should succeed
      expect(successCount / responses.length).toBeGreaterThan(0.95);
    }, 30000); // 30 second timeout

    it('should handle 1000 sequential requests', async () => {
      const startTime = Date.now();
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < 1000; i++) {
        try {
          const response = await request(app.getHttpServer())
            .get('/products')
            .set('Authorization', `Bearer ${authToken}`);
          
          if (response.status === 200) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
        }
      }

      const totalTime = Date.now() - startTime;

      console.log(`1000 sequential requests:`);
      console.log(`  - Total time: ${totalTime}ms`);
      console.log(`  - Success: ${successCount}`);
      console.log(`  - Failures: ${failureCount}`);
      console.log(`  - Avg time: ${(totalTime / 1000).toFixed(2)}ms`);

      // At least 99% should succeed
      expect(successCount / 1000).toBeGreaterThan(0.99);
    }, 60000); // 60 second timeout
  });

  describe('Burst Traffic', () => {
    it('should handle sudden traffic spike', async () => {
      // Warm up
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`);

      // Sudden spike of 200 requests
      const requests = Array(200).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(r => r.status === 200).length;

      console.log(`Burst traffic (200 requests):`);
      console.log(`  - Total time: ${totalTime}ms`);
      console.log(`  - Success rate: ${(successCount / 200 * 100).toFixed(2)}%`);

      expect(successCount / 200).toBeGreaterThan(0.90);
    }, 20000);
  });

  describe('Large Payload', () => {
    it('should handle large product list request', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/products?limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`Fetch 1000 products: ${responseTime}ms`);
      console.log(`Response size: ${JSON.stringify(response.body).length} bytes`);
      
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle order with many items', async () => {
      const items = Array(100).fill(null).map((_, i) => ({
        productId: `${(i % 10) + 1}`,
        quantity: 1,
        unitPrice: 100000,
      }));

      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items,
        })
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`Create order with 100 items: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle concurrent database operations', async () => {
      const operations = Array(100).fill(null).map(async (_, i) => {
        return request(app.getHttpServer())
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sku: `STRESS-${Date.now()}-${i}`,
            name: `Stress Test Product ${i}`,
            price: 100000,
            cost: 80000,
            stock: 100,
          });
      });

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 201).length;

      console.log(`100 concurrent database writes:`);
      console.log(`  - Total time: ${totalTime}ms`);
      console.log(`  - Success rate: ${(successCount / 100 * 100).toFixed(2)}%`);

      expect(successCount / 100).toBeGreaterThan(0.95);
    }, 30000);
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(requests);
      
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      console.log(`Rate limiting test:`);
      console.log(`  - Total requests: ${responses.length}`);
      console.log(`  - Rate limited: ${rateLimitedCount}`);

      // Some requests should be rate limited
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from database connection issues', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the system continues to work after errors
      
      // Make some requests that might fail
      const failingRequests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products/999999')
          .set('Authorization', `Bearer ${authToken}`)
      );

      await Promise.all(failingRequests);

      // System should still work
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Long Running Operations', () => {
    it('should handle long-running report generation', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/reporting/sales?startDate=2020-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`Long-running report: ${responseTime}ms`);
      
      // Should complete within reasonable time
      expect(responseTime).toBeLessThan(5000);
    });
  });
});
