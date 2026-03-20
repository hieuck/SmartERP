import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignPaymentsTableWithEntity1761003600000 implements MigrationInterface {
  name = 'AlignPaymentsTableWithEntity1761003600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "tenant_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "sync_status" character varying NOT NULL DEFAULT 'synced'
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "offline_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "currency" character varying(10) NOT NULL DEFAULT 'VND'
    `);
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);

    await queryRunner.query(`
      UPDATE "payments" AS payment
      SET "tenant_id" = "orders"."tenant_id"
      FROM "orders"
      WHERE payment."tenant_id" IS NULL
        AND payment."order_id" = "orders"."id"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'payments'
            AND column_name = 'tenant_id'
            AND is_nullable = 'NO'
        ) AND NOT EXISTS (
          SELECT 1
          FROM "payments"
          WHERE "tenant_id" IS NULL
        ) THEN
          ALTER TABLE "payments"
          ALTER COLUMN "tenant_id" SET NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_order"
      ON "payments" ("tenant_id", "order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_status"
      ON "payments" ("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_sync_status"
      ON "payments" ("sync_status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_last_synced_at"
      ON "payments" ("last_synced_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_last_synced_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_order"`);
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN IF EXISTS "metadata",
      DROP COLUMN IF EXISTS "currency",
      DROP COLUMN IF EXISTS "offline_id",
      DROP COLUMN IF EXISTS "sync_status",
      DROP COLUMN IF EXISTS "last_synced_at",
      DROP COLUMN IF EXISTS "version",
      DROP COLUMN IF EXISTS "tenant_id"
    `);
  }
}
