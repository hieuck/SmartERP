import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseMonitoringService } from './database-monitoring.service';
import { MetricsService } from '../metrics/metrics.service';

describe('DatabaseMonitoringService', () => {
  let service: DatabaseMonitoringService;
  let dataSource: jest.Mocked<DataSource>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
      options: { database: 'test_db' },
    };

    const mockMetricsService = {
      recordGauge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseMonitoringService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<DatabaseMonitoringService>(DatabaseMonitoringService);
    dataSource = module.get(getDataSourceToken());
    metricsService = module.get(MetricsService);

    // Clear all timers to prevent interference
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should start monitoring on initialization', () => {
      expect(service).toBeDefined();
    });
  });

  describe('monitorConnectionPool', () => {
    it('should monitor connection pool successfully', async () => {
      const mockResult = [
        {
          total_connections: '10',
          active_connections: '5',
          idle_connections: '5',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      await (service as any).monitorConnectionPool();

      expect(dataSource.query).toHaveBeenCalled();
      expect(metricsService.recordGauge).toHaveBeenCalledWith('database_connections_total', 10, {
        state: 'total',
      });
      expect(metricsService.recordGauge).toHaveBeenCalledWith('database_connections_active', 5, {
        state: 'active',
      });
      expect(metricsService.recordGauge).toHaveBeenCalledWith('database_connections_idle', 5, {
        state: 'idle',
      });
    });

    it('should handle errors during connection pool monitoring', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      await expect((service as any).monitorConnectionPool()).resolves.not.toThrow();
    });

    it('should log warning when connection pool usage is high', async () => {
      const mockResult = [
        {
          total_connections: '18', // 90% of 20
          active_connections: '15',
          idle_connections: '3',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      await (service as any).monitorConnectionPool();

      expect(metricsService.recordGauge).toHaveBeenCalled();
    });
  });

  describe('monitorDatabaseSize', () => {
    it('should monitor database size successfully', async () => {
      const mockResult = [{ size_bytes: '104857600' }]; // 100 MB
      dataSource.query.mockResolvedValue(mockResult);

      await (service as any).monitorDatabaseSize();

      expect(dataSource.query).toHaveBeenCalled();
      expect(metricsService.recordGauge).toHaveBeenCalledWith('database_size_bytes', 104857600, {
        database: 'test_db',
      });
    });

    it('should handle errors during database size monitoring', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      await expect((service as any).monitorDatabaseSize()).resolves.not.toThrow();
    });
  });

  describe('monitorTableSizes', () => {
    it('should monitor table sizes successfully', async () => {
      const mockResult = [
        {
          schemaname: 'public',
          tablename: 'users',
          total_bytes: '1048576',
          table_bytes: '524288',
          indexes_bytes: '524288',
        },
        {
          schemaname: 'public',
          tablename: 'products',
          total_bytes: '2097152',
          table_bytes: '1048576',
          indexes_bytes: '1048576',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      await (service as any).monitorTableSizes();

      expect(dataSource.query).toHaveBeenCalled();
      expect(metricsService.recordGauge).toHaveBeenCalledTimes(6); // 3 metrics per table
    });

    it('should handle errors during table size monitoring', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      await expect((service as any).monitorTableSizes()).resolves.not.toThrow();
    });
  });

  describe('monitorIndexUsage', () => {
    it('should monitor index usage successfully', async () => {
      const mockIndexStats = [
        {
          schemaname: 'public',
          tablename: 'users',
          indexname: 'users_pkey',
          idx_scan: '1000',
          idx_tup_read: '1000',
          idx_tup_fetch: '1000',
        },
      ];
      const mockUnusedIndexes = [];

      dataSource.query
        .mockResolvedValueOnce(mockIndexStats)
        .mockResolvedValueOnce(mockUnusedIndexes);

      await (service as any).monitorIndexUsage();

      expect(dataSource.query).toHaveBeenCalledTimes(2);
      expect(metricsService.recordGauge).toHaveBeenCalled();
    });

    it('should detect unused indexes', async () => {
      const mockIndexStats = [];
      const mockUnusedIndexes = [
        {
          schemaname: 'public',
          tablename: 'products',
          indexname: 'idx_unused',
        },
      ];

      dataSource.query
        .mockResolvedValueOnce(mockIndexStats)
        .mockResolvedValueOnce(mockUnusedIndexes);

      await (service as any).monitorIndexUsage();

      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during index usage monitoring', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      await expect((service as any).monitorIndexUsage()).resolves.not.toThrow();
    });
  });

  describe('monitorSlowQueries', () => {
    it('should monitor slow queries successfully', async () => {
      const mockResult = [
        {
          query: 'SELECT * FROM users WHERE id = $1',
          calls: '100',
          total_exec_time: '15000',
          mean_exec_time: '150',
          max_exec_time: '500',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      await (service as any).monitorSlowQueries();

      expect(dataSource.query).toHaveBeenCalled();
      expect(metricsService.recordGauge).toHaveBeenCalled();
    });

    it('should handle when pg_stat_statements is not available', async () => {
      dataSource.query.mockRejectedValue(new Error('pg_stat_statements not enabled'));

      await expect((service as any).monitorSlowQueries()).resolves.not.toThrow();
    });
  });

  describe('getConnectionPoolStats', () => {
    it('should return connection pool statistics', async () => {
      const mockResult = [
        {
          total: '10',
          active: '5',
          idle: '3',
          idle_in_transaction: '1',
          waiting: '1',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      const result = await service.getConnectionPoolStats();

      expect(result).toEqual(mockResult[0]);
      expect(dataSource.query).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      const result = await service.getConnectionPoolStats();

      expect(result).toBeNull();
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      const mockSize = [{ size_bytes: '104857600' }];
      const mockConnections = {
        total: '10',
        active: '5',
        idle: '3',
        idle_in_transaction: '1',
        waiting: '1',
      };
      const mockTables = [{ table_count: '50' }];

      dataSource.query
        .mockResolvedValueOnce(mockSize)
        .mockResolvedValueOnce([mockConnections])
        .mockResolvedValueOnce(mockTables);

      const result = await service.getDatabaseStats();

      expect(result).toEqual({
        size_bytes: 104857600,
        size_mb: 100,
        connections: mockConnections,
        table_count: 50,
      });
    });

    it('should return null on error', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      const result = await service.getDatabaseStats();

      expect(result).toBeNull();
    });
  });

  describe('analyzeQuery', () => {
    it('should analyze query successfully', async () => {
      const mockResult = [
        { 'QUERY PLAN': 'Seq Scan on users' },
        { 'QUERY PLAN': 'Planning Time: 0.123 ms' },
        { 'QUERY PLAN': 'Execution Time: 1.234 ms' },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      const result = await service.analyzeQuery('SELECT * FROM users');

      expect(result).toEqual(mockResult);
      expect(dataSource.query).toHaveBeenCalledWith('EXPLAIN ANALYZE SELECT * FROM users');
    });

    it('should return null on error', async () => {
      dataSource.query.mockRejectedValue(new Error('Invalid query'));

      const result = await service.analyzeQuery('INVALID QUERY');

      expect(result).toBeNull();
    });
  });

  describe('getIndexRecommendations', () => {
    it('should return index recommendations', async () => {
      const mockResult = [
        {
          schemaname: 'public',
          tablename: 'users',
          seq_scan: '1000',
          seq_tup_read: '50000000',
          idx_scan: '100',
          avg_seq_read: '50000',
        },
      ];
      dataSource.query.mockResolvedValue(mockResult);

      const result = await service.getIndexRecommendations();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        table: 'users',
        sequential_scans: 1000,
        rows_read: 50000000,
        avg_rows_per_scan: 50000,
        recommendation: 'Consider adding index for frequently scanned columns',
      });
    });

    it('should return empty array on error', async () => {
      dataSource.query.mockRejectedValue(new Error('Database error'));

      const result = await service.getIndexRecommendations();

      expect(result).toEqual([]);
    });

    it('should return empty array when no recommendations', async () => {
      dataSource.query.mockResolvedValue([]);

      const result = await service.getIndexRecommendations();

      expect(result).toEqual([]);
    });
  });

  describe('collectMetrics', () => {
    it('should collect all metrics successfully', async () => {
      const monitorConnectionPoolSpy = jest
        .spyOn(service as any, 'monitorConnectionPool')
        .mockResolvedValue(undefined);
      const monitorDatabaseSizeSpy = jest
        .spyOn(service as any, 'monitorDatabaseSize')
        .mockResolvedValue(undefined);
      const monitorTableSizesSpy = jest
        .spyOn(service as any, 'monitorTableSizes')
        .mockResolvedValue(undefined);
      const monitorIndexUsageSpy = jest
        .spyOn(service as any, 'monitorIndexUsage')
        .mockResolvedValue(undefined);
      const monitorSlowQueriesSpy = jest
        .spyOn(service as any, 'monitorSlowQueries')
        .mockResolvedValue(undefined);

      await (service as any).collectMetrics();

      expect(monitorConnectionPoolSpy).toHaveBeenCalled();
      expect(monitorDatabaseSizeSpy).toHaveBeenCalled();
      expect(monitorTableSizesSpy).toHaveBeenCalled();
      expect(monitorIndexUsageSpy).toHaveBeenCalled();
      expect(monitorSlowQueriesSpy).toHaveBeenCalled();
    });

    it('should handle errors during metrics collection', async () => {
      jest.spyOn(service as any, 'monitorConnectionPool').mockRejectedValue(new Error('Error'));

      await expect((service as any).collectMetrics()).resolves.not.toThrow();
    });
  });
});
