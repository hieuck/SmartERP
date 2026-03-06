/**
 * Baseline Data Fixture
 * Predefined test data for common scenarios
 */

export const BaselineDataFixture = {
  tenants: [
    {
      id: 'test-tenant-001',
      name: 'Test Tenant 1',
      code: 'TEST001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'test-tenant-002',
      name: 'Test Tenant 2',
      code: 'TEST002',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  users: [
    {
      id: 'test-user-001',
      username: 'testadmin',
      email: 'admin@test.com',
      passwordHash: '$2b$10$hashedpassword',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin',
      tenantId: 'test-tenant-001',
      isActive: true,
    },
    {
      id: 'test-user-002',
      username: 'teststaff',
      email: 'staff@test.com',
      passwordHash: '$2b$10$hashedpassword',
      firstName: 'Staff',
      lastName: 'Test',
      role: 'staff',
      tenantId: 'test-tenant-001',
      isActive: true,
    },
    {
      id: 'test-user-003',
      username: 'testadmin2',
      email: 'admin2@test.com',
      passwordHash: '$2b$10$hashedpassword',
      firstName: 'Admin',
      lastName: 'Test 2',
      role: 'admin',
      tenantId: 'test-tenant-002',
      isActive: true,
    },
  ],

  categories: [
    {
      id: 'cat-001',
      name: 'Tượng thạch cao',
      code: 'TUONG',
      description: 'Các loại tượng thạch cao',
      tenantId: 'test-tenant-001',
    },
    {
      id: 'cat-002',
      name: 'Nguyên liệu',
      code: 'NGUYEN-LIEU',
      description: 'Nguyên liệu sản xuất',
      tenantId: 'test-tenant-001',
    },
    {
      id: 'cat-003',
      name: 'Khuôn mẫu',
      code: 'KHUON',
      description: 'Khuôn đúc tượng',
      tenantId: 'test-tenant-001',
    },
  ],

  warehouses: [
    {
      id: 'warehouse-001',
      code: 'WH-001',
      name: 'Kho chính',
      address: '123 Test Street, Hà Nội',
      tenantId: 'test-tenant-001',
    },
    {
      id: 'warehouse-002',
      code: 'WH-002',
      name: 'Kho phụ',
      address: '456 Test Avenue, Hà Nội',
      tenantId: 'test-tenant-001',
    },
  ],

  products: [
    {
      id: 'prod-001',
      name: 'Tượng Phật Quan Âm 30cm',
      sku: 'TUONG-QA-30',
      description: 'Tượng thạch cao cao 30cm',
      categoryId: 'cat-001',
      unit: 'cái',
      purchasePrice: 100000,
      salePrice: 200000,
      minStock: 10,
      maxStock: 100,
      tenantId: 'test-tenant-001',
    },
    {
      id: 'prod-002',
      name: 'Bột thạch cao trắng',
      sku: 'NL-BOT-TRANG',
      description: 'Bột thạch cao trắng 25kg',
      categoryId: 'cat-002',
      unit: 'bao',
      purchasePrice: 50000,
      salePrice: 80000,
      minStock: 50,
      maxStock: 500,
      tenantId: 'test-tenant-001',
    },
  ],

  customers: [
    {
      id: 'cust-001',
      code: 'CUST-001',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@test.com',
      phone: '0901234567',
      address: '789 Customer Street',
      city: 'Hà Nội',
      tenantId: 'test-tenant-001',
    },
    {
      id: 'cust-002',
      code: 'CUST-002',
      name: 'Trần Thị B',
      email: 'tranthib@test.com',
      phone: '0907654321',
      address: '321 Customer Avenue',
      city: 'Hồ Chí Minh',
      tenantId: 'test-tenant-001',
    },
  ],
};
