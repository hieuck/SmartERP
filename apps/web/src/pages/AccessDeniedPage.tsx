import type { ReactElement } from "react";
import { Button, Card, Result } from "antd";
import { useNavigate } from "react-router-dom";

import type { FoundationModule } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";

type AccessDeniedPageProps = {
  module: FoundationModule;
};

export function AccessDeniedPage({ module }: AccessDeniedPageProps): ReactElement {
  const navigate = useNavigate();
  const { t } = useLocale();
  const moduleLabelKeyByModule: Record<FoundationModule, string> = {
    identity: "common.workspace",
    tenant: "shell.tenants",
    customers: "shell.customers",
    suppliers: "shell.suppliers",
    products: "shell.products",
    purchasing: "shell.purchaseOrders",
    orders: "shell.orders",
    inventory: "shell.inventory",
    invoices: "shell.invoices",
    reporting: "shell.reports",
    approvals: "shell.approvals",
    operations: "shell.operations",
  };

  return (
    <div className="page-stack">
      <Card>
        <Result
          status="403"
          title={t("accessDenied.title")}
          subTitle={t("accessDenied.description", {
            module: t(moduleLabelKeyByModule[module]),
          })}
          extra={
            <Button type="primary" onClick={() => navigate("/dashboard")}>
              {t("accessDenied.backToDashboard")}
            </Button>
          }
        />
      </Card>
    </div>
  );
}
