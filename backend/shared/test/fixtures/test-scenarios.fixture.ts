/**
 * Test Scenarios Fixture
 * Complete test scenarios for common workflows
 */

export const TestScenariosFixture = {
  /**
   * Complete order fulfillment flow
   * Product -> Stock -> Customer -> Order -> Order Items
   */
  orderFulfillment: {
    product: {
      id: 'prod-scenario-001',
      name: 'Test Product for Order',
      sku: 'TEST-ORD-001',
      salePrice: 100000,
      unit: 'cái',
      categoryId: 'cat-001',
      tenantId: 'test-tenant-001',
    },
    stock: {
      id: 'stock-scenario-001',
      productId: 'prod-scenario-001',
      warehouseId: 'warehouse-001',
      quantity: 100,
      tenantId: 'test-tenant-001',
    },
    customer: {
      id: 'cust-scenario-001',
      code: 'CUST-SCENARIO-001',
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '0901111111',
      tenantId: 'test-tenant-001',
    },
    order: {
      id: 'order-scenario-001',
      orderNumber: 'ORD-TEST-001',
      customerId: 'cust-scenario-001',
      status: 'pending',
      subtotal: 1000000,
      taxAmount: 100000,
      shippingFee: 50000,
      discountAmount: 0,
      totalAmount: 1150000,
      tenantId: 'test-tenant-001',
    },
    orderItems: [
      {
        id: 'order-item-001',
        orderId: 'order-scenario-001',
        productId: 'prod-scenario-001',
        quantity: 10,
        unitPrice: 100000,
        totalPrice: 1000000,
      },
    ],
  },

  /**
   * Inventory transfer flow
   * Product -> Stock in Warehouse A -> Transfer -> Stock in Warehouse B
   */
  inventoryTransfer: {
    product: {
      id: 'prod-transfer-001',
      name: 'Product for Transfer',
      sku: 'TRANSFER-001',
      tenantId: 'test-tenant-001',
    },
    sourceStock: {
      productId: 'prod-transfer-001',
      warehouseId: 'warehouse-001',
      quantity: 100,
      tenantId: 'test-tenant-001',
    },
    destinationStock: {
      productId: 'prod-transfer-001',
      warehouseId: 'warehouse-002',
      quantity: 0,
      tenantId: 'test-tenant-001',
    },
    transfer: {
      id: 'transfer-001',
      productId: 'prod-transfer-001',
      fromWarehouseId: 'warehouse-001',
      toWarehouseId: 'warehouse-002',
      quantity: 50,
      status: 'pending',
      tenantId: 'test-tenant-001',
    },
  },

  /**
   * Low stock alert scenario
   */
  lowStockAlert: {
    product: {
      id: 'prod-lowstock-001',
      name: 'Low Stock Product',
      sku: 'LOWSTOCK-001',
      minStock: 50,
      maxStock: 200,
      tenantId: 'test-tenant-001',
    },
    stock: {
      productId: 'prod-lowstock-001',
      warehouseId: 'warehouse-001',
      quantity: 30, // Below minStock
      tenantId: 'test-tenant-001',
    },
  },

  /**
   * Multi-tenant isolation scenario
   */
  tenantIsolation: {
    tenant1: {
      id: 'test-tenant-001',
      products: [
        {
          id: 'prod-t1-001',
          name: 'Tenant 1 Product',
          sku: 'T1-PROD-001',
          tenantId: 'test-tenant-001',
        },
      ],
      users: [
        {
          id: 'user-t1-001',
          username: 'tenant1user',
          email: 'user1@tenant1.com',
          tenantId: 'test-tenant-001',
        },
      ],
    },
    tenant2: {
      id: 'test-tenant-002',
      products: [
        {
          id: 'prod-t2-001',
          name: 'Tenant 2 Product',
          sku: 'T2-PROD-001',
          tenantId: 'test-tenant-002',
        },
      ],
      users: [
        {
          id: 'user-t2-001',
          username: 'tenant2user',
          email: 'user1@tenant2.com',
          tenantId: 'test-tenant-002',
        },
      ],
    },
  },
};
