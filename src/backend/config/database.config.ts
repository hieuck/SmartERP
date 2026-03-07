import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Database Configuration with Optimized Connection Pooling
 *
 * Optimizations:
 * - Connection pooling for high concurrency
 * - Query result caching
 * - Logging for slow queries
 * - Connection retry logic
 * - Statement timeout
 */

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const isTest = configService.get('NODE_ENV') === 'test';

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USER', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'smarterp'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],

    // Synchronize only in test environment
    synchronize: isTest || configService.get('DB_SYNC') === 'true',

    // Logging configuration
    logging: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
    logger: 'advanced-console',

    // Log slow queries (>100ms)
    maxQueryExecutionTime: 100,

    // Connection pooling configuration
    extra: {
      // Maximum number of connections in the pool
      max: configService.get('DB_POOL_MAX', isProduction ? 20 : 10),

      // Minimum number of connections in the pool
      min: configService.get('DB_POOL_MIN', isProduction ? 5 : 2),

      // Maximum time (ms) a connection can be idle before being released
      idleTimeoutMillis: configService.get('DB_IDLE_TIMEOUT', 30000),

      // Maximum time (ms) to wait for a connection from the pool
      connectionTimeoutMillis: configService.get('DB_CONNECTION_TIMEOUT', 5000),

      // Statement timeout (ms) - prevent long-running queries
      statement_timeout: configService.get('DB_STATEMENT_TIMEOUT', 30000),

      // Query timeout (ms)
      query_timeout: configService.get('DB_QUERY_TIMEOUT', 10000),

      // Application name for monitoring
      application_name: 'smart-erp',

      // SSL configuration for production
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
    },

    // Connection retry configuration
    retryAttempts: configService.get('DB_RETRY_ATTEMPTS', 3),
    retryDelay: configService.get('DB_RETRY_DELAY', 3000),

    // Query result caching
    cache: {
      type: 'redis',
      options: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
      },
      duration: configService.get('DB_CACHE_DURATION', 60000), // 1 minute default
      ignoreErrors: true, // Don't fail if Redis is down
    },

    // Migrations
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: isProduction,
  };
};

/**
 * Database Health Check Configuration
 */
export const getDatabaseHealthConfig = () => ({
  // Timeout for health check queries
  timeout: 5000,

  // Health check query
  query: 'SELECT 1',
});

/**
 * Database Monitoring Configuration
 */
export const getDatabaseMonitoringConfig = () => ({
  // Enable query logging
  logQueries: true,

  // Log slow queries
  logSlowQueries: true,
  slowQueryThreshold: 100, // ms

  // Enable connection pool monitoring
  monitorConnectionPool: true,

  // Enable query result cache monitoring
  monitorQueryCache: true,
});
