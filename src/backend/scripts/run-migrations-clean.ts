import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

/**
 * Clean migration runner with explicit process.exit()
 * Runs TypeORM migrations without loading all entities
 */
async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',

    // Only load migrations, not entities
    migrations: [path.join(__dirname, '../src/migrations/*.ts')],
    entities: [], // Empty - don't load entities

    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Running migrations...');
    const migrations = await dataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('✅ No pending migrations');
    } else {
      console.log(`✅ Ran ${migrations.length} migrations:`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    await dataSource.destroy();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

runMigrations();
