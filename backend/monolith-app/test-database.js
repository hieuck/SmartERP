const { Client } = require('pg');
require('dotenv').config();

async function testDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test 1: Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:');
    console.log(versionResult.rows[0].version.split(',')[0]);
    console.log('');

    // Test 2: List all tables
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log('📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    console.log('');

    // Test 3: Count records in each table
    console.log('📈 Record counts:');
    for (const row of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${row.tablename}"`);
      console.log(`  - ${row.tablename}: ${countResult.rows[0].count} records`);
    }
    console.log('');

    // Test 4: Check extensions
    const extensionsResult = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname != 'plpgsql'
    `);
    console.log('🔧 Extensions:');
    extensionsResult.rows.forEach(row => {
      console.log(`  - ${row.extname} (v${row.extversion})`);
    });
    console.log('');

    // Test 5: Test insert/select/delete on tenants table
    console.log('🧪 Testing CRUD operations on tenants table...');
    
    // Insert test tenant
    await client.query(`
      INSERT INTO tenants (code, name, status) 
      VALUES ('TEST001', 'Test Tenant', 'active')
    `);
    console.log('  ✅ INSERT: Test tenant created');

    // Select test tenant
    const selectResult = await client.query(`
      SELECT code, name, status FROM tenants WHERE code = 'TEST001'
    `);
    console.log(`  ✅ SELECT: Found tenant "${selectResult.rows[0].name}"`);

    // Delete test tenant
    await client.query(`DELETE FROM tenants WHERE code = 'TEST001'`);
    console.log('  ✅ DELETE: Test tenant removed');
    console.log('');

    console.log('🎉 All database tests passed!');
    console.log('✅ Database is ready for development');

  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabase();
