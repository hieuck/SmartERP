import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuthAuditLogs1741700000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'event_action',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_event_type',
        columnNames: ['event_type'],
      }),
    );

    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_status',
        columnNames: ['status'],
      }),
    );

    // Composite index for common queries
    await queryRunner.createIndex(
      'auth_audit_logs',
      new TableIndex({
        name: 'idx_auth_audit_logs_user_time',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // Add check constraint for status
    await queryRunner.query(
      `ALTER TABLE auth_audit_logs ADD CONSTRAINT chk_audit_status CHECK (status IN ('success', 'failure'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_audit_logs', true);
  }
}
