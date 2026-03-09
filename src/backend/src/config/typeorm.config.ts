import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

// Determine if we're running from dist or src
const isCompiled = __filename.endsWith('.js');
const baseDir = isCompiled ? path.join(__dirname, '..') : path.join(__dirname, '..');
const entityPattern = isCompiled ? '**/*.entity.js' : '**/*.entity.ts';
const migrationPattern = isCompiled ? 'migrations/*.js' : 'migrations/*.ts';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_production',
  entities: [path.join(baseDir, entityPattern)],
  migrations: [path.join(baseDir, migrationPattern)],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
