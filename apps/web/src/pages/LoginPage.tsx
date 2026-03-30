import type { ReactElement } from "react";
import type { FormProps } from "antd";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { Navigate } from "react-router-dom";

import type { LoginInput } from "@smarterp/contracts";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

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
