import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

export default function Features() {
  const { t } = useTranslation('landing');
  const { token } = useToken();
  const featureItems = [
    {
      key: 'inventory',
      icon: <AppstoreOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
    {
      key: 'sales',
      icon: <ShoppingCartOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
    {
      key: 'production',
      icon: <ToolOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
    {
      key: 'hr',
      icon: <TeamOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
    {
      key: 'reports',
      icon: <BarChartOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
    {
      key: 'documents',
      icon: <FileTextOutlined style={{ fontSize: 32, color: token.colorPrimary }} />,
    },
  ] as const;

  return (
    <div style={{ padding: '80px 24px', background: token.colorBgElevated }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 60, color: token.colorText }}>
          {t('features.title')}
        </Title>
        <Row gutter={[32, 32]}>
          {featureItems.map((feature) => (
            <Col xs={24} sm={12} lg={8} key={feature.key}>
              <Card hoverable style={{ height: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                <Title level={4} style={{ color: token.colorText }}>
                  {t(`features.items.${feature.key}.title`)}
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary }}>
                  {t(`features.items.${feature.key}.description`)}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
