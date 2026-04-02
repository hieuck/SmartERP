import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { FormProps } from "antd";
import {
  BarcodeOutlined,
  DeleteOutlined,
  EditOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
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
  Typography,
} from "antd";

import type { CreateProductInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type ProductFormShape = Omit<CreateProductInput, "tenantId">;

export function ProductsPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const {
    createProductRecord,
    deleteProductRecord,
    isBusy,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
    updateProductRecord,
  } = useWorkspace();
  const [form] = Form.useForm<ProductFormShape>();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  function resetForm(): void {
    setEditingProductId(null);
    form.resetFields();
  }

  const onFinish: FormProps<ProductFormShape>["onFinish"] = async (values) => {
    try {
      if (editingProductId) {
        await updateProductRecord({
          productId: editingProductId,
          ...values,
        });
      } else {
        await createProductRecord(values);
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
    if (editingProductId && !products.some((product) => product.id === editingProductId)) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, editingProductId]);

  function startEditing(productId: string): void {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setEditingProductId(product.id);
    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      unitPrice: product.unitPrice,
    });
  }

  async function removeProduct(productId: string): Promise<void> {
    try {
      await deleteProductRecord(productId);
      if (editingProductId === productId) {
        resetForm();
      }
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("products.title")}</Title>
          <Paragraph type="secondary">{t("products.subtitle")}</Paragraph>
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
          title={editingProductId ? t("products.editTitle") : t("products.addTitle")}
        >
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
            <Space wrap>
              <Button
                data-testid="product-submit-button"
                type="primary"
                htmlType="submit"
                disabled={!selectedTenantId}
                loading={isBusy}
              >
                {editingProductId ? t("common.saveChanges") : t("products.add")}
              </Button>
              {editingProductId ? (
                <Button data-testid="product-cancel-button" htmlType="button" onClick={resetForm}>
                  {t("common.cancel")}
                </Button>
              ) : null}
            </Space>
          </Form>
        </Card>

        <Card className="workspace-panel-card" title={t("products.listTitle")}>
          {selectedTenantId ? (
            products.length ? (
              <div className="record-stack">
                {products.map((product) => (
                  <div
                    className={`record-row${editingProductId === product.id ? " is-editing" : ""}`}
                    key={product.id}
                  >
                    <div className="record-icon">
                      <ShoppingOutlined />
                    </div>
                    <div className="record-content">
                      <strong>{product.name}</strong>
                      <div className="record-detail">
                        <BarcodeOutlined /> {product.sku}
                      </div>
                      <div className="record-detail">{formatCurrency(product.unitPrice)}</div>
                      <div className="record-actions">
                        <Button
                          data-testid="product-edit-button"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => startEditing(product.id)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Popconfirm
                          title={t("products.deleteConfirm", { name: product.name })}
                          okText={t("common.delete")}
                          cancelText={t("common.cancel")}
                          onConfirm={() => void removeProduct(product.id)}
                        >
                          <Button
                            data-testid="product-delete-button"
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
