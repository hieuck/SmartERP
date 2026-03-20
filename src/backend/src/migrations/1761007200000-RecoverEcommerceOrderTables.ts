import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecoverEcommerceOrderTables1761007200000 implements MigrationInterface {
  name = 'RecoverEcommerceOrderTables1761007200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "cart_id" character varying,
      ADD COLUMN IF NOT EXISTS "payment_status" character varying NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "shipping_status" character varying NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "shipping" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discount" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "coupon_code" character varying,
      ADD COLUMN IF NOT EXISTS "customer_email" character varying,
      ADD COLUMN IF NOT EXISTS "customer_phone" character varying,
      ADD COLUMN IF NOT EXISTS "shipping_address" jsonb,
      ADD COLUMN IF NOT EXISTS "billing_address" jsonb,
      ADD COLUMN IF NOT EXISTS "payment_method" character varying,
      ADD COLUMN IF NOT EXISTS "payment_transaction_id" character varying,
      ADD COLUMN IF NOT EXISTS "paid_at" timestamp,
      ADD COLUMN IF NOT EXISTS "shipping_method" character varying,
      ADD COLUMN IF NOT EXISTS "tracking_number" character varying,
      ADD COLUMN IF NOT EXISTS "shipped_at" timestamp,
      ADD COLUMN IF NOT EXISTS "delivered_at" timestamp,
      ADD COLUMN IF NOT EXISTS "customer_notes" text,
      ADD COLUMN IF NOT EXISTS "internal_notes" text,
      ADD COLUMN IF NOT EXISTS "cancelled_by" character varying,
      ADD COLUMN IF NOT EXISTS "cancellation_reason" text,
      ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp
    `);

    await queryRunner.query(`
      UPDATE "orders"
      SET
        "subtotal" = COALESCE("subtotal", "total_amount", 0),
        "tax" = COALESCE("tax", 0),
        "shipping" = COALESCE("shipping", 0),
        "discount" = COALESCE("discount", 0),
        "payment_status" = COALESCE(NULLIF("payment_status", ''), 'pending'),
        "shipping_status" = COALESCE(NULLIF("shipping_status", ''), 'pending'),
        "customer_email" = COALESCE(
          "customer_email",
          CASE
            WHEN jsonb_typeof("billing_address") = 'object' THEN NULLIF("billing_address"->>'email', '')
            WHEN jsonb_typeof("shipping_address") = 'object' THEN NULLIF("shipping_address"->>'email', '')
            ELSE NULL
          END
        ),
        "customer_phone" = COALESCE(
          "customer_phone",
          CASE
            WHEN jsonb_typeof("billing_address") = 'object' THEN NULLIF("billing_address"->>'phone', '')
            WHEN jsonb_typeof("shipping_address") = 'object' THEN NULLIF("shipping_address"->>'phone', '')
            ELSE NULL
          END
        )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" character varying,
        "product_name" character varying NOT NULL,
        "product_sku" character varying NOT NULL,
        "product_image" character varying,
        "price" numeric(10,2) NOT NULL,
        "quantity" integer NOT NULL,
        "selected_variant" jsonb,
        "notes" text,
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_items_order_id" ON "order_items" ("order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_items_tenant_id" ON "order_items" ("tenant_id")
    `);

    await queryRunner.query(`
      INSERT INTO "order_items" (
        "order_id",
        "product_id",
        "product_name",
        "product_sku",
        "product_image",
        "price",
        "quantity",
        "selected_variant",
        "notes",
        "tenant_id"
      )
      SELECT
        o."id",
        NULLIF(item->>'productId', ''),
        COALESCE(NULLIF(item->>'productName', ''), NULLIF(item->>'name', ''), 'Legacy item'),
        COALESCE(NULLIF(item->>'productSku', ''), NULLIF(item->>'sku', ''), 'legacy-sku'),
        NULLIF(item->>'productImage', ''),
        COALESCE(
          NULLIF(item->>'price', '')::numeric,
          NULLIF(item->>'unitPrice', '')::numeric,
          0
        ),
        COALESCE(NULLIF(item->>'quantity', '')::integer, 0),
        item->'selectedVariant',
        NULLIF(item->>'notes', ''),
        o."tenant_id"
      FROM "orders" o
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(o."items") = 'array' THEN o."items"
          ELSE '[]'::jsonb
        END
      ) AS item
      WHERE NOT EXISTS (
        SELECT 1 FROM "order_items" oi WHERE oi."order_id" = o."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_tenant_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_order_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
  }
}
