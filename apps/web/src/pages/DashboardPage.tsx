import { ApartmentOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import { Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Paragraph, Title } = Typography;

export function DashboardPage(): ReactElement {
  const { t } = useLocale();
  const { foundation, session, tenants, customers, products, selectedTenant } = useWorkspace();

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <Title level={2}>{t("dashboard.title")}</Title>
          <Paragraph type="secondary">
            {t("dashboard.subtitle")}
          </Paragraph>
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
