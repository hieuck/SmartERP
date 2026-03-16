import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "domain" VARCHAR(255),
        "logo" TEXT,
        "status" VARCHAR(20) DEFAULT 'active',
        "timezone" VARCHAR(50) DEFAULT 'UTC',
        "currency" VARCHAR(3) DEFAULT 'USD',
        "language" VARCHAR(10) DEFAULT 'en',
        "date_format" VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        "number_format" VARCHAR(20) DEFAULT '1,234.56',
        "tax_rate" DECIMAL(5,2) DEFAULT 0,
        "company_name" VARCHAR(255),
        "company_address" TEXT,
        "company_phone" VARCHAR(50),
        "company_email" VARCHAR(255),
        "company_tax_code" VARCHAR(50),
        "company_website" VARCHAR(255),
        "subscription_plan" VARCHAR(50),
        "subscription_start_date" TIMESTAMP,
        "subscription_end_date" TIMESTAMP,
        "max_users" INTEGER DEFAULT 10,
        "max_storage" BIGINT DEFAULT 1073741824,
        "current_storage" BIGINT DEFAULT 0,
        "features" JSONB,
        "billing_cycle" VARCHAR(20) DEFAULT 'monthly',
        "subscription_amount" DECIMAL(10,2) DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "sku" VARCHAR(100) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category_id" UUID,
        "brand" VARCHAR(100),
        "unit" VARCHAR(50) DEFAULT 'unit',
        "price" DECIMAL(12,2) DEFAULT 0,
        "cost" DECIMAL(12,2) DEFAULT 0,
        "stock" DECIMAL(10,2) DEFAULT 0,
        "min_stock" DECIMAL(10,2) DEFAULT 5,
        "max_stock" DECIMAL(10,2) DEFAULT 1000,
        "status" VARCHAR(20) DEFAULT 'active',
        "images" JSONB,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(50),
        "address" TEXT,
        "tax_code" VARCHAR(50),
        "website" VARCHAR(255),
        "credit_limit" DECIMAL(12,2) DEFAULT 0,
        "balance" DECIMAL(12,2) DEFAULT 0,
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create suppliers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(50),
        "address" TEXT,
        "tax_code" VARCHAR(50),
        "website" VARCHAR(255),
        "payment_terms" VARCHAR(50) DEFAULT 'net30',
        "balance" DECIMAL(12,2) DEFAULT 0,
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "parent_id" UUID,
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_no" VARCHAR(100) UNIQUE NOT NULL,
        "customer_id" UUID NOT NULL,
        "supplier_id" UUID,
        "order_date" TIMESTAMP NOT NULL,
        "delivery_date" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'pending',
        "total_amount" DECIMAL(12,2) DEFAULT 0,
        "discount" DECIMAL(12,2) DEFAULT 0,
        "tax" DECIMAL(12,2) DEFAULT 0,
        "grand_total" DECIMAL(12,2) DEFAULT 0,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create stock table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" UUID NOT NULL,
        "warehouse_id" UUID,
        "quantity" DECIMAL(10,2) DEFAULT 0,
        "reserved" DECIMAL(10,2) DEFAULT 0,
        "available" DECIMAL(10,2) DEFAULT 0,
        "min_stock" DECIMAL(10,2) DEFAULT 5,
        "max_stock" DECIMAL(10,2) DEFAULT 1000,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create shipments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "shipment_no" VARCHAR(100) UNIQUE NOT NULL,
        "order_id" UUID,
        "customer_id" UUID,
        "carrier_id" UUID,
        "shipping_address" TEXT,
        "status" VARCHAR(50) DEFAULT 'pending',
        "tracking_no" VARCHAR(100),
        "shipping_date" TIMESTAMP,
        "delivery_date" TIMESTAMP,
        "weight" DECIMAL(10,2),
        "dimensions" VARCHAR(100),
        "insurance" DECIMAL(10,2) DEFAULT 0,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "payment_no" VARCHAR(100) UNIQUE NOT NULL,
        "order_id" UUID,
        "customer_id" UUID,
        "amount" DECIMAL(12,2) NOT NULL,
        "paid_amount" DECIMAL(12,2) DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'pending',
        "payment_method" VARCHAR(50),
        "payment_date" TIMESTAMP,
        "reference" VARCHAR(255),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create leads table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(50),
        "company" VARCHAR(255),
        "status" VARCHAR(50) DEFAULT 'new',
        "source" VARCHAR(100),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create opportunities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "opportunities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "lead_id" UUID,
        "customer_id" UUID,
        "value" DECIMAL(12,2) DEFAULT 0,
        "probability" DECIMAL(5,2) DEFAULT 50,
        "stage" VARCHAR(50) DEFAULT 'prospecting',
        "close_date" TIMESTAMP,
        "status" VARCHAR(50) DEFAULT 'open',
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create tickets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tickets" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "ticket_no" VARCHAR(100) UNIQUE NOT NULL,
        "customer_id" UUID NOT NULL,
        "subject" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "priority" VARCHAR(20) DEFAULT 'medium',
        "status" VARCHAR(50) DEFAULT 'open',
        "assigned_to" UUID,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create articles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT,
        "category" VARCHAR(100),
        "tags" JSONB,
        "status" VARCHAR(20) DEFAULT 'draft',
        "views" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create error_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "error_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "message" TEXT NOT NULL,
        "stack" TEXT,
        "context" JSONB,
        "severity" VARCHAR(20) DEFAULT 'error',
        "resolved" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create system_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" VARCHAR(100) UNIQUE NOT NULL,
        "value" JSONB,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create workflows table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workflows" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "entity_type" VARCHAR(50) NOT NULL,
        "config" JSONB,
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create payment_transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "payment_id" UUID,
        "transaction_no" VARCHAR(100) UNIQUE NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'USD',
        "status" VARCHAR(50) DEFAULT 'pending',
        "payment_method" VARCHAR(50),
        "provider" VARCHAR(50),
        "provider_ref" VARCHAR(255),
        "error_message" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_by" UUID,
        "updated_by" UUID
      );
    `);

    // Create payment_webhooks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_webhooks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider" VARCHAR(50) NOT NULL,
        "event_type" VARCHAR(100) NOT NULL,
        "payload" JSONB,
        "status" VARCHAR(50) DEFAULT 'pending',
        "processed_at" TIMESTAMP,
        "error_message" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'payment_webhooks',
      'payment_transactions',
      'shipments',
      'workflows',
      'system_settings',
      'error_logs',
      'articles',
      'tickets',
      'opportunities',
      'leads',
      'payments',
      'orders',
      'stock',
      'categories',
      'suppliers',
      'customers',
      'products',
      'tenants'
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
