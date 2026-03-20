import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignStockTableWithInventoryEntity1761004200000 implements MigrationInterface {
  name = 'AlignStockTableWithInventoryEntity1761004200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "tenant_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "sync_status" character varying NOT NULL DEFAULT 'synced'
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "offline_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "reorder_point" numeric(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "reorder_quantity" numeric(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "last_restock_date" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "last_count_date" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "unit_cost" numeric(10,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "total_value" numeric(15,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "location" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "bin" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "aisle" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "shelf" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD COLUMN IF NOT EXISTS "notes" text
    `);

    await queryRunner.query(`
      UPDATE "stock" AS stock
      SET "tenant_id" = products."tenant_id"
      FROM "products" AS products
      WHERE stock."tenant_id" IS NULL
        AND products."id" = stock."product_id"
    `);

    await queryRunner.query(`
      UPDATE "stock"
      SET "available" = COALESCE("quantity", 0) - COALESCE("reserved", 0)
      WHERE "available" IS NULL
         OR "available" != COALESCE("quantity", 0) - COALESCE("reserved", 0)
    `);

    await queryRunner.query(`
      UPDATE "stock"
      SET "reorder_point" = COALESCE(NULLIF("reorder_point", 0), COALESCE("min_stock", 0))
      WHERE "reorder_point" = 0
    `);

    await queryRunner.query(`
      UPDATE "stock"
      SET "total_value" = COALESCE("quantity", 0) * COALESCE("unit_cost", 0)
      WHERE "total_value" = 0
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'stock'
            AND column_name = 'tenant_id'
            AND is_nullable = 'NO'
        ) AND NOT EXISTS (
          SELECT 1
          FROM "stock"
          WHERE "tenant_id" IS NULL
        ) THEN
          ALTER TABLE "stock"
          ALTER COLUMN "tenant_id" SET NOT NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_tenant_product"
      ON "stock" ("tenant_id", "product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_tenant_warehouse"
      ON "stock" ("tenant_id", "warehouse_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_tenant_quantity"
      ON "stock" ("tenant_id", "quantity")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_sync_status"
      ON "stock" ("sync_status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_last_synced_at"
      ON "stock" ("last_synced_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_last_synced_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_sync_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_tenant_quantity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_tenant_warehouse"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_tenant_product"`);
    await queryRunner.query(`
      ALTER TABLE "stock"
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "metadata",
      DROP COLUMN IF EXISTS "shelf",
      DROP COLUMN IF EXISTS "aisle",
      DROP COLUMN IF EXISTS "bin",
      DROP COLUMN IF EXISTS "location",
      DROP COLUMN IF EXISTS "total_value",
      DROP COLUMN IF EXISTS "unit_cost",
      DROP COLUMN IF EXISTS "last_count_date",
      DROP COLUMN IF EXISTS "last_restock_date",
      DROP COLUMN IF EXISTS "reorder_quantity",
      DROP COLUMN IF EXISTS "reorder_point",
      DROP COLUMN IF EXISTS "offline_id",
      DROP COLUMN IF EXISTS "sync_status",
      DROP COLUMN IF EXISTS "last_synced_at",
      DROP COLUMN IF EXISTS "version",
      DROP COLUMN IF EXISTS "tenant_id"
    `);
  }
}
