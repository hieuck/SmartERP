import type {
  ApprovalAwareMutationResult,
  ApprovalDecisionInput,
  ApprovalRequestRecord,
  AuditLogRecord,
  AccountBalanceRecord,
  CancelOrderInput,
  CancelPurchaseOrderInput,
  CloseOrderInput,
  ClosePurchaseOrderInput,
  ReopenOrderInput,
  ReopenPurchaseOrderInput,
  CreateCustomerInput,
  CreateInvoiceInput,
  UpdateInvoiceCollectionInput,
  ResolveInvoiceCollectionActionInput,
  CreateInvoicePaymentInput,
  VoidInvoiceInput,
  CreateInventoryAdjustmentInput,
  CreateOrderInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderResult,
  CreateProductInput,
  DeleteCustomerInput,
  DeleteProductInput,
  DeleteSupplierInput,
  CreateSupplierInput,
  CreateTenantInput,
  ImportOnboardingInput,
  ImportOnboardingResult,
  InvoiceCollectionActivityRecord,
  CustomerStatementRecord,
  CustomerRecord,
  FoundationSnapshot,
  InvoiceRecord,
  InventoryRecord,
  JournalEntryRecord,
  LoginInput,
  LoginResult,
  OperationsStatusPayload,
  OrderRecord,
  PurchaseOrderRecord,
  ProductRecord,
  ReportSummary,
  Session,
  SupplierRecord,
  TenantRecord,
  TenantExportBundle,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  UpdateCustomerInput,
  UpdateOrderInput,
  UpdatePurchaseOrderInput,
  UpdateProductInput,
  UpdateSupplierInput,
} from "@smarterp/contracts";

type RequestOptions = {
  skipUnauthorizedHandler?: boolean;
};

let currentAccessToken = "";
let unauthorizedHandler: ((message: string) => void) | null = null;

async function request<T>(input: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");

  if (currentAccessToken) {
    headers.set("authorization", `Bearer ${currentAccessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => ({ error: "Unknown error." }))) as { error?: string };

  if (!response.ok) {
    if (response.status === 401 && !options?.skipUnauthorizedHandler) {
      unauthorizedHandler?.(payload.error ?? "Authentication required.");
    }

    throw new Error(payload.error ?? "Request failed.");
  }

  return payload as T;
}

export function setApiSession(session: Session | null): void {
  currentAccessToken = session?.accessToken ?? "";
}

export function setUnauthorizedHandler(handler: ((message: string) => void) | null): void {
  unauthorizedHandler = handler;
}

export function getFoundation(): Promise<FoundationSnapshot> {
  return request<FoundationSnapshot>("/api/foundation");
}

export async function getOperationsStatus(): Promise<OperationsStatusPayload> {
  const payload = await request<{ item: OperationsStatusPayload }>("/api/operations/status");
  return payload.item;
}

export function login(input: LoginInput): Promise<LoginResult> {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  }, { skipUnauthorizedHandler: true });
}

export async function listTenants(): Promise<TenantRecord[]> {
  const payload = await request<{ items: TenantRecord[] }>("/api/tenants");
  return payload.items;
}

export async function createTenant(input: CreateTenantInput): Promise<TenantRecord> {
  const payload = await request<{ item: TenantRecord }>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function importOnboardingDataset(input: ImportOnboardingInput): Promise<ImportOnboardingResult> {
  const payload = await request<{ item: ImportOnboardingResult }>("/api/onboarding/import", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function exportTenantSnapshot(tenantId: string): Promise<TenantExportBundle> {
  const payload = await request<{ item: TenantExportBundle }>(
    `/api/onboarding/export?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.item;
}

export async function previewRestoreTenantSnapshot(
  input: RestoreTenantSnapshotInput,
): Promise<RestoreTenantSnapshotPreview> {
  const payload = await request<{ item: RestoreTenantSnapshotPreview }>("/api/onboarding/restore/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function restoreTenantSnapshot(input: RestoreTenantSnapshotInput): Promise<RestoreTenantSnapshotResult> {
  const payload = await request<{ item: RestoreTenantSnapshotResult }>("/api/onboarding/restore", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listCustomers(tenantId: string): Promise<CustomerRecord[]> {
  const payload = await request<{ items: CustomerRecord[] }>(
    `/api/customers?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerRecord> {
  const payload = await request<{ item: CustomerRecord }>("/api/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<CustomerRecord> {
  const payload = await request<{ item: CustomerRecord }>("/api/customers/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function deleteCustomer(input: DeleteCustomerInput): Promise<CustomerRecord> {
  const payload = await request<{ item: CustomerRecord }>("/api/customers/delete", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listSuppliers(tenantId: string): Promise<SupplierRecord[]> {
  const payload = await request<{ items: SupplierRecord[] }>(
    `/api/suppliers?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierRecord> {
  const payload = await request<{ item: SupplierRecord }>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updateSupplier(input: UpdateSupplierInput): Promise<SupplierRecord> {
  const payload = await request<{ item: SupplierRecord }>("/api/suppliers/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function deleteSupplier(input: DeleteSupplierInput): Promise<SupplierRecord> {
  const payload = await request<{ item: SupplierRecord }>("/api/suppliers/delete", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listCustomerStatements(tenantId: string): Promise<CustomerStatementRecord[]> {
  const payload = await request<{ items: CustomerStatementRecord[] }>(
    `/api/customers/statements?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function listProducts(tenantId: string): Promise<ProductRecord[]> {
  const payload = await request<{ items: ProductRecord[] }>(
    `/api/products?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createProduct(input: CreateProductInput): Promise<ProductRecord> {
  const payload = await request<{ item: ProductRecord }>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updateProduct(input: UpdateProductInput): Promise<ProductRecord> {
  const payload = await request<{ item: ProductRecord }>("/api/products/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function deleteProduct(input: DeleteProductInput): Promise<ProductRecord> {
  const payload = await request<{ item: ProductRecord }>("/api/products/delete", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listInventory(tenantId: string): Promise<InventoryRecord[]> {
  const payload = await request<{ items: InventoryRecord[] }>(
    `/api/inventory?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
): Promise<ApprovalAwareMutationResult<InventoryRecord>> {
  const payload = await request<{ item: ApprovalAwareMutationResult<InventoryRecord> }>("/api/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listOrders(tenantId: string): Promise<OrderRecord[]> {
  const payload = await request<{ items: OrderRecord[] }>(
    `/api/orders?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const payload = await request<{ item: OrderRecord }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updateOrder(input: UpdateOrderInput): Promise<OrderRecord> {
  const payload = await request<{ item: OrderRecord }>("/api/orders/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function cancelOrder(input: CancelOrderInput): Promise<OrderRecord> {
  const payload = await request<{ item: OrderRecord }>("/api/orders/cancel", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function closeOrder(input: CloseOrderInput): Promise<OrderRecord> {
  const payload = await request<{ item: OrderRecord }>("/api/orders/close", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function reopenOrder(input: ReopenOrderInput): Promise<OrderRecord> {
  const payload = await request<{ item: OrderRecord }>("/api/orders/reopen", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listPurchaseOrders(tenantId: string): Promise<PurchaseOrderRecord[]> {
  const payload = await request<{ items: PurchaseOrderRecord[] }>(
    `/api/purchase-orders?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
  const payload = await request<{ item: PurchaseOrderRecord }>("/api/purchase-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updatePurchaseOrder(input: UpdatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
  const payload = await request<{ item: PurchaseOrderRecord }>("/api/purchase-orders/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function cancelPurchaseOrder(input: CancelPurchaseOrderInput): Promise<PurchaseOrderRecord> {
  const payload = await request<{ item: PurchaseOrderRecord }>("/api/purchase-orders/cancel", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function closePurchaseOrder(input: ClosePurchaseOrderInput): Promise<PurchaseOrderRecord> {
  const payload = await request<{ item: PurchaseOrderRecord }>("/api/purchase-orders/close", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function reopenPurchaseOrder(input: ReopenPurchaseOrderInput): Promise<PurchaseOrderRecord> {
  const payload = await request<{ item: PurchaseOrderRecord }>("/api/purchase-orders/reopen", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function receivePurchaseOrder(
  input: ReceivePurchaseOrderInput,
): Promise<ApprovalAwareMutationResult<ReceivePurchaseOrderResult>> {
  const payload = await request<{ item: ApprovalAwareMutationResult<ReceivePurchaseOrderResult> }>("/api/purchase-orders/receipts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listInvoices(tenantId: string): Promise<InvoiceRecord[]> {
  const payload = await request<{ items: InvoiceRecord[] }>(
    `/api/invoices?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  const payload = await request<{ item: ApprovalAwareMutationResult<InvoiceRecord> }>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function createInvoicePayment(
  input: CreateInvoicePaymentInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  const payload = await request<{ item: ApprovalAwareMutationResult<InvoiceRecord> }>("/api/invoices/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function voidInvoice(input: VoidInvoiceInput): Promise<InvoiceRecord> {
  const payload = await request<{ item: InvoiceRecord }>("/api/invoices/void", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function updateInvoiceCollection(input: UpdateInvoiceCollectionInput): Promise<InvoiceRecord> {
  const payload = await request<{ item: InvoiceRecord }>("/api/invoices/collections", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function resolveInvoiceCollectionAction(
  input: ResolveInvoiceCollectionActionInput,
): Promise<InvoiceRecord> {
  const payload = await request<{ item: InvoiceRecord }>("/api/invoices/collections/resolve", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function listInvoiceCollectionActivities(
  tenantId: string,
): Promise<InvoiceCollectionActivityRecord[]> {
  const payload = await request<{ items: InvoiceCollectionActivityRecord[] }>(
    `/api/invoices/collection-activities?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function getReportSummary(tenantId: string): Promise<ReportSummary> {
  const payload = await request<{ item: ReportSummary }>(
    `/api/reports/summary?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.item;
}

export async function listAccountBalances(tenantId: string): Promise<AccountBalanceRecord[]> {
  const payload = await request<{ items: AccountBalanceRecord[] }>(
    `/api/accounts/balances?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function listJournalEntries(tenantId: string): Promise<JournalEntryRecord[]> {
  const payload = await request<{ items: JournalEntryRecord[] }>(
    `/api/journal-entries?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function listAuditLogs(tenantId: string): Promise<AuditLogRecord[]> {
  const payload = await request<{ items: AuditLogRecord[] }>(
    `/api/audit-logs?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function listApprovalRequests(tenantId: string): Promise<ApprovalRequestRecord[]> {
  const payload = await request<{ items: ApprovalRequestRecord[] }>(
    `/api/approval-requests?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function decideApprovalRequest(input: ApprovalDecisionInput): Promise<ApprovalRequestRecord> {
  const payload = await request<{ item: ApprovalRequestRecord }>("/api/approval-requests/decision", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}
