import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

/**
 * Professional seed data script using TypeORM
 * Creates demo tenant and admin user for testing
 */
async function seedData() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: [],
    synchronize: false,
    logging: false,
  });

  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Check if data already exists
    const tenantCount = await dataSource.query('SELECT COUNT(*) FROM tenants');
    if (parseInt(tenantCount[0].count) > 0) {
      console.log('⚠️  Data already exists, skipping seed');
      await dataSource.destroy();
      process.exit(0);
    }

    console.log('🔄 Seeding demo data...');

    // Create demo tenant
    const tenantResult = await dataSource.query(`
      INSERT INTO tenants (
        code, name, status, timezone, currency, language,
        company_name, company_email, subscription_plan, max_users
      ) VALUES (
        'DEMO', 'Demo Company', 'active', 'Asia/Ho_Chi_Minh', 'VND', 'vi',
        'Demo Company Ltd.', 'demo@example.com', 'trial', 50
      ) RETURNING id
    `);
    const tenantId = tenantResult[0].id;
    console.log(`✅ Created tenant: ${tenantId}`);

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create admin user
    await dataSource.query(`
      INSERT INTO users (
        tenant_id, email, password, first_name, last_name,
        role, roles, status, email_verified
      ) VALUES (
        $1, 'admin@demo.com', $2, 'Admin', 'User',
        'admin', 'admin,user', 'active', true
      )
    `, [tenantId, hashedPassword]);
    console.log('✅ Created admin user: admin@demo.com / Admin@123');

    // Create test user
    const testPassword = await bcrypt.hash('Test@123', 10);
    await dataSource.query(`
      INSERT INTO users (
        tenant_id, email, password, first_name, last_name,
        role, roles, status, email_verified
      ) VALUES (
        $1, 'user@demo.com', $2, 'Test', 'User',
        'user', 'user', 'active', true
      )
    `, [tenantId, testPassword]);
    console.log('✅ Created test user: user@demo.com / Test@123');

    await dataSource.destroy();
    console.log('✅ Seed data completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed data failed:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

seedData();
