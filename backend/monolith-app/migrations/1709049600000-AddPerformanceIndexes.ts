import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1709049600000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1709049600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Product indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant_status" ON "products" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant_category" ON "products" ("tenant_id", "category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant_name" ON "products" ("tenant_id", "name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant_stock" ON "products" ("tenant_id", "stock_quantity")`,
    );

    // Customer indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_tenant_status" ON "customers" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_tenant_name" ON "customers" ("tenant_id", "name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_tenant_phone" ON "customers" ("tenant_id", "phone")`,
    );

    // Inventory indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_tenant_quantity" ON "inventory" ("tenant_id", "quantity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_tenant_warehouse" ON "inventory" ("tenant_id", "warehouse_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_inventory_tenant_product" ON "inventory" ("tenant_id", "product_id")`,
    );

    // Order indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_tenant_customer" ON "orders" ("tenant_id", "customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_tenant_status" ON "orders" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_tenant_created" ON "orders" ("tenant_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX "IDX_orders_tenant_created"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_tenant_status"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_tenant_customer"`);

    await queryRunner.query(`DROP INDEX "IDX_inventory_tenant_product"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_tenant_warehouse"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_tenant_quantity"`);

    await queryRunner.query(`DROP INDEX "IDX_customers_tenant_phone"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_tenant_name"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_tenant_status"`);

    await queryRunner.query(`DROP INDEX "IDX_products_tenant_stock"`);
    await queryRunner.query(`DROP INDEX "IDX_products_tenant_name"`);
    await queryRunner.query(`DROP INDEX "IDX_products_tenant_category"`);
    await queryRunner.query(`DROP INDEX "IDX_products_tenant_status"`);
  }
}
