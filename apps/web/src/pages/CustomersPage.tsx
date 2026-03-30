import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Select, Typography } from "antd";

import type { CreateCustomerInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type CustomerFormShape = Omit<CreateCustomerInput, "tenantId">;

export function CustomersPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    createCustomerRecord,
    customerStatements,
    customers,
    isBusy,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();
  const [form] = Form.useForm<CustomerFormShape>();

  const onFinish: FormProps<CustomerFormShape>["onFinish"] = async (values) => {
    try {
      await createCustomerRecord(values);
      form.resetFields();
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

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("customers.title")}</Title>
          <Paragraph type="secondary">
            {t("customers.subtitle")}
          </Paragraph>
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
        <Card title={t("customers.addTitle")}>
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
            <Button type="primary" htmlType="submit" disabled={!selectedTenantId} loading={isBusy}>
              {t("customers.add")}
            </Button>
          </Form>
        </Card>

        <Card title={t("customers.listTitle")}>
          {selectedTenantId ? (
            customers.length ? (
              <div className="record-stack">
                {customers.map((customer) => (
                  (() => {
                    const statement =
                      customerStatements.find((item) => item.customerId === customer.id) ?? null;

                    return (
                      <div className="record-row" key={customer.id}>
                        <div className="record-icon">
                          <UserOutlined />
                        </div>
                        <div>
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
                        </div>
                      </div>
                    );
                  })()
                ))}
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
