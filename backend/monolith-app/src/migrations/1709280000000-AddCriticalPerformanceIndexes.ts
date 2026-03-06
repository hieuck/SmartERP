import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddCriticalPerformanceIndexes1709280000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Products table indexes
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_TENANT_CREATED',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_TENANT_STATUS',
        columnNames: ['tenantId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_CATEGORY',
        columnNames: ['categoryId'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_SKU',
        columnNames: ['sku'],
      }),
    );

    // Orders table indexes
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_TENANT_CREATED',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_TENANT_STATUS',
        columnNames: ['tenantId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        name: 'IDX_ORDERS_CUSTOMER',
        columnNames: ['customerId'],
      }),
    );

    // Users table indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_TENANT_ROLE',
        columnNames: ['tenantId', 'role'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    // Payments table indexes
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_TENANT_STATUS',
        columnNames: ['tenantId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_PAYMENTS_ORDER',
        columnNames: ['orderId'],
      }),
    );

    // Customers table indexes
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_TENANT_CREATED',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    // Suppliers table indexes
    await queryRunner.createIndex(
      'suppliers',
      new TableIndex({
        name: 'IDX_SUPPLIERS_TENANT_CREATED',
        columnNames: ['tenantId', 'createdAt'],
      }),
    );

    // Inventory table indexes
    await queryRunner.createIndex(
      'inventory',
      new TableIndex({
        name: 'IDX_INVENTORY_TENANT_PRODUCT',
        columnNames: ['tenantId', 'productId'],
      }),
    );

    await queryRunner.createIndex(
      'inventory',
      new TableIndex({
        name: 'IDX_INVENTORY_WAREHOUSE',
        columnNames: ['warehouseId'],
      }),
    );

    // Employees table indexes (for payroll optimization)
    await queryRunner.createIndex(
      'employees',
      new TableIndex({
        name: 'IDX_EMPLOYEES_TENANT',
        columnNames: ['tenantId'],
      }),
    );

    // Attendance table indexes (for payroll optimization)
    await queryRunner.createIndex(
      'attendance',
      new TableIndex({
        name: 'IDX_ATTENDANCE_TENANT_EMPLOYEE_DATE',
        columnNames: ['tenantId', 'employeeId', 'date'],
      }),
    );

    // Piece rate work table indexes (for payroll optimization)
    await queryRunner.createIndex(
      'piece_rate_work',
      new TableIndex({
        name: 'IDX_PIECE_RATE_TENANT_EMPLOYEE_DATE',
        columnNames: ['tenantId', 'employeeId', 'workDate'],
      }),
    );

    await queryRunner.createIndex(
      'piece_rate_work',
      new TableIndex({
        name: 'IDX_PIECE_RATE_STATUS',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.dropIndex('piece_rate_work', 'IDX_PIECE_RATE_STATUS');
    await queryRunner.dropIndex('piece_rate_work', 'IDX_PIECE_RATE_TENANT_EMPLOYEE_DATE');
    await queryRunner.dropIndex('attendance', 'IDX_ATTENDANCE_TENANT_EMPLOYEE_DATE');
    await queryRunner.dropIndex('employees', 'IDX_EMPLOYEES_TENANT');
    await queryRunner.dropIndex('inventory', 'IDX_INVENTORY_WAREHOUSE');
    await queryRunner.dropIndex('inventory', 'IDX_INVENTORY_TENANT_PRODUCT');
    await queryRunner.dropIndex('suppliers', 'IDX_SUPPLIERS_TENANT_CREATED');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_TENANT_CREATED');
    await queryRunner.dropIndex('payments', 'IDX_PAYMENTS_ORDER');
    await queryRunner.dropIndex('payments', 'IDX_PAYMENTS_TENANT_STATUS');
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');
    await queryRunner.dropIndex('users', 'IDX_USERS_TENANT_ROLE');
    await queryRunner.dropIndex('orders', 'IDX_ORDERS_CUSTOMER');
    await queryRunner.dropIndex('orders', 'IDX_ORDERS_TENANT_STATUS');
    await queryRunner.dropIndex('orders', 'IDX_ORDERS_TENANT_CREATED');
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_SKU');
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_CATEGORY');
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_TENANT_STATUS');
    await queryRunner.dropIndex('products', 'IDX_PRODUCTS_TENANT_CREATED');
  }
}
