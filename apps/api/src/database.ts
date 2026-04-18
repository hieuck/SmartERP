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

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    supplier_code TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, supplier_code)
  );

  CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_created_at
  ON suppliers (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, slug)
  );

  CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_created_at
  ON product_categories (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    category_id TEXT NOT NULL DEFAULT '',
    category_name TEXT NOT NULL DEFAULT '',
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
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
    product_category_id TEXT NOT NULL DEFAULT '',
    product_category_name TEXT NOT NULL DEFAULT '',
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

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    purchase_order_number TEXT NOT NULL UNIQUE,
    supplier_id TEXT NOT NULL,
    supplier_code TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_category_id TEXT NOT NULL DEFAULT '',
    product_category_name TEXT NOT NULL DEFAULT '',
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    expected_receipt_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_created_at
  ON purchase_orders (tenant_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS purchase_order_receipts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    purchase_order_id TEXT NOT NULL,
    purchase_order_number TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_category_id TEXT NOT NULL DEFAULT '',
    product_category_name TEXT NOT NULL DEFAULT '',
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity_received INTEGER NOT NULL,
    unit_cost INTEGER NOT NULL,
    total_cost INTEGER NOT NULL,
    received_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_purchase_order_receipts_tenant_received_at
  ON purchase_order_receipts (tenant_id, received_at DESC);

  CREATE INDEX IF NOT EXISTS idx_purchase_order_receipts_purchase_order
  ON purchase_order_receipts (purchase_order_id, received_at DESC);

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    amendment_root_invoice_id TEXT NOT NULL,
    amendment_root_invoice_number TEXT NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 1,
    amendment_note TEXT,
    credit_note TEXT,
    credited_at TEXT,
    credit_method TEXT,
    credited_amount INTEGER NOT NULL DEFAULT 0,
    credited_quantity INTEGER NOT NULL DEFAULT 0,
    credited_subtotal_amount INTEGER NOT NULL DEFAULT 0,
    credited_tax_amount INTEGER NOT NULL DEFAULT 0,
    reissued_from_invoice_id TEXT,
    reissued_from_invoice_number TEXT,
    reissued_to_invoice_id TEXT,
    reissued_to_invoice_number TEXT,
    order_id TEXT NOT NULL,
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
    follow_up_status TEXT NOT NULL DEFAULT 'new',
    action_required TEXT NOT NULL DEFAULT 'monitor',
    promised_payment_date TEXT,
    next_action_date TEXT,
    collection_note TEXT NOT NULL DEFAULT '',
    last_collection_update_at TEXT,
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

  CREATE TABLE IF NOT EXISTS invoice_collection_activities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    follow_up_status TEXT NOT NULL,
    collection_priority TEXT NOT NULL,
    action_required TEXT NOT NULL,
    promised_payment_date TEXT,
    next_action_date TEXT,
    collection_note TEXT NOT NULL DEFAULT '',
    outstanding_amount_snapshot INTEGER NOT NULL,
    action_state TEXT NOT NULL DEFAULT 'assigned',
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_invoice_collection_activities_tenant_created_at
  ON invoice_collection_activities (tenant_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_invoice_collection_activities_invoice
  ON invoice_collection_activities (invoice_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS invoice_return_receipts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    order_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_category_id TEXT NOT NULL DEFAULT '',
    product_category_name TEXT NOT NULL DEFAULT '',
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity_returned INTEGER NOT NULL,
    inventory_value INTEGER NOT NULL,
    received_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_invoice_return_receipts_tenant_received_at
  ON invoice_return_receipts (tenant_id, received_at DESC);

  CREATE INDEX IF NOT EXISTS idx_invoice_return_receipts_invoice
  ON invoice_return_receipts (invoice_id, received_at DESC);

  CREATE TABLE IF NOT EXISTS accounts (
    tenant_id TEXT NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (tenant_id, account_code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_tenant_sort_order
  ON accounts (tenant_id, sort_order ASC, account_code ASC);

  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    entry_group_id TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    debit_amount INTEGER NOT NULL,
    credit_amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id, account_code) REFERENCES accounts(tenant_id, account_code) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_created_at
  ON journal_entries (tenant_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_group
  ON journal_entries (tenant_id, entry_group_id);

  CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    status TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    summary TEXT NOT NULL,
    reason TEXT NOT NULL,
    amount INTEGER,
    quantity INTEGER,
    requested_by_email TEXT NOT NULL,
    requested_by_display_name TEXT NOT NULL,
    decision_by_email TEXT,
    decision_by_display_name TEXT,
    decision_note TEXT,
    payload_json TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    decided_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status
  ON approval_requests (tenant_id, status, requested_at DESC);

  CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_requested_at
  ON approval_requests (tenant_id, requested_at DESC);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_number TEXT NOT NULL,
    action_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_display_name TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created_at
  ON audit_logs (tenant_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_domain
  ON audit_logs (tenant_id, domain, created_at DESC);
`);

function getTableSql(name: string): string | null {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name) as { sql?: string } | undefined;

  return row?.sql ?? null;
}

function tableExists(name: string): boolean {
  return Boolean(getTableSql(name));
}

function migrateInvoicesForActiveOrderConstraint(): void {
  const invoiceTableSql = getTableSql("invoices");
  const invoicePaymentsTableSql = getTableSql("invoice_payments");
  const collectionActivityTableSql = getTableSql("invoice_collection_activities");

  const needsInvoiceOrderConstraintRepair = invoiceTableSql?.includes("order_id TEXT NOT NULL UNIQUE") ?? false;
  const needsInvoicePaymentsReferenceRepair =
    invoicePaymentsTableSql?.includes('"invoices_legacy"') ?? false;
  const needsCollectionActivityReferenceRepair =
    collectionActivityTableSql?.includes('"invoices_legacy"') ?? false;

  if (
    !needsInvoiceOrderConstraintRepair &&
    !needsInvoicePaymentsReferenceRepair &&
    !needsCollectionActivityReferenceRepair
  ) {
    return;
  }

  const hasInvoices = tableExists("invoices");
  const hasInvoicePayments = tableExists("invoice_payments");
  const hasCollectionActivities = tableExists("invoice_collection_activities");

  db.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;

    DROP INDEX IF EXISTS idx_invoices_tenant_issued_at;
    DROP INDEX IF EXISTS idx_invoices_tenant_order_active_unique;
    DROP INDEX IF EXISTS idx_invoice_payments_tenant_paid_at;
    DROP INDEX IF EXISTS idx_invoice_payments_invoice;
    DROP INDEX IF EXISTS idx_invoice_collection_activities_tenant_created_at;
    DROP INDEX IF EXISTS idx_invoice_collection_activities_invoice;
  `);

  if (hasCollectionActivities) {
    db.exec("ALTER TABLE invoice_collection_activities RENAME TO invoice_collection_activities_reissue_legacy");
  }

  if (hasInvoicePayments) {
    db.exec("ALTER TABLE invoice_payments RENAME TO invoice_payments_reissue_legacy");
  }

  if (hasInvoices) {
    db.exec("ALTER TABLE invoices RENAME TO invoices_reissue_legacy");
  }

  db.exec(`
    CREATE TABLE invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      amendment_root_invoice_id TEXT NOT NULL,
      amendment_root_invoice_number TEXT NOT NULL,
      revision_number INTEGER NOT NULL DEFAULT 1,
      amendment_note TEXT,
      credit_note TEXT,
      credited_at TEXT,
      credit_method TEXT,
      credited_amount INTEGER NOT NULL DEFAULT 0,
      credited_quantity INTEGER NOT NULL DEFAULT 0,
      credited_subtotal_amount INTEGER NOT NULL DEFAULT 0,
      credited_tax_amount INTEGER NOT NULL DEFAULT 0,
      reissued_from_invoice_id TEXT,
      reissued_from_invoice_number TEXT,
      reissued_to_invoice_id TEXT,
      reissued_to_invoice_number TEXT,
      order_id TEXT NOT NULL,
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
      follow_up_status TEXT NOT NULL DEFAULT 'new',
      action_required TEXT NOT NULL DEFAULT 'monitor',
      promised_payment_date TEXT,
      next_action_date TEXT,
      collection_note TEXT NOT NULL DEFAULT '',
      last_collection_update_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  if (hasInvoices) {
    db.exec(`
      INSERT INTO invoices (
        id,
        tenant_id,
        invoice_number,
        amendment_root_invoice_id,
        amendment_root_invoice_number,
        revision_number,
        amendment_note,
        credit_note,
        credited_at,
        credit_method,
        credited_amount,
        credited_quantity,
        credited_subtotal_amount,
        credited_tax_amount,
        reissued_from_invoice_id,
        reissued_from_invoice_number,
        reissued_to_invoice_id,
        reissued_to_invoice_number,
        order_id,
        order_number,
        customer_id,
        customer_name,
        subtotal_amount,
        tax_rate_percent,
        tax_amount,
        total_amount,
        status,
        issued_at,
        due_date,
        follow_up_status,
        action_required,
        promised_payment_date,
        next_action_date,
        collection_note,
        last_collection_update_at
      )
      SELECT
        id,
        tenant_id,
        invoice_number,
        COALESCE(reissued_from_invoice_id, id),
        COALESCE(reissued_from_invoice_number, invoice_number),
        CASE
          WHEN reissued_from_invoice_id IS NULL THEN 1
          ELSE 2
        END,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        0,
        0,
        0,
        NULL,
        NULL,
        NULL,
        NULL,
        order_id,
        order_number,
        customer_id,
        customer_name,
        subtotal_amount,
        tax_rate_percent,
        tax_amount,
        total_amount,
        status,
        issued_at,
        due_date,
        follow_up_status,
        action_required,
        promised_payment_date,
        next_action_date,
        collection_note,
        last_collection_update_at
      FROM invoices_reissue_legacy;
    `);
  }

  db.exec(`
    CREATE TABLE invoice_payments (
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
  `);

  if (hasInvoicePayments) {
    db.exec(`
      INSERT INTO invoice_payments (
        id,
        tenant_id,
        invoice_id,
        invoice_number,
        amount,
        method,
        paid_at
      )
      SELECT
        id,
        tenant_id,
        invoice_id,
        invoice_number,
        amount,
        method,
        paid_at
      FROM invoice_payments_reissue_legacy;
    `);
  }

  db.exec(`
    CREATE TABLE invoice_collection_activities (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      follow_up_status TEXT NOT NULL,
      collection_priority TEXT NOT NULL,
      action_required TEXT NOT NULL,
      promised_payment_date TEXT,
      next_action_date TEXT,
      collection_note TEXT NOT NULL DEFAULT '',
      outstanding_amount_snapshot INTEGER NOT NULL,
      action_state TEXT NOT NULL DEFAULT 'assigned',
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  if (hasCollectionActivities) {
    db.exec(`
      INSERT INTO invoice_collection_activities (
        id,
        tenant_id,
        invoice_id,
        invoice_number,
        customer_id,
        customer_name,
        follow_up_status,
        collection_priority,
        action_required,
        promised_payment_date,
        next_action_date,
        collection_note,
        outstanding_amount_snapshot,
        action_state,
        created_at
      )
      SELECT
        id,
        tenant_id,
        invoice_id,
        invoice_number,
        customer_id,
        customer_name,
        follow_up_status,
        collection_priority,
        action_required,
        promised_payment_date,
        next_action_date,
        collection_note,
        outstanding_amount_snapshot,
        action_state,
        created_at
      FROM invoice_collection_activities_reissue_legacy;
    `);
  }

  if (hasCollectionActivities) {
    db.exec("DROP TABLE invoice_collection_activities_reissue_legacy");
  }

  if (hasInvoicePayments) {
    db.exec("DROP TABLE invoice_payments_reissue_legacy");
  }

  if (hasInvoices) {
    db.exec("DROP TABLE invoices_reissue_legacy");
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_tenant_issued_at
    ON invoices (tenant_id, issued_at DESC);

    CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant_paid_at
    ON invoice_payments (tenant_id, paid_at DESC);

    CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice
    ON invoice_payments (invoice_id, paid_at DESC);

    CREATE INDEX IF NOT EXISTS idx_invoice_collection_activities_tenant_created_at
    ON invoice_collection_activities (tenant_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_invoice_collection_activities_invoice
    ON invoice_collection_activities (invoice_id, created_at DESC);

    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

migrateInvoicesForActiveOrderConstraint();

const invoiceColumns = db
  .prepare("PRAGMA table_info(invoices)")
  .all() as Array<{ name: string }>;

if (!invoiceColumns.some((column) => column.name === "due_date")) {
  db.exec("ALTER TABLE invoices ADD COLUMN due_date TEXT NOT NULL DEFAULT ''");
}

if (!invoiceColumns.some((column) => column.name === "amendment_root_invoice_id")) {
  db.exec("ALTER TABLE invoices ADD COLUMN amendment_root_invoice_id TEXT");
}

if (!invoiceColumns.some((column) => column.name === "amendment_root_invoice_number")) {
  db.exec("ALTER TABLE invoices ADD COLUMN amendment_root_invoice_number TEXT");
}

if (!invoiceColumns.some((column) => column.name === "revision_number")) {
  db.exec("ALTER TABLE invoices ADD COLUMN revision_number INTEGER NOT NULL DEFAULT 1");
}

if (!invoiceColumns.some((column) => column.name === "amendment_note")) {
  db.exec("ALTER TABLE invoices ADD COLUMN amendment_note TEXT");
}

if (!invoiceColumns.some((column) => column.name === "credit_note")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credit_note TEXT");
}

if (!invoiceColumns.some((column) => column.name === "credited_at")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credited_at TEXT");
}

if (!invoiceColumns.some((column) => column.name === "credit_method")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credit_method TEXT");
}

if (!invoiceColumns.some((column) => column.name === "credited_amount")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credited_amount INTEGER NOT NULL DEFAULT 0");
}

if (!invoiceColumns.some((column) => column.name === "credited_quantity")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credited_quantity INTEGER NOT NULL DEFAULT 0");
}

if (!invoiceColumns.some((column) => column.name === "credited_subtotal_amount")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credited_subtotal_amount INTEGER NOT NULL DEFAULT 0");
}

if (!invoiceColumns.some((column) => column.name === "credited_tax_amount")) {
  db.exec("ALTER TABLE invoices ADD COLUMN credited_tax_amount INTEGER NOT NULL DEFAULT 0");
}

if (!invoiceColumns.some((column) => column.name === "reissued_from_invoice_id")) {
  db.exec("ALTER TABLE invoices ADD COLUMN reissued_from_invoice_id TEXT");
}

if (!invoiceColumns.some((column) => column.name === "reissued_from_invoice_number")) {
  db.exec("ALTER TABLE invoices ADD COLUMN reissued_from_invoice_number TEXT");
}

if (!invoiceColumns.some((column) => column.name === "reissued_to_invoice_id")) {
  db.exec("ALTER TABLE invoices ADD COLUMN reissued_to_invoice_id TEXT");
}

if (!invoiceColumns.some((column) => column.name === "reissued_to_invoice_number")) {
  db.exec("ALTER TABLE invoices ADD COLUMN reissued_to_invoice_number TEXT");
}

if (!invoiceColumns.some((column) => column.name === "follow_up_status")) {
  db.exec("ALTER TABLE invoices ADD COLUMN follow_up_status TEXT NOT NULL DEFAULT 'new'");
}

if (!invoiceColumns.some((column) => column.name === "promised_payment_date")) {
  db.exec("ALTER TABLE invoices ADD COLUMN promised_payment_date TEXT");
}

if (!invoiceColumns.some((column) => column.name === "action_required")) {
  db.exec("ALTER TABLE invoices ADD COLUMN action_required TEXT NOT NULL DEFAULT 'monitor'");
}

if (!invoiceColumns.some((column) => column.name === "next_action_date")) {
  db.exec("ALTER TABLE invoices ADD COLUMN next_action_date TEXT");
}

if (!invoiceColumns.some((column) => column.name === "collection_note")) {
  db.exec("ALTER TABLE invoices ADD COLUMN collection_note TEXT NOT NULL DEFAULT ''");
}

if (!invoiceColumns.some((column) => column.name === "last_collection_update_at")) {
  db.exec("ALTER TABLE invoices ADD COLUMN last_collection_update_at TEXT");
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_tenant_order_active_unique
  ON invoices (tenant_id, order_id)
  WHERE status <> 'void'
`);

db.exec(`
  UPDATE invoices
  SET amendment_root_invoice_id = COALESCE(amendment_root_invoice_id, COALESCE(reissued_from_invoice_id, id))
  WHERE amendment_root_invoice_id IS NULL OR amendment_root_invoice_id = ''
`);

db.exec(`
  UPDATE invoices
  SET amendment_root_invoice_number = COALESCE(amendment_root_invoice_number, COALESCE(reissued_from_invoice_number, invoice_number))
  WHERE amendment_root_invoice_number IS NULL OR amendment_root_invoice_number = ''
`);

db.exec(`
  UPDATE invoices
  SET revision_number = CASE
    WHEN reissued_from_invoice_id IS NULL THEN COALESCE(revision_number, 1)
    ELSE CASE WHEN COALESCE(revision_number, 1) < 2 THEN 2 ELSE revision_number END
  END
`);

db.exec(`
  UPDATE invoices
  SET due_date = datetime(issued_at, '+30 days')
  WHERE due_date = '' OR due_date IS NULL
`);

db.exec(`
  UPDATE invoices
  SET follow_up_status = 'new'
  WHERE follow_up_status = '' OR follow_up_status IS NULL
`);

db.exec(`
  UPDATE invoices
  SET action_required = 'monitor'
  WHERE action_required = '' OR action_required IS NULL
`);

const collectionActivityColumns = db
  .prepare("PRAGMA table_info(invoice_collection_activities)")
  .all() as Array<{ name: string }>;

if (collectionActivityColumns.length > 0) {
  if (!collectionActivityColumns.some((column) => column.name === "collection_priority")) {
    db.exec("ALTER TABLE invoice_collection_activities ADD COLUMN collection_priority TEXT NOT NULL DEFAULT 'medium'");
  }

  if (!collectionActivityColumns.some((column) => column.name === "action_required")) {
    db.exec("ALTER TABLE invoice_collection_activities ADD COLUMN action_required TEXT NOT NULL DEFAULT 'monitor'");
  }

  if (!collectionActivityColumns.some((column) => column.name === "next_action_date")) {
    db.exec("ALTER TABLE invoice_collection_activities ADD COLUMN next_action_date TEXT");
  }

  if (!collectionActivityColumns.some((column) => column.name === "action_state")) {
    db.exec("ALTER TABLE invoice_collection_activities ADD COLUMN action_state TEXT NOT NULL DEFAULT 'assigned'");
  }
}

const inventoryColumns = db
  .prepare("PRAGMA table_info(inventory)")
  .all() as Array<{ name: string }>;

const productCategoryColumns = db
  .prepare("PRAGMA table_info(product_categories)")
  .all() as Array<{ name: string }>;

if (productCategoryColumns.length === 0) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      UNIQUE (tenant_id, slug)
    )
  `);
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_created_at
  ON product_categories (tenant_id, created_at DESC)
`);

const productColumns = db
  .prepare("PRAGMA table_info(products)")
  .all() as Array<{ name: string }>;

const orderColumns = db
  .prepare("PRAGMA table_info(orders)")
  .all() as Array<{ name: string }>;

const purchaseOrderColumns = db
  .prepare("PRAGMA table_info(purchase_orders)")
  .all() as Array<{ name: string }>;

const purchaseOrderReceiptColumns = db
  .prepare("PRAGMA table_info(purchase_order_receipts)")
  .all() as Array<{ name: string }>;

if (!productColumns.some((column) => column.name === "category_id")) {
  db.exec("ALTER TABLE products ADD COLUMN category_id TEXT NOT NULL DEFAULT ''");
}

if (!productColumns.some((column) => column.name === "category_name")) {
  db.exec("ALTER TABLE products ADD COLUMN category_name TEXT NOT NULL DEFAULT ''");
}

if (!productColumns.some((column) => column.name === "image_url")) {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
}

if (!orderColumns.some((column) => column.name === "product_category_id")) {
  db.exec("ALTER TABLE orders ADD COLUMN product_category_id TEXT NOT NULL DEFAULT ''");
}

if (!orderColumns.some((column) => column.name === "product_category_name")) {
  db.exec("ALTER TABLE orders ADD COLUMN product_category_name TEXT NOT NULL DEFAULT ''");
}

if (!purchaseOrderColumns.some((column) => column.name === "product_category_id")) {
  db.exec("ALTER TABLE purchase_orders ADD COLUMN product_category_id TEXT NOT NULL DEFAULT ''");
}

if (!purchaseOrderColumns.some((column) => column.name === "product_category_name")) {
  db.exec("ALTER TABLE purchase_orders ADD COLUMN product_category_name TEXT NOT NULL DEFAULT ''");
}

if (!purchaseOrderReceiptColumns.some((column) => column.name === "product_category_id")) {
  db.exec("ALTER TABLE purchase_order_receipts ADD COLUMN product_category_id TEXT NOT NULL DEFAULT ''");
}

if (!purchaseOrderReceiptColumns.some((column) => column.name === "product_category_name")) {
  db.exec("ALTER TABLE purchase_order_receipts ADD COLUMN product_category_name TEXT NOT NULL DEFAULT ''");
}

if (!inventoryColumns.some((column) => column.name === "average_unit_cost")) {
  db.exec("ALTER TABLE inventory ADD COLUMN average_unit_cost INTEGER NOT NULL DEFAULT 0");
}

if (!inventoryColumns.some((column) => column.name === "inventory_value")) {
  db.exec("ALTER TABLE inventory ADD COLUMN inventory_value INTEGER NOT NULL DEFAULT 0");
}

if (!inventoryColumns.some((column) => column.name === "last_receipt_at")) {
  db.exec("ALTER TABLE inventory ADD COLUMN last_receipt_at TEXT");
}

db.exec(`
  UPDATE orders
  SET
    product_category_id = COALESCE(NULLIF(product_category_id, ''), (
      SELECT category_id FROM products WHERE products.id = orders.product_id
    ), ''),
    product_category_name = COALESCE(NULLIF(product_category_name, ''), (
      SELECT category_name FROM products WHERE products.id = orders.product_id
    ), '')
  WHERE product_category_id = '' OR product_category_name = '';

  UPDATE purchase_orders
  SET
    product_category_id = COALESCE(NULLIF(product_category_id, ''), (
      SELECT category_id FROM products WHERE products.id = purchase_orders.product_id
    ), ''),
    product_category_name = COALESCE(NULLIF(product_category_name, ''), (
      SELECT category_name FROM products WHERE products.id = purchase_orders.product_id
    ), '')
  WHERE product_category_id = '' OR product_category_name = '';

  UPDATE purchase_order_receipts
  SET
    product_category_id = COALESCE(NULLIF(product_category_id, ''), (
      SELECT product_category_id FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_receipts.purchase_order_id
    ), (
      SELECT category_id FROM products WHERE products.id = purchase_order_receipts.product_id
    ), ''),
    product_category_name = COALESCE(NULLIF(product_category_name, ''), (
      SELECT product_category_name FROM purchase_orders
      WHERE purchase_orders.id = purchase_order_receipts.purchase_order_id
    ), (
      SELECT category_name FROM products WHERE products.id = purchase_order_receipts.product_id
    ), '')
  WHERE product_category_id = '' OR product_category_name = '';
`);

export function getDatabasePath(): string {
  return databasePath;
}
