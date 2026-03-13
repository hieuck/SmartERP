import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTwoFactorAuth1741700000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'two_factor_auth',
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
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'otp_secret',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'backup_codes',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'enabled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
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
      'two_factor_auth',
      new TableIndex({
        name: 'idx_two_factor_auth_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'two_factor_auth',
      new TableIndex({
        name: 'idx_two_factor_auth_enabled',
        columnNames: ['enabled'],
      }),
    );

    await queryRunner.createIndex(
      'two_factor_auth',
      new TableIndex({
        name: 'idx_two_factor_auth_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('two_factor_auth', true);
  }
}
