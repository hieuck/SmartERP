import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSessions1741700000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
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
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'refresh_token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
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
            name: 'device_info',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_activity_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
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
      'sessions',
      new TableIndex({
        name: 'idx_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_refresh_token_hash',
        columnNames: ['refresh_token_hash'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_tenant_id',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'idx_sessions_last_activity_at',
        columnNames: ['last_activity_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions', true);
  }
}
