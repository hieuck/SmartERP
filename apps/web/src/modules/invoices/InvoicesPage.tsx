import {
  AppstoreOutlined,
  BankOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
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
  CollectionActionRequired,
  CollectionActivityState,
  CollectionFollowUpStatus,
  CollectionPriority,
  CreditInvoiceInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  InvoiceRecord,
  ReopenInvoiceInput,
  UpdateInvoiceCollectionInput,
  VoidInvoiceInput,
} from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;
const { TextArea } = Input;

type InvoiceFormShape = Omit<CreateInvoiceInput, "tenantId">;
type AmendInvoiceFormShape = Omit<AmendInvoiceInput, "tenantId">;
type CreditInvoiceFormShape = Omit<CreditInvoiceInput, "tenantId">;
type InvoicePaymentFormShape = Omit<CreateInvoicePaymentInput, "tenantId">;
type InvoiceCollectionFormShape = Omit<UpdateInvoiceCollectionInput, "tenantId">;
type InvoiceReopenFormShape = Omit<ReopenInvoiceInput, "tenantId">;
type InvoiceVoidFormShape = Omit<VoidInvoiceInput, "tenantId">;

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

export function InvoicesPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    can,
    collectionActivities,
    amendInvoiceRecord,
    creditInvoiceRecord,
    createInvoicePaymentRecord,
    createInvoiceRecord,
    reopenInvoiceRecord,
    voidInvoiceRecord,
    updateInvoiceCollectionRecord,
    resolveInvoiceCollectionActionRecord,
    invoices,
    isBusy,
    orders,
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
  const [paymentForm] = Form.useForm<InvoicePaymentFormShape>();
  const [collectionForm] = Form.useForm<InvoiceCollectionFormShape>();
  const [invoiceBeingAmended, setInvoiceBeingAmended] = useState<InvoiceRecord | null>(null);
  const [invoiceBeingCredited, setInvoiceBeingCredited] = useState<InvoiceRecord | null>(null);
  const selectedInvoiceOrderId = Form.useWatch("orderId", invoiceForm);
  const selectedInvoiceId = Form.useWatch("invoiceId", paymentForm);
  const selectedCollectionInvoiceId = Form.useWatch("invoiceId", collectionForm);
  const selectedFollowUpStatus = Form.useWatch("followUpStatus", collectionForm);
  const selectedActionRequired = Form.useWatch("actionRequired", collectionForm);
  const todayDateInput = new Date().toISOString().slice(0, 10);

  const availableOrders = orders.filter(
    (order) =>
      order.status === "confirmed" &&
      !invoices.some((invoice) => invoice.orderId === order.id && invoice.status !== "void"),
  );
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
  const selectedPriorVoidedInvoice =
    invoices
      .filter((invoice) => invoice.orderId === selectedInvoiceOrderId && invoice.status === "void")
      .sort((left, right) => right.revisionNumber - left.revisionNumber)[0] ?? null;
  const isAmendModalOpen = invoiceBeingAmended !== null;
  const isCreditModalOpen = invoiceBeingCredited !== null;

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
      creditNote: "",
    });
  }

  function closeCreditInvoiceModal(): void {
    setInvoiceBeingCredited(null);
    creditInvoiceForm.resetFields();
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
        creditNote: values.creditNote,
      });
      closeCreditInvoiceModal();
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
            label={t("invoices.creditNote")}
            name="creditNote"
            rules={[{ required: true }, { max: 240 }]}
            extra={
              invoiceBeingCredited
                ? t("invoices.creditNoteHint", { number: invoiceBeingCredited.invoiceNumber })
                : t("invoices.creditNoteGenericHint")
            }
          >
            <TextArea rows={3} maxLength={240} placeholder={t("invoices.creditNotePlaceholder")} />
          </Form.Item>

          <div className="record-actions">
            <Button onClick={closeCreditInvoiceModal}>{t("common.cancel")}</Button>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("invoices.creditSubmit")}
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
          <Card className="workspace-panel-card" title={t("invoices.createTitle")}>
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

          <Card className="workspace-panel-card" title={t("invoices.settlementTitle")}>
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

          <Card className="workspace-panel-card" title={t("invoices.followUpTitle")}>
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

          <Card className="workspace-panel-card" title={t("invoices.worklistTitle")}>
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

          <Card className="workspace-panel-card" title={t("invoices.activityTitle")}>
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
                {invoices.map((invoice) => (
                  <div className="record-row" key={invoice.id}>
                    <div className="record-icon">
                      <FileTextOutlined />
                    </div>
                    <div>
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
                        {t("invoices.paymentTermLabel")} {t("invoices.paymentTermValue", { count: invoice.paymentTermDays })}
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
                      {canIssueInvoices && invoice.status === "paid" ? (
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
                ))}
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
