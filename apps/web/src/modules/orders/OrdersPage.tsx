import {
  CheckCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Button, Card, Empty, Form, InputNumber, Popconfirm, Select, Tag, Typography } from "antd";

import type { CreateOrderInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type OrderFormShape = Omit<CreateOrderInput, "tenantId">;

function getOrderStatusColor(status: "draft" | "confirmed" | "closed" | "canceled"): string {
  if (status === "canceled") {
    return "red";
  }

  if (status === "closed") {
    return "blue";
  }

  if (status === "confirmed") {
    return "green";
  }

  return "gold";
}

function getOrderStatusLabel(
  status: "draft" | "confirmed" | "closed" | "canceled",
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "canceled") {
    return t("orders.statusCanceled");
  }

  if (status === "closed") {
    return t("orders.statusClosed");
  }

  if (status === "confirmed") {
    return t("orders.statusConfirmed");
  }

  return t("orders.statusDraft");
}

export function OrdersPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const {
    can,
    cancelOrderRecord,
    closeOrderRecord,
    createOrderRecord,
    customers,
    invoices,
    inventories,
    isBusy,
    orders,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();
  const canManageOrders = can("manage_orders");

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

  async function cancelOrderAction(orderId: string): Promise<void> {
    try {
      await cancelOrderRecord({ orderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  async function closeOrderAction(orderId: string): Promise<void> {
    try {
      await closeOrderRecord({ orderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

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
          {canManageOrders ? (
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
          ) : (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t("accessDenied.actionRestricted")}
            </Paragraph>
          )}
        </Card>

        <Card className="workspace-panel-card" title={t("orders.listTitle")}>
          {selectedTenantId ? (
            orders.length ? (
              <div className="record-stack">
                {orders.map((order) => (
                  // Keep order actions deterministic: cancel before invoicing, close after full settlement.
                  <div className="record-row" key={order.id}>
                    <div className="record-icon">
                      <InboxOutlined />
                    </div>
                    <div className="record-content">
                      <strong>{order.orderNumber}</strong>
                      <div className="record-detail">
                        <UserOutlined /> {order.customerName}
                      </div>
                      <div className="record-detail">
                        <ShoppingOutlined /> {order.productName} x {order.quantity}
                      </div>
                      <div className="record-detail">
                        <Tag color={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status, t)}
                        </Tag>{" "}
                        {formatCurrency(order.totalAmount)}
                      </div>
                      {canManageOrders && order.status === "confirmed" ? (
                        <div className="record-actions">
                          {invoices.some((invoice) => invoice.orderId === order.id && invoice.status === "paid") ? (
                            <Popconfirm
                              title={t("orders.closeConfirm", { number: order.orderNumber })}
                              okText={t("orders.closeAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void closeOrderAction(order.id)}
                            >
                              <Button
                                data-testid="order-close-button"
                                type="primary"
                                ghost
                                icon={<CheckCircleOutlined />}
                                size="small"
                              >
                                {t("orders.closeAction")}
                              </Button>
                            </Popconfirm>
                          ) : !invoices.some(
                              (invoice) => invoice.orderId === order.id && invoice.status !== "void",
                            ) ? (
                            <Popconfirm
                              title={t("orders.cancelConfirm", { number: order.orderNumber })}
                              okText={t("orders.cancelAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void cancelOrderAction(order.id)}
                            >
                              <Button
                                data-testid="order-cancel-button"
                                danger
                                icon={<StopOutlined />}
                                size="small"
                              >
                                {t("orders.cancelAction")}
                              </Button>
                            </Popconfirm>
                          ) : null}
                        </div>
                      ) : null}
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
