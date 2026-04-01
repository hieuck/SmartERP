import {
  ApartmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { Card, Col, Empty, Row, Space, Statistic, Tag, Typography } from "antd";

import type {
  CollectionActionRequired,
  CollectionActivityState,
  CollectionFollowUpStatus,
  CollectionPriority,
  InvoiceRecord,
} from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

function getCollectionStatusColor(status: InvoiceRecord["collectionStatus"]): string {
  if (status === "settled") {
    return "green";
  }

  if (status === "overdue") {
    return "red";
  }

  if (status === "due_today") {
    return "volcano";
  }

  return "blue";
}

function getCollectionStatusLabel(
  invoice: InvoiceRecord,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (invoice.collectionStatus === "settled") {
    return t("invoices.collectionSettled");
  }

  if (invoice.collectionStatus === "overdue") {
    return t("invoices.collectionOverdue", { count: invoice.daysPastDue });
  }

  if (invoice.collectionStatus === "due_today") {
    return t("invoices.collectionDueToday");
  }

  return t("invoices.collectionCurrent", { count: invoice.daysUntilDue });
}

function getFollowUpStatusColor(status: CollectionFollowUpStatus): string {
  if (status === "escalated") {
    return "red";
  }

  if (status === "promised") {
    return "geekblue";
  }

  if (status === "contacted") {
    return "cyan";
  }

  return "default";
}

function getFollowUpStatusLabel(
  status: CollectionFollowUpStatus,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "contacted") {
    return t("invoices.followUpStatusContacted");
  }

  if (status === "promised") {
    return t("invoices.followUpStatusPromised");
  }

  if (status === "escalated") {
    return t("invoices.followUpStatusEscalated");
  }

  return t("invoices.followUpStatusNew");
}

function getCollectionPriorityColor(priority: CollectionPriority): string {
  if (priority === "critical") {
    return "red";
  }

  if (priority === "high") {
    return "volcano";
  }

  if (priority === "medium") {
    return "gold";
  }

  return "default";
}

function getCollectionPriorityLabel(
  priority: CollectionPriority,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (priority === "critical") {
    return t("invoices.priorityCritical");
  }

  if (priority === "high") {
    return t("invoices.priorityHigh");
  }

  if (priority === "medium") {
    return t("invoices.priorityMedium");
  }

  return t("invoices.priorityLow");
}

function getActionRequiredLabel(
  actionRequired: CollectionActionRequired,
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (actionRequired === "call_customer") {
    return t("invoices.actionCallCustomer");
  }

  if (actionRequired === "confirm_payment") {
    return t("invoices.actionConfirmPayment");
  }

  if (actionRequired === "escalate_founder") {
    return t("invoices.actionEscalateFounder");
  }

  return t("invoices.actionMonitor");
}

function getActivityStateColor(actionState: CollectionActivityState): string {
  return actionState === "resolved" ? "green" : "blue";
}

function getActivityStateLabel(
  actionState: CollectionActivityState,
  t: ReturnType<typeof useLocale>["t"],
): string {
  return actionState === "resolved"
    ? t("invoices.activityStateResolved")
    : t("invoices.activityStateAssigned");
}

function getPriorityRank(priority: CollectionPriority): number {
  if (priority === "critical") {
    return 4;
  }

  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  return 1;
}

export function DashboardPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    foundation,
    session,
    tenants,
    approvalRequests,
    customers,
    products,
    selectedTenant,
    invoices,
    customerStatements,
    collectionActivities,
  } = useWorkspace();

  const openInvoices = invoices.filter((invoice) => invoice.outstandingAmount > 0);
  const overdueInvoices = openInvoices.filter((invoice) => invoice.daysPastDue > 0);
  const dueTodayInvoices = openInvoices.filter((invoice) => invoice.collectionStatus === "due_today");
  const todayDateInput = new Date().toISOString().slice(0, 10);
  const overdueAmount = overdueInvoices.reduce((total, invoice) => total + invoice.outstandingAmount, 0);
  const currentReceivablesAmount = openInvoices
    .filter((invoice) => invoice.daysPastDue === 0)
    .reduce((total, invoice) => total + invoice.outstandingAmount, 0);
  const collectionQueue = [...openInvoices].sort((left, right) => {
    if (getPriorityRank(left.collectionPriority) !== getPriorityRank(right.collectionPriority)) {
      return getPriorityRank(right.collectionPriority) - getPriorityRank(left.collectionPriority);
    }

    if (left.nextActionDate !== right.nextActionDate) {
      return (left.nextActionDate ?? "9999-12-31").localeCompare(right.nextActionDate ?? "9999-12-31");
    }

    if (left.daysPastDue !== right.daysPastDue) {
      return right.daysPastDue - left.daysPastDue;
    }

    if (left.daysUntilDue !== right.daysUntilDue) {
      return left.daysUntilDue - right.daysUntilDue;
    }

    return left.issuedAt.localeCompare(right.issuedAt);
  });
  const todayWorklist = collectionQueue.filter(
    (invoice) =>
      invoice.actionRequired !== "monitor" &&
      invoice.nextActionDate !== null &&
      invoice.nextActionDate <= todayDateInput,
  );
  const recentCollectionActivities = collectionActivities.slice(0, 4);
  const topReceivableCustomer =
    [...customerStatements].sort((left, right) => right.outstandingAmount - left.outstandingAmount)[0] ?? null;
  const pendingApprovals = approvalRequests.filter((request) => request.status === "pending");

  function formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("dashboard.title")}</Title>
          <Paragraph type="secondary">{t("dashboard.subtitle")}</Paragraph>
        </div>
        {session ? <Tag color="blue">{t("dashboard.signedInAs", { name: session.displayName })}</Tag> : null}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t("dashboard.tenantsStat")} value={tenants.length} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t("dashboard.customersStat")} value={customers.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t("dashboard.productsStat")} value={products.length} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
      </Row>

      {selectedTenant ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("dashboard.overdueAmount")}
                  value={overdueAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("dashboard.openInvoices")} value={openInvoices.length} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic title={t("dashboard.dueTodayInvoices")} value={dueTodayInvoices.length} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("dashboard.currentReceivables")}
                  value={currentReceivablesAmount}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card>
                <Statistic
                  title={t("dashboard.pendingApprovals")}
                  value={pendingApprovals.length}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title={t("dashboard.todayWorklistTitle")}>
                {todayWorklist.length ? (
                  <div className="collection-queue">
                    {todayWorklist.slice(0, 4).map((invoice) => (
                      <div className="collection-queue-row" key={invoice.id}>
                        <div className="collection-queue-main">
                          <strong>{invoice.invoiceNumber}</strong>
                          <div className="record-detail">{invoice.customerName}</div>
                          <div className="record-detail">
                            {t("invoices.outstandingLabel")} {formatCurrency(invoice.outstandingAmount)}
                          </div>
                          {invoice.nextActionDate ? (
                            <div className="record-detail">
                              {t("invoices.nextActionDateLabel")}{" "}
                              {new Intl.DateTimeFormat(localeCode, { dateStyle: "medium" }).format(
                                new Date(invoice.nextActionDate),
                              )}
                            </div>
                          ) : null}
                          <div className="record-detail">
                            <PhoneOutlined /> {getActionRequiredLabel(invoice.actionRequired, t)}
                          </div>
                        </div>
                        <div className="record-tag-stack">
                          <Tag color={getCollectionPriorityColor(invoice.collectionPriority)}>
                            {getCollectionPriorityLabel(invoice.collectionPriority, t)}
                          </Tag>
                          <Tag color={getCollectionStatusColor(invoice.collectionStatus)}>
                            {getCollectionStatusLabel(invoice, t)}
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description={t("dashboard.todayWorklistEmpty")} />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={t("dashboard.receivablePressureTitle")}>
                <Space orientation="vertical" size={12}>
                  <div>
                    <strong>{t("dashboard.topReceivableCustomer")}</strong>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {topReceivableCustomer?.customerName ?? t("dashboard.topReceivableEmpty")}
                    </Paragraph>
                  </div>
                  <div>
                    <strong>{t("dashboard.topReceivableAmount")}</strong>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {formatCurrency(topReceivableCustomer?.outstandingAmount ?? 0)}
                    </Paragraph>
                  </div>
                  <div>
                    <strong>{t("shell.selectedTenant")}</strong>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {`${selectedTenant.name} (${selectedTenant.slug})`}
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card title={t("dashboard.recentCollectionsTitle")}>
            {recentCollectionActivities.length ? (
              <div className="activity-feed">
                {recentCollectionActivities.map((activity) => (
                  <div className="activity-row" key={activity.id}>
                    <div className="activity-main">
                      <strong>{activity.invoiceNumber}</strong>
                      <div className="record-detail">{activity.customerName}</div>
                      <div className="record-detail">
                        {t("invoices.activityOutstandingLabel")}{" "}
                        {formatCurrency(activity.outstandingAmountSnapshot)}
                      </div>
                      <div className="record-detail">
                        <PhoneOutlined /> {getActionRequiredLabel(activity.actionRequired, t)}
                      </div>
                      {activity.promisedPaymentDate ? (
                        <div className="record-detail">
                          {t("invoices.promisedPaymentDateLabel")}{" "}
                          {new Intl.DateTimeFormat(localeCode, { dateStyle: "medium" }).format(
                            new Date(activity.promisedPaymentDate),
                          )}
                        </div>
                      ) : null}
                      {activity.collectionNote ? (
                        <div className="record-detail">
                          {t("invoices.collectionNoteLabel")} {activity.collectionNote}
                        </div>
                      ) : null}
                    </div>
                    <div className="activity-meta">
                      <Tag color={getActivityStateColor(activity.actionState)}>
                        {getActivityStateLabel(activity.actionState, t)}
                      </Tag>
                      <Tag color={getCollectionPriorityColor(activity.collectionPriority)}>
                        {getCollectionPriorityLabel(activity.collectionPriority, t)}
                      </Tag>
                      <Tag color={getFollowUpStatusColor(activity.followUpStatus)}>
                        {getFollowUpStatusLabel(activity.followUpStatus, t)}
                      </Tag>
                      <div className="record-detail">
                        <ClockCircleOutlined /> {formatTimestamp(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("dashboard.recentCollectionsEmpty")} />
            )}
          </Card>
        </>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t("dashboard.rewriteOrder")}>
            <div className="record-stack">
              {[...(foundation?.modules ?? [])].map((item, index) => (
                <div className="record-row" key={item}>
                  <Space>
                    <Tag color={index < 4 ? "blue" : "default"}>{index + 1}</Tag>
                    <span>{t(`modules.${item}`)}</span>
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t("shell.activeContext")}>
            <Space orientation="vertical" size={12}>
              <div>
                <strong>{t("shell.session")}</strong>
                <Paragraph style={{ marginBottom: 0 }}>{session?.email ?? t("common.notSignedIn")}</Paragraph>
              </div>
              <div>
                <strong>{t("shell.selectedTenant")}</strong>
                <Paragraph style={{ marginBottom: 0 }}>
                  {selectedTenant
                    ? `${selectedTenant.name} (${selectedTenant.slug})`
                    : t("common.noneSelected")}
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
