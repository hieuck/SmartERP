import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_production',
  synchronize: true, // Only for initial setup
  logging: true,
  entities: ['src/**/*.entity.ts'],
});

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    await AppDataSource.initialize();
    console.log('✅ Database initialized successfully!');

    await AppDataSource.destroy();
    console.log('✅ Connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
