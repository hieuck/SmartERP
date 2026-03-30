export const foundationModules = [
  "identity",
  "tenant",
  "customers",
  "products",
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
