/**
 * Run migrations using raw SQL (bypass TypeORM entity loading issues)
 * Usage: node run-migration-sql.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check which migrations have been run
    const migrationsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationsTableExists.rows[0].exists) {
      console.log('📝 Creating migrations table...');
      await client.query(`
        CREATE TABLE "migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" bigint NOT NULL,
          "name" character varying NOT NULL
        );
      `);
    }

    // Check if CreateCoreEntitiesTables migration has been run
    const migrationExists = await client.query(`
      SELECT * FROM migrations WHERE name = 'CreateCoreEntitiesTables1710385350000'
    `);

    if (migrationExists.rows.length > 0) {
      console.log('✅ CreateCoreEntitiesTables migration already run\n');
      
      // Check if tables exist
      const tablesExist = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('products', 'customers', 'suppliers', 'orders', 'invoices')
        ORDER BY table_name
      `);
      
      console.log('📊 Existing tables:', tablesExist.rows.map(r => r.table_name).join(', '));
      await client.end();
      return;
    }

    console.log('🚀 Running CreateCoreEntitiesTables migration...\n');

    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations-sql', 'create-core-entities.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    // Record migration
    await client.query(`
      INSERT INTO migrations (timestamp, name) 
      VALUES (1710385350000, 'CreateCoreEntitiesTables1710385350000')
    `);

    console.log('✅ CreateCoreEntitiesTables migration completed successfully!\n');

    // Verify tables created
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'customers', 'suppliers', 'orders', 'invoices')
      ORDER BY table_name
    `);

    console.log('📊 Created tables:', tables.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
