import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, theme } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const pricingFeatures = {
  basic: [
    'Quản lý kho hàng cơ bản',
    'Quản lý bán hàng',
    'Báo cáo cơ bản',
    'Hỗ trợ email',
    '1 người dùng',
    '1 kho hàng',
  ],
  pro: [
    'Tất cả tính năng gói cơ bản',
    'Quản lý sản xuất',
    'Quản lý nhân sự',
    'Báo cáo nâng cao',
    'Hỗ trợ 24/7',
    'Tối đa 10 người dùng',
    'Nhiều kho hàng',
    'Tích hợp API',
  ],
  enterprise: [
    'Tất cả tính năng gói chuyên nghiệp',
    'Tùy chỉnh theo yêu cầu',
    'Đào tạo chuyên sâu',
    'Hỗ trợ ưu tiên',
    'Không giới hạn người dùng',
    'Không giới hạn kho hàng',
    'Dedicated account manager',
    'SLA 99.9%',
  ],
};

export default function Pricing() {
  const { token } = useToken();

  return (
    <div style={{ padding: '80px 24px', background: token.colorBgElevated }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 60, color: token.colorText }}>
          Bảng giá
        </Title>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <Title level={3} style={{ color: token.colorText }}>Gói cơ bản</Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                299.000đ/tháng
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>Phù hợp cho xưởng nhỏ</Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {pricingFeatures.basic.map((feature, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button type="primary" size="large" block>
                  Dùng thử ngay
                </Button>
              </Link>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ textAlign: 'center', border: `2px solid ${token.colorPrimary}`, height: '100%' }}
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
                Phổ biến nhất
              </div>
              <Title level={3} style={{ color: token.colorText }}>Gói chuyên nghiệp</Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                599.000đ/tháng
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>Phù hợp cho nhà máy vừa</Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {pricingFeatures.pro.map((feature, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Link to="/register">
                <Button type="primary" size="large" block>
                  Dùng thử ngay
                </Button>
              </Link>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <Title level={3} style={{ color: token.colorText }}>Gói doanh nghiệp</Title>
              <Title level={2} style={{ color: token.colorPrimary }}>
                Liên hệ
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>Giải pháp tùy chỉnh</Paragraph>
              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                {pricingFeatures.enterprise.map((feature, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text style={{ color: token.colorText }}>{feature}</Text>
                  </div>
                ))}
              </div>
              <Button size="large" block>
                Liên hệ tư vấn
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
