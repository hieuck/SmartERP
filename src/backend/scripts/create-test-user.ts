import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

/**
 * Create test user for E2E tests
 * Email: admin@test.com
 * Password: admin123
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Creating test user...');

  try {
    // Get existing tenant
    const tenantResult = await dataSource.query('SELECT id FROM tenants LIMIT 1');
    
    if (!tenantResult || tenantResult.length === 0) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenantResult[0].id;
    console.log('✅ Using tenant:', tenantId);

    // Create test user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await dataSource.query(
      `INSERT INTO users (email, password, first_name, last_name, role, tenant_id, status, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (tenant_id, email) DO UPDATE SET
         password = EXCLUDED.password,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         email_verified = EXCLUDED.email_verified,
         updated_at = NOW()`,
      [
        'admin@test.com',
        hashedPassword,
        'Admin',
        'Test',
        'admin',
        tenantId,
        'active',
        true,
      ],
    );
    console.log('✅ Created/Updated test user: admin@test.com / admin123');

    console.log('\n🎉 Test user ready!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
