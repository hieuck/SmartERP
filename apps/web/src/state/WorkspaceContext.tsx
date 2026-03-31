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
  decideApprovalRequest,
  createCustomer,
  createInvoice,
  updateInvoiceCollection,
  resolveInvoiceCollectionAction,
  createInvoicePayment,
  createInventoryAdjustment,
  createOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  createProduct,
  createSupplier,
  createTenant,
  exportTenantSnapshot,
  getFoundation,
  importOnboardingDataset,
  listApprovalRequests,
  listInvoiceCollectionActivities,
  listCustomers,
  listCustomerStatements,
  listInventory,
  listInvoices,
  listOrders,
  listPurchaseOrders,
  listProducts,
  listSuppliers,
  listTenants,
  login,
  setApiSession,
  setUnauthorizedHandler,
} from "../api";
import { localizeErrorMessage } from "../locale/errorMessages";
import { useLocale } from "../locale/LocaleContext";
import {
  clearStoredWorkspaceState,
  readStoredSession,
  readStoredTenantId,
  writeStoredSession,
  writeStoredTenantId,
} from "./workspaceStorage";

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
    const [
      nextApprovalRequests,
      nextCustomers,
      nextSuppliers,
      nextCustomerStatements,
      nextCollectionActivities,
      nextProducts,
      nextInventory,
      nextOrders,
      nextPurchaseOrders,
      nextInvoices,
    ] = await Promise.all([
      canAccessModule("approvals") ? listApprovalRequests(tenantId) : Promise.resolve([]),
      canAccessModule("customers") ? listCustomers(tenantId) : Promise.resolve([]),
      canAccessModule("suppliers") ? listSuppliers(tenantId) : Promise.resolve([]),
      canAccessModule("customers") ? listCustomerStatements(tenantId) : Promise.resolve([]),
      canAccessModule("invoices") ? listInvoiceCollectionActivities(tenantId) : Promise.resolve([]),
      canAccessModule("products") ? listProducts(tenantId) : Promise.resolve([]),
      canAccessModule("inventory") ? listInventory(tenantId) : Promise.resolve([]),
      canAccessModule("orders") ? listOrders(tenantId) : Promise.resolve([]),
      canAccessModule("purchasing") ? listPurchaseOrders(tenantId) : Promise.resolve([]),
      canAccessModule("invoices") ? listInvoices(tenantId) : Promise.resolve([]),
    ]);

    setApprovalRequests(nextApprovalRequests);
    setCustomers(nextCustomers);
    setSuppliers(nextSuppliers);
    setCustomerStatements(nextCustomerStatements);
    setCollectionActivities(nextCollectionActivities);
    setProducts(nextProducts);
    setInventories(nextInventory);
    setOrders(nextOrders);
    setPurchaseOrders(nextPurchaseOrders);
    setInvoices(nextInvoices);
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
      setApprovalRequests([]);
      setCustomers([]);
      setSuppliers([]);
      setCustomerStatements([]);
      setCollectionActivities([]);
      setProducts([]);
      setInventories([]);
      setOrders([]);
      setPurchaseOrders([]);
      setInvoices([]);
      setNoticeMessage("");
      return;
    }

    listTenants()
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
      setApprovalRequests([]);
      setCustomers([]);
      setSuppliers([]);
      setCustomerStatements([]);
      setCollectionActivities([]);
      setProducts([]);
      setInventories([]);
      setOrders([]);
      setPurchaseOrders([]);
      setInvoices([]);
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
    setApprovalRequests([]);
  }

  async function createTenantRecord(input: CreateTenantInput): Promise<void> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createTenant(input);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      throw new Error("Select a tenant first.");
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await importOnboardingDataset({ ...input, tenantId: selectedTenantId });
      await refreshTenantWorkspace(selectedTenantId);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      throw new Error("Select a tenant first.");
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const snapshot = await exportTenantSnapshot(selectedTenantId);
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

  async function createCustomerRecord(
    input: Omit<CreateCustomerInput, "tenantId">,
  ): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createCustomer({ ...input, tenantId: selectedTenantId });
      setCustomers((current) => [created, ...current]);
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createSupplier({ ...input, tenantId: selectedTenantId });
      setSuppliers((current) => [created, ...current]);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createProduct({ ...input, tenantId: selectedTenantId });
      setProducts((current) => [created, ...current]);
      const nextInventory = await listInventory(selectedTenantId);
      setInventories(nextInventory);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await createInventoryAdjustment({ ...input, tenantId: selectedTenantId });
      if (result.kind === "approval_requested") {
        setApprovalRequests((current) => [result.approvalRequest, ...current]);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      const updated = result.item;
      setInventories((current) => {
        const next = current.filter((item) => item.productId !== updated.productId);
        return [...next, updated].sort((left, right) => left.productName.localeCompare(right.productName));
      });
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Inventory adjustment failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createOrderRecord(input: Omit<CreateOrderInput, "tenantId">): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createOrder({ ...input, tenantId: selectedTenantId });
      setOrders((current) => [created, ...current]);
      const nextInventory = await listInventory(selectedTenantId);
      setInventories(nextInventory);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createPurchaseOrder({ ...input, tenantId: selectedTenantId });
      setPurchaseOrders((current) => [created, ...current]);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await receivePurchaseOrder({ ...input, tenantId: selectedTenantId });
      if (result.kind === "approval_requested") {
        setApprovalRequests((current) => [result.approvalRequest, ...current]);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      const applied = result.item;
      setPurchaseOrders((current) =>
        current.map((purchaseOrder) =>
          purchaseOrder.id === applied.purchaseOrder.id ? applied.purchaseOrder : purchaseOrder,
        ),
      );
      setInventories((current) => {
        const next = current.filter((item) => item.productId !== applied.inventory.productId);
        return [...next, applied.inventory].sort((left, right) =>
          left.productName.localeCompare(right.productName),
        );
      });
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Purchase order receiving failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInvoiceRecord(input: Omit<CreateInvoiceInput, "tenantId">): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await createInvoice({ ...input, tenantId: selectedTenantId });
      if (result.kind === "approval_requested") {
        setApprovalRequests((current) => [result.approvalRequest, ...current]);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      const created = result.item;
      setInvoices((current) => [created, ...current]);
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await createInvoicePayment({ ...input, tenantId: selectedTenantId });
      if (result.kind === "approval_requested") {
        setApprovalRequests((current) => [result.approvalRequest, ...current]);
        setNoticeMessage(buildApprovalNotice(result.approvalRequest));
        return;
      }

      const updatedInvoice = result.item;
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
      );
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const approvalRequest = await decideApprovalRequest({ ...input, tenantId: selectedTenantId });
      await refreshTenantWorkspace(selectedTenantId);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const updatedInvoice = await updateInvoiceCollection({ ...input, tenantId: selectedTenantId });
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
      );
      const nextCollectionActivities = await listInvoiceCollectionActivities(selectedTenantId);
      setCollectionActivities(nextCollectionActivities);
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
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const updatedInvoice = await resolveInvoiceCollectionAction({
        ...input,
        tenantId: selectedTenantId,
      });
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
      );
      const nextCollectionActivities = await listInvoiceCollectionActivities(selectedTenantId);
      setCollectionActivities(nextCollectionActivities);
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
