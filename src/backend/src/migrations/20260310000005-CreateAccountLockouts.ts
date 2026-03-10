import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAccountLockouts1741700000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'account_lockouts',
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
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'locked_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'locked_until',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'failed_attempts',
            type: 'int',
            default: 0,
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
            onDelete: 'CASCADE',
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
      'account_lockouts',
      new TableIndex({
        name: 'idx_account_lockouts_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'account_lockouts',
      new TableIndex({
        name: 'idx_account_lockouts_locked_until',
        columnNames: ['locked_until'],
      }),
    );

    await queryRunner.createIndex(
      'account_lockouts',
      new TableIndex({
        name: 'idx_account_lockouts_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('account_lockouts', true);
  }
}
