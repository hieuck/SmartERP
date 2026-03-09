import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

/**
 * Initialize database schema by starting NestJS app
 * This ensures all entities are loaded correctly through the app's TypeORM config
 */
async function initSchema() {
  console.log('🔄 Initializing NestJS application context...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);

    console.log('📊 Database connection established');
    console.log(`📁 Database: ${dataSource.options.database}`);

    // Check if schema needs initialization
    const tables = await dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const tableCount = parseInt(tables[0].count);

    if (tableCount === 0) {
      console.log('✨ No tables found. Initializing schema...');

      // Synchronize schema (only for initial setup)
      await dataSource.synchronize();

      // Count tables again
      const newTables = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);

      console.log(`✅ Schema initialized! Created ${newTables[0].count} tables`);
    } else {
      console.log(`ℹ️  Database already has ${tableCount} tables. Skipping initialization.`);
      console.log('💡 Use migrations for schema changes: npm run migration:generate');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await app.close();
  }
}

initSchema()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
