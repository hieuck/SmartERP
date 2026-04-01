import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import type { FormProps } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Empty, Form, Input, Progress, Select, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import type {
  CreateTenantInput,
  ImportOnboardingResult,
  OnboardingDataset,
  PilotHandoffPackage,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
} from "@smarterp/contracts";
import { onboardingCsvTemplates } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";
import { loadOperationsStatus } from "../operations/api";
import { buildPilotHandoffPackage } from "./handoff";
import {
  buildRecoveryDrillReport,
  loadRecoveryDrillReport,
  saveRecoveryDrillReport,
  type RecoveryDrillReport,
} from "./recoveryDrill";
import { downloadJsonFile, parseRestoreSnapshot } from "../tenants/setup-utils";

const { Paragraph, Text, Title } = Typography;

type OnboardingFormShape = {
  dataset: OnboardingDataset;
  csvText: string;
};

type RestoreFormShape = {
  targetName: string;
  targetSlug: string;
  targetIndustry: string;
  snapshotJson: string;
};

type SetupChecklistItem = {
  key: string;
  title: string;
  description: string;
  done: boolean;
};

export function SetupPage(): ReactElement {
  const navigate = useNavigate();
  const { t } = useLocale();
  const {
    createTenantRecord,
    customers,
    exportTenantSnapshotRecord,
    foundation,
    importOnboardingDatasetRecord,
    inventories,
    isBusy,
    products,
    previewTenantSnapshotRestoreRecord,
    purchaseOrders,
    restoreTenantSnapshotRecord,
    session,
    selectedTenant,
    selectedTenantId,
    setSelectedTenantId,
    suppliers,
    tenants,
  } = useWorkspace();
  const [createForm] = Form.useForm<CreateTenantInput>();
  const [onboardingForm] = Form.useForm<OnboardingFormShape>();
  const [restoreForm] = Form.useForm<RestoreFormShape>();
  const [importResult, setImportResult] = useState<ImportOnboardingResult | null>(null);
  const [handoffPackage, setHandoffPackage] = useState<PilotHandoffPackage | null>(null);
  const [isPackagingHandoff, setIsPackagingHandoff] = useState(false);
  const [restorePreview, setRestorePreview] = useState<RestoreTenantSnapshotPreview | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreTenantSnapshotResult | null>(null);
  const [recoveryDrillReport, setRecoveryDrillReport] = useState<RecoveryDrillReport | null>(() =>
    loadRecoveryDrillReport(),
  );
  const watchedDataset = (Form.useWatch("dataset", onboardingForm) as OnboardingDataset | undefined) ?? "customers";

  const checklistItems = useMemo<SetupChecklistItem[]>(
    () => [
      {
        key: "tenant-created",
        title: t("setup.checklistTenantCreated"),
        description: t("setup.checklistTenantCreatedDescription"),
        done: tenants.length > 0,
      },
      {
        key: "tenant-selected",
        title: t("setup.checklistTenantSelected"),
        description: t("setup.checklistTenantSelectedDescription"),
        done: Boolean(selectedTenantId && selectedTenant),
      },
      {
        key: "customers-seeded",
        title: t("setup.checklistCustomers"),
        description: t("setup.checklistCustomersDescription"),
        done: customers.length > 0,
      },
      {
        key: "suppliers-seeded",
        title: t("setup.checklistSuppliers"),
        description: t("setup.checklistSuppliersDescription"),
        done: suppliers.length > 0,
      },
      {
        key: "products-seeded",
        title: t("setup.checklistProducts"),
        description: t("setup.checklistProductsDescription"),
        done: products.length > 0,
      },
      {
        key: "baseline-exported",
        title: t("setup.checklistRecovery"),
        description: t("setup.checklistRecoveryDescription"),
        done: Boolean(restoreResult || inventories.length > 0 || purchaseOrders.length > 0),
      },
    ],
    [
      customers.length,
      inventories.length,
      products.length,
      purchaseOrders.length,
      restoreResult,
      selectedTenant,
      selectedTenantId,
      suppliers.length,
      t,
      tenants.length,
    ],
  );
  const completedChecklistItems = checklistItems.filter((item) => item.done).length;

  const onCreateTenantFinish: FormProps<CreateTenantInput>["onFinish"] = async (values) => {
    try {
      await createTenantRecord(values);
      createForm.resetFields();
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

  const handleDownloadHandoffPackage = async () => {
    if (!session) {
      return;
    }

    setIsPackagingHandoff(true);

    try {
      const [tenantSnapshot, operationsStatus] = await Promise.all([
        exportTenantSnapshotRecord(),
        loadOperationsStatus(),
      ]);
      const nextHandoffPackage = buildPilotHandoffPackage({
        foundation,
        operationsStatus,
        session,
        tenantSnapshot,
        workspaceOrigin: window.location.origin,
      });
      setHandoffPackage(nextHandoffPackage);
      downloadJsonFile(`${tenantSnapshot.tenant.slug}-pilot-handoff.json`, nextHandoffPackage);
    } catch {
      // Error state is already surfaced via workspace context or operations request.
    } finally {
      setIsPackagingHandoff(false);
    }
  };

  const buildRestoreInput = (values: RestoreFormShape) => {
    const snapshot = parseRestoreSnapshot(values.snapshotJson);

    if (!snapshot) {
      restoreForm.setFields([
        {
          name: "snapshotJson",
          errors: [t("tenants.restoreInvalidJson")],
        },
      ]);
      return null;
    }

    restoreForm.setFields([
      {
        name: "snapshotJson",
        errors: [],
      },
    ]);

    return {
      snapshot,
      targetTenant: {
        name: values.targetName,
        slug: values.targetSlug,
        industry: values.targetIndustry,
      },
    };
  };

  const handleRestorePreview = async () => {
    try {
      const values = await restoreForm.validateFields();
      const input = buildRestoreInput(values);
      if (!input) {
        return;
      }

      const preview = await previewTenantSnapshotRestoreRecord(input);
      setRestorePreview(preview);
      setRestoreResult(null);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const onRestoreFinish: FormProps<RestoreFormShape>["onFinish"] = async (values) => {
    const input = buildRestoreInput(values);
    if (!input) {
      return;
    }

    if (!restorePreview) {
      await handleRestorePreview();
      return;
    }

    try {
      const result = await restoreTenantSnapshotRecord(input);
      const nextRecoveryDrillReport = restorePreview
        ? buildRecoveryDrillReport({
            snapshot: input.snapshot,
            preview: restorePreview,
            result,
          })
        : null;
      setRestoreResult(result);
      setRecoveryDrillReport(nextRecoveryDrillReport);
      if (nextRecoveryDrillReport) {
        saveRecoveryDrillReport(nextRecoveryDrillReport);
      }
      setRestorePreview(null);
      restoreForm.resetFields(["snapshotJson"]);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  const handleDownloadRecoveryDrill = () => {
    if (!recoveryDrillReport) {
      return;
    }

    downloadJsonFile(`${recoveryDrillReport.restoredTenant.slug}-recovery-drill.json`, recoveryDrillReport);
  };

  const handleOpenRestoredTenantInventory = () => {
    const restoredTenant =
      restoreResult?.tenant ??
      tenants.find((tenant) => tenant.slug === recoveryDrillReport?.restoredTenant.slug) ??
      null;

    if (!restoredTenant) {
      return;
    }

    setSelectedTenantId(restoredTenant.id);
    navigate("/dashboard/inventory");
  };

  return (
    <div className="page-stack" data-testid="setup-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("setup.title")}</Title>
          <Paragraph type="secondary">{t("setup.subtitle")}</Paragraph>
        </div>
        <Space wrap>
          <Button onClick={() => navigate("/dashboard/tenants")}>{t("setup.openTenantControl")}</Button>
          <Button type="primary" onClick={() => navigate("/dashboard/reports")} disabled={!selectedTenantId}>
            {t("setup.openReports")}
          </Button>
        </Space>
      </div>

      <div className="page-toolbar">
        <span>{t("common.tenant")}</span>
        <Select
          value={selectedTenantId || undefined}
          placeholder={t("common.selectTenant")}
          style={{ minWidth: 280 }}
          options={tenants.map((tenant) => ({
            label: `${tenant.name} (${tenant.slug})`,
            value: tenant.id,
          }))}
          onChange={setSelectedTenantId}
        />
      </div>

      <div className="two-column">
        <Card data-testid="setup-checklist-card" title={t("setup.checklistTitle")}>
          <div className="page-inline-stack">
            <Progress
              percent={Math.round((completedChecklistItems / checklistItems.length) * 100)}
              showInfo={false}
              status={completedChecklistItems === checklistItems.length ? "success" : "active"}
            />
            <Text type="secondary">
              {t("setup.checklistProgress", {
                completed: completedChecklistItems,
                total: checklistItems.length,
              })}
            </Text>
          </div>

          <div className="activity-feed" data-testid="setup-checklist-items">
            {checklistItems.map((item) => (
              <div className="activity-row" key={item.key}>
                <div className="activity-main">
                  <Space wrap>
                    <strong>{item.title}</strong>
                    <Tag color={item.done ? "green" : "gold"}>
                      {item.done ? t("setup.statusDone") : t("setup.statusPending")}
                    </Tag>
                  </Space>
                  <div className="record-detail">{item.description}</div>
                </div>
                <div className="record-tag-stack">
                  {item.done ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card data-testid="setup-create-tenant-card" title={t("setup.createTenantTitle")}>
          <Paragraph type="secondary">{t("setup.createTenantHint")}</Paragraph>
          <Form<CreateTenantInput> form={createForm} layout="vertical" onFinish={onCreateTenantFinish}>
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

          {selectedTenant ? (
            <div className="record-stack" data-testid="setup-selected-tenant">
              <div className="compact-record-row">
                <strong>{t("setup.selectedTenantLabel")}</strong>
                <span>
                  {selectedTenant.name} ({selectedTenant.slug})
                </span>
              </div>
              <div className="compact-record-row">
                <strong>{t("setup.seedStatusLabel")}</strong>
                <span>
                  {t("setup.seedStatusValue", {
                    customers: customers.length,
                    suppliers: suppliers.length,
                    products: products.length,
                  })}
                </span>
              </div>
            </div>
          ) : (
            <Empty description={t("setup.noTenantSelected")} />
          )}
        </Card>
      </div>

      <div className="two-column">
        <Card data-testid="setup-onboarding-card" title={t("setup.seedTitle")}>
          <Paragraph type="secondary">{t("setup.seedHint")}</Paragraph>
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
            <pre className="code-sample">{onboardingCsvTemplates[watchedDataset]}</pre>
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
            <Button
              icon={<UploadOutlined />}
              type="primary"
              htmlType="submit"
              disabled={!selectedTenantId}
              loading={isBusy}
            >
              {t("tenants.importAction")}
            </Button>
          </Form>

          {importResult ? (
            <div className="page-inline-stack">
              <Alert
                type={importResult.errors.length ? "warning" : "success"}
                title={t("setup.seedResultTitle")}
                description={t("tenants.importSummary", {
                  dataset: t(`tenants.datasets.${importResult.dataset}`),
                  createdCount: importResult.createdCount,
                  skippedCount: importResult.skippedCount,
                })}
                showIcon
              />
            </div>
          ) : null}
        </Card>

        <Card data-testid="setup-recovery-card" title={t("setup.recoveryTitle")}>
          <Paragraph type="secondary">{t("setup.recoveryHint")}</Paragraph>
          <div className="page-inline-stack">
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              onClick={handleExportSnapshot}
              disabled={!selectedTenantId}
              loading={isBusy}
            >
              {t("tenants.exportAction")}
            </Button>
            <Button icon={<PlayCircleOutlined />} onClick={() => navigate("/dashboard/operations")}>
              {t("setup.openOperations")}
            </Button>
          </div>

          <Form<RestoreFormShape>
            form={restoreForm}
            layout="vertical"
            onFinish={onRestoreFinish}
            onValuesChange={() => {
              if (restorePreview) {
                setRestorePreview(null);
              }
              if (restoreResult) {
                setRestoreResult(null);
              }
            }}
          >
            <Form.Item<RestoreFormShape>
              label={t("tenants.restoreTargetName")}
              name="targetName"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("tenants.restoreTargetNamePlaceholder")} />
            </Form.Item>
            <Form.Item<RestoreFormShape>
              label={t("tenants.restoreTargetSlug")}
              name="targetSlug"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("tenants.restoreTargetSlugPlaceholder")} />
            </Form.Item>
            <Form.Item<RestoreFormShape>
              label={t("tenants.restoreTargetIndustry")}
              name="targetIndustry"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("tenants.restoreTargetIndustryPlaceholder")} />
            </Form.Item>
            <Form.Item<RestoreFormShape>
              label={t("tenants.restoreSnapshotJson")}
              name="snapshotJson"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                autoSize={{ minRows: 6, maxRows: 12 }}
                placeholder={t("tenants.restoreSnapshotPlaceholder")}
              />
            </Form.Item>
            <Space wrap>
              <Button onClick={handleRestorePreview} loading={isBusy}>
                {t("tenants.restorePreviewAction")}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isBusy}
                disabled={!restorePreview || !restorePreview.slugAvailable}
              >
                {t("tenants.restoreAction")}
              </Button>
            </Space>
          </Form>

          {restorePreview ? (
            <div className="page-inline-stack" data-testid="setup-restore-preview">
              <Alert
                type={restorePreview.slugAvailable ? "info" : "error"}
                title={
                  restorePreview.slugAvailable
                    ? t("tenants.restorePreviewReady", {
                        tenantName: restorePreview.targetTenant.name,
                      })
                    : t("tenants.restorePreviewBlocked", {
                        conflictingTenantName:
                          restorePreview.conflictingTenantName ?? restorePreview.targetTenant.slug,
                      })
                }
                showIcon
              />
              <div className="record-stack">
                <div className="compact-record-row">
                  <strong>{t("tenants.restorePreviewSource")}</strong>
                  <span>
                    {restorePreview.sourceTenantName} ({restorePreview.sourceTenantSlug})
                  </span>
                </div>
                <div className="compact-record-row">
                  <strong>{t("tenants.restorePreviewSlugStatus")}</strong>
                  <span>
                    {restorePreview.slugAvailable
                      ? t("tenants.restorePreviewSlugAvailable")
                      : t("tenants.restorePreviewSlugBlocked", {
                          conflictingTenantName:
                            restorePreview.conflictingTenantName ?? restorePreview.targetTenant.slug,
                        })}
                  </span>
                </div>
                <div className="compact-record-row">
                  <strong>{t("tenants.restorePreviewCountsNowLabel")}</strong>
                  <span>
                    {t("tenants.restorePreviewCountsNowValue", {
                      customerCount: restorePreview.customerCount,
                      supplierCount: restorePreview.supplierCount,
                      productCount: restorePreview.productCount,
                      inventoryLineCount: restorePreview.inventoryLineCount,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {restoreResult ? (
            <div className="page-inline-stack">
              <Alert
                type="success"
                title={t("setup.restoreResultTitle")}
                description={t("tenants.restoreSummary", {
                  tenantName: restoreResult.tenant.name,
                  restoredCustomers: restoreResult.restoredCustomers,
                  restoredProducts: restoreResult.restoredProducts,
                  restoredInventoryLines: restoreResult.restoredInventoryLines,
                })}
                showIcon
              />
              <Space wrap>
                <Button data-testid="setup-recovery-open-restored" onClick={handleOpenRestoredTenantInventory}>
                  {t("setup.recoveryDrillOpenRestoredTenant")}
                </Button>
              </Space>
            </div>
          ) : null}

          {recoveryDrillReport ? (
            <Card
              data-testid="setup-recovery-drill-card"
              title={t("setup.recoveryDrillTitle")}
              size="small"
              style={{ marginTop: 16 }}
            >
              <Paragraph type="secondary">{t("setup.recoveryDrillHint")}</Paragraph>
              <div className="page-inline-stack">
                <Space wrap>
                  <Tag color={recoveryDrillReport.passCount === recoveryDrillReport.totalCount ? "green" : "gold"}>
                    {recoveryDrillReport.passCount === recoveryDrillReport.totalCount
                      ? t("setup.recoveryDrillPassed")
                      : t("setup.recoveryDrillNeedsAttention")}
                  </Tag>
                  <Tag color="blue">
                    {t("setup.recoveryDrillPassCount", {
                      passed: recoveryDrillReport.passCount,
                      total: recoveryDrillReport.totalCount,
                    })}
                  </Tag>
                </Space>
                <div className="record-stack">
                  <div className="compact-record-row">
                    <strong>{t("setup.recoveryDrillSourceTenant")}</strong>
                    <span>
                      {recoveryDrillReport.sourceTenant.name} ({recoveryDrillReport.sourceTenant.slug})
                    </span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("setup.recoveryDrillRestoredTenant")}</strong>
                    <span>
                      {recoveryDrillReport.restoredTenant.name} ({recoveryDrillReport.restoredTenant.slug})
                    </span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("setup.recoveryDrillPendingScopes")}</strong>
                    <span>
                      {recoveryDrillReport.pendingScopes.length
                        ? recoveryDrillReport.pendingScopes.join(", ")
                        : t("setup.recoveryDrillNoPendingScopes")}
                    </span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("setup.recoveryDrillBaselineCounts")}</strong>
                    <span>
                      {t("setup.recoveryDrillBaselineCountsValue", {
                        customers: recoveryDrillReport.baselineCounts.customers,
                        suppliers: recoveryDrillReport.baselineCounts.suppliers,
                        products: recoveryDrillReport.baselineCounts.products,
                        inventoryLines: recoveryDrillReport.baselineCounts.inventoryLines,
                      })}
                    </span>
                  </div>
                </div>
                <div className="activity-feed" data-testid="setup-recovery-drill-checks">
                  {recoveryDrillReport.checks.map((check) => (
                    <div className="activity-row" key={check.key}>
                      <div className="activity-main">
                        <strong>{t(`setup.recoveryChecks.${check.key}`)}</strong>
                        <div className="record-detail">{check.detail}</div>
                      </div>
                      <div className="record-tag-stack">
                        <Tag color={check.passed ? "green" : "gold"}>
                          {check.passed ? t("setup.statusDone") : t("setup.statusPending")}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
                <Space wrap>
                  <Button
                    data-testid="setup-recovery-drill-download"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadRecoveryDrill}
                  >
                    {t("setup.recoveryDrillDownload")}
                  </Button>
                  <Button onClick={handleOpenRestoredTenantInventory}>
                    {t("setup.recoveryDrillOpenRestoredTenant")}
                  </Button>
                </Space>
              </div>
            </Card>
          ) : null}
        </Card>
      </div>

      <Card data-testid="setup-handoff-card" title={t("setup.handoffTitle")}>
        <Paragraph type="secondary">{t("setup.handoffHint")}</Paragraph>
        <div className="page-inline-stack">
          <Button
            icon={<DownloadOutlined />}
            type="primary"
            onClick={() => void handleDownloadHandoffPackage()}
            disabled={!selectedTenantId || !session}
            loading={isPackagingHandoff}
          >
            {t("setup.downloadHandoffPackage")}
          </Button>
          <Button onClick={() => navigate("/login")}>{t("setup.openLoginReference")}</Button>
        </div>

        <div className="record-stack" data-testid="setup-handoff-runbook">
          {[
            t("setup.handoffStepFounder"),
            t("setup.handoffStepOperations"),
            t("setup.handoffStepRoles"),
            t("setup.handoffStepBaseline"),
            t("setup.handoffStepReports"),
          ].map((item) => (
            <div className="compact-record-row" key={item}>
              <strong>{item}</strong>
            </div>
          ))}
        </div>

        {handoffPackage ? (
          <div className="record-stack" data-testid="setup-handoff-summary">
            <div className="compact-record-row">
              <strong>{t("setup.handoffGeneratedFor")}</strong>
              <span>
                {handoffPackage.tenant.name} ({handoffPackage.tenant.slug})
              </span>
            </div>
            <div className="compact-record-row">
              <strong>{t("setup.handoffAccountsLabel")}</strong>
              <span>{handoffPackage.roleAccounts.length}</span>
            </div>
            <div className="compact-record-row">
              <strong>{t("setup.handoffReadinessLabel")}</strong>
              <span>{handoffPackage.operations.readinessLevel}</span>
            </div>
            <div className="compact-record-row">
              <strong>{t("setup.handoffSnapshotLabel")}</strong>
              <span>
                {t("setup.handoffSnapshotValue", {
                  customers: handoffPackage.snapshotSummary.customerCount,
                  suppliers: handoffPackage.snapshotSummary.supplierCount,
                  products: handoffPackage.snapshotSummary.productCount,
                  invoices: handoffPackage.snapshotSummary.invoiceCount,
                })}
              </span>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
