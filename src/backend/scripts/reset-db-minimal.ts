import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Import only essential entities for MVP
import { Setting } from '../core/settings/entities/setting.entity';
import { Tenant } from '../core/tenant/entities/tenant.entity';
import { User } from '../core/user/entities/user.entity';

config();

async function resetDatabase() {
  // Connect to postgres database to drop/create erp_production
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await adminDataSource.initialize();

    const dbName = process.env.DB_NAME || 'erp_production';

    // Drop database if exists
    console.log(`🗑️  Dropping database ${dbName}...`);
    await adminDataSource.query(`DROP DATABASE IF EXISTS ${dbName}`);

    // Create database
    console.log(`✨ Creating database ${dbName}...`);
    await adminDataSource.query(`CREATE DATABASE ${dbName}`);

    await adminDataSource.destroy();
    console.log('✅ Database reset successfully!');

    // Now initialize schema with minimal entities
    console.log('🔄 Initializing schema with essential entities...');

    const appDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      synchronize: true,
      logging: true,
      entities: [User, Tenant, Setting],
    });

    await appDataSource.initialize();
    console.log('✅ Schema initialized successfully!');

    await appDataSource.destroy();
    console.log('✅ All done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

resetDatabase();
