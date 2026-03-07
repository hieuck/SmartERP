import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToBaseEntity1741422000000 implements MigrationInterface {
  name = 'AddCreatedByToBaseEntity1741422000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all tables that extend BaseEntity (have tenant_id column)
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' 
      AND table_schema = 'public'
    `);

    // Add created_by column to all tables
    for (const { table_name } of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table_name}" 
        ADD COLUMN IF NOT EXISTS "created_by" uuid NULL
      `);
    }

    // Add comment
    await queryRunner.query(`
      COMMENT ON COLUMN accounts.created_by IS 'User ID who created this record'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get all tables that have created_by column
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'created_by' 
      AND table_schema = 'public'
    `);

    // Remove created_by column from all tables
    for (const { table_name } of tables) {
      await queryRunner.query(`
        ALTER TABLE "${table_name}" 
        DROP COLUMN IF EXISTS "created_by"
      `);
    }
  }
}
