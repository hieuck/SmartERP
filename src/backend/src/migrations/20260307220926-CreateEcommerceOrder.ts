import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEcommerceOrder20260307220926 implements MigrationInterface {
  name = 'CreateEcommerceOrder20260307220926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "shipping_status_enum" AS ENUM (
        'pending',
        'preparing',
        'shipped',
        'in_transit',
        'delivered',
        'returned'
      )
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderNumber" varchar NOT NULL UNIQUE,
        "customerId" uuid,
        "cartId" uuid,
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "paymentStatus" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "shippingStatus" "shipping_status_enum" NOT NULL DEFAULT 'pending',
        "subtotal" decimal(10,2) NOT NULL DEFAULT 0,
        "tax" decimal(10,2) NOT NULL DEFAULT 0,
        "shipping" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "total" decimal(10,2) NOT NULL DEFAULT 0,
        "couponCode" varchar,
        "customerEmail" varchar NOT NULL,
        "customerPhone" varchar,
        "shippingAddress" jsonb NOT NULL,
        "billingAddress" jsonb NOT NULL,
        "paymentMethod" varchar,
        "paymentTransactionId" varchar,
        "paidAt" timestamp,
        "shippingMethod" varchar,
        "trackingNumber" varchar,
        "shippedAt" timestamp,
        "deliveredAt" timestamp,
        "customerNotes" text,
        "internalNotes" text,
        "cancelledBy" uuid,
        "cancellationReason" text,
        "cancelledAt" timestamp,
        "tenantId" varchar NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customerId") 
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for orders
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_tenant" ON "orders" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_customer" ON "orders" ("customerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_status" ON "orders" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_payment_status" ON "orders" ("paymentStatus")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_shipping_status" ON "orders" ("shippingStatus")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_created_at" ON "orders" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_tenant_status" ON "orders" ("tenantId", "status")
    `);

    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid,
        "productName" varchar NOT NULL,
        "productSku" varchar NOT NULL,
        "productImage" varchar,
        "price" decimal(10,2) NOT NULL,
        "quantity" integer NOT NULL,
        "selectedVariant" jsonb,
        "notes" text,
        "tenantId" varchar NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") 
          REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for order_items
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_order" ON "order_items" ("orderId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_product" ON "order_items" ("productId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_order_items_tenant" ON "order_items" ("tenantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "shipping_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
