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
] as const;

export const rewriteMessage =
  "New development now targets a clean workspace with explicit contracts, shared UI primitives, and capability-by-capability migration from the legacy tree.";

export const demoCredentials = {
  email: "founder@smarterp.vn",
  password: "smarterp-next",
} as const;

export const demoAccessToken = "smarterp-next-demo-token" as const;

export function describeApiFoundation(): string {
  return "Modular API foundation active";
}

export type FoundationModule = (typeof foundationModules)[number];

export type Session = {
  userId: string;
  email: string;
  displayName: string;
  role: "founder";
  accessToken: string;
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

export type FoundationSnapshot = {
  modules: readonly FoundationModule[];
  message: string;
  demoCredentials: typeof demoCredentials;
};

export type HealthPayload = {
  service: "smarterp-api";
  status: "ok";
  foundation: string;
};

export function createDemoSession(): Session {
  return {
    userId: "founder-1",
    email: demoCredentials.email,
    displayName: "SmartERP Founder",
    role: "founder",
    accessToken: demoAccessToken,
  };
}
