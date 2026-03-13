import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTokenBlacklist1741700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'token_blacklist',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'revocation_reason',
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
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_token_hash',
        columnNames: ['token_hash'],
      }),
    );

    // Add check constraint for token_type
    await queryRunner.query(
      `ALTER TABLE token_blacklist ADD CONSTRAINT chk_token_type CHECK (token_type IN ('access', 'refresh'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('token_blacklist', true);
  }
}
