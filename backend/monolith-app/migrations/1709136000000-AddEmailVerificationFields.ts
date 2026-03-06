import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationFields1709136000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email_verified column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verified',
        type: 'boolean',
        default: false,
      }),
    );

    // Add email_verification_token column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verification_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add phone column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'phone');
    await queryRunner.dropColumn('users', 'email_verification_token');
    await queryRunner.dropColumn('users', 'email_verified');
  }
}
