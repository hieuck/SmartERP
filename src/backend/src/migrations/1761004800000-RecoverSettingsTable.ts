import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoverSettingsTable1761004800000 implements MigrationInterface {
  name = 'RecoverSettingsTable1761004800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'system_settings'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'settings'
        ) THEN
          ALTER TABLE "system_settings" RENAME TO "settings";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "created_by" uuid,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "key" VARCHAR(100) NOT NULL,
        "value" TEXT NOT NULL DEFAULT '',
        "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
        "data_type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
        "description" TEXT,
        "is_public" BOOLEAN NOT NULL DEFAULT false
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "tenant_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "created_by" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "sync_status" character varying NOT NULL DEFAULT 'synced'
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "offline_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "category" character varying(50) NOT NULL DEFAULT 'GENERAL'
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "data_type" character varying(20) NOT NULL DEFAULT 'STRING'
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'settings'
            AND column_name = 'value'
            AND data_type = 'jsonb'
        ) THEN
          ALTER TABLE "settings"
          ALTER COLUMN "value" TYPE text
          USING CASE
            WHEN jsonb_typeof("value") = 'string' THEN trim(both '"' from "value"::text)
            ELSE "value"::text
          END;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      ALTER COLUMN "value" SET DEFAULT ''
    `);

    await queryRunner.query(`
      UPDATE "settings"
      SET "category" = 'GENERAL'
      WHERE "category" IS NULL OR "category" = ''
    `);
    await queryRunner.query(`
      UPDATE "settings"
      SET "data_type" = 'STRING'
      WHERE "data_type" IS NULL OR "data_type" = ''
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        fallback_tenant_id uuid;
        tenant_count integer;
        null_tenant_count integer;
      BEGIN
        SELECT COUNT(*)
        INTO null_tenant_count
        FROM "settings"
        WHERE "tenant_id" IS NULL;

        IF null_tenant_count = 0 THEN
          RETURN;
        END IF;

        SELECT COUNT(*)
        INTO tenant_count
        FROM "tenants";

        IF tenant_count = 1 THEN
          SELECT "id"
          INTO fallback_tenant_id
          FROM "tenants"
          LIMIT 1;

          UPDATE "settings"
          SET "tenant_id" = fallback_tenant_id
          WHERE "tenant_id" IS NULL;
        ELSIF tenant_count > 1 THEN
          INSERT INTO "settings" (
            "id",
            "tenant_id",
            "created_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "version",
            "last_synced_at",
            "sync_status",
            "offline_id",
            "key",
            "value",
            "category",
            "data_type",
            "description",
            "is_public"
          )
          SELECT
            gen_random_uuid(),
            "tenant"."id",
            "setting"."created_by",
            "setting"."created_at",
            "setting"."updated_at",
            "setting"."deleted_at",
            "setting"."version",
            "setting"."last_synced_at",
            "setting"."sync_status",
            "setting"."offline_id",
            "setting"."key",
            "setting"."value",
            "setting"."category",
            "setting"."data_type",
            "setting"."description",
            "setting"."is_public"
          FROM "settings" "setting"
          CROSS JOIN "tenants" "tenant"
          WHERE "setting"."tenant_id" IS NULL
            AND NOT EXISTS (
              SELECT 1
              FROM "settings" "existing"
              WHERE "existing"."tenant_id" = "tenant"."id"
                AND "existing"."key" = "setting"."key"
            );

          DELETE FROM "settings"
          WHERE "tenant_id" IS NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      UPDATE "settings"
      SET "value" = ''
      WHERE "value" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM "settings"
          WHERE "tenant_id" IS NULL
        ) THEN
          ALTER TABLE "settings"
          ALTER COLUMN "tenant_id" SET NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      ALTER COLUMN "value" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP CONSTRAINT IF EXISTS "system_settings_key_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP CONSTRAINT IF EXISTS "settings_key_key"
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_public"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_settings_tenant_key"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'settings'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'system_settings'
        ) THEN
          ALTER TABLE "settings" RENAME TO "system_settings";
        END IF;
      END
      $$;
    `);
  }
}
