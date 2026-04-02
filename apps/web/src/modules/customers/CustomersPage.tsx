import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { FormProps } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Popconfirm, Select, Space, Typography } from "antd";

import type { CreateCustomerInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type CustomerFormShape = Omit<CreateCustomerInput, "tenantId">;

export function CustomersPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    createCustomerRecord,
    deleteCustomerRecord,
    customerStatements,
    customers,
    isBusy,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
    updateCustomerRecord,
  } = useWorkspace();
  const [form] = Form.useForm<CustomerFormShape>();
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  function resetForm(): void {
    setEditingCustomerId(null);
    form.resetFields();
  }

  const onFinish: FormProps<CustomerFormShape>["onFinish"] = async (values) => {
    try {
      if (editingCustomerId) {
        await updateCustomerRecord({
          customerId: editingCustomerId,
          ...values,
        });
      } else {
        await createCustomerRecord(values);
      }

      resetForm();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenantId]);

  useEffect(() => {
    if (editingCustomerId && !customers.some((customer) => customer.id === editingCustomerId)) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, editingCustomerId]);

  function startEditing(customerId: string): void {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      return;
    }

    setEditingCustomerId(customer.id);
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    });
  }

  async function removeCustomer(customerId: string): Promise<void> {
    try {
      await deleteCustomerRecord(customerId);
      if (editingCustomerId === customerId) {
        resetForm();
      }
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

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("customers.title")}</Title>
          <Paragraph type="secondary">{t("customers.subtitle")}</Paragraph>
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
        <Card
          className="workspace-panel-card"
          title={editingCustomerId ? t("customers.editTitle") : t("customers.addTitle")}
        >
          <Form<CustomerFormShape> form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item<CustomerFormShape> label={t("customers.name")} name="name" rules={[{ required: true }]}>
              <Input placeholder={t("customers.placeholderName")} />
            </Form.Item>
            <Form.Item<CustomerFormShape> label={t("customers.email")} name="email" rules={[{ required: true }]}>
              <Input autoComplete="email" placeholder={t("customers.placeholderEmail")} />
            </Form.Item>
            <Form.Item<CustomerFormShape> label={t("customers.phone")} name="phone">
              <Input placeholder={t("customers.placeholderPhone")} />
            </Form.Item>
            <Form.Item<CustomerFormShape> label={t("customers.city")} name="city">
              <Input placeholder={t("customers.placeholderCity")} />
            </Form.Item>
            <Space wrap>
              <Button
                data-testid="customer-submit-button"
                type="primary"
                htmlType="submit"
                disabled={!selectedTenantId}
                loading={isBusy}
              >
                {editingCustomerId ? t("common.saveChanges") : t("customers.add")}
              </Button>
              {editingCustomerId ? (
                <Button data-testid="customer-cancel-button" htmlType="button" onClick={resetForm}>
                  {t("common.cancel")}
                </Button>
              ) : null}
            </Space>
          </Form>
        </Card>

        <Card className="workspace-panel-card" title={t("customers.listTitle")}>
          {selectedTenantId ? (
            customers.length ? (
              <div className="record-stack">
                {customers.map((customer) => {
                  const statement =
                    customerStatements.find((item) => item.customerId === customer.id) ?? null;

                  return (
                    <div
                      className={`record-row${editingCustomerId === customer.id ? " is-editing" : ""}`}
                      key={customer.id}
                    >
                      <div className="record-icon">
                        <UserOutlined />
                      </div>
                      <div className="record-content">
                        <strong>{customer.name}</strong>
                        <div className="record-detail">
                          <MailOutlined /> {customer.email}
                        </div>
                        <div className="record-detail">
                          <PhoneOutlined /> {customer.phone || customer.city || t("customers.noExtraDetails")}
                        </div>
                        {statement ? (
                          <div className="customer-statement-grid">
                            <div className="customer-statement-item">
                              <span>{t("customers.statementInvoiced")}</span>
                              <strong>{formatCurrency(statement.invoicedAmount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statementCollected")}</span>
                              <strong>{formatCurrency(statement.cashCollectedAmount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statementOutstanding")}</span>
                              <strong>{formatCurrency(statement.outstandingAmount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statementInvoices")}</span>
                              <strong>{statement.invoiceCount}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statementCurrent")}</span>
                              <strong>{formatCurrency(statement.currentAmount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statement31To60")}</span>
                              <strong>{formatCurrency(statement.overdue31To60Amount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statement61To90")}</span>
                              <strong>{formatCurrency(statement.overdue61To90Amount)}</strong>
                            </div>
                            <div className="customer-statement-item">
                              <span>{t("customers.statementOver90")}</span>
                              <strong>{formatCurrency(statement.overdueOver90Amount)}</strong>
                            </div>
                            <div className="customer-statement-item customer-statement-item-wide">
                              <span>{t("customers.statementLastInvoice")}</span>
                              <strong>{formatTimestamp(statement.lastInvoiceAt)}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="record-detail">{t("customers.statementEmpty")}</div>
                        )}
                        <div className="record-actions">
                          <Button
                            data-testid="customer-edit-button"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => startEditing(customer.id)}
                          >
                            {t("common.edit")}
                          </Button>
                          <Popconfirm
                            title={t("customers.deleteConfirm", { name: customer.name })}
                            okText={t("common.delete")}
                            cancelText={t("common.cancel")}
                            onConfirm={() => void removeCustomer(customer.id)}
                          >
                            <Button
                              data-testid="customer-delete-button"
                              danger
                              icon={<DeleteOutlined />}
                              size="small"
                            >
                              {t("common.delete")}
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description={t("customers.empty")} />
            )
          ) : (
            <Empty description={t("customers.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
