import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailVerifications1741700000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verifications',
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
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'verification_code',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'attempts',
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
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'idx_email_verifications_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'idx_email_verifications_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'idx_email_verifications_verification_code',
        columnNames: ['verification_code'],
      }),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new TableIndex({
        name: 'idx_email_verifications_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verifications', true);
  }
}
