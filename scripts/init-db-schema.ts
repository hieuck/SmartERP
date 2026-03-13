import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

async function initDatabaseSchema() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: [path.join(__dirname, '../src/backend/src/**/*.entity.{ts,js}')],
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

    console.log('Seeding demo data...');
    const seedScript = path.join(__dirname, '../src/backend/scripts/seed-demo-data.ts');
    await import(seedScript);
    console.log('Demo data seeded successfully');

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: admin123');
    console.log('   Tenant: DEMO');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

initDatabaseSchema();
