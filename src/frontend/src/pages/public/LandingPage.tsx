import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactGA from 'react-ga4';
import { Layout, Button, Row, Col, Card, Typography, Space, Collapse } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  StarFilled,
} from '@ant-design/icons';
import Hero from '../../components/marketing/Hero';
import Features from '../../components/marketing/Features';
import Pricing from '../../components/marketing/Pricing';
import CTA from '../../components/marketing/CTA';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

// Initialize Google Analytics
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // TODO: Replace with your actual GA4 Measurement ID
if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

export default function LandingPage() {
  // Track page view
  useEffect(() => {
    if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      ReactGA.send({ hitType: 'pageview', page: '/', title: 'Landing Page' });
    }
  }, []);

  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      company: 'Công ty TNHH ABC',
      role: 'Giám đốc điều hành',
      content: 'SmartERP giúp chúng tôi quản lý kho hàng hiệu quả hơn 80%. Không còn tình trạng thiếu hụt hoặc tồn kho dư thừa.',
    },
    {
      name: 'Trần Thị B',
      company: 'Nhà máy XYZ',
      role: 'Trưởng phòng sản xuất',
      content: 'Phần mềm dễ sử dụng, đội ngũ hỗ trợ nhiệt tình. Chúng tôi đã tăng năng suất sản xuất 30% sau 3 tháng sử dụng.',
    },
    {
      name: 'Lê Văn C',
      company: 'Xưởng DEF',
      role: 'Chủ doanh nghiệp',
      content: 'Giá cả hợp lý, tính năng đầy đủ. Đặc biệt là báo cáo thống kê rất trực quan, giúp tôi ra quyết định nhanh chóng.',
    },
  ];

  const faqItems = [
    {
      key: '1',
      label: 'SmartERP có phù hợp với doanh nghiệp nhỏ không?',
      children: 'Có, SmartERP được thiết kế linh hoạt cho mọi quy mô từ xưởng nhỏ đến nhà máy lớn. Bạn có thể bắt đầu với gói cơ bản và nâng cấp khi doanh nghiệp phát triển.',
    },
    {
      key: '2',
      label: 'Tôi có cần kiến thức kỹ thuật để sử dụng không?',
      children: 'Không cần. SmartERP có giao diện thân thiện, dễ sử dụng. Chúng tôi cũng cung cấp đào tạo miễn phí và hỗ trợ 24/7.',
    },
    {
      key: '3',
      label: 'Dữ liệu của tôi có an toàn không?',
      children: 'Tuyệt đối an toàn. Chúng tôi sử dụng mã hóa SSL, backup tự động hàng ngày, và tuân thủ các tiêu chuẩn bảo mật quốc tế.',
    },
    {
      key: '4',
      label: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
      children: 'Có, bạn có thể hủy đăng ký bất cứ lúc nào mà không mất phí. Chúng tôi không ràng buộc hợp đồng dài hạn.',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>SmartERP - Giải pháp quản lý sản xuất & kinh doanh</title>
        <meta name="description" content="Phần mềm ERP chuyên nghiệp cho doanh nghiệp sản xuất và thương mại. Quản lý kho hàng, bán hàng, sản xuất, nhân sự. Dùng thử miễn phí 14 ngày." />
        <meta name="keywords" content="ERP, quản lý kho, quản lý sản xuất, phần mềm quản lý, SmartERP" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SmartERP - Giải pháp quản lý sản xuất & kinh doanh" />
        <meta property="og:description" content="Phần mềm ERP chuyên nghiệp cho doanh nghiệp sản xuất và thương mại. Dùng thử miễn phí 14 ngày." />
        <meta property="og:url" content="https://smarterp.vn" />
        <meta property="og:site_name" content="SmartERP" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SmartERP - Giải pháp quản lý sản xuất & kinh doanh" />
        <meta name="twitter:description" content="Phần mềm ERP chuyên nghiệp cho doanh nghiệp sản xuất và thương mại." />
        
        <link rel="canonical" href="https://smarterp.vn" />
      </Helmet>

      {/* Header */}
      <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000, padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: '#1890ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text strong style={{ color: '#fff', fontSize: 20 }}>S</Text>
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
      <Hero />

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* Testimonials Section */}
      <div style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 60 }}>
            Khách hàng nói gì về chúng tôi
          </Title>
          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card hoverable style={{ height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarFilled key={i} style={{ color: '#fadb14', fontSize: 20, marginRight: 4 }} />
                    ))}
                  </div>
                  <Paragraph style={{ fontSize: 16, marginBottom: 24, fontStyle: 'italic' }}>
                    "{testimonial.content}"
                  </Paragraph>
                  <div>
                    <Text strong style={{ display: 'block', fontSize: 16 }}>{testimonial.name}</Text>
                    <Text type="secondary">{testimonial.role}</Text>
                    <br />
                    <Text type="secondary">{testimonial.company}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* FAQ Section */}
      <div style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 60 }}>
            Câu hỏi thường gặp
          </Title>
          <Collapse accordion>
            {faqItems.map((item) => (
              <Panel header={item.label} key={item.key}>
                <Paragraph>{item.children}</Paragraph>
              </Panel>
            ))}
          </Collapse>
        </div>
      </div>

      {/* Contact Section */}
      <div style={{ padding: '80px 24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: 60 }}>
            Liên hệ với chúng tôi
          </Title>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={8}>
              <PhoneOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Hotline</Title>
              <Text style={{ fontSize: 18 }}>1900-xxxx</Text>
            </Col>
            <Col xs={24} sm={8}>
              <MailOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Email</Title>
              <Text style={{ fontSize: 18 }}>contact@smarterp.vn</Text>
            </Col>
            <Col xs={24} sm={8}>
              <EnvironmentOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Địa chỉ</Title>
              <Text style={{ fontSize: 18 }}>Hà Nội, Việt Nam</Text>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <CTA />
      </Content>

      <Footer style={{ background: '#001529', color: '#fff', padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: '#fff' }}>SmartERP</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                Giải pháp quản lý toàn diện cho doanh nghiệp sản xuất và thương mại
              </Paragraph>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: '#fff' }}>Liên hệ</Title>
              <Space direction="vertical">
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <PhoneOutlined /> 1900-xxxx
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <MailOutlined /> contact@smarterp.vn
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <EnvironmentOutlined /> Hà Nội, Việt Nam
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: '#fff' }}>Pháp lý</Title>
              <Space direction="vertical">
                <a href="/privacy" style={{ color: 'rgba(255,255,255,0.65)' }}>Chính sách bảo mật</a>
                <a href="/terms" style={{ color: 'rgba(255,255,255,0.65)' }}>Điều khoản sử dụng</a>
              </Space>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
              © 2026 SmartERP. All rights reserved.
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
