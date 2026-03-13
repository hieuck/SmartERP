import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLoginAttempts1741700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'login_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'email',
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
            name: 'success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'failure_reason',
            type: 'varchar',
            length: '255',
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
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_ip_address',
        columnNames: ['ip_address'],
      }),
    );

    // Composite indexes for rate limiting
    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_user_time',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'login_attempts',
      new TableIndex({
        name: 'idx_login_attempts_email_time',
        columnNames: ['email', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('login_attempts', true);
  }
}
