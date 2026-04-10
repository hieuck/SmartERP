import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import type { FormProps } from "antd";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
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
  Tag,
  Typography,
} from "antd";

import type { CreateProductInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Text, Title } = Typography;

type ProductFormShape = Omit<CreateProductInput, "tenantId">;
type CategoryFormShape = {
  name: string;
};

export function ProductsPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const {
    createProductCategoryRecord,
    createProductRecord,
    deleteProductCategoryRecord,
    deleteProductRecord,
    isBusy,
    productCategories,
    products,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
    updateProductCategoryRecord,
    updateProductRecord,
  } = useWorkspace();
  const [productForm] = Form.useForm<ProductFormShape>();
  const [categoryForm] = Form.useForm<CategoryFormShape>();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const productCountByCategoryId = useMemo(() => {
    return products.reduce<Record<string, number>>((result, product) => {
      result[product.categoryId] = (result[product.categoryId] ?? 0) + 1;
      return result;
    }, {});
  }, [products]);

  function resetProductForm(): void {
    setEditingProductId(null);
    productForm.resetFields();
  }

  function resetCategoryForm(): void {
    setEditingCategoryId(null);
    categoryForm.resetFields();
  }

  const onProductFinish: FormProps<ProductFormShape>["onFinish"] = async (values) => {
    try {
      if (editingProductId) {
        await updateProductRecord({
          productId: editingProductId,
          ...values,
        });
      } else {
        await createProductRecord(values);
      }

      resetProductForm();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onCategoryFinish: FormProps<CategoryFormShape>["onFinish"] = async (values) => {
    try {
      if (editingCategoryId) {
        await updateProductCategoryRecord(editingCategoryId, values.name);
      } else {
        await createProductCategoryRecord(values.name);
      }

      resetCategoryForm();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  useEffect(() => {
    resetProductForm();
    resetCategoryForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenantId]);

  useEffect(() => {
    if (editingProductId && !products.some((product) => product.id === editingProductId)) {
      resetProductForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, editingProductId]);

  useEffect(() => {
    if (editingCategoryId && !productCategories.some((category) => category.id === editingCategoryId)) {
      resetCategoryForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategories, editingCategoryId]);

  function startEditingProduct(productId: string): void {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setEditingProductId(product.id);
    productForm.setFieldsValue({
      categoryId: product.categoryId,
      sku: product.sku,
      name: product.name,
      unitPrice: product.unitPrice,
    });
  }

  function startEditingCategory(categoryId: string): void {
    const category = productCategories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    setEditingCategoryId(category.id);
    categoryForm.setFieldsValue({ name: category.name });
  }

  async function removeProduct(productId: string): Promise<void> {
    try {
      await deleteProductRecord(productId);
      if (editingProductId === productId) {
        resetProductForm();
      }
    } catch {
      // Error state is already surfaced via workspace context.
    }
  }

  async function removeCategory(categoryId: string): Promise<void> {
    try {
      await deleteProductCategoryRecord(categoryId);
      if (editingCategoryId === categoryId) {
        resetCategoryForm();
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
        <div className="page-column-stack">
          <Card
            className="workspace-panel-card"
            data-testid="product-categories-card"
            title={editingCategoryId ? t("products.categoryEditTitle") : t("products.categoryTitle")}
          >
            <Paragraph type="secondary">{t("products.categoryHint")}</Paragraph>
            <Form<CategoryFormShape> form={categoryForm} layout="vertical" onFinish={onCategoryFinish}>
              <Form.Item<CategoryFormShape>
                label={t("products.categoryName")}
                name="name"
                rules={[{ required: true }]}
              >
                <Input placeholder={t("products.placeholderCategory")} />
              </Form.Item>
              <Space wrap>
                <Button
                  data-testid="product-category-submit-button"
                  type="primary"
                  htmlType="submit"
                  disabled={!selectedTenantId}
                  loading={isBusy}
                >
                  {editingCategoryId ? t("common.saveChanges") : t("products.categoryAdd")}
                </Button>
                {editingCategoryId ? (
                  <Button
                    data-testid="product-category-cancel-button"
                    htmlType="button"
                    onClick={resetCategoryForm}
                  >
                    {t("common.cancel")}
                  </Button>
                ) : null}
              </Space>
            </Form>

            <div className="page-inline-stack">
              {selectedTenantId ? (
                productCategories.length ? (
                  productCategories.map((category) => (
                    <div
                      className={`compact-record-row${editingCategoryId === category.id ? " is-editing" : ""}`}
                      key={category.id}
                    >
                      <div>
                        <strong>{category.name}</strong>
                        <div className="record-detail">
                          {t("products.categoryProductCount", {
                            count: productCountByCategoryId[category.id] ?? 0,
                          })}
                        </div>
                      </div>
                      <div className="record-actions">
                        <Button
                          data-testid="product-category-edit-button"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => startEditingCategory(category.id)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Popconfirm
                          title={t("products.categoryDeleteConfirm", { name: category.name })}
                          okText={t("common.delete")}
                          cancelText={t("common.cancel")}
                          onConfirm={() => void removeCategory(category.id)}
                        >
                          <Button
                            data-testid="product-category-delete-button"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                          >
                            {t("common.delete")}
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description={t("products.categoryEmpty")} />
                )
              ) : (
                <Empty description={t("products.emptyNoTenant")} />
              )}
            </div>
          </Card>

          <Card
            className="workspace-panel-card"
            data-testid="product-form-card"
            title={editingProductId ? t("products.editTitle") : t("products.addTitle")}
          >
            <Paragraph type="secondary">{t("products.autoSkuHint")}</Paragraph>
            <Form<ProductFormShape> form={productForm} layout="vertical" onFinish={onProductFinish}>
              <Form.Item<ProductFormShape>
                label={t("products.category")}
                name="categoryId"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={t("products.placeholderCategorySelect")}
                  options={productCategories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              </Form.Item>
              <Form.Item<ProductFormShape> label={t("products.name")} name="name" rules={[{ required: true }]}>
                <Input placeholder={t("products.placeholderName")} />
              </Form.Item>
              <Form.Item<ProductFormShape> label={t("products.skuOptional")} name="sku">
                <Input placeholder={t("products.placeholderSkuAuto")} />
              </Form.Item>
              <Form.Item<ProductFormShape>
                label={t("products.unitPrice")}
                name="unitPrice"
                rules={[{ required: true }]}
              >
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
                  <Button data-testid="product-cancel-button" htmlType="button" onClick={resetProductForm}>
                    {t("common.cancel")}
                  </Button>
                ) : null}
              </Space>
            </Form>
          </Card>
        </div>

        <Card className="workspace-panel-card" data-testid="product-list-card" title={t("products.listTitle")}>
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
                        <AppstoreOutlined /> {product.categoryName}
                      </div>
                      <div className="record-detail">
                        <BarcodeOutlined /> {product.sku}
                      </div>
                      <div className="record-detail">{formatCurrency(product.unitPrice)}</div>
                      <div className="record-tag-stack">
                        <Tag color="blue" icon={<FolderOpenOutlined />}>
                          {product.categoryName}
                        </Tag>
                        <Text type="secondary">{product.sku}</Text>
                      </div>
                      <div className="record-actions">
                        <Button
                          data-testid="product-edit-button"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => startEditingProduct(product.id)}
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
