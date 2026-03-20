import { DataSource, LoggerOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export function getTypeOrmLogging(
  nodeEnv = process.env.NODE_ENV,
  dbLogging = process.env.DB_LOGGING,
): LoggerOptions {
  if (dbLogging === 'true') {
    return ['error', 'warn', 'schema', 'migration', 'query'];
  }

  if (dbLogging === 'minimal') {
    return ['error', 'warn', 'schema', 'migration'];
  }

  if (dbLogging === 'false') {
    return false;
  }

  return nodeEnv === 'production' ? ['error', 'warn', 'schema', 'migration'] : false;
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * TypeORM CLI DataSource
 * Used for migrations: npm run migration:generate, migration:run, etc.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_production',
  entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProduction ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  synchronize: false,
  logging: getTypeOrmLogging(),
});
