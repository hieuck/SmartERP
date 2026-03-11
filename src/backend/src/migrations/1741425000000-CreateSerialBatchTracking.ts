import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSerialBatchTracking1741425000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tracking fields to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "tracking_type" VARCHAR(10) DEFAULT 'none' NOT NULL,
      ADD COLUMN "has_expiry" BOOLEAN DEFAULT false NOT NULL
    `);

    // Create serial_numbers table
    await queryRunner.createTable(
      new Table({
        name: 'serial_numbers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'number',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'warehouse_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'available'",
            isNullable: false,
          },
          {
            name: 'purchase_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'warranty_expiry',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create batches table
    await queryRunner.createTable(
      new Table({
        name: 'batches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'number',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'product_id',
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
            name: 'manufacturing_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'expiry_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create batch_stocks table
    await queryRunner.createTable(
      new Table({
        name: 'batch_stocks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'batch_id',
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
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for serial_numbers
    await queryRunner.createIndex(
      'serial_numbers',
      new TableIndex({
        name: 'IDX_serial_numbers_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'serial_numbers',
      new TableIndex({
        name: 'IDX_serial_numbers_tenant_number',
        columnNames: ['tenant_id', 'number'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'serial_numbers',
      new TableIndex({
        name: 'IDX_serial_numbers_product',
        columnNames: ['tenant_id', 'product_id'],
      }),
    );

    await queryRunner.createIndex(
      'serial_numbers',
      new TableIndex({
        name: 'IDX_serial_numbers_status',
        columnNames: ['tenant_id', 'status'],
      }),
    );

    // Create indexes for batches
    await queryRunner.createIndex(
      'batches',
      new TableIndex({
        name: 'IDX_batches_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'batches',
      new TableIndex({
        name: 'IDX_batches_tenant_number',
        columnNames: ['tenant_id', 'number'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'batches',
      new TableIndex({
        name: 'IDX_batches_product',
        columnNames: ['tenant_id', 'product_id'],
      }),
    );

    // Create indexes for batch_stocks
    await queryRunner.createIndex(
      'batch_stocks',
      new TableIndex({
        name: 'IDX_batch_stocks_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'batch_stocks',
      new TableIndex({
        name: 'IDX_batch_stocks_unique',
        columnNames: ['tenant_id', 'batch_id', 'warehouse_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'batch_stocks',
      new TableIndex({
        name: 'IDX_batch_stocks_warehouse',
        columnNames: ['tenant_id', 'warehouse_id'],
      }),
    );

    // Create foreign keys for serial_numbers
    await queryRunner.createForeignKey(
      'serial_numbers',
      new TableForeignKey({
        name: 'FK_serial_numbers_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'serial_numbers',
      new TableForeignKey({
        name: 'FK_serial_numbers_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign keys for batches
    await queryRunner.createForeignKey(
      'batches',
      new TableForeignKey({
        name: 'FK_batches_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'batches',
      new TableForeignKey({
        name: 'FK_batches_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign keys for batch_stocks
    await queryRunner.createForeignKey(
      'batch_stocks',
      new TableForeignKey({
        name: 'FK_batch_stocks_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'batch_stocks',
      new TableForeignKey({
        name: 'FK_batch_stocks_batch',
        columnNames: ['batch_id'],
        referencedTableName: 'batches',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('batch_stocks', 'FK_batch_stocks_batch');
    await queryRunner.dropForeignKey('batch_stocks', 'FK_batch_stocks_tenant');
    await queryRunner.dropForeignKey('batches', 'FK_batches_product');
    await queryRunner.dropForeignKey('batches', 'FK_batches_tenant');
    await queryRunner.dropForeignKey('serial_numbers', 'FK_serial_numbers_product');
    await queryRunner.dropForeignKey('serial_numbers', 'FK_serial_numbers_tenant');

    // Drop indexes
    await queryRunner.dropIndex('batch_stocks', 'IDX_batch_stocks_warehouse');
    await queryRunner.dropIndex('batch_stocks', 'IDX_batch_stocks_unique');
    await queryRunner.dropIndex('batch_stocks', 'IDX_batch_stocks_tenant_id');
    await queryRunner.dropIndex('batches', 'IDX_batches_product');
    await queryRunner.dropIndex('batches', 'IDX_batches_tenant_number');
    await queryRunner.dropIndex('batches', 'IDX_batches_tenant_id');
    await queryRunner.dropIndex('serial_numbers', 'IDX_serial_numbers_status');
    await queryRunner.dropIndex('serial_numbers', 'IDX_serial_numbers_product');
    await queryRunner.dropIndex('serial_numbers', 'IDX_serial_numbers_tenant_number');
    await queryRunner.dropIndex('serial_numbers', 'IDX_serial_numbers_tenant_id');

    // Drop tables
    await queryRunner.dropTable('batch_stocks');
    await queryRunner.dropTable('batches');
    await queryRunner.dropTable('serial_numbers');

    // Remove tracking fields from products
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "has_expiry",
      DROP COLUMN "tracking_type"
    `);
  }
}
