import { DataSource } from 'typeorm';

export class DatabaseTestHelper {
  private static dataSource: DataSource;

  static async setupTestDatabase(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'erp_test',
      entities: ['src/**/*.entity.ts'],
      synchronize: true, // Only for tests
      dropSchema: true, // Clean slate for each test run
      logging: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  static async cleanDatabase(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      return;
    }

    const entities = this.dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  static async closeDatabase(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  static getDataSource(): DataSource {
    return this.dataSource;
  }
}
