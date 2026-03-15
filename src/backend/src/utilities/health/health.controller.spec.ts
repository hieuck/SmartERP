import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;
  let memoryHealthIndicator: jest.Mocked<MemoryHealthIndicator>;
  let diskHealthIndicator: jest.Mocked<DiskHealthIndicator>;

  const mockHealthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
      storage: { status: 'up' },
    },
    error: {},
    details: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
      storage: { status: 'up' },
    },
  };

  beforeEach(async () => {
    // Mock health check service to execute the check functions
    const mockHealthCheck = jest.fn().mockImplementation(async (checks) => {
      // Execute all check functions to trigger indicator calls
      await Promise.all(checks.map((check: () => Promise<any>) => check()));
      return mockHealthCheckResult;
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: mockHealthCheck,
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
            checkRSS: jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } }),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn().mockResolvedValue({ storage: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    dbHealthIndicator = module.get(TypeOrmHealthIndicator);
    memoryHealthIndicator = module.get(MemoryHealthIndicator);
    diskHealthIndicator = module.get(DiskHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should return overall health status', async () => {
      const result = await controller.check();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(healthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ]),
      );
    });

    it('should check database health', async () => {
      await controller.check();

      expect(dbHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });

    it('should check memory heap health', async () => {
      await controller.check();

      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024,
      );
    });

    it('should check memory RSS health', async () => {
      await controller.check();

      expect(memoryHealthIndicator.checkRSS).toHaveBeenCalledWith('memory_rss', 300 * 1024 * 1024);
    });

    it('should check disk storage health', async () => {
      await controller.check();

      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        thresholdPercent: 0.5,
      });
    });
  });

  describe('checkDatabase', () => {
    it('should return database health status', async () => {
      const result = await controller.checkDatabase();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(dbHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });

    it('should only check database', async () => {
      await controller.checkDatabase();

      expect(dbHealthIndicator.pingCheck).toHaveBeenCalledTimes(1);
      expect(memoryHealthIndicator.checkHeap).not.toHaveBeenCalled();
      expect(memoryHealthIndicator.checkRSS).not.toHaveBeenCalled();
      expect(diskHealthIndicator.checkStorage).not.toHaveBeenCalled();
    });
  });

  describe('checkMemory', () => {
    it('should return memory health status', async () => {
      const result = await controller.checkMemory();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    });

    it('should check both heap and RSS memory', async () => {
      await controller.checkMemory();

      expect(memoryHealthIndicator.checkHeap).toHaveBeenCalledWith(
        'memory_heap',
        150 * 1024 * 1024,
      );
      expect(memoryHealthIndicator.checkRSS).toHaveBeenCalledWith('memory_rss', 300 * 1024 * 1024);
    });

    it('should not check database or disk', async () => {
      await controller.checkMemory();

      expect(dbHealthIndicator.pingCheck).not.toHaveBeenCalled();
      expect(diskHealthIndicator.checkStorage).not.toHaveBeenCalled();
    });
  });

  describe('checkDisk', () => {
    it('should return disk health status', async () => {
      const result = await controller.checkDisk();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    });

    it('should check disk storage with correct threshold', async () => {
      await controller.checkDisk();

      expect(diskHealthIndicator.checkStorage).toHaveBeenCalledWith('storage', {
        path: '/',
        thresholdPercent: 0.5,
      });
    });

    it('should not check database or memory', async () => {
      await controller.checkDisk();

      expect(dbHealthIndicator.pingCheck).not.toHaveBeenCalled();
      expect(memoryHealthIndicator.checkHeap).not.toHaveBeenCalled();
      expect(memoryHealthIndicator.checkRSS).not.toHaveBeenCalled();
    });
  });

  describe('live', () => {
    it('should return liveness status', () => {
      const result = controller.live();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return ISO timestamp', () => {
      const result = controller.live();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it('should not call health check service', () => {
      controller.live();

      expect(healthCheckService.check).not.toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('should return readiness status', async () => {
      const result = await controller.ready();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    });

    it('should only check database for readiness', async () => {
      await controller.ready();

      expect(dbHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(memoryHealthIndicator.checkHeap).not.toHaveBeenCalled();
      expect(memoryHealthIndicator.checkRSS).not.toHaveBeenCalled();
      expect(diskHealthIndicator.checkStorage).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database connection failure', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      healthCheckService.check.mockResolvedValueOnce(errorResult);

      const result = await controller.checkDatabase();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('database');
    });

    it('should handle memory threshold exceeded', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          memory_heap: {
            status: 'down',
            message: 'Heap memory exceeded threshold',
          },
        },
        details: {
          memory_heap: {
            status: 'down',
            message: 'Heap memory exceeded threshold',
          },
        },
      };

      healthCheckService.check.mockResolvedValueOnce(errorResult);

      const result = await controller.checkMemory();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('memory_heap');
    });

    it('should handle disk space low', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          storage: {
            status: 'down',
            message: 'Disk space below threshold',
          },
        },
        details: {
          storage: {
            status: 'down',
            message: 'Disk space below threshold',
          },
        },
      };

      healthCheckService.check.mockResolvedValueOnce(errorResult);

      const result = await controller.checkDisk();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('storage');
    });
  });
});
