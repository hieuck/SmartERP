import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Database Monitoring Service
 *
 * Monitors database performance metrics:
 * - Connection pool usage
 * - Query execution time
 * - Slow queries
 * - Index usage
 * - Cache hit rate
 */
@Injectable()
export class DatabaseMonitoringService {
  private readonly logger = new Logger(DatabaseMonitoringService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private metricsService: MetricsService,
  ) {
    // Start monitoring on initialization
    this.startMonitoring();
  }

  /**
   * Start periodic monitoring
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    setInterval(() => this.collectMetrics(), 30000);

    this.logger.log('Database monitoring started');
  }

  /**
   * Collect all database metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      await Promise.all([
        this.monitorConnectionPool(),
        this.monitorDatabaseSize(),
        this.monitorTableSizes(),
        this.monitorIndexUsage(),
        this.monitorSlowQueries(),
      ]);
    } catch (error) {
      this.logger.error('Failed to collect database metrics:', error);
    }
  }

  /**
   * Monitor connection pool usage
   */
  private async monitorConnectionPool(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database();
      `);

      const stats = result[0];

      // Record metrics
      this.metricsService.recordGauge(
        'database_connections_total',
        parseInt(stats.total_connections),
        { state: 'total' },
      );

      this.metricsService.recordGauge(
        'database_connections_active',
        parseInt(stats.active_connections),
        { state: 'active' },
      );

      this.metricsService.recordGauge(
        'database_connections_idle',
        parseInt(stats.idle_connections),
        { state: 'idle' },
      );

      // Log warning if connection pool is getting full
      const poolMax = 20; // From config
      const usage = (parseInt(stats.total_connections) / poolMax) * 100;

      if (usage > 80) {
        this.logger.warn(
          `Connection pool usage high: ${usage.toFixed(1)}% (${stats.total_connections}/${poolMax})`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to monitor connection pool:', error);
    }
  }

  /**
   * Monitor database size
   */
  private async monitorDatabaseSize(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT pg_database_size(current_database()) as size_bytes;
      `);

      const sizeBytes = parseInt(result[0].size_bytes);
      const sizeMB = sizeBytes / (1024 * 1024);

      this.metricsService.recordGauge('database_size_bytes', sizeBytes, {
        database: (this.dataSource.options as any).database || 'unknown',
      });

      this.logger.debug(`Database size: ${sizeMB.toFixed(2)} MB`);
    } catch (error) {
      this.logger.error('Failed to monitor database size:', error);
    }
  }

  /**
   * Monitor table sizes
   */
  private async monitorTableSizes(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          pg_total_relation_size(schemaname||'.'||tablename) as total_bytes,
          pg_relation_size(schemaname||'.'||tablename) as table_bytes,
          pg_indexes_size(schemaname||'.'||tablename) as indexes_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY total_bytes DESC
        LIMIT 10;
      `);

      for (const table of result) {
        this.metricsService.recordGauge('database_table_size_bytes', parseInt(table.total_bytes), {
          table: table.tablename,
          type: 'total',
        });

        this.metricsService.recordGauge('database_table_size_bytes', parseInt(table.table_bytes), {
          table: table.tablename,
          type: 'table',
        });

        this.metricsService.recordGauge(
          'database_table_size_bytes',
          parseInt(table.indexes_bytes),
          {
            table: table.tablename,
            type: 'indexes',
          },
        );
      }
    } catch (error) {
      this.logger.error('Failed to monitor table sizes:', error);
    }
  }

  /**
   * Monitor index usage
   */
  private async monitorIndexUsage(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 20;
      `);

      for (const index of result) {
        this.metricsService.recordGauge('database_index_scans', parseInt(index.idx_scan), {
          table: index.tablename,
          index: index.indexname,
        });
      }

      // Find unused indexes
      const unusedIndexes = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE '%_pkey';
      `);

      if (unusedIndexes.length > 0) {
        this.logger.warn(`Found ${unusedIndexes.length} unused indexes`);
      }
    } catch (error) {
      this.logger.error('Failed to monitor index usage:', error);
    }
  }

  /**
   * Monitor slow queries
   */
  private async monitorSlowQueries(): Promise<void> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 10;
      `);

      for (const query of result) {
        this.metricsService.recordGauge(
          'database_slow_query_time_ms',
          parseFloat(query.mean_exec_time),
          {
            query: query.query.substring(0, 100), // Truncate for label
          },
        );

        this.logger.warn(
          `Slow query detected: ${query.mean_exec_time.toFixed(2)}ms avg, ${query.calls} calls`,
        );
      }
    } catch (error) {
      // pg_stat_statements extension might not be enabled
      this.logger.debug('pg_stat_statements not available');
    }
  }

  /**
   * Get connection pool statistics
   */
  async getConnectionPoolStats(): Promise<{
    total: string;
    active: string;
    idle: string;
    idle_in_transaction: string;
    waiting: string;
  } | null> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          count(*) FILTER (WHERE wait_event_type IS NOT NULL) as waiting
        FROM pg_stat_activity
        WHERE datname = current_database();
      `);

      return result[0];
    } catch (error) {
      this.logger.error('Failed to get connection pool stats:', error);
      return null;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    size_bytes: number;
    size_mb: number;
    connections: {
      total: string;
      active: string;
      idle: string;
      idle_in_transaction: string;
      waiting: string;
    } | null;
    table_count: number;
  } | null> {
    try {
      const [size, connections, tables] = await Promise.all([
        this.dataSource.query(`
          SELECT pg_database_size(current_database()) as size_bytes;
        `),
        this.getConnectionPoolStats(),
        this.dataSource.query(`
          SELECT count(*) as table_count
          FROM pg_tables
          WHERE schemaname = 'public';
        `),
      ]);

      return {
        size_bytes: parseInt(size[0].size_bytes),
        size_mb: parseInt(size[0].size_bytes) / (1024 * 1024),
        connections,
        table_count: parseInt(tables[0].table_count),
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return null;
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(query: string): Promise<Record<string, unknown>[] | null> {
    try {
      const result = await this.dataSource.query(`EXPLAIN ANALYZE ${query}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to analyze query:', error);
      return null;
    }
  }

  /**
   * Get index recommendations
   */
  async getIndexRecommendations(): Promise<
    Array<{
      table: string;
      sequential_scans: number;
      rows_read: number;
      avg_rows_per_scan: number;
      recommendation: string;
    }>
  > {
    try {
      // Find tables with sequential scans
      const result = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          seq_tup_read / seq_scan as avg_seq_read
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND seq_scan > 0
          AND seq_tup_read / seq_scan > 10000
        ORDER BY seq_tup_read DESC
        LIMIT 10;
      `);

      return result.map((row: Record<string, unknown>) => ({
        table: row.tablename as string,
        sequential_scans: parseInt(row.seq_scan as string),
        rows_read: parseInt(row.seq_tup_read as string),
        avg_rows_per_scan: parseInt(row.avg_seq_read as string),
        recommendation: 'Consider adding index for frequently scanned columns',
      }));
    } catch (error) {
      this.logger.error('Failed to get index recommendations:', error);
      return [];
    }
  }
}
