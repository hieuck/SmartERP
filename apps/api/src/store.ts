import { randomUUID } from "node:crypto";

import {
  type ApprovalAwareMutationResult,
  type ApprovalDecision,
  type ApprovalDecisionInput,
  type ApprovalRequestRecord,
  type ApprovalRequestType,
  type ApprovalRiskLevel,
  type ApprovalStatus,
  type AuditActionType,
  type AuditEntityType,
  type AuditLogMetadata,
  type AuditLogRecord,
  type AccountBalanceRecord,
  type AccountType,
  createDemoSession,
  type CreateCustomerInput,
  type DeleteCustomerInput,
  type CreateInvoiceInput,
  type CreateInvoicePaymentInput,
  type UpdateInvoiceCollectionInput,
  type ResolveInvoiceCollectionActionInput,
  type CollectionActionRequired,
  type CollectionActivityState,
  type CreateInventoryAdjustmentInput,
  type CreateOrderInput,
  type CreatePurchaseOrderInput,
  type ReceivePurchaseOrderInput,
  type ReceivePurchaseOrderResult,
  type CreateProductInput,
  type DeleteProductInput,
  type CreateSupplierInput,
  type DeleteSupplierInput,
  type CreateTenantInput,
  type ImportOnboardingInput,
  type ImportOnboardingResult,
  type OnboardingDataset,
  type OnboardingImportError,
  type RestoreTenantSnapshotInput,
  type RestoreTenantSnapshotPreview,
  type RestoreTenantSnapshotResult,
  type CollectionFollowUpStatus,
  type CollectionPriority,
  type InvoiceCollectionActivityRecord,
  type CustomerStatementRecord,
  type JournalEntryRecord,
  type JournalReferenceType,
  type CustomerRecord,
  type InvoiceRecord,
  type InventoryRecord,
  type OrderRecord,
  type PurchaseOrderReceiptRecord,
  type PurchaseOrderRecord,
  type PurchaseOrderStatus,
  type ProductRecord,
  type ReportSummary,
  type OperationsTenantStatusRecord,
  type OperationsTotals,
  type Session,
  type SupplierRecord,
  type TenantRecord,
  type TenantExportBundle,
  type UpdateCustomerInput,
  type UpdateProductInput,
  type UpdateSupplierInput,
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

type SupplierRow = {
  id: string;
  tenant_id: string;
  supplier_code: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  lead_time_days: number;
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
  average_unit_cost: number;
  inventory_value: number;
  last_receipt_at: string | null;
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

type PurchaseOrderRow = {
  id: string;
  tenant_id: string;
  purchase_order_number: string;
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity_ordered: number;
  received_quantity: number;
  unit_cost: number;
  total_amount: number;
  status: PurchaseOrderStatus;
  expected_receipt_date: string;
  created_at: string;
};

type PurchaseOrderReceiptRow = {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  purchase_order_number: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  received_at: string;
};

type ApprovalRequestRow = {
  id: string;
  tenant_id: string;
  request_type: ApprovalRequestType;
  status: ApprovalStatus;
  risk_level: ApprovalRiskLevel;
  reference_id: string;
  reference_number: string;
  summary: string;
  reason: string;
  amount: number | null;
  quantity: number | null;
  requested_by_email: string;
  requested_by_display_name: string;
  decision_by_email: string | null;
  decision_by_display_name: string | null;
  decision_note: string | null;
  payload_json: string;
  requested_at: string;
  decided_at: string | null;
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
  follow_up_status: CollectionFollowUpStatus;
  action_required: CollectionActionRequired;
  promised_payment_date: string | null;
  next_action_date: string | null;
  collection_note: string;
  last_collection_update_at: string | null;
};

type InvoiceCollectionActivityRow = {
  id: string;
  tenant_id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  follow_up_status: CollectionFollowUpStatus;
  collection_priority: CollectionPriority;
  action_required: CollectionActionRequired;
  promised_payment_date: string | null;
  next_action_date: string | null;
  collection_note: string;
  outstanding_amount_snapshot: number;
  action_state: CollectionActivityState;
  created_at: string;
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

type OperationsTotalsRow = {
  tenant_count: number;
  customer_count: number;
  supplier_count: number;
  product_count: number;
  purchase_order_count: number;
  open_purchase_order_count: number;
  inventory_line_count: number;
  order_count: number;
  invoice_count: number;
  open_invoice_count: number;
  pending_approval_count: number;
  overdue_receivables_amount: number;
  today_collection_action_count: number;
};

type OperationsTenantStatusRow = {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  industry: string;
  customer_count: number;
  supplier_count: number;
  product_count: number;
  open_invoice_count: number;
  pending_approval_count: number;
  overdue_receivables_amount: number;
  inventory_value_amount: number;
  last_activity_at: string | null;
};

type AccountRow = {
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  sort_order: number;
};

type AccountBalanceRow = {
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  balance_amount: number;
};

type JournalEntryRow = {
  id: string;
  tenant_id: string;
  entry_group_id: string;
  reference_type: JournalReferenceType;
  reference_id: string;
  reference_number: string;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  tenant_id: string;
  domain: "finance";
  entity_type: AuditEntityType;
  entity_id: string;
  entity_number: string;
  action_type: AuditActionType;
  summary: string;
  actor_email: string;
  actor_display_name: string;
  metadata_json: string;
  created_at: string;
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
  inventory_value_amount: number;
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

let currentSession = createDemoSession();

const defaultAccounts = [
  { accountCode: "111", accountName: "Tiền mặt", accountType: "asset", sortOrder: 1 },
  { accountCode: "112", accountName: "Tiền gửi ngân hàng", accountType: "asset", sortOrder: 2 },
  { accountCode: "131", accountName: "Phải thu khách hàng", accountType: "asset", sortOrder: 3 },
  { accountCode: "156", accountName: "Hàng tồn kho", accountType: "asset", sortOrder: 6 },
  { accountCode: "331", accountName: "Phải trả nhà cung cấp", accountType: "liability", sortOrder: 7 },
  { accountCode: "3331", accountName: "Thuế GTGT phải nộp", accountType: "liability", sortOrder: 8 },
  { accountCode: "511", accountName: "Doanh thu bán hàng", accountType: "revenue", sortOrder: 9 },
  { accountCode: "632", accountName: "Giá vốn hàng bán", accountType: "expense", sortOrder: 10 },
] as const satisfies ReadonlyArray<{
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  sortOrder: number;
}>;

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

const getTenantByIdStatement = db.prepare(`
  SELECT id, name, slug, industry, created_at
  FROM tenants
  WHERE id = ?
  LIMIT 1
`);

const getTenantBySlugStatement = db.prepare(`
  SELECT id, name, slug, industry, created_at
  FROM tenants
  WHERE slug = ?
  LIMIT 1
`);

const createAccountStatement = db.prepare(`
  INSERT OR IGNORE INTO accounts (
    tenant_id,
    account_code,
    account_name,
    account_type,
    sort_order
  )
  VALUES (?, ?, ?, ?, ?)
`);

const listAccountBalancesStatement = db.prepare(`
  SELECT
    a.tenant_id AS tenant_id,
    a.account_code AS account_code,
    a.account_name AS account_name,
    a.account_type AS account_type,
    COALESCE(
      CASE
        WHEN a.account_type IN ('asset', 'expense')
          THEN SUM(j.debit_amount - j.credit_amount)
        ELSE SUM(j.credit_amount - j.debit_amount)
      END,
      0
    ) AS balance_amount
  FROM accounts a
  LEFT JOIN journal_entries j
    ON j.tenant_id = a.tenant_id
    AND j.account_code = a.account_code
  WHERE a.tenant_id = ?
  GROUP BY
    a.tenant_id,
    a.account_code,
    a.account_name,
    a.account_type,
    a.sort_order
  ORDER BY a.sort_order ASC, a.account_code ASC
`);

const createJournalEntryStatement = db.prepare(`
  INSERT INTO journal_entries (
    id,
    tenant_id,
    entry_group_id,
    reference_type,
    reference_id,
    reference_number,
    account_code,
    account_name,
    debit_amount,
    credit_amount,
    description,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listJournalEntriesStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    entry_group_id,
    reference_type,
    reference_id,
    reference_number,
    account_code,
    account_name,
    debit_amount,
    credit_amount,
    description,
    created_at
  FROM journal_entries
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
  LIMIT 24
`);

const listApprovalRequestsStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    request_type,
    status,
    risk_level,
    reference_id,
    reference_number,
    summary,
    reason,
    amount,
    quantity,
    requested_by_email,
    requested_by_display_name,
    decision_by_email,
    decision_by_display_name,
    decision_note,
    payload_json,
    requested_at,
    decided_at
  FROM approval_requests
  WHERE tenant_id = ?
  ORDER BY
    CASE status
      WHEN 'pending' THEN 0
      WHEN 'approved' THEN 1
      ELSE 2
    END,
    datetime(COALESCE(decided_at, requested_at)) DESC,
    rowid DESC
`);

const getApprovalRequestByIdStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    request_type,
    status,
    risk_level,
    reference_id,
    reference_number,
    summary,
    reason,
    amount,
    quantity,
    requested_by_email,
    requested_by_display_name,
    decision_by_email,
    decision_by_display_name,
    decision_note,
    payload_json,
    requested_at,
    decided_at
  FROM approval_requests
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const createApprovalRequestStatement = db.prepare(`
  INSERT INTO approval_requests (
    id,
    tenant_id,
    request_type,
    status,
    risk_level,
    reference_id,
    reference_number,
    summary,
    reason,
    amount,
    quantity,
    requested_by_email,
    requested_by_display_name,
    decision_by_email,
    decision_by_display_name,
    decision_note,
    payload_json,
    requested_at,
    decided_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const resolveApprovalRequestStatement = db.prepare(`
  UPDATE approval_requests
  SET
    status = ?,
    decision_by_email = ?,
    decision_by_display_name = ?,
    decision_note = ?,
    decided_at = ?
  WHERE tenant_id = ? AND id = ?
`);

const createAuditLogStatement = db.prepare(`
  INSERT INTO audit_logs (
    id,
    tenant_id,
    domain,
    entity_type,
    entity_id,
    entity_number,
    action_type,
    summary,
    actor_email,
    actor_display_name,
    metadata_json,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const listAuditLogsStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    domain,
    entity_type,
    entity_id,
    entity_number,
    action_type,
    summary,
    actor_email,
    actor_display_name,
    metadata_json,
    created_at
  FROM audit_logs
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
  LIMIT 24
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

const getCustomerByIdStatement = db.prepare(`
  SELECT id, tenant_id, name, email, phone, city, created_at
  FROM customers
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const updateCustomerStatement = db.prepare(`
  UPDATE customers
  SET
    name = ?,
    email = ?,
    phone = ?,
    city = ?
  WHERE tenant_id = ? AND id = ?
`);

const deleteCustomerStatement = db.prepare(`
  DELETE FROM customers
  WHERE tenant_id = ? AND id = ?
`);

const countOrdersForCustomerStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM orders
  WHERE tenant_id = ? AND customer_id = ?
`);

const countInvoicesForCustomerStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM invoices
  WHERE tenant_id = ? AND customer_id = ?
`);

const listSuppliersStatement = db.prepare(`
  SELECT id, tenant_id, supplier_code, name, email, phone, city, lead_time_days, created_at
  FROM suppliers
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createSupplierStatement = db.prepare(`
  INSERT INTO suppliers (
    id,
    tenant_id,
    supplier_code,
    name,
    email,
    phone,
    city,
    lead_time_days,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getSupplierByIdStatement = db.prepare(`
  SELECT id, tenant_id, supplier_code, name, email, phone, city, lead_time_days, created_at
  FROM suppliers
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const updateSupplierStatement = db.prepare(`
  UPDATE suppliers
  SET
    supplier_code = ?,
    name = ?,
    email = ?,
    phone = ?,
    city = ?,
    lead_time_days = ?
  WHERE tenant_id = ? AND id = ?
`);

const deleteSupplierStatement = db.prepare(`
  DELETE FROM suppliers
  WHERE tenant_id = ? AND id = ?
`);

const countPurchaseOrdersForSupplierStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM purchase_orders
  WHERE tenant_id = ? AND supplier_id = ?
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

const updateProductStatement = db.prepare(`
  UPDATE products
  SET
    sku = ?,
    name = ?,
    unit_price = ?
  WHERE tenant_id = ? AND id = ?
`);

const deleteProductStatement = db.prepare(`
  DELETE FROM products
  WHERE tenant_id = ? AND id = ?
`);

const countOrdersForProductStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM orders
  WHERE tenant_id = ? AND product_id = ?
`);

const countPurchaseOrdersForProductStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM purchase_orders
  WHERE tenant_id = ? AND product_id = ?
`);

const getInventoryFootprintForProductStatement = db.prepare(`
  SELECT
    COALESCE(quantity_on_hand, 0) AS quantity_on_hand,
    COALESCE(inventory_value, 0) AS inventory_value
  FROM inventory
  WHERE tenant_id = ? AND product_id = ?
  LIMIT 1
`);

const ensureInventoryRowStatement = db.prepare(`
  INSERT OR IGNORE INTO inventory (
    product_id,
    tenant_id,
    quantity_on_hand,
    average_unit_cost,
    inventory_value,
    last_receipt_at,
    updated_at
  )
  VALUES (?, ?, 0, 0, 0, NULL, ?)
`);

const updateInventorySnapshotStatement = db.prepare(`
  UPDATE inventory
  SET
    quantity_on_hand = ?,
    average_unit_cost = ?,
    inventory_value = ?,
    last_receipt_at = ?,
    updated_at = ?
  WHERE product_id = ?
`);

const getInventoryRowStatement = db.prepare(`
  SELECT
    p.id AS product_id,
    p.tenant_id AS tenant_id,
    p.sku AS sku,
    p.name AS product_name,
    COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
    COALESCE(i.average_unit_cost, 0) AS average_unit_cost,
    COALESCE(i.inventory_value, 0) AS inventory_value,
    i.last_receipt_at AS last_receipt_at,
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
    COALESCE(i.average_unit_cost, 0) AS average_unit_cost,
    COALESCE(i.inventory_value, 0) AS inventory_value,
    i.last_receipt_at AS last_receipt_at,
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

const listPurchaseOrdersStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    purchase_order_number,
    supplier_id,
    supplier_code,
    supplier_name,
    product_id,
    product_sku,
    product_name,
    quantity_ordered,
    received_quantity,
    unit_cost,
    total_amount,
    status,
    expected_receipt_date,
    created_at
  FROM purchase_orders
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createPurchaseOrderStatement = db.prepare(`
  INSERT INTO purchase_orders (
    id,
    tenant_id,
    purchase_order_number,
    supplier_id,
    supplier_code,
    supplier_name,
    product_id,
    product_sku,
    product_name,
    quantity_ordered,
    received_quantity,
    unit_cost,
    total_amount,
    status,
    expected_receipt_date,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getPurchaseOrderByIdStatement = db.prepare(`
  SELECT
    id,
    tenant_id,
    purchase_order_number,
    supplier_id,
    supplier_code,
    supplier_name,
    product_id,
    product_sku,
    product_name,
    quantity_ordered,
    received_quantity,
    unit_cost,
    total_amount,
    status,
    expected_receipt_date,
    created_at
  FROM purchase_orders
  WHERE tenant_id = ? AND id = ?
  LIMIT 1
`);

const updatePurchaseOrderReceivingStatement = db.prepare(`
  UPDATE purchase_orders
  SET received_quantity = ?, status = ?
  WHERE id = ?
`);

const createPurchaseOrderReceiptStatement = db.prepare(`
  INSERT INTO purchase_order_receipts (
    id,
    tenant_id,
    purchase_order_id,
    purchase_order_number,
    product_id,
    product_sku,
    product_name,
    quantity_received,
    unit_cost,
    total_cost,
    received_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    i.due_date AS due_date,
    i.follow_up_status AS follow_up_status,
    i.action_required AS action_required,
    i.promised_payment_date AS promised_payment_date,
    i.next_action_date AS next_action_date,
    i.collection_note AS collection_note,
    i.last_collection_update_at AS last_collection_update_at
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
    i.due_date,
    i.follow_up_status,
    i.action_required,
    i.promised_payment_date,
    i.next_action_date,
    i.collection_note,
    i.last_collection_update_at
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
    i.due_date AS due_date,
    i.follow_up_status AS follow_up_status,
    i.action_required AS action_required,
    i.promised_payment_date AS promised_payment_date,
    i.next_action_date AS next_action_date,
    i.collection_note AS collection_note,
    i.last_collection_update_at AS last_collection_update_at
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
    i.due_date,
    i.follow_up_status,
    i.action_required,
    i.promised_payment_date,
    i.next_action_date,
    i.collection_note,
    i.last_collection_update_at
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
    due_date,
    follow_up_status,
    action_required,
    promised_payment_date,
    next_action_date,
    collection_note,
    last_collection_update_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateInvoiceCollectionStatement = db.prepare(`
  UPDATE invoices
  SET
    follow_up_status = ?,
    action_required = ?,
    promised_payment_date = ?,
    next_action_date = ?,
    collection_note = ?,
    last_collection_update_at = ?
  WHERE tenant_id = ? AND id = ?
`);

const listInvoiceCollectionActivitiesStatement = db.prepare(`
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
  FROM invoice_collection_activities
  WHERE tenant_id = ?
  ORDER BY datetime(created_at) DESC, rowid DESC
`);

const createInvoiceCollectionActivityStatement = db.prepare(`
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
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    COALESCE(SUM(inventory_value), 0) AS inventory_value_amount,
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

const getOperationsTotalsStatement = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM tenants) AS tenant_count,
    (SELECT COUNT(*) FROM customers) AS customer_count,
    (SELECT COUNT(*) FROM suppliers) AS supplier_count,
    (SELECT COUNT(*) FROM products) AS product_count,
    (SELECT COUNT(*) FROM purchase_orders) AS purchase_order_count,
    (SELECT COUNT(*) FROM purchase_orders WHERE status <> 'received') AS open_purchase_order_count,
    (SELECT COUNT(*) FROM inventory) AS inventory_line_count,
    (SELECT COUNT(*) FROM orders) AS order_count,
    (SELECT COUNT(*) FROM invoices) AS invoice_count,
    (
      SELECT COUNT(*)
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        GROUP BY i.id, i.total_amount
      ) invoice_totals
      WHERE outstanding_amount > 0
    ) AS open_invoice_count,
    (
      SELECT COUNT(*)
      FROM approval_requests
      WHERE status = 'pending'
    ) AS pending_approval_count,
    (
      SELECT COALESCE(SUM(outstanding_amount), 0)
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE date(i.due_date) < date('now')
        GROUP BY i.id, i.total_amount, i.due_date
      ) overdue_invoices
      WHERE outstanding_amount > 0
    ) AS overdue_receivables_amount,
    (
      SELECT COUNT(*)
      FROM (
        SELECT
          i.id,
          i.next_action_date,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.next_action_date IS NOT NULL
        GROUP BY i.id, i.next_action_date, i.total_amount
      ) actionable_invoices
      WHERE outstanding_amount > 0 AND date(next_action_date) <= date('now')
    ) AS today_collection_action_count
`);

const listOperationsTenantStatusStatement = db.prepare(`
  SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    t.industry AS industry,
    (SELECT COUNT(*) FROM customers c WHERE c.tenant_id = t.id) AS customer_count,
    (SELECT COUNT(*) FROM suppliers s WHERE s.tenant_id = t.id) AS supplier_count,
    (SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id) AS product_count,
    (
      SELECT COUNT(*)
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = t.id
        GROUP BY i.id, i.total_amount
      ) invoice_totals
      WHERE outstanding_amount > 0
    ) AS open_invoice_count,
    (
      SELECT COUNT(*)
      FROM approval_requests ar
      WHERE ar.tenant_id = t.id AND ar.status = 'pending'
    ) AS pending_approval_count,
    (
      SELECT COALESCE(SUM(outstanding_amount), 0)
      FROM (
        SELECT
          i.id,
          i.total_amount - COALESCE(SUM(p.amount), 0) AS outstanding_amount
        FROM invoices i
        LEFT JOIN invoice_payments p ON p.invoice_id = i.id
        WHERE i.tenant_id = t.id AND date(i.due_date) < date('now')
        GROUP BY i.id, i.total_amount, i.due_date
      ) overdue_invoices
      WHERE outstanding_amount > 0
    ) AS overdue_receivables_amount,
    (
      SELECT COALESCE(SUM(inv.inventory_value), 0)
      FROM inventory inv
      WHERE inv.tenant_id = t.id
    ) AS inventory_value_amount,
    (
      SELECT MAX(event_time)
      FROM (
        SELECT MAX(created_at) AS event_time FROM customers c WHERE c.tenant_id = t.id
        UNION ALL
        SELECT MAX(created_at) AS event_time FROM suppliers s WHERE s.tenant_id = t.id
        UNION ALL
        SELECT MAX(created_at) AS event_time FROM products p WHERE p.tenant_id = t.id
        UNION ALL
        SELECT MAX(created_at) AS event_time FROM orders o WHERE o.tenant_id = t.id
        UNION ALL
        SELECT MAX(created_at) AS event_time FROM purchase_orders po WHERE po.tenant_id = t.id
        UNION ALL
        SELECT MAX(received_at) AS event_time FROM purchase_order_receipts pr WHERE pr.tenant_id = t.id
        UNION ALL
        SELECT MAX(issued_at) AS event_time FROM invoices i WHERE i.tenant_id = t.id
        UNION ALL
        SELECT MAX(paid_at) AS event_time FROM invoice_payments ip WHERE ip.tenant_id = t.id
        UNION ALL
        SELECT MAX(requested_at) AS event_time FROM approval_requests ar WHERE ar.tenant_id = t.id
      )
    ) AS last_activity_at
  FROM tenants t
  ORDER BY overdue_receivables_amount DESC, pending_approval_count DESC, tenant_name COLLATE NOCASE ASC
`);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const validFollowUpStatuses: CollectionFollowUpStatus[] = [
  "new",
  "contacted",
  "promised",
  "escalated",
];
const validActionRequireds: CollectionActionRequired[] = [
  "monitor",
  "call_customer",
  "confirm_payment",
  "escalate_founder",
];

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

function isValidFollowUpStatus(value: string): value is CollectionFollowUpStatus {
  return validFollowUpStatuses.includes(value as CollectionFollowUpStatus);
}

function isValidActionRequired(value: string): value is CollectionActionRequired {
  return validActionRequireds.includes(value as CollectionActionRequired);
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

function mapOperationsTenantStatus(row: OperationsTenantStatusRow): OperationsTenantStatusRecord {
  return {
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    industry: row.industry,
    customerCount: row.customer_count,
    supplierCount: row.supplier_count,
    productCount: row.product_count,
    openInvoiceCount: row.open_invoice_count,
    pendingApprovalCount: row.pending_approval_count,
    overdueReceivablesAmount: row.overdue_receivables_amount,
    inventoryValueAmount: row.inventory_value_amount,
    lastActivityAt: row.last_activity_at,
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

function mapSupplier(row: SupplierRow): SupplierRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    supplierCode: row.supplier_code,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    leadTimeDays: row.lead_time_days,
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
    averageUnitCost: row.average_unit_cost,
    inventoryValue: row.inventory_value,
    lastReceiptAt: row.last_receipt_at,
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

function mapPurchaseOrder(row: PurchaseOrderRow): PurchaseOrderRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    purchaseOrderNumber: row.purchase_order_number,
    supplierId: row.supplier_id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    quantityOrdered: row.quantity_ordered,
    receivedQuantity: row.received_quantity,
    outstandingQuantity: Math.max(row.quantity_ordered - row.received_quantity, 0),
    unitCost: row.unit_cost,
    totalAmount: row.total_amount,
    status: row.status,
    expectedReceiptDate: row.expected_receipt_date,
    createdAt: row.created_at,
  };
}

function mapPurchaseOrderReceipt(row: PurchaseOrderReceiptRow): PurchaseOrderReceiptRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    purchaseOrderId: row.purchase_order_id,
    purchaseOrderNumber: row.purchase_order_number,
    productId: row.product_id,
    productSku: row.product_sku,
    productName: row.product_name,
    quantityReceived: row.quantity_received,
    unitCost: row.unit_cost,
    totalCost: row.total_cost,
    receivedAt: row.received_at,
  };
}

function mapApprovalRequest(row: ApprovalRequestRow): ApprovalRequestRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestType: row.request_type,
    referenceId: row.reference_id,
    referenceNumber: row.reference_number,
    summary: row.summary,
    reason: row.reason,
    status: row.status,
    riskLevel: row.risk_level,
    amount: row.amount,
    quantity: row.quantity,
    requestedByEmail: row.requested_by_email,
    requestedByDisplayName: row.requested_by_display_name,
    decisionByEmail: row.decision_by_email,
    decisionByDisplayName: row.decision_by_display_name,
    decisionNote: row.decision_note,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
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

function getCollectionPriority(input: {
  outstandingAmount: number;
  daysPastDue: number;
  followUpStatus: CollectionFollowUpStatus;
  promisedPaymentDate: string | null;
  nextActionDate: string | null;
  actionRequired: CollectionActionRequired;
}): CollectionPriority {
  if (input.outstandingAmount === 0) {
    return "low";
  }

  const today = new Date();
  const promisedBroken =
    input.promisedPaymentDate !== null &&
    getCalendarDayDifference(input.promisedPaymentDate, today) > 0;
  const nextActionLate =
    input.nextActionDate !== null &&
    getCalendarDayDifference(input.nextActionDate, today) > 0;

  if (
    input.followUpStatus === "escalated" ||
    input.actionRequired === "escalate_founder" ||
    input.daysPastDue > 60
  ) {
    return "critical";
  }

  if (
    promisedBroken ||
    nextActionLate ||
    input.daysPastDue > 30 ||
    input.outstandingAmount >= 100000
  ) {
    return "high";
  }

  if (
    input.daysPastDue > 0 ||
    input.actionRequired !== "monitor" ||
    input.followUpStatus === "contacted" ||
    input.followUpStatus === "promised"
  ) {
    return "medium";
  }

  return "low";
}

function mapInvoice(row: InvoiceRow): InvoiceRecord {
  const paidAmount = row.paid_amount;
  const outstandingAmount = Math.max(row.total_amount - paidAmount, 0);
  const paymentTermDays = getCalendarDayDifference(row.issued_at, row.due_date);
  const daysUntilDue = getCalendarDayDifference(new Date(), row.due_date);
  const daysPastDue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
  const collectionPriority = getCollectionPriority({
    outstandingAmount,
    daysPastDue,
    followUpStatus: row.follow_up_status,
    promisedPaymentDate: row.promised_payment_date,
    nextActionDate: row.next_action_date,
    actionRequired: row.action_required,
  });

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
    followUpStatus: row.follow_up_status,
    collectionPriority,
    actionRequired: row.action_required,
    promisedPaymentDate: row.promised_payment_date,
    nextActionDate: row.next_action_date,
    collectionNote: row.collection_note,
    lastCollectionUpdateAt: row.last_collection_update_at,
  };
}

function mapInvoiceCollectionActivity(
  row: InvoiceCollectionActivityRow,
): InvoiceCollectionActivityRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    followUpStatus: row.follow_up_status,
    collectionPriority: row.collection_priority,
    actionRequired: row.action_required,
    promisedPaymentDate: row.promised_payment_date,
    nextActionDate: row.next_action_date,
    collectionNote: row.collection_note,
    outstandingAmountSnapshot: row.outstanding_amount_snapshot,
    actionState: row.action_state,
    createdAt: row.created_at,
  };
}

function mapAccountBalance(row: AccountBalanceRow): AccountBalanceRecord {
  return {
    tenantId: row.tenant_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountType: row.account_type,
    balanceAmount: row.balance_amount,
  };
}

function mapJournalEntry(row: JournalEntryRow): JournalEntryRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    entryGroupId: row.entry_group_id,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    referenceNumber: row.reference_number,
    accountCode: row.account_code,
    accountName: row.account_name,
    debitAmount: row.debit_amount,
    creditAmount: row.credit_amount,
    description: row.description,
    createdAt: row.created_at,
  };
}

function mapAuditLog(row: AuditLogRow): AuditLogRecord {
  let metadata: AuditLogMetadata = {};

  try {
    const parsed = JSON.parse(row.metadata_json) as AuditLogMetadata;
    metadata = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    metadata = {};
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    domain: row.domain,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityNumber: row.entity_number,
    actionType: row.action_type,
    summary: row.summary,
    actorEmail: row.actor_email,
    actorDisplayName: row.actor_display_name,
    metadata,
    createdAt: row.created_at,
  };
}

function ensureDefaultAccounts(tenantId: string): void {
  for (const account of defaultAccounts) {
    createAccountStatement.run(
      tenantId,
      account.accountCode,
      account.accountName,
      account.accountType,
      account.sortOrder,
    );
  }
}

function createJournalEntryLines(input: {
  tenantId: string;
  referenceType: JournalReferenceType;
  referenceId: string;
  referenceNumber: string;
  description: string;
  createdAt: string;
  lines: Array<{
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
  }>;
}): void {
  ensureDefaultAccounts(input.tenantId);
  const accountByCode = new Map<string, (typeof defaultAccounts)[number]>(
    defaultAccounts.map((account) => [account.accountCode, account]),
  );
  const entryGroupId = randomUUID();

  for (const line of input.lines) {
    if (line.debitAmount === 0 && line.creditAmount === 0) {
      continue;
    }

    const account = accountByCode.get(line.accountCode);
    if (!account) {
      throw new Error(`Account ${line.accountCode} is not configured.`);
    }

    createJournalEntryStatement.run(
      randomUUID(),
      input.tenantId,
      entryGroupId,
      input.referenceType,
      input.referenceId,
      input.referenceNumber,
      account.accountCode,
      account.accountName,
      line.debitAmount,
      line.creditAmount,
      input.description,
      input.createdAt,
    );
  }
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

function createPurchaseOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `PO-${datePart}-${suffix}`;
}

function ensureInventoryRow(tenantId: string, productId: string): void {
  ensureInventoryRowStatement.run(productId, tenantId, timestamp());
}

function calculateAverageUnitCost(quantityOnHand: number, inventoryValue: number): number {
  if (quantityOnHand <= 0 || inventoryValue <= 0) {
    return 0;
  }

  return Math.round(inventoryValue / quantityOnHand);
}

function getPurchaseOrderStatus(
  quantityOrdered: number,
  receivedQuantity: number,
): PurchaseOrderStatus {
  if (receivedQuantity >= quantityOrdered) {
    return "received";
  }

  if (receivedQuantity > 0) {
    return "partially_received";
  }

  return "issued";
}

function persistInventorySnapshot(input: {
  productId: string;
  quantityOnHand: number;
  inventoryValue: number;
  lastReceiptAt: string | null;
  updatedAt: string;
}): void {
  updateInventorySnapshotStatement.run(
    input.quantityOnHand,
    calculateAverageUnitCost(input.quantityOnHand, input.inventoryValue),
    input.inventoryValue,
    input.lastReceiptAt,
    input.updatedAt,
    input.productId,
  );
}

function getTodayDateInput(): string {
  return timestamp().slice(0, 10);
}

function createApprovalRequestedResult<T>(
  approvalRequest: ApprovalRequestRecord,
): ApprovalAwareMutationResult<T> {
  return {
    kind: "approval_requested",
    approvalRequest,
  };
}

function createAppliedResult<T>(item: T): ApprovalAwareMutationResult<T> {
  return {
    kind: "applied",
    item,
  };
}

function createApprovalRequest(input: {
  tenantId: string;
  requestType: ApprovalRequestType;
  riskLevel: ApprovalRiskLevel;
  referenceId: string;
  referenceNumber: string;
  summary: string;
  reason: string;
  amount?: number;
  quantity?: number;
  payload: unknown;
}): ApprovalRequestRecord {
  const requestedAt = timestamp();
  const row: ApprovalRequestRow = {
    id: randomUUID(),
    tenant_id: input.tenantId,
    request_type: input.requestType,
    status: "pending",
    risk_level: input.riskLevel,
    reference_id: input.referenceId,
    reference_number: input.referenceNumber,
    summary: input.summary,
    reason: input.reason,
    amount: input.amount ?? null,
    quantity: input.quantity ?? null,
    requested_by_email: currentSession.email,
    requested_by_display_name: currentSession.displayName,
    decision_by_email: null,
    decision_by_display_name: null,
    decision_note: null,
    payload_json: JSON.stringify(input.payload),
    requested_at: requestedAt,
    decided_at: null,
  };

  createApprovalRequestStatement.run(
    row.id,
    row.tenant_id,
    row.request_type,
    row.status,
    row.risk_level,
    row.reference_id,
    row.reference_number,
    row.summary,
    row.reason,
    row.amount,
    row.quantity,
    row.requested_by_email,
    row.requested_by_display_name,
    row.decision_by_email,
    row.decision_by_display_name,
    row.decision_note,
    row.payload_json,
    row.requested_at,
    row.decided_at,
  );

  recordAuditLog({
    tenantId: input.tenantId,
    entityType: "approval",
    entityId: row.id,
    entityNumber: input.referenceNumber,
    actionType: "approval_requested",
    summary: input.summary,
    metadata: {
      amount: row.amount ?? undefined,
      quantity: row.quantity ?? undefined,
      approvalRequestType: input.requestType,
      approvalRiskLevel: input.riskLevel,
      note: input.reason,
    },
    createdAt: requestedAt,
  });

  return mapApprovalRequest(row);
}

function shouldRequirePurchaseReceiptApproval(
  purchaseOrder: PurchaseOrderRow,
  input: ReceivePurchaseOrderInput,
): { riskLevel: ApprovalRiskLevel; reason: string } | null {
  const totalCost = input.quantityReceived * purchaseOrder.unit_cost;
  if (totalCost >= 200000) {
    return {
      riskLevel: "high",
      reason: "Large inventory receipt requires founder approval.",
    };
  }

  return null;
}

function shouldRequireInvoiceIssueApproval(
  input: CreateInvoiceInput,
): { riskLevel: ApprovalRiskLevel; reason: string } | null {
  if (input.issueDate < getTodayDateInput()) {
    return {
      riskLevel: "high",
      reason: "Backdated invoice issue requires founder approval.",
    };
  }

  return null;
}

function shouldRequireInvoicePaymentApproval(
  input: CreateInvoicePaymentInput,
): { riskLevel: ApprovalRiskLevel; reason: string } | null {
  if (input.method === "cash" && input.amount >= 50000) {
    return {
      riskLevel: "high",
      reason: "Large cash receipt requires founder approval.",
    };
  }

  return null;
}

function shouldRequireInventoryAdjustmentApproval(
  input: CreateInventoryAdjustmentInput,
): { riskLevel: ApprovalRiskLevel; reason: string } | null {
  if (input.direction === "out") {
    return {
      riskLevel: "critical",
      reason: "Outbound inventory adjustments require founder approval.",
    };
  }

  return null;
}

export function getSession(): Session {
  return currentSession;
}

export function runWithSession<T>(session: Session | null, execute: () => T): T {
  if (!session) {
    throw new Error("Authentication required.");
  }

  const previousSession = currentSession;
  currentSession = session;

  try {
    return execute();
  } finally {
    currentSession = previousSession;
  }
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

  ensureDefaultAccounts(tenant.id);

  return tenant;
}

export function hasTenant(tenantId: string): boolean {
  return Boolean(hasTenantStatement.get(tenantId));
}

function normalizeCsvHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").replace(/[\s_-]+/g, "").toLowerCase();
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "\"") {
      if (insideQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsvDocument(csvText: string): { headers: string[]; rows: string[][] } {
  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV data is required.");
  }

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine).map(normalizeCsvHeader);

  return {
    headers,
    rows: dataLines.map(parseCsvLine),
  };
}

function buildHeaderIndex(headers: string[], requiredHeaders: string[]): Record<string, number> {
  const headerIndex = headers.reduce<Record<string, number>>((result, header, index) => {
    result[header] = index;
    return result;
  }, {});

  const missingHeaders = requiredHeaders.filter((header) => !(header in headerIndex));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  return headerIndex;
}

function readCsvValue(row: string[], headerIndex: Record<string, number>, header: string): string {
  return (row[headerIndex[header]] ?? "").trim();
}

function normalizeImportError(dataset: OnboardingDataset, error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unexpected import error.";
  }

  if (dataset === "suppliers" && error.message.includes("suppliers.tenant_id, suppliers.supplier_code")) {
    return "A supplier with this code already exists for the selected tenant.";
  }

  if (dataset === "products" && error.message.includes("products.tenant_id, products.sku")) {
    return "A product with this SKU already exists for the selected tenant.";
  }

  return error.message;
}

function recordImportError(errors: OnboardingImportError[], lineNumber: number, message: string): void {
  errors.push({ lineNumber, message });
}

function importCustomersCsv(tenantId: string, csvText: string): ImportOnboardingResult {
  const { headers, rows } = parseCsvDocument(csvText);
  const headerIndex = buildHeaderIndex(headers, ["name", "email"]);
  const errors: OnboardingImportError[] = [];
  let createdCount = 0;

  rows.forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const name = readCsvValue(row, headerIndex, "name");
    const email = readCsvValue(row, headerIndex, "email");
    const phone = headerIndex.phone !== undefined ? readCsvValue(row, headerIndex, "phone") : "";
    const city = headerIndex.city !== undefined ? readCsvValue(row, headerIndex, "city") : "";

    if (!name || !email) {
      recordImportError(errors, lineNumber, "Customer name and email are required.");
      return;
    }

    try {
      createCustomer({
        tenantId,
        name,
        email,
        phone,
        city,
      });
      createdCount += 1;
    } catch (error) {
      recordImportError(errors, lineNumber, normalizeImportError("customers", error));
    }
  });

  return {
    dataset: "customers",
    createdCount,
    skippedCount: errors.length,
    errors,
  };
}

function importSuppliersCsv(tenantId: string, csvText: string): ImportOnboardingResult {
  const { headers, rows } = parseCsvDocument(csvText);
  const headerIndex = buildHeaderIndex(headers, ["suppliercode", "name", "email"]);
  const errors: OnboardingImportError[] = [];
  let createdCount = 0;

  rows.forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const supplierCode = readCsvValue(row, headerIndex, "suppliercode");
    const name = readCsvValue(row, headerIndex, "name");
    const email = readCsvValue(row, headerIndex, "email");
    const phone = headerIndex.phone !== undefined ? readCsvValue(row, headerIndex, "phone") : "";
    const city = headerIndex.city !== undefined ? readCsvValue(row, headerIndex, "city") : "";
    const leadTimeRaw =
      headerIndex.leadtimedays !== undefined ? readCsvValue(row, headerIndex, "leadtimedays") : "";
    const leadTimeDays = leadTimeRaw ? Number(leadTimeRaw) : 7;

    if (!supplierCode || !name || !email) {
      recordImportError(errors, lineNumber, "Supplier code, name, and email are required.");
      return;
    }

    if (!Number.isFinite(leadTimeDays) || leadTimeDays < 0) {
      recordImportError(errors, lineNumber, "Lead time must be a non-negative number.");
      return;
    }

    try {
      createSupplier({
        tenantId,
        supplierCode,
        name,
        email,
        phone,
        city,
        leadTimeDays,
      });
      createdCount += 1;
    } catch (error) {
      recordImportError(errors, lineNumber, normalizeImportError("suppliers", error));
    }
  });

  return {
    dataset: "suppliers",
    createdCount,
    skippedCount: errors.length,
    errors,
  };
}

function importProductsCsv(tenantId: string, csvText: string): ImportOnboardingResult {
  const { headers, rows } = parseCsvDocument(csvText);
  const headerIndex = buildHeaderIndex(headers, ["sku", "name", "unitprice"]);
  const errors: OnboardingImportError[] = [];
  let createdCount = 0;

  rows.forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const sku = readCsvValue(row, headerIndex, "sku");
    const name = readCsvValue(row, headerIndex, "name");
    const unitPriceRaw = readCsvValue(row, headerIndex, "unitprice");
    const unitPrice = Number(unitPriceRaw);

    if (!sku || !name || !unitPriceRaw) {
      recordImportError(errors, lineNumber, "Product SKU, name, and unit price are required.");
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      recordImportError(errors, lineNumber, "Unit price must be a non-negative number.");
      return;
    }

    try {
      createProduct({
        tenantId,
        sku,
        name,
        unitPrice,
      });
      createdCount += 1;
    } catch (error) {
      recordImportError(errors, lineNumber, normalizeImportError("products", error));
    }
  });

  return {
    dataset: "products",
    createdCount,
    skippedCount: errors.length,
    errors,
  };
}

export function importOnboardingDataset(input: ImportOnboardingInput): ImportOnboardingResult {
  if (!input.csvText.trim()) {
    throw new Error("CSV data is required.");
  }

  switch (input.dataset) {
    case "customers":
      return importCustomersCsv(input.tenantId, input.csvText);
    case "suppliers":
      return importSuppliersCsv(input.tenantId, input.csvText);
    case "products":
      return importProductsCsv(input.tenantId, input.csvText);
    default:
      throw new Error("Unsupported onboarding dataset.");
  }
}

const restoreImmediateScopes = ["tenant", "customers", "suppliers", "products", "inventory"] as const;
const restoreDeferredScopes = ["orders", "purchaseOrders", "invoices", "collections", "approvals", "audit", "ledger"] as const;

function normalizeRestoreTarget(input: RestoreTenantSnapshotInput): {
  targetName: string;
  targetSlug: string;
  targetIndustry: string;
} {
  const targetName = input.targetTenant.name.trim();
  const targetSlug = input.targetTenant.slug.trim().toLowerCase();
  const targetIndustry = input.targetTenant.industry.trim();

  if (!targetName || !targetSlug || !targetIndustry) {
    throw new Error("Target tenant name, slug, and industry are required.");
  }

  if (
    !input.snapshot?.tenant?.name ||
    !Array.isArray(input.snapshot.customers) ||
    !Array.isArray(input.snapshot.suppliers) ||
    !Array.isArray(input.snapshot.products) ||
    !Array.isArray(input.snapshot.inventories)
  ) {
    throw new Error("Snapshot payload is invalid.");
  }

  return {
    targetName,
    targetSlug,
    targetIndustry,
  };
}

export function exportTenantSnapshot(tenantId: string): TenantExportBundle {
  const tenantRow = getTenantByIdStatement.get(tenantId) as TenantRow | undefined;
  if (!tenantRow) {
    throw new Error("The selected tenant does not exist.");
  }

  return {
    tenant: mapTenant(tenantRow),
    exportedAt: timestamp(),
    customers: listCustomers(tenantId),
    suppliers: listSuppliers(tenantId),
    products: listProducts(tenantId),
    inventories: listInventory(tenantId),
    orders: listOrders(tenantId),
    purchaseOrders: listPurchaseOrders(tenantId),
    invoices: listInvoices(tenantId),
    customerStatements: listCustomerStatements(tenantId),
    collectionActivities: listInvoiceCollectionActivities(tenantId),
    approvalRequests: listApprovalRequests(tenantId),
    auditLogs: listAuditLogs(tenantId),
    accountBalances: listAccountBalances(tenantId),
    journalEntries: listJournalEntries(tenantId),
  };
}

export function previewRestoreTenantSnapshot(input: RestoreTenantSnapshotInput): RestoreTenantSnapshotPreview {
  const { targetName, targetSlug, targetIndustry } = normalizeRestoreTarget(input);
  const conflictingTenant = getTenantBySlugStatement.get(targetSlug) as TenantRow | undefined;

  return {
    sourceTenantName: input.snapshot.tenant.name,
    sourceTenantSlug: input.snapshot.tenant.slug,
    exportedAt: input.snapshot.exportedAt,
    targetTenant: {
      name: targetName,
      slug: targetSlug,
      industry: targetIndustry,
    },
    customerCount: input.snapshot.customers.length,
    supplierCount: input.snapshot.suppliers.length,
    productCount: input.snapshot.products.length,
    inventoryLineCount: input.snapshot.inventories.length,
    orderCount: input.snapshot.orders.length,
    purchaseOrderCount: input.snapshot.purchaseOrders.length,
    invoiceCount: input.snapshot.invoices.length,
    collectionActivityCount: input.snapshot.collectionActivities.length,
    approvalCount: input.snapshot.approvalRequests.length,
    auditLogCount: input.snapshot.auditLogs.length,
    journalEntryCount: input.snapshot.journalEntries.length,
    accountBalanceCount: input.snapshot.accountBalances.length,
    restoredScopes: [...restoreImmediateScopes],
    pendingScopes: [...restoreDeferredScopes],
    slugAvailable: !conflictingTenant,
    conflictingTenantName: conflictingTenant?.name ?? null,
  };
}

export function restoreTenantSnapshot(input: RestoreTenantSnapshotInput): RestoreTenantSnapshotResult {
  const { targetName, targetSlug, targetIndustry } = normalizeRestoreTarget(input);
  const conflictingTenant = getTenantBySlugStatement.get(targetSlug) as TenantRow | undefined;

  if (conflictingTenant) {
    throw new Error("Target tenant slug already exists.");
  }

  const restoredTenant = createTenant({
    name: targetName,
    slug: targetSlug,
    industry: targetIndustry,
  });

  let restoredCustomers = 0;
  let restoredSuppliers = 0;
  let restoredProducts = 0;
  let restoredInventoryLines = 0;
  const productIdMap = new Map<string, string>();

  for (const customer of input.snapshot.customers ?? []) {
    createCustomer({
      tenantId: restoredTenant.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    });
    restoredCustomers += 1;
  }

  for (const supplier of input.snapshot.suppliers ?? []) {
    createSupplier({
      tenantId: restoredTenant.id,
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      city: supplier.city,
      leadTimeDays: supplier.leadTimeDays,
    });
    restoredSuppliers += 1;
  }

  for (const product of input.snapshot.products ?? []) {
    const restoredProduct = createProduct({
      tenantId: restoredTenant.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.unitPrice,
    });
    productIdMap.set(product.id, restoredProduct.id);
    restoredProducts += 1;
  }

  for (const inventory of input.snapshot.inventories ?? []) {
    const restoredProductId = productIdMap.get(inventory.productId);
    if (!restoredProductId) {
      continue;
    }

    const inventoryValue =
      inventory.inventoryValue > 0
        ? inventory.inventoryValue
        : inventory.quantityOnHand * inventory.averageUnitCost;

    persistInventorySnapshot({
      productId: restoredProductId,
      quantityOnHand: inventory.quantityOnHand,
      inventoryValue,
      lastReceiptAt: inventory.lastReceiptAt,
      updatedAt: inventory.updatedAt || timestamp(),
    });
    restoredInventoryLines += 1;
  }

  return {
    tenant: restoredTenant,
    restoredCustomers,
    restoredSuppliers,
    restoredProducts,
    restoredInventoryLines,
    restoredScopes: [...restoreImmediateScopes],
    pendingScopes: [...restoreDeferredScopes],
  };
}

export function listCustomers(tenantId: string): CustomerRecord[] {
  return (listCustomersStatement.all(tenantId) as CustomerRow[]).map(mapCustomer);
}

export function listSuppliers(tenantId: string): SupplierRecord[] {
  return (listSuppliersStatement.all(tenantId) as SupplierRow[]).map(mapSupplier);
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

export function updateCustomer(input: UpdateCustomerInput): CustomerRecord {
  const existing = getCustomerByIdStatement.get(input.tenantId, input.customerId) as CustomerRow | undefined;
  if (!existing) {
    throw new Error("The selected customer does not exist.");
  }

  const customer: CustomerRecord = {
    id: existing.id,
    tenantId: existing.tenant_id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    createdAt: existing.created_at,
  };

  updateCustomerStatement.run(
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.tenantId,
    customer.id,
  );

  return customer;
}

export function deleteCustomer(input: DeleteCustomerInput): CustomerRecord {
  const existing = getCustomerByIdStatement.get(input.tenantId, input.customerId) as CustomerRow | undefined;
  if (!existing) {
    throw new Error("The selected customer does not exist.");
  }

  const orderCount = Number(
    (countOrdersForCustomerStatement.get(input.tenantId, input.customerId) as { count?: number } | undefined)
      ?.count ?? 0,
  );
  const invoiceCount = Number(
    (countInvoicesForCustomerStatement.get(input.tenantId, input.customerId) as { count?: number } | undefined)
      ?.count ?? 0,
  );

  if (orderCount > 0 || invoiceCount > 0) {
    throw new Error("The selected customer cannot be deleted because orders or invoices already reference it.");
  }

  deleteCustomerStatement.run(input.tenantId, input.customerId);
  return mapCustomer(existing);
}

export function createSupplier(input: CreateSupplierInput): SupplierRecord {
  const supplier: SupplierRecord = {
    id: randomUUID(),
    tenantId: input.tenantId,
    supplierCode: input.supplierCode.trim().toUpperCase(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    leadTimeDays: input.leadTimeDays,
    createdAt: timestamp(),
  };

  createSupplierStatement.run(
    supplier.id,
    supplier.tenantId,
    supplier.supplierCode,
    supplier.name,
    supplier.email,
    supplier.phone,
    supplier.city,
    supplier.leadTimeDays,
    supplier.createdAt,
  );

  return supplier;
}

export function updateSupplier(input: UpdateSupplierInput): SupplierRecord {
  const existing = getSupplierByIdStatement.get(input.tenantId, input.supplierId) as SupplierRow | undefined;
  if (!existing) {
    throw new Error("The selected supplier does not exist.");
  }

  const supplier: SupplierRecord = {
    id: existing.id,
    tenantId: existing.tenant_id,
    supplierCode: input.supplierCode.trim().toUpperCase(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    leadTimeDays: input.leadTimeDays,
    createdAt: existing.created_at,
  };

  updateSupplierStatement.run(
    supplier.supplierCode,
    supplier.name,
    supplier.email,
    supplier.phone,
    supplier.city,
    supplier.leadTimeDays,
    supplier.tenantId,
    supplier.id,
  );

  return supplier;
}

export function deleteSupplier(input: DeleteSupplierInput): SupplierRecord {
  const existing = getSupplierByIdStatement.get(input.tenantId, input.supplierId) as SupplierRow | undefined;
  if (!existing) {
    throw new Error("The selected supplier does not exist.");
  }

  const purchaseOrderCount = Number(
    (countPurchaseOrdersForSupplierStatement.get(
      input.tenantId,
      input.supplierId,
    ) as { count?: number } | undefined)?.count ?? 0,
  );

  if (purchaseOrderCount > 0) {
    throw new Error("The selected supplier cannot be deleted because purchase orders already reference it.");
  }

  deleteSupplierStatement.run(input.tenantId, input.supplierId);
  return mapSupplier(existing);
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

export function updateProduct(input: UpdateProductInput): ProductRecord {
  const existing = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!existing) {
    throw new Error("The selected product does not exist.");
  }

  const product: ProductRecord = {
    id: existing.id,
    tenantId: existing.tenant_id,
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    unitPrice: input.unitPrice,
    status: existing.status,
    createdAt: existing.created_at,
  };

  updateProductStatement.run(
    product.sku,
    product.name,
    product.unitPrice,
    product.tenantId,
    product.id,
  );

  return product;
}

export function deleteProduct(input: DeleteProductInput): ProductRecord {
  const existing = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!existing) {
    throw new Error("The selected product does not exist.");
  }

  const orderCount = Number(
    (countOrdersForProductStatement.get(input.tenantId, input.productId) as { count?: number } | undefined)
      ?.count ?? 0,
  );
  const purchaseOrderCount = Number(
    (countPurchaseOrdersForProductStatement.get(
      input.tenantId,
      input.productId,
    ) as { count?: number } | undefined)?.count ?? 0,
  );
  const inventoryFootprint = getInventoryFootprintForProductStatement.get(
    input.tenantId,
    input.productId,
  ) as { quantity_on_hand?: number; inventory_value?: number } | undefined;

  if (
    orderCount > 0 ||
    purchaseOrderCount > 0 ||
    Number(inventoryFootprint?.quantity_on_hand ?? 0) > 0 ||
    Number(inventoryFootprint?.inventory_value ?? 0) > 0
  ) {
    throw new Error("The selected product cannot be deleted because sales, purchasing, or inventory already reference it.");
  }

  deleteProductStatement.run(input.tenantId, input.productId);
  return mapProduct(existing);
}

export function listInventory(tenantId: string): InventoryRecord[] {
  return (listInventoryStatement.all(tenantId) as InventoryRow[]).map(mapInventory);
}

function createInventoryAdjustmentInternal(input: CreateInventoryAdjustmentInput): InventoryRecord {
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
  const nextInventoryValue = currentInventory.average_unit_cost * nextQuantity;

  persistInventorySnapshot({
    productId: input.productId,
    quantityOnHand: nextQuantity,
    inventoryValue: nextInventoryValue,
    lastReceiptAt: currentInventory.last_receipt_at,
    updatedAt,
  });

  return {
    ...mapInventory(currentInventory),
    quantityOnHand: nextQuantity,
    inventoryValue: nextInventoryValue,
    averageUnitCost: calculateAverageUnitCost(nextQuantity, nextInventoryValue),
    updatedAt,
  };
}

export function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
): ApprovalAwareMutationResult<InventoryRecord> {
  const product = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!product) {
    throw new Error("The selected product does not exist.");
  }

  const approvalRule = shouldRequireInventoryAdjustmentApproval(input);
  if (approvalRule) {
    return createApprovalRequestedResult(
      createApprovalRequest({
        tenantId: input.tenantId,
        requestType: "inventory_adjustment",
        riskLevel: approvalRule.riskLevel,
        referenceId: product.id,
        referenceNumber: product.sku,
        summary: `Approval requested for stock adjustment on ${product.name}`,
        reason: approvalRule.reason,
        quantity: input.quantity,
        payload: input,
      }),
    );
  }

  return createAppliedResult(createInventoryAdjustmentInternal(input));
}

export function listOrders(tenantId: string): OrderRecord[] {
  return (listOrdersStatement.all(tenantId) as OrderRow[]).map(mapOrder);
}

export function listPurchaseOrders(tenantId: string): PurchaseOrderRecord[] {
  return (listPurchaseOrdersStatement.all(tenantId) as PurchaseOrderRow[]).map(mapPurchaseOrder);
}

export function listInvoices(tenantId: string): InvoiceRecord[] {
  return (listInvoicesStatement.all(tenantId) as InvoiceRow[]).map(mapInvoice);
}

export function listInvoiceCollectionActivities(
  tenantId: string,
): InvoiceCollectionActivityRecord[] {
  return (
    listInvoiceCollectionActivitiesStatement.all(tenantId) as InvoiceCollectionActivityRow[]
  ).map(mapInvoiceCollectionActivity);
}

export function listAccountBalances(tenantId: string): AccountBalanceRecord[] {
  ensureDefaultAccounts(tenantId);
  return (listAccountBalancesStatement.all(tenantId) as AccountBalanceRow[]).map(mapAccountBalance);
}

export function listJournalEntries(tenantId: string): JournalEntryRecord[] {
  ensureDefaultAccounts(tenantId);
  return (listJournalEntriesStatement.all(tenantId) as JournalEntryRow[]).map(mapJournalEntry);
}

export function listAuditLogs(tenantId: string): AuditLogRecord[] {
  return (listAuditLogsStatement.all(tenantId) as AuditLogRow[]).map(mapAuditLog);
}

export function listApprovalRequests(tenantId: string): ApprovalRequestRecord[] {
  return (listApprovalRequestsStatement.all(tenantId) as ApprovalRequestRow[]).map(mapApprovalRequest);
}

export function resolveApprovalRequest(input: ApprovalDecisionInput): ApprovalRequestRecord {
  const approvalRequest = getApprovalRequestByIdStatement.get(
    input.tenantId,
    input.approvalRequestId,
  ) as ApprovalRequestRow | undefined;
  if (!approvalRequest) {
    throw new Error("The selected approval request does not exist.");
  }

  if (approvalRequest.status !== "pending") {
    throw new Error("The selected approval request has already been resolved.");
  }

  const decisionNote = input.decisionNote?.trim() || null;

  if (input.decision === "approved") {
    const payload = JSON.parse(approvalRequest.payload_json) as
      | CreateInventoryAdjustmentInput
      | ReceivePurchaseOrderInput
      | CreateInvoiceInput
      | CreateInvoicePaymentInput;

    switch (approvalRequest.request_type) {
      case "inventory_adjustment":
        createInventoryAdjustmentInternal(payload as CreateInventoryAdjustmentInput);
        break;
      case "purchase_order_receipt":
        receivePurchaseOrderInternal(payload as ReceivePurchaseOrderInput);
        break;
      case "invoice_issue":
        createInvoiceInternal(payload as CreateInvoiceInput);
        break;
      case "invoice_payment":
        createInvoicePaymentInternal(payload as CreateInvoicePaymentInput);
        break;
      default:
        throw new Error("The selected approval request type is not supported.");
    }
  }

  const decidedAt = timestamp();
  resolveApprovalRequestStatement.run(
    input.decision,
    currentSession.email,
    currentSession.displayName,
    decisionNote,
    decidedAt,
    input.tenantId,
    input.approvalRequestId,
  );

  const resolved = getApprovalRequestByIdStatement.get(
    input.tenantId,
    input.approvalRequestId,
  ) as ApprovalRequestRow | undefined;
  if (!resolved) {
    throw new Error("The selected approval request does not exist.");
  }

  recordAuditLog({
    tenantId: input.tenantId,
    entityType: "approval",
    entityId: resolved.id,
    entityNumber: resolved.reference_number,
    actionType: input.decision === "approved" ? "approval_approved" : "approval_rejected",
    summary:
      input.decision === "approved"
        ? `Approved ${resolved.request_type} for ${resolved.reference_number}`
        : `Rejected ${resolved.request_type} for ${resolved.reference_number}`,
    metadata: {
      amount: resolved.amount ?? undefined,
      quantity: resolved.quantity ?? undefined,
      approvalRequestType: resolved.request_type,
      approvalRiskLevel: resolved.risk_level,
      decision: input.decision,
      decisionNote: decisionNote ?? undefined,
      note: resolved.reason,
    },
    createdAt: decidedAt,
  });

  return mapApprovalRequest(resolved);
}

function recordAuditLog(input: {
  tenantId: string;
  entityType: AuditEntityType;
  entityId: string;
  entityNumber: string;
  actionType: AuditActionType;
  summary: string;
  metadata?: AuditLogMetadata;
  createdAt: string;
}): void {
  createAuditLogStatement.run(
    randomUUID(),
    input.tenantId,
    "finance",
    input.entityType,
    input.entityId,
    input.entityNumber,
    input.actionType,
    input.summary,
    currentSession.email,
    currentSession.displayName,
    JSON.stringify(input.metadata ?? {}),
    input.createdAt,
  );
}

function recordInvoiceCollectionActivity(
  invoice: InvoiceRecord,
  createdAt: string,
  actionState: CollectionActivityState,
): void {
  createInvoiceCollectionActivityStatement.run(
    randomUUID(),
    invoice.tenantId,
    invoice.id,
    invoice.invoiceNumber,
    invoice.customerId,
    invoice.customerName,
    invoice.followUpStatus,
    invoice.collectionPriority,
    invoice.actionRequired,
    invoice.promisedPaymentDate,
    invoice.nextActionDate,
    invoice.collectionNote,
    invoice.outstandingAmount,
    actionState,
    createdAt,
  );
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
    inventoryValueAmount: inventory?.inventory_value_amount ?? 0,
    outOfStockProductCount: inventory?.out_of_stock_product_count ?? 0,
    lowStockProductCount: inventory?.low_stock_product_count ?? 0,
    topCustomerName: topCustomer?.customer_name ?? "",
    topCustomerAmount: topCustomer?.total_amount ?? 0,
    topProductName: topProduct?.product_name ?? "",
    topProductUnits: topProduct?.total_units ?? 0,
  };
}

export function getOperationsTotals(): OperationsTotals {
  const totals = getOperationsTotalsStatement.get() as OperationsTotalsRow;

  return {
    tenantCount: totals.tenant_count,
    customerCount: totals.customer_count,
    supplierCount: totals.supplier_count,
    productCount: totals.product_count,
    purchaseOrderCount: totals.purchase_order_count,
    openPurchaseOrderCount: totals.open_purchase_order_count,
    inventoryLineCount: totals.inventory_line_count,
    orderCount: totals.order_count,
    invoiceCount: totals.invoice_count,
    openInvoiceCount: totals.open_invoice_count,
    pendingApprovalCount: totals.pending_approval_count,
    overdueReceivablesAmount: totals.overdue_receivables_amount,
    todayCollectionActionCount: totals.today_collection_action_count,
  };
}

export function listOperationsTenantStatuses(): OperationsTenantStatusRecord[] {
  return (listOperationsTenantStatusStatement.all() as OperationsTenantStatusRow[]).map(
    mapOperationsTenantStatus,
  );
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
    const nextQuantityOnHand = inventory.quantity_on_hand - input.quantity;
    const inventoryIssueValue = inventory.average_unit_cost * input.quantity;
    const nextInventoryValue = Math.max(inventory.inventory_value - inventoryIssueValue, 0);

    persistInventorySnapshot({
      productId: input.productId,
      quantityOnHand: nextQuantityOnHand,
      inventoryValue: nextInventoryValue,
      lastReceiptAt: inventory.last_receipt_at,
      updatedAt: inventoryUpdatedAt,
    });

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

    createJournalEntryLines({
      tenantId: order.tenantId,
      referenceType: "order",
      referenceId: order.id,
      referenceNumber: order.orderNumber,
      description: `Issue stock for ${order.orderNumber}`,
      createdAt: order.createdAt,
      lines: [
        { accountCode: "632", debitAmount: inventoryIssueValue, creditAmount: 0 },
        { accountCode: "156", debitAmount: 0, creditAmount: inventoryIssueValue },
      ],
    });

    db.exec("COMMIT");
    return order;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput): PurchaseOrderRecord {
  const supplier = getSupplierByIdStatement.get(input.tenantId, input.supplierId) as SupplierRow | undefined;
  if (!supplier) {
    throw new Error("The selected supplier does not exist.");
  }

  const product = getProductByIdStatement.get(input.tenantId, input.productId) as ProductRow | undefined;
  if (!product) {
    throw new Error("The selected product does not exist.");
  }

  if (!isValidBusinessDateInput(input.expectedReceiptDate)) {
    throw new Error("Expected receipt date must be a valid YYYY-MM-DD value.");
  }

  const createdAt = timestamp();
  const purchaseOrder: PurchaseOrderRecord = {
    id: randomUUID(),
    tenantId: input.tenantId,
    purchaseOrderNumber: createPurchaseOrderNumber(),
    supplierId: supplier.id,
    supplierCode: supplier.supplier_code,
    supplierName: supplier.name,
    productId: product.id,
    productSku: product.sku,
    productName: product.name,
    quantityOrdered: input.quantityOrdered,
    receivedQuantity: 0,
    outstandingQuantity: input.quantityOrdered,
    unitCost: input.unitCost,
    totalAmount: input.quantityOrdered * input.unitCost,
    status: getPurchaseOrderStatus(input.quantityOrdered, 0),
    expectedReceiptDate: createBusinessTimestamp(input.expectedReceiptDate),
    createdAt,
  };

  createPurchaseOrderStatement.run(
    purchaseOrder.id,
    purchaseOrder.tenantId,
    purchaseOrder.purchaseOrderNumber,
    purchaseOrder.supplierId,
    purchaseOrder.supplierCode,
    purchaseOrder.supplierName,
    purchaseOrder.productId,
    purchaseOrder.productSku,
    purchaseOrder.productName,
    purchaseOrder.quantityOrdered,
    purchaseOrder.receivedQuantity,
    purchaseOrder.unitCost,
    purchaseOrder.totalAmount,
    purchaseOrder.status,
    purchaseOrder.expectedReceiptDate,
    purchaseOrder.createdAt,
  );

  return purchaseOrder;
}

function receivePurchaseOrderInternal(input: ReceivePurchaseOrderInput): ReceivePurchaseOrderResult {
  const purchaseOrder = getPurchaseOrderByIdStatement.get(input.tenantId, input.purchaseOrderId) as
    | PurchaseOrderRow
    | undefined;
  if (!purchaseOrder) {
    throw new Error("The selected purchase order does not exist.");
  }

  if (!Number.isInteger(input.quantityReceived) || input.quantityReceived <= 0) {
    throw new Error("Received quantity must be a positive integer.");
  }

  if (!isValidBusinessDateInput(input.receivedDate)) {
    throw new Error("Received date must be a valid YYYY-MM-DD value.");
  }

  const outstandingQuantity = Math.max(purchaseOrder.quantity_ordered - purchaseOrder.received_quantity, 0);

  if (outstandingQuantity === 0) {
    throw new Error("The selected purchase order is already fully received.");
  }

  if (input.quantityReceived > outstandingQuantity) {
    throw new Error("Received quantity cannot exceed the outstanding quantity.");
  }

  ensureInventoryRow(input.tenantId, purchaseOrder.product_id);

  const inventory = getInventoryRowStatement.get(input.tenantId, purchaseOrder.product_id) as
    | InventoryRow
    | undefined;
  if (!inventory) {
    throw new Error("The selected product does not exist.");
  }

  const receiptRow: PurchaseOrderReceiptRow = {
    id: randomUUID(),
    tenant_id: input.tenantId,
    purchase_order_id: purchaseOrder.id,
    purchase_order_number: purchaseOrder.purchase_order_number,
    product_id: purchaseOrder.product_id,
    product_sku: purchaseOrder.product_sku,
    product_name: purchaseOrder.product_name,
    quantity_received: input.quantityReceived,
    unit_cost: purchaseOrder.unit_cost,
    total_cost: input.quantityReceived * purchaseOrder.unit_cost,
    received_at: createBusinessTimestamp(input.receivedDate),
  };

  const nextReceivedQuantity = purchaseOrder.received_quantity + input.quantityReceived;
  const nextStatus = getPurchaseOrderStatus(purchaseOrder.quantity_ordered, nextReceivedQuantity);
  const nextInventoryQuantity = inventory.quantity_on_hand + input.quantityReceived;
  const nextInventoryValue = inventory.inventory_value + receiptRow.total_cost;

  db.exec("BEGIN");

  try {
    createPurchaseOrderReceiptStatement.run(
      receiptRow.id,
      receiptRow.tenant_id,
      receiptRow.purchase_order_id,
      receiptRow.purchase_order_number,
      receiptRow.product_id,
      receiptRow.product_sku,
      receiptRow.product_name,
      receiptRow.quantity_received,
      receiptRow.unit_cost,
      receiptRow.total_cost,
      receiptRow.received_at,
    );

    updatePurchaseOrderReceivingStatement.run(nextReceivedQuantity, nextStatus, purchaseOrder.id);

    persistInventorySnapshot({
      productId: purchaseOrder.product_id,
      quantityOnHand: nextInventoryQuantity,
      inventoryValue: nextInventoryValue,
      lastReceiptAt: receiptRow.received_at,
      updatedAt: receiptRow.received_at,
    });

    createJournalEntryLines({
      tenantId: input.tenantId,
      referenceType: "purchase_receipt",
      referenceId: purchaseOrder.id,
      referenceNumber: purchaseOrder.purchase_order_number,
      description: `Receive purchase order ${purchaseOrder.purchase_order_number}`,
      createdAt: receiptRow.received_at,
      lines: [
        { accountCode: "156", debitAmount: receiptRow.total_cost, creditAmount: 0 },
        { accountCode: "331", debitAmount: 0, creditAmount: receiptRow.total_cost },
      ],
    });

    recordAuditLog({
      tenantId: input.tenantId,
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      entityNumber: purchaseOrder.purchase_order_number,
      actionType: "purchase_order_received",
      summary: `Received ${input.quantityReceived} units for ${purchaseOrder.purchase_order_number}`,
      metadata: {
        amount: receiptRow.total_cost,
        quantity: input.quantityReceived,
        unitCost: purchaseOrder.unit_cost,
        note: `${purchaseOrder.product_name} from ${purchaseOrder.supplier_name}`,
      },
      createdAt: receiptRow.received_at,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    purchaseOrder: {
      ...mapPurchaseOrder(purchaseOrder),
      receivedQuantity: nextReceivedQuantity,
      outstandingQuantity: Math.max(purchaseOrder.quantity_ordered - nextReceivedQuantity, 0),
      status: nextStatus,
    },
    inventory: {
      ...mapInventory(inventory),
      quantityOnHand: nextInventoryQuantity,
      averageUnitCost: calculateAverageUnitCost(nextInventoryQuantity, nextInventoryValue),
      inventoryValue: nextInventoryValue,
      lastReceiptAt: receiptRow.received_at,
      updatedAt: receiptRow.received_at,
    },
    receipt: mapPurchaseOrderReceipt(receiptRow),
  };
}

export function receivePurchaseOrder(
  input: ReceivePurchaseOrderInput,
): ApprovalAwareMutationResult<ReceivePurchaseOrderResult> {
  const purchaseOrder = getPurchaseOrderByIdStatement.get(input.tenantId, input.purchaseOrderId) as
    | PurchaseOrderRow
    | undefined;
  if (!purchaseOrder) {
    throw new Error("The selected purchase order does not exist.");
  }

  if (!Number.isInteger(input.quantityReceived) || input.quantityReceived <= 0) {
    throw new Error("Received quantity must be a positive integer.");
  }

  if (!isValidBusinessDateInput(input.receivedDate)) {
    throw new Error("Received date must be a valid YYYY-MM-DD value.");
  }

  const outstandingQuantity = Math.max(purchaseOrder.quantity_ordered - purchaseOrder.received_quantity, 0);

  if (outstandingQuantity === 0) {
    throw new Error("The selected purchase order is already fully received.");
  }

  if (input.quantityReceived > outstandingQuantity) {
    throw new Error("Received quantity cannot exceed the outstanding quantity.");
  }

  const approvalRule = shouldRequirePurchaseReceiptApproval(purchaseOrder, input);
  if (approvalRule) {
    return createApprovalRequestedResult(
      createApprovalRequest({
        tenantId: input.tenantId,
        requestType: "purchase_order_receipt",
        riskLevel: approvalRule.riskLevel,
        referenceId: purchaseOrder.id,
        referenceNumber: purchaseOrder.purchase_order_number,
        summary: `Approval requested for receipt on ${purchaseOrder.purchase_order_number}`,
        reason: approvalRule.reason,
        amount: input.quantityReceived * purchaseOrder.unit_cost,
        quantity: input.quantityReceived,
        payload: input,
      }),
    );
  }

  return createAppliedResult(receivePurchaseOrderInternal(input));
}

function createInvoiceInternal(input: CreateInvoiceInput): InvoiceRecord {
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
  const daysUntilDue = getCalendarDayDifference(new Date(), dueDate);
  const outstandingAmount = subtotalAmount + taxAmount;

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
    totalAmount: outstandingAmount,
    paidAmount: 0,
    outstandingAmount,
    paymentCount: 0,
    lastPaymentAt: null,
    status: "issued",
    issuedAt,
    dueDate,
    paymentTermDays: input.paymentTermDays,
    daysUntilDue,
    daysPastDue: Math.max(getCalendarDayDifference(dueDate, new Date()), 0),
    collectionStatus: getCollectionStatus(outstandingAmount, daysUntilDue),
    followUpStatus: "new",
    collectionPriority: "low",
    actionRequired: "monitor",
    promisedPaymentDate: null,
    nextActionDate: null,
    collectionNote: "",
    lastCollectionUpdateAt: null,
  };

  db.exec("BEGIN");

  try {
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
      invoice.followUpStatus,
      invoice.actionRequired,
      invoice.promisedPaymentDate,
      invoice.nextActionDate,
      invoice.collectionNote,
      invoice.lastCollectionUpdateAt,
    );

    createJournalEntryLines({
      tenantId: invoice.tenantId,
      referenceType: "invoice",
      referenceId: invoice.id,
      referenceNumber: invoice.invoiceNumber,
      description: `Issue invoice ${invoice.invoiceNumber}`,
      createdAt: invoice.issuedAt,
      lines: [
        { accountCode: "131", debitAmount: invoice.totalAmount, creditAmount: 0 },
        { accountCode: "511", debitAmount: 0, creditAmount: invoice.subtotalAmount },
        { accountCode: "3331", debitAmount: 0, creditAmount: invoice.taxAmount },
      ],
    });

    recordAuditLog({
      tenantId: invoice.tenantId,
      entityType: "invoice",
      entityId: invoice.id,
      entityNumber: invoice.invoiceNumber,
      actionType: "invoice_issued",
      summary: `Issued ${invoice.invoiceNumber} for ${invoice.customerName}`,
      metadata: {
        amount: invoice.totalAmount,
        outstandingAmount: invoice.outstandingAmount,
        note: `Due ${invoice.dueDate}`,
      },
      createdAt: invoice.issuedAt,
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return invoice;
}

export function createInvoice(
  input: CreateInvoiceInput,
): ApprovalAwareMutationResult<InvoiceRecord> {
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

  const approvalRule = shouldRequireInvoiceIssueApproval(input);
  if (approvalRule) {
    return createApprovalRequestedResult(
      createApprovalRequest({
        tenantId: input.tenantId,
        requestType: "invoice_issue",
        riskLevel: approvalRule.riskLevel,
        referenceId: order.id,
        referenceNumber: order.order_number,
        summary: `Approval requested to issue invoice for ${order.order_number}`,
        reason: approvalRule.reason,
        amount: order.total_amount,
        quantity: order.quantity,
        payload: input,
      }),
    );
  }

  return createAppliedResult(createInvoiceInternal(input));
}

function createInvoicePaymentInternal(input: CreateInvoicePaymentInput): InvoiceRecord {
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

  const paidAt = timestamp();

  db.exec("BEGIN");

  try {
    createInvoicePaymentStatement.run(
      randomUUID(),
      input.tenantId,
      invoice.id,
      invoice.invoice_number,
      input.amount,
      input.method,
      paidAt,
    );

    createJournalEntryLines({
      tenantId: input.tenantId,
      referenceType: "payment",
      referenceId: invoice.id,
      referenceNumber: invoice.invoice_number,
      description: `Receive payment for ${invoice.invoice_number}`,
      createdAt: paidAt,
      lines: [
        {
          accountCode: input.method === "cash" ? "111" : "112",
          debitAmount: input.amount,
          creditAmount: 0,
        },
        { accountCode: "131", debitAmount: 0, creditAmount: input.amount },
      ],
    });

    const updatedInvoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as InvoiceRow | undefined;
    if (!updatedInvoice) {
      throw new Error("The selected invoice does not exist.");
    }

    const mappedInvoice = mapInvoice(updatedInvoice);

    recordAuditLog({
      tenantId: input.tenantId,
      entityType: "payment",
      entityId: invoice.id,
      entityNumber: invoice.invoice_number,
      actionType: "payment_recorded",
      summary: `Recorded ${input.method} payment for ${invoice.invoice_number}`,
      metadata: {
        amount: input.amount,
        paymentMethod: input.method,
        outstandingAmount: mappedInvoice.outstandingAmount,
      },
      createdAt: paidAt,
    });

    db.exec("COMMIT");
    return mappedInvoice;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createInvoicePayment(
  input: CreateInvoicePaymentInput,
): ApprovalAwareMutationResult<InvoiceRecord> {
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

  const approvalRule = shouldRequireInvoicePaymentApproval(input);
  if (approvalRule) {
    return createApprovalRequestedResult(
      createApprovalRequest({
        tenantId: input.tenantId,
        requestType: "invoice_payment",
        riskLevel: approvalRule.riskLevel,
        referenceId: invoice.id,
        referenceNumber: invoice.invoice_number,
        summary: `Approval requested to record payment for ${invoice.invoice_number}`,
        reason: approvalRule.reason,
        amount: input.amount,
        payload: input,
      }),
    );
  }

  return createAppliedResult(createInvoicePaymentInternal(input));
}

export function updateInvoiceCollection(input: UpdateInvoiceCollectionInput): InvoiceRecord {
  if (!isValidFollowUpStatus(input.followUpStatus)) {
    throw new Error("Follow-up status is invalid.");
  }

  if (!isValidActionRequired(input.actionRequired)) {
    throw new Error("Collection action is invalid.");
  }

  const promisedPaymentDate =
    input.promisedPaymentDate && input.promisedPaymentDate.trim().length > 0
      ? input.promisedPaymentDate.trim()
      : null;
  const nextActionDate =
    input.nextActionDate && input.nextActionDate.trim().length > 0
      ? input.nextActionDate.trim()
      : null;

  if (promisedPaymentDate && !isValidBusinessDateInput(promisedPaymentDate)) {
    throw new Error("Promised payment date must be a valid YYYY-MM-DD value.");
  }

  if (nextActionDate && !isValidBusinessDateInput(nextActionDate)) {
    throw new Error("Next action date must be a valid YYYY-MM-DD value.");
  }

  if (input.followUpStatus === "promised" && !promisedPaymentDate) {
    throw new Error("Promised payment date is required when status is promised.");
  }

  if (input.actionRequired !== "monitor" && !nextActionDate) {
    throw new Error("Next action date is required when an action is assigned.");
  }

  const collectionNote = input.collectionNote.trim();
  if (collectionNote.length > 240) {
    throw new Error("Collection note must be 240 characters or fewer.");
  }

  const invoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as InvoiceRow | undefined;
  if (!invoice) {
    throw new Error("The selected invoice does not exist.");
  }

  const updateTimestamp = timestamp();

  db.exec("BEGIN");

  try {
    updateInvoiceCollectionStatement.run(
      input.followUpStatus,
      input.actionRequired,
      promisedPaymentDate,
      nextActionDate,
      collectionNote,
      updateTimestamp,
      input.tenantId,
      input.invoiceId,
    );

    const updatedInvoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as
      | InvoiceRow
      | undefined;
    if (!updatedInvoice) {
      throw new Error("The selected invoice does not exist.");
    }

    const mappedInvoice = mapInvoice(updatedInvoice);
    recordInvoiceCollectionActivity(mappedInvoice, updateTimestamp, "assigned");
    recordAuditLog({
      tenantId: input.tenantId,
      entityType: "collection",
      entityId: mappedInvoice.id,
      entityNumber: mappedInvoice.invoiceNumber,
      actionType: "collection_follow_up_updated",
      summary: `Updated collection follow-up for ${mappedInvoice.invoiceNumber}`,
      metadata: {
        outstandingAmount: mappedInvoice.outstandingAmount,
        followUpStatus: mappedInvoice.followUpStatus,
        actionRequired: mappedInvoice.actionRequired,
        promisedPaymentDate: mappedInvoice.promisedPaymentDate,
        nextActionDate: mappedInvoice.nextActionDate,
        note: mappedInvoice.collectionNote,
      },
      createdAt: updateTimestamp,
    });

    db.exec("COMMIT");
    return mappedInvoice;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function resolveInvoiceCollectionAction(
  input: ResolveInvoiceCollectionActionInput,
): InvoiceRecord {
  const invoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as InvoiceRow | undefined;
  if (!invoice) {
    throw new Error("The selected invoice does not exist.");
  }

  if (invoice.action_required === "monitor" && !invoice.next_action_date) {
    throw new Error("There is no assigned collection action to resolve.");
  }

  const updateTimestamp = timestamp();

  db.exec("BEGIN");

  try {
    updateInvoiceCollectionStatement.run(
      invoice.follow_up_status,
      "monitor",
      invoice.promised_payment_date,
      null,
      invoice.collection_note,
      updateTimestamp,
      input.tenantId,
      input.invoiceId,
    );

    const updatedInvoice = getInvoiceByIdStatement.get(input.tenantId, input.invoiceId) as
      | InvoiceRow
      | undefined;
    if (!updatedInvoice) {
      throw new Error("The selected invoice does not exist.");
    }

    const mappedInvoice = mapInvoice(updatedInvoice);
    recordInvoiceCollectionActivity(mappedInvoice, updateTimestamp, "resolved");
    recordAuditLog({
      tenantId: input.tenantId,
      entityType: "collection",
      entityId: mappedInvoice.id,
      entityNumber: mappedInvoice.invoiceNumber,
      actionType: "collection_action_resolved",
      summary: `Resolved collection action for ${mappedInvoice.invoiceNumber}`,
      metadata: {
        outstandingAmount: mappedInvoice.outstandingAmount,
        followUpStatus: mappedInvoice.followUpStatus,
        actionRequired: mappedInvoice.actionRequired,
        promisedPaymentDate: mappedInvoice.promisedPaymentDate,
        nextActionDate: mappedInvoice.nextActionDate,
        note: mappedInvoice.collectionNote,
      },
      createdAt: updateTimestamp,
    });

    db.exec("COMMIT");
    return mappedInvoice;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
