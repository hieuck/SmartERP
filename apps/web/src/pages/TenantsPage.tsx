import type { ReactElement } from "react";
import { useState } from "react";
import type { FormProps } from "antd";
import { ApartmentOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Form, Input, Select, Typography } from "antd";

import type {
  CreateTenantInput,
  ImportOnboardingResult,
  OnboardingDataset,
} from "@smarterp/contracts";
import { onboardingCsvTemplates } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

type OnboardingFormShape = {
  dataset: OnboardingDataset;
  csvText: string;
};

function downloadJsonFile(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

export function TenantsPage(): ReactElement {
  const { t } = useLocale();
  const {
    createTenantRecord,
    exportTenantSnapshotRecord,
    importOnboardingDatasetRecord,
    isBusy,
    selectedTenant,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();
  const [form] = Form.useForm<CreateTenantInput>();
  const [onboardingForm] = Form.useForm<OnboardingFormShape>();
  const [importResult, setImportResult] = useState<ImportOnboardingResult | null>(null);
  const watchedDataset = (Form.useWatch("dataset", onboardingForm) as OnboardingDataset | undefined) ?? "customers";

  const onFinish: FormProps<CreateTenantInput>["onFinish"] = async (values) => {
    try {
      await createTenantRecord(values);
      form.resetFields();
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onImportFinish: FormProps<OnboardingFormShape>["onFinish"] = async (values) => {
    try {
      const result = await importOnboardingDatasetRecord(values);
      setImportResult(result);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const handleDatasetChange = (dataset: OnboardingDataset) => {
    onboardingForm.setFieldsValue({
      dataset,
      csvText: onboardingCsvTemplates[dataset],
    });
    setImportResult(null);
  };

  const handleExportSnapshot = async () => {
    try {
      const snapshot = await exportTenantSnapshotRecord();
      downloadJsonFile(`${snapshot.tenant.slug}-snapshot.json`, snapshot);
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

      <div className="two-column">
        <Card title={t("tenants.onboardingTitle")}>
          <Form<OnboardingFormShape>
            form={onboardingForm}
            layout="vertical"
            initialValues={{
              dataset: "customers",
              csvText: onboardingCsvTemplates.customers,
            }}
            onFinish={onImportFinish}
          >
            <Form.Item<OnboardingFormShape>
              label={t("tenants.importDataset")}
              name="dataset"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "customers", label: t("tenants.datasets.customers") },
                  { value: "suppliers", label: t("tenants.datasets.suppliers") },
                  { value: "products", label: t("tenants.datasets.products") },
                ]}
                onChange={(value) => handleDatasetChange(value as OnboardingDataset)}
              />
            </Form.Item>
            <Paragraph type="secondary">{t("tenants.importHint")}</Paragraph>
            <pre className="code-sample">
              {onboardingCsvTemplates[watchedDataset]}
            </pre>
            <Form.Item<OnboardingFormShape>
              label={t("tenants.csvData")}
              name="csvText"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                autoSize={{ minRows: 6, maxRows: 12 }}
                placeholder={t("tenants.csvPlaceholder")}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={!selectedTenantId} loading={isBusy}>
              {t("tenants.importAction")}
            </Button>
          </Form>

          {importResult ? (
            <div className="page-inline-stack">
              <Alert
                type={importResult.errors.length ? "warning" : "success"}
                title={t("tenants.importSummary", {
                  dataset: t(`tenants.datasets.${importResult.dataset}`),
                  createdCount: importResult.createdCount,
                  skippedCount: importResult.skippedCount,
                })}
                showIcon
              />
              {importResult.errors.length ? (
                <div className="record-stack">
                  {importResult.errors.slice(0, 5).map((error) => (
                    <div className="compact-record-row" key={`${error.lineNumber}-${error.message}`}>
                      <strong>{t("tenants.importErrorLine", { lineNumber: error.lineNumber })}</strong>
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card title={t("tenants.exportTitle")}>
          <Paragraph type="secondary">{t("tenants.exportHint")}</Paragraph>
          <div className="record-stack">
            <div className="compact-record-row">
              <strong>{t("tenants.exportSelectedTenant")}</strong>
              <span>
                {selectedTenant ? `${selectedTenant.name} (${selectedTenant.slug})` : t("common.noneSelected")}
              </span>
            </div>
            <div className="compact-record-row">
              <strong>{t("tenants.exportIncludes")}</strong>
              <span>{t("tenants.exportIncludesValue")}</span>
            </div>
          </div>
          <Button type="primary" onClick={handleExportSnapshot} disabled={!selectedTenantId} loading={isBusy}>
            {t("tenants.exportAction")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
