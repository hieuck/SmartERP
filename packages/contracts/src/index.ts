export const foundationModules = [
  "identity",
  "tenant",
  "customers",
  "suppliers",
  "products",
  "purchasing",
  "orders",
  "inventory",
  "invoices",
  "reporting",
  "approvals",
  "operations",
] as const;

export const userRoles = [
  "founder",
  "finance",
  "sales",
  "warehouse",
  "purchasing",
  "collector",
] as const;

export const permissionKeys = [
  "manage_tenants",
  "manage_customers",
  "manage_suppliers",
  "manage_products",
  "manage_purchase_orders",
  "receive_purchase_orders",
  "manage_inventory",
  "manage_orders",
  "issue_invoices",
  "record_invoice_payments",
  "manage_collections",
  "view_reports",
  "decide_approvals",
  "view_operations",
] as const;

export const onboardingDatasets = [
  "customers",
  "suppliers",
  "products",
] as const;

export const onboardingCsvTemplates: Record<OnboardingDataset, string> = {
  customers: "name,email,phone,city\nTran Minh Trading,buyer@tranminh.vn,+84 90 123 4567,Ho Chi Minh City",
  suppliers: "supplierCode,name,email,phone,city,leadTimeDays\nSUP-ALPHA,Alpha Packaging,ops@alphapack.example,+84 28 5555 0000,Binh Duong,7",
  products: "sku,name,unitPrice\nNW-PET-001,PET Bottle 1L,25000",
};

export const rewriteMessage =
  "New development now targets a clean workspace with explicit contracts, shared UI primitives, and capability-by-capability migration from the legacy tree.";

export type FoundationModule = (typeof foundationModules)[number];
export type UserRole = (typeof userRoles)[number];
export type Permission = (typeof permissionKeys)[number];
export type OnboardingDataset = (typeof onboardingDatasets)[number];

export type DemoAccount = {
  userId: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  accessToken: string;
};

const roleModules: Record<UserRole, readonly FoundationModule[]> = {
  founder: [...foundationModules],
  finance: ["identity", "invoices", "reporting"],
  sales: ["identity", "customers", "products", "orders"],
  warehouse: ["identity", "products", "purchasing", "inventory"],
  purchasing: ["identity", "suppliers", "products", "purchasing"],
  collector: ["identity", "invoices", "reporting"],
};

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  founder: [...permissionKeys],
  finance: ["issue_invoices", "record_invoice_payments", "view_reports"],
  sales: ["manage_customers", "manage_products", "manage_orders"],
  warehouse: ["manage_products", "receive_purchase_orders", "manage_inventory"],
  purchasing: ["manage_suppliers", "manage_products", "manage_purchase_orders"],
  collector: ["manage_collections", "view_reports"],
};

export const demoAccounts: readonly DemoAccount[] = [
  {
    userId: "founder-1",
    email: "founder@smarterp.vn",
    password: "smarterp-next",
    displayName: "SmartERP Founder",
    role: "founder",
    accessToken: "smarterp-next-founder-token",
  },
  {
    userId: "finance-1",
    email: "finance@smarterp.vn",
    password: "smarterp-next",
    displayName: "Finance Controller",
    role: "finance",
    accessToken: "smarterp-next-finance-token",
  },
  {
    userId: "sales-1",
    email: "sales@smarterp.vn",
    password: "smarterp-next",
    displayName: "Sales Lead",
    role: "sales",
    accessToken: "smarterp-next-sales-token",
  },
  {
    userId: "warehouse-1",
    email: "warehouse@smarterp.vn",
    password: "smarterp-next",
    displayName: "Warehouse Supervisor",
    role: "warehouse",
    accessToken: "smarterp-next-warehouse-token",
  },
  {
    userId: "purchasing-1",
    email: "purchasing@smarterp.vn",
    password: "smarterp-next",
    displayName: "Purchasing Officer",
    role: "purchasing",
    accessToken: "smarterp-next-purchasing-token",
  },
  {
    userId: "collector-1",
    email: "collector@smarterp.vn",
    password: "smarterp-next",
    displayName: "Collection Specialist",
    role: "collector",
    accessToken: "smarterp-next-collector-token",
  },
] as const;

export const demoCredentials = {
  email: demoAccounts[0].email,
  password: demoAccounts[0].password,
} as const;

export const demoAccessToken = demoAccounts[0].accessToken;

export function describeApiFoundation(): string {
  return "Modular API foundation active";
}

export type Session = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessToken: string;
  modules: readonly FoundationModule[];
  permissions: readonly Permission[];
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  session: Session;
};

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  createdAt: string;
};

export type CreateTenantInput = {
  name: string;
  slug: string;
  industry: string;
};

export type ImportOnboardingInput = {
  tenantId: string;
  dataset: OnboardingDataset;
  csvText: string;
};

export type OnboardingImportError = {
  lineNumber: number;
  message: string;
};

export type ImportOnboardingResult = {
  dataset: OnboardingDataset;
  createdCount: number;
  skippedCount: number;
  errors: OnboardingImportError[];
};

export type RestoreTenantSnapshotInput = {
  snapshot: TenantExportBundle;
  targetTenant: {
    name: string;
    slug: string;
    industry: string;
  };
};

export type RestoreTenantSnapshotPreview = {
  sourceTenantName: string;
  sourceTenantSlug: string;
  exportedAt: string;
  targetTenant: {
    name: string;
    slug: string;
    industry: string;
  };
  customerCount: number;
  supplierCount: number;
  productCount: number;
  inventoryLineCount: number;
  orderCount: number;
  purchaseOrderCount: number;
  invoiceCount: number;
  collectionActivityCount: number;
  approvalCount: number;
  auditLogCount: number;
  journalEntryCount: number;
  accountBalanceCount: number;
  restoredScopes: string[];
  pendingScopes: string[];
  slugAvailable: boolean;
  conflictingTenantName: string | null;
};

export type RestoreTenantSnapshotResult = {
  tenant: TenantRecord;
  restoredCustomers: number;
  restoredSuppliers: number;
  restoredProducts: number;
  restoredInventoryLines: number;
  restoredScopes: string[];
  pendingScopes: string[];
};

export type CustomerRecord = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
};

export type CreateCustomerInput = {
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
};

export type SupplierRecord = {
  id: string;
  tenantId: string;
  supplierCode: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  leadTimeDays: number;
  createdAt: string;
};

export type CreateSupplierInput = {
  tenantId: string;
  supplierCode: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  leadTimeDays: number;
};

export type CustomerStatementRecord = {
  customerId: string;
  tenantId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  invoiceCount: number;
  invoicedAmount: number;
  cashCollectedAmount: number;
  outstandingAmount: number;
  currentAmount: number;
  overdue31To60Amount: number;
  overdue61To90Amount: number;
  overdueOver90Amount: number;
  lastInvoiceAt: string | null;
};

export type ProductRecord = {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  unitPrice: number;
  status: "draft" | "active";
  createdAt: string;
};

export type CreateProductInput = {
  tenantId: string;
  sku: string;
  name: string;
  unitPrice: number;
};

export type PurchaseOrderStatus = "issued" | "partially_received" | "received";

export type PurchaseOrderRecord = {
  id: string;
  tenantId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityOrdered: number;
  receivedQuantity: number;
  outstandingQuantity: number;
  unitCost: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  expectedReceiptDate: string;
  createdAt: string;
};

export type CreatePurchaseOrderInput = {
  tenantId: string;
  supplierId: string;
  productId: string;
  quantityOrdered: number;
  unitCost: number;
  expectedReceiptDate: string;
};

export type PurchaseOrderReceiptRecord = {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
  receivedAt: string;
};

export type ApprovalRequestType =
  | "inventory_adjustment"
  | "purchase_order_receipt"
  | "invoice_issue"
  | "invoice_payment";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRiskLevel = "high" | "critical";

export type ApprovalDecision = "approved" | "rejected";

export type ApprovalRequestRecord = {
  id: string;
  tenantId: string;
  requestType: ApprovalRequestType;
  referenceId: string;
  referenceNumber: string;
  summary: string;
  reason: string;
  status: ApprovalStatus;
  riskLevel: ApprovalRiskLevel;
  amount: number | null;
  quantity: number | null;
  requestedByEmail: string;
  requestedByDisplayName: string;
  decisionByEmail: string | null;
  decisionByDisplayName: string | null;
  decisionNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
};

export type ApprovalAwareMutationResult<T> =
  | {
      kind: "applied";
      item: T;
    }
  | {
      kind: "approval_requested";
      approvalRequest: ApprovalRequestRecord;
    };

export type ApprovalDecisionInput = {
  tenantId: string;
  approvalRequestId: string;
  decision: ApprovalDecision;
  decisionNote?: string;
};

export type ReceivePurchaseOrderInput = {
  tenantId: string;
  purchaseOrderId: string;
  quantityReceived: number;
  receivedDate: string;
};

export type ReceivePurchaseOrderResult = {
  purchaseOrder: PurchaseOrderRecord;
  inventory: InventoryRecord;
  receipt: PurchaseOrderReceiptRecord;
};

export type OrderRecord = {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "draft" | "confirmed";
  createdAt: string;
};

export type CreateOrderInput = {
  tenantId: string;
  customerId: string;
  productId: string;
  quantity: number;
};

export type InventoryRecord = {
  productId: string;
  tenantId: string;
  sku: string;
  productName: string;
  quantityOnHand: number;
  averageUnitCost: number;
  inventoryValue: number;
  lastReceiptAt: string | null;
  updatedAt: string;
};

export type CreateInventoryAdjustmentInput = {
  tenantId: string;
  productId: string;
  direction: "in" | "out";
  quantity: number;
};

export type InvoiceStatus = "issued" | "partially_paid" | "paid";

export type PaymentMethod = "bank_transfer" | "cash" | "card";

export type CollectionStatus = "current" | "due_today" | "overdue" | "settled";

export type CollectionFollowUpStatus = "new" | "contacted" | "promised" | "escalated";

export type CollectionPriority = "low" | "medium" | "high" | "critical";

export type CollectionActionRequired =
  | "monitor"
  | "call_customer"
  | "confirm_payment"
  | "escalate_founder";

export type CollectionActivityState = "assigned" | "resolved";

export type AccountType = "asset" | "liability" | "revenue" | "expense";

export type AccountBalanceRecord = {
  tenantId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  balanceAmount: number;
};

export type JournalReferenceType = "invoice" | "payment" | "purchase_receipt" | "order";

export type JournalEntryRecord = {
  id: string;
  tenantId: string;
  entryGroupId: string;
  referenceType: JournalReferenceType;
  referenceId: string;
  referenceNumber: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  createdAt: string;
};

export type AuditDomain = "finance";

export type AuditEntityType =
  | "invoice"
  | "payment"
  | "collection"
  | "purchase_order"
  | "approval";

export type AuditActionType =
  | "invoice_issued"
  | "purchase_order_received"
  | "payment_recorded"
  | "collection_follow_up_updated"
  | "collection_action_resolved"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected";

export type AuditLogMetadata = {
  amount?: number;
  quantity?: number;
  unitCost?: number;
  paymentMethod?: PaymentMethod;
  outstandingAmount?: number;
  followUpStatus?: CollectionFollowUpStatus;
  actionRequired?: CollectionActionRequired;
  promisedPaymentDate?: string | null;
  nextActionDate?: string | null;
  approvalRequestType?: ApprovalRequestType;
  approvalRiskLevel?: ApprovalRiskLevel;
  decision?: ApprovalDecision;
  decisionNote?: string;
  note?: string;
};

export type AuditLogRecord = {
  id: string;
  tenantId: string;
  domain: AuditDomain;
  entityType: AuditEntityType;
  entityId: string;
  entityNumber: string;
  actionType: AuditActionType;
  summary: string;
  actorEmail: string;
  actorDisplayName: string;
  metadata: AuditLogMetadata;
  createdAt: string;
};

export type InvoiceRecord = {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  subtotalAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentCount: number;
  lastPaymentAt: string | null;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paymentTermDays: number;
  daysUntilDue: number;
  daysPastDue: number;
  collectionStatus: CollectionStatus;
  followUpStatus: CollectionFollowUpStatus;
  collectionPriority: CollectionPriority;
  actionRequired: CollectionActionRequired;
  promisedPaymentDate: string | null;
  nextActionDate: string | null;
  collectionNote: string;
  lastCollectionUpdateAt: string | null;
};

export type CreateInvoiceInput = {
  tenantId: string;
  orderId: string;
  taxRatePercent: number;
  issueDate: string;
  paymentTermDays: number;
};

export type CreateInvoicePaymentInput = {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
};

export type UpdateInvoiceCollectionInput = {
  tenantId: string;
  invoiceId: string;
  followUpStatus: CollectionFollowUpStatus;
  actionRequired: CollectionActionRequired;
  promisedPaymentDate: string | null;
  nextActionDate: string | null;
  collectionNote: string;
};

export type ResolveInvoiceCollectionActionInput = {
  tenantId: string;
  invoiceId: string;
};

export type InvoiceCollectionActivityRecord = {
  id: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  followUpStatus: CollectionFollowUpStatus;
  collectionPriority: CollectionPriority;
  actionRequired: CollectionActionRequired;
  promisedPaymentDate: string | null;
  nextActionDate: string | null;
  collectionNote: string;
  outstandingAmountSnapshot: number;
  actionState: CollectionActivityState;
  createdAt: string;
};

export type ReportSummary = {
  tenantId: string;
  customerCount: number;
  productCount: number;
  orderCount: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  openInvoiceCount: number;
  grossSalesAmount: number;
  invoicedAmount: number;
  cashCollectedAmount: number;
  outstandingReceivablesAmount: number;
  currentReceivablesAmount: number;
  overdue31To60Amount: number;
  overdue61To90Amount: number;
  overdueOver90Amount: number;
  averageOrderValue: number;
  stockUnitsOnHand: number;
  inventoryValueAmount: number;
  outOfStockProductCount: number;
  lowStockProductCount: number;
  topCustomerName: string;
  topCustomerAmount: number;
  topProductName: string;
  topProductUnits: number;
};

export type TenantExportBundle = {
  tenant: TenantRecord;
  exportedAt: string;
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  products: ProductRecord[];
  inventories: InventoryRecord[];
  orders: OrderRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  invoices: InvoiceRecord[];
  customerStatements: CustomerStatementRecord[];
  collectionActivities: InvoiceCollectionActivityRecord[];
  approvalRequests: ApprovalRequestRecord[];
  auditLogs: AuditLogRecord[];
  accountBalances: AccountBalanceRecord[];
  journalEntries: JournalEntryRecord[];
};

export type FoundationSnapshot = {
  modules: readonly FoundationModule[];
  message: string;
  demoCredentials: typeof demoCredentials;
  demoAccounts: ReadonlyArray<Pick<DemoAccount, "email" | "password" | "displayName" | "role">>;
};

export type HealthPayload = {
  service: "smarterp-api";
  status: "ok";
  foundation: string;
};

export type OperationsDatabaseStatus = {
  path: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string | null;
};

export type OperationsRuntimeServiceKey = "api" | "web";

export type OperationsRuntimeServiceStatus = {
  key: OperationsRuntimeServiceKey;
  label: string;
  url: string;
  healthy: boolean;
  pid: number | null;
  pidFilePath: string;
  stdoutPath: string;
  stderrPath: string;
  stdoutExists: boolean;
  stderrExists: boolean;
  lastLogUpdateAt: string | null;
};

export type OperationsArtifactStatus = {
  key: "database" | "smoke-summary" | "smoke-screenshot";
  label: string;
  path: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string | null;
};

export type OperationsReadinessSeverity = "critical" | "warning";

export type OperationsReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  severity: OperationsReadinessSeverity;
  detail: string;
};

export type OperationsReadinessLevel = "ready" | "warning" | "blocked";

export type OperationsReadinessStatus = {
  level: OperationsReadinessLevel;
  passedCheckCount: number;
  warningCheckCount: number;
  failedCheckCount: number;
  checks: OperationsReadinessCheck[];
};

export type OperationsSmokeStatus = {
  checkedAt: string;
  passed: boolean;
  tenantName: string | null;
  verifiedCheckCount: number;
  consoleWarningCount: number;
  consoleErrorCount: number;
  failedRequestCount: number;
  screenshotPath: string | null;
  summaryPath: string;
};

export type OperationsTotals = {
  tenantCount: number;
  customerCount: number;
  supplierCount: number;
  productCount: number;
  purchaseOrderCount: number;
  openPurchaseOrderCount: number;
  inventoryLineCount: number;
  orderCount: number;
  invoiceCount: number;
  openInvoiceCount: number;
  pendingApprovalCount: number;
  overdueReceivablesAmount: number;
  todayCollectionActionCount: number;
};

export type OperationsTenantStatusRecord = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  industry: string;
  customerCount: number;
  supplierCount: number;
  productCount: number;
  openInvoiceCount: number;
  pendingApprovalCount: number;
  overdueReceivablesAmount: number;
  inventoryValueAmount: number;
  lastActivityAt: string | null;
};

export type OperationsStatusPayload = {
  service: "smarterp-api";
  status: "ok";
  foundation: string;
  generatedAt: string;
  database: OperationsDatabaseStatus;
  runtimeServices: OperationsRuntimeServiceStatus[];
  artifacts: OperationsArtifactStatus[];
  readiness: OperationsReadinessStatus;
  smoke: OperationsSmokeStatus | null;
  totals: OperationsTotals;
  tenants: OperationsTenantStatusRecord[];
};

export function getRoleModules(role: UserRole): readonly FoundationModule[] {
  return roleModules[role];
}

export function getRolePermissions(role: UserRole): readonly Permission[] {
  return rolePermissions[role];
}

export function canAccessModule(
  sessionOrRole: Pick<Session, "modules"> | UserRole,
  module: FoundationModule,
): boolean {
  const modules = typeof sessionOrRole === "string" ? getRoleModules(sessionOrRole) : sessionOrRole.modules;
  return modules.includes(module);
}

export function hasPermission(
  sessionOrRole: Pick<Session, "permissions"> | UserRole,
  permission: Permission,
): boolean {
  const permissions =
    typeof sessionOrRole === "string" ? getRolePermissions(sessionOrRole) : sessionOrRole.permissions;
  return permissions.includes(permission);
}

function buildSession(account: DemoAccount): Session {
  return {
    userId: account.userId,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    accessToken: account.accessToken,
    modules: getRoleModules(account.role),
    permissions: getRolePermissions(account.role),
  };
}

export function createDemoSession(accountSelector: UserRole | string = "founder"): Session {
  const account =
    demoAccounts.find((candidate) => candidate.email === accountSelector) ??
    demoAccounts.find((candidate) => candidate.role === accountSelector) ??
    demoAccounts[0];
  return buildSession(account);
}

export function getDemoSessionByAccessToken(accessToken: string): Session | null {
  const account = demoAccounts.find((candidate) => candidate.accessToken === accessToken);
  return account ? buildSession(account) : null;
}

export function getDemoSessionByCredentials(input: LoginInput): Session | null {
  const account = demoAccounts.find(
    (candidate) => candidate.email === input.email && candidate.password === input.password,
  );
  return account ? buildSession(account) : null;
}
