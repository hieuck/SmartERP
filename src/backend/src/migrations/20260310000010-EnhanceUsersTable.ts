import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class EnhanceUsersTable1741700000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email_verification_expires_at column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verification_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add reset_password_expires_at column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'reset_password_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add created_by column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'created_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add updated_by column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'updated_by',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign keys for audit fields
    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL`,
    );

    // Add indexes for new columns
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email_verification_expires_at',
        columnNames: ['email_verification_expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_reset_password_expires_at',
        columnNames: ['reset_password_expires_at'],
      }),
    );

    // Add check constraint for status if not exists
    const statusConstraintExists = await queryRunner.query(
      `SELECT constraint_name FROM information_schema.table_constraints 
       WHERE table_name = 'users' AND constraint_name = 'chk_users_status'`,
    );

    if (!statusConstraintExists || statusConstraintExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'))`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_created_by`,
    );

    await queryRunner.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_updated_by`,
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'users',
      'idx_users_email_verification_expires_at',
    );

    await queryRunner.dropIndex(
      'users',
      'idx_users_reset_password_expires_at',
    );

    // Drop columns
    await queryRunner.dropColumn('users', 'email_verification_expires_at');
    await queryRunner.dropColumn('users', 'reset_password_expires_at');
    await queryRunner.dropColumn('users', 'created_by');
    await queryRunner.dropColumn('users', 'updated_by');
  }
}
