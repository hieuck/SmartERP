/**
 * CsrfController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. GET /csrf-token - Generate CSRF token successfully
 * 2. GET /csrf-token - Set token in cookie with correct options
 * 3. GET /csrf-token - Return token in response body
 * 4. GET /csrf-token - Generate unique tokens on each request
 * 5. GET /csrf-token - Set httpOnly cookie flag
 * 6. GET /csrf-token - Set secure flag in production
 * 7. GET /csrf-token - Set sameSite strict
 * 8. GET /csrf-token - Set correct maxAge (24 hours)
 * 9. GET /csrf-token - Skip CSRF validation (public endpoint)
 * 10. GET /csrf-token - Handle concurrent requests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CsrfController } from './csrf.controller';

describe('CsrfController (Integration)', () => {
  let app: INestApplication;
  let originalNodeEnv: string | undefined;

  beforeAll(async () => {
    originalNodeEnv = process.env.NODE_ENV;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CsrfController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await app.close();
  });

  describe('GET /csrf-token', () => {
    it('should generate CSRF token successfully', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      expect(response.body).toHaveProperty('csrfToken');
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should set CSRF token in cookie', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));
      expect(csrfCookie).toBeDefined();
    });

    it('should return token in response body', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens on each request', async () => {
      const response1 = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const response2 = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
    });

    it('should set httpOnly cookie flag', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      expect(csrfCookie).toContain('HttpOnly');
    });

    it('should set secure flag in production environment', async () => {
      process.env.NODE_ENV = 'production';

      // Recreate app with production environment
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [CsrfController],
      }).compile();

      const prodApp = moduleFixture.createNestApplication();
      await prodApp.init();

      const response = await request(prodApp.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      expect(csrfCookie).toContain('Secure');

      await prodApp.close();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not set secure flag in development environment', async () => {
      process.env.NODE_ENV = 'development';

      // Recreate app with development environment
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [CsrfController],
      }).compile();

      const devApp = moduleFixture.createNestApplication();
      await devApp.init();

      const response = await request(devApp.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      // In development, Secure flag should not be present
      expect(csrfCookie).not.toContain('Secure');

      await devApp.close();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should set sameSite strict', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      expect(csrfCookie).toContain('SameSite=Strict');
    });

    it('should set correct maxAge (24 hours)', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      // 24 hours = 86400 seconds
      expect(csrfCookie).toContain('Max-Age=86400');
    });

    it('should be accessible without authentication', async () => {
      // No Authorization header
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      expect(response.body.csrfToken).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/csrf-token'));

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.csrfToken).toBeDefined();
      });

      // All tokens should be unique
      const tokens = responses.map((r) => r.body.csrfToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should generate cryptographically secure tokens', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const token = response.body.csrfToken;

      // Token should be 64 hex characters (32 bytes)
      expect(token).toMatch(/^[a-f0-9]{64}$/);

      // Token should not be predictable (no obvious patterns)
      expect(token).not.toMatch(/^0+$/);
      expect(token).not.toMatch(/^1+$/);
      expect(token).not.toMatch(/^(01)+$/);
    });

    it('should return token that matches cookie value', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const bodyToken = response.body.csrfToken;
      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      // Extract token from cookie
      const cookieToken = csrfCookie?.split(';')[0].split('=')[1];

      expect(bodyToken).toBe(cookieToken);
    });

    it('should have correct response structure', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      expect(Object.keys(response.body)).toEqual(['csrfToken']);
    });

    it('should handle rapid successive requests', async () => {
      const tokens: string[] = [];

      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

        tokens.push(response.body.csrfToken);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('should set cookie path to root', async () => {
      const response = await request(app.getHttpServer()).get('/csrf-token').expect(200);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrf-token='));

      // Default path should be /
      expect(csrfCookie).toContain('Path=/');
    });
  });
});
