import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Alert, Button, Card, Divider, Form, Input, Space, Tag, Typography } from "antd";
import { Navigate } from "react-router-dom";

import type { LoginInput } from "@smarterp/contracts";

import { useLocale } from "../../locale/LocaleContext";
import { useWorkspace } from "../../state/WorkspaceContext";
import { getRoleOnboardingPlaybook } from "../onboarding/rolePlaybook";

const { Title, Paragraph, Text } = Typography;

export function LoginPage(): ReactElement {
  const { t } = useLocale();
  const { foundation, session, isBusy, loginToWorkspace, error } = useWorkspace();

  const onFinish: FormProps<LoginInput>["onFinish"] = async (values) => {
    try {
      await loginToWorkspace(values);
    } catch {
      // Error state is already surfaced via workspace context.
    }
  };

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-shell">
      <Card className="login-card" variant="borderless">
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Text className="login-kicker">{t("login.kicker")}</Text>
          <Title level={1} style={{ margin: 0 }}>
            {t("login.title")}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t("login.fallbackMessage")}
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            {t("login.demoAccount")}: <Text strong>{foundation?.demoCredentials.email ?? "..."}</Text> /{" "}
            <Text strong>{foundation?.demoCredentials.password ?? "..."}</Text>
          </Paragraph>
          {foundation?.demoAccounts?.length ? (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                <Text strong>{t("login.roleAccounts")}</Text>
                {foundation.demoAccounts.map((account) => {
                  const playbook = getRoleOnboardingPlaybook(account.role, {
                    hasSelectedTenant: false,
                    customersCount: 0,
                    suppliersCount: 0,
                    productsCount: 0,
                    inventoriesCount: 0,
                    ordersCount: 0,
                    purchaseOrdersCount: 0,
                    openInvoicesCount: 0,
                    overdueInvoicesCount: 0,
                    todayCollectionsCount: 0,
                  });

                  return (
                    <div
                      className="record-row compact-record-row"
                      data-testid={`login-role-card-${account.role}`}
                      key={account.email}
                    >
                      <div>
                        <Space wrap size={[8, 8]}>
                          <strong>{account.displayName}</strong>
                          <Tag color="blue">{t(`roles.${account.role}`)}</Tag>
                          <Tag color="default">
                            {t("roleOnboarding.firstStop")}: {t(`modules.${playbook.primaryModule}`)}
                          </Tag>
                        </Space>
                        <div className="record-detail">{account.email}</div>
                        <div className="record-detail">
                          {t("login.password")}: {account.password}
                        </div>
                        <div className="record-detail">{t(`roleOnboarding.roles.${account.role}.loginHint`)}</div>
                      </div>
                    </div>
                  );
                })}
              </Space>
            </>
          ) : null}
          {error ? <Alert description={error} type="error" showIcon /> : null}
          <Form<LoginInput> layout="vertical" onFinish={onFinish} initialValues={{ email: "", password: "" }}>
            <Form.Item<LoginInput> label={t("login.email")} name="email" rules={[{ required: true }]}>
              <Input autoComplete="email" />
            </Form.Item>
            <Form.Item<LoginInput> label={t("login.password")} name="password" rules={[{ required: true }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={isBusy} block size="large">
              {t("login.enterWorkspace")}
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
