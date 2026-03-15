/**
 * MetricsController Integration Tests
 * Coverage target: 95%
 *
 * Test cases:
 * 1. GET /metrics - Get Prometheus metrics successfully
 * 2. GET /metrics - Return correct Content-Type header
 * 3. GET /metrics - Handle service errors gracefully
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController (Integration)', () => {
  let app: INestApplication;
  let metricsService: jest.Mocked<MetricsService>;

  const mockPrometheusMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
http_requests_total{method="POST",status="201"} 567

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 250
http_request_duration_seconds_bucket{le="1"} 400
http_request_duration_seconds_sum 450.5
http_request_duration_seconds_count 500

# HELP nodejs_heap_size_used_bytes Node.js heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 12345678
`;

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
    it('should return Prometheus metrics successfully', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toBe(mockPrometheusMetrics);
      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return correct Content-Type header (text/plain)', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should return metrics with counter data', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('counter');
    });

    it('should return metrics with histogram data', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toContain('http_request_duration_seconds');
      expect(response.text).toContain('histogram');
    });

    it('should return metrics with gauge data', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toContain('nodejs_heap_size_used_bytes');
      expect(response.text).toContain('gauge');
    });

    it('should return empty metrics when no data', async () => {
      metricsService.getMetrics.mockResolvedValue('');

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toBe('');
    });

    it('should handle service errors gracefully', async () => {
      metricsService.getMetrics.mockRejectedValue(new Error('Metrics collection failed'));

      await request(app.getHttpServer()).get('/metrics').expect(500);
    });

    it('should be accessible without authentication', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      // No Authorization header
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toBe(mockPrometheusMetrics);
    });

    it('should handle concurrent requests', async () => {
      metricsService.getMetrics.mockResolvedValue(mockPrometheusMetrics);

      const requests = Array(5)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/metrics'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toBe(mockPrometheusMetrics);
      });

      expect(metricsService.getMetrics).toHaveBeenCalledTimes(5);
    });

    it('should return fresh metrics on each request', async () => {
      const metrics1 = 'http_requests_total 100';
      const metrics2 = 'http_requests_total 200';

      metricsService.getMetrics.mockResolvedValueOnce(metrics1).mockResolvedValueOnce(metrics2);

      const response1 = await request(app.getHttpServer()).get('/metrics').expect(200);

      const response2 = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response1.text).toBe(metrics1);
      expect(response2.text).toBe(metrics2);
    });
  });
});
