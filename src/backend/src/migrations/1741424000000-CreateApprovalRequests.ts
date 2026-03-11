import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateApprovalRequests1741424000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create approval_requests table
    await queryRunner.createTable(
      new Table({
        name: 'approval_requests',
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
            name: 'workflow_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'requested_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rejection_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requested_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
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

    // Create indexes
    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_approval_requests_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_approval_requests_workflow_id',
        columnNames: ['workflow_id'],
      }),
    );

    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_approval_requests_entity',
        columnNames: ['entity_type', 'entity_id'],
      }),
    );

    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_approval_requests_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'approval_requests',
      new TableIndex({
        name: 'IDX_approval_requests_requested_by',
        columnNames: ['requested_by'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'approval_requests',
      new TableForeignKey({
        name: 'FK_approval_requests_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'approval_requests',
      new TableForeignKey({
        name: 'FK_approval_requests_workflow',
        columnNames: ['workflow_id'],
        referencedTableName: 'workflows',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'approval_requests',
      new TableForeignKey({
        name: 'FK_approval_requests_requested_by',
        columnNames: ['requested_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'approval_requests',
      new TableForeignKey({
        name: 'FK_approval_requests_approved_by',
        columnNames: ['approved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('approval_requests', 'FK_approval_requests_approved_by');
    await queryRunner.dropForeignKey('approval_requests', 'FK_approval_requests_requested_by');
    await queryRunner.dropForeignKey('approval_requests', 'FK_approval_requests_workflow');
    await queryRunner.dropForeignKey('approval_requests', 'FK_approval_requests_tenant');

    // Drop indexes
    await queryRunner.dropIndex('approval_requests', 'IDX_approval_requests_requested_by');
    await queryRunner.dropIndex('approval_requests', 'IDX_approval_requests_status');
    await queryRunner.dropIndex('approval_requests', 'IDX_approval_requests_entity');
    await queryRunner.dropIndex('approval_requests', 'IDX_approval_requests_workflow_id');
    await queryRunner.dropIndex('approval_requests', 'IDX_approval_requests_tenant_id');

    // Drop table
    await queryRunner.dropTable('approval_requests');
  }
}
