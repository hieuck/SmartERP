#!/usr/bin/env node

/**
 * Migration Runner
 * Runs SQL migration files against PostgreSQL database
 * Works on Windows, Linux, and macOS
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_production',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Migration files for production module
const migrations = [
  { file: 'migrations/production/001-create-molds-table.sql', table: 'molds' },
  { file: 'migrations/production/002-create-boms-table.sql', table: 'boms' },
  { file: 'migrations/production/003-create-work-orders-table.sql', table: 'work_orders' },
  { file: 'migrations/production/004-create-quality-checks-table.sql', table: 'quality_checks' },
];

async function tableExists(client, tableName) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

async function runMigrations() {
  const client = new Client(config);

  try {
    console.log('🗄️  Running Production Module Migrations...\n');
    
    // Connect to database
    console.log('📊 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful\n');

    // Run each migration
    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '..', migration.file);
      const migrationName = path.basename(migration.file);

      // Check if table already exists
      const exists = await tableExists(client, migration.table);
      if (exists) {
        console.log(`⏭️  Skipping ${migrationName} - table '${migration.table}' already exists\n`);
        continue;
      }

      console.log(`📝 Running migration: ${migrationName}`);

      // Check if file exists
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Error: Migration file not found: ${migrationPath}`);
        process.exit(1);
      }

      // Read migration SQL
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      try {
        await client.query(sql);
        console.log(`✅ Migration ${migrationName} completed successfully\n`);
      } catch (error) {
        console.error(`❌ Error running migration ${migrationName}:`);
        console.error(error.message);
        process.exit(1);
      }
    }

    // Verify tables
    console.log('📊 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('molds', 'boms', 'work_orders', 'quality_checks')
      ORDER BY table_name
    `);

    console.log('\n✅ Production module tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 All production module migrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations();
