import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStockValuations1741426000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stock_valuations table
    await queryRunner.createTable(
      new Table({
        name: 'stock_valuations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'stock_valuations',
      new TableIndex({
        name: 'IDX_stock_valuations_product_warehouse_tenant',
        columnNames: ['product_id', 'warehouse_id', 'tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'stock_valuations',
      new TableIndex({
        name: 'IDX_stock_valuations_date_created',
        columnNames: ['date', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'stock_valuations',
      new TableIndex({
        name: 'IDX_stock_valuations_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    // Create foreign key to products table
    await queryRunner.createForeignKey(
      'stock_valuations',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('stock_valuations');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('product_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('stock_valuations', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('stock_valuations', 'IDX_stock_valuations_product_warehouse_tenant');
    await queryRunner.dropIndex('stock_valuations', 'IDX_stock_valuations_date_created');
    await queryRunner.dropIndex('stock_valuations', 'IDX_stock_valuations_tenant');

    // Drop table
    await queryRunner.dropTable('stock_valuations');
  }
}
