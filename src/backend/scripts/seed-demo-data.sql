-- Seed demo data for SmartERP

-- Create demo tenant
INSERT INTO tenants (id, name, subdomain, status, created_at, updated_at)
VALUES ('demo-tenant-id', 'Demo Company', 'demo', 'active', NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;

-- Create admin user (password: admin123)
-- bcrypt hash of 'admin123' with salt rounds 10
INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  'admin-user-id',
  'admin@demo.com',
  '$2b$10$kqZMfSpZMAaJTWb1eMdJX.2EapAXhfADmLLNHUzvBXjZFzo/bvH.i',
  'Admin',
  'User',
  'admin',
  'demo-tenant-id',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create sample customer
INSERT INTO customers (id, name, email, phone, tenant_id, created_at, updated_at, created_by)
VALUES (
  'sample-customer-id',
  'Sample Customer',
  'customer@example.com',
  '+84901234567',
  'demo-tenant-id',
  NOW(),
  NOW(),
  'admin-user-id'
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Demo data seeded successfully!' as message;
SELECT 'Login: admin@demo.com / admin123' as credentials;
