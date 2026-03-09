import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

async function dropCreateDatabase() {
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await adminDataSource.initialize();

    const dbName = process.env.DB_NAME || 'erp_production';

    console.log(`🗑️  Dropping database ${dbName}...`);
    await adminDataSource.query(`DROP DATABASE IF EXISTS ${dbName}`);

    console.log(`✨ Creating database ${dbName}...`);
    await adminDataSource.query(`CREATE DATABASE ${dbName}`);

    await adminDataSource.destroy();
    console.log('✅ Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropCreateDatabase();
