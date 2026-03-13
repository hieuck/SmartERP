import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const isProduction = process.env.NODE_ENV === 'production';
const baseDir = isProduction ? __dirname : join(__dirname, '..', '..');

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
  
  // Entities
  entities: isProduction
    ? [join(baseDir, 'dist/**/*.entity.js')]
    : [join(baseDir, 'src/**/*.entity.ts')],
  
  // Migrations
  migrations: isProduction
    ? [join(baseDir, 'dist/migrations/*.js')]
    : [join(baseDir, 'src/migrations/*.ts')],
  
  // Disable synchronize - use migrations
  synchronize: false,
  
  // Logging
  logging: process.env.NODE_ENV === 'development',
});
