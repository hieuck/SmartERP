import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { MailOutlined, PhoneOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Typography } from "antd";

import type { CreateSupplierInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type SupplierFormShape = Omit<CreateSupplierInput, "tenantId">;

export function SuppliersPage(): ReactElement {
  const { t } = useLocale();
  const {
    createSupplierRecord,
    isBusy,
    selectedTenantId,
    setSelectedTenantId,
    suppliers,
    tenants,
  } = useWorkspace();
  const [form] = Form.useForm<SupplierFormShape>();

  const onFinish: FormProps<SupplierFormShape>["onFinish"] = async (values) => {
    try {
      await createSupplierRecord(values);
      form.resetFields();
      form.setFieldsValue({ leadTimeDays: 7 });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("suppliers.title")}</Title>
          <Paragraph type="secondary">{t("suppliers.subtitle")}</Paragraph>
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
        <Card title={t("suppliers.addTitle")}>
          <Form<SupplierFormShape>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ leadTimeDays: 7 }}
          >
            <Form.Item<SupplierFormShape>
              label={t("suppliers.code")}
              name="supplierCode"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("suppliers.placeholderCode")} />
            </Form.Item>
            <Form.Item<SupplierFormShape>
              label={t("suppliers.name")}
              name="name"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("suppliers.placeholderName")} />
            </Form.Item>
            <Form.Item<SupplierFormShape>
              label={t("suppliers.email")}
              name="email"
              rules={[{ required: true }]}
            >
              <Input autoComplete="email" placeholder={t("suppliers.placeholderEmail")} />
            </Form.Item>
            <Form.Item<SupplierFormShape> label={t("suppliers.phone")} name="phone">
              <Input placeholder={t("suppliers.placeholderPhone")} />
            </Form.Item>
            <Form.Item<SupplierFormShape> label={t("suppliers.city")} name="city">
              <Input placeholder={t("suppliers.placeholderCity")} />
            </Form.Item>
            <Form.Item<SupplierFormShape>
              label={t("suppliers.leadTimeDays")}
              name="leadTimeDays"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={180} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={!selectedTenantId} loading={isBusy}>
              {t("suppliers.add")}
            </Button>
          </Form>
        </Card>

        <Card title={t("suppliers.listTitle")}>
          {selectedTenantId ? (
            suppliers.length ? (
              <div className="record-stack">
                {suppliers.map((supplier) => (
                  <div className="record-row" key={supplier.id}>
                    <div className="record-icon">
                      <TeamOutlined />
                    </div>
                    <div>
                      <strong>{supplier.name}</strong>
                      <div className="record-detail">{supplier.supplierCode}</div>
                      <div className="record-detail">
                        <MailOutlined /> {supplier.email}
                      </div>
                      <div className="record-detail">
                        <PhoneOutlined /> {supplier.phone || supplier.city || t("suppliers.noExtraDetails")}
                      </div>
                      <div className="record-detail">
                        {t("suppliers.leadTimeLabel")} {t("suppliers.leadTimeValue", { count: supplier.leadTimeDays })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("suppliers.empty")} />
            )
          ) : (
            <Empty description={t("suppliers.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
