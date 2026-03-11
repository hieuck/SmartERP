import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const isProduction = process.env.NODE_ENV === 'production';
const baseDir = isProduction ? __dirname : path.join(__dirname, '..', '..');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_production',
  entities: isProduction
    ? [path.join(baseDir, 'dist/**/*.entity.js')]
    : [path.join(baseDir, 'src/**/*.entity.ts')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
