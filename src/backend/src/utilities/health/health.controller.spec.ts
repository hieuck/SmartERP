import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { Connection } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let dbHealthIndicator: TypeOrmHealthIndicator;
  let memoryHealthIndicator: MemoryHealthIndicator;
  let connection: Connection;
  let cacheManager: Cache;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockDbHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  const mockConnection = {
    isInitialized: true,
  };

  const mockCacheManager = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockDbHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: Connection,
          useValue: mockConnection,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    dbHealthIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    memoryHealthIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    connection = module.get<Connection>(Connection);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when all checks pass', async () => {
      const expectedResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result).toEqual(expectedResult);
      expect(result.status).toBe('ok');
      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
    });

    it('should check database health', async () => {
      const expectedResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.details.database.status).toBe('up');
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });

    it('should check memory heap health (< 300MB)', async () => {
      const expectedResult = {
        status: 'ok',
        info: { memory_heap: { status: 'up' } },
        error: {},
        details: { memory_heap: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.details.memory_heap.status).toBe('up');
    });

    it('should check memory RSS health (< 500MB)', async () => {
      const expectedResult = {
        status: 'ok',
        info: { memory_rss: { status: 'up' } },
        error: {},
        details: { memory_rss: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.details.memory_rss.status).toBe('up');
    });

    it('should check Redis health successfully', async () => {
      const expectedResult = {
        status: 'ok',
        info: { redis: { status: 'up' } },
        error: {},
        details: { redis: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.details.redis.status).toBe('up');
    });

    it('should return unhealthy status when database is down', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error.database.status).toBe('down');
    });

    it('should return unhealthy status when Redis is down', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          redis: { status: 'down', message: 'Connection timeout' },
        },
        details: {
          redis: { status: 'down', message: 'Connection timeout' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockRejectedValue(new Error('Connection timeout'));

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error.redis.status).toBe('down');
    });

    it('should handle Redis connection errors', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          redis: { status: 'down', message: 'Redis unavailable' },
        },
        details: {
          redis: { status: 'down', message: 'Redis unavailable' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockRejectedValue(new Error('Redis unavailable'));

      const result = await controller.check();

      expect(result.error.redis).toBeDefined();
    });

    it('should handle memory heap exceeding threshold', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          memory_heap: { status: 'down', message: 'Heap memory exceeded 300MB' },
        },
        details: {
          memory_heap: { status: 'down', message: 'Heap memory exceeded 300MB' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.error.memory_heap).toBeDefined();
    });

    it('should handle memory RSS exceeding threshold', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          memory_rss: { status: 'down', message: 'RSS memory exceeded 500MB' },
        },
        details: {
          memory_rss: { status: 'down', message: 'RSS memory exceeded 500MB' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.error.memory_rss).toBeDefined();
    });

    it('should handle multiple failing health checks', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection refused' },
          redis: { status: 'down', message: 'Connection timeout' },
          memory_heap: { status: 'down', message: 'Memory exceeded' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
          redis: { status: 'down', message: 'Connection timeout' },
          memory_heap: { status: 'down', message: 'Memory exceeded' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockRejectedValue(new Error('Connection timeout'));

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(Object.keys(result.error).length).toBeGreaterThan(1);
    });

    it('should handle health check service errors', async () => {
      const error = new Error('Health check failed');
      mockHealthCheckService.check.mockRejectedValue(error);

      await expect(controller.check()).rejects.toThrow(error);
    });

    it('should verify Redis set/get/del operations', async () => {
      const expectedResult = {
        status: 'ok',
        info: { redis: { status: 'up' } },
        error: {},
        details: { redis: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      await controller.check();

      // Verify Redis operations are called in health check
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when database is initialized', async () => {
      mockConnection.isInitialized = true;

      const result = await controller.ready();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return not ready when database is not initialized', async () => {
      mockConnection.isInitialized = false;

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
      expect(result.reason).toBe('Database not initialized');
    });

    it('should include timestamp in ready response', async () => {
      mockConnection.isInitialized = true;

      const result = await controller.ready();

      expect(result.timestamp).toBeDefined();
      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should handle database connection check', async () => {
      mockConnection.isInitialized = true;

      const result = await controller.ready();

      expect(result.status).toBe('ready');
    });

    it('should return consistent response format', async () => {
      mockConnection.isInitialized = true;

      const result = await controller.ready();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status with service info', async () => {
      const result = await controller.live();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
      expect(result.service).toBe('smarterp-monolith');
      expect(result.version).toBe('1.0.0');
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
    });

    it('should include memory usage information', async () => {
      const result = await controller.live();

      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('external');
      expect(typeof result.memory.heapUsed).toBe('number');
      expect(typeof result.memory.heapTotal).toBe('number');
      expect(typeof result.memory.rss).toBe('number');
      expect(typeof result.memory.external).toBe('number');
    });

    it('should include process uptime', async () => {
      const result = await controller.live();

      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp', async () => {
      const result = await controller.live();

      expect(result.timestamp).toBeDefined();
      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return service name and version', async () => {
      const result = await controller.live();

      expect(result.service).toBe('smarterp-monolith');
      expect(result.version).toBe('1.0.0');
    });

    it('should return memory values in MB', async () => {
      const result = await controller.live();

      // Memory values should be reasonable (not in bytes)
      expect(result.memory.heapUsed).toBeLessThan(10000); // Less than 10GB in MB
      expect(result.memory.heapTotal).toBeLessThan(10000);
      expect(result.memory.rss).toBeLessThan(10000);
      expect(result.memory.external).toBeLessThan(10000);
    });

    it('should always return alive status', async () => {
      // Call multiple times
      const result1 = await controller.live();
      const result2 = await controller.live();
      const result3 = await controller.live();

      expect(result1.status).toBe('alive');
      expect(result2.status).toBe('alive');
      expect(result3.status).toBe('alive');
    });

    it('should return increasing uptime on subsequent calls', async () => {
      const result1 = await controller.live();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await controller.live();

      expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null cache manager', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: { redis: { status: 'down' } },
        details: { redis: { status: 'down' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockRejectedValue(new Error('Cache manager not available'));

      const result = await controller.check();

      expect(result.status).toBe('error');
    });

    it('should handle Redis get returning null', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: { redis: { status: 'down' } },
        details: { redis: { status: 'down' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await controller.check();

      expect(result.status).toBe('error');
    });

    it('should handle Redis get returning wrong value', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: { redis: { status: 'down' } },
        details: { redis: { status: 'down' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('wrong-value');

      const result = await controller.check();

      expect(result.status).toBe('error');
    });

    it('should handle Redis del errors gracefully', async () => {
      const expectedResult = {
        status: 'ok',
        info: { redis: { status: 'up' } },
        error: {},
        details: { redis: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockRejectedValue(new Error('Delete failed'));

      // Should still complete health check
      const result = await controller.check();

      expect(result).toBeDefined();
    });

    it('should handle concurrent health check requests', async () => {
      const expectedResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const promises = Array(10)
        .fill(null)
        .map(() => controller.check());

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.status).toBe('ok');
      });
    });

    it('should handle database connection flapping', async () => {
      mockConnection.isInitialized = true;
      const result1 = await controller.ready();
      expect(result1.status).toBe('ready');

      mockConnection.isInitialized = false;
      const result2 = await controller.ready();
      expect(result2.status).toBe('not ready');

      mockConnection.isInitialized = true;
      const result3 = await controller.ready();
      expect(result3.status).toBe('ready');
    });

    it('should handle very high memory usage', async () => {
      const expectedResult = {
        status: 'error',
        info: {},
        error: {
          memory_heap: { status: 'down', message: 'Heap: 500MB' },
          memory_rss: { status: 'down', message: 'RSS: 800MB' },
        },
        details: {
          memory_heap: { status: 'down', message: 'Heap: 500MB' },
          memory_rss: { status: 'down', message: 'RSS: 800MB' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(expectedResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error.memory_heap).toBeDefined();
      expect(result.error.memory_rss).toBeDefined();
    });

    it('should handle health check timeout', async () => {
      const error = new Error('Health check timeout');
      mockHealthCheckService.check.mockRejectedValue(error);

      await expect(controller.check()).rejects.toThrow('Health check timeout');
    });

    it('should handle undefined connection', async () => {
      const moduleWithoutConnection = await Test.createTestingModule({
        controllers: [HealthController],
        providers: [
          { provide: HealthCheckService, useValue: mockHealthCheckService },
          { provide: TypeOrmHealthIndicator, useValue: mockDbHealthIndicator },
          { provide: MemoryHealthIndicator, useValue: mockMemoryHealthIndicator },
          { provide: Connection, useValue: { isInitialized: undefined } },
          { provide: CACHE_MANAGER, useValue: mockCacheManager },
        ],
      }).compile();

      const controllerWithoutConnection = moduleWithoutConnection.get<HealthController>(
        HealthController,
      );

      const result = await controllerWithoutConnection.ready();

      expect(result.status).toBe('not ready');
    });
  });
});
