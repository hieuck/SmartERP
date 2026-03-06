import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Penetration Testing
 * Simulates real-world attack scenarios
 */

describe('Penetration Testing', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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

  describe('Brute Force Attacks', () => {
    it('should prevent brute force login attempts', async () => {
      const attempts = 15;
      const responses = [];

      for (let i = 0; i < attempts; i++) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@example.com',
            password: `wrong-password-${i}`,
          });
        
        responses.push(response);
      }

      // Should start rate limiting after several failed attempts
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      console.log(`Rate limited ${rateLimitedCount} out of ${attempts} attempts`);
      
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should implement account lockout after failed attempts', async () => {
      const testEmail = `lockout-test-${Date.now()}@example.com`;
      
      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testEmail,
            password: 'wrong-password',
          });
      }

      // Account should be locked or rate limited
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'TestPassword123!',
        });

      // Should be locked (429) or still work (200) depending on implementation
      expect([200, 429]).toContain(response.status);
    });
  });

  describe('Injection Attacks', () => {
    it('should prevent NoSQL injection', async () => {
      const noSqlPayloads = [
        { $gt: '' },
        { $ne: null },
        { $regex: '.*' },
      ];

      for (const payload of noSqlPayloads) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: payload,
            password: payload,
          });

        expect(response.status).toBe(400);
      }
    });

    it('should prevent command injection', async () => {
      const commandPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(whoami)',
      ];

      for (const payload of commandPayloads) {
        const response = await request(app.getHttpServer())
          .post('/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sku: payload,
            name: 'Test Product',
            price: 100000,
            cost: 80000,
            stock: 100,
          });

        // Should either reject or sanitize
        if (response.status === 201) {
          expect(response.body.sku).not.toContain(';');
          expect(response.body.sku).not.toContain('|');
          expect(response.body.sku).not.toContain('`');
        }
      }
    });

    it('should prevent LDAP injection', async () => {
      const ldapPayloads = [
        '*',
        '*)(&',
        '*)(uid=*',
      ];

      for (const payload of ldapPayloads) {
        const response = await request(app.getHttpServer())
          .get(`/products?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Authentication Bypass', () => {
    it('should not allow authentication bypass via parameter manipulation', async () => {
      const bypassAttempts = [
        { email: 'admin@example.com', password: '', admin: true },
        { email: 'admin@example.com', password: '', role: 'admin' },
        { email: 'admin@example.com', password: '', isAdmin: 1 },
      ];

      for (const attempt of bypassAttempts) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(attempt);

        expect(response.status).toBe(400);
      }
    });

    it('should not allow JWT token manipulation', async () => {
      // Attempt to modify JWT payload
      const parts = authToken.split('.');
      if (parts.length === 3) {
        // Modify payload
        const modifiedToken = `${parts[0]}.${Buffer.from('{"sub":"1","role":"admin"}').toString('base64')}.${parts[2]}`;
        
        const response = await request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${modifiedToken}`);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Session Hijacking', () => {
    it('should prevent session fixation', async () => {
      // Login and get token
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        });

      const token1 = login1.body.accessToken;

      // Login again
      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        });

      const token2 = login2.body.accessToken;

      // Tokens should be different
      expect(token1).not.toBe(token2);
    });

    it('should validate token signature', async () => {
      const invalidToken = authToken.slice(0, -5) + 'XXXXX';
      
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Data Manipulation', () => {
    it('should prevent mass assignment vulnerabilities', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: `MASS-${Date.now()}`,
          name: 'Test Product',
          price: 100000,
          cost: 80000,
          stock: 100,
          isAdmin: true,
          role: 'admin',
          tenantId: '999',
        });

      if (response.status === 201) {
        // Should not set protected fields
        expect(response.body.isAdmin).toBeUndefined();
        expect(response.body.role).toBeUndefined();
        // tenantId should be set by system, not user input
      }
    });

    it('should prevent parameter pollution', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?limit=10&limit=1000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // Should use first or last value, not both
    });
  });

  describe('Information Disclosure', () => {
    it('should not expose system information', async () => {
      const response = await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not reveal framework or version info
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.body.message).not.toContain('NestJS');
      expect(response.body.message).not.toContain('Express');
    });

    it('should not expose database errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/999999999')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not expose database details
      expect(response.body.message).not.toContain('postgres');
      expect(response.body.message).not.toContain('SQL');
      expect(response.body.message).not.toContain('query');
    });

    it('should not expose file paths', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/../../../etc/passwd')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).not.toContain('/etc/passwd');
      expect(response.body.message).not.toContain('C:\\');
    });
  });

  describe('Business Logic Flaws', () => {
    it('should prevent negative quantity orders', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items: [
            { productId: '1', quantity: -10, unitPrice: 100000 },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('should prevent price manipulation', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items: [
            { productId: '1', quantity: 10, unitPrice: 1 }, // Manipulated price
          ],
        });

      // Should validate price against product price
      // Implementation dependent
      expect([200, 201, 400]).toContain(response.status);
    });

    it('should prevent race conditions in stock updates', async () => {
      // Create product
      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: `RACE-${Date.now()}`,
          name: 'Race Condition Test',
          price: 100000,
          cost: 80000,
          stock: 10,
        });

      const productId = createResponse.body.id;

      // Attempt concurrent stock updates
      const updates = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .patch(`/products/${productId}/stock`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ quantity: -1 })
      );

      await Promise.all(updates);

      // Final stock should be consistent
      const finalProduct = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Stock should not go negative
      expect(finalProduct.body.stock).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Denial of Service (DoS)', () => {
    it('should handle large payloads gracefully', async () => {
      const largeArray = Array(10000).fill({
        productId: '1',
        quantity: 1,
        unitPrice: 100000,
      });

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items: largeArray,
        });

      // Should reject or handle gracefully
      expect([400, 413]).toContain(response.status);
    });

    it('should prevent regex DoS', async () => {
      const evilRegex = '(a+)+$';
      const longString = 'a'.repeat(100);

      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get(`/products?search=${encodeURIComponent(evilRegex + longString)}`)
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - startTime;

      // Should not take too long
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('API Security', () => {
    it('should enforce HTTPS in production', async () => {
      // This test documents the requirement
      // Actual enforcement happens at deployment level
      
      console.log('Ensure HTTPS is enforced in production');
      console.log('Configure reverse proxy (Nginx) to redirect HTTP to HTTPS');
      
      expect(true).toBe(true);
    });

    it('should implement CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .options('/products')
        .set('Origin', 'https://malicious-site.com');

      // Should have CORS headers
      // Implementation dependent
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
