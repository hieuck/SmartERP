import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Performance Load Tests
 * Tests system behavior under various load conditions
 */

describe('Performance Load Tests', () => {
  let app: INestApplication;
  let authToken: string;

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
        email: 'admin@example.com',
        password: 'Admin123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Response Time', () => {
    it('should respond to GET /products within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
      
      console.log(`GET /products response time: ${responseTime}ms`);
    });

    it('should respond to GET /orders within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
      
      console.log(`GET /orders response time: ${responseTime}ms`);
    });

    it('should respond to GET /dashboard/overview within 150ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(150);
      
      console.log(`GET /dashboard/overview response time: ${responseTime}ms`);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle 10 concurrent GET requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`10 concurrent requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle 50 concurrent GET requests', async () => {
      const requests = Array(50).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`50 concurrent requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(3000);
    });

    it('should handle 100 concurrent GET requests', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`100 concurrent requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Database Query Performance', () => {
    it('should fetch products with pagination efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/products?page=1&limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body.data).toBeDefined();
      expect(responseTime).toBeLessThan(200);
      
      console.log(`Fetch 100 products: ${responseTime}ms`);
    });

    it('should search products efficiently', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/products?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(150);
      
      console.log(`Search products: ${responseTime}ms`);
    });

    it('should fetch order with items efficiently', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/orders/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
      
      console.log(`Fetch order with items: ${responseTime}ms`);
    });
  });

  describe('Write Operations Performance', () => {
    it('should create product within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: `PERF-${Date.now()}`,
          name: 'Performance Test Product',
          price: 100000,
          cost: 80000,
          stock: 100,
        })
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
      
      console.log(`Create product: ${responseTime}ms`);
    });

    it('should update product within 150ms', async () => {
      // Create product first
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: `PERF-UPDATE-${Date.now()}`,
          name: 'Product to Update',
          price: 100000,
          cost: 80000,
          stock: 100,
        });

      const productId = createResponse.body.id;

      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Product Name',
        })
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(150);
      
      console.log(`Update product: ${responseTime}ms`);
    });
  });

  describe('Complex Operations Performance', () => {
    it('should create order with items within 300ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items: [
            { productId: '1', quantity: 5, unitPrice: 100000 },
            { productId: '2', quantity: 3, unitPrice: 150000 },
          ],
        })
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(300);
      
      console.log(`Create order with items: ${responseTime}ms`);
    });

    it('should generate dashboard overview within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
      
      console.log(`Dashboard overview: ${responseTime}ms`);
    });

    it('should generate sales report within 500ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/reporting/sales?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
      
      console.log(`Sales report: ${responseTime}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${authToken}`);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      
      console.log(`Memory increase after 1000 requests: ${memoryIncrease.toFixed(2)}MB`);
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });
});
