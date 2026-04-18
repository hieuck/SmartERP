import type { PropsWithChildren, ReactElement } from "react";
import { useState } from "react";

import type {
  ApprovalDecision,
  ApprovalRequestRecord,
  FoundationModule,
  FoundationSnapshot,
  Permission,
  Session,
  TenantRecord,
} from "@smarterp/contracts";
import {
  canAccessModule as sessionCanAccessModule,
  hasPermission as sessionHasPermission,
} from "@smarterp/contracts";

import { localizeErrorMessage } from "../locale/errorMessages";
import { useLocale } from "../locale/LocaleContext";
import { createWorkspaceCommands } from "./workspaceCommands";
import {
  createWorkspaceContextValue,
  WorkspaceContext,
} from "./workspaceContextDefinition";
import { createWorkspaceSessionCommands, useWorkspaceSessionEffects } from "./workspaceSession";
import { readStoredSession, readStoredTenantId } from "./workspaceStorage";
import { useWorkspaceTenantState } from "./workspaceTenantState";
import {
  loadTenantWorkspaceData,
  requireSelectedTenantId,
} from "./workspaceTenantData";

export { useWorkspace } from "./workspaceContextDefinition";

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
  const {
    approvalRequests,
    customers,
    suppliers,
    customerStatements,
    collectionActivities,
    productCategories,
    products,
    inventories,
    orders,
    purchaseOrders,
    invoices,
    applyTenantWorkspaceData,
    resetTenantWorkspaceData,
  } = useWorkspaceTenantState();
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";
  const notice = noticeMessage;
  const canAccessModule = (module: FoundationModule): boolean =>
    session ? sessionCanAccessModule(session, module) : false;
  const can = (permission: Permission): boolean => (session ? sessionHasPermission(session, permission) : false);

  function getSelectedTenantIdOrThrow(): string {
    try {
      return requireSelectedTenantId(selectedTenantId);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Select a tenant first.";
      setErrorMessage(message);
      throw caught;
    }
  }

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

  useWorkspaceSessionEffects({
    session,
    selectedTenantId,
    setSession,
    setFoundation,
    setIsBooting,
    setTenants,
    setSelectedTenantId,
    setNoticeMessage,
    setErrorMessage,
    resetTenantWorkspaceData,
    refreshTenantWorkspace,
  });

  const {
    createTenantRecord,
    importOnboardingDatasetRecord,
    exportTenantSnapshotRecord,
    previewTenantSnapshotRestoreRecord,
    restoreTenantSnapshotRecord,
    createCustomerRecord,
    updateCustomerRecord,
    deleteCustomerRecord,
    createSupplierRecord,
    updateSupplierRecord,
    deleteSupplierRecord,
    createProductCategoryRecord,
    updateProductCategoryRecord,
    deleteProductCategoryRecord,
    createProductRecord,
    updateProductRecord,
    deleteProductRecord,
    createInventoryAdjustmentRecord,
    createOrderRecord,
    updateOrderRecord,
    cancelOrderRecord,
    closeOrderRecord,
    reopenOrderRecord,
    createPurchaseOrderRecord,
    updatePurchaseOrderRecord,
    cancelPurchaseOrderRecord,
    closePurchaseOrderRecord,
    reopenPurchaseOrderRecord,
    receivePurchaseOrderRecord,
    createInvoiceRecord,
    amendInvoiceRecord,
    createInvoicePaymentRecord,
    creditInvoiceRecord,
    recordInvoiceReturnReceiptRecord,
    reopenInvoiceRecord,
    voidInvoiceRecord,
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
  const { loginToWorkspace, logoutFromWorkspace } = createWorkspaceSessionCommands({
    setIsBusy,
    setErrorMessage,
    setNoticeMessage,
    setSession,
    setSelectedTenantId,
    resetTenantWorkspaceData,
  });

  function clearError(): void {
    setErrorMessage("");
  }

  function clearNotice(): void {
    setNoticeMessage("");
  }

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={createWorkspaceContextValue({
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
        productCategories,
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
        updateCustomerRecord,
        deleteCustomerRecord,
        createSupplierRecord,
        updateSupplierRecord,
        deleteSupplierRecord,
        createProductCategoryRecord,
        updateProductCategoryRecord,
        deleteProductCategoryRecord,
        createProductRecord,
        updateProductRecord,
        deleteProductRecord,
        createInventoryAdjustmentRecord,
        createOrderRecord,
        updateOrderRecord,
        cancelOrderRecord,
        closeOrderRecord,
        reopenOrderRecord,
        createPurchaseOrderRecord,
        updatePurchaseOrderRecord,
        cancelPurchaseOrderRecord,
        closePurchaseOrderRecord,
        reopenPurchaseOrderRecord,
        receivePurchaseOrderRecord,
        createInvoiceRecord,
        amendInvoiceRecord,
        createInvoicePaymentRecord,
        creditInvoiceRecord,
        recordInvoiceReturnReceiptRecord,
        reopenInvoiceRecord,
        voidInvoiceRecord,
        updateInvoiceCollectionRecord,
        resolveInvoiceCollectionActionRecord,
        decideApprovalRequestRecord,
      })}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
