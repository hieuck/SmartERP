import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrderTable1710838800000 implements MigrationInterface {
  name = 'CreatePurchaseOrderTable1710838800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "version" integer NOT NULL DEFAULT 1,
        "last_synced_at" TIMESTAMP,
        "sync_status" character varying NOT NULL DEFAULT 'synced',
        "offline_id" uuid,
        "po_number" character varying NOT NULL,
        "supplier_id" uuid NOT NULL,
        "order_date" date,
        "expected_delivery_date" date,
        "status" character varying NOT NULL DEFAULT 'draft',
        "total_amount" numeric(15,2) NOT NULL DEFAULT 0,
        "shipping_fee" numeric(15,2) NOT NULL DEFAULT 0,
        "discount_amount" numeric(15,2) NOT NULL DEFAULT 0,
        "delivery_address" text,
        "payment_terms" text,
        "notes" text,
        "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "metadata" jsonb,
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_orders_tenant_po_number" UNIQUE ("tenant_id", "po_number"),
        CONSTRAINT "FK_purchase_orders_supplier"
          FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
          ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_tenant_supplier"
      ON "purchase_orders" ("tenant_id", "supplier_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_tenant_status"
      ON "purchase_orders" ("tenant_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_orders_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_orders_tenant_supplier"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_orders"`);
  }
}
