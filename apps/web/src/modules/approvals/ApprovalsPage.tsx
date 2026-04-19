import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { Button, Card, Empty, Select, Tag, Typography } from "antd";

import type { ApprovalRequestRecord } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

function getRiskColor(riskLevel: ApprovalRequestRecord["riskLevel"]): string {
  return riskLevel === "critical" ? "red" : "volcano";
}

function getStatusColor(status: ApprovalRequestRecord["status"]): string {
  if (status === "approved") {
    return "green";
  }

  if (status === "rejected") {
    return "red";
  }

  return "gold";
}

export function ApprovalsPage(): ReactElement {
  const { formatCurrency, localeCode, t } = useLocale();
  const {
    approvalRequests,
    decideApprovalRequestRecord,
    isBusy,
    selectedTenantId,
    setSelectedTenantId,
    tenants,
  } = useWorkspace();

  const pendingRequests = approvalRequests.filter((request) => request.status === "pending");
  const recentDecisions = approvalRequests.filter((request) => request.status !== "pending").slice(0, 8);

  function formatDateTime(value: string | null): string {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat(localeCode, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function getRequestTypeLabel(requestType: ApprovalRequestRecord["requestType"]): string {
    if (requestType === "inventory_adjustment") {
      return t("approvals.typeInventoryAdjustment");
    }

    if (requestType === "purchase_order_receipt") {
      return t("approvals.typePurchaseReceipt");
    }

    if (requestType === "invoice_issue") {
      return t("approvals.typeInvoiceIssue");
    }

    if (requestType === "invoice_amend") {
      return t("approvals.typeInvoiceAmend");
    }

    if (requestType === "invoice_credit") {
      return t("approvals.typeInvoiceCredit");
    }

    return t("approvals.typeInvoicePayment");
  }

  function getStatusLabel(status: ApprovalRequestRecord["status"]): string {
    if (status === "approved") {
      return t("approvals.statusApproved");
    }

    if (status === "rejected") {
      return t("approvals.statusRejected");
    }

    return t("approvals.statusPending");
  }

  function getRiskLabel(riskLevel: ApprovalRequestRecord["riskLevel"]): string {
    return riskLevel === "critical" ? t("approvals.riskCritical") : t("approvals.riskHigh");
  }

  async function approveRequest(approvalRequestId: string): Promise<void> {
    await decideApprovalRequestRecord({
      approvalRequestId,
      decision: "approved",
      decisionNote: t("approvals.defaultApprovalNote"),
    });
  }

  async function rejectRequest(approvalRequestId: string): Promise<void> {
    await decideApprovalRequestRecord({
      approvalRequestId,
      decision: "rejected",
      decisionNote: t("approvals.defaultRejectNote"),
    });
  }

  return (
    <div className="page-stack workspace-page">
      <div className="page-header">
        <div>
          <Title level={2}>{t("approvals.title")}</Title>
          <Paragraph type="secondary">{t("approvals.subtitle")}</Paragraph>
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
        <Card className="workspace-panel-card" title={t("approvals.pendingTitle")}>
          {selectedTenantId ? (
            pendingRequests.length ? (
              <div className="activity-feed">
                {pendingRequests.map((request) => (
                  <div className="activity-row" key={request.id}>
                    <div className="activity-main">
                      <strong>{request.referenceNumber}</strong>
                      <div className="record-detail">
                        <SafetyCertificateOutlined /> {getRequestTypeLabel(request.requestType)}
                      </div>
                      <div className="record-detail">{request.summary}</div>
                      <div className="record-detail">
                        {t("approvals.reasonLabel")} {request.reason}
                      </div>
                      {request.productCategoryName ? (
                        <div className="record-detail">
                          <AppstoreOutlined /> {t("products.category")}: {request.productCategoryName}
                          {request.productName ? ` - ${request.productName}` : ""}
                          {request.productSku ? ` (${request.productSku})` : ""}
                        </div>
                      ) : null}
                      {typeof request.amount === "number" ? (
                        <div className="record-detail">
                          {t("approvals.amountLabel")} {formatCurrency(request.amount)}
                        </div>
                      ) : null}
                      {typeof request.quantity === "number" ? (
                        <div className="record-detail">
                          {t("approvals.quantityLabel")} {request.quantity}
                        </div>
                      ) : null}
                      <div className="record-detail">
                        {t("approvals.requestedByLabel")} {request.requestedByDisplayName} ({request.requestedByEmail})
                      </div>
                      <div className="record-detail">
                        {t("approvals.requestedAtLabel")} {formatDateTime(request.requestedAt)}
                      </div>
                    </div>
                    <div className="record-tag-stack">
                      <Tag color={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Tag>
                      <Tag color={getRiskColor(request.riskLevel)}>{getRiskLabel(request.riskLevel)}</Tag>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        loading={isBusy}
                        onClick={() => void approveRequest(request.id)}
                      >
                        {t("approvals.approve")}
                      </Button>
                      <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        loading={isBusy}
                        onClick={() => void rejectRequest(request.id)}
                      >
                        {t("approvals.reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("approvals.pendingEmpty")} />
            )
          ) : (
            <Empty description={t("approvals.emptyNoTenant")} />
          )}
        </Card>

        <Card className="workspace-panel-card" title={t("approvals.historyTitle")}>
          {selectedTenantId ? (
            recentDecisions.length ? (
              <div className="record-stack">
                {recentDecisions.map((request) => (
                  <div className="record-row" key={request.id}>
                    <div className="record-icon">
                      <SafetyCertificateOutlined />
                    </div>
                    <div>
                      <strong>{request.referenceNumber}</strong>
                      <div className="record-detail">{request.summary}</div>
                      <div className="record-detail">
                        {getRequestTypeLabel(request.requestType)} - {getRiskLabel(request.riskLevel)}
                      </div>
                      {request.productCategoryName ? (
                        <div className="record-detail">
                          <AppstoreOutlined /> {t("products.category")}: {request.productCategoryName}
                          {request.productName ? ` - ${request.productName}` : ""}
                          {request.productSku ? ` (${request.productSku})` : ""}
                        </div>
                      ) : null}
                      <div className="record-detail">
                        {t("approvals.decidedByLabel")}{" "}
                        {request.decisionByDisplayName
                          ? `${request.decisionByDisplayName} (${request.decisionByEmail})`
                          : "-"}
                      </div>
                      <div className="record-detail">
                        {t("approvals.decidedAtLabel")} {formatDateTime(request.decidedAt)}
                      </div>
                      {request.decisionNote ? (
                        <div className="record-detail">
                          {t("approvals.decisionNoteLabel")} {request.decisionNote}
                        </div>
                      ) : null}
                      <div className="record-detail">
                        <Tag color={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Tag>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t("approvals.historyEmpty")} />
            )
          ) : (
            <Empty description={t("approvals.emptyNoTenant")} />
          )}
        </Card>
      </div>
    </div>
  );
}
