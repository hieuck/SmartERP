import { DataSource, QueryRunner } from 'typeorm';
import { BaselineDataFixture } from '../fixtures/baseline-data.fixture';
import { TestScenariosFixture } from '../fixtures/test-scenarios.fixture';

/**
 * Test Data Seeder
 * Seeds test database with baseline and scenario data
 */
export class TestDataSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Seed baseline test data
   * Creates essential data needed for most tests
   */
  async seedBaseline(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Seed tenants
      await this.seedTenants(queryRunner);

      // Seed users
      await this.seedUsers(queryRunner);

      // Seed categories
      await this.seedCategories(queryRunner);

      // Seed warehouses
      await this.seedWarehouses(queryRunner);

      // Seed products
      await this.seedProducts(queryRunner);

      // Seed customers
      await this.seedCustomers(queryRunner);

      await queryRunner.commitTransaction();
      console.log('✅ Baseline test data seeded');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Failed to seed baseline data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seed specific test scenario
   */
  async seedScenario(scenarioName: keyof typeof TestScenariosFixture): Promise<void> {
    const scenario = TestScenariosFixture[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioName} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Seed scenario-specific data based on scenario type
      switch (scenarioName) {
        case 'orderFulfillment':
          await this.seedOrderFulfillmentScenario(queryRunner, scenario);
          break;
        case 'inventoryTransfer':
          await this.seedInventoryTransferScenario(queryRunner, scenario);
          break;
        case 'lowStockAlert':
          await this.seedLowStockAlertScenario(queryRunner, scenario);
          break;
        case 'tenantIsolation':
          await this.seedTenantIsolationScenario(queryRunner, scenario);
          break;
      }

      await queryRunner.commitTransaction();
      console.log(`✅ Scenario '${scenarioName}' seeded`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(`❌ Failed to seed scenario '${scenarioName}':`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Disable foreign key checks
      await queryRunner.query('SET session_replication_role = replica;');

      // Truncate all tables
      for (const entity of entities) {
        await queryRunner.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
      }

      // Re-enable foreign key checks
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Private helper methods

  private async seedTenants(queryRunner: QueryRunner): Promise<void> {
    for (const tenant of BaselineDataFixture.tenants) {
      await queryRunner.query(
        `INSERT INTO tenants (id, name, code, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [tenant.id, tenant.name, tenant.code, tenant.isActive, tenant.createdAt, tenant.updatedAt]
      );
    }
  }

  private async seedUsers(queryRunner: QueryRunner): Promise<void> {
    for (const user of BaselineDataFixture.users) {
      await queryRunner.query(
        `INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, tenant_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.username, user.email, user.passwordHash, user.firstName, user.lastName, user.role, user.tenantId, user.isActive]
      );
    }
  }

  private async seedCategories(queryRunner: QueryRunner): Promise<void> {
    for (const category of BaselineDataFixture.categories) {
      await queryRunner.query(
        `INSERT INTO categories (id, name, code, description, tenant_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [category.id, category.name, category.code, category.description, category.tenantId]
      );
    }
  }

  private async seedWarehouses(queryRunner: QueryRunner): Promise<void> {
    for (const warehouse of BaselineDataFixture.warehouses) {
      await queryRunner.query(
        `INSERT INTO warehouses (id, code, name, address, tenant_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [warehouse.id, warehouse.code, warehouse.name, warehouse.address, warehouse.tenantId]
      );
    }
  }

  private async seedProducts(queryRunner: QueryRunner): Promise<void> {
    for (const product of BaselineDataFixture.products) {
      await queryRunner.query(
        `INSERT INTO products (id, name, sku, description, category_id, unit, purchase_price, sale_price, min_stock, max_stock, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          product.id,
          product.name,
          product.sku,
          product.description,
          product.categoryId,
          product.unit,
          product.purchasePrice,
          product.salePrice,
          product.minStock,
          product.maxStock,
          product.tenantId,
        ]
      );
    }
  }

  private async seedCustomers(queryRunner: QueryRunner): Promise<void> {
    for (const customer of BaselineDataFixture.customers) {
      await queryRunner.query(
        `INSERT INTO customers (id, code, name, email, phone, address, city, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [customer.id, customer.code, customer.name, customer.email, customer.phone, customer.address, customer.city, customer.tenantId]
      );
    }
  }

  private async seedOrderFulfillmentScenario(queryRunner: QueryRunner, scenario: any): Promise<void> {
    // Seed product, stock, customer, order, and order items
    // Implementation depends on actual table schemas
    console.log('Seeding order fulfillment scenario...');
  }

  private async seedInventoryTransferScenario(queryRunner: QueryRunner, scenario: any): Promise<void> {
    // Seed inventory transfer scenario data
    console.log('Seeding inventory transfer scenario...');
  }

  private async seedLowStockAlertScenario(queryRunner: QueryRunner, scenario: any): Promise<void> {
    // Seed low stock alert scenario data
    console.log('Seeding low stock alert scenario...');
  }

  private async seedTenantIsolationScenario(queryRunner: QueryRunner, scenario: any): Promise<void> {
    // Seed tenant isolation scenario data
    console.log('Seeding tenant isolation scenario...');
  }
}
