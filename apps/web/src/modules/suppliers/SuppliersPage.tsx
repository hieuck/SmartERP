import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import type { FormProps } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
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

import type { CreateSupplierInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type SupplierFormShape = Omit<CreateSupplierInput, "tenantId">;

export function SuppliersPage(): ReactElement {
  const { t } = useLocale();
  const {
    createSupplierRecord,
    deleteSupplierRecord,
    isBusy,
    selectedTenantId,
    setSelectedTenantId,
    suppliers,
    tenants,
    updateSupplierRecord,
  } = useWorkspace();
  const [form] = Form.useForm<SupplierFormShape>();
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  function resetForm(): void {
    setEditingSupplierId(null);
    form.resetFields();
    form.setFieldsValue({ leadTimeDays: 7 });
  }

  const onFinish: FormProps<SupplierFormShape>["onFinish"] = async (values) => {
    try {
      if (editingSupplierId) {
        await updateSupplierRecord({
          supplierId: editingSupplierId,
          ...values,
        });
      } else {
        await createSupplierRecord(values);
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
    if (editingSupplierId && !suppliers.some((supplier) => supplier.id === editingSupplierId)) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers, editingSupplierId]);

  function startEditing(supplierId: string): void {
    const supplier = suppliers.find((item) => item.id === supplierId);
    if (!supplier) {
      return;
    }

    setEditingSupplierId(supplier.id);
    form.setFieldsValue({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      city: supplier.city,
      leadTimeDays: supplier.leadTimeDays,
    });
  }

  async function removeSupplier(supplierId: string): Promise<void> {
    try {
      await deleteSupplierRecord(supplierId);
      if (editingSupplierId === supplierId) {
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
        <Card
          className="workspace-panel-card"
          title={editingSupplierId ? t("suppliers.editTitle") : t("suppliers.addTitle")}
        >
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
            <Space wrap>
              <Button
                data-testid="supplier-submit-button"
                type="primary"
                htmlType="submit"
                disabled={!selectedTenantId}
                loading={isBusy}
              >
                {editingSupplierId ? t("common.saveChanges") : t("suppliers.add")}
              </Button>
              {editingSupplierId ? (
                <Button data-testid="supplier-cancel-button" htmlType="button" onClick={resetForm}>
                  {t("common.cancel")}
                </Button>
              ) : null}
            </Space>
          </Form>
        </Card>

        <Card className="workspace-panel-card" title={t("suppliers.listTitle")}>
          {selectedTenantId ? (
            suppliers.length ? (
              <div className="record-stack">
                {suppliers.map((supplier) => (
                  <div
                    className={`record-row${editingSupplierId === supplier.id ? " is-editing" : ""}`}
                    key={supplier.id}
                  >
                    <div className="record-icon">
                      <TeamOutlined />
                    </div>
                    <div className="record-content">
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
                      <div className="record-actions">
                        <Button
                          data-testid="supplier-edit-button"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => startEditing(supplier.id)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Popconfirm
                          title={t("suppliers.deleteConfirm", { name: supplier.name })}
                          okText={t("common.delete")}
                          cancelText={t("common.cancel")}
                          onConfirm={() => void removeSupplier(supplier.id)}
                        >
                          <Button
                            data-testid="supplier-delete-button"
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
