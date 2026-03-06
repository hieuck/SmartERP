import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let dbIndicator: TypeOrmHealthIndicator;
  let memoryIndicator: MemoryHealthIndicator;
  let dataSource: DataSource;
  let cacheManager: any;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockDbIndicator = {
    pingCheck: jest.fn(),
  };

  const mockMemoryIndicator = {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  };

  const mockDataSource = {
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
          useValue: mockDbIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryIndicator,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    dbIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    memoryIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    dataSource = module.get<DataSource>(getDataSourceToken());
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const mockResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };
      mockHealthCheckService.check.mockResolvedValue(mockResult);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await controller.check();

      expect(result).toEqual(mockResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('should return ready status when database is initialized', async () => {
      mockDataSource.isInitialized = true;

      const result = await controller.ready();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBeDefined();
    });

    it('should return not ready when database is not initialized', async () => {
      mockDataSource.isInitialized = false;

      const result = await controller.ready();

      expect(result.status).toBe('not ready');
      expect(result.reason).toBe('Database not initialized');
    });
  });

  describe('live', () => {
    it('should return liveness status', async () => {
      const result = await controller.live();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
      expect(result.service).toBe('plaster-erp-monolith');
      expect(result.version).toBe('1.0.0');
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.memory.heapUsed).toBeDefined();
      expect(result.memory.heapTotal).toBeDefined();
      expect(result.memory.rss).toBeDefined();
      expect(result.memory.external).toBeDefined();
    });
  });
});
