import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Seeding demo data...');

  try {
    // Create demo tenant
    const tenantResult = await dataSource.query(
      `INSERT INTO tenants (id, name, subdomain, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (subdomain) DO NOTHING
       RETURNING id`,
      ['demo-tenant-id', 'Demo Company', 'demo', 'active'],
    );

    const tenantId = tenantResult[0]?.id || 'demo-tenant-id';
    console.log('✅ Created tenant:', tenantId);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await dataSource.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ['admin-user-id', 'admin@demo.com', hashedPassword, 'Admin', 'User', 'admin', tenantId, true],
    );
    console.log('✅ Created admin user: admin@demo.com / admin123');

    // Create sample customer
    await dataSource.query(
      `INSERT INTO customers (id, name, email, phone, tenant_id, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
       ON CONFLICT DO NOTHING`,
      [
        'sample-customer-id',
        'Sample Customer',
        'customer@example.com',
        '+84901234567',
        tenantId,
        'admin-user-id',
      ],
    );
    console.log('✅ Created sample customer');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: admin123');
    console.log('   Tenant: demo');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
