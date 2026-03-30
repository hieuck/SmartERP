import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { ApartmentOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Typography } from "antd";

import type { CreateTenantInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

export function TenantsPage(): ReactElement {
  const { t } = useLocale();
  const { createTenantRecord, isBusy, tenants } = useWorkspace();
  const [form] = Form.useForm<CreateTenantInput>();

  const onFinish: FormProps<CreateTenantInput>["onFinish"] = async (values) => {
    try {
      await createTenantRecord(values);
      form.resetFields();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("tenants.title")}</Title>
          <Paragraph type="secondary">
            {t("tenants.subtitle")}
          </Paragraph>
        </div>
      </div>

      <div className="two-column">
        <Card title={t("tenants.createTitle")}>
          <Form<CreateTenantInput> form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item<CreateTenantInput> label={t("tenants.name")} name="name" rules={[{ required: true }]}>
              <Input placeholder={t("tenants.placeholderName")} />
            </Form.Item>
            <Form.Item<CreateTenantInput> label={t("tenants.slug")} name="slug" rules={[{ required: true }]}>
              <Input placeholder={t("tenants.placeholderSlug")} />
            </Form.Item>
            <Form.Item<CreateTenantInput> label={t("tenants.industry")} name="industry" rules={[{ required: true }]}>
              <Input placeholder={t("tenants.placeholderIndustry")} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={isBusy}>
              {t("tenants.create")}
            </Button>
          </Form>
        </Card>

        <Card title={t("tenants.listTitle")}>
          {tenants.length ? (
            <div className="record-stack">
              {tenants.map((tenant) => (
                <div className="record-row" key={tenant.id}>
                  <div className="record-icon">
                    <ApartmentOutlined />
                  </div>
                  <div>
                    <strong>{tenant.name}</strong>
                    <div className="record-detail">
                      {tenant.slug} - {tenant.industry}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description={t("tenants.empty")} />
          )}
        </Card>
      </div>
    </div>
  );
}
