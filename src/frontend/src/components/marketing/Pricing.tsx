import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  cta: string;
  features: string[];
}

export default function Pricing() {
  const { t } = useTranslation('landing');
  const { token } = useToken();

  const plans = {
    basic: t('pricing.plans.basic', { returnObjects: true }) as PricingPlan,
    pro: t('pricing.plans.pro', { returnObjects: true }) as PricingPlan,
    enterprise: t('pricing.plans.enterprise', { returnObjects: true }) as PricingPlan,
  };

  return (
    <div style={{ padding: '80px 24px', background: token.colorBgElevated }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 60, color: token.colorText }}>
          {t('pricing.title')}
        </Title>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <Title level={3} style={{ color: token.colorText }}>
                {plans.basic.name}
              </Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                {plans.basic.price}
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>{plans.basic.description}</Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {plans.basic.features.map((feature) => (
                  <div key={feature} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button type="primary" size="large" block>
                  {plans.basic.cta}
                </Button>
              </Link>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{
                textAlign: 'center',
                border: `2px solid ${token.colorPrimary}`,
                height: '100%',
              }}
            >
              <div
                style={{
                  background: token.colorPrimary,
                  color: token.colorWhite,
                  padding: '4px 16px',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginBottom: 16,
                }}
              >
                {t('pricing.popularBadge')}
              </div>
              <Title level={3} style={{ color: token.colorText }}>
                {plans.pro.name}
              </Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                {plans.pro.price}
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>{plans.pro.description}</Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {plans.pro.features.map((feature) => (
                  <div key={feature} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button type="primary" size="large" block>
                  {plans.pro.cta}
                </Button>
              </Link>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <Title level={3} style={{ color: token.colorText }}>
                {plans.enterprise.name}
              </Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                {plans.enterprise.price}
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>
                {plans.enterprise.description}
              </Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {plans.enterprise.features.map((feature) => (
                  <div key={feature} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Button size="large" block>
                {plans.enterprise.cta}
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
