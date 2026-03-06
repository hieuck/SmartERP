import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Seed test users for E2E testing
 * Creates admin@test.com with password: password123
 */
async function seedTestUsers() {
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
    console.log('✅ Database connected');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('✅ Password hashed');

    // Insert test tenant first
    await dataSource.query(`
      INSERT INTO tenants (id, name, code, status, created_at, updated_at)
      VALUES 
        (
          '00000000-0000-0000-0000-000000000001'::uuid,
          'Test Tenant',
          'TEST001',
          'active',
          NOW(),
          NOW()
        )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        status = EXCLUDED.status,
        updated_at = NOW()
    `);

    console.log('✅ Test tenant created/updated');

    // Insert test user
    await dataSource.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role, status, tenant_id, created_at, updated_at)
      VALUES 
        (
          '00000000-0000-0000-0000-000000000002'::uuid,
          'admin@test.com',
          $1,
          'Admin',
          'User',
          'admin',
          'active',
          '00000000-0000-0000-0000-000000000001'::uuid,
          NOW(),
          NOW()
        )
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [hashedPassword]);

    console.log('✅ Test user created/updated:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   TenantID: 00000000-0000-0000-0000-000000000001');
    console.log('   Role: admin');

    await dataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();
