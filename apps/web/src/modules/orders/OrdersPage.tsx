import {
  CheckCircleOutlined,
  EditOutlined,
  RollbackOutlined,
  ShoppingOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { FormProps } from "antd";
import {
  Button,
  Card,
  Empty,
  Form,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";

import type { CreateOrderInput, OrderRecord } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";
import { ProductVisual } from "../products/ProductVisual";

const { Paragraph, Title } = Typography;

type OrderFormShape = Omit<CreateOrderInput, "tenantId">;

function getOrderStatusColor(status: OrderRecord["status"]): string {
  if (status === "canceled") {
    return "red";
  }

  if (status === "returned") {
    return "magenta";
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
  status: OrderRecord["status"],
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "canceled") {
    return t("orders.statusCanceled");
  }

  if (status === "returned") {
    return t("orders.statusReturned");
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
    productCategories,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
    reopenOrderRecord,
    updateOrderRecord,
  } = useWorkspace();
  const canManageOrders = can("manage_orders");

  const [form] = Form.useForm<OrderFormShape>();
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const selectedProductId = Form.useWatch("productId", form);
  const editingOrder = orders.find((item) => item.id === editingOrderId) ?? null;
  const filteredProducts =
    selectedCategoryId === "all"
      ? products
      : products.filter((product) => product.categoryId === selectedCategoryId);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const filteredOrders =
    selectedCategoryId === "all"
      ? orders
      : orders.filter((order) => order.productCategoryId === selectedCategoryId);
  const selectedInventory = inventories.find((item) => item.productId === selectedProductId) ?? null;
  const effectiveAvailableStock =
    (selectedInventory?.quantityOnHand ?? 0) +
    (editingOrder && editingOrder.productId === selectedProductId ? editingOrder.quantity : 0);

  function resetForm(): void {
    setEditingOrderId(null);
    form.resetFields();
  }

  const onFinish: FormProps<OrderFormShape>["onFinish"] = async (values) => {
    try {
      if (editingOrderId) {
        await updateOrderRecord({
          orderId: editingOrderId,
          ...values,
        });
      } else {
        await createOrderRecord(values);
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
    if (editingOrderId && !orders.some((order) => order.id === editingOrderId)) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, editingOrderId]);

  function startEditing(orderId: string): void {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      return;
    }

    setEditingOrderId(order.id);
    form.setFieldsValue({
      customerId: order.customerId,
      productId: order.productId,
      quantity: order.quantity,
    });
  }

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

  async function reopenOrderAction(orderId: string): Promise<void> {
    try {
      await reopenOrderRecord({ orderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  function hasActiveInvoice(order: OrderRecord): boolean {
    return invoices.some((invoice) => invoice.orderId === order.id && invoice.status !== "void");
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
        <span>{t("orders.categoryFilter")}</span>
        <Select
          value={selectedCategoryId}
          style={{ minWidth: 220 }}
          options={[
            { label: t("common.allCategories"), value: "all" },
            ...productCategories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
          onChange={setSelectedCategoryId}
        />
      </div>

      <div className="two-column">
        <Card
          className="workspace-panel-card"
          title={editingOrderId ? t("orders.editTitle") : t("orders.createTitle")}
        >
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
                  options={filteredProducts.map((product) => ({
                    label: `${product.name} (${product.sku}) · ${product.categoryName}`,
                    value: product.id,
                  }))}
                />
              </Form.Item>
              {selectedProduct ? (
                <div className="product-preview-card">
                  <ProductVisual imageUrl={selectedProduct.imageUrl} name={selectedProduct.name} />
                  <div className="product-preview-meta">
                    <strong>{selectedProduct.name}</strong>
                    <span className="record-detail">
                      {selectedProduct.sku} · {selectedProduct.categoryName}
                    </span>
                  </div>
                </div>
              ) : null}

              <Form.Item<OrderFormShape>
                label={t("orders.quantity")}
                name="quantity"
                initialValue={1}
                dependencies={["productId"]}
                extra={
                  selectedInventory
                    ? t("orders.availableStock", { count: effectiveAvailableStock })
                    : undefined
                }
                rules={[
                  { required: true },
                  {
                    validator: async (_, value) => {
                      if (
                        !selectedInventory ||
                        typeof value !== "number" ||
                        value <= effectiveAvailableStock
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

              <Space wrap>
                <Button
                  data-testid="order-submit-button"
                  type="primary"
                  htmlType="submit"
                  disabled={!selectedTenantId || customers.length === 0 || filteredProducts.length === 0}
                  loading={isBusy}
                >
                  {editingOrderId ? t("common.saveChanges") : t("orders.create")}
                </Button>
                {editingOrderId ? (
                  <Button data-testid="order-cancel-edit-button" htmlType="button" onClick={resetForm}>
                    {t("common.cancel")}
                  </Button>
                ) : null}
              </Space>
            </Form>
          ) : (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t("accessDenied.actionRestricted")}
            </Paragraph>
          )}
        </Card>

        <Card className="workspace-panel-card" title={t("orders.listTitle")}>
          {selectedTenantId ? (
            filteredOrders.length ? (
              <div className="record-stack">
                {filteredOrders.map((order) => (
                  // Keep order actions deterministic: cancel before invoicing, close after full settlement.
                  <div
                    className={`record-row record-row--visual${editingOrderId === order.id ? " is-editing" : ""}`}
                    key={order.id}
                  >
                    <ProductVisual
                      imageUrl={products.find((product) => product.id === order.productId)?.imageUrl ?? null}
                      name={order.productName}
                    />
                    <div className="record-content">
                      <strong>{order.orderNumber}</strong>
                      <div className="record-detail">
                        <UserOutlined /> {order.customerName}
                      </div>
                      <div className="record-detail">
                        <ShoppingOutlined /> {order.productName} x {order.quantity}
                      </div>
                      <div className="record-detail">
                        <Tag>{order.productCategoryName}</Tag>
                      </div>
                      <div className="record-detail">
                        <Tag color={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status, t)}
                        </Tag>{" "}
                        {formatCurrency(order.totalAmount)}
                      </div>
                      {canManageOrders && order.status === "confirmed" ? (
                        <div className="record-actions">
                          {!hasActiveInvoice(order) ? (
                            <Button
                              data-testid="order-edit-button"
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => startEditing(order.id)}
                            >
                              {t("common.edit")}
                            </Button>
                          ) : null}
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
                          ) : !hasActiveInvoice(order) ? (
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
                      ) : canManageOrders && order.status === "closed" ? (
                        <div className="record-actions">
                          <Popconfirm
                            title={t("orders.reopenConfirm", { number: order.orderNumber })}
                            okText={t("orders.reopenAction")}
                            cancelText={t("common.cancel")}
                            onConfirm={() => void reopenOrderAction(order.id)}
                          >
                            <Button
                              data-testid="order-reopen-button"
                              icon={<RollbackOutlined />}
                              size="small"
                            >
                              {t("orders.reopenAction")}
                            </Button>
                          </Popconfirm>
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
