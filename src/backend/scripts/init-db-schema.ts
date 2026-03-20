import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

/**
 * Initialize database schema by bootstrapping the Nest application context.
 * The script now checks pending migrations instead of only looking at table count.
 */
async function initSchema() {
  console.log('Initializing NestJS application context...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);

    console.log('Database connection established');
    console.log(`Database: ${dataSource.options.database}`);

    const tables = await dataSource.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const tableCount = Number.parseInt(tables[0].count, 10);
    const hasPendingMigrations = await dataSource.showMigrations();

    console.log(`Existing tables: ${tableCount}`);
    console.log(`Pending migrations: ${hasPendingMigrations ? 'yes' : 'no'}`);

    if (tableCount === 0 || hasPendingMigrations) {
      console.log('Running pending migrations...');

      const migrations = await dataSource.runMigrations();
      console.log(`Ran ${migrations.length} migration(s)`);

      const newTables = await dataSource.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);

      console.log(`Schema initialized. Current table count: ${newTables[0].count}`);
    } else {
      console.log('Schema is already up to date. No migration needed.');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await app.close();
  }
}

initSchema()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
