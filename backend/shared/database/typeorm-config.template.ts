import { DataSourceOptions } from 'typeorm';

/**
 * Shared TypeORM configuration template with connection pooling
 * and performance optimizations
 */
export function createTypeOrmConfig(databaseName: string): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || databaseName,

    // Connection Pool Configuration
    extra: {
      // Maximum number of clients in the pool
      max: parseInt(process.env.DB_POOL_MAX) || 20,

      // Minimum number of clients in the pool
      min: parseInt(process.env.DB_POOL_MIN) || 5,

      // Maximum time (ms) a client can be idle before being closed
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,

      // Maximum time (ms) to wait for a connection
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,

      // Maximum lifetime (ms) of a connection
      maxLifetime: parseInt(process.env.DB_MAX_LIFETIME) || 1800000, // 30 minutes

      // Enable statement timeout (30 seconds)
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
    },

    // Log slow queries (queries taking more than 1 second)
    maxQueryExecutionTime: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD) || 1000,

    // Logging configuration
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

    // Schema synchronization (disable in production)
    synchronize: false,

    // Run migrations automatically
    migrationsRun: process.env.NODE_ENV !== 'development',

    // Retry connection on failure
    retryAttempts: 3,
    retryDelay: 3000,
  };
}

/**
 * Environment variables for database configuration
 */
export interface DatabaseEnvConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_POOL_MAX: number;
  DB_POOL_MIN: number;
  DB_IDLE_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  DB_MAX_LIFETIME: number;
  DB_STATEMENT_TIMEOUT: number;
  DB_SLOW_QUERY_THRESHOLD: number;
}

/**
 * Default environment configuration
 */
export const defaultDatabaseEnv: Partial<DatabaseEnvConfig> = {
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_POOL_MAX: 20,
  DB_POOL_MIN: 5,
  DB_IDLE_TIMEOUT: 30000,
  DB_CONNECTION_TIMEOUT: 2000,
  DB_MAX_LIFETIME: 1800000,
  DB_STATEMENT_TIMEOUT: 30000,
  DB_SLOW_QUERY_THRESHOLD: 1000,
};
