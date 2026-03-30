import { BarChartOutlined, FileTextOutlined, InboxOutlined, WarningOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Alert, Card, Col, Empty, Row, Select, Spin, Statistic, Tag, Typography } from "antd";

import type { ReportSummary } from "@smarterp/contracts";

import { getReportSummary } from "../api";
import { useLocale } from "../locale/LocaleContext";
import { localizeErrorMessage } from "../locale/errorMessages";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

export function ReportsPage(): ReactElement {
  const { formatCurrency, t } = useLocale();
  const { selectedTenantId, setSelectedTenantId, tenants } = useWorkspace();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";

  useEffect(() => {
    if (!selectedTenantId) {
      setSummary(null);
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    getReportSummary(selectedTenantId)
      .then(setSummary)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load report summary.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedTenantId, t]);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("reports.title")}</Title>
          <Paragraph type="secondary">{t("reports.subtitle")}</Paragraph>
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

      {error ? <Alert description={error} type="error" showIcon /> : null}

      {!selectedTenantId ? (
        <Card>
          <Empty description={t("reports.emptyNoTenant")} />
        </Card>
      ) : isLoading ? (
        <Card>
          <div className="boot-screen">
            <Spin size="large" />
          </div>
        </Card>
      ) : summary ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.grossSales")}
                  value={summary.grossSalesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.invoicedAmount")}
                  value={summary.invoicedAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.cashCollected")}
                  value={summary.cashCollectedAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.outstandingReceivables")}
                  value={summary.outstandingReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.orderCount")} value={summary.orderCount} prefix={<InboxOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.invoiceCount")} value={summary.invoiceCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.paidInvoices")} value={summary.paidInvoiceCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.openInvoices")} value={summary.openInvoiceCount} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.agingCurrent")}
                  value={summary.currentReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.aging31To60")}
                  value={summary.overdue31To60Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.aging61To90")}
                  value={summary.overdue61To90Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.agingOver90")}
                  value={summary.overdueOver90Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.stockUnits")}
                  value={summary.stockUnitsOnHand}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("reports.averageOrderValue")}
                  value={summary.averageOrderValue}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.outOfStockProducts")} value={summary.outOfStockProductCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("reports.lowStockProducts")} value={summary.lowStockProductCount} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={t("reports.commercialSignals")}>
                <div className="report-signal-stack">
                  <div className="report-signal-row">
                    <div className="report-signal-main">
                      <strong>{t("reports.topCustomer")}</strong>
                      <div className="record-detail">
                        {summary.topCustomerName || t("reports.noCustomerSignal")}
                      </div>
                    </div>
                    <Tag className="report-signal-meta" color="blue">
                      {summary.topCustomerAmount > 0
                        ? formatCurrency(summary.topCustomerAmount)
                        : t("reports.noAmount")}
                    </Tag>
                  </div>
                  <div className="report-signal-row">
                    <div className="report-signal-main">
                      <strong>{t("reports.customerCount")}</strong>
                      <div className="record-detail">{summary.customerCount}</div>
                    </div>
                    <Tag className="report-signal-meta">{t("reports.activeBase")}</Tag>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t("reports.inventorySignals")}>
                <div className="report-signal-stack">
                  <div className="report-signal-row">
                    <div className="report-signal-main">
                      <strong>{t("reports.topProduct")}</strong>
                      <div className="record-detail">
                        {summary.topProductName || t("reports.noProductSignal")}
                      </div>
                    </div>
                    <Tag className="report-signal-meta" color="gold">
                      {summary.topProductUnits > 0
                        ? t("reports.unitsSold", { count: summary.topProductUnits })
                        : t("reports.noUnits")}
                    </Tag>
                  </div>
                  <div className="report-signal-row">
                    <div className="report-signal-main">
                      <strong>{t("reports.productCount")}</strong>
                      <div className="record-detail">{summary.productCount}</div>
                    </div>
                    <Tag className="report-signal-meta">{t("reports.catalogSize")}</Tag>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card>
          <Empty description={t("reports.empty")} />
        </Card>
      )}
    </div>
  );
}
