import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

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

  // Entities - relative to backend root
  entities: isProduction ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],

  // Migrations - relative to backend root
  migrations: isProduction ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],

  // Temporarily enable synchronize to create tables from entities
  synchronize: true,

  // Logging
  logging: process.env.NODE_ENV === 'development',
});
