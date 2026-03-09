import { config } from 'dotenv';
import { glob } from 'glob';
import * as path from 'path';
import { DataSource } from 'typeorm';

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

    // Now initialize schema
    console.log('🔄 Initializing schema...');

    // Find all entity files using glob with forward slashes (works on Windows)
    const srcDir = path.join(__dirname, '..').replace(/\\/g, '/');
    const entityPattern = `${srcDir}/**/*.entity.ts`;
    console.log(`📁 Searching for entities: ${entityPattern}`);

    const entityFiles = await glob(entityPattern, {
      ignore: ['**/node_modules/**', '**/dist/**'],
      windowsPathsNoEscape: true,
    });

    console.log(`✅ Found ${entityFiles.length} entity files`);
    if (entityFiles.length === 0) {
      throw new Error('No entity files found! Check the path.');
    }

    // Import all entities dynamically
    const entities = [];
    for (const file of entityFiles) {
      try {
        const absolutePath = path.resolve(file);
        const module = await import(absolutePath);
        // Get all exported classes from the module
        const exportedEntities = Object.values(module).filter(
          (exp) => typeof exp === 'function' && exp.prototype,
        );
        entities.push(...exportedEntities);
      } catch (error) {
        console.warn(`⚠️  Failed to import ${file}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${entities.length} entities`);

    const appDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      dropSchema: true, // Drop all tables first
      synchronize: true,
      logging: false, // Disable logging to reduce noise
      entities: entities,
    });

    console.log('🔄 Connecting to new database and creating schema...');
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
