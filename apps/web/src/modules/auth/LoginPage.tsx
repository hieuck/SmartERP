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
        <div className="login-frame">
          <div className="login-story">
            <div className="login-story-header">
              <Text className="login-kicker">{t("login.kicker")}</Text>
              <Title level={1} className="login-title">
                {t("login.title")}
              </Title>
              <Paragraph type="secondary" className="login-copy">
                {t("login.fallbackMessage")}
              </Paragraph>
            </div>

            <div className="login-demo-banner">
              <Text strong>{t("login.demoAccount")}</Text>
              <Paragraph className="login-demo-credentials">
                <Text strong>{foundation?.demoCredentials.email ?? "..."}</Text>
                <span>/</span>
                <Text strong>{foundation?.demoCredentials.password ?? "..."}</Text>
              </Paragraph>
            </div>

            {foundation?.demoAccounts?.length ? (
              <div className="login-role-section">
                <Divider style={{ margin: 0 }} />
                <div className="login-role-section-header">
                  <Text strong>{t("login.roleAccounts")}</Text>
                  <Text type="secondary">{foundation.demoAccounts.length}</Text>
                </div>
                <div className="login-role-grid">
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
                        className="login-role-card"
                        data-testid={`login-role-card-${account.role}`}
                        key={account.email}
                      >
                        <div className="login-role-card-header">
                          <strong>{account.displayName}</strong>
                          <Tag color="blue">{t(`roles.${account.role}`)}</Tag>
                        </div>
                        <div className="login-role-card-route">
                          <Text type="secondary">{t("roleOnboarding.firstStop")}</Text>
                          <Tag color="default">{t(`modules.${playbook.primaryModule}`)}</Tag>
                        </div>
                        <div className="record-detail">{account.email}</div>
                        <div className="record-detail">
                          {t("login.password")}: {account.password}
                        </div>
                        <div className="login-role-card-hint">
                          {t(`roleOnboarding.roles.${account.role}.loginHint`)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="login-form-panel">
            <div className="login-form-panel-header">
              <Title level={3} style={{ marginBottom: 8 }}>
                {t("login.enterWorkspace")}
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("common.workspace")}
              </Paragraph>
            </div>

            {error ? <Alert description={error} type="error" showIcon /> : null}

            <Form<LoginInput> layout="vertical" onFinish={onFinish} initialValues={{ email: "", password: "" }}>
              <Form.Item<LoginInput> label={t("login.email")} name="email" rules={[{ required: true }]}>
                <Input autoComplete="email" size="large" />
              </Form.Item>
              <Form.Item<LoginInput> label={t("login.password")} name="password" rules={[{ required: true }]}>
                <Input.Password autoComplete="current-password" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={isBusy} block size="large">
                {t("login.enterWorkspace")}
              </Button>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
}
