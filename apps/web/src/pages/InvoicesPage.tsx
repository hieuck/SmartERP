import { BankOutlined, FileTextOutlined, InboxOutlined, UserOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Tag, Typography } from "antd";

import type {
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  InvoiceRecord,
} from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type InvoiceFormShape = Omit<CreateInvoiceInput, "tenantId">;
type InvoicePaymentFormShape = Omit<CreateInvoicePaymentInput, "tenantId">;

function getTodayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInvoiceStatusColor(status: InvoiceRecord["status"]): string {
  if (status === "paid") {
    return "green";
  }

  if (status === "partially_paid") {
    return "blue";
  }

  return "gold";
}

function getInvoiceStatusLabel(status: InvoiceRecord["status"], t: ReturnType<typeof useLocale>["t"]): string {
  if (status === "paid") {
    return t("invoices.statusPaid");
  }

  if (status === "partially_paid") {
    return t("invoices.statusPartiallyPaid");
  }

  return t("invoices.statusIssued");
}

function getCollectionStatusColor(status: InvoiceRecord["collectionStatus"]): string {
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

export function InvoicesPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    createInvoicePaymentRecord,
    createInvoiceRecord,
    invoices,
    isBusy,
    orders,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();

  const [invoiceForm] = Form.useForm<InvoiceFormShape>();
  const [paymentForm] = Form.useForm<InvoicePaymentFormShape>();
  const selectedInvoiceId = Form.useWatch("invoiceId", paymentForm);

  const availableOrders = orders.filter(
    (order) => !invoices.some((invoice) => invoice.orderId === order.id),
  );
  const payableInvoices = invoices.filter((invoice) => invoice.outstandingAmount > 0);
  const collectionQueue = [...payableInvoices].sort((left, right) => {
    if (left.daysPastDue !== right.daysPastDue) {
      return right.daysPastDue - left.daysPastDue;
    }

    if (left.daysUntilDue !== right.daysUntilDue) {
      return left.daysUntilDue - right.daysUntilDue;
    }

    return left.issuedAt.localeCompare(right.issuedAt);
  });
  const selectedInvoice = payableInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;

  const onCreateInvoice: FormProps<InvoiceFormShape>["onFinish"] = async (values) => {
    try {
      await createInvoiceRecord(values);
      invoiceForm.resetFields();
      invoiceForm.setFieldsValue({
        taxRatePercent: 10,
        issueDate: getTodayDateInputValue(),
        paymentTermDays: 30,
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

  function formatTimestamp(value: string | null): string {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  return (
    <div className="page-stack">
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
          <Card title={t("invoices.createTitle")}>
            <Form<InvoiceFormShape>
              form={invoiceForm}
              layout="vertical"
              onFinish={onCreateInvoice}
              initialValues={{
                taxRatePercent: 10,
                issueDate: getTodayDateInputValue(),
                paymentTermDays: 30,
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
                    label: `${order.orderNumber} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`,
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
          </Card>

          <Card title={t("invoices.settlementTitle")}>
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
                    label: `${invoice.invoiceNumber} - ${invoice.customerName} - ${formatCurrency(invoice.outstandingAmount)}`,
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
          </Card>

          <Card title={t("invoices.collectionTitle")}>
            {selectedTenantId ? (
              collectionQueue.length ? (
                <div className="collection-queue">
                  {collectionQueue.map((invoice) => (
                    <div className="collection-queue-row" key={invoice.id}>
                      <div className="collection-queue-main">
                        <strong>{invoice.invoiceNumber}</strong>
                        <div className="record-detail">
                          <UserOutlined /> {invoice.customerName}
                        </div>
                        <div className="record-detail">
                          {t("invoices.dueDateLabel")} {formatDate(invoice.dueDate)}
                        </div>
                        <div className="record-detail">
                          {t("invoices.outstandingLabel")} {formatCurrency(invoice.outstandingAmount)}
                        </div>
                      </div>
                      <Tag color={getCollectionStatusColor(invoice.collectionStatus)}>
                        {getCollectionStatusLabel(invoice, t)}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description={t("invoices.collectionEmpty")} />
              )
            ) : (
              <Empty description={t("invoices.emptyNoTenant")} />
            )}
          </Card>
        </div>

        <Card title={t("invoices.listTitle")}>
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
                        <Tag color={getInvoiceStatusColor(invoice.status)}>
                          {getInvoiceStatusLabel(invoice.status, t)}
                        </Tag>{" "}
                        <Tag color={getCollectionStatusColor(invoice.collectionStatus)}>
                          {getCollectionStatusLabel(invoice, t)}
                        </Tag>{" "}
                        {t("invoices.taxSummary", { rate: invoice.taxRatePercent })} {formatCurrency(invoice.taxAmount)}
                      </div>
                      <div className="record-detail">
                        {t("invoices.issuedOnLabel")} {formatDate(invoice.issuedAt)}
                      </div>
                      <div className="record-detail">
                        {t("invoices.dueDateLabel")} {formatDate(invoice.dueDate)}
                      </div>
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
