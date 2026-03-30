import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { BarcodeOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Typography } from "antd";

import type { CreateProductInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type ProductFormShape = Omit<CreateProductInput, "tenantId">;

export function ProductsPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const {
    createProductRecord,
    isBusy,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();
  const [form] = Form.useForm<ProductFormShape>();

  const onFinish: FormProps<ProductFormShape>["onFinish"] = async (values) => {
    try {
      await createProductRecord(values);
      form.resetFields();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("products.title")}</Title>
          <Paragraph type="secondary">
            {t("products.subtitle")}
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
        <Card title={t("products.addTitle")}>
          <Form<ProductFormShape> form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item<ProductFormShape> label={t("products.sku")} name="sku" rules={[{ required: true }]}>
              <Input placeholder={t("products.placeholderSku")} />
            </Form.Item>
            <Form.Item<ProductFormShape> label={t("products.name")} name="name" rules={[{ required: true }]}>
              <Input placeholder={t("products.placeholderName")} />
            </Form.Item>
            <Form.Item<ProductFormShape> label={t("products.unitPrice")} name="unitPrice" rules={[{ required: true }]}>
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={!selectedTenantId} loading={isBusy}>
              {t("products.add")}
            </Button>
          </Form>
        </Card>

        <Card title={t("products.listTitle")}>
          {selectedTenantId ? (
            products.length ? (
              <div className="record-stack">
                {products.map((product) => (
                  <div className="record-row" key={product.id}>
                    <div className="record-icon">
                      <ShoppingOutlined />
                    </div>
                    <div>
                      <strong>{product.name}</strong>
                      <div className="record-detail">
                        <BarcodeOutlined /> {product.sku}
                      </div>
                      <div className="record-detail">{formatCurrency(product.unitPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("products.empty")} />
            )
          ) : (
            <Empty description={t("products.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
