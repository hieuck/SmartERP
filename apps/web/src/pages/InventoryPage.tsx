import { DatabaseOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Button, Card, Empty, Form, InputNumber, Select, Space, Tag, Typography } from "antd";

import type { CreateInventoryAdjustmentInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type InventoryAdjustmentFormShape = Omit<CreateInventoryAdjustmentInput, "tenantId">;

export function InventoryPage(): ReactElement {
  const { t } = useLocale();
  const {
    createInventoryAdjustmentRecord,
    inventories,
    isBusy,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();

  const [form] = Form.useForm<InventoryAdjustmentFormShape>();

  const onFinish: FormProps<InventoryAdjustmentFormShape>["onFinish"] = async (values) => {
    try {
      await createInventoryAdjustmentRecord(values);
      form.resetFields();
      form.setFieldsValue({ direction: "in", quantity: 1 });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("inventory.title")}</Title>
          <Paragraph type="secondary">{t("inventory.subtitle")}</Paragraph>
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
        <Card title={t("inventory.adjustTitle")}>
          <Form<InventoryAdjustmentFormShape>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ direction: "in", quantity: 1 }}
          >
            <Form.Item<InventoryAdjustmentFormShape>
              label={t("inventory.product")}
              name="productId"
              rules={[{ required: true }]}
            >
              <Select
                placeholder={t("inventory.productPlaceholder")}
                options={products.map((product) => ({
                  label: `${product.name} (${product.sku})`,
                  value: product.id,
                }))}
              />
            </Form.Item>

            <Form.Item<InventoryAdjustmentFormShape>
              label={t("inventory.direction")}
              name="direction"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: t("inventory.directionIn"), value: "in" },
                  { label: t("inventory.directionOut"), value: "out" },
                ]}
              />
            </Form.Item>

            <Form.Item<InventoryAdjustmentFormShape>
              label={t("inventory.quantity")}
              name="quantity"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              disabled={!selectedTenantId || products.length === 0}
              loading={isBusy}
            >
              {t("inventory.adjust")}
            </Button>
          </Form>
        </Card>

        <Card title={t("inventory.listTitle")}>
          {selectedTenantId ? (
            inventories.length ? (
              <div className="record-stack">
                {inventories.map((item) => (
                  <div className="record-row" key={item.productId}>
                    <div className="record-icon">
                      <DatabaseOutlined />
                    </div>
                    <div>
                      <strong>{item.productName}</strong>
                      <div className="record-detail">{item.sku}</div>
                      <div className="record-detail">
                        <Space size="small">
                          <Tag color={item.quantityOnHand > 0 ? "blue" : "default"}>
                            {item.quantityOnHand > 0 ? t("inventory.inStock") : t("inventory.outOfStock")}
                          </Tag>
                          <span>{item.quantityOnHand}</span>
                        </Space>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("inventory.empty")} />
            )
          ) : (
            <Empty description={t("inventory.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
