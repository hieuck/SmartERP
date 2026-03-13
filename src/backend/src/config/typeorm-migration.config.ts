import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

const isProduction = process.env.NODE_ENV === 'production';
const baseDir = isProduction ? __dirname : path.join(__dirname, '..', '..');

// Migration-only config - no entities needed since migration has SQL
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_production',
  entities: [],
  migrations: isProduction
    ? [path.join(baseDir, 'dist/migrations/*.js')]
    : [path.join(baseDir, 'src/migrations/*.ts')],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
