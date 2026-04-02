import { InboxOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Button, Card, Empty, Form, InputNumber, Select, Tag, Typography } from "antd";

import type { CreateOrderInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type OrderFormShape = Omit<CreateOrderInput, "tenantId">;

export function OrdersPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const {
    createOrderRecord,
    customers,
    inventories,
    isBusy,
    orders,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();

  const [form] = Form.useForm<OrderFormShape>();
  const selectedProductId = Form.useWatch("productId", form);
  const selectedInventory = inventories.find((item) => item.productId === selectedProductId) ?? null;

  const onFinish: FormProps<OrderFormShape>["onFinish"] = async (values) => {
    try {
      await createOrderRecord(values);
      form.resetFields();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("orders.title")}</Title>
          <Paragraph type="secondary">{t("orders.subtitle")}</Paragraph>
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
        <Card className="workspace-panel-card" title={t("orders.createTitle")}>
          <Form<OrderFormShape> form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item<OrderFormShape>
              label={t("orders.customer")}
              name="customerId"
              rules={[{ required: true }]}
            >
              <Select
                placeholder={t("orders.customerPlaceholder")}
                options={customers.map((customer) => ({
                  label: `${customer.name} (${customer.email})`,
                  value: customer.id,
                }))}
              />
            </Form.Item>

            <Form.Item<OrderFormShape>
              label={t("orders.product")}
              name="productId"
              rules={[{ required: true }]}
            >
              <Select
                placeholder={t("orders.productPlaceholder")}
                options={products.map((product) => ({
                  label: `${product.name} (${product.sku})`,
                  value: product.id,
                }))}
              />
            </Form.Item>

            <Form.Item<OrderFormShape>
              label={t("orders.quantity")}
              name="quantity"
              initialValue={1}
              dependencies={["productId"]}
              extra={
                selectedInventory
                  ? t("orders.availableStock", { count: selectedInventory.quantityOnHand })
                  : undefined
              }
              rules={[
                { required: true },
                {
                  validator: async (_, value) => {
                    if (
                      !selectedInventory ||
                      typeof value !== "number" ||
                      value <= selectedInventory.quantityOnHand
                    ) {
                      return;
                    }

                    throw new Error(t("errors.insufficientStock"));
                  },
                },
              ]}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              disabled={!selectedTenantId || customers.length === 0 || products.length === 0}
              loading={isBusy}
            >
              {t("orders.create")}
            </Button>
          </Form>
        </Card>

        <Card className="workspace-panel-card" title={t("orders.listTitle")}>
          {selectedTenantId ? (
            orders.length ? (
              <div className="record-stack">
                {orders.map((order) => (
                  <div className="record-row" key={order.id}>
                    <div className="record-icon">
                      <InboxOutlined />
                    </div>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <div className="record-detail">
                        <UserOutlined /> {order.customerName}
                      </div>
                      <div className="record-detail">
                        <ShoppingOutlined /> {order.productName} x {order.quantity}
                      </div>
                      <div className="record-detail">
                        <Tag color="green">{t("orders.statusConfirmed")}</Tag>{" "}
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("orders.empty")} />
            )
          ) : (
            <Empty description={t("orders.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
