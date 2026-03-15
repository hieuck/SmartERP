/**
 * MetricsController Integration Tests
 * Coverage target: 95%+
 * 
 * Test cases:
 * 1. GET /metrics - Get Prometheus metrics
 * 2. Content-Type header validation
 * 3. Metrics format validation
 * 4. Edge cases and error scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpException, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { MetricsController } from './metrics.controller';
import { MetricsService } from '../metrics/metrics.service';

describe('MetricsController (Integration)', () => {
  let app: INestApplication;
  let metricsService: jest.Mocked<MetricsService>;

  const mockPrometheusMetrics = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 200
http_request_duration_seconds_sum 50.5
http_request_duration_seconds_count 250

# HELP nodejs_memory_heap_used_bytes Memory heap used
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes 50000000
  `.trim();

  beforeAll(async () => {
    const mockMetricsService = {
      getMetrics: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    metricsService = moduleFixture.get(MetricsService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics with correct content type', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe(mockPrometheusMetrics);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(metricsService.getMetrics).toHaveBeenCalled();
    });

    it('should return metrics in Prometheus format', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('http_requests_total');
    });

    it('should return empty metrics when no data', async () => {
      metricsService.getMetrics.mockResolvedValue('');

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe('');
    });

    it('should handle service errors', async () => {
      metricsService.getMetrics.mockRejectedValue(
        new HttpException('Metrics service unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await request(app.getHttpServer())
        .get('/metrics')
        .expect(503);
    });

    it('should handle concurrent requests', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const requests = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/metrics'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('text/plain');
      });

      expect(metricsService.getMetrics).toHaveBeenCalledTimes(10);
    });

    it('should return different metrics over time', async () => {
      const metrics1 = 'http_requests_total 100';
      const metrics2 = 'http_requests_total 200';

      metricsService.getMetrics.mockResolvedValueOnce(metrics1);
      metricsService.getMetrics.mockResolvedValueOnce(metrics2);

      const response1 = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response1.text).toBe(metrics1);
      expect(response2.text).toBe(metrics2);
    });

    it('should handle very large metrics output', async () => {
      const largeMetrics = Array(1000)
        .fill(null)
        .map((_, i) => `metric_${i} ${i}`)
        .join('\n');

      metricsService.getMetrics.mockResolvedValue(largeMetrics);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe(largeMetrics);
    });

    it('should handle special characters in metrics', async () => {
      const metricsWithSpecialChars = `
# HELP test_metric Test metric with special chars
# TYPE test_metric gauge
test_metric{label="value with spaces",other="special@#$%"} 123
      `.trim();

      metricsService.getMetrics.mockResolvedValue(metricsWithSpecialChars);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('special@#$%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle timeout gracefully', async () => {
      metricsService.getMetrics.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockPrometheusMetrics), 100);
        });
      });

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe(mockPrometheusMetrics);
    });

    it('should handle null response', async () => {
      metricsService.getMetrics.mockResolvedValue(null as any);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe('');
    });

    it('should handle undefined response', async () => {
      metricsService.getMetrics.mockResolvedValue(undefined as any);

      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toBe('');
    });
  });
});
