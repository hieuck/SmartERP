import type { Dispatch, SetStateAction } from "react";

import type {
  AmendInvoiceInput,
  CreditInvoiceInput,
  ApprovalDecision,
  ApprovalDecisionInput,
  ApprovalRequestRecord,
  CancelOrderInput,
  CancelPurchaseOrderInput,
  CloseInvoiceReturnAuthorizationInput,
  CloseOrderInput,
  ClosePurchaseOrderInput,
  ReopenInvoiceInput,
  ReopenOrderInput,
  ReopenPurchaseOrderInput,
  CreateCustomerInput,
  CreateInventoryAdjustmentInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  CreateInvoiceReturnAuthorizationInput,
  RecordInvoiceReturnReceiptInput,
  ReopenInvoiceReturnAuthorizationInput,
  VoidInvoiceInput,
  CreateOrderInput,
  CreateProductCategoryInput,
  CreateProductInput,
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  CreateTenantInput,
  UpdateCustomerInput,
  UpdateOrderInput,
  UpdatePurchaseOrderInput,
  UpdateProductCategoryInput,
  UpdateProductInput,
  UpdateSupplierInput,
  ImportOnboardingInput,
  ImportOnboardingResult,
  ReceivePurchaseOrderInput,
  ResolveInvoiceCollectionActionInput,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  TenantExportBundle,
  TenantRecord,
  UpdateInvoiceCollectionInput,
} from "@smarterp/contracts";

import { submitApprovalDecision } from "../modules/approvals/api";
import {
  submitCustomer,
  submitCustomerDelete,
  submitCustomerUpdate,
} from "../modules/customers/api";
import { submitInventoryAdjustment } from "../modules/inventory/api";
import {
  submitInvoiceAmend,
  submitInvoiceCredit,
  submitInvoiceCollectionResolution,
  submitInvoiceCollectionUpdate,
  submitInvoiceIssue,
  submitInvoicePayment,
  submitInvoiceReturnAuthorization,
  submitInvoiceReturnAuthorizationClose,
  submitInvoiceReturnAuthorizationReopen,
  submitInvoiceReturnReceipt,
  submitInvoiceReopen,
  submitInvoiceVoid,
} from "../modules/invoices/api";
import {
  submitOrder,
  submitOrderCancel,
  submitOrderClose,
  submitOrderReopen,
  submitOrderUpdate,
} from "../modules/orders/api";
import {
  submitPurchaseOrder,
  submitPurchaseOrderCancel,
  submitPurchaseOrderClose,
  submitPurchaseOrderReopen,
  submitPurchaseOrderReceipt,
  submitPurchaseOrderUpdate,
} from "../modules/purchase-orders/api";
import {
  submitProductCategory,
  submitProductCategoryDelete,
  submitProductCategoryUpdate,
  submitProduct,
  submitProductDelete,
  submitProductUpdate,
} from "../modules/products/api";
import {
  submitSupplier,
  submitSupplierDelete,
  submitSupplierUpdate,
} from "../modules/suppliers/api";
import {
  exportTenantSnapshotBundle,
  loadTenants,
  previewTenantSnapshotRestore,
  restoreTenantSnapshotBundle,
  submitOnboardingImport,
  submitTenant,
} from "../modules/tenants/api";

type Translator = (key: string, values?: Record<string, number | string>) => string;

type WorkspaceCommandsDependencies = {
  t: Translator;
  setIsBusy: (busy: boolean) => void;
  setErrorMessage: (message: string) => void;
  setNoticeMessage: (message: string) => void;
  setTenants: Dispatch<SetStateAction<TenantRecord[]>>;
  setSelectedTenantId: (tenantId: string) => void;
  refreshTenantWorkspace: (tenantId: string) => Promise<void>;
  buildApprovalNotice: (
    approvalRequest: ApprovalRequestRecord,
    decision?: ApprovalDecision,
  ) => string;
  getSelectedTenantIdOrThrow: () => string;
};

async function runBusyAction<Result>(
  dependencies: Pick<
    WorkspaceCommandsDependencies,
    "setErrorMessage" | "setIsBusy" | "setNoticeMessage"
  >,
  fallbackMessage: string,
  action: () => Promise<Result>,
  options?: {
    clearNotice?: boolean;
  },
): Promise<Result> {
  dependencies.setIsBusy(true);
  dependencies.setErrorMessage("");

  if (options?.clearNotice) {
    dependencies.setNoticeMessage("");
  }

  try {
    return await action();
  } catch (caught) {
    dependencies.setErrorMessage(caught instanceof Error ? caught.message : fallbackMessage);
    throw caught;
  } finally {
    dependencies.setIsBusy(false);
  }
}

export function createWorkspaceCommands(dependencies: WorkspaceCommandsDependencies) {
  const {
    t,
    setErrorMessage,
    setIsBusy,
    setNoticeMessage,
    setSelectedTenantId,
    setTenants,
    refreshTenantWorkspace,
    buildApprovalNotice,
    getSelectedTenantIdOrThrow,
  } = dependencies;

  return {
    async createTenantRecord(input: CreateTenantInput): Promise<void> {
      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Tenant creation failed.",
        async () => {
          const created = await submitTenant(input);
          setTenants((current) => [created, ...current]);
          setSelectedTenantId(created.id);
        },
      );
    },

    async importOnboardingDatasetRecord(
      input: Omit<ImportOnboardingInput, "tenantId">,
    ): Promise<ImportOnboardingResult> {
      const tenantId = getSelectedTenantIdOrThrow();

      return runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Onboarding import failed.",
        async () => {
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
        },
        { clearNotice: true },
      );
    },

    async exportTenantSnapshotRecord(): Promise<TenantExportBundle> {
      const tenantId = getSelectedTenantIdOrThrow();

      return runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Tenant export failed.",
        async () => {
          const snapshot = await exportTenantSnapshotBundle(tenantId);
          setNoticeMessage(
            t("tenants.exportNotice", {
              tenantName: snapshot.tenant.name,
            }),
          );
          return snapshot;
        },
      );
    },

    async previewTenantSnapshotRestoreRecord(
      input: RestoreTenantSnapshotInput,
    ): Promise<RestoreTenantSnapshotPreview> {
      return runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Tenant restore preview failed.",
        async () => {
          const result = await previewTenantSnapshotRestore(input);
          setNoticeMessage(
            t("tenants.restorePreviewNotice", {
              tenantName: result.targetTenant.name,
            }),
          );
          return result;
        },
      );
    },

    async restoreTenantSnapshotRecord(
      input: RestoreTenantSnapshotInput,
    ): Promise<RestoreTenantSnapshotResult> {
      return runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Tenant restore failed.",
        async () => {
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
        },
      );
    },

    async createCustomerRecord(input: Omit<CreateCustomerInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Customer creation failed.",
        async () => {
          await submitCustomer({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updateCustomerRecord(input: Omit<UpdateCustomerInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Customer update failed.",
        async () => {
          await submitCustomerUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async deleteCustomerRecord(customerId: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Customer deletion failed.",
        async () => {
          await submitCustomerDelete({ tenantId, customerId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async createSupplierRecord(input: Omit<CreateSupplierInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Supplier creation failed.",
        async () => {
          await submitSupplier({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updateSupplierRecord(input: Omit<UpdateSupplierInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Supplier update failed.",
        async () => {
          await submitSupplierUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async deleteSupplierRecord(supplierId: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Supplier deletion failed.",
        async () => {
          await submitSupplierDelete({ tenantId, supplierId });
          await refreshTenantWorkspace(tenantId);
          },
        );
      },

    async createProductCategoryRecord(name: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product category creation failed.",
        async () => {
          await submitProductCategory({ tenantId, name });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updateProductCategoryRecord(categoryId: string, name: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product category update failed.",
        async () => {
          await submitProductCategoryUpdate({ tenantId, categoryId, name });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async deleteProductCategoryRecord(categoryId: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product category deletion failed.",
        async () => {
          await submitProductCategoryDelete({ tenantId, categoryId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async createProductRecord(input: Omit<CreateProductInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product creation failed.",
        async () => {
          await submitProduct({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updateProductRecord(input: Omit<UpdateProductInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product update failed.",
        async () => {
          await submitProductUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async deleteProductRecord(productId: string): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Product deletion failed.",
        async () => {
          await submitProductDelete({ tenantId, productId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async createInventoryAdjustmentRecord(
      input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Inventory adjustment failed.",
        async () => {
          const result = await submitInventoryAdjustment({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async createOrderRecord(input: Omit<CreateOrderInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Order creation failed.",
        async () => {
          await submitOrder({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updateOrderRecord(input: Omit<UpdateOrderInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Order update failed.",
        async () => {
          await submitOrderUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async cancelOrderRecord(input: Omit<CancelOrderInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Order cancellation failed.",
        async () => {
          await submitOrderCancel({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async closeOrderRecord(input: Omit<CloseOrderInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Order close failed.",
        async () => {
          await submitOrderClose({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async reopenOrderRecord(input: Omit<ReopenOrderInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Order reopen failed.",
        async () => {
          await submitOrderReopen({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async createPurchaseOrderRecord(
      input: Omit<CreatePurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order creation failed.",
        async () => {
          await submitPurchaseOrder({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async updatePurchaseOrderRecord(
      input: Omit<UpdatePurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order update failed.",
        async () => {
          await submitPurchaseOrderUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async cancelPurchaseOrderRecord(
      input: Omit<CancelPurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order cancellation failed.",
        async () => {
          await submitPurchaseOrderCancel({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async closePurchaseOrderRecord(
      input: Omit<ClosePurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order close failed.",
        async () => {
          await submitPurchaseOrderClose({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async reopenPurchaseOrderRecord(
      input: Omit<ReopenPurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order reopen failed.",
        async () => {
          await submitPurchaseOrderReopen({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async receivePurchaseOrderRecord(
      input: Omit<ReceivePurchaseOrderInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Purchase order receiving failed.",
        async () => {
          const result = await submitPurchaseOrderReceipt({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async createInvoiceRecord(input: Omit<CreateInvoiceInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice creation failed.",
        async () => {
          const result = await submitInvoiceIssue({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async amendInvoiceRecord(input: Omit<AmendInvoiceInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice amendment failed.",
        async () => {
          const result = await submitInvoiceAmend({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async createInvoicePaymentRecord(
      input: Omit<CreateInvoicePaymentInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice payment failed.",
        async () => {
          const result = await submitInvoicePayment({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async creditInvoiceRecord(input: Omit<CreditInvoiceInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice credit failed.",
        async () => {
          const result = await submitInvoiceCredit({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);

          if (result.kind === "approval_requested") {
            setNoticeMessage(buildApprovalNotice(result.approvalRequest));
          }
        },
        { clearNotice: true },
      );
    },

    async createInvoiceReturnAuthorizationRecord(
      input: Omit<CreateInvoiceReturnAuthorizationInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice return authorization failed.",
        async () => {
          await submitInvoiceReturnAuthorization({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async closeInvoiceReturnAuthorizationRecord(
      input: Omit<CloseInvoiceReturnAuthorizationInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice return case close failed.",
        async () => {
          await submitInvoiceReturnAuthorizationClose({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async reopenInvoiceReturnAuthorizationRecord(
      input: Omit<ReopenInvoiceReturnAuthorizationInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice return authorization reopen failed.",
        async () => {
          await submitInvoiceReturnAuthorizationReopen({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async recordInvoiceReturnReceiptRecord(
      input: Omit<RecordInvoiceReturnReceiptInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice return receipt failed.",
        async () => {
          await submitInvoiceReturnReceipt({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async decideApprovalRequestRecord(
      input: Omit<ApprovalDecisionInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Approval decision failed.",
        async () => {
          const approvalRequest = await submitApprovalDecision({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
          setNoticeMessage(buildApprovalNotice(approvalRequest, input.decision));
        },
        { clearNotice: true },
      );
    },

    async voidInvoiceRecord(input: Omit<VoidInvoiceInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice void failed.",
        async () => {
          await submitInvoiceVoid({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async reopenInvoiceRecord(input: Omit<ReopenInvoiceInput, "tenantId">): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice reopen failed.",
        async () => {
          await submitInvoiceReopen({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
        { clearNotice: true },
      );
    },

    async updateInvoiceCollectionRecord(
      input: Omit<UpdateInvoiceCollectionInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice collection update failed.",
        async () => {
          await submitInvoiceCollectionUpdate({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },

    async resolveInvoiceCollectionActionRecord(
      input: Omit<ResolveInvoiceCollectionActionInput, "tenantId">,
    ): Promise<void> {
      const tenantId = getSelectedTenantIdOrThrow();

      await runBusyAction(
        { setErrorMessage, setIsBusy, setNoticeMessage },
        "Invoice collection update failed.",
        async () => {
          await submitInvoiceCollectionResolution({ ...input, tenantId });
          await refreshTenantWorkspace(tenantId);
        },
      );
    },
  };
}
