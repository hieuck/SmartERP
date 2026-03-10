import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAccountCOAFields1741420800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_group column
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'is_group',
        type: 'boolean',
        default: false,
      }),
    );

    // Add is_active column
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
    );

    // Update enum values: change 'revenue' to 'income'
    await queryRunner.query(`
      UPDATE accounts 
      SET type = 'income' 
      WHERE type = 'revenue'
    `);

    // Recreate enum type with new values
    await queryRunner.query(`
      ALTER TABLE accounts 
      ALTER COLUMN type TYPE varchar(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "accounts_type_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "accounts_type_enum" AS ENUM ('asset', 'liability', 'equity', 'income', 'expense')
    `);

    await queryRunner.query(`
      ALTER TABLE accounts 
      ALTER COLUMN type TYPE "accounts_type_enum" USING type::"accounts_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert enum changes
    await queryRunner.query(`
      ALTER TABLE accounts 
      ALTER COLUMN type TYPE varchar(50)
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "accounts_type_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "accounts_type_enum" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense')
    `);

    await queryRunner.query(`
      ALTER TABLE accounts 
      ALTER COLUMN type TYPE "accounts_type_enum" USING type::"accounts_type_enum"
    `);

    await queryRunner.query(`
      UPDATE accounts 
      SET type = 'revenue' 
      WHERE type = 'income'
    `);

    // Remove is_active column
    await queryRunner.dropColumn('accounts', 'is_active');

    // Remove is_group column
    await queryRunner.dropColumn('accounts', 'is_group');
  }
}
