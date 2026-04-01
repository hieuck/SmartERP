import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type {
  ApprovalDecisionInput,
  ApprovalDecision,
  ApprovalRequestRecord,
  FoundationModule,
  CreateCustomerInput,
  CreateInvoiceInput,
  UpdateInvoiceCollectionInput,
  ResolveInvoiceCollectionActionInput,
  CreateInvoicePaymentInput,
  CreateInventoryAdjustmentInput,
  CreateOrderInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  CreateProductInput,
  CreateSupplierInput,
  CreateTenantInput,
  ImportOnboardingInput,
  ImportOnboardingResult,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  InvoiceCollectionActivityRecord,
  CustomerStatementRecord,
  CustomerRecord,
  FoundationSnapshot,
  InvoiceRecord,
  InventoryRecord,
  LoginInput,
  OrderRecord,
  Permission,
  PurchaseOrderRecord,
  ProductRecord,
  Session,
  SupplierRecord,
  TenantRecord,
  TenantExportBundle,
} from "@smarterp/contracts";
import {
  canAccessModule as sessionCanAccessModule,
  hasPermission as sessionHasPermission,
} from "@smarterp/contracts";

import {
  getFoundation,
  login,
  setApiSession,
  setUnauthorizedHandler,
} from "../api";
import { loadTenants } from "../modules/tenants/api";
import { localizeErrorMessage } from "../locale/errorMessages";
import { useLocale } from "../locale/LocaleContext";
import { createWorkspaceCommands } from "./workspaceCommands";
import {
  clearStoredWorkspaceState,
  readStoredSession,
  readStoredTenantId,
  writeStoredSession,
  writeStoredTenantId,
} from "./workspaceStorage";
import {
  createEmptyTenantWorkspaceData,
  loadTenantWorkspaceData,
  requireSelectedTenantId,
  type TenantWorkspaceData,
} from "./workspaceTenantData";

type WorkspaceContextValue = {
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
  createSupplierRecord: (input: Omit<CreateSupplierInput, "tenantId">) => Promise<void>;
  createProductRecord: (input: Omit<CreateProductInput, "tenantId">) => Promise<void>;
  createInventoryAdjustmentRecord: (
    input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
  ) => Promise<void>;
  createOrderRecord: (input: Omit<CreateOrderInput, "tenantId">) => Promise<void>;
  createPurchaseOrderRecord: (input: Omit<CreatePurchaseOrderInput, "tenantId">) => Promise<void>;
  receivePurchaseOrderRecord: (input: Omit<ReceivePurchaseOrderInput, "tenantId">) => Promise<void>;
  createInvoiceRecord: (input: Omit<CreateInvoiceInput, "tenantId">) => Promise<void>;
  createInvoicePaymentRecord: (input: Omit<CreateInvoicePaymentInput, "tenantId">) => Promise<void>;
  updateInvoiceCollectionRecord: (input: Omit<UpdateInvoiceCollectionInput, "tenantId">) => Promise<void>;
  resolveInvoiceCollectionActionRecord: (
    input: Omit<ResolveInvoiceCollectionActionInput, "tenantId">,
  ) => Promise<void>;
  decideApprovalRequestRecord: (
    input: Omit<ApprovalDecisionInput, "tenantId">,
  ) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren): ReactElement {
  const { t } = useLocale();
  const [foundation, setFoundation] = useState<FoundationSnapshot | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(() => readStoredTenantId());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [customerStatements, setCustomerStatements] = useState<CustomerStatementRecord[]>([]);
  const [collectionActivities, setCollectionActivities] = useState<InvoiceCollectionActivityRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";
  const notice = noticeMessage;
  const canAccessModule = (module: FoundationModule): boolean =>
    session ? sessionCanAccessModule(session, module) : false;
  const can = (permission: Permission): boolean => (session ? sessionHasPermission(session, permission) : false);

  function applyTenantWorkspaceData(data: TenantWorkspaceData): void {
    setApprovalRequests(data.approvalRequests);
    setCustomers(data.customers);
    setSuppliers(data.suppliers);
    setCustomerStatements(data.customerStatements);
    setCollectionActivities(data.collectionActivities);
    setProducts(data.products);
    setInventories(data.inventories);
    setOrders(data.orders);
    setPurchaseOrders(data.purchaseOrders);
    setInvoices(data.invoices);
  }

  function resetTenantWorkspaceData(): void {
    applyTenantWorkspaceData(createEmptyTenantWorkspaceData());
  }

  function getSelectedTenantIdOrThrow(): string {
    try {
      return requireSelectedTenantId(selectedTenantId);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Select a tenant first.";
      setErrorMessage(message);
      throw caught;
    }
  }

  useEffect(() => {
    setApiSession(session);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      clearStoredWorkspaceState();
      setSession(null);
      setSelectedTenantId("");
      setNoticeMessage("");
      setErrorMessage(message);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    getFoundation()
      .then(setFoundation)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load foundation.");
      })
      .finally(() => {
        setIsBooting(false);
      });
  }, []);

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  useEffect(() => {
    writeStoredTenantId(selectedTenantId);
  }, [selectedTenantId]);

  async function refreshTenantWorkspace(tenantId: string): Promise<void> {
    const nextWorkspace = await loadTenantWorkspaceData(tenantId, canAccessModule);
    applyTenantWorkspaceData(nextWorkspace);
  }

  function buildApprovalNotice(
    approvalRequest: ApprovalRequestRecord,
    decision?: ApprovalDecision,
  ): string {
    if (decision === "approved") {
      return t("approvals.noticeApproved", { referenceNumber: approvalRequest.referenceNumber });
    }

    if (decision === "rejected") {
      return t("approvals.noticeRejected", { referenceNumber: approvalRequest.referenceNumber });
    }

    return t("approvals.noticeRequested", { referenceNumber: approvalRequest.referenceNumber });
  }

  useEffect(() => {
    if (!session) {
      setTenants([]);
      setSelectedTenantId("");
      resetTenantWorkspaceData();
      setNoticeMessage("");
      return;
    }

    loadTenants()
      .then((items) => {
        setTenants(items);
        setSelectedTenantId((current) =>
          items.some((tenant) => tenant.id === current) ? current : (items[0]?.id ?? ""),
        );
      })
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load tenants.");
      });
  }, [session]);

  useEffect(() => {
    if (!selectedTenantId) {
      resetTenantWorkspaceData();
      return;
    }

    refreshTenantWorkspace(selectedTenantId).catch((caught: unknown) => {
      setErrorMessage(caught instanceof Error ? caught.message : "Failed to load workspace.");
    });
  }, [selectedTenantId]);

  const {
    createTenantRecord,
    importOnboardingDatasetRecord,
    exportTenantSnapshotRecord,
    previewTenantSnapshotRestoreRecord,
    restoreTenantSnapshotRecord,
    createCustomerRecord,
    createSupplierRecord,
    createProductRecord,
    createInventoryAdjustmentRecord,
    createOrderRecord,
    createPurchaseOrderRecord,
    receivePurchaseOrderRecord,
    createInvoiceRecord,
    createInvoicePaymentRecord,
    decideApprovalRequestRecord,
    updateInvoiceCollectionRecord,
    resolveInvoiceCollectionActionRecord,
  } = createWorkspaceCommands({
    t,
    setIsBusy,
    setErrorMessage,
    setNoticeMessage,
    setTenants,
    setSelectedTenantId,
    refreshTenantWorkspace,
    buildApprovalNotice,
    getSelectedTenantIdOrThrow,
  });

  async function loginToWorkspace(input: LoginInput): Promise<void> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const result = await login(input);
      setSession(result.session);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Login failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  function logoutFromWorkspace(): void {
    clearStoredWorkspaceState();
    setSession(null);
    setSelectedTenantId("");
    setErrorMessage("");
    setNoticeMessage("");
    resetTenantWorkspaceData();
  }

  function clearError(): void {
    setErrorMessage("");
  }

  function clearNotice(): void {
    setNoticeMessage("");
  }

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        foundation,
        isBooting,
        isBusy,
        error,
        notice,
        clearError,
        clearNotice,
        session,
        canAccessModule,
        can,
        tenants,
        selectedTenantId,
        selectedTenant,
        approvalRequests,
        customers,
        suppliers,
        customerStatements,
        collectionActivities,
        products,
        inventories,
        orders,
        purchaseOrders,
        invoices,
        loginToWorkspace,
        logoutFromWorkspace,
        setSelectedTenantId,
        createTenantRecord,
        importOnboardingDatasetRecord,
        exportTenantSnapshotRecord,
        previewTenantSnapshotRestoreRecord,
        restoreTenantSnapshotRecord,
        createCustomerRecord,
        createSupplierRecord,
        createProductRecord,
        createInventoryAdjustmentRecord,
        createOrderRecord,
        createPurchaseOrderRecord,
        receivePurchaseOrderRecord,
        createInvoiceRecord,
        createInvoicePaymentRecord,
        updateInvoiceCollectionRecord,
        resolveInvoiceCollectionActionRecord,
        decideApprovalRequestRecord,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }

  return context;
}
