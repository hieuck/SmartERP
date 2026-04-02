import { createContext, useContext } from "react";

import type {
  ApprovalDecisionInput,
  CancelOrderInput,
  CancelPurchaseOrderInput,
  CloseOrderInput,
  ClosePurchaseOrderInput,
  ApprovalRequestRecord,
  CreateCustomerInput,
  CreateInventoryAdjustmentInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  VoidInvoiceInput,
  CreateOrderInput,
  CreateProductInput,
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  CreateTenantInput,
  FoundationModule,
  FoundationSnapshot,
  ImportOnboardingInput,
  ImportOnboardingResult,
  InvoiceCollectionActivityRecord,
  InvoiceRecord,
  InventoryRecord,
  LoginInput,
  OrderRecord,
  Permission,
  PurchaseOrderRecord,
  ProductRecord,
  ReceivePurchaseOrderInput,
  ResolveInvoiceCollectionActionInput,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  Session,
  SupplierRecord,
  TenantExportBundle,
  TenantRecord,
  UpdateInvoiceCollectionInput,
  CustomerRecord,
  CustomerStatementRecord,
  UpdateCustomerInput,
  UpdateProductInput,
  UpdateSupplierInput,
} from "@smarterp/contracts";

export type WorkspaceContextValue = {
  foundation: FoundationSnapshot | null;
  isBooting: boolean;
  isBusy: boolean;
  error: string;
  notice: string;
  clearError: () => void;
  clearNotice: () => void;
  session: Session | null;
  canAccessModule: (module: FoundationModule) => boolean;
  can: (permission: Permission) => boolean;
  tenants: TenantRecord[];
  selectedTenantId: string;
  selectedTenant: TenantRecord | null;
  approvalRequests: ApprovalRequestRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  customerStatements: CustomerStatementRecord[];
  collectionActivities: InvoiceCollectionActivityRecord[];
  products: ProductRecord[];
  inventories: InventoryRecord[];
  orders: OrderRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  invoices: InvoiceRecord[];
  loginToWorkspace: (input: LoginInput) => Promise<void>;
  logoutFromWorkspace: () => void;
  setSelectedTenantId: (tenantId: string) => void;
  createTenantRecord: (input: CreateTenantInput) => Promise<void>;
  importOnboardingDatasetRecord: (
    input: Omit<ImportOnboardingInput, "tenantId">,
  ) => Promise<ImportOnboardingResult>;
  exportTenantSnapshotRecord: () => Promise<TenantExportBundle>;
  previewTenantSnapshotRestoreRecord: (
    input: RestoreTenantSnapshotInput,
  ) => Promise<RestoreTenantSnapshotPreview>;
  restoreTenantSnapshotRecord: (
    input: RestoreTenantSnapshotInput,
  ) => Promise<RestoreTenantSnapshotResult>;
  createCustomerRecord: (input: Omit<CreateCustomerInput, "tenantId">) => Promise<void>;
  updateCustomerRecord: (input: Omit<UpdateCustomerInput, "tenantId">) => Promise<void>;
  deleteCustomerRecord: (customerId: string) => Promise<void>;
  createSupplierRecord: (input: Omit<CreateSupplierInput, "tenantId">) => Promise<void>;
  updateSupplierRecord: (input: Omit<UpdateSupplierInput, "tenantId">) => Promise<void>;
  deleteSupplierRecord: (supplierId: string) => Promise<void>;
  createProductRecord: (input: Omit<CreateProductInput, "tenantId">) => Promise<void>;
  updateProductRecord: (input: Omit<UpdateProductInput, "tenantId">) => Promise<void>;
  deleteProductRecord: (productId: string) => Promise<void>;
  createInventoryAdjustmentRecord: (
    input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
  ) => Promise<void>;
  createOrderRecord: (input: Omit<CreateOrderInput, "tenantId">) => Promise<void>;
  cancelOrderRecord: (input: Omit<CancelOrderInput, "tenantId">) => Promise<void>;
  closeOrderRecord: (input: Omit<CloseOrderInput, "tenantId">) => Promise<void>;
  createPurchaseOrderRecord: (input: Omit<CreatePurchaseOrderInput, "tenantId">) => Promise<void>;
  cancelPurchaseOrderRecord: (input: Omit<CancelPurchaseOrderInput, "tenantId">) => Promise<void>;
  closePurchaseOrderRecord: (input: Omit<ClosePurchaseOrderInput, "tenantId">) => Promise<void>;
  receivePurchaseOrderRecord: (input: Omit<ReceivePurchaseOrderInput, "tenantId">) => Promise<void>;
  createInvoiceRecord: (input: Omit<CreateInvoiceInput, "tenantId">) => Promise<void>;
  createInvoicePaymentRecord: (input: Omit<CreateInvoicePaymentInput, "tenantId">) => Promise<void>;
  voidInvoiceRecord: (input: Omit<VoidInvoiceInput, "tenantId">) => Promise<void>;
  updateInvoiceCollectionRecord: (
    input: Omit<UpdateInvoiceCollectionInput, "tenantId">,
  ) => Promise<void>;
  resolveInvoiceCollectionActionRecord: (
    input: Omit<ResolveInvoiceCollectionActionInput, "tenantId">,
  ) => Promise<void>;
  decideApprovalRequestRecord: (
    input: Omit<ApprovalDecisionInput, "tenantId">,
  ) => Promise<void>;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function createWorkspaceContextValue(value: WorkspaceContextValue): WorkspaceContextValue {
  return value;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }

  return context;
}
