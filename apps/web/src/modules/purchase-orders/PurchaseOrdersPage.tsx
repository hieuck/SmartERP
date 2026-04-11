import {
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { FormProps } from "antd";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";

import type {
  CreatePurchaseOrderInput,
  PurchaseOrderRecord,
  ReceivePurchaseOrderInput,
} from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type PurchaseOrderFormShape = Omit<CreatePurchaseOrderInput, "tenantId">;
type PurchaseOrderReceiptFormShape = Omit<ReceivePurchaseOrderInput, "tenantId">;

function getTodayPlusDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getPurchaseOrderStatusColor(status: PurchaseOrderRecord["status"]): string {
  if (status === "canceled") {
    return "red";
  }

  if (status === "closed") {
    return "blue";
  }

  if (status === "received") {
    return "green";
  }

  if (status === "partially_received") {
    return "blue";
  }

  return "gold";
}

function getPurchaseOrderStatusLabel(
  status: PurchaseOrderRecord["status"],
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "canceled") {
    return t("purchaseOrders.statusCanceled");
  }

  if (status === "closed") {
    return t("purchaseOrders.statusClosed");
  }

  if (status === "received") {
    return t("purchaseOrders.statusReceived");
  }

  if (status === "partially_received") {
    return t("purchaseOrders.statusPartiallyReceived");
  }

  return t("purchaseOrders.statusIssued");
}

export function PurchaseOrdersPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    can,
    cancelPurchaseOrderRecord,
    closePurchaseOrderRecord,
    createPurchaseOrderRecord,
    receivePurchaseOrderRecord,
    isBusy,
    productCategories,
    products,
    purchaseOrders,
    reopenPurchaseOrderRecord,
    selectedTenantId,
    setSelectedTenantId,
    suppliers,
    tenants,
    updatePurchaseOrderRecord,
  } = useWorkspace();
  const canCreatePurchaseOrders = can("manage_purchase_orders");
  const canReceivePurchaseOrders = can("receive_purchase_orders");
  const [createForm] = Form.useForm<PurchaseOrderFormShape>();
  const [receiptForm] = Form.useForm<PurchaseOrderReceiptFormShape>();
  const [editingPurchaseOrderId, setEditingPurchaseOrderId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const selectedProductId = Form.useWatch("productId", createForm);
  const selectedReceiptOrderId = Form.useWatch("purchaseOrderId", receiptForm);
  const filteredProducts =
    selectedCategoryId === "all"
      ? products
      : products.filter((product) => product.categoryId === selectedCategoryId);
  const filteredPurchaseOrders =
    selectedCategoryId === "all"
      ? purchaseOrders
      : purchaseOrders.filter((purchaseOrder) => purchaseOrder.productCategoryId === selectedCategoryId);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const selectedReceiptOrder =
    filteredPurchaseOrders.find((purchaseOrder) => purchaseOrder.id === selectedReceiptOrderId) ?? null;
  const receivablePurchaseOrders = filteredPurchaseOrders.filter(
    (purchaseOrder) =>
      purchaseOrder.outstandingQuantity > 0 &&
      purchaseOrder.status !== "canceled" &&
      purchaseOrder.status !== "closed",
  );

  function resetCreateForm(): void {
    setEditingPurchaseOrderId(null);
    createForm.resetFields();
    createForm.setFieldsValue({
      quantityOrdered: 1,
      unitCost: selectedProduct?.unitPrice ?? 0,
      expectedReceiptDate: getTodayPlusDays(7),
    });
  }

  const onCreateFinish: FormProps<PurchaseOrderFormShape>["onFinish"] = async (values) => {
    try {
      if (editingPurchaseOrderId) {
        await updatePurchaseOrderRecord({
          purchaseOrderId: editingPurchaseOrderId,
          ...values,
        });
      } else {
        await createPurchaseOrderRecord(values);
      }

      resetCreateForm();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onReceiveFinish: FormProps<PurchaseOrderReceiptFormShape>["onFinish"] = async (values) => {
    try {
      await receivePurchaseOrderRecord(values);
      receiptForm.resetFields();
      receiptForm.setFieldsValue({
        quantityReceived: 1,
        receivedDate: getTodayPlusDays(0),
      });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  async function cancelPurchaseOrderAction(purchaseOrderId: string): Promise<void> {
    try {
      await cancelPurchaseOrderRecord({ purchaseOrderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  async function closePurchaseOrderAction(purchaseOrderId: string): Promise<void> {
    try {
      await closePurchaseOrderRecord({ purchaseOrderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  async function reopenPurchaseOrderAction(purchaseOrderId: string): Promise<void> {
    try {
      await reopenPurchaseOrderRecord({ purchaseOrderId });
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  useEffect(() => {
    resetCreateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenantId]);

  useEffect(() => {
    if (
      editingPurchaseOrderId &&
      !purchaseOrders.some((purchaseOrder) => purchaseOrder.id === editingPurchaseOrderId)
    ) {
      resetCreateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, editingPurchaseOrderId]);

  function startEditing(purchaseOrderId: string): void {
    const purchaseOrder = purchaseOrders.find((item) => item.id === purchaseOrderId);
    if (!purchaseOrder) {
      return;
    }

    setEditingPurchaseOrderId(purchaseOrder.id);
    createForm.setFieldsValue({
      supplierId: purchaseOrder.supplierId,
      productId: purchaseOrder.productId,
      quantityOrdered: purchaseOrder.quantityOrdered,
      unitCost: purchaseOrder.unitCost,
      expectedReceiptDate: purchaseOrder.expectedReceiptDate.slice(0, 10),
    });
  }

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("purchaseOrders.title")}</Title>
          <Paragraph type="secondary">{t("purchaseOrders.subtitle")}</Paragraph>
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
        <span>{t("purchaseOrders.categoryFilter")}</span>
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
        <div className="page-column-stack">
          <Card
            className="workspace-panel-card"
            title={editingPurchaseOrderId ? t("purchaseOrders.editTitle") : t("purchaseOrders.createTitle")}
          >
            {canCreatePurchaseOrders ? (
              <>
                <Form<PurchaseOrderFormShape>
                  form={createForm}
                  layout="vertical"
                  onFinish={onCreateFinish}
                  initialValues={{
                    quantityOrdered: 1,
                    unitCost: 0,
                    expectedReceiptDate: getTodayPlusDays(7),
                  }}
                >
                  <Form.Item<PurchaseOrderFormShape>
                    label={t("purchaseOrders.supplier")}
                    name="supplierId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder={t("purchaseOrders.supplierPlaceholder")}
                      options={suppliers.map((supplier) => ({
                        label: `${supplier.name} (${supplier.supplierCode})`,
                        value: supplier.id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item<PurchaseOrderFormShape>
                    label={t("purchaseOrders.product")}
                    name="productId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder={t("purchaseOrders.productPlaceholder")}
                      options={filteredProducts.map((product) => ({
                        label: `${product.name} (${product.sku}) · ${product.categoryName}`,
                        value: product.id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item<PurchaseOrderFormShape>
                    label={t("purchaseOrders.quantityOrdered")}
                    name="quantityOrdered"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item<PurchaseOrderFormShape>
                    label={t("purchaseOrders.unitCost")}
                    name="unitCost"
                    extra={
                      selectedProduct
                        ? t("purchaseOrders.catalogHint", { amount: formatCurrency(selectedProduct.unitPrice) })
                        : undefined
                    }
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item<PurchaseOrderFormShape>
                    label={t("purchaseOrders.expectedReceiptDate")}
                    name="expectedReceiptDate"
                    rules={[{ required: true }]}
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Space wrap>
                    <Button
                      data-testid="purchase-order-submit-button"
                      type="primary"
                      htmlType="submit"
                      disabled={!selectedTenantId || suppliers.length === 0 || filteredProducts.length === 0}
                      loading={isBusy}
                    >
                      {editingPurchaseOrderId ? t("common.saveChanges") : t("purchaseOrders.create")}
                    </Button>
                    {editingPurchaseOrderId ? (
                      <Button
                        data-testid="purchase-order-cancel-edit-button"
                        htmlType="button"
                        onClick={resetCreateForm}
                      >
                        {t("common.cancel")}
                      </Button>
                    ) : null}
                  </Space>
                </Form>

                {selectedTenantId && (suppliers.length === 0 || products.length === 0) ? (
                  <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                    {t("purchaseOrders.prerequisiteHint")}
                  </Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("accessDenied.actionRestricted")}
              </Paragraph>
            )}
          </Card>

          <Card className="workspace-panel-card" title={t("purchaseOrders.receiveTitle")}>
            {canReceivePurchaseOrders ? (
              <>
                <Form<PurchaseOrderReceiptFormShape>
                  form={receiptForm}
                  layout="vertical"
                  onFinish={onReceiveFinish}
                  initialValues={{
                    quantityReceived: 1,
                    receivedDate: getTodayPlusDays(0),
                  }}
                >
                  <Form.Item<PurchaseOrderReceiptFormShape>
                    label={t("purchaseOrders.purchaseOrder")}
                    name="purchaseOrderId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder={t("purchaseOrders.purchaseOrderPlaceholder")}
                      options={receivablePurchaseOrders.map((purchaseOrder) => ({
                        label: `${purchaseOrder.purchaseOrderNumber} | ${purchaseOrder.productName} (${purchaseOrder.productCategoryName}) | ${purchaseOrder.outstandingQuantity}`,
                        value: purchaseOrder.id,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item<PurchaseOrderReceiptFormShape>
                    label={t("purchaseOrders.quantityReceived")}
                    name="quantityReceived"
                    extra={
                      selectedReceiptOrder
                        ? t("purchaseOrders.receiveHint", {
                            count: selectedReceiptOrder.outstandingQuantity,
                            amount: formatCurrency(selectedReceiptOrder.unitCost),
                          })
                        : undefined
                    }
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item<PurchaseOrderReceiptFormShape>
                    label={t("purchaseOrders.receivedDate")}
                    name="receivedDate"
                    rules={[{ required: true }]}
                  >
                    <Input type="date" />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!selectedTenantId || receivablePurchaseOrders.length === 0}
                    loading={isBusy}
                  >
                    {t("purchaseOrders.receive")}
                  </Button>
                </Form>

                {selectedTenantId && receivablePurchaseOrders.length === 0 ? (
                  <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                    {t("purchaseOrders.receiveEmpty")}
                  </Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("accessDenied.actionRestricted")}
              </Paragraph>
            )}
          </Card>
        </div>

        <Card className="workspace-panel-card" title={t("purchaseOrders.listTitle")}>
          {selectedTenantId ? (
            filteredPurchaseOrders.length ? (
              <div className="record-stack">
                {filteredPurchaseOrders.map((purchaseOrder) => (
                  <div className="record-row" key={purchaseOrder.id}>
                    <div className="record-icon">
                      <ShoppingCartOutlined />
                    </div>
                  <div className="record-content">
                      <strong>{purchaseOrder.purchaseOrderNumber}</strong>
                      <div className="record-detail">
                        <TeamOutlined /> {purchaseOrder.supplierName} ({purchaseOrder.supplierCode})
                      </div>
                      <div className="record-detail">
                        {purchaseOrder.productName} ({purchaseOrder.productSku})
                      </div>
                      <div className="record-detail">
                        <Tag>{purchaseOrder.productCategoryName}</Tag>
                      </div>
                      <div className="record-detail">
                        {t("purchaseOrders.orderedLabel")} {purchaseOrder.quantityOrdered} |{" "}
                        {t("purchaseOrders.receivedLabel")} {purchaseOrder.receivedQuantity} |{" "}
                        {t("purchaseOrders.outstandingLabel")} {purchaseOrder.outstandingQuantity}
                      </div>
                      <div className="record-detail">
                        {t("purchaseOrders.unitCostLabel")} {formatCurrency(purchaseOrder.unitCost)} |{" "}
                        {formatCurrency(purchaseOrder.totalAmount)}
                      </div>
                      <div className="record-detail">
                        <CalendarOutlined /> {t("purchaseOrders.expectedReceiptLabel")}{" "}
                        {formatDate(purchaseOrder.expectedReceiptDate)}
                      </div>
                      <div className="record-detail">
                        <Tag color={getPurchaseOrderStatusColor(purchaseOrder.status)}>
                          {getPurchaseOrderStatusLabel(purchaseOrder.status, t)}
                        </Tag>
                      </div>
                      {canCreatePurchaseOrders &&
                      (purchaseOrder.status === "issued" ||
                        purchaseOrder.status === "partially_received" ||
                        purchaseOrder.status === "received" ||
                        purchaseOrder.status === "closed") ? (
                        <div className="record-actions">
                          {purchaseOrder.status === "issued" ? (
                            <>
                              <Button
                                data-testid="purchase-order-edit-button"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => startEditing(purchaseOrder.id)}
                              >
                                {t("common.edit")}
                              </Button>
                              <Popconfirm
                                title={t("purchaseOrders.cancelConfirm", {
                                  number: purchaseOrder.purchaseOrderNumber,
                                })}
                                okText={t("purchaseOrders.cancelAction")}
                                cancelText={t("common.cancel")}
                                onConfirm={() => void cancelPurchaseOrderAction(purchaseOrder.id)}
                              >
                                <Button
                                  data-testid="purchase-order-cancel-button"
                                  danger
                                  icon={<StopOutlined />}
                                  size="small"
                                >
                                  {t("purchaseOrders.cancelAction")}
                                </Button>
                              </Popconfirm>
                            </>
                          ) : purchaseOrder.status === "closed" ? (
                            <Popconfirm
                              title={t("purchaseOrders.reopenConfirm", {
                                number: purchaseOrder.purchaseOrderNumber,
                              })}
                              okText={t("purchaseOrders.reopenAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void reopenPurchaseOrderAction(purchaseOrder.id)}
                            >
                              <Button
                                data-testid="purchase-order-reopen-button"
                                icon={<RollbackOutlined />}
                                size="small"
                              >
                                {t("purchaseOrders.reopenAction")}
                              </Button>
                            </Popconfirm>
                          ) : (
                            <Popconfirm
                              title={t("purchaseOrders.closeConfirm", {
                                number: purchaseOrder.purchaseOrderNumber,
                              })}
                              okText={t("purchaseOrders.closeAction")}
                              cancelText={t("common.cancel")}
                              onConfirm={() => void closePurchaseOrderAction(purchaseOrder.id)}
                            >
                              <Button
                                data-testid="purchase-order-close-button"
                                type="primary"
                                ghost
                                icon={<CheckCircleOutlined />}
                                size="small"
                              >
                                {t("purchaseOrders.closeAction")}
                              </Button>
                            </Popconfirm>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("purchaseOrders.empty")} />
            )
          ) : (
            <Empty description={t("purchaseOrders.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
