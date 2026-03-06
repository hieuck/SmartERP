const { DataSource } = require('typeorm');
require('dotenv').config();

async function testTypeORM() {
  console.log('🔍 Testing TypeORM connection...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: [], // Empty entities to test connection only
    synchronize: false,
    logging: true,
  });

  try {
    console.log('📡 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connection successful!');
    
    const result = await dataSource.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result[0].version);
    
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tables:', tables.map(t => t.table_name).join(', '));
    
    await dataSource.destroy();
    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testTypeORM();
