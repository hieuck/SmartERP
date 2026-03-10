import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordAndAvatarFields1741334400000 implements MigrationInterface {
  name = 'AddResetPasswordAndAvatarFields1741334400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "reset_password_token" character varying,
      ADD COLUMN "reset_password_expires" TIMESTAMP,
      ADD COLUMN "avatar" character varying;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_reset_token" ON "users" ("reset_password_token");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_reset_token";`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "avatar",
      DROP COLUMN IF EXISTS "reset_password_expires",
      DROP COLUMN IF EXISTS "reset_password_token";
    `);
  }
}
