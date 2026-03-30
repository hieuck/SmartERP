import { randomUUID } from "node:crypto";

import {
  createDemoSession,
  type CreateCustomerInput,
  type CreateInvoiceInput,
  type CreateInvoicePaymentInput,
  type CreateInventoryAdjustmentInput,
  type CreateOrderInput,
  type CreateProductInput,
  type CreateTenantInput,
  type CustomerStatementRecord,
  type CustomerRecord,
  type InvoiceRecord,
  type InventoryRecord,
  type OrderRecord,
  type ProductRecord,
  type ReportSummary,
  type Session,
  type TenantRecord,
} from "@smarterp/contracts";

import { db } from "./database.js";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  created_at: string;
};

type ProductRow = {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  unit_price: number;
  status: "draft" | "active";
  created_at: string;
};

type InventoryRow = {
  product_id: string;
  tenant_id: string;
  sku: string;
  product_name: string;
  quantity_on_hand: number;
  updated_at: string;
};

type OrderRow = {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: "draft" | "confirmed";
  created_at: string;
};

type InvoiceRow = {
  id: string;
  tenant_id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  subtotal_amount: number;
  tax_rate_percent: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_count: number;
  last_payment_at: string | null;
  issued_at: string;
  due_date: string;
};

type ReportCountsRow = {
  customer_count: number;
  product_count: number;
  order_count: number;
  invoice_count: number;
  paid_invoice_count: number;
  open_invoice_count: number;
  gross_sales_amount: number;
  invoiced_amount: number;
  cash_collected_amount: number;
  outstanding_receivables_amount: number;
  current_receivables_amount: number;
  overdue_31_to_60_amount: number;
  overdue_61_to_90_amount: number;
  overdue_over_90_amount: number;
};

type CustomerStatementRow = {
  customer_id: string;
  tenant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  invoice_count: number;
  invoiced_amount: number;
  cash_collected_amount: number;
  outstanding_amount: number;
  current_amount: number;
  overdue_31_to_60_amount: number;
  overdue_61_to_90_amount: number;
  overdue_over_90_amount: number;
  last_invoice_at: string | null;
};

type InventorySummaryRow = {
  stock_units_on_hand: number;
  out_of_stock_product_count: number;
  low_stock_product_count: number;
};

type TopCustomerRow = {
  customer_name: string;
  total_amount: number;
};

type TopProductRow = {
  product_name: string;
  total_units: number;
};

const session = createDemoSession();

const listTenantsStatement = db.prepare(`
  SELECT id, name, slug, industry, created_at
  FROM tenants
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createTenantStatement = db.prepare(`
  INSERT INTO tenants (id, name, slug, industry, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const hasTenantStatement = db.prepare(`
  SELECT id
  FROM tenants
  WHERE id = ?
  LIMIT 1
`);

const listCustomersStatement = db.prepare(`
  SELECT id, tenant_id, name, email, phone, city, created_at
  FROM customers
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createCustomerStatement = db.prepare(`
  INSERT INTO customers (id, tenant_id, name, email, phone, city, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getCustomerForOrderStatement = db.prepare(`
  SELECT id, tenant_id, name, email, phone, city, created_at
  FROM customers
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const listProductsStatement = db.prepare(`
  SELECT id, tenant_id, sku, name, unit_price, status, created_at
  FROM products
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createProductStatement = db.prepare(`
  INSERT INTO products (id, tenant_id, sku, name, unit_price, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getProductByIdStatement = db.prepare(`
  SELECT id, tenant_id, sku, name, unit_price, status, created_at
  FROM products
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const ensureInventoryRowStatement = db.prepare(`
  INSERT OR IGNORE INTO inventory (product_id, tenant_id, quantity_on_hand, updated_at)
  VALUES (?, ?, 0, ?)
`);

const updateInventoryQuantityStatement = db.prepare(`
  UPDATE inventory
  SET quantity_on_hand = ?, updated_at = ?
  WHERE product_id = ?
`);

const getInventoryRowStatement = db.prepare(`
  SELECT
    p.id AS product_id,
    p.tenant_id AS tenant_id,
    p.sku AS sku,
    p.name AS product_name,
    COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
    COALESCE(i.updated_at, p.created_at) AS updated_at
  FROM products p
  LEFT JOIN inventory i ON i.product_id = p.id
  WHERE p.tenant_id = ? AND p.id = ?
  LIMIT 1
`);

const listInventoryStatement = db.prepare(`
  SELECT
    p.id AS product_id,
    p.tenant_id AS tenant_id,
    p.sku AS sku,
    p.name AS product_name,
    COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
    COALESCE(i.updated_at, p.created_at) AS updated_at
  FROM products p
  LEFT JOIN inventory i ON i.product_id = p.id
  WHERE p.tenant_id = ?
  ORDER BY p.name COLLATE NOCASE ASC
`);

const listOrdersStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    order_number,
    customer_id,
    customer_name,
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    total_amount,
    status,
    created_at
  FROM orders
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createOrderStatement = db.prepare(`
  INSERT INTO orders (
    id,
    tenant_id,
    order_number,
    customer_id,
    customer_name,
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    total_amount,
    status,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getOrderByIdStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    order_number,
    customer_id,
    customer_name,
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    total_amount,
    status,
    created_at
  FROM orders
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const listInvoicesStatement = db.prepare(`
  SELECT
    i.id AS id,
    i.tenant_id AS tenant_id,
    i.invoice_number AS invoice_number,
    i.order_id AS order_id,
    i.order_number AS order_number,
    i.customer_id AS customer_id,
    i.customer_name AS customer_name,
    i.subtotal_amount AS subtotal_amount,
    i.tax_rate_percent AS tax_rate_percent,
    i.tax_amount AS tax_amount,
    i.total_amount AS total_amount,
    COALESCE(SUM(p.amount), 0) AS paid_amount,
    COUNT(p.id) AS payment_count,
    MAX(p.paid_at) AS last_payment_at,
    i.issued_at AS issued_at,
    i.due_date AS due_date
  FROM invoices i
  LEFT JOIN invoice_payments p ON p.invoice_id = i.id
  WHERE i.tenant_id = ?
  GROUP BY
    i.id,
    i.tenant_id,
    i.invoice_number,
    i.order_id,
    i.order_number,
    i.customer_id,
    i.customer_name,
    i.subtotal_amount,
    i.tax_rate_percent,
    i.tax_amount,
    i.total_amount,
    i.issued_at,
    i.due_date
  ORDER BY datetime(i.issued_at) DESC, i.rowid DESC
`);

const getInvoiceByIdStatement = db.prepare(`
  SELECT
    i.id AS id,
    i.tenant_id AS tenant_id,
    i.invoice_number AS invoice_number,
    i.order_id AS order_id,
    i.order_number AS order_number,
    i.customer_id AS customer_id,
    i.customer_name AS customer_name,
    i.subtotal_amount AS subtotal_amount,
    i.tax_rate_percent AS tax_rate_percent,
    i.tax_amount AS tax_amount,
    i.total_amount AS total_amount,
    COALESCE(SUM(p.amount), 0) AS paid_amount,
    COUNT(p.id) AS payment_count,
    MAX(p.paid_at) AS last_payment_at,
    i.issued_at AS issued_at,
    i.due_date AS due_date
  FROM invoices i
  LEFT JOIN invoice_payments p ON p.invoice_id = i.id
  WHERE i.tenant_id = ? AND i.id = ?
  GROUP BY
    i.id,
    i.tenant_id,
    i.invoice_number,
    i.order_id,
    i.order_number,
    i.customer_id,
    i.customer_name,
    i.subtotal_amount,
    i.tax_rate_percent,
    i.tax_amount,
    i.total_amount,
    i.issued_at,
    i.due_date
  LIMIT 1
`);

const createInvoiceStatement = db.prepare(`
  INSERT INTO invoices (
    id,
    tenant_id,
    invoice_number,
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
    due_date
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const createInvoicePaymentStatement = db.prepare(`
  INSERT INTO invoice_payments (
    id,
    tenant_id,
    invoice_id,
    invoice_number,
    amount,
    method,
    paid_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const listCustomerStatementsStatement = db.prepare(`
  WITH invoice_balances AS (
    SELECT
      i.id AS invoice_id,
      i.tenant_id AS tenant_id,
      i.customer_id AS customer_id,
      i.total_amount AS total_amount,
      i.issued_at AS issued_at,
      i.due_date AS due_date,
      COALESCE(SUM(p.amount), 0) AS paid_amount
    FROM invoices i
    LEFT JOIN invoice_payments p ON p.invoice_id = i.id
    WHERE i.tenant_id = ?
    GROUP BY i.id, i.tenant_id, i.customer_id, i.total_amount, i.issued_at, i.due_date
  )
  SELECT
    c.id AS customer_id,
    c.tenant_id AS tenant_id,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.city AS customer_city,
    COUNT(ib.invoice_id) AS invoice_count,
    COALESCE(SUM(ib.total_amount), 0) AS invoiced_amount,
    COALESCE(SUM(ib.paid_amount), 0) AS cash_collected_amount,
    COALESCE(SUM(ib.total_amount - ib.paid_amount), 0) AS outstanding_amount,
    COALESCE(
      SUM(
        CASE
          WHEN (ib.total_amount - ib.paid_amount) > 0 AND (julianday(date('now')) - julianday(date(ib.due_date))) <= 30
            THEN ib.total_amount - ib.paid_amount
          ELSE 0
        END
      ),
      0
    ) AS current_amount,
    COALESCE(
      SUM(
        CASE
          WHEN (ib.total_amount - ib.paid_amount) > 0
            AND (julianday(date('now')) - julianday(date(ib.due_date))) > 30
            AND (julianday(date('now')) - julianday(date(ib.due_date))) <= 60
            THEN ib.total_amount - ib.paid_amount
          ELSE 0
        END
      ),
      0
    ) AS overdue_31_to_60_amount,
    COALESCE(
      SUM(
        CASE
          WHEN (ib.total_amount - ib.paid_amount) > 0
            AND (julianday(date('now')) - julianday(date(ib.due_date))) > 60
            AND (julianday(date('now')) - julianday(date(ib.due_date))) <= 90
            THEN ib.total_amount - ib.paid_amount
          ELSE 0
        END
      ),
      0
    ) AS overdue_61_to_90_amount,
    COALESCE(
      SUM(
        CASE
          WHEN (ib.total_amount - ib.paid_amount) > 0 AND (julianday(date('now')) - julianday(date(ib.due_date))) > 90
            THEN ib.total_amount - ib.paid_amount
          ELSE 0
        END
      ),
      0
    ) AS overdue_over_90_amount,
    MAX(ib.issued_at) AS last_invoice_at
  FROM customers c
  LEFT JOIN invoice_balances ib ON ib.customer_id = c.id
  WHERE c.tenant_id = ?
  GROUP BY
    c.id,
    c.tenant_id,
    c.name,
    c.email,
    c.phone,
    c.city
  ORDER BY outstanding_amount DESC, c.name COLLATE NOCASE ASC
`);

const getReportCountsStatement = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM customers WHERE tenant_id = ?) AS customer_count,
    (SELECT COUNT(*) FROM products WHERE tenant_id = ?) AS product_count,
    (SELECT COUNT(*) FROM orders WHERE tenant_id = ?) AS order_count,
    (SELECT COUNT(*) FROM invoices WHERE tenant_id = ?) AS invoice_count,
    (
      SELECT COUNT(*)
      FROM (
        SELECT
          i.id,
          i.total_amount,
          COALESCE(SUM(p.amount), 0) AS paid_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount
      ) invoice_totals
      WHERE paid_amount >= total_amount
    ) AS paid_invoice_count,
    (
      SELECT COUNT(*)
      FROM (
        SELECT
          i.id,
          i.total_amount,
          COALESCE(SUM(p.amount), 0) AS paid_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount
      ) invoice_totals
      WHERE paid_amount < total_amount
    ) AS open_invoice_count,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE tenant_id = ?) AS gross_sales_amount,
    (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE tenant_id = ?) AS invoiced_amount,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM invoice_payments
      WHERE tenant_id = ?
    ) AS cash_collected_amount,
    (
      SELECT COALESCE(SUM(total_amount - paid_amount), 0)
      FROM (
        SELECT
          i.id,
          i.total_amount,
          COALESCE(SUM(p.amount), 0) AS paid_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount
      ) invoice_totals
    ) AS outstanding_receivables_amount,
    (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN outstanding_amount > 0 AND age_days <= 30 THEN outstanding_amount
            ELSE 0
          END
        ),
        0
      )
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount,
          julianday(date('now')) - julianday(date(i.due_date)) AS age_days
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount, i.due_date
      ) invoice_aging
    ) AS current_receivables_amount,
    (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN outstanding_amount > 0 AND age_days > 30 AND age_days <= 60 THEN outstanding_amount
            ELSE 0
          END
        ),
        0
      )
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount,
          julianday(date('now')) - julianday(date(i.due_date)) AS age_days
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount, i.due_date
      ) invoice_aging
    ) AS overdue_31_to_60_amount,
    (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN outstanding_amount > 0 AND age_days > 60 AND age_days <= 90 THEN outstanding_amount
            ELSE 0
          END
        ),
        0
      )
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount,
          julianday(date('now')) - julianday(date(i.due_date)) AS age_days
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount, i.due_date
      ) invoice_aging
    ) AS overdue_61_to_90_amount,
    (
      SELECT COALESCE(
        SUM(
          CASE
            WHEN outstanding_amount > 0 AND age_days > 90 THEN outstanding_amount
            ELSE 0
          END
        ),
        0
      )
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount,
          julianday(date('now')) - julianday(date(i.due_date)) AS age_days
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = ?
        GROUP BY i.id, i.total_amount, i.due_date
      ) invoice_aging
    ) AS overdue_over_90_amount
`);

const getInventorySummaryStatement = db.prepare(`
  SELECT
    COALESCE(SUM(quantity_on_hand), 0) AS stock_units_on_hand,
    COALESCE(SUM(CASE WHEN quantity_on_hand = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_product_count,
    COALESCE(SUM(CASE WHEN quantity_on_hand BETWEEN 1 AND 5 THEN 1 ELSE 0 END), 0) AS low_stock_product_count
  FROM inventory
  WHERE tenant_id = ?
`);

const getTopCustomerStatement = db.prepare(`
  SELECT
    customer_name,
    SUM(total_amount) AS total_amount
  FROM orders
  WHERE tenant_id = ?
  GROUP BY customer_id, customer_name
  ORDER BY total_amount DESC, customer_name COLLATE NOCASE ASC
  LIMIT 1
`);

const getTopProductStatement = db.prepare(`
  SELECT
    product_name,
    SUM(quantity) AS total_units
  FROM orders
  WHERE tenant_id = ?
  GROUP BY product_id, product_name
  ORDER BY total_units DESC, product_name COLLATE NOCASE ASC
  LIMIT 1
`);

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function timestamp(): string {
  return new Date().toISOString();
}

function isValidBusinessDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function createBusinessTimestamp(dateInput: string): string {
  const [year, month, day] = dateInput.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)).toISOString();
}

function addBusinessDays(dateIso: string, days: number): string {
  const candidate = new Date(dateIso);
  candidate.setUTCDate(candidate.getUTCDate() + days);
  return candidate.toISOString();
}

function getUtcDayValue(value: string | Date): number {
  const date = value instanceof Date ? value : new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getCalendarDayDifference(start: string | Date, end: string | Date): number {
  return Math.round((getUtcDayValue(end) - getUtcDayValue(start)) / DAY_IN_MS);
}

function mapTenant(row: TenantRow): TenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    industry: row.industry,
    createdAt: row.created_at,
  };
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    createdAt: row.created_at,
  };
}

function mapCustomerStatement(row: CustomerStatementRow): CustomerStatementRecord {
  return {
    customerId: row.customer_id,
    tenantId: row.tenant_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerCity: row.customer_city,
    invoiceCount: row.invoice_count,
    invoicedAmount: row.invoiced_amount,
    cashCollectedAmount: row.cash_collected_amount,
    outstandingAmount: row.outstanding_amount,
    currentAmount: row.current_amount,
    overdue31To60Amount: row.overdue_31_to_60_amount,
    overdue61To90Amount: row.overdue_61_to_90_amount,
    overdueOver90Amount: row.overdue_over_90_amount,
    lastInvoiceAt: row.last_invoice_at,
  };
}

function mapProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sku: row.sku,
    name: row.name,
    unitPrice: row.unit_price,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapInventory(row: InventoryRow): InventoryRecord {
  return {
    productId: row.product_id,
    tenantId: row.tenant_id,
    sku: row.sku,
    productName: row.product_name,
    quantityOnHand: row.quantity_on_hand,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
  };
}

function getInvoiceStatus(totalAmount: number, paidAmount: number): InvoiceRecord["status"] {
  if (paidAmount >= totalAmount) {
    return "paid";
  }

  if (paidAmount > 0) {
    return "partially_paid";
  }

  return "issued";
}

function getCollectionStatus(
  outstandingAmount: number,
  daysUntilDue: number,
): InvoiceRecord["collectionStatus"] {
  if (outstandingAmount === 0) {
    return "settled";
  }

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue === 0) {
    return "due_today";
  }

  return "current";
}

function mapInvoice(row: InvoiceRow): InvoiceRecord {
  const paidAmount = row.paid_amount;
  const outstandingAmount = Math.max(row.total_amount - paidAmount, 0);
  const paymentTermDays = getCalendarDayDifference(row.issued_at, row.due_date);
  const daysUntilDue = getCalendarDayDifference(new Date(), row.due_date);
  const daysPastDue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceNumber: row.invoice_number,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    subtotalAmount: row.subtotal_amount,
    taxRatePercent: row.tax_rate_percent,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    paidAmount,
    outstandingAmount,
    paymentCount: row.payment_count,
    lastPaymentAt: row.last_payment_at,
    status: getInvoiceStatus(row.total_amount, paidAmount),
    issuedAt: row.issued_at,
    dueDate: row.due_date,
    paymentTermDays,
    daysUntilDue,
    daysPastDue,
    collectionStatus: getCollectionStatus(outstandingAmount, daysUntilDue),
  };
}

function createOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `SO-${datePart}-${suffix}`;
}

function createInvoiceNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `INV-${datePart}-${suffix}`;
}

function ensureInventoryRow(tenantId: string, productId: string): void {
  ensureInventoryRowStatement.run(productId, tenantId, timestamp());
}

export function getSession(): Session {
  return session;
}

export function listTenants(): TenantRecord[] {
  return (listTenantsStatement.all() as TenantRow[]).map(mapTenant);
}

export function createTenant(input: CreateTenantInput): TenantRecord {
  const tenant: TenantRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    industry: input.industry.trim(),
    createdAt: timestamp(),
  };

  createTenantStatement.run(
    tenant.id,
    tenant.name,
    tenant.slug,
    tenant.industry,
    tenant.createdAt,
  );

  return tenant;
}

export function hasTenant(tenantId: string): boolean {
  return Boolean(hasTenantStatement.get(tenantId));
}

export function listCustomers(tenantId: string): CustomerRecord[] {
  return (listCustomersStatement.all(tenantId) as CustomerRow[]).map(mapCustomer);
}

export function listCustomerStatements(tenantId: string): CustomerStatementRecord[] {
  return (listCustomerStatementsStatement.all(tenantId, tenantId) as CustomerStatementRow[]).map(
    mapCustomerStatement,
  );
}

export function createCustomer(input: CreateCustomerInput): CustomerRecord {
  const customer: CustomerRecord = {
    id: randomUUID(),
    tenantId: input.tenantId,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    createdAt: timestamp(),
  };

  createCustomerStatement.run(
    customer.id,
    customer.tenantId,
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.createdAt,
  );

  return customer;
}

export function listProducts(tenantId: string): ProductRecord[] {
  return (listProductsStatement.all(tenantId) as ProductRow[]).map(mapProduct);
}

export function createProduct(input: CreateProductInput): ProductRecord {
  const product: ProductRecord = {
    id: randomUUID(),
    tenantId: input.tenantId,
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    unitPrice: input.unitPrice,
    status: "active",
    createdAt: timestamp(),
  };

  createProductStatement.run(
    product.id,
    product.tenantId,
    product.sku,
    product.name,
    product.unitPrice,
    product.status,
    product.createdAt,
  );

  ensureInventoryRow(product.tenantId, product.id);

  return product;
}

export function listInventory(tenantId: string): InventoryRecord[] {
  return (listInventoryStatement.all(tenantId) as InventoryRow[]).map(mapInventory);
}

export function createInventoryAdjustment(input: CreateInventoryAdjustmentInput): InventoryRecord {
  const product = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!product) {
    throw new Error("The selected product does not exist.");
  }

  ensureInventoryRow(input.tenantId, input.productId);

  const currentInventory = getInventoryRowStatement.get(input.tenantId, input.productId) as
    | InventoryRow
    | undefined;

  if (!currentInventory) {
    throw new Error("The selected product does not exist.");
  }

  const delta = input.direction === "in" ? input.quantity : -input.quantity;
  const nextQuantity = currentInventory.quantity_on_hand + delta;

  if (nextQuantity < 0) {
    throw new Error("Insufficient stock for the selected product.");
  }

  const updatedAt = timestamp();
  updateInventoryQuantityStatement.run(nextQuantity, updatedAt, input.productId);

  return {
    ...mapInventory(currentInventory),
    quantityOnHand: nextQuantity,
    updatedAt,
  };
}

export function listOrders(tenantId: string): OrderRecord[] {
  return (listOrdersStatement.all(tenantId) as OrderRow[]).map(mapOrder);
}

export function listInvoices(tenantId: string): InvoiceRecord[] {
  return (listInvoicesStatement.all(tenantId) as InvoiceRow[]).map(mapInvoice);
}

export function getReportSummary(tenantId: string): ReportSummary {
  const counts = getReportCountsStatement.get(
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
    tenantId,
  ) as ReportCountsRow;
  const inventory = getInventorySummaryStatement.get(tenantId) as InventorySummaryRow | undefined;
  const topCustomer = getTopCustomerStatement.get(tenantId) as TopCustomerRow | undefined;
  const topProduct = getTopProductStatement.get(tenantId) as TopProductRow | undefined;

  return {
    tenantId,
    customerCount: counts.customer_count,
    productCount: counts.product_count,
    orderCount: counts.order_count,
    invoiceCount: counts.invoice_count,
    paidInvoiceCount: counts.paid_invoice_count,
    openInvoiceCount: counts.open_invoice_count,
    grossSalesAmount: counts.gross_sales_amount,
    invoicedAmount: counts.invoiced_amount,
    cashCollectedAmount: counts.cash_collected_amount,
    outstandingReceivablesAmount: counts.outstanding_receivables_amount,
    currentReceivablesAmount: counts.current_receivables_amount,
    overdue31To60Amount: counts.overdue_31_to_60_amount,
    overdue61To90Amount: counts.overdue_61_to_90_amount,
    overdueOver90Amount: counts.overdue_over_90_amount,
    averageOrderValue: counts.order_count > 0 ? Math.round(counts.gross_sales_amount / counts.order_count) : 0,
    stockUnitsOnHand: inventory?.stock_units_on_hand ?? 0,
    outOfStockProductCount: inventory?.out_of_stock_product_count ?? 0,
    lowStockProductCount: inventory?.low_stock_product_count ?? 0,
    topCustomerName: topCustomer?.customer_name ?? "",
    topCustomerAmount: topCustomer?.total_amount ?? 0,
    topProductName: topProduct?.product_name ?? "",
    topProductUnits: topProduct?.total_units ?? 0,
  };
}

export function createOrder(input: CreateOrderInput): OrderRecord {
  const customer = getCustomerForOrderStatement.get(input.tenantId, input.customerId) as
    | CustomerRow
    | undefined;
  if (!customer) {
    throw new Error("The selected customer does not exist.");
  }

  const product = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!product) {
    throw new Error("The selected product does not exist.");
  }

  db.exec("BEGIN");

  try {
    ensureInventoryRow(input.tenantId, input.productId);

    const inventory = getInventoryRowStatement.get(input.tenantId, input.productId) as
      | InventoryRow
      | undefined;

    if (!inventory || inventory.quantity_on_hand < input.quantity) {
      throw new Error("Insufficient stock for the selected product.");
    }

    const order: OrderRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      orderNumber: createOrderNumber(),
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: input.quantity,
      unitPrice: product.unit_price,
      totalAmount: product.unit_price * input.quantity,
      status: "confirmed",
      createdAt: timestamp(),
    };

    const inventoryUpdatedAt = timestamp();
    updateInventoryQuantityStatement.run(
      inventory.quantity_on_hand - input.quantity,
      inventoryUpdatedAt,
      input.productId,
    );

    createOrderStatement.run(
      order.id,
      order.tenantId,
      order.orderNumber,
      order.customerId,
      order.customerName,
      order.productId,
      order.productName,
      order.productSku,
      order.quantity,
      order.unitPrice,
      order.totalAmount,
      order.status,
      order.createdAt,
    );

    db.exec("COMMIT");
    return order;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createInvoice(input: CreateInvoiceInput): InvoiceRecord {
  const order = getOrderByIdStatement.get(input.tenantId, input.orderId) as OrderRow | undefined;
  if (!order) {
    throw new Error("The selected order does not exist.");
  }

  if (!isValidBusinessDateInput(input.issueDate)) {
    throw new Error("Issue date must be a valid YYYY-MM-DD value.");
  }

  if (!Number.isInteger(input.paymentTermDays) || input.paymentTermDays < 0 || input.paymentTermDays > 365) {
    throw new Error("Payment term days must be an integer between 0 and 365.");
  }

  const subtotalAmount = order.total_amount;
  const taxAmount = Math.round((subtotalAmount * input.taxRatePercent) / 100);
  const issuedAt = createBusinessTimestamp(input.issueDate);
  const dueDate = addBusinessDays(issuedAt, input.paymentTermDays);

  const invoice: InvoiceRecord = {
    id: randomUUID(),
    tenantId: input.tenantId,
    invoiceNumber: createInvoiceNumber(),
    orderId: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    customerName: order.customer_name,
    subtotalAmount,
    taxRatePercent: input.taxRatePercent,
    taxAmount,
    totalAmount: subtotalAmount + taxAmount,
    paidAmount: 0,
    outstandingAmount: subtotalAmount + taxAmount,
    paymentCount: 0,
    lastPaymentAt: null,
    status: "issued",
    issuedAt,
    dueDate,
    paymentTermDays: input.paymentTermDays,
    daysUntilDue: getCalendarDayDifference(new Date(), dueDate),
    daysPastDue: Math.max(getCalendarDayDifference(dueDate, new Date()), 0),
    collectionStatus: getCollectionStatus(subtotalAmount + taxAmount, getCalendarDayDifference(new Date(), dueDate)),
  };

  createInvoiceStatement.run(
    invoice.id,
    invoice.tenantId,
    invoice.invoiceNumber,
    invoice.orderId,
    invoice.orderNumber,
    invoice.customerId,
    invoice.customerName,
    invoice.subtotalAmount,
    invoice.taxRatePercent,
    invoice.taxAmount,
    invoice.totalAmount,
    invoice.status,
    invoice.issuedAt,
    invoice.dueDate,
  );

  return invoice;
}

export function createInvoicePayment(input: CreateInvoicePaymentInput): InvoiceRecord {
  const invoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as InvoiceRow | undefined;
  if (!invoice) {
    throw new Error("The selected invoice does not exist.");
  }

  const outstandingAmount = Math.max(invoice.total_amount - invoice.paid_amount, 0);

  if (outstandingAmount === 0) {
    throw new Error("The selected invoice is already settled.");
  }

  if (input.amount > outstandingAmount) {
    throw new Error("Payment amount cannot exceed the outstanding balance.");
  }

  createInvoicePaymentStatement.run(
    randomUUID(),
    input.tenantId,
    invoice.id,
    invoice.invoice_number,
    input.amount,
    input.method,
    timestamp(),
  );

  const updatedInvoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as InvoiceRow | undefined;
  if (!updatedInvoice) {
    throw new Error("The selected invoice does not exist.");
  }

  return mapInvoice(updatedInvoice);
}
