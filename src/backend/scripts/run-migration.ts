import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import dataSource from '../src/config/database.config';

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connected successfully');

    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('No migrations to run');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }

    await dataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
