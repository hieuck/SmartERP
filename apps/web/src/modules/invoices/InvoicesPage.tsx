import {
  AppstoreOutlined,
  BankOutlined,
  CheckCircleOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  InboxOutlined,
  PhoneOutlined,
  RollbackOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { useState } from "react";
import type { FormProps } from "antd";
import { Button, Card, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Tag, Typography } from "antd";

import type {
  AmendInvoiceInput,
  CloseInvoiceReturnAuthorizationInput,
  CollectionActionRequired,
  CollectionActivityState,
  CollectionFollowUpStatus,
  CollectionPriority,
  CreditMode,
  CreditInvoiceInput,
  CreateInvoiceReturnAuthorizationInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  InvoiceRecord,
  InvoiceReturnAuthorizationActionOwner,
  InvoiceReturnAuthorizationActionRequired,
  InvoiceReturnAuthorizationRecord,
  RecordInvoiceReturnReceiptInput,
  ReopenInvoiceReturnAuthorizationInput,
  UpdateInvoiceReturnAuthorizationInput,
  ReopenInvoiceInput,
  UpdateInvoiceCollectionInput,
  VoidInvoiceInput,
} from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";
import { ProductVisual } from "../products/ProductVisual";

const { Paragraph, Title } = Typography;
const { TextArea } = Input;

type InvoiceFormShape = Omit<CreateInvoiceInput, "tenantId">;
type AmendInvoiceFormShape = Omit<AmendInvoiceInput, "tenantId">;
type CreditInvoiceFormShape = Omit<CreditInvoiceInput, "tenantId"> & { creditMode: CreditMode };
type ReturnAuthorizationFormShape = Omit<CreateInvoiceReturnAuthorizationInput, "tenantId">;
type ReturnAuthorizationUpdateFormShape = Omit<UpdateInvoiceReturnAuthorizationInput, "tenantId">;
type ReturnAuthorizationCloseFormShape = Omit<CloseInvoiceReturnAuthorizationInput, "tenantId">;
type ReturnAuthorizationReopenFormShape = Omit<ReopenInvoiceReturnAuthorizationInput, "tenantId">;
type ReturnReceiptFormShape = Omit<RecordInvoiceReturnReceiptInput, "tenantId">;
type InvoicePaymentFormShape = Omit<CreateInvoicePaymentInput, "tenantId">;
type InvoiceCollectionFormShape = Omit<UpdateInvoiceCollectionInput, "tenantId">;
type InvoiceReopenFormShape = Omit<ReopenInvoiceInput, "tenantId">;
type InvoiceVoidFormShape = Omit<VoidInvoiceInput, "tenantId">;
type ReturnCaseQueueStatusFilter = "all" | InvoiceReturnAuthorizationRecord["status"];
type ReturnCaseQueueOwnerFilter = "all" | InvoiceReturnAuthorizationActionOwner;

function getTodayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInvoiceStatusColor(status: InvoiceRecord["status"]): string {
  if (status === "void") {
    return "default";
  }

  if (status === "credited") {
    return "magenta";
  }

  if (status === "partially_credited") {
    return "purple";
  }

  if (status === "paid") {
    return "green";
  }

  if (status === "partially_paid") {
    return "blue";
  }

  return "gold";
}

function getInvoiceStatusLabel(status: InvoiceRecord["status"], t: ReturnType<typeof useLocale>["t"]): string {
  if (status === "void") {
    return t("invoices.statusVoid");
  }

  if (status === "credited") {
    return t("invoices.statusCredited");
  }

  if (status === "partially_credited") {
    return t("invoices.statusPartiallyCredited");
  }

  if (status === "paid") {
    return t("invoices.statusPaid");
  }

  if (status === "partially_paid") {
    return t("invoices.statusPartiallyPaid");
  }

  return t("invoices.statusIssued");
}

function getCollectionStatusColor(status: InvoiceRecord["collectionStatus"]): string {
  if (status === "void") {
    return "default";
  }

  if (status === "credited") {
    return "magenta";
  }

  if (status === "settled") {
    return "green";
  }

  if (status === "overdue") {
    return "red";
  }

  if (status === "due_today") {
    return "volcano";
  }

  return "blue";
}

function getCollectionStatusLabel(
  invoice: InvoiceRecord,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (invoice.collectionStatus === "void") {
    return t("invoices.collectionVoid");
  }

  if (invoice.collectionStatus === "credited") {
    return t("invoices.collectionCredited");
  }

  if (invoice.collectionStatus === "settled") {
    return t("invoices.collectionSettled");
  }

  if (invoice.collectionStatus === "overdue") {
    return t("invoices.collectionOverdue", { count: invoice.daysPastDue });
  }

  if (invoice.collectionStatus === "due_today") {
    return t("invoices.collectionDueToday");
  }

  return t("invoices.collectionCurrent", { count: invoice.daysUntilDue });
}

function getFollowUpStatusColor(status: CollectionFollowUpStatus): string {
  if (status === "escalated") {
    return "red";
  }

  if (status === "promised") {
    return "geekblue";
  }

  if (status === "contacted") {
    return "cyan";
  }

  return "default";
}

function getFollowUpStatusLabel(
  status: CollectionFollowUpStatus,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "contacted") {
    return t("invoices.followUpStatusContacted");
  }

  if (status === "promised") {
    return t("invoices.followUpStatusPromised");
  }

  if (status === "escalated") {
    return t("invoices.followUpStatusEscalated");
  }

  return t("invoices.followUpStatusNew");
}

function getCollectionPriorityColor(priority: CollectionPriority): string {
  if (priority === "critical") {
    return "red";
  }

  if (priority === "high") {
    return "volcano";
  }

  if (priority === "medium") {
    return "gold";
  }

  return "default";
}

function getCollectionPriorityLabel(
  priority: CollectionPriority,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (priority === "critical") {
    return t("invoices.priorityCritical");
  }

  if (priority === "high") {
    return t("invoices.priorityHigh");
  }

  if (priority === "medium") {
    return t("invoices.priorityMedium");
  }

  return t("invoices.priorityLow");
}

function getReturnAuthorizationStatusColor(
  status: InvoiceRecord["returnAuthorizationStatus"],
): string {
  if (status === "closed") {
    return "default";
  }

  if (status === "settled") {
    return "green";
  }

  if (status === "received") {
    return "green";
  }

  if (status === "partially_received") {
    return "cyan";
  }

  if (status === "authorized") {
    return "gold";
  }

  return "default";
}

function getReturnAuthorizationStatusLabel(
  status: InvoiceRecord["returnAuthorizationStatus"],
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "closed") {
    return t("invoices.returnAuthorizationStatusClosed");
  }

  if (status === "settled") {
    return t("invoices.returnAuthorizationStatusSettled");
  }

  if (status === "received") {
    return t("invoices.returnAuthorizationStatusReceived");
  }

  if (status === "partially_received") {
    return t("invoices.returnAuthorizationStatusPartiallyReceived");
  }

  if (status === "authorized") {
    return t("invoices.returnAuthorizationStatusAuthorized");
  }

  return t("invoices.returnAuthorizationStatusNone");
}

function getActionRequiredLabel(
  actionRequired: CollectionActionRequired,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (actionRequired === "call_customer") {
    return t("invoices.actionCallCustomer");
  }

  if (actionRequired === "confirm_payment") {
    return t("invoices.actionConfirmPayment");
  }

  if (actionRequired === "escalate_founder") {
    return t("invoices.actionEscalateFounder");
  }

  return t("invoices.actionMonitor");
}

function getActivityStateColor(actionState: CollectionActivityState): string {
  return actionState === "resolved" ? "green" : "blue";
}

function getActivityStateLabel(
  actionState: CollectionActivityState,
  t: ReturnType<typeof useLocale>["t"],
): string {
  return actionState === "resolved"
    ? t("invoices.activityStateResolved")
    : t("invoices.activityStateAssigned");
}

function getPriorityRank(priority: CollectionPriority): number {
  if (priority === "critical") {
    return 4;
  }

  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}

function getReturnCaseStatusRank(status: InvoiceReturnAuthorizationRecord["status"]): number {
  if (status === "authorized") {
    return 5;
  }

  if (status === "partially_received") {
    return 4;
  }

  if (status === "received") {
    return 3;
  }

  if (status === "closed") {
    return 2;
  }

  return 1;
}

function getReturnCaseOwnerColor(owner: InvoiceReturnAuthorizationActionOwner): string {
  if (owner === "warehouse") {
    return "cyan";
  }

  if (owner === "founder") {
    return "gold";
  }

  if (owner === "finance") {
    return "purple";
  }

  return "default";
}

function getReturnCaseOwnerLabel(
  owner: InvoiceReturnAuthorizationActionOwner,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (owner === "warehouse") {
    return t("invoices.returnCaseOwnerWarehouse");
  }

  if (owner === "finance") {
    return t("invoices.returnCaseOwnerFinance");
  }

  if (owner === "founder") {
    return t("invoices.returnCaseOwnerFounder");
  }

  return t("invoices.returnCaseOwnerNone");
}

function getReturnCaseActionRequiredLabel(
  actionRequired: InvoiceReturnAuthorizationActionRequired,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (actionRequired === "receive_return") {
    return t("invoices.returnCaseActionReceiveReturn");
  }

  if (actionRequired === "post_credit_note") {
    return t("invoices.returnCaseActionPostCredit");
  }

  if (actionRequired === "approve_credit_note") {
    return t("invoices.returnCaseActionApproveCredit");
  }

  if (actionRequired === "closed") {
    return t("invoices.returnCaseActionClosed");
  }

  return t("invoices.returnCaseActionSettled");
}

export function InvoicesPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    can,
    collectionActivities,
    amendInvoiceRecord,
    creditInvoiceRecord,
    createInvoiceReturnAuthorizationRecord,
    updateInvoiceReturnAuthorizationRecord,
    closeInvoiceReturnAuthorizationRecord,
    reopenInvoiceReturnAuthorizationRecord,
    createInvoicePaymentRecord,
    createInvoiceRecord,
    invoiceReturnAuthorizations,
    recordInvoiceReturnReceiptRecord,
    reopenInvoiceRecord,
    voidInvoiceRecord,
    updateInvoiceCollectionRecord,
    resolveInvoiceCollectionActionRecord,
    invoices,
    isBusy,
    orders,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();
  const canIssueInvoices = can("issue_invoices");
  const canRecordPayments = can("record_invoice_payments");
  const canManageCollections = can("manage_collections");

  const [invoiceForm] = Form.useForm<InvoiceFormShape>();
  const [amendInvoiceForm] = Form.useForm<AmendInvoiceFormShape>();
  const [creditInvoiceForm] = Form.useForm<CreditInvoiceFormShape>();
  const [returnAuthorizationForm] = Form.useForm<ReturnAuthorizationFormShape>();
  const [returnAuthorizationUpdateForm] = Form.useForm<ReturnAuthorizationUpdateFormShape>();
  const [returnAuthorizationCloseForm] = Form.useForm<ReturnAuthorizationCloseFormShape>();
  const [returnAuthorizationReopenForm] = Form.useForm<ReturnAuthorizationReopenFormShape>();
  const [returnReceiptForm] = Form.useForm<ReturnReceiptFormShape>();
  const [paymentForm] = Form.useForm<InvoicePaymentFormShape>();
  const [collectionForm] = Form.useForm<InvoiceCollectionFormShape>();
  const [invoiceBeingAmended, setInvoiceBeingAmended] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingCredited, setInvoiceBeingCredited] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingAuthorizedForReturn, setInvoiceBeingAuthorizedForReturn] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingUpdatedForReturn, setInvoiceBeingUpdatedForReturn] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingClosedForReturn, setInvoiceBeingClosedForReturn] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingReopenedForReturn, setInvoiceBeingReopenedForReturn] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingReturned, setInvoiceBeingReturned] = useState<InvoiceRecord | null>(null);
  const [returnCaseStatusFilter, setReturnCaseStatusFilter] = useState<ReturnCaseQueueStatusFilter>("all");
  const [returnCaseOwnerFilter, setReturnCaseOwnerFilter] = useState<ReturnCaseQueueOwnerFilter>("all");
  const [returnCaseSearch, setReturnCaseSearch] = useState("");
  const selectedInvoiceOrderId = Form.useWatch("orderId", invoiceForm);
  const selectedInvoiceId = Form.useWatch("invoiceId", paymentForm);
  const selectedCollectionInvoiceId = Form.useWatch("invoiceId", collectionForm);
  const selectedFollowUpStatus = Form.useWatch("followUpStatus", collectionForm);
  const selectedActionRequired = Form.useWatch("actionRequired", collectionForm);
  const selectedCreditMode = Form.useWatch("creditMode", creditInvoiceForm);
  const todayDateInput = new Date().toISOString().slice(0, 10);

  const availableOrders = orders.filter(
    (order) =>
      order.status === "confirmed" &&
      !invoices.some((invoice) => invoice.orderId === order.id && invoice.status !== "void"),
  );
  const orderLookupById = new Map(orders.map((order) => [order.id, order] as const));
  const productLookupById = new Map(products.map((product) => [product.id, product] as const));
  const payableInvoices = invoices.filter((invoice) => invoice.outstandingAmount > 0);
  const collectionQueue = [...payableInvoices].sort((left, right) => {
    if (getPriorityRank(left.collectionPriority) !== getPriorityRank(right.collectionPriority)) {
      return getPriorityRank(right.collectionPriority) - getPriorityRank(left.collectionPriority);
    }

    if (left.nextActionDate !== right.nextActionDate) {
      return (left.nextActionDate ?? "9999-12-31").localeCompare(right.nextActionDate ?? "9999-12-31");
    }

    if (left.daysPastDue !== right.daysPastDue) {
      return right.daysPastDue - left.daysPastDue;
    }

    if (left.daysUntilDue !== right.daysUntilDue) {
      return left.daysUntilDue - right.daysUntilDue;
    }

    return left.issuedAt.localeCompare(right.issuedAt);
  });
  const actionableWorklist = collectionQueue.filter(
    (invoice) =>
      invoice.actionRequired !== "monitor" &&
      invoice.nextActionDate !== null &&
      invoice.nextActionDate <= todayDateInput,
  );
  const selectedInvoice = payableInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const selectedCollectionInvoice =
    invoices.find((invoice) => invoice.id === selectedCollectionInvoiceId) ?? null;
  const visibleCollectionActivities = selectedCollectionInvoiceId
    ? collectionActivities.filter((activity) => activity.invoiceId === selectedCollectionInvoiceId)
    : collectionActivities.slice(0, 8);
  const invoiceLookupById = new Map(invoices.map((invoice) => [invoice.id, invoice] as const));
  const returnCaseQueue = [...invoiceReturnAuthorizations].sort((left, right) => {
    if (getReturnCaseStatusRank(left.status) !== getReturnCaseStatusRank(right.status)) {
      return getReturnCaseStatusRank(right.status) - getReturnCaseStatusRank(left.status);
    }

    return right.authorizedAt.localeCompare(left.authorizedAt);
  });
  const normalizedReturnCaseSearch = returnCaseSearch.trim().toLowerCase();
  const visibleReturnCaseQueue = returnCaseQueue.filter((authorization) => {
    if (returnCaseStatusFilter !== "all" && authorization.status !== returnCaseStatusFilter) {
      return false;
    }

    if (returnCaseOwnerFilter !== "all" && authorization.actionOwner !== returnCaseOwnerFilter) {
      return false;
    }

    if (!normalizedReturnCaseSearch) {
      return true;
    }

    const linkedInvoice = invoiceLookupById.get(authorization.invoiceId);
    const searchableText = [
      authorization.caseNumber,
      authorization.invoiceNumber,
      authorization.orderNumber,
      linkedInvoice?.customerName,
      authorization.productCategoryName,
      authorization.productName,
      authorization.productSku,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedReturnCaseSearch);
  });
  const returnCaseFiltersActive =
    returnCaseStatusFilter !== "all" || returnCaseOwnerFilter !== "all" || normalizedReturnCaseSearch.length > 0;
  const openReturnCaseCount = returnCaseQueue.filter((item) =>
    ["authorized", "partially_received", "received"].includes(item.status),
  ).length;
  const warehousePendingReturnCaseCount = returnCaseQueue.filter(
    (item) => item.actionOwner === "warehouse",
  ).length;
  const founderPendingReturnCaseCount = returnCaseQueue.filter(
    (item) => item.actionOwner === "founder",
  ).length;
  const financePendingReturnCaseCount = returnCaseQueue.filter(
    (item) => item.actionOwner === "finance",
  ).length;
  const closedReturnCaseCount = returnCaseQueue.filter((item) => item.status === "closed").length;
  const settledReturnCaseCount = returnCaseQueue.filter((item) => item.status === "settled").length;
  const creditTargetOrder = invoiceBeingCredited ? orderLookupById.get(invoiceBeingCredited.orderId) ?? null : null;
  const remainingCreditQuantity = invoiceBeingCredited
    ? Math.max((creditTargetOrder?.quantity ?? invoiceBeingCredited.creditedQuantity) - invoiceBeingCredited.creditedQuantity, 0)
    : 0;
  const returnAuthorizationTargetOrder = invoiceBeingAuthorizedForReturn
    ? orderLookupById.get(invoiceBeingAuthorizedForReturn.orderId) ?? null
    : null;
  const remainingReturnAuthorizationQuantity = invoiceBeingAuthorizedForReturn
    ? Math.max(
        (returnAuthorizationTargetOrder?.quantity ?? invoiceBeingAuthorizedForReturn.returnedQuantity) -
          invoiceBeingAuthorizedForReturn.returnedQuantity,
        0,
      )
    : 0;
  const remainingReturnReceiptQuantity = invoiceBeingReturned
    ? Math.max(
        invoiceBeingReturned.openReturnAuthorizationId
          ? invoiceBeingReturned.returnAuthorizationRequestedQuantity -
              invoiceBeingReturned.returnAuthorizationReceivedQuantity
          : 0,
        0,
      )
    : 0;
  const selectedPriorVoidedInvoice =
    invoices
      .filter((invoice) => invoice.orderId === selectedInvoiceOrderId && invoice.status === "void")
      .sort((left, right) => right.revisionNumber - left.revisionNumber)[0] ?? null;
  const selectedInvoiceOrder = selectedInvoiceOrderId ? orderLookupById.get(selectedInvoiceOrderId) ?? null : null;
  const selectedInvoiceProduct = selectedInvoiceOrder
    ? productLookupById.get(selectedInvoiceOrder.productId) ?? null
    : null;
  const isAmendModalOpen = invoiceBeingAmended !== null;
  const isCreditModalOpen = invoiceBeingCredited !== null;
  const isReturnAuthorizationModalOpen = invoiceBeingAuthorizedForReturn !== null;
  const isReturnAuthorizationCloseModalOpen = invoiceBeingClosedForReturn !== null;
  const isReturnAuthorizationReopenModalOpen = invoiceBeingReopenedForReturn !== null;
  const isReturnReceiptModalOpen = invoiceBeingReturned !== null;

  const onCreateInvoice: FormProps<InvoiceFormShape>["onFinish"] = async (values) => {
    try {
      await createInvoiceRecord(values);
      invoiceForm.resetFields();
      invoiceForm.setFieldsValue({
        taxRatePercent: 10,
        issueDate: getTodayDateInputValue(),
        paymentTermDays: 30,
        amendmentNote: "",
      });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onCreatePayment: FormProps<InvoicePaymentFormShape>["onFinish"] = async (values) => {
    try {
      await createInvoicePaymentRecord(values);
      paymentForm.resetFields();
      paymentForm.setFieldsValue({ method: "bank_transfer" });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  function openAmendInvoiceModal(invoice: InvoiceRecord): void {
    setInvoiceBeingAmended(invoice);
    amendInvoiceForm.setFieldsValue({
      invoiceId: invoice.id,
      issueDate: invoice.issuedAt.slice(0, 10),
      paymentTermDays: invoice.paymentTermDays,
      taxRatePercent: invoice.taxRatePercent,
      amendmentNote: "",
    });
  }

  function closeAmendInvoiceModal(): void {
    setInvoiceBeingAmended(null);
    amendInvoiceForm.resetFields();
  }

  function openCreditInvoiceModal(invoice: InvoiceRecord): void {
    setInvoiceBeingCredited(invoice);
    creditInvoiceForm.setFieldsValue({
      invoiceId: invoice.id,
      method: "bank_transfer",
      creditQuantity: 1,
      creditMode: "restock",
      creditNote: "",
    });
  }

  function closeCreditInvoiceModal(): void {
    setInvoiceBeingCredited(null);
    creditInvoiceForm.resetFields();
  }

  function openReturnAuthorizationModal(invoice: InvoiceRecord): void {
    const relatedOrder = orderLookupById.get(invoice.orderId) ?? null;
    setInvoiceBeingAuthorizedForReturn(invoice);
    returnAuthorizationForm.setFieldsValue({
      invoiceId: invoice.id,
      quantityAuthorized: relatedOrder ? Math.max(relatedOrder.quantity - invoice.returnedQuantity, 1) : 1,
      note: "",
    });
  }

  function closeReturnAuthorizationModal(): void {
    setInvoiceBeingAuthorizedForReturn(null);
    returnAuthorizationForm.resetFields();
  }

  function openReturnAuthorizationUpdateModal(invoice: InvoiceRecord): void {
    setInvoiceBeingUpdatedForReturn(invoice);
    returnAuthorizationUpdateForm.setFieldsValue({
      invoiceId: invoice.id,
      quantityAuthorized: invoice.returnAuthorizationRequestedQuantity,
      note: invoice.returnAuthorizationNote ?? "",
    });
  }

  function closeReturnAuthorizationUpdateModal(): void {
    setInvoiceBeingUpdatedForReturn(null);
    returnAuthorizationUpdateForm.resetFields();
  }

  function openReturnAuthorizationCloseModal(invoice: InvoiceRecord): void {
    setInvoiceBeingClosedForReturn(invoice);
    returnAuthorizationCloseForm.setFieldsValue({
      invoiceId: invoice.id,
      closeNote: "",
    });
  }

  function closeReturnAuthorizationCloseModal(): void {
    setInvoiceBeingClosedForReturn(null);
    returnAuthorizationCloseForm.resetFields();
  }

  function openReturnAuthorizationReopenModal(invoice: InvoiceRecord): void {
    setInvoiceBeingReopenedForReturn(invoice);
    returnAuthorizationReopenForm.setFieldsValue({
      invoiceId: invoice.id,
      reopenNote: "",
    });
  }

  function closeReturnAuthorizationReopenModal(): void {
    setInvoiceBeingReopenedForReturn(null);
    returnAuthorizationReopenForm.resetFields();
  }

  function openReturnReceiptModal(invoice: InvoiceRecord): void {
    setInvoiceBeingReturned(invoice);
    returnReceiptForm.setFieldsValue({
      invoiceId: invoice.id,
      quantityReturned: 1,
      note: "",
    });
  }

  function closeReturnReceiptModal(): void {
    setInvoiceBeingReturned(null);
    returnReceiptForm.resetFields();
  }

  const onAmendInvoice: FormProps<AmendInvoiceFormShape>["onFinish"] = async (values) => {
    try {
      await amendInvoiceRecord({
        invoiceId: values.invoiceId,
        issueDate: values.issueDate,
        paymentTermDays: values.paymentTermDays,
        taxRatePercent: values.taxRatePercent,
        amendmentNote: values.amendmentNote,
      });
      closeAmendInvoiceModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onVoidInvoice = async (values: InvoiceVoidFormShape): Promise<void> => {
    try {
      await voidInvoiceRecord(values);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onCreditInvoice: FormProps<CreditInvoiceFormShape>["onFinish"] = async (values) => {
    try {
      await creditInvoiceRecord({
        invoiceId: values.invoiceId,
        method: values.method,
        creditQuantity: values.creditQuantity,
        creditMode: values.creditMode,
        creditNote: values.creditNote,
      });
      closeCreditInvoiceModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onCreateReturnAuthorization: FormProps<ReturnAuthorizationFormShape>["onFinish"] = async (values) => {
    try {
      await createInvoiceReturnAuthorizationRecord({
        invoiceId: values.invoiceId,
        quantityAuthorized: values.quantityAuthorized,
        note: values.note,
      });
      closeReturnAuthorizationModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onUpdateReturnAuthorization: FormProps<ReturnAuthorizationUpdateFormShape>["onFinish"] = async (values) => {
    try {
      await updateInvoiceReturnAuthorizationRecord({
        invoiceId: values.invoiceId,
        quantityAuthorized: values.quantityAuthorized,
        note: values.note,
      });
      closeReturnAuthorizationUpdateModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onCloseReturnAuthorization: FormProps<ReturnAuthorizationCloseFormShape>["onFinish"] = async (values) => {
    try {
      await closeInvoiceReturnAuthorizationRecord({
        invoiceId: values.invoiceId,
        closeNote: values.closeNote,
      });
      closeReturnAuthorizationCloseModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onReopenReturnAuthorization: FormProps<ReturnAuthorizationReopenFormShape>["onFinish"] = async (values) => {
    try {
      await reopenInvoiceReturnAuthorizationRecord({
        invoiceId: values.invoiceId,
        reopenNote: values.reopenNote,
      });
      closeReturnAuthorizationReopenModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onRecordReturnReceipt: FormProps<ReturnReceiptFormShape>["onFinish"] = async (values) => {
    try {
      await recordInvoiceReturnReceiptRecord({
        invoiceId: values.invoiceId,
        quantityReturned: values.quantityReturned,
        note: values.note,
      });
      closeReturnReceiptModal();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onReopenInvoice = async (values: InvoiceReopenFormShape): Promise<void> => {
    try {
      await reopenInvoiceRecord(values);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onSaveCollectionFollowUp: FormProps<InvoiceCollectionFormShape>["onFinish"] = async (values) => {
    try {
      await updateInvoiceCollectionRecord({
        invoiceId: values.invoiceId,
        followUpStatus: values.followUpStatus,
        actionRequired: values.actionRequired,
        promisedPaymentDate: values.promisedPaymentDate || null,
        nextActionDate: values.nextActionDate || null,
        collectionNote: values.collectionNote.trim(),
      });
      collectionForm.resetFields();
      collectionForm.setFieldsValue({
        followUpStatus: "new",
        actionRequired: "monitor",
        promisedPaymentDate: "",
        nextActionDate: "",
        collectionNote: "",
      });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  async function onResolveCollectionAction(invoiceId: string): Promise<void> {
    try {
      await resolveInvoiceCollectionActionRecord({ invoiceId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  function formatTimestamp(value: string | null): string {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatDate(value: string | null): string {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  return (
    <div className="page-stack workspace-page">
      <Modal
        open={isAmendModalOpen}
        title={invoiceBeingAmended ? t("invoices.amendTitle", { number: invoiceBeingAmended.invoiceNumber }) : t("invoices.amendAction")}
        onCancel={closeAmendInvoiceModal}
        footer={null}
        forceRender
      >
        <Form<AmendInvoiceFormShape> form={amendInvoiceForm} layout="vertical" onFinish={onAmendInvoice}>
          <Form.Item<AmendInvoiceFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<AmendInvoiceFormShape>
            label={t("invoices.issueDate")}
            name="issueDate"
            rules={[{ required: true }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item<AmendInvoiceFormShape>
            label={t("invoices.paymentTermDays")}
            name="paymentTermDays"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={365} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item<AmendInvoiceFormShape>
            label={t("invoices.taxRate")}
            name="taxRatePercent"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} max={100} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item<AmendInvoiceFormShape>
            label={t("invoices.amendmentNote")}
            name="amendmentNote"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingAmended
                ? t("invoices.amendmentNoteActiveHint", {
                    number: invoiceBeingAmended.invoiceNumber,
                  })
                : t("invoices.amendmentNoteHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.amendmentNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeAmendInvoiceModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.amendSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={isCreditModalOpen}
        title={
          invoiceBeingCredited
            ? t("invoices.creditTitle", { number: invoiceBeingCredited.invoiceNumber })
            : t("invoices.creditAction")
        }
        onCancel={closeCreditInvoiceModal}
        footer={null}
        forceRender
      >
        <Form<CreditInvoiceFormShape> form={creditInvoiceForm} layout="vertical" onFinish={onCreditInvoice}>
          <Form.Item<CreditInvoiceFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<CreditInvoiceFormShape>
            label={t("invoices.method")}
            name="method"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "bank_transfer", label: t("invoices.methodBankTransfer") },
                { value: "cash", label: t("invoices.methodCash") },
                { value: "card", label: t("invoices.methodCard") },
              ]}
            />
          </Form.Item>

          <Form.Item<CreditInvoiceFormShape>
            label={t("invoices.creditQuantity")}
            name="creditQuantity"
            rules={[{ required: true }]}
            extra={
              invoiceBeingCredited
                ? t("invoices.creditQuantityHint", {
                    number: invoiceBeingCredited.invoiceNumber,
                    count: remainingCreditQuantity,
                  })
                : t("invoices.creditQuantityGenericHint")
            }
          >
            <InputNumber
              min={1}
              max={Math.max(remainingCreditQuantity, 1)}
              precision={0}
              placeholder={t("invoices.creditQuantityPlaceholder")}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item<CreditInvoiceFormShape>
            label={t("invoices.creditMode")}
            name="creditMode"
            rules={[{ required: true }]}
            extra={
              selectedCreditMode === "financial_only"
                ? t("invoices.creditModeFinancialHint")
                : t("invoices.creditModeRestockHint")
            }
          >
            <Select
              options={[
                { value: "restock", label: t("invoices.creditModeRestock") },
                { value: "financial_only", label: t("invoices.creditModeFinancialOnly") },
              ]}
            />
          </Form.Item>

          <Form.Item<CreditInvoiceFormShape>
            label={t("invoices.creditNote")}
            name="creditNote"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingCredited
                ? t("invoices.creditNoteHint", { number: invoiceBeingCredited.invoiceNumber })
                : t("invoices.creditNoteGenericHint")
            }
          >
            <TextArea
              rows={3}
              maxLength={240}
              placeholder={
                selectedCreditMode === "financial_only"
                  ? t("invoices.creditNoteFinancialPlaceholder")
                  : t("invoices.creditNotePlaceholder")
              }
            />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeCreditInvoiceModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.creditSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={isReturnAuthorizationModalOpen}
        title={
          invoiceBeingAuthorizedForReturn
            ? t("invoices.returnAuthorizationTitle", { number: invoiceBeingAuthorizedForReturn.invoiceNumber })
            : t("invoices.returnAuthorizationAction")
        }
        onCancel={closeReturnAuthorizationModal}
        footer={null}
        forceRender
      >
        <Form<ReturnAuthorizationFormShape>
          form={returnAuthorizationForm}
          layout="vertical"
          onFinish={onCreateReturnAuthorization}
        >
          <Form.Item<ReturnAuthorizationFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<ReturnAuthorizationFormShape>
            label={t("invoices.returnAuthorizationQuantity")}
            name="quantityAuthorized"
            rules={[{ required: true }]}
            extra={
              invoiceBeingAuthorizedForReturn
                ? t("invoices.returnAuthorizationQuantityHint", {
                    number: invoiceBeingAuthorizedForReturn.invoiceNumber,
                    count: remainingReturnAuthorizationQuantity,
                  })
                : t("invoices.returnAuthorizationQuantityGenericHint")
            }
          >
            <InputNumber
              min={1}
              max={Math.max(remainingReturnAuthorizationQuantity, 1)}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item<ReturnAuthorizationFormShape>
            label={t("invoices.returnAuthorizationNote")}
            name="note"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingAuthorizedForReturn
                ? t("invoices.returnAuthorizationNoteHint", {
                    number: invoiceBeingAuthorizedForReturn.invoiceNumber,
                  })
                : t("invoices.returnAuthorizationNoteGenericHint")
            }
          >
            <TextArea
              rows={3}
              maxLength={240}
              placeholder={t("invoices.returnAuthorizationNotePlaceholder")}
            />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeReturnAuthorizationModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.returnAuthorizationSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={invoiceBeingUpdatedForReturn !== null}
        title={
          invoiceBeingUpdatedForReturn
            ? t("invoices.returnAuthorizationAmendTitle", { number: invoiceBeingUpdatedForReturn.invoiceNumber })
            : t("invoices.returnAuthorizationAmendAction")
        }
        onCancel={closeReturnAuthorizationUpdateModal}
        footer={null}
        forceRender
      >
        <Form<ReturnAuthorizationUpdateFormShape>
          form={returnAuthorizationUpdateForm}
          layout="vertical"
          onFinish={onUpdateReturnAuthorization}
        >
          <Form.Item<ReturnAuthorizationUpdateFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<ReturnAuthorizationUpdateFormShape>
            label={t("invoices.returnAuthorizationQuantity")}
            name="quantityAuthorized"
            rules={[{ required: true }]}
            extra={
              invoiceBeingUpdatedForReturn
                ? t("invoices.returnAuthorizationAmendQuantityHint", {
                    number: invoiceBeingUpdatedForReturn.invoiceNumber,
                    count: orderLookupById.get(invoiceBeingUpdatedForReturn.orderId)?.quantity ?? 0,
                  })
                : t("invoices.returnAuthorizationAmendQuantityGenericHint")
            }
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item<ReturnAuthorizationUpdateFormShape>
            label={t("invoices.returnAuthorizationNote")}
            name="note"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingUpdatedForReturn
                ? t("invoices.returnAuthorizationAmendNoteHint", {
                    number: invoiceBeingUpdatedForReturn.invoiceNumber,
                  })
                : t("invoices.returnAuthorizationAmendNoteGenericHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.returnAuthorizationAmendNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeReturnAuthorizationUpdateModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.returnAuthorizationAmendSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={isReturnAuthorizationCloseModalOpen}
        title={
          invoiceBeingClosedForReturn
            ? t("invoices.returnAuthorizationCloseTitle", { number: invoiceBeingClosedForReturn.invoiceNumber })
            : t("invoices.returnAuthorizationCloseAction")
        }
        onCancel={closeReturnAuthorizationCloseModal}
        footer={null}
        forceRender
      >
        <Form<ReturnAuthorizationCloseFormShape>
          form={returnAuthorizationCloseForm}
          layout="vertical"
          onFinish={onCloseReturnAuthorization}
        >
          <Form.Item<ReturnAuthorizationCloseFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<ReturnAuthorizationCloseFormShape>
            label={t("invoices.returnAuthorizationCloseNote")}
            name="closeNote"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingClosedForReturn
                ? t("invoices.returnAuthorizationCloseNoteHint", {
                    number: invoiceBeingClosedForReturn.invoiceNumber,
                  })
                : t("invoices.returnAuthorizationCloseNoteGenericHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.returnAuthorizationCloseNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeReturnAuthorizationCloseModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.returnAuthorizationCloseSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={isReturnAuthorizationReopenModalOpen}
        title={
          invoiceBeingReopenedForReturn
            ? t("invoices.returnAuthorizationReopenTitle", { number: invoiceBeingReopenedForReturn.invoiceNumber })
            : t("invoices.returnAuthorizationReopenAction")
        }
        onCancel={closeReturnAuthorizationReopenModal}
        footer={null}
        forceRender
      >
        <Form<ReturnAuthorizationReopenFormShape>
          form={returnAuthorizationReopenForm}
          layout="vertical"
          onFinish={onReopenReturnAuthorization}
        >
          <Form.Item<ReturnAuthorizationReopenFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<ReturnAuthorizationReopenFormShape>
            label={t("invoices.returnAuthorizationReopenNote")}
            name="reopenNote"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingReopenedForReturn
                ? t("invoices.returnAuthorizationReopenNoteHint", {
                    number: invoiceBeingReopenedForReturn.invoiceNumber,
                  })
                : t("invoices.returnAuthorizationReopenNoteGenericHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.returnAuthorizationReopenNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeReturnAuthorizationReopenModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.returnAuthorizationReopenSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={isReturnReceiptModalOpen}
        title={
          invoiceBeingReturned
            ? t("invoices.returnReceiptTitle", { number: invoiceBeingReturned.invoiceNumber })
            : t("invoices.returnReceiptAction")
        }
        onCancel={closeReturnReceiptModal}
        footer={null}
        forceRender
      >
        <Form<ReturnReceiptFormShape>
          form={returnReceiptForm}
          layout="vertical"
          onFinish={onRecordReturnReceipt}
        >
          <Form.Item<ReturnReceiptFormShape> name="invoiceId" hidden>
            <Input />
          </Form.Item>

          <Form.Item<ReturnReceiptFormShape>
            label={t("invoices.returnReceiptQuantity")}
            name="quantityReturned"
            rules={[{ required: true }]}
            extra={
              invoiceBeingReturned
                ? t("invoices.returnReceiptQuantityHint", {
                    number: invoiceBeingReturned.invoiceNumber,
                    count: remainingReturnReceiptQuantity,
                  })
                : t("invoices.returnReceiptQuantityGenericHint")
            }
          >
            <InputNumber
              min={1}
              max={Math.max(remainingReturnReceiptQuantity, 1)}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item<ReturnReceiptFormShape>
            label={t("invoices.returnReceiptNote")}
            name="note"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingReturned
                ? t("invoices.returnReceiptNoteHint", { number: invoiceBeingReturned.invoiceNumber })
                : t("invoices.returnReceiptNoteGenericHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.returnReceiptNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeReturnReceiptModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.returnReceiptSubmit")}
            </Button>
          </div>
        </Form>
      </Modal>

      <div className="page-header">
        <div>
          <Title level={2}>{t("invoices.title")}</Title>
          <Paragraph type="secondary">{t("invoices.subtitle")}</Paragraph>
        </div>
      </div>

      <div className="page-toolbar">
        <span>{t("common.tenant")}</span>
        <Select
          value={selectedTenantId || undefined}
          placeholder={t("common.selectTenant")}
          style={{ minWidth: 260 }}
          options={tenants.map((tenant) => ({
            label: `${tenant.name} (${tenant.slug})`,
            value: tenant.id,
          }))}
          onChange={setSelectedTenantId}
        />
      </div>

      <div className="two-column">
        <div className="page-column-stack">
          <Card className="workspace-panel-card" title={t("invoices.createTitle")} data-testid="invoice-issue-card">
            {canIssueInvoices ? (
              <>
                <Form<InvoiceFormShape>
                  form={invoiceForm}
                  layout="vertical"
                  onFinish={onCreateInvoice}
                  initialValues={{
                    taxRatePercent: 10,
                    issueDate: getTodayDateInputValue(),
                    paymentTermDays: 30,
                    amendmentNote: "",
                  }}
                >
                  <Form.Item<InvoiceFormShape>
                    label={t("invoices.order")}
                    name="orderId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder={t("invoices.orderPlaceholder")}
                      options={availableOrders.map((order) => ({
                        label: `${order.orderNumber} - ${order.productCategoryName} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`,
                        value: order.id,
                      }))}
                    />
                  </Form.Item>
                  {selectedInvoiceOrder && selectedInvoiceProduct ? (
                    <div className="product-preview-card">
                      <ProductVisual imageUrl={selectedInvoiceProduct.imageUrl} name={selectedInvoiceProduct.name} />
                      <div className="product-preview-meta">
                        <strong>{selectedInvoiceProduct.name}</strong>
                        <span className="record-detail">
                          {selectedInvoiceOrder.orderNumber} · {selectedInvoiceProduct.sku}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <Form.Item<InvoiceFormShape>
                    label={t("invoices.issueDate")}
                    name="issueDate"
                    rules={[{ required: true }]}
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Form.Item<InvoiceFormShape>
                    label={t("invoices.paymentTermDays")}
                    name="paymentTermDays"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={365} precision={0} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item<InvoiceFormShape>
                    label={t("invoices.taxRate")}
                    name="taxRatePercent"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} max={100} precision={0} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item<InvoiceFormShape>
                    label={t("invoices.amendmentNote")}
                    name="amendmentNote"
                    rules={[{ max: 240 }]}
                    extra={
                      selectedPriorVoidedInvoice
                        ? t("invoices.amendmentNoteRequiredHint", {
                            number: selectedPriorVoidedInvoice.invoiceNumber,
                          })
                        : t("invoices.amendmentNoteHint")
                    }
                  >
                    <TextArea
                      rows={3}
                      maxLength={240}
                      placeholder={t("invoices.amendmentNotePlaceholder")}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!selectedTenantId || availableOrders.length === 0}
                    loading={isBusy}
                  >
                    {t("invoices.create")}
                  </Button>
                </Form>

                {selectedTenantId && availableOrders.length === 0 ? (
                  <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                    {t("invoices.noOrdersReady")}
                  </Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("accessDenied.actionRestricted")}
              </Paragraph>
            )}
          </Card>

          <Card className="workspace-panel-card" title={t("invoices.settlementTitle")} data-testid="invoice-payment-card">
            {canRecordPayments ? (
              <>
                <Form<InvoicePaymentFormShape>
                  form={paymentForm}
                  layout="vertical"
                  onFinish={onCreatePayment}
                  initialValues={{ method: "bank_transfer" }}
                >
                  <Form.Item<InvoicePaymentFormShape>
                    label={t("invoices.invoice")}
                    name="invoiceId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder={t("invoices.invoicePlaceholder")}
                      options={payableInvoices.map((invoice) => ({
                        label: `${invoice.invoiceNumber} - ${invoice.productCategoryName} - ${invoice.customerName} - ${formatCurrency(invoice.outstandingAmount)}`,
                        value: invoice.id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item<InvoicePaymentFormShape>
                    label={t("invoices.method")}
                    name="method"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={[
                        { label: t("invoices.methodBankTransfer"), value: "bank_transfer" },
                        { label: t("invoices.methodCash"), value: "cash" },
                        { label: t("invoices.methodCard"), value: "card" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item<InvoicePaymentFormShape>
                    label={t("invoices.amount")}
                    name="amount"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={1}
                      max={selectedInvoice?.outstandingAmount}
                      precision={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>

                  {selectedInvoice ? (
                    <Paragraph type="secondary" style={{ marginTop: 0 }}>
                      {t("invoices.outstandingLabel")} {formatCurrency(selectedInvoice.outstandingAmount)}
                    </Paragraph>
                  ) : null}

                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!selectedTenantId || payableInvoices.length === 0}
                    loading={isBusy}
                  >
                    {t("invoices.settle")}
                  </Button>
                </Form>

                {selectedTenantId && payableInvoices.length === 0 ? (
                  <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                    {t("invoices.noInvoicesDue")}
                  </Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("accessDenied.actionRestricted")}
              </Paragraph>
            )}
          </Card>

          <Card className="workspace-panel-card" title={t("invoices.followUpTitle")} data-testid="invoice-follow-up-card">
            {canManageCollections ? (
              <Form<InvoiceCollectionFormShape>
                form={collectionForm}
                layout="vertical"
                onFinish={onSaveCollectionFollowUp}
                initialValues={{
                  followUpStatus: "new",
                  actionRequired: "monitor",
                  promisedPaymentDate: "",
                  nextActionDate: "",
                  collectionNote: "",
                }}
              >
              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.invoice")}
                name="invoiceId"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={t("invoices.invoicePlaceholder")}
                  options={collectionQueue.map((invoice) => ({
                    label: `${invoice.invoiceNumber} - ${invoice.productCategoryName} - ${invoice.customerName} - ${formatCurrency(invoice.outstandingAmount)}`,
                    value: invoice.id,
                  }))}
                />
              </Form.Item>

              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.followUpStatus")}
                name="followUpStatus"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: t("invoices.followUpStatusNew"), value: "new" },
                    { label: t("invoices.followUpStatusContacted"), value: "contacted" },
                    { label: t("invoices.followUpStatusPromised"), value: "promised" },
                    { label: t("invoices.followUpStatusEscalated"), value: "escalated" },
                  ]}
                />
              </Form.Item>

              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.actionRequired")}
                name="actionRequired"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: t("invoices.actionMonitor"), value: "monitor" },
                    { label: t("invoices.actionCallCustomer"), value: "call_customer" },
                    { label: t("invoices.actionConfirmPayment"), value: "confirm_payment" },
                    { label: t("invoices.actionEscalateFounder"), value: "escalate_founder" },
                  ]}
                />
              </Form.Item>

              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.promisedPaymentDate")}
                name="promisedPaymentDate"
                rules={selectedFollowUpStatus === "promised" ? [{ required: true }] : []}
              >
                <Input type="date" />
              </Form.Item>

              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.nextActionDate")}
                name="nextActionDate"
                rules={selectedActionRequired !== "monitor" ? [{ required: true }] : []}
              >
                <Input type="date" />
              </Form.Item>

              <Form.Item<InvoiceCollectionFormShape>
                label={t("invoices.collectionNote")}
                name="collectionNote"
              >
                <TextArea rows={3} maxLength={240} placeholder={t("invoices.collectionNotePlaceholder")} />
              </Form.Item>

              {selectedCollectionInvoice ? (
                <Paragraph type="secondary" style={{ marginTop: 0 }}>
                  {t("invoices.outstandingLabel")} {formatCurrency(selectedCollectionInvoice.outstandingAmount)}
                </Paragraph>
              ) : null}

                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!selectedTenantId || collectionQueue.length === 0}
                  loading={isBusy}
                >
                  {t("invoices.saveFollowUp")}
                </Button>
              </Form>
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("accessDenied.actionRestricted")}
              </Paragraph>
            )}

            {selectedTenantId && collectionQueue.length === 0 ? (
              <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                {t("invoices.collectionEmpty")}
              </Paragraph>
            ) : null}
          </Card>

          <Card className="workspace-panel-card" title={t("invoices.worklistTitle")} data-testid="invoice-worklist-card">
            {selectedTenantId ? (
              actionableWorklist.length ? (
                <div className="collection-queue">
                  {actionableWorklist.map((invoice) => (
                    <div className="collection-queue-row" key={invoice.id}>
                      <div className="collection-queue-main">
                        <strong>{invoice.invoiceNumber}</strong>
                        <div className="record-detail">
                          <UserOutlined /> {invoice.customerName}
                        </div>
                        <div className="record-detail">
                          <AppstoreOutlined /> {invoice.productCategoryName} - {invoice.productName} ({invoice.productSku})
                        </div>
                        <div className="record-detail">
                          {t("invoices.dueDateLabel")} {formatDate(invoice.dueDate)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.outstandingLabel")} {formatCurrency(invoice.outstandingAmount)}
                        </div>
                        <div className="record-detail">
                          <PhoneOutlined /> {t("invoices.actionRequiredLabel")}{" "}
                          {getActionRequiredLabel(invoice.actionRequired, t)}
                        </div>
                        {invoice.nextActionDate ? (
                          <div className="record-detail">
                            {t("invoices.nextActionDateLabel")} {formatDate(invoice.nextActionDate)}
                          </div>
                        ) : null}
                        {invoice.promisedPaymentDate ? (
                          <div className="record-detail">
                            {t("invoices.promisedPaymentDateLabel")} {formatDate(invoice.promisedPaymentDate)}
                          </div>
                        ) : null}
                        {invoice.collectionNote ? (
                          <div className="record-detail">
                            {t("invoices.collectionNoteLabel")} {invoice.collectionNote}
                          </div>
                        ) : null}
                      </div>
                      <div className="record-tag-stack">
                        <Tag color={getCollectionPriorityColor(invoice.collectionPriority)}>
                          {getCollectionPriorityLabel(invoice.collectionPriority, t)}
                        </Tag>
                        <Tag color={getCollectionStatusColor(invoice.collectionStatus)}>
                          {getCollectionStatusLabel(invoice, t)}
                        </Tag>
                        <Tag color={getFollowUpStatusColor(invoice.followUpStatus)}>
                          {getFollowUpStatusLabel(invoice.followUpStatus, t)}
                        </Tag>
                        {canManageCollections ? (
                          <Button
                            size="small"
                            icon={<CheckCircleOutlined />}
                            loading={isBusy}
                            onClick={() => void onResolveCollectionAction(invoice.id)}
                          >
                            {t("invoices.resolveAction")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description={t("invoices.worklistEmpty")} />
              )
            ) : (
              <Empty description={t("invoices.emptyNoTenant")} />
            )}
          </Card>

          <Card
            className="workspace-panel-card"
            title={t("invoices.returnCaseQueueTitle")}
            data-testid="invoice-return-case-queue-card"
          >
            {selectedTenantId ? (
              returnCaseQueue.length ? (
                <>
                  <Paragraph type="secondary" style={{ marginTop: 0 }}>
                    {t("invoices.returnCaseQueueSummary", {
                      open: openReturnCaseCount,
                      warehousePending: warehousePendingReturnCaseCount,
                      founderPending: founderPendingReturnCaseCount,
                      financePending: financePendingReturnCaseCount,
                      closed: closedReturnCaseCount,
                      settled: settledReturnCaseCount,
                    })}
                  </Paragraph>

                  <div className="page-toolbar" data-testid="invoice-return-case-filters">
                    <Select<ReturnCaseQueueOwnerFilter>
                      data-testid="invoice-return-case-owner-filter"
                      onChange={setReturnCaseOwnerFilter}
                      options={[
                        { label: t("invoices.returnCaseFilterAll"), value: "all" },
                        { label: getReturnCaseOwnerLabel("warehouse", t), value: "warehouse" },
                        { label: getReturnCaseOwnerLabel("founder", t), value: "founder" },
                        { label: getReturnCaseOwnerLabel("finance", t), value: "finance" },
                        { label: getReturnCaseOwnerLabel("none", t), value: "none" },
                      ]}
                      style={{ minWidth: 220 }}
                      value={returnCaseOwnerFilter}
                    />
                    <Select<ReturnCaseQueueStatusFilter>
                      data-testid="invoice-return-case-status-filter"
                      onChange={setReturnCaseStatusFilter}
                      options={[
                        { label: t("invoices.returnCaseFilterAll"), value: "all" },
                        { label: getReturnAuthorizationStatusLabel("authorized", t), value: "authorized" },
                        {
                          label: getReturnAuthorizationStatusLabel("partially_received", t),
                          value: "partially_received",
                        },
                        { label: getReturnAuthorizationStatusLabel("received", t), value: "received" },
                        { label: getReturnAuthorizationStatusLabel("settled", t), value: "settled" },
                        { label: getReturnAuthorizationStatusLabel("closed", t), value: "closed" },
                      ]}
                      style={{ minWidth: 220 }}
                      value={returnCaseStatusFilter}
                    />
                    <Input
                      allowClear
                      data-testid="invoice-return-case-search-input"
                      onChange={(event) => setReturnCaseSearch(event.target.value)}
                      placeholder={t("invoices.returnCaseSearchPlaceholder")}
                      style={{ flex: "1 1 280px", minWidth: 240 }}
                      value={returnCaseSearch}
                    />
                    <Tag color={returnCaseFiltersActive ? "blue" : "default"}>
                      {t("invoices.returnCaseShownCount", {
                        shown: visibleReturnCaseQueue.length,
                        total: returnCaseQueue.length,
                      })}
                    </Tag>
                  </div>

                  {visibleReturnCaseQueue.length ? (
                    <div className="record-stack">
                      {visibleReturnCaseQueue.map((authorization) => {
                      const linkedInvoice = invoiceLookupById.get(authorization.invoiceId) ?? null;
                      const linkedOrder = linkedInvoice
                        ? orderLookupById.get(linkedInvoice.orderId) ?? null
                        : null;
                      const remainingQueueReceiptQuantity = linkedInvoice
                        ? Math.max(
                            linkedInvoice.returnAuthorizationRequestedQuantity -
                              linkedInvoice.returnAuthorizationReceivedQuantity,
                            0,
                          )
                        : 0;
                      const remainingQueueCreditQuantity = linkedInvoice
                        ? Math.max(
                            (linkedOrder?.quantity ?? linkedInvoice.creditedQuantity) -
                              linkedInvoice.creditedQuantity,
                            0,
                          )
                        : 0;

                      return (
                        <div
                          className="record-row"
                          key={authorization.id}
                          data-testid={`invoice-return-case-row-${authorization.invoiceNumber}`}
                        >
                          <DeploymentUnitOutlined className="record-icon" />
                          <div className="record-content">
                            <strong>{authorization.invoiceNumber}</strong>
                            <div className="record-detail">
                              {t("invoices.returnAuthorizationCaseLabel")} {authorization.caseNumber}
                            </div>
                            <div className="record-detail">
                              <InboxOutlined /> {authorization.orderNumber}
                            </div>
                            {linkedInvoice ? (
                              <div className="record-detail">
                                <UserOutlined /> {linkedInvoice.customerName}
                              </div>
                            ) : null}
                            <div className="record-detail">
                              <AppstoreOutlined /> {authorization.productCategoryName} - {authorization.productName} (
                              {authorization.productSku})
                            </div>
                            <div className="record-detail">
                              <DeploymentUnitOutlined /> {t("invoices.returnAuthorizationLabel")}{" "}
                              {authorization.quantityReceived}/{authorization.quantityAuthorized}
                            </div>
                            <div className="record-detail">
                              {t("invoices.returnAuthorizationCreditedLabel")}{" "}
                              {authorization.quantityCredited}/{authorization.quantityAuthorized}
                            </div>
                            <div className="record-detail">
                              {t("invoices.returnCaseActionOwnerLabel")}{" "}
                              {getReturnCaseOwnerLabel(authorization.actionOwner, t)}
                            </div>
                            <div className="record-detail">
                              {t("invoices.returnCaseActionRequiredLabel")}{" "}
                              {getReturnCaseActionRequiredLabel(authorization.actionRequired, t)}
                            </div>
                            {authorization.quantityPendingReceipt > 0 ? (
                              <div className="record-detail">
                                {t("invoices.returnCasePendingReceiptLabel")}{" "}
                                {authorization.quantityPendingReceipt}
                              </div>
                            ) : null}
                            {authorization.quantityPendingCredit > 0 ? (
                              <div className="record-detail">
                                {t("invoices.returnCasePendingCreditLabel")}{" "}
                                {authorization.quantityPendingCredit}
                              </div>
                            ) : null}
                            <div className="record-detail">
                              {t("invoices.returnAuthorizationAuthorizedAtLabel")}{" "}
                              {formatTimestamp(authorization.authorizedAt)}
                            </div>
                            {authorization.closedAt ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationClosedAtLabel")}{" "}
                                {formatTimestamp(authorization.closedAt)}
                              </div>
                            ) : null}
                            {authorization.note ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationNoteLabel")} {authorization.note}
                              </div>
                            ) : null}
                            {linkedInvoice?.creditNote ? (
                              <div className="record-detail">
                                {t("invoices.creditNoteLabel")} {linkedInvoice.creditNote}
                              </div>
                            ) : null}
                            {authorization.closeNote ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationCloseNoteLabel")} {authorization.closeNote}
                              </div>
                            ) : null}
                            {authorization.pendingApprovalReason ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationPendingApprovalLabel")}{" "}
                                {authorization.pendingApprovalReason}
                              </div>
                            ) : null}
                            {authorization.pendingApprovalRequestedAt ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationPendingApprovalAtLabel")}{" "}
                                {formatTimestamp(authorization.pendingApprovalRequestedAt)}
                              </div>
                            ) : null}
                            <div className="record-tag-stack">
                              <Tag color={getReturnAuthorizationStatusColor(authorization.status)}>
                                {getReturnAuthorizationStatusLabel(authorization.status, t)}
                              </Tag>
                              <Tag color={getReturnCaseOwnerColor(authorization.actionOwner)}>
                                {getReturnCaseOwnerLabel(authorization.actionOwner, t)}
                              </Tag>
                              {linkedInvoice ? (
                                <Tag color={getCollectionStatusColor(linkedInvoice.collectionStatus)}>
                                  {getCollectionStatusLabel(linkedInvoice, t)}
                                </Tag>
                              ) : null}
                            </div>

                            {canIssueInvoices &&
                            linkedInvoice &&
                            linkedInvoice.status !== "void" &&
                            linkedInvoice.openReturnAuthorizationId === authorization.id ? (
                              <div className="record-actions">
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  loading={isBusy}
                                  data-testid="invoice-return-case-amend-button"
                                  onClick={() => openReturnAuthorizationUpdateModal(linkedInvoice)}
                                >
                                  {t("invoices.returnAuthorizationAmendAction")}
                                </Button>
                              </div>
                            ) : null}

                            {canIssueInvoices &&
                            linkedInvoice &&
                            linkedInvoice.status !== "void" &&
                            linkedInvoice.openReturnAuthorizationId === authorization.id &&
                            remainingQueueReceiptQuantity > 0 ? (
                              <div className="record-actions">
                                <Button
                                  size="small"
                                  icon={<InboxOutlined />}
                                  loading={isBusy}
                                  data-testid="invoice-return-case-receipt-button"
                                  onClick={() => openReturnReceiptModal(linkedInvoice)}
                                >
                                  {t("invoices.returnReceiptAction")}
                                </Button>
                              </div>
                            ) : null}

                            {canIssueInvoices &&
                            linkedInvoice &&
                            linkedInvoice.status !== "void" &&
                            authorization.status === "closed" ? (
                              <div className="record-actions">
                                <Button
                                  size="small"
                                  icon={<RollbackOutlined />}
                                  loading={isBusy}
                                  data-testid="invoice-return-case-reopen-button"
                                  onClick={() => openReturnAuthorizationReopenModal(linkedInvoice)}
                                >
                                  {t("invoices.returnAuthorizationReopenAction")}
                                </Button>
                              </div>
                            ) : null}

                            {canIssueInvoices &&
                            linkedInvoice &&
                            linkedInvoice.status !== "void" &&
                            linkedInvoice.openReturnAuthorizationId === authorization.id ? (
                              <div className="record-actions">
                                <Button
                                  size="small"
                                  icon={<StopOutlined />}
                                  loading={isBusy}
                                  data-testid="invoice-return-case-close-button"
                                  onClick={() => openReturnAuthorizationCloseModal(linkedInvoice)}
                                >
                                  {t("invoices.returnAuthorizationCloseAction")}
                                </Button>
                              </div>
                            ) : null}

                            {canIssueInvoices &&
                            linkedInvoice &&
                            (linkedInvoice.status === "paid" || linkedInvoice.status === "partially_credited") &&
                            remainingQueueCreditQuantity > 0 ? (
                              <div className="record-actions">
                                <Button
                                  size="small"
                                  icon={<RollbackOutlined />}
                                  loading={isBusy}
                                  data-testid="invoice-return-case-credit-button"
                                  onClick={() => openCreditInvoiceModal(linkedInvoice)}
                                >
                                  {t("invoices.creditAction")}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  ) : (
                    <Empty description={t("invoices.returnCaseQueueEmptyFiltered")} />
                  )}
                </>
              ) : (
                <Empty description={t("invoices.returnCaseQueueEmpty")} />
              )
            ) : (
              <Empty description={t("invoices.emptyNoTenant")} />
            )}
          </Card>

          <Card className="workspace-panel-card" title={t("invoices.activityTitle")} data-testid="invoice-activity-card">
            {selectedTenantId ? (
              visibleCollectionActivities.length ? (
                <div className="activity-feed">
                  {visibleCollectionActivities.map((activity) => {
                    const linkedInvoice = invoiceLookupById.get(activity.invoiceId);

                    return (
                      <div className="activity-row" key={activity.id}>
                        <div className="activity-main">
                          <strong>{activity.invoiceNumber}</strong>
                          <div className="record-detail">
                            <UserOutlined /> {activity.customerName}
                          </div>
                          {linkedInvoice ? (
                            <div className="record-detail">
                              <AppstoreOutlined /> {linkedInvoice.productCategoryName} - {linkedInvoice.productName} (
                              {linkedInvoice.productSku})
                            </div>
                          ) : null}
                          <div className="record-detail">
                            {t("invoices.activityOutstandingLabel")}{" "}
                            {formatCurrency(activity.outstandingAmountSnapshot)}
                          </div>
                          <div className="record-detail">
                            <PhoneOutlined /> {t("invoices.actionRequiredLabel")}{" "}
                            {getActionRequiredLabel(activity.actionRequired, t)}
                          </div>
                          {activity.nextActionDate ? (
                            <div className="record-detail">
                              {t("invoices.nextActionDateLabel")} {formatDate(activity.nextActionDate)}
                            </div>
                          ) : null}
                          {activity.promisedPaymentDate ? (
                            <div className="record-detail">
                              {t("invoices.promisedPaymentDateLabel")} {formatDate(activity.promisedPaymentDate)}
                            </div>
                          ) : null}
                          {activity.collectionNote ? (
                            <div className="record-detail">
                              {t("invoices.collectionNoteLabel")} {activity.collectionNote}
                            </div>
                          ) : null}
                        </div>
                        <div className="activity-meta">
                          <Tag color={getActivityStateColor(activity.actionState)}>
                            {getActivityStateLabel(activity.actionState, t)}
                          </Tag>
                          <Tag color={getCollectionPriorityColor(activity.collectionPriority)}>
                            {getCollectionPriorityLabel(activity.collectionPriority, t)}
                          </Tag>
                          <Tag color={getFollowUpStatusColor(activity.followUpStatus)}>
                            {getFollowUpStatusLabel(activity.followUpStatus, t)}
                          </Tag>
                          <div className="record-detail">
                            {t("invoices.activityRecordedAtLabel")} {formatTimestamp(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty description={t("invoices.activityEmpty")} />
              )
            ) : (
              <Empty description={t("invoices.emptyNoTenant")} />
            )}
          </Card>
        </div>

        <Card className="workspace-panel-card" title={t("invoices.listTitle")}>
          {selectedTenantId ? (
            invoices.length ? (
              <div className="record-stack">
                {invoices.map((invoice) => {
                  const relatedOrder = orderLookupById.get(invoice.orderId) ?? null;
                  const remainingInvoiceCreditQuantity = Math.max(
                    (relatedOrder?.quantity ?? invoice.creditedQuantity) - invoice.creditedQuantity,
                    0,
                  );
                  const remainingInvoiceReturnAuthorizationQuantity = Math.max(
                    (relatedOrder?.quantity ?? invoice.returnedQuantity) - invoice.returnedQuantity,
                    0,
                  );
                  const remainingInvoiceReturnReceiptQuantity = Math.max(
                    invoice.returnAuthorizationRequestedQuantity - invoice.returnAuthorizationReceivedQuantity,
                    0,
                  );

                  return (
                    <div className="record-row record-row--visual" key={invoice.id}>
                      <ProductVisual
                        imageUrl={productLookupById.get(invoice.productId)?.imageUrl ?? null}
                        name={invoice.productName}
                      />
                      <div className="record-content">
                        <strong>{invoice.invoiceNumber}</strong>
                        <div className="record-detail">
                          <InboxOutlined /> {invoice.orderNumber}
                        </div>
                        <div className="record-detail">
                          <UserOutlined /> {invoice.customerName}
                        </div>
                        <div className="record-detail">
                          <AppstoreOutlined /> {invoice.productCategoryName} - {invoice.productName} ({invoice.productSku})
                        </div>
                        {invoice.revisionNumber > 1 ? (
                          <div className="record-detail">
                            {t("invoices.amendmentRootLabel")} {invoice.amendmentRootInvoiceNumber}
                          </div>
                        ) : null}
                        {invoice.reissuedFromInvoiceNumber ? (
                          <div className="record-detail">
                            {t("invoices.reissuedFromLabel")} {invoice.reissuedFromInvoiceNumber}
                          </div>
                        ) : null}
                        {invoice.reissuedToInvoiceNumber ? (
                          <div className="record-detail">
                            {t("invoices.reissuedToLabel")} {invoice.reissuedToInvoiceNumber}
                          </div>
                        ) : null}
                        {invoice.amendmentNote ? (
                          <div className="record-detail">
                            {t("invoices.amendmentNoteLabel")} {invoice.amendmentNote}
                          </div>
                        ) : null}
                        {invoice.creditNote ? (
                          <div className="record-detail">
                            {t("invoices.creditNoteLabel")} {invoice.creditNote}
                          </div>
                        ) : null}
                        <div className="record-detail">
                          <Tag color={getInvoiceStatusColor(invoice.status)}>
                            {getInvoiceStatusLabel(invoice.status, t)}
                          </Tag>{" "}
                          <Tag color={getCollectionStatusColor(invoice.collectionStatus)}>
                            {getCollectionStatusLabel(invoice, t)}
                          </Tag>{" "}
                          <Tag color={getFollowUpStatusColor(invoice.followUpStatus)}>
                            {getFollowUpStatusLabel(invoice.followUpStatus, t)}
                          </Tag>{" "}
                          <Tag color={getCollectionPriorityColor(invoice.collectionPriority)}>
                            {getCollectionPriorityLabel(invoice.collectionPriority, t)}
                          </Tag>{" "}
                          {invoice.returnAuthorizationStatus ? (
                            <Tag color={getReturnAuthorizationStatusColor(invoice.returnAuthorizationStatus)}>
                              {getReturnAuthorizationStatusLabel(invoice.returnAuthorizationStatus, t)}
                            </Tag>
                          ) : null}{" "}
                          {invoice.revisionNumber > 1 ? (
                            <Tag color="purple">
                              {t("invoices.revisionValue", { count: invoice.revisionNumber })}
                            </Tag>
                          ) : null}{" "}
                          {t("invoices.taxSummary", { rate: invoice.taxRatePercent })} {formatCurrency(invoice.taxAmount)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.issuedOnLabel")} {formatDate(invoice.issuedAt)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.dueDateLabel")} {formatDate(invoice.dueDate)}
                        </div>
                        {invoice.promisedPaymentDate ? (
                          <div className="record-detail">
                            {t("invoices.promisedPaymentDateLabel")} {formatDate(invoice.promisedPaymentDate)}
                          </div>
                        ) : null}
                        {invoice.nextActionDate ? (
                          <div className="record-detail">
                            {t("invoices.nextActionDateLabel")} {formatDate(invoice.nextActionDate)}
                          </div>
                        ) : null}
                        <div className="record-detail">
                          <PhoneOutlined /> {t("invoices.actionRequiredLabel")}{" "}
                          {getActionRequiredLabel(invoice.actionRequired, t)}
                        </div>
                        {invoice.collectionNote ? (
                          <div className="record-detail">
                            {t("invoices.collectionNoteLabel")} {invoice.collectionNote}
                          </div>
                        ) : null}
                        <div className="record-detail">
                          {t("invoices.paymentTermLabel")}{" "}
                          {t("invoices.paymentTermValue", { count: invoice.paymentTermDays })}
                        </div>
                        <div className="record-detail">
                          {t("invoices.totalLabel")} {formatCurrency(invoice.totalAmount)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.paidLabel")} {formatCurrency(invoice.paidAmount)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.outstandingLabel")} {formatCurrency(invoice.outstandingAmount)}
                        </div>
                        {invoice.creditedAmount > 0 ? (
                          <div className="record-detail">
                            {t("invoices.creditedAmountLabel")} {formatCurrency(invoice.creditedAmount)}
                          </div>
                        ) : null}
                        {invoice.creditedQuantity > 0 ? (
                          <div className="record-detail">
                            {t("invoices.creditedQuantityLabel")} {invoice.creditedQuantity}
                          </div>
                        ) : null}
                        {invoice.returnedQuantity > 0 ? (
                          <div className="record-detail">
                            {t("invoices.returnedQuantityLabel")} {invoice.returnedQuantity}
                          </div>
                        ) : null}
                        {invoice.returnAuthorizationStatus ? (
                          <>
                            {invoice.returnAuthorizationCaseNumber ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationCaseLabel")}{" "}
                                {invoice.returnAuthorizationCaseNumber}
                              </div>
                            ) : null}
                            <div className="record-detail">
                              <DeploymentUnitOutlined /> {t("invoices.returnAuthorizationLabel")}{" "}
                              {invoice.returnAuthorizationReceivedQuantity}/
                              {invoice.returnAuthorizationRequestedQuantity}
                            </div>
                            <div className="record-detail">
                              {t("invoices.returnAuthorizationCreditedLabel")}{" "}
                              {invoice.returnAuthorizationCreditedQuantity}/
                              {invoice.returnAuthorizationRequestedQuantity}
                            </div>
                            <div className="record-detail">
                              {t("invoices.returnAuthorizationStatusLabel")}{" "}
                              {getReturnAuthorizationStatusLabel(invoice.returnAuthorizationStatus, t)}
                            </div>
                            {invoice.returnAuthorizationNote ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationNoteLabel")} {invoice.returnAuthorizationNote}
                              </div>
                            ) : null}
                            {invoice.returnAuthorizationCloseNote ? (
                              <div className="record-detail">
                                {t("invoices.returnAuthorizationCloseNoteLabel")}{" "}
                                {invoice.returnAuthorizationCloseNote}
                              </div>
                            ) : null}
                          </>
                        ) : null}
                        {invoice.creditedQuantity > invoice.returnedQuantity ? (
                          <div className="record-detail">
                            {t("invoices.creditWithoutReturnLabel")}{" "}
                            {invoice.creditedQuantity - invoice.returnedQuantity}
                          </div>
                        ) : null}
                        {invoice.returnReceiptCount > 0 ? (
                          <div className="record-detail">
                            <InboxOutlined /> {t("invoices.returnReceiptsLabel")} {invoice.returnReceiptCount}
                          </div>
                        ) : null}
                        <div className="record-detail">
                          <BankOutlined /> {t("invoices.paymentCountLabel")} {invoice.paymentCount}
                        </div>
                        <div className="record-detail">
                          {t("invoices.lastPaymentLabel")} {formatTimestamp(invoice.lastPaymentAt)}
                        </div>
                        {invoice.creditedAt ? (
                          <div className="record-detail">
                            {t("invoices.creditedAtLabel")} {formatTimestamp(invoice.creditedAt)}
                          </div>
                        ) : null}
                        {invoice.lastReturnReceiptAt ? (
                          <div className="record-detail">
                            {t("invoices.lastReturnReceiptLabel")} {formatTimestamp(invoice.lastReturnReceiptAt)}
                          </div>
                        ) : null}
                        {invoice.creditMethod ? (
                          <div className="record-detail">
                            {t("invoices.creditMethodLabel")}{" "}
                            {invoice.creditMethod === "cash"
                              ? t("invoices.methodCash")
                              : invoice.creditMethod === "card"
                                ? t("invoices.methodCard")
                                : t("invoices.methodBankTransfer")}
                          </div>
                        ) : null}
                        {invoice.lastCollectionUpdateAt ? (
                          <div className="record-detail">
                            {t("invoices.lastFollowUpLabel")} {formatTimestamp(invoice.lastCollectionUpdateAt)}
                          </div>
                        ) : null}
                        {canIssueInvoices && invoice.status === "issued" && invoice.paidAmount === 0 ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              loading={isBusy}
                              data-testid="invoice-amend-button"
                              onClick={() => openAmendInvoiceModal(invoice)}
                            >
                              {t("invoices.amendAction")}
                            </Button>
                            <Popconfirm
                              title={t("invoices.voidConfirm", { number: invoice.invoiceNumber })}
                              okText={t("invoices.voidAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void onVoidInvoice({ invoiceId: invoice.id })}
                            >
                              <Button
                                size="small"
                                icon={<StopOutlined />}
                                loading={isBusy}
                                data-testid="invoice-void-button"
                              >
                                {t("invoices.voidAction")}
                              </Button>
                            </Popconfirm>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status !== "void" &&
                        !invoice.openReturnAuthorizationId &&
                        invoice.returnAuthorizationStatus === "closed" ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<RollbackOutlined />}
                              loading={isBusy}
                              data-testid="invoice-return-authorization-reopen-button"
                              onClick={() => openReturnAuthorizationReopenModal(invoice)}
                            >
                              {t("invoices.returnAuthorizationReopenAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status !== "void" &&
                        !invoice.openReturnAuthorizationId &&
                        invoice.returnAuthorizationStatus !== "closed" &&
                        remainingInvoiceReturnAuthorizationQuantity > 0 ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<DeploymentUnitOutlined />}
                              loading={isBusy}
                              data-testid="invoice-return-authorization-button"
                              onClick={() => openReturnAuthorizationModal(invoice)}
                            >
                              {t("invoices.returnAuthorizationAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status !== "void" &&
                        invoice.openReturnAuthorizationId !== null ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              loading={isBusy}
                              data-testid="invoice-return-authorization-amend-button"
                              onClick={() => openReturnAuthorizationUpdateModal(invoice)}
                            >
                              {t("invoices.returnAuthorizationAmendAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status !== "void" &&
                        invoice.openReturnAuthorizationId !== null &&
                        remainingInvoiceReturnReceiptQuantity > 0 ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<InboxOutlined />}
                              loading={isBusy}
                              data-testid="invoice-return-receipt-button"
                              onClick={() => openReturnReceiptModal(invoice)}
                            >
                              {t("invoices.returnReceiptAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status !== "void" &&
                        invoice.openReturnAuthorizationId !== null ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<StopOutlined />}
                              loading={isBusy}
                              data-testid="invoice-return-authorization-close-button"
                              onClick={() => openReturnAuthorizationCloseModal(invoice)}
                            >
                              {t("invoices.returnAuthorizationCloseAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        (invoice.status === "paid" || invoice.status === "partially_credited") &&
                        remainingInvoiceCreditQuantity > 0 ? (
                          <div className="record-actions">
                            <Button
                              size="small"
                              icon={<RollbackOutlined />}
                              loading={isBusy}
                              data-testid="invoice-credit-button"
                              onClick={() => openCreditInvoiceModal(invoice)}
                            >
                              {t("invoices.creditAction")}
                            </Button>
                          </div>
                        ) : null}
                        {canIssueInvoices &&
                        invoice.status === "void" &&
                        !invoice.reissuedToInvoiceId &&
                        !invoice.reissuedToInvoiceNumber ? (
                          <div className="record-actions">
                            <Popconfirm
                              title={t("invoices.reopenConfirm", { number: invoice.invoiceNumber })}
                              okText={t("invoices.reopenAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void onReopenInvoice({ invoiceId: invoice.id })}
                            >
                              <Button
                                size="small"
                                icon={<CheckCircleOutlined />}
                                loading={isBusy}
                                data-testid="invoice-reopen-button"
                              >
                                {t("invoices.reopenAction")}
                              </Button>
                            </Popconfirm>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description={t("invoices.empty")} />
            )
          ) : (
            <Empty description={t("invoices.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
