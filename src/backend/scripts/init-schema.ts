import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

/**
 * Initialize database schema using TypeORM synchronize
 * This script creates all tables based on entity definitions
 *
 * IMPORTANT: This is for initial setup only. Use migrations for production.
 */
async function initSchema() {
  const configService = new ConfigService();

  // Connect to postgres database to ensure target database exists
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USER', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: 'postgres',
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await adminDataSource.initialize();

    const dbName = configService.get('DB_NAME', 'erp_production');

    // Check if database exists
    const result = await adminDataSource.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      dbName,
    ]);

    if (result.length === 0) {
      console.log(`✨ Creating database ${dbName}...`);
      await adminDataSource.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    await adminDataSource.destroy();

    // Now connect to the target database and create schema
    console.log('🔄 Initializing schema...');

    const appDataSource = new DataSource({
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: configService.get('DB_PORT', 5432),
      username: configService.get('DB_USER', 'postgres'),
      password: configService.get('DB_PASSWORD', 'postgres'),
      database: dbName,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // Only for initial setup
      logging: false,
    });

    await appDataSource.initialize();
    console.log('✅ Schema initialized successfully!');

    // Get table count
    const tables = await appDataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    console.log(`📊 Created ${tables[0].count} tables`);

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

initSchema();
