import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTable1761004800000 implements MigrationInterface {
  name = 'CreateSettingsTable1761004800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "key" character varying(100) NOT NULL,
        "value" text NOT NULL,
        "category" character varying(50) NOT NULL,
        "data_type" character varying(20) NOT NULL DEFAULT 'STRING',
        "description" text,
        "is_public" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_settings_tenant_key"
      ON "settings" ("tenant_id", "key")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_tenant_category"
      ON "settings" ("tenant_id", "category")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_public"
      ON "settings" ("tenant_id", "is_public")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_sync_status"
      ON "settings" ("sync_status")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'system_settings'
        ) AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'system_settings'
            AND column_name = 'tenant_id'
        ) THEN
          INSERT INTO "settings" (
            "tenant_id",
            "created_by",
            "created_at",
            "updated_at",
            "key",
            "value",
            "category",
            "data_type",
            "description",
            "is_public"
          )
          SELECT
            ss."tenant_id",
            ss."updated_by",
            COALESCE(ss."created_at", CURRENT_TIMESTAMP),
            COALESCE(ss."updated_at", CURRENT_TIMESTAMP),
            ss."key",
            COALESCE(ss."value"::text, ''),
            UPPER(COALESCE(ss."category", 'general')),
            UPPER(COALESCE(ss."type", 'string')),
            ss."description",
            false
          FROM "system_settings" ss
          WHERE ss."tenant_id" IS NOT NULL
          ON CONFLICT ("tenant_id", "key") DO NOTHING;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_public"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_tenant_key"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
  }
}
