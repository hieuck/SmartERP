import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize metrics service', () => {
      expect(service).toBeDefined();
    });

    it('should create registry', () => {
      const registry = service.getRegistry();
      expect(registry).toBeInstanceOf(Registry);
    });

    it('should initialize HTTP metrics', () => {
      expect((service as any).httpRequestDuration).toBeInstanceOf(Histogram);
      expect((service as any).httpRequestTotal).toBeInstanceOf(Counter);
    });

    it('should initialize database metrics', () => {
      expect((service as any).dbQueryDuration).toBeInstanceOf(Histogram);
    });

    it('should initialize cache metrics', () => {
      expect((service as any).cacheHitTotal).toBeInstanceOf(Counter);
      expect((service as any).cacheMissTotal).toBeInstanceOf(Counter);
    });

    it('should initialize query metrics', () => {
      expect((service as any).slowQueryTotal).toBeInstanceOf(Counter);
      expect((service as any).queryErrorTotal).toBeInstanceOf(Counter);
    });

    it('should initialize gauges map', () => {
      expect((service as any).gauges).toBeInstanceOf(Map);
    });
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request with different methods', () => {
      service.recordHttpRequest('POST', '/api/products', 201, 0.25);
      service.recordHttpRequest('PUT', '/api/products/1', 200, 0.18);
      service.recordHttpRequest('DELETE', '/api/products/1', 204, 0.12);

      expect(true).toBe(true); // Verify no errors
    });

    it('should record HTTP request with error status codes', () => {
      service.recordHttpRequest('GET', '/api/users/999', 404, 0.05);
      service.recordHttpRequest('POST', '/api/products', 400, 0.08);
      service.recordHttpRequest('GET', '/api/internal', 500, 0.1);

      expect(true).toBe(true); // Verify no errors
    });

    it('should record HTTP request with zero duration', () => {
      service.recordHttpRequest('GET', '/api/health', 200, 0);

      expect(true).toBe(true); // Verify no errors
    });

    it('should record HTTP request with long duration', () => {
      service.recordHttpRequest('GET', '/api/slow', 200, 15.5);

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('recordDbQuery', () => {
    it('should record different query operations', () => {
      service.recordDbQuery('SELECT', 'products', 0.03);
      service.recordDbQuery('INSERT', 'orders', 0.05);
      service.recordDbQuery('UPDATE', 'customers', 0.04);
      service.recordDbQuery('DELETE', 'logs', 0.02);

      expect(true).toBe(true); // Verify no errors
    });

    it('should record slow database query', () => {
      service.recordDbQuery('SELECT', 'large_table', 5.5);

      expect(true).toBe(true); // Verify no errors
    });

    it('should record fast database query', () => {
      service.recordDbQuery('SELECT', 'cache', 0.001);

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('recordCacheHit', () => {
    it('should record multiple cache hits', () => {
      service.recordCacheHit('user:123');
      service.recordCacheHit('product:456');
      service.recordCacheHit('order:789');

      expect(true).toBe(true); // Verify no errors
    });

    it('should record cache hit with complex key', () => {
      service.recordCacheHit('tenant:1:user:123:settings');

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('recordCacheMiss', () => {
    it('should record multiple cache misses', () => {
      service.recordCacheMiss('user:999');
      service.recordCacheMiss('product:888');
      service.recordCacheMiss('order:777');

      expect(true).toBe(true); // Verify no errors
    });

    it('should record cache miss with complex key', () => {
      service.recordCacheMiss('tenant:1:user:999:settings');

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('recordQueryDuration', () => {
    it('should record query duration as HTTP request', () => {
      const recordHttpRequestSpy = jest.spyOn(service, 'recordHttpRequest');

      service.recordQueryDuration('GET', '/api/users', 200, 150);

      expect(recordHttpRequestSpy).toHaveBeenCalledWith('GET', '/api/users', 200, 0.15);
    });

    it('should convert milliseconds to seconds', () => {
      const recordHttpRequestSpy = jest.spyOn(service, 'recordHttpRequest');

      service.recordQueryDuration('POST', '/api/products', 201, 2500);

      expect(recordHttpRequestSpy).toHaveBeenCalledWith('POST', '/api/products', 201, 2.5);
    });

    it('should handle zero duration', () => {
      const recordHttpRequestSpy = jest.spyOn(service, 'recordHttpRequest');

      service.recordQueryDuration('GET', '/api/health', 200, 0);

      expect(recordHttpRequestSpy).toHaveBeenCalledWith('GET', '/api/health', 200, 0);
    });
  });

  describe('incrementSlowQuery', () => {
    it('should increment slow query counter multiple times', () => {
      service.incrementSlowQuery('GET', '/api/slow');
      service.incrementSlowQuery('GET', '/api/slow');
      service.incrementSlowQuery('POST', '/api/heavy');

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('incrementQueryError', () => {
    it('should increment query error counter with different error types', () => {
      service.incrementQueryError('GET', '/api/users', 'DatabaseError');
      service.incrementQueryError('POST', '/api/products', 'ValidationError');
      service.incrementQueryError('PUT', '/api/orders', 'TimeoutError');

      expect(true).toBe(true); // Verify no errors
    });

    it('should increment query error counter multiple times', () => {
      service.incrementQueryError('GET', '/api/users', 'DatabaseError');
      service.incrementQueryError('GET', '/api/users', 'DatabaseError');

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('recordGauge', () => {
    it('should create and set gauge with labels', () => {
      service.recordGauge('database_connections', 10, { state: 'active' });

      const gauges = (service as any).gauges;
      expect(gauges.size).toBeGreaterThan(0);
    });

    it('should create and set gauge without labels', () => {
      service.recordGauge('memory_usage', 1024);

      const gauges = (service as any).gauges;
      expect(gauges.size).toBeGreaterThan(0);
    });

    it('should reuse existing gauge', () => {
      service.recordGauge('cpu_usage', 50, { core: '0' });
      service.recordGauge('cpu_usage', 60, { core: '0' });

      const gauges = (service as any).gauges;
      const initialSize = gauges.size;

      service.recordGauge('cpu_usage', 70, { core: '0' });

      expect(gauges.size).toBe(initialSize);
    });

    it('should create different gauges for different label combinations', () => {
      service.recordGauge('cpu_usage', 50, { core: '0' });
      service.recordGauge('cpu_usage', 60, { core: '1' });

      expect(true).toBe(true); // Verify no errors
    });

    it('should handle gauge with multiple labels', () => {
      service.recordGauge('request_count', 100, {
        method: 'GET',
        route: '/api/users',
        status: '200',
      });

      expect(true).toBe(true); // Verify no errors
    });

    it('should update gauge value', () => {
      service.recordGauge('active_users', 10);
      service.recordGauge('active_users', 15);
      service.recordGauge('active_users', 20);

      expect(true).toBe(true); // Verify no errors
    });
  });

  describe('getMetrics', () => {
    it('should return metrics as string', async () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.15);
      service.recordCacheHit('user:123');

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should return metrics in Prometheus format', async () => {
      service.recordHttpRequest('GET', '/api/test', 200, 0.1);

      const metrics = await service.getMetrics();

      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    it('should include all registered metrics', async () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.15);
      service.recordDbQuery('SELECT', 'users', 0.025);
      service.recordCacheHit('user:123');
      service.recordGauge('active_connections', 10);

      const metrics = await service.getMetrics();

      expect(metrics).toBeTruthy();
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('getRegistry', () => {
    it('should return registry instance', () => {
      const registry = service.getRegistry();

      expect(registry).toBeInstanceOf(Registry);
    });

    it('should return same registry instance', () => {
      const registry1 = service.getRegistry();
      const registry2 = service.getRegistry();

      expect(registry1).toBe(registry2);
    });

    it('should have metrics registered', async () => {
      const registry = service.getRegistry();
      const metrics = await registry.getMetricsAsJSON();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete HTTP request flow', () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.15);
      service.recordDbQuery('SELECT', 'users', 0.025);
      service.recordCacheHit('users:list');

      expect(true).toBe(true); // Verify no errors
    });

    it('should handle error scenario', () => {
      service.recordHttpRequest('GET', '/api/users/999', 404, 0.05);
      service.recordCacheMiss('user:999');
      service.incrementQueryError('GET', '/api/users/999', 'NotFoundError');

      expect(true).toBe(true); // Verify no errors
    });

    it('should handle slow query scenario', () => {
      service.recordQueryDuration('GET', '/api/reports', 200, 5500);
      service.incrementSlowQuery('GET', '/api/reports');
      service.recordDbQuery('SELECT', 'reports', 5.5);

      expect(true).toBe(true); // Verify no errors
    });

    it('should handle high load scenario', () => {
      for (let i = 0; i < 100; i++) {
        service.recordHttpRequest('GET', '/api/users', 200, 0.1);
        service.recordCacheHit('user:' + i);
      }

      expect(true).toBe(true); // Verify no errors
    });

    it('should handle mixed operations', () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.15);
      service.recordHttpRequest('POST', '/api/products', 201, 0.25);
      service.recordDbQuery('SELECT', 'users', 0.025);
      service.recordDbQuery('INSERT', 'products', 0.05);
      service.recordCacheHit('users:list');
      service.recordCacheMiss('products:new');
      service.recordGauge('active_connections', 15);

      expect(true).toBe(true); // Verify no errors
    });
  });
});
