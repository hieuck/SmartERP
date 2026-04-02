import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ControlOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";

import type { OperationsStatusPayload, OperationsTenantStatusRecord } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { localizeErrorMessage } from "../../locale/errorMessages";
import { loadOperationsStatus } from "./api";

const { Paragraph, Text, Title } = Typography;

function getTenantPressureColor(record: OperationsTenantStatusRecord): string {
  if (record.overdueReceivablesAmount > 0 || record.pendingApprovalCount > 0) {
    return "volcano";
  }

  if (record.openInvoiceCount > 0) {
    return "gold";
  }

  return "green";
}

function getReadinessLevelColor(level: OperationsStatusPayload["readiness"]["level"]): string {
  if (level === "ready") {
    return "green";
  }

  if (level === "warning") {
    return "gold";
  }

  return "red";
}

function getBuildBudgetColor(passed: boolean): string {
  return passed ? "green" : "gold";
}

export function OperationsPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const [status, setStatus] = useState<OperationsStatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";

  async function loadStatus(): Promise<void> {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setStatus(await loadOperationsStatus());
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Failed to load operations status.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  function formatDateTime(value: string | null): string {
    if (!value) {
      return t("operations.none");
    }

    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function formatBytes(value: number): string {
    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getReadinessLabel(level: OperationsStatusPayload["readiness"]["level"]): string {
    if (level === "ready") {
      return t("operations.readinessReady");
    }

    if (level === "warning") {
      return t("operations.readinessWarning");
    }

    return t("operations.readinessBlocked");
  }

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("operations.title")}</Title>
          <Paragraph type="secondary">{t("operations.subtitle")}</Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void loadStatus()} loading={isLoading}>
          {t("operations.refresh")}
        </Button>
      </div>

      {error ? <Alert description={error} type="error" showIcon /> : null}

      {!status && isLoading ? (
        <Card>
          <div className="boot-screen">
            <Spin size="large" />
          </div>
        </Card>
      ) : status ? (
        <>
          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.tenantCount")}
                  value={status.totals.tenantCount}
                  prefix={<ControlOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.openInvoices")}
                  value={status.totals.openInvoiceCount}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.overdueReceivables")}
                  value={status.totals.overdueReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.pendingApprovals")}
                  value={status.totals.pendingApprovalCount}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.todayCollections")}
                  value={status.totals.todayCollectionActionCount}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={4}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.smokeChecks")}
                  value={status.smoke?.verifiedCheckCount ?? 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("operations.productCount")} value={status.totals.productCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("operations.openPurchaseOrders")} value={status.totals.openPurchaseOrderCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("operations.dbSize")}
                  value={formatBytes(status.database.sizeBytes)}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("operations.inventoryLines")} value={status.totals.inventoryLineCount} />
              </Card>
            </Col>
          </Row>

          <Card className="workspace-panel-card" title={t("operations.readinessTitle")}>
            <div className="record-stack">
              <div className="compact-record-row">
                <strong>{t("operations.readinessState")}</strong>
                <span>
                  <Tag color={getReadinessLevelColor(status.readiness.level)}>
                    {getReadinessLabel(status.readiness.level)}
                  </Tag>
                </span>
              </div>
              <div className="compact-record-row">
                <strong>{t("operations.readinessPassed")}</strong>
                <span>{status.readiness.passedCheckCount}</span>
              </div>
              <div className="compact-record-row">
                <strong>{t("operations.readinessWarnings")}</strong>
                <span>{status.readiness.warningCheckCount}</span>
              </div>
              <div className="compact-record-row">
                <strong>{t("operations.readinessFailed")}</strong>
                <span>{status.readiness.failedCheckCount}</span>
              </div>
            </div>

            <div className="activity-feed" data-testid="operations-readiness-checks">
              {status.readiness.checks.map((check) => (
                <div className="activity-row" key={check.key}>
                  <div className="activity-main">
                    <Space wrap>
                      <strong>{check.label}</strong>
                      <Tag color={check.passed ? "green" : check.severity === "critical" ? "red" : "gold"}>
                        {check.passed
                          ? t("operations.checkPassed")
                          : check.severity === "critical"
                            ? t("operations.checkCritical")
                            : t("operations.checkWarning")}
                      </Tag>
                    </Space>
                    <div className="record-detail">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="two-column">
            <Card className="workspace-panel-card" title={t("operations.databaseTitle")}>
              <div className="record-stack">
                <div className="compact-record-row">
                  <strong>{t("operations.serviceStatus")}</strong>
                  <span>
                    <Tag color="green">{status.status}</Tag>
                  </span>
                </div>
                <div className="compact-record-row">
                  <strong>{t("operations.foundation")}</strong>
                  <span>{status.foundation}</span>
                </div>
                <div className="compact-record-row">
                  <strong>{t("operations.generatedAt")}</strong>
                  <span>{formatDateTime(status.generatedAt)}</span>
                </div>
                <div className="compact-record-row">
                  <strong>{t("operations.databasePath")}</strong>
                  <Text code>{status.database.path}</Text>
                </div>
                <div className="compact-record-row">
                  <strong>{t("operations.databaseUpdatedAt")}</strong>
                  <span>{formatDateTime(status.database.updatedAt)}</span>
                </div>
              </div>

              <div className="record-stack">
                <strong>{t("operations.runtimeServicesTitle")}</strong>
                <div className="activity-feed">
                  {status.runtimeServices.map((service) => (
                    <div className="activity-row" key={service.key}>
                      <div className="activity-main">
                        <Space wrap>
                          <strong>{service.label}</strong>
                          <Tag color={service.healthy ? "green" : "red"}>
                            {service.healthy ? t("operations.runtimeHealthy") : t("operations.runtimeDown")}
                          </Tag>
                          <Tag color={service.pid ? "blue" : "default"}>
                            {service.pid ? `${t("operations.runtimePid")} ${service.pid}` : t("operations.runtimePidMissing")}
                          </Tag>
                        </Space>
                        <div className="record-detail">{service.url}</div>
                        <div className="record-detail">
                          {t("operations.runtimeLogUpdated")} {formatDateTime(service.lastLogUpdateAt)}
                        </div>
                        <div className="record-detail">
                          {t("operations.runtimeStdout")} <Text code>{service.stdoutPath}</Text>
                        </div>
                        <div className="record-detail">
                          {t("operations.runtimeStderr")} <Text code>{service.stderrPath}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="record-stack">
                <strong>{t("operations.artifactsTitle")}</strong>
                <div className="activity-feed">
                  {status.artifacts.map((artifact) => (
                    <div className="activity-row" key={artifact.key}>
                      <div className="activity-main">
                        <Space wrap>
                          <strong>{artifact.label}</strong>
                          <Tag color={artifact.exists ? "green" : "red"}>
                            {artifact.exists ? t("operations.artifactReady") : t("operations.artifactMissing")}
                          </Tag>
                        </Space>
                        <div className="record-detail">
                          {t("operations.artifactUpdated")} {formatDateTime(artifact.updatedAt)}
                        </div>
                        <div className="record-detail">
                          {t("operations.artifactSize")} {formatBytes(artifact.sizeBytes)}
                        </div>
                        <div className="record-detail">
                          <Text code>{artifact.path}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="record-stack" data-testid="operations-build-summary">
                <strong>{t("operations.buildTitle")}</strong>
                {status.build ? (
                  <>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildState")}</strong>
                      <span>
                        <Tag color={getBuildBudgetColor(status.build.budget.passed)}>
                          {status.build.budget.passed ? t("operations.buildHealthy") : t("operations.buildWarning")}
                        </Tag>
                      </span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildCheckedAt")}</strong>
                      <span>{formatDateTime(status.build.checkedAt)}</span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildLargestJs")}</strong>
                      <span>
                        {status.build.largestJavaScriptAsset
                          ? `${status.build.largestJavaScriptAsset.fileName} (${formatBytes(status.build.largestJavaScriptAsset.sizeBytes)})`
                          : t("operations.none")}
                      </span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildTotalJs")}</strong>
                      <span>{formatBytes(status.build.totalJavaScriptBytes)}</span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildTotalCss")}</strong>
                      <span>{formatBytes(status.build.totalCssBytes)}</span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildAssetCount")}</strong>
                      <span>{status.build.totalAssetCount}</span>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildSummaryPath")}</strong>
                      <Text code>{status.build.summaryPath}</Text>
                    </div>
                    <div className="compact-record-row">
                      <strong>{t("operations.buildDistPath")}</strong>
                      <Text code>{status.build.distPath}</Text>
                    </div>
                    <div className="activity-feed">
                      {status.build.vendorAssets.map((asset) => (
                        <div className="activity-row" key={asset.relativePath}>
                          <div className="activity-main">
                            <Space wrap>
                              <strong>{asset.fileName}</strong>
                              <Tag color={asset.vendor ? "blue" : "default"}>
                                {asset.vendor ? t("operations.buildVendorAsset") : t("operations.buildFeatureAsset")}
                              </Tag>
                            </Space>
                            <div className="record-detail">{formatBytes(asset.sizeBytes)}</div>
                            <div className="record-detail">
                              <Text code>{asset.relativePath}</Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Empty description={t("operations.buildEmpty")} />
                )}
              </div>
            </Card>

            <Card className="workspace-panel-card" title={t("operations.smokeTitle")}>
              {status.smoke ? (
                <div className="record-stack">
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeState")}</strong>
                    <span>
                      <Tag color={status.smoke.passed ? "green" : "red"}>
                        {status.smoke.passed ? t("operations.smokePassed") : t("operations.smokeFailed")}
                      </Tag>
                    </span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeCheckedAt")}</strong>
                    <span>{formatDateTime(status.smoke.checkedAt)}</span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeTenant")}</strong>
                    <span>{status.smoke.tenantName ?? t("operations.none")}</span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeWarnings")}</strong>
                    <span>{status.smoke.consoleWarningCount}</span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeErrors")}</strong>
                    <span>{status.smoke.consoleErrorCount}</span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeFailures")}</strong>
                    <span>{status.smoke.failedRequestCount}</span>
                  </div>
                  <div className="compact-record-row">
                    <strong>{t("operations.smokeSummaryPath")}</strong>
                    <Text code>{status.smoke.summaryPath}</Text>
                  </div>
                  {status.smoke.screenshotPath ? (
                    <div className="compact-record-row">
                      <strong>{t("operations.smokeScreenshotPath")}</strong>
                      <Text code>{status.smoke.screenshotPath}</Text>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Empty description={t("operations.smokeEmpty")} />
              )}
            </Card>
          </div>

          <Card className="workspace-panel-card" title={t("operations.tenantsTitle")}>
            {status.tenants.length ? (
              <div className="activity-feed">
                {status.tenants.map((tenant) => (
                  <div className="activity-row" key={tenant.tenantId}>
                    <div className="activity-main">
                      <Space wrap>
                        <strong>{tenant.tenantName}</strong>
                        <Tag>{tenant.tenantSlug}</Tag>
                        <Tag color={getTenantPressureColor(tenant)}>{tenant.industry}</Tag>
                      </Space>
                      <div className="record-detail">
                        {t("operations.tenantOpenInvoices")} {tenant.openInvoiceCount}
                      </div>
                      <div className="record-detail">
                        {t("operations.tenantOverdue")} {formatCurrency(tenant.overdueReceivablesAmount)}
                      </div>
                      <div className="record-detail">
                        {t("operations.tenantPendingApprovals")} {tenant.pendingApprovalCount}
                      </div>
                      <div className="record-detail">
                        {t("operations.tenantInventoryValue")} {formatCurrency(tenant.inventoryValueAmount)}
                      </div>
                    </div>
                    <div className="record-tag-stack">
                      <Tag color="blue">{tenant.customerCount}</Tag>
                      <Tag color="purple">{tenant.productCount}</Tag>
                      <Tag color="gold">{tenant.supplierCount}</Tag>
                      <div className="record-detail">
                        {t("operations.tenantLastActivity")}{" "}
                        {tenant.lastActivityAt ? formatDateTime(tenant.lastActivityAt) : t("operations.tenantNoActivity")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("operations.empty")} />
            )}
          </Card>
        </>
      ) : (
        <Card className="workspace-panel-card">
          <Empty description={t("operations.empty")} />
        </Card>
      )}
    </div>
  );
}
