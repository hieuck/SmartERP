import {
  AppstoreOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Alert, Card, Col, Empty, Row, Select, Spin, Statistic, Tag, Typography } from "antd";

import type {
  AccountBalanceRecord,
  AuditActionType,
  AuditLogRecord,
  JournalEntryRecord,
  PaymentMethod,
  ReportSummary,
} from "@smarterp/contracts";

import {
  loadAccountBalances,
  loadAuditLogs,
  loadJournalEntries,
  loadReportSummary,
} from "./api";
import { useLocale } from "../../locale/LocaleContext";
import { localizeErrorMessage } from "../../locale/errorMessages";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

function getAuditActionColor(actionType: AuditActionType): string {
  if (actionType === "invoice_reissued") {
    return "geekblue";
  }

  if (actionType === "invoice_amended") {
    return "purple";
  }

  if (actionType === "invoice_credited") {
    return "magenta";
  }

  if (actionType === "invoice_return_received") {
    return "cyan";
  }

  if (actionType === "invoice_voided") {
    return "default";
  }

  if (actionType === "invoice_reopened") {
    return "green";
  }

  if (actionType === "order_returned") {
    return "magenta";
  }

  if (actionType === "order_updated" || actionType === "purchase_order_updated") {
    return "processing";
  }

  if (actionType === "purchase_order_received") {
    return "cyan";
  }

  if (
    actionType === "order_closed" ||
    actionType === "purchase_order_closed" ||
    actionType === "order_reopened" ||
    actionType === "purchase_order_reopened"
  ) {
    return "green";
  }

  if (actionType === "order_canceled" || actionType === "purchase_order_canceled") {
    return "orange";
  }

  if (actionType === "approval_requested") {
    return "gold";
  }

  if (actionType === "invoice_issued") {
    return "blue";
  }

  if (actionType === "payment_recorded") {
    return "green";
  }

  if (actionType === "approval_approved") {
    return "green";
  }

  if (actionType === "approval_rejected") {
    return "red";
  }

  if (actionType === "collection_action_resolved") {
    return "purple";
  }

  return "gold";
}

function getAuditActionLabel(
  actionType: AuditActionType,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (actionType === "invoice_voided") {
    return t("reports.auditActionInvoiceVoided");
  }

  if (actionType === "invoice_reissued") {
    return t("reports.auditActionInvoiceReissued");
  }

  if (actionType === "invoice_amended") {
    return t("reports.auditActionInvoiceAmended");
  }

  if (actionType === "invoice_credited") {
    return t("reports.auditActionInvoiceCredited");
  }

  if (actionType === "invoice_return_received") {
    return t("reports.auditActionInvoiceReturnReceived");
  }

  if (actionType === "invoice_reopened") {
    return t("reports.auditActionInvoiceReopened");
  }

  if (actionType === "order_updated") {
    return t("reports.auditActionOrderUpdated");
  }

  if (actionType === "purchase_order_received") {
    return t("reports.auditActionPurchaseOrderReceived");
  }

  if (actionType === "order_canceled") {
    return t("reports.auditActionOrderCanceled");
  }

  if (actionType === "order_closed") {
    return t("reports.auditActionOrderClosed");
  }

  if (actionType === "order_returned") {
    return t("reports.auditActionOrderReturned");
  }

  if (actionType === "order_reopened") {
    return t("reports.auditActionOrderReopened");
  }

  if (actionType === "purchase_order_updated") {
    return t("reports.auditActionPurchaseOrderUpdated");
  }

  if (actionType === "purchase_order_canceled") {
    return t("reports.auditActionPurchaseOrderCanceled");
  }

  if (actionType === "purchase_order_closed") {
    return t("reports.auditActionPurchaseOrderClosed");
  }

  if (actionType === "purchase_order_reopened") {
    return t("reports.auditActionPurchaseOrderReopened");
  }

  if (actionType === "approval_requested") {
    return t("reports.auditActionApprovalRequested");
  }

  if (actionType === "invoice_issued") {
    return t("reports.auditActionInvoiceIssued");
  }

  if (actionType === "payment_recorded") {
    return t("reports.auditActionPaymentRecorded");
  }

  if (actionType === "approval_approved") {
    return t("reports.auditActionApprovalApproved");
  }

  if (actionType === "approval_rejected") {
    return t("reports.auditActionApprovalRejected");
  }

  if (actionType === "collection_action_resolved") {
    return t("reports.auditActionCollectionResolved");
  }

  return t("reports.auditActionCollectionUpdated");
}

function getPaymentMethodLabel(
  method: PaymentMethod,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (method === "cash") {
    return t("invoices.methodCash");
  }

  if (method === "card") {
    return t("invoices.methodCard");
  }

  return t("invoices.methodBankTransfer");
}

export function ReportsPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const { selectedTenantId, setSelectedTenantId, tenants } = useWorkspace();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalanceRecord[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";

  useEffect(() => {
    if (!selectedTenantId) {
      setSummary(null);
      setAccountBalances([]);
      setJournalEntries([]);
      setAuditLogs([]);
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    Promise.all([
      loadReportSummary(selectedTenantId),
      loadAccountBalances(selectedTenantId),
      loadJournalEntries(selectedTenantId),
      loadAuditLogs(selectedTenantId),
    ])
      .then(([nextSummary, nextAccountBalances, nextJournalEntries, nextAuditLogs]) => {
        setSummary(nextSummary);
        setAccountBalances(nextAccountBalances);
        setJournalEntries(nextJournalEntries);
        setAuditLogs(nextAuditLogs);
      })
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load report summary.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedTenantId, t]);

  function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
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
        <Card className="workspace-panel-card">
          <Empty description={t("reports.emptyNoTenant")} />
        </Card>
      ) : isLoading ? (
        <Card className="workspace-panel-card">
          <div className="boot-screen">
            <Spin size="large" />
          </div>
        </Card>
      ) : summary ? (
        <>
          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.grossSales")}
                  value={summary.grossSalesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.invoicedAmount")}
                  value={summary.invoicedAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.cashCollected")}
                  value={summary.cashCollectedAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.outstandingReceivables")}
                  value={summary.outstandingReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.creditedAmount")}
                  value={summary.creditedAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.orderCount")} value={summary.orderCount} prefix={<InboxOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.invoiceCount")} value={summary.invoiceCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.paidInvoices")} value={summary.paidInvoiceCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.openInvoices")} value={summary.openInvoiceCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.creditedInvoices")} value={summary.creditedInvoiceCount} />
              </Card>
            </Col>
          </Row>

          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.agingCurrent")}
                  value={summary.currentReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.aging31To60")}
                  value={summary.overdue31To60Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.aging61To90")}
                  value={summary.overdue61To90Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.agingOver90")}
                  value={summary.overdueOver90Amount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
          </Row>

          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.stockUnits")}
                  value={summary.stockUnitsOnHand}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.inventoryValue")}
                  value={summary.inventoryValueAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.averageOrderValue")} value={summary.averageOrderValue} formatter={(value) => formatCurrency(Number(value))} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.outOfStockProducts")} value={summary.outOfStockProductCount} />
              </Card>
            </Col>
          </Row>

          <Row className="workspace-metrics-grid" gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic title={t("reports.lowStockProducts")} value={summary.lowStockProductCount} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="workspace-metric-card">
                <Statistic
                  title={t("reports.categoryCount")}
                  value={summary.categoryCount}
                  prefix={<AppstoreOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card className="workspace-panel-card" title={t("reports.commercialSignals")}>
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
              <Card className="workspace-panel-card" title={t("reports.inventorySignals")}>
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
                      <strong>{t("reports.topCategory")}</strong>
                      <div className="record-detail">
                        {summary.topCategoryName || t("reports.noCategorySignal")}
                      </div>
                    </div>
                    <Tag className="report-signal-meta" color="purple">
                      {summary.topCategorySalesAmount > 0
                        ? formatCurrency(summary.topCategorySalesAmount)
                        : t("reports.noAmount")}
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

          <Card
            className="workspace-panel-card"
            data-testid="reports-category-performance-card"
            title={t("reports.categoryPerformanceTitle")}
          >
            {summary.categoryPerformance.length ? (
              <div className="report-signal-stack">
                {summary.categoryPerformance.map((category) => (
                  <div className="report-signal-row" key={category.categoryId}>
                    <div className="report-signal-main">
                      <strong>{category.categoryName}</strong>
                      <div className="record-detail">
                        {t("reports.categoryProductCount", { count: category.productCount })}
                      </div>
                      <div className="record-detail">
                        {t("reports.categoryStockUnits", { count: category.stockUnitsOnHand })}
                      </div>
                      <div className="record-detail">
                        {t("reports.categoryInventoryValue")} {formatCurrency(category.inventoryValueAmount)}
                      </div>
                      <div className="record-detail">
                        {t("reports.categoryPurchaseCommitment")}{" "}
                        {formatCurrency(category.purchaseCommitmentAmount)}
                      </div>
                    </div>
                    <Tag className="report-signal-meta" color="blue">
                      {formatCurrency(category.grossSalesAmount)}
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("reports.categoryPerformanceEmpty")} />
            )}
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card className="workspace-panel-card" title={t("reports.ledgerTitle")}>
                {accountBalances.length ? (
                  <div className="record-stack">
                    {accountBalances.map((account) => (
                      <div className="report-signal-row" key={account.accountCode}>
                        <div className="report-signal-main">
                          <strong>{account.accountCode}</strong>
                          <div className="record-detail">{account.accountName}</div>
                        </div>
                        <Tag className="report-signal-meta" color="blue">
                          {formatCurrency(account.balanceAmount)}
                        </Tag>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description={t("reports.ledgerEmpty")} />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card className="workspace-panel-card" title={t("reports.journalTitle")}>
                {journalEntries.length ? (
                  <div className="record-stack">
                    {journalEntries.map((entry) => (
                      <div className="record-row" key={entry.id}>
                        <div className="record-icon">
                          <FileTextOutlined />
                        </div>
                        <div>
                          <strong>{entry.referenceNumber}</strong>
                          <div className="record-detail">{entry.description}</div>
                          <div className="record-detail">
                            {entry.accountCode} - {entry.accountName}
                          </div>
                          <div className="record-detail">
                            {t("reports.journalDebit")} {formatCurrency(entry.debitAmount)}
                          </div>
                          <div className="record-detail">
                            {t("reports.journalCredit")} {formatCurrency(entry.creditAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description={t("reports.journalEmpty")} />
                )}
              </Card>
            </Col>
          </Row>

          <Card className="workspace-panel-card" title={t("reports.auditTitle")}>
            {auditLogs.length ? (
              <div className="activity-feed">
                {auditLogs.map((auditLog) => (
                  <div className="activity-row" key={auditLog.id}>
                    <div className="activity-main">
                      <strong>{auditLog.entityNumber}</strong>
                      <div className="record-detail">{auditLog.summary}</div>
                      <div className="record-detail">
                        {t("reports.auditActorLabel")} {auditLog.actorDisplayName} ({auditLog.actorEmail})
                      </div>
                      {typeof auditLog.metadata.amount === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditAmountLabel")} {formatCurrency(auditLog.metadata.amount)}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.quantity === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditQuantityLabel")} {auditLog.metadata.quantity}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.creditedQuantity === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditCreditedQuantityLabel")} {auditLog.metadata.creditedQuantity}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.returnedQuantity === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditReturnedQuantityLabel")} {auditLog.metadata.returnedQuantity}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.inventoryValue === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditInventoryValueLabel")} {formatCurrency(auditLog.metadata.inventoryValue)}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.inventoryRestocked === "boolean" ? (
                        <div className="record-detail">
                          {t("reports.auditInventoryImpactLabel")}{" "}
                          {auditLog.metadata.inventoryRestocked
                            ? t("reports.auditInventoryRestocked")
                            : t("reports.auditInventoryNotRestocked")}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.outstandingAmount === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditOutstandingLabel")}{" "}
                          {formatCurrency(auditLog.metadata.outstandingAmount)}
                        </div>
                      ) : null}
                      {auditLog.metadata.productCategoryName ? (
                        <div className="record-detail">
                          <AppstoreOutlined /> {t("products.category")}: {auditLog.metadata.productCategoryName}
                          {auditLog.metadata.productName ? ` - ${auditLog.metadata.productName}` : ""}
                          {auditLog.metadata.productSku ? ` (${auditLog.metadata.productSku})` : ""}
                        </div>
                      ) : null}
                      {auditLog.metadata.reissuedFromInvoiceNumber ? (
                        <div className="record-detail">
                          {t("reports.auditReissuedFromLabel")} {auditLog.metadata.reissuedFromInvoiceNumber}
                        </div>
                      ) : null}
                      {auditLog.metadata.reissuedToInvoiceNumber ? (
                        <div className="record-detail">
                          {t("reports.auditReissuedToLabel")} {auditLog.metadata.reissuedToInvoiceNumber}
                        </div>
                      ) : null}
                      {auditLog.metadata.amendmentRootInvoiceNumber ? (
                        <div className="record-detail">
                          {t("reports.auditAmendmentRootLabel")} {auditLog.metadata.amendmentRootInvoiceNumber}
                        </div>
                      ) : null}
                      {auditLog.metadata.amendmentNote ? (
                        <div className="record-detail">
                          {t("reports.auditAmendmentNoteLabel")} {auditLog.metadata.amendmentNote}
                        </div>
                      ) : null}
                      {typeof auditLog.metadata.revisionNumber === "number" ? (
                        <div className="record-detail">
                          {t("reports.auditRevisionLabel")}{" "}
                          {t("invoices.revisionValue", { count: auditLog.metadata.revisionNumber })}
                        </div>
                      ) : null}
                      {auditLog.metadata.paymentMethod ? (
                        <div className="record-detail">
                          {t("reports.auditMethodLabel")}{" "}
                          {getPaymentMethodLabel(auditLog.metadata.paymentMethod, t)}
                        </div>
                      ) : null}
                      {auditLog.metadata.promisedPaymentDate ? (
                        <div className="record-detail">
                          {t("reports.auditPromisedDateLabel")}{" "}
                          {formatDate(auditLog.metadata.promisedPaymentDate)}
                        </div>
                      ) : null}
                      {auditLog.metadata.nextActionDate ? (
                        <div className="record-detail">
                          {t("reports.auditNextActionDateLabel")}{" "}
                          {formatDate(auditLog.metadata.nextActionDate)}
                        </div>
                      ) : null}
                      {auditLog.metadata.note ? (
                        <div className="record-detail">
                          {t("reports.auditNoteLabel")} {auditLog.metadata.note}
                        </div>
                      ) : null}
                    </div>
                    <div className="activity-meta">
                      <Tag color={getAuditActionColor(auditLog.actionType)}>
                        {getAuditActionLabel(auditLog.actionType, t)}
                      </Tag>
                      <div className="record-detail">
                        <ClockCircleOutlined /> {formatDateTime(auditLog.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("reports.auditEmpty")} />
            )}
          </Card>
        </>
      ) : (
        <Card className="workspace-panel-card">
          <Empty description={t("reports.empty")} />
        </Card>
      )}
    </div>
  );
}
