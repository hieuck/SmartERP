/**
 * MetricsController (Logger) Integration Tests
 * Coverage target: 95%+
 *
 * Test cases:
 * 1. GET /metrics - Get Prometheus-compatible metrics
 * 2. GET /metrics/app - Get application-specific metrics
 * 3. Metrics format validation
 * 4. Uptime formatting
 * 5. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MetricsController } from './metrics.controller';

describe('MetricsController (Logger) (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /metrics', () => {
    it('should return Prometheus-compatible metrics', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toContain('# HELP nodejs_memory_heap_used_bytes');
      expect(response.text).toContain('# TYPE nodejs_memory_heap_used_bytes gauge');
      expect(response.text).toContain('nodejs_memory_heap_used_bytes');
      expect(response.text).toContain('nodejs_memory_heap_total_bytes');
      expect(response.text).toContain('nodejs_memory_rss_bytes');
      expect(response.text).toContain('nodejs_cpu_user_microseconds');
      expect(response.text).toContain('nodejs_process_uptime_seconds');
    });

    it('should return valid numeric values', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      const lines = response.text.split('\n');
      const metricLines = lines.filter((line) => !line.startsWith('#') && line.trim());

      metricLines.forEach((line) => {
        const parts = line.split(' ');
        const value = parseFloat(parts[parts.length - 1]);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(isNaN(value)).toBe(false);
      });
    });

    it('should be publicly accessible (no auth required)', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toContain('nodejs_memory');
    });

    it('should return consistent format', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      const lines = response.text.split('\n');
      const helpLines = lines.filter((line) => line.startsWith('# HELP'));
      const typeLines = lines.filter((line) => line.startsWith('# TYPE'));

      expect(helpLines.length).toBeGreaterThan(0);
      expect(typeLines.length).toBeGreaterThan(0);
      expect(helpLines.length).toBe(typeLines.length);
    });
  });

  describe('GET /metrics/app', () => {
    it('should return application-specific metrics in JSON format', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('process');
    });

    it('should return correct service information', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.service).toBe('smarterp-monolith');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should return valid uptime information', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.uptime).toHaveProperty('seconds');
      expect(response.body.uptime).toHaveProperty('formatted');
      expect(response.body.uptime.seconds).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.uptime.formatted).toBe('string');
    });

    it('should return memory metrics in bytes and MB', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('external');

      expect(response.body.memory.heapUsed).toHaveProperty('bytes');
      expect(response.body.memory.heapUsed).toHaveProperty('mb');
      expect(response.body.memory.heapUsed.bytes).toBeGreaterThan(0);
      expect(response.body.memory.heapUsed.mb).toBeGreaterThan(0);
    });

    it('should return CPU metrics', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.cpu).toHaveProperty('user');
      expect(response.body.cpu).toHaveProperty('system');
      expect(response.body.cpu.user).toHaveProperty('microseconds');
      expect(response.body.cpu.user).toHaveProperty('seconds');
      expect(response.body.cpu.user.microseconds).toBeGreaterThanOrEqual(0);
    });

    it('should return process information', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.process).toHaveProperty('pid');
      expect(response.body.process).toHaveProperty('platform');
      expect(response.body.process).toHaveProperty('arch');
      expect(response.body.process).toHaveProperty('nodeVersion');
      expect(response.body.process.pid).toBeGreaterThan(0);
      expect(typeof response.body.process.platform).toBe('string');
    });

    it('should format uptime correctly for seconds', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      const formatted = response.body.uptime.formatted;
      expect(formatted).toMatch(/\d+[dhms]/);
    });

    it('should be publicly accessible (no auth required)', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      expect(response.body.service).toBe('smarterp-monolith');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests to /metrics', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/metrics'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toContain('nodejs_memory');
      });
    });

    it('should handle concurrent requests to /metrics/app', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/metrics/app'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.service).toBe('smarterp-monolith');
      });
    });

    it('should return different values over time', async () => {
      const response1 = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      // Timestamps should be different
      expect(response1.body.timestamp).not.toBe(response2.body.timestamp);
    });

    it('should handle memory values correctly', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      // Heap used should be less than heap total
      expect(response.body.memory.heapUsed.bytes).toBeLessThanOrEqual(
        response.body.memory.heapTotal.bytes,
      );

      // MB conversion should be correct
      const expectedMb = Math.round(response.body.memory.heapUsed.bytes / 1024 / 1024);
      expect(response.body.memory.heapUsed.mb).toBe(expectedMb);
    });

    it('should format uptime with multiple units', async () => {
      const response = await request(app.getHttpServer()).get('/metrics/app').expect(200);

      const formatted = response.body.uptime.formatted;

      // Should contain at least one time unit
      expect(formatted).toMatch(/[dhms]/);

      // Should not have leading/trailing spaces
      expect(formatted.trim()).toBe(formatted);
    });
  });
});
