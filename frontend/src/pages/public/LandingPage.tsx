import { Link } from 'react-router-dom';
import { Layout, Button, Row, Col, Card, Typography, Space } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function LandingPage() {
  const features = [
    {
      icon: <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Quản lý kho hàng',
      description: 'Theo dõi tồn kho, nhập xuất hàng hóa tự động, cảnh báo hết hàng cho mọi loại sản phẩm',
    },
    {
      icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Quản lý bán hàng',
      description: 'Đơn hàng, báo giá, hóa đơn, công nợ khách hàng - linh hoạt với mọi ngành hàng',
    },
    {
      icon: <ToolOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Quản lý sản xuất',
      description: 'Lệnh sản xuất, nguyên vật liệu, quy trình sản xuất, kiểm tra chất lượng',
    },
    {
      icon: <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Quản lý nhân sự',
      description: 'Chấm công, tính lương, ứng lương, quản lý ca làm việc cho mọi quy mô',
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Báo cáo thống kê',
      description: 'Dashboard trực quan, báo cáo doanh thu, lợi nhuận, tồn kho theo thời gian thực',
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Quản lý tài liệu',
      description: 'Hóa đơn, chứng từ, hợp đồng, xuất file Excel/PDF tự động',
    },
  ];

  const benefits = [
    'Dùng thử miễn phí 14 ngày',
    'Linh hoạt với mọi ngành hàng',
    'Không cần cài đặt, truy cập mọi lúc mọi nơi',
    'Dữ liệu được bảo mật tuyệt đối',
    'Hỗ trợ 24/7',
    'Cập nhật tính năng liên tục',
    'Đào tạo miễn phí',
    'Tùy chỉnh theo nhu cầu doanh nghiệp',
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Header */}
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000, padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text strong style={{ color: '#fff', fontSize: 20 }}>P</Text>
              </div>
              <Text strong style={{ fontSize: 20, color: '#000' }}>SmartERP</Text>
            </Link>
          </Col>
          <Col>
            <Space size="large">
              <a href="#features" style={{ color: '#595959' }}>Tính năng</a>
              <a href="#pricing" style={{ color: '#595959' }}>Bảng giá</a>
              <Link to="/login">
                <Button type="link">Đăng nhập</Button>
              </Link>
              <Link to="/register">
                <Button type="primary" size="large">Dùng thử miễn phí</Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Header>

      <Content>
        {/* Hero Section */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title style={{ color: '#fff', fontSize: 48, marginBottom: 24 }}>
              Giải pháp quản lý sản xuất & kinh doanh
            </Title>
            <Paragraph style={{ color: '#fff', fontSize: 20, marginBottom: 40, opacity: 0.9 }}>
              Phần mềm ERP chuyên nghiệp cho doanh nghiệp sản xuất và thương mại
            </Paragraph>
            <Space size="large">
              <Link to="/register">
                <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ height: 50, fontSize: 18, padding: '0 40px' }}>
                  Dùng thử miễn phí 14 ngày
                </Button>
              </Link>
              <Link to="/login">
                <Button size="large" style={{ height: 50, fontSize: 18, padding: '0 40px', background: '#fff', color: '#1890ff' }}>
                  Đăng nhập
                </Button>
              </Link>
            </Space>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" style={{ padding: '80px 24px', background: '#f5f5f5' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 60 }}>
              Tính năng nổi bật
            </Title>
            <Row gutter={[32, 32]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <Card hoverable style={{ height: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                    <Title level={4}>{feature.title}</Title>
                    <Paragraph style={{ color: '#595959' }}>{feature.description}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* Benefits Section */}
        <div style={{ padding: '80px 24px', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 60 }}>
              Tại sao chọn SmartERP?
            </Title>
            <Row gutter={[32, 32]}>
              {benefits.map((benefit, index) => (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <Space>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <Text style={{ fontSize: 16 }}>{benefit}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" style={{ padding: '80px 24px', background: '#f5f5f5' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 60 }}>
              Bảng giá
            </Title>
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} sm={12} lg={8}>
                <Card hoverable style={{ textAlign: 'center' }}>
                  <Title level={3}>Gói cơ bản</Title>
                  <Title level={2} style={{ color: '#1890ff' }}>299.000đ/tháng</Title>
                  <Paragraph>Phù hợp cho xưởng nhỏ</Paragraph>
                  <Link to="/register">
                    <Button type="primary" size="large" block>Dùng thử ngay</Button>
                  </Link>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card hoverable style={{ textAlign: 'center', border: '2px solid #1890ff' }}>
                  <Title level={3}>Gói chuyên nghiệp</Title>
                  <Title level={2} style={{ color: '#1890ff' }}>599.000đ/tháng</Title>
                  <Paragraph>Phù hợp cho nhà máy vừa</Paragraph>
                  <Link to="/register">
                    <Button type="primary" size="large" block>Dùng thử ngay</Button>
                  </Link>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card hoverable style={{ textAlign: 'center' }}>
                  <Title level={3}>Gói doanh nghiệp</Title>
                  <Title level={2} style={{ color: '#1890ff' }}>Liên hệ</Title>
                  <Paragraph>Giải pháp tùy chỉnh</Paragraph>
                  <Button size="large" block>Liên hệ tư vấn</Button>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ padding: '80px 24px', background: '#1890ff', textAlign: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 24 }}>
              Sẵn sàng bắt đầu?
            </Title>
            <Paragraph style={{ color: '#fff', fontSize: 18, marginBottom: 40, opacity: 0.9 }}>
              Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng
            </Paragraph>
            <Link to="/register">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ height: 50, fontSize: 18, padding: '0 40px', background: '#fff', color: '#1890ff' }}>
                Đăng ký ngay
              </Button>
            </Link>
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: '#fff', padding: '24px 0' }}>
        <Text style={{ color: '#fff' }}>© 2026 SmartERP. Giải pháp quản lý toàn diện cho mọi ngành hàng.</Text>
      </Footer>
    </Layout>
  );
}
