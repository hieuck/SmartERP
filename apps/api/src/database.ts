import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
const databasePath = process.env.SMARTERP_NEXT_DB_PATH ?? path.join(rootDir, "data", "smarterp-next.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    industry TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_customers_tenant_created_at
  ON customers (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, sku)
  );

  CREATE INDEX IF NOT EXISTS idx_products_tenant_created_at
  ON products (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS inventory (
    product_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_inventory_tenant_product
  ON inventory (tenant_id, product_id);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_orders_tenant_created_at
  ON orders (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    order_id TEXT NOT NULL UNIQUE,
    order_number TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    subtotal_amount INTEGER NOT NULL,
    tax_rate_percent INTEGER NOT NULL,
    tax_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    due_date TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_invoices_tenant_issued_at
  ON invoices (tenant_id, issued_at DESC);

  CREATE TABLE IF NOT EXISTS invoice_payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL,
    paid_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant_paid_at
  ON invoice_payments (tenant_id, paid_at DESC);

  CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice
  ON invoice_payments (invoice_id, paid_at DESC);
`);

const invoiceColumns = db
  .prepare("PRAGMA table_info(invoices)")
  .all() as Array<{ name: string }>;

if (!invoiceColumns.some((column) => column.name === "due_date")) {
  db.exec("ALTER TABLE invoices ADD COLUMN due_date TEXT NOT NULL DEFAULT ''");
}

db.exec(`
  UPDATE invoices
  SET due_date = datetime(issued_at, '+30 days')
  WHERE due_date = '' OR due_date IS NULL
`);

export function getDatabasePath(): string {
  return databasePath;
}
