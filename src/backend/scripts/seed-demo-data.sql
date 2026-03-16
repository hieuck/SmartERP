-- Seed demo data for SmartERP

-- Create demo tenant
INSERT INTO tenants (id, code, name, status, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'DEMO', 'Demo Company', 'active', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Create admin user (password: admin123)
-- bcrypt hash of 'admin123' with salt rounds 10
INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, status, email_verified, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'admin@demo.com',
  '$2b$10$kqZMfSpZMAaJTWb1eMdJX.2EapAXhfADmLLNHUzvBXjZFzo/bvH.i',
  'Admin',
  'User',
  'admin',
  '11111111-1111-1111-1111-111111111111',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Create test user (password: test123)
-- bcrypt hash of 'test123' with salt rounds 10
INSERT INTO users (id, email, password, first_name, last_name, role, tenant_id, status, email_verified, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'test@demo.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Test',
  'User',
  'user',
  '11111111-1111-1111-1111-111111111111',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Success message
SELECT 'Demo data seeded successfully!' as message;
SELECT 'Admin: admin@demo.com / admin123' as admin_credentials;
SELECT 'Test User: test@demo.com / test123' as test_credentials;
