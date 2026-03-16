import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Run database migrations programmatically
 * 
 * This script bypasses TypeORM CLI to avoid ES modules issues.
 * It initializes a DataSource and runs pending migrations.
 * 
 * Usage:
 *   npm run db:migrate
 *   ts-node -r tsconfig-paths/register scripts/run-migrations.ts
 */
async function runMigrations() {
  console.log('🔄 Initializing database connection...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'erp_production'}`);
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);

  const dataSource = new DataSource({
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

    // Disable synchronize - use migrations only
    synchronize: false,

    // Enable logging for visibility
    logging: true,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`📋 Pending migrations: ${pendingMigrations ? 'Yes' : 'No'}`);

    // Run pending migrations
    console.log('🔄 Running pending migrations...');
    const migrations = await dataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('✅ No pending migrations - database schema is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   ✓ ${migration.name}`);
      });
    }

    // Close connection
    await dataSource.destroy();
    console.log('✅ Database connection closed');
    console.log('🎉 Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    
    // Try to close connection if it was opened
    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (closeError) {
      // Ignore close errors
    }

    process.exit(1);
  }
}

// Run migrations
runMigrations();
