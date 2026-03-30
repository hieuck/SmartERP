import type {
  CreateCustomerInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  CreateInventoryAdjustmentInput,
  CreateOrderInput,
  CreateProductInput,
  CreateTenantInput,
  CustomerStatementRecord,
  CustomerRecord,
  FoundationSnapshot,
  InvoiceRecord,
  InventoryRecord,
  LoginInput,
  LoginResult,
  OrderRecord,
  ProductRecord,
  ReportSummary,
  Session,
  TenantRecord,
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

export async function listInventory(tenantId: string): Promise<InventoryRecord[]> {
  const payload = await request<{ items: InventoryRecord[] }>(
    `/api/inventory?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
): Promise<InventoryRecord> {
  const payload = await request<{ item: InventoryRecord }>("/api/inventory/adjustments", {
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

export async function listInvoices(tenantId: string): Promise<InvoiceRecord[]> {
  const payload = await request<{ items: InvoiceRecord[] }>(
    `/api/invoices?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.items;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
  const payload = await request<{ item: InvoiceRecord }>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function createInvoicePayment(input: CreateInvoicePaymentInput): Promise<InvoiceRecord> {
  const payload = await request<{ item: InvoiceRecord }>("/api/invoices/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.item;
}

export async function getReportSummary(tenantId: string): Promise<ReportSummary> {
  const payload = await request<{ item: ReportSummary }>(
    `/api/reports/summary?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return payload.item;
}
