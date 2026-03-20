import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1761006000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1761006000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'audit_logs_action_enum'
        ) THEN
          CREATE TYPE "audit_logs_action_enum" AS ENUM (
            'CREATE',
            'UPDATE',
            'DELETE',
            'LOGIN',
            'LOGOUT',
            'EXPORT',
            'IMPORT'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "action" "audit_logs_action_enum" NOT NULL,
        "entity_type" character varying NOT NULL,
        "entity_id" uuid,
        "old_value" jsonb,
        "new_value" jsonb,
        "ip_address" character varying,
        "user_agent" character varying,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "tenant_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "user_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "action" "audit_logs_action_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "entity_type" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "entity_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "old_value" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "new_value" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "ip_address" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "user_agent" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "description" text
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_tenant_created"
      ON "audit_logs" ("tenant_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_tenant_user"
      ON "audit_logs" ("tenant_id", "user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_tenant_entity"
      ON "audit_logs" ("tenant_id", "entity_type", "entity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_tenant_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_tenant_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_tenant_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'audit_logs_action_enum'
        ) THEN
          DROP TYPE "audit_logs_action_enum";
        END IF;
      END
      $$;
    `);
  }
}
