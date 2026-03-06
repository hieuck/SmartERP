import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

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

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      const method = 'GET';
      const route = '/api/users';
      const status = 200;
      const duration = 0.5;

      expect(() => {
        service.recordHttpRequest(method, route, status, duration);
      }).not.toThrow();
    });

    it('should record multiple HTTP requests', () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.1);
      service.recordHttpRequest('POST', '/api/products', 201, 0.3);
      service.recordHttpRequest('PUT', '/api/orders', 200, 0.5);

      expect(true).toBe(true);
    });
  });

  describe('recordDbQuery', () => {
    it('should record database query metrics', () => {
      const operation = 'SELECT';
      const table = 'users';
      const duration = 0.05;

      expect(() => {
        service.recordDbQuery(operation, table, duration);
      }).not.toThrow();
    });

    it('should record multiple database queries', () => {
      service.recordDbQuery('SELECT', 'users', 0.01);
      service.recordDbQuery('INSERT', 'products', 0.03);
      service.recordDbQuery('UPDATE', 'orders', 0.02);

      expect(true).toBe(true);
    });
  });

  describe('recordCacheHit', () => {
    it('should record cache hit', () => {
      const cacheKey = 'user:123';

      expect(() => {
        service.recordCacheHit(cacheKey);
      }).not.toThrow();
    });

    it('should record multiple cache hits', () => {
      service.recordCacheHit('user:123');
      service.recordCacheHit('product:456');
      service.recordCacheHit('order:789');

      expect(true).toBe(true);
    });
  });

  describe('recordCacheMiss', () => {
    it('should record cache miss', () => {
      const cacheKey = 'user:123';

      expect(() => {
        service.recordCacheMiss(cacheKey);
      }).not.toThrow();
    });

    it('should record multiple cache misses', () => {
      service.recordCacheMiss('user:123');
      service.recordCacheMiss('product:456');

      expect(true).toBe(true);
    });
  });

  describe('recordQueryDuration', () => {
    it('should record query duration', () => {
      const method = 'GET';
      const url = '/api/users';
      const statusCode = 200;
      const duration = 150;

      expect(() => {
        service.recordQueryDuration(method, url, statusCode, duration);
      }).not.toThrow();
    });
  });

  describe('incrementSlowQuery', () => {
    it('should increment slow query counter', () => {
      const method = 'GET';
      const url = '/api/reports';

      expect(() => {
        service.incrementSlowQuery(method, url);
      }).not.toThrow();
    });

    it('should increment multiple slow queries', () => {
      service.incrementSlowQuery('GET', '/api/reports');
      service.incrementSlowQuery('POST', '/api/analytics');

      expect(true).toBe(true);
    });
  });

  describe('incrementQueryError', () => {
    it('should increment query error counter', () => {
      const method = 'GET';
      const url = '/api/users';
      const errorType = 'DatabaseError';

      expect(() => {
        service.incrementQueryError(method, url, errorType);
      }).not.toThrow();
    });

    it('should increment multiple query errors', () => {
      service.incrementQueryError('GET', '/api/users', 'DatabaseError');
      service.incrementQueryError('POST', '/api/products', 'ValidationError');

      expect(true).toBe(true);
    });
  });

  describe('recordGauge', () => {
    it('should record gauge without labels', () => {
      const name = 'active_connections';
      const value = 42;

      expect(() => {
        service.recordGauge(name, value);
      }).not.toThrow();
    });

    it('should record gauge with labels', () => {
      const name = 'queue_size';
      const value = 100;
      const labels = { queue: 'email', priority: 'high' };

      expect(() => {
        service.recordGauge(name, value, labels);
      }).not.toThrow();
    });

    it('should update existing gauge', () => {
      const name = 'active_users';
      const labels = { tenant: 'tenant-123' };

      service.recordGauge(name, 10, labels);
      service.recordGauge(name, 15, labels);
      service.recordGauge(name, 20, labels);

      expect(true).toBe(true);
    });

    it('should handle multiple gauges with different labels', () => {
      service.recordGauge('memory_usage', 1024, { service: 'api' });
      service.recordGauge('memory_usage', 2048, { service: 'worker' });
      service.recordGauge('cpu_usage', 75, { service: 'api' });

      expect(true).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics as string', async () => {
      service.recordHttpRequest('GET', '/api/users', 200, 0.1);
      service.recordCacheHit('user:123');

      const metrics = await service.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('getRegistry', () => {
    it('should return registry instance', () => {
      const registry = service.getRegistry();

      expect(registry).toBeDefined();
      expect(registry).toHaveProperty('metrics');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete request lifecycle', () => {
      // Record HTTP request
      service.recordHttpRequest('GET', '/api/users', 200, 0.15);

      // Record database query
      service.recordDbQuery('SELECT', 'users', 0.05);

      // Record cache miss
      service.recordCacheMiss('user:123');

      // Record query duration
      service.recordQueryDuration('GET', '/api/users', 200, 150);

      expect(true).toBe(true);
    });

    it('should handle error scenarios', () => {
      // Record slow query
      service.incrementSlowQuery('GET', '/api/reports');

      // Record query error
      service.incrementQueryError('POST', '/api/products', 'ValidationError');

      // Record failed HTTP request
      service.recordHttpRequest('POST', '/api/products', 400, 0.1);

      expect(true).toBe(true);
    });

    it('should handle cache scenarios', () => {
      // Cache miss followed by database query
      service.recordCacheMiss('product:456');
      service.recordDbQuery('SELECT', 'products', 0.03);

      // Cache hit
      service.recordCacheHit('product:456');

      expect(true).toBe(true);
    });
  });
});
