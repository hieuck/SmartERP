import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Test Database Setup Utility
 * Manages test database connections, seeding, and cleanup
 */
export class TestDatabaseSetup {
  private static dataSource: DataSource;

  /**
   * Initialize test database connection
   * Creates a clean database for testing
   */
  static async setupTestDatabase(): Promise<DataSource> {
    const config: DataSourceOptions = {
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: process.env.TEST_DB_NAME || 'erp_test',
      entities: ['src/**/*.entity.ts'],
      synchronize: true, // Only for test DB - creates schema automatically
      dropSchema: true, // Clean slate for each test run
      logging: process.env.TEST_DB_LOGGING === 'true',
    };

    this.dataSource = new DataSource(config);
    await this.dataSource.initialize();
    
    console.log('✅ Test database initialized');
    return this.dataSource;
  }

  /**
   * Close test database connection
   */
  static async teardownTestDatabase(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      console.log('✅ Test database connection closed');
    }
  }

  /**
   * Get current data source instance
   */
  static getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Test database not initialized. Call setupTestDatabase() first.');
    }
    return this.dataSource;
  }

  /**
   * Seed baseline test data
   * Creates essential data needed for most tests
   */
  static async seedTestData(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create test tenants
      await queryRunner.query(`
        INSERT INTO tenants (id, name, code, is_active, created_at, updated_at) 
        VALUES 
          ('test-tenant-001', 'Test Tenant 1', 'TEST001', true, NOW(), NOW()),
          ('test-tenant-002', 'Test Tenant 2', 'TEST002', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create test users
      await queryRunner.query(`
        INSERT INTO users (id, username, email, password_hash, role, tenant_id, is_active, created_at, updated_at)
        VALUES 
          ('test-user-001', 'testadmin', 'admin@test.com', '$2b$10$hashedpassword', 'admin', 'test-tenant-001', true, NOW(), NOW()),
          ('test-user-002', 'teststaff', 'staff@test.com', '$2b$10$hashedpassword', 'staff', 'test-tenant-001', true, NOW(), NOW()),
          ('test-user-003', 'testadmin2', 'admin2@test.com', '$2b$10$hashedpassword', 'admin', 'test-tenant-002', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create test categories
      await queryRunner.query(`
        INSERT INTO categories (id, name, code, tenant_id, created_at, updated_at)
        VALUES 
          ('cat-001', 'Tượng thạch cao', 'TUONG', 'test-tenant-001', NOW(), NOW()),
          ('cat-002', 'Nguyên liệu', 'NGUYEN-LIEU', 'test-tenant-001', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Create test warehouses
      await queryRunner.query(`
        INSERT INTO warehouses (id, code, name, address, tenant_id, created_at, updated_at)
        VALUES 
          ('warehouse-001', 'WH-001', 'Kho chính', '123 Test Street', 'test-tenant-001', NOW(), NOW()),
          ('warehouse-002', 'WH-002', 'Kho phụ', '456 Test Avenue', 'test-tenant-001', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      await queryRunner.commitTransaction();
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Failed to seed test data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clean up all test data
   * Truncates all tables while preserving schema
   */
  static async cleanupTestData(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Disable foreign key checks temporarily
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

  /**
   * Execute raw SQL query (for test setup)
   */
  static async executeQuery(sql: string, parameters?: any[]): Promise<any> {
    return this.dataSource.query(sql, parameters);
  }

  /**
   * Create a test transaction
   * Useful for tests that need to rollback changes
   */
  static async createTestTransaction() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }
}
