import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const DEMO_ADMIN_EMAIL = 'admin@demo.com';
const DEMO_ADMIN_PASSWORD = 'admin123';
const DEMO_USER_EMAIL = 'user@demo.com';
const DEMO_USER_PASSWORD = 'Test@123';

/**
 * Ensures demo tenant and users exist with consistent credentials.
 */
async function seedData() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'erp_production',
    entities: [],
    synchronize: false,
    logging: false,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connected');

    console.log('Ensuring demo data...');

    const existingTenantResult = await dataSource.query(
      `SELECT id FROM tenants WHERE code = 'DEMO' LIMIT 1`,
    );

    let tenantId = existingTenantResult[0]?.id as string | undefined;
    if (!tenantId) {
      const tenantResult = await dataSource.query(`
        INSERT INTO tenants (
          code, name, status, timezone, currency, language,
          company_name, company_email, subscription_plan, max_users
        ) VALUES (
          'DEMO', 'Demo Company', 'active', 'Asia/Ho_Chi_Minh', 'VND', 'vi',
          'Demo Company Ltd.', 'demo@example.com', 'trial', 50
        ) RETURNING id
      `);
      tenantId = tenantResult[0].id as string;
      console.log(`Created tenant: ${tenantId}`);
    } else {
      console.log(`Reusing tenant: ${tenantId}`);
    }

    const adminPasswordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
    const existingAdminResult = await dataSource.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [DEMO_ADMIN_EMAIL],
    );

    if (existingAdminResult.length > 0) {
      await dataSource.query(
        `UPDATE users
         SET tenant_id = $1,
             password = $2,
             first_name = 'Admin',
             last_name = 'User',
             role = 'admin',
             roles = 'admin,user',
             status = 'active',
             email_verified = true
         WHERE email = $3`,
        [tenantId, adminPasswordHash, DEMO_ADMIN_EMAIL],
      );
      console.log(`Updated admin user: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
    } else {
      await dataSource.query(
        `INSERT INTO users (
          tenant_id, email, password, first_name, last_name,
          role, roles, status, email_verified
        ) VALUES (
          $1, $2, $3, 'Admin', 'User',
          'admin', 'admin,user', 'active', true
        )`,
        [tenantId, DEMO_ADMIN_EMAIL, adminPasswordHash],
      );
      console.log(`Created admin user: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
    }

    const userPasswordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
    const existingUserResult = await dataSource.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [DEMO_USER_EMAIL],
    );

    if (existingUserResult.length > 0) {
      await dataSource.query(
        `UPDATE users
         SET tenant_id = $1,
             password = $2,
             first_name = 'Test',
             last_name = 'User',
             role = 'user',
             roles = 'user',
             status = 'active',
             email_verified = true
         WHERE email = $3`,
        [tenantId, userPasswordHash, DEMO_USER_EMAIL],
      );
      console.log(`Updated test user: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
    } else {
      await dataSource.query(
        `INSERT INTO users (
          tenant_id, email, password, first_name, last_name,
          role, roles, status, email_verified
        ) VALUES (
          $1, $2, $3, 'Test', 'User',
          'user', 'user', 'active', true
        )`,
        [tenantId, DEMO_USER_EMAIL, userPasswordHash],
      );
      console.log(`Created test user: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
    }

    await dataSource.destroy();
    console.log('Seed data completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed data failed:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

seedData();
