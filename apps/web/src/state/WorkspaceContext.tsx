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
import { submitApprovalDecision } from "../modules/approvals/api";
import { submitCustomer } from "../modules/customers/api";
import { submitInventoryAdjustment } from "../modules/inventory/api";
import { submitOrder } from "../modules/orders/api";
import {
  submitPurchaseOrder,
  submitPurchaseOrderReceipt,
} from "../modules/purchase-orders/api";
import { submitProduct } from "../modules/products/api";
import { submitSupplier } from "../modules/suppliers/api";
import {
  exportTenantSnapshotBundle,
  loadTenants,
  previewTenantSnapshotRestore,
  restoreTenantSnapshotBundle,
  submitOnboardingImport,
  submitTenant,
} from "../modules/tenants/api";
import {
  submitInvoiceCollectionResolution,
  submitInvoiceCollectionUpdate,
  submitInvoiceIssue,
  submitInvoicePayment,
} from "../modules/invoices/api";
import { localizeErrorMessage } from "../locale/errorMessages";
import { useLocale } from "../locale/LocaleContext";
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

  async function createTenantRecord(input: CreateTenantInput): Promise<void> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await submitTenant(input);
      setTenants((current) => [created, ...current]);
      setSelectedTenantId(created.id);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Tenant creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function importOnboardingDatasetRecord(
    input: Omit<ImportOnboardingInput, "tenantId">,
  ): Promise<ImportOnboardingResult> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await submitOnboardingImport({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
      setNoticeMessage(
        t("tenants.importNotice", {
          dataset: t(`tenants.datasets.${result.dataset}`),
          createdCount: result.createdCount,
          skippedCount: result.skippedCount,
        }),
      );
      return result;
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Onboarding import failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function exportTenantSnapshotRecord(): Promise<TenantExportBundle> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      const snapshot = await exportTenantSnapshotBundle(tenantId);
      setNoticeMessage(
        t("tenants.exportNotice", {
          tenantName: snapshot.tenant.name,
        }),
      );
      return snapshot;
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Tenant export failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function previewTenantSnapshotRestoreRecord(
    input: RestoreTenantSnapshotInput,
  ): Promise<RestoreTenantSnapshotPreview> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const result = await previewTenantSnapshotRestore(input);
      setNoticeMessage(
        t("tenants.restorePreviewNotice", {
          tenantName: result.targetTenant.name,
        }),
      );
      return result;
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Tenant restore preview failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreTenantSnapshotRecord(
    input: RestoreTenantSnapshotInput,
  ): Promise<RestoreTenantSnapshotResult> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const result = await restoreTenantSnapshotBundle(input);
      const nextTenants = await loadTenants();
      setTenants(nextTenants);
      setSelectedTenantId(result.tenant.id);
      await refreshTenantWorkspace(result.tenant.id);
      setNoticeMessage(
        t("tenants.restoreNotice", {
          tenantName: result.tenant.name,
          restoredProducts: result.restoredProducts,
          restoredCustomers: result.restoredCustomers,
        }),
      );
      return result;
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Tenant restore failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createCustomerRecord(
    input: Omit<CreateCustomerInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitCustomer({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Customer creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createSupplierRecord(
    input: Omit<CreateSupplierInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitSupplier({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Supplier creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createProductRecord(
    input: Omit<CreateProductInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitProduct({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Product creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInventoryAdjustmentRecord(
    input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await submitInventoryAdjustment({ ...input, tenantId });
      if (result.kind === "approval_requested") {
        await refreshTenantWorkspace(tenantId);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Inventory adjustment failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createOrderRecord(input: Omit<CreateOrderInput, "tenantId">): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitOrder({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Order creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createPurchaseOrderRecord(
    input: Omit<CreatePurchaseOrderInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitPurchaseOrder({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Purchase order creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function receivePurchaseOrderRecord(
    input: Omit<ReceivePurchaseOrderInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await submitPurchaseOrderReceipt({ ...input, tenantId });
      if (result.kind === "approval_requested") {
        await refreshTenantWorkspace(tenantId);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Purchase order receiving failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInvoiceRecord(input: Omit<CreateInvoiceInput, "tenantId">): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await submitInvoiceIssue({ ...input, tenantId });
      if (result.kind === "approval_requested") {
        await refreshTenantWorkspace(tenantId);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInvoicePaymentRecord(
    input: Omit<CreateInvoicePaymentInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await submitInvoicePayment({ ...input, tenantId });
      if (result.kind === "approval_requested") {
        await refreshTenantWorkspace(tenantId);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice payment failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function decideApprovalRequestRecord(
    input: Omit<ApprovalDecisionInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const approvalRequest = await submitApprovalDecision({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
      setNoticeMessage(buildApprovalNotice(approvalRequest, input.decision));
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Approval decision failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function updateInvoiceCollectionRecord(
    input: Omit<UpdateInvoiceCollectionInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitInvoiceCollectionUpdate({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice collection update failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function resolveInvoiceCollectionActionRecord(
    input: Omit<ResolveInvoiceCollectionActionInput, "tenantId">,
  ): Promise<void> {
    const tenantId = getSelectedTenantIdOrThrow();

    setIsBusy(true);
    setErrorMessage("");

    try {
      await submitInvoiceCollectionResolution({ ...input, tenantId });
      await refreshTenantWorkspace(tenantId);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice collection update failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
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
