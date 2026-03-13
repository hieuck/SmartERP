import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: [path.join(__dirname, '../src/**/*.entity.{ts,js}')],
    migrations: [path.join(__dirname, '../src/migrations/{*.ts,*.js}')],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connected successfully');

    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations completed successfully');

    console.log('\n✅ All migrations completed successfully!');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();
