import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772773000000 implements MigrationInterface {
  name = 'InitialSchema1772773000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table first (required by all other tables)
    await queryRunner.query(`
      CREATE TYPE "tenants_status_enum" AS ENUM('active', 'suspended', 'cancelled');
      CREATE TYPE "tenants_subscriptionplan_enum" AS ENUM('free', 'basic', 'professional', 'enterprise');
      CREATE TYPE "tenants_billingcycle_enum" AS ENUM('monthly', 'yearly');
      
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "domain" character varying,
        "logo" character varying,
        "status" "tenants_status_enum" NOT NULL DEFAULT 'active',
        "timezone" character varying NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "currency" character varying NOT NULL DEFAULT 'VND',
        "language" character varying NOT NULL DEFAULT 'vi',
        "dateFormat" character varying NOT NULL DEFAULT 'DD/MM/YYYY',
        "numberFormat" character varying NOT NULL DEFAULT '#,##0.00',
        "taxRate" numeric(5,2) NOT NULL DEFAULT '10',
        "companyName" character varying,
        "companyAddress" character varying,
        "companyPhone" character varying,
        "companyEmail" character varying,
        "companyTaxCode" character varying,
        "companyWebsite" character varying,
        "subscriptionPlan" "tenants_subscriptionplan_enum" NOT NULL DEFAULT 'free',
        "subscriptionStartDate" TIMESTAMP,
        "subscriptionEndDate" TIMESTAMP,
        "maxUsers" integer NOT NULL DEFAULT '5',
        "maxStorage" bigint NOT NULL DEFAULT '1073741824',
        "currentStorage" bigint NOT NULL DEFAULT '0',
        "features" text,
        "billingCycle" "tenants_billingcycle_enum" NOT NULL DEFAULT 'monthly',
        "subscriptionAmount" numeric(10,2) NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdBy" character varying,
        "updatedBy" character varying,
        CONSTRAINT "UQ_tenants_code" UNIQUE ("code"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      );
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "first_name" character varying,
        "last_name" character varying,
        "role" character varying NOT NULL DEFAULT 'user',
        "status" character varying NOT NULL DEFAULT 'active',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying,
        "phone" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      );
      
      CREATE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email");
      CREATE INDEX "IDX_users_tenant_status" ON "users" ("tenant_id", "status");
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TYPE "products_status_enum" AS ENUM('active', 'inactive', 'discontinued', 'out_of_stock');
      CREATE TYPE "products_type_enum" AS ENUM('physical', 'digital', 'service');
      
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "sku" character varying NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "cost" numeric(10,2),
        "category_id" character varying,
        "status" "products_status_enum" NOT NULL DEFAULT 'active',
        "type" "products_type_enum" NOT NULL DEFAULT 'physical',
        "barcode" character varying,
        "brand" character varying,
        "manufacturer" character varying,
        "weight" numeric(10,3),
        "weight_unit" character varying,
        "length" numeric(10,2),
        "width" numeric(10,2),
        "height" numeric(10,2),
        "dimension_unit" character varying,
        "stock_quantity" integer NOT NULL DEFAULT '0',
        "min_stock_level" integer NOT NULL DEFAULT '0',
        "max_stock_level" integer NOT NULL DEFAULT '0',
        "images" text,
        "tags" text,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" character varying,
        "updated_by" character varying,
        CONSTRAINT "UQ_products_tenant_sku" UNIQUE ("tenant_id", "sku"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      );
      
      CREATE INDEX "IDX_products_tenant_status" ON "products" ("tenant_id", "status");
      CREATE INDEX "IDX_products_tenant_name" ON "products" ("tenant_id", "name");
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "address" text,
        "city" text,
        "state" text,
        "country" text,
        "postal_code" text,
        "tax_id" text,
        "website" text,
        "notes" text,
        "status" character varying NOT NULL DEFAULT 'active',
        "credit_limit" numeric(15,2) NOT NULL DEFAULT '0',
        "current_balance" numeric(15,2) NOT NULL DEFAULT '0',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_customers_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      );
      
      CREATE INDEX "IDX_customers_tenant_status" ON "customers" ("tenant_id", "status");
      CREATE INDEX "IDX_customers_tenant_name" ON "customers" ("tenant_id", "name");
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "order_number" character varying NOT NULL,
        "customer_id" uuid,
        "total_amount" numeric(10,2) NOT NULL DEFAULT '0',
        "status" character varying NOT NULL DEFAULT 'draft',
        "items" jsonb,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_orders_tenant_number" UNIQUE ("tenant_id", "order_number"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      );
      
      CREATE INDEX "IDX_orders_tenant_status" ON "orders" ("tenant_id", "status");
      CREATE INDEX "IDX_orders_tenant_customer" ON "orders" ("tenant_id", "customer_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "products_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "products_status_enum";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenants_billingcycle_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenants_subscriptionplan_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tenants_status_enum";`);
  }
}
