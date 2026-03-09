import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

async function checkTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
