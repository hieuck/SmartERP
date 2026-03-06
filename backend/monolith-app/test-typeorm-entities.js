const { DataSource } = require('typeorm');
require('dotenv').config();

async function testTypeORMWithEntities() {
  console.log('🔍 Testing TypeORM with entities...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: ['dist/**/*.entity{.ts,.js}'], // Load compiled entities
    synchronize: false,
    logging: false, // Disable query logging for cleaner output
  });

  try {
    console.log('📡 Initializing DataSource with entities...');
    console.log('⏳ This may take a while if there are many entities...');
    
    const startTime = Date.now();
    await dataSource.initialize();
    const endTime = Date.now();
    
    console.log(`✅ DataSource initialized in ${endTime - startTime}ms`);
    console.log(`📊 Loaded ${dataSource.entityMetadatas.length} entities`);
    
    // List all loaded entities
    console.log('\n📋 Loaded entities:');
    dataSource.entityMetadatas.forEach((metadata, index) => {
      console.log(`  ${index + 1}. ${metadata.name} -> ${metadata.tableName}`);
    });
    
    await dataSource.destroy();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testTypeORMWithEntities();
