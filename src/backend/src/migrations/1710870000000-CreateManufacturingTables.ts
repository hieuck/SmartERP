import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateManufacturingTables1710870000000 implements MigrationInterface {
  name = 'CreateManufacturingTables1710870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_centers_sync_status_enum') THEN
          CREATE TYPE "work_centers_sync_status_enum" AS ENUM ('synced', 'pending', 'conflict');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boms_type_enum') THEN
          CREATE TYPE "boms_type_enum" AS ENUM ('manufacture', 'kit');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_orders_status_enum') THEN
          CREATE TYPE "work_orders_status_enum" AS ENUM (
            'draft',
            'planned',
            'ready',
            'in_progress',
            'paused',
            'completed',
            'cancelled'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_centers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" "work_centers_sync_status_enum" NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "time_efficiency" numeric(10,2) NOT NULL DEFAULT 100,
        "capacity_per_cycle" numeric(10,2) NOT NULL DEFAULT 1,
        "cost_per_hour" numeric(15,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "boms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "reference" character varying NOT NULL UNIQUE,
        "product_qty" numeric(10,2) NOT NULL DEFAULT 1,
        "type" "boms_type_enum" NOT NULL DEFAULT 'manufacture',
        "is_active" boolean NOT NULL DEFAULT true,
        "total_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "unit_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bom_lines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "bom_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" numeric(10,2) NOT NULL,
        "unit_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "total_cost" numeric(15,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "reference" character varying NOT NULL UNIQUE,
        "product_id" uuid NOT NULL,
        "bom_id" uuid,
        "qty_to_produce" numeric(10,2) NOT NULL,
        "qty_produced" numeric(10,2) NOT NULL DEFAULT 0,
        "status" "work_orders_status_enum" NOT NULL DEFAULT 'draft',
        "date_planned_start" TIMESTAMP,
        "date_planned_finished" TIMESTAMP,
        "date_start" TIMESTAMP,
        "date_finished" TIMESTAMP,
        "responsible_id" uuid,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_work_centers_tenant_code" ON "work_centers" ("tenant_id", "code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_boms_tenant_product" ON "boms" ("tenant_id", "product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bom_lines_tenant_bom" ON "bom_lines" ("tenant_id", "bom_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_work_orders_tenant_product" ON "work_orders" ("tenant_id", "product_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_work_orders_tenant_status" ON "work_orders" ("tenant_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_orders_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_orders_tenant_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bom_lines_tenant_bom"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boms_tenant_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_centers_tenant_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bom_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "boms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_centers"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "work_orders_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "boms_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "work_centers_sync_status_enum"`);
  }
}
