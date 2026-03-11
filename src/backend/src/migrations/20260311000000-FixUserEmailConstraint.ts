import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserEmailConstraint20260311000000 implements MigrationInterface {
  name = 'FixUserEmailConstraint20260311000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old unique constraint on email
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"
    `);

    // Create a new unique constraint on (tenant_id, email)
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_tenant_email" UNIQUE ("tenant_id", "email")
    `);

    // Create index for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_tenant_email" ON "users" ("tenant_id", "email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to old constraint
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_tenant_email"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_tenant_email"
    `);

    // Recreate old constraint (this may fail if there are duplicate emails across tenants)
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
    `);
  }
}
