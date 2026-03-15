-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" uuid NOT NULL,
  "name" character varying NOT NULL,
  "sku" character varying NOT NULL,
  "description" text,
  "price" numeric(10,2) NOT NULL,
  "cost" numeric(10,2),
  "category_id" character varying,
  "status" character varying NOT NULL DEFAULT 'active',
  "type" character varying NOT NULL DEFAULT 'physical',
  "tracking_type" character varying NOT NULL DEFAULT 'none',
  "has_expiry" boolean NOT NULL DEFAULT false,
  "barcode" character varying,
  "brand" character varying,
  "manufacturer" character varying,
  "weight" numeric(10,3),
  "weight_unit" character varying,
  "length" numeric(10,2),
  "width" numeric(10,2),
  "height" numeric(10,2),
  "dimension_unit" character varying,
  "stock_quantity" integer NOT NULL DEFAULT 0,
  "min_stock_level" integer NOT NULL DEFAULT 0,
  "max_stock_level" integer NOT NULL DEFAULT 0,
  "images" text,
  "tags" text,
  "metadata" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_featured" boolean NOT NULL DEFAULT false,
  "created_by" character varying,
  "updated_by" character varying,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  "version" integer NOT NULL DEFAULT 1,
  "last_synced_at" TIMESTAMP,
  "sync_status" character varying NOT NULL DEFAULT 'synced',
  "offline_id" uuid,
  CONSTRAINT "PK_products" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_products_tenant_sku" UNIQUE ("tenant_id", "sku")
);

-- Create customers table
CREATE TABLE IF NOT EXISTS "customers" (
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
  "credit_limit" numeric(15,2) NOT NULL DEFAULT 0,
  "current_balance" numeric(15,2) NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_by" uuid,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  "version" integer NOT NULL DEFAULT 1,
  "last_synced_at" TIMESTAMP,
  "sync_status" character varying NOT NULL DEFAULT 'synced',
  "offline_id" uuid,
  CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_customers_tenant_email" UNIQUE ("tenant_id", "email")
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS "suppliers" (
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
  "payment_terms" numeric(15,2) NOT NULL DEFAULT 0,
  "current_balance" numeric(15,2) NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_by" uuid,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  "version" integer NOT NULL DEFAULT 1,
  "last_synced_at" TIMESTAMP,
  "sync_status" character varying NOT NULL DEFAULT 'synced',
  "offline_id" uuid,
  CONSTRAINT "PK_suppliers" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_suppliers_tenant_email" UNIQUE ("tenant_id", "email")
);

-- Create orders table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" uuid NOT NULL,
  "order_number" character varying NOT NULL,
  "customer_id" uuid,
  "total_amount" numeric(10,2) NOT NULL DEFAULT 0,
  "status" character varying NOT NULL DEFAULT 'draft',
  "items" jsonb,
  "notes" text,
  "created_by" uuid,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  "version" integer NOT NULL DEFAULT 1,
  "last_synced_at" TIMESTAMP,
  "sync_status" character varying NOT NULL DEFAULT 'synced',
  "offline_id" uuid,
  CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_orders_tenant_number" UNIQUE ("tenant_id", "order_number")
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" uuid NOT NULL,
  "invoice_number" character varying(50) NOT NULL,
  "type" character varying NOT NULL,
  "customer_id" uuid,
  "supplier_id" uuid,
  "invoice_date" date NOT NULL,
  "due_date" date,
  "subtotal" numeric(15,2) NOT NULL,
  "tax_amount" numeric(15,2) NOT NULL DEFAULT 0,
  "total_amount" numeric(15,2) NOT NULL,
  "paid_amount" numeric(15,2) NOT NULL DEFAULT 0,
  "currency" character varying(10) NOT NULL DEFAULT 'VND',
  "status" character varying(50) NOT NULL DEFAULT 'draft',
  "items" jsonb NOT NULL,
  "notes" text,
  "created_by" uuid,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  "version" integer NOT NULL DEFAULT 1,
  "last_synced_at" TIMESTAMP,
  "sync_status" character varying NOT NULL DEFAULT 'synced',
  "offline_id" uuid,
  CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_invoices_tenant_number" UNIQUE ("tenant_id", "invoice_number")
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS "IDX_products_tenant_status" ON "products" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "IDX_products_tenant_category" ON "products" ("tenant_id", "category_id");
CREATE INDEX IF NOT EXISTS "IDX_products_tenant_name" ON "products" ("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "IDX_products_tenant_stock" ON "products" ("tenant_id", "stock_quantity");
CREATE INDEX IF NOT EXISTS "IDX_products_sync_status" ON "products" ("sync_status");
CREATE INDEX IF NOT EXISTS "IDX_products_last_synced_at" ON "products" ("last_synced_at");

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS "IDX_customers_tenant_status" ON "customers" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "IDX_customers_tenant_name" ON "customers" ("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "IDX_customers_tenant_phone" ON "customers" ("tenant_id", "phone");
CREATE INDEX IF NOT EXISTS "IDX_customers_sync_status" ON "customers" ("sync_status");
CREATE INDEX IF NOT EXISTS "IDX_customers_last_synced_at" ON "customers" ("last_synced_at");

-- Create indexes for suppliers
CREATE INDEX IF NOT EXISTS "IDX_suppliers_sync_status" ON "suppliers" ("sync_status");
CREATE INDEX IF NOT EXISTS "IDX_suppliers_last_synced_at" ON "suppliers" ("last_synced_at");

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS "IDX_orders_tenant_customer" ON "orders" ("tenant_id", "customer_id");
CREATE INDEX IF NOT EXISTS "IDX_orders_tenant_status" ON "orders" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "IDX_orders_tenant_created" ON "orders" ("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "IDX_orders_sync_status" ON "orders" ("sync_status");
CREATE INDEX IF NOT EXISTS "IDX_orders_last_synced_at" ON "orders" ("last_synced_at");

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS "IDX_invoices_tenant_date" ON "invoices" ("tenant_id", "invoice_date");
CREATE INDEX IF NOT EXISTS "IDX_invoices_sync_status" ON "invoices" ("sync_status");
CREATE INDEX IF NOT EXISTS "IDX_invoices_last_synced_at" ON "invoices" ("last_synced_at");
