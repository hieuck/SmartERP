/**
 * Landing Page Component
 *
 * Main landing page for SmartERP displaying:
 * - Hero section with call-to-action
 * - Product features overview
 * - Pricing information
 * - FAQ section
 * - Contact information
 * - Footer with legal links
 *
 * Includes SEO optimization with meta tags and Google Analytics tracking
 */

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
import {
  TESTIMONIALS,
  FAQ_ITEMS,
  CONTACT_INFO,
  LAYOUT_CONSTANTS,
  COLORS,
  TYPOGRAPHY,
  GA_CONFIG,
} from '../../constants/landing-page';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

/**
 * Initialize Google Analytics
 */
const initializeAnalytics = (): void => {
  try {
    if (GA_CONFIG.MEASUREMENT_ID !== GA_CONFIG.PLACEHOLDER_ID) {
      ReactGA.initialize(GA_CONFIG.MEASUREMENT_ID);
    }
  } catch (error) {
    console.warn('Failed to initialize Google Analytics:', error);
  }
};

initializeAnalytics();

/**
 * Landing Page Component
 * @returns React component
 */
export default function LandingPage(): React.ReactElement {
  /**
   * Track page view on component mount
   */
  useEffect(() => {
    try {
      if (GA_CONFIG.MEASUREMENT_ID !== GA_CONFIG.PLACEHOLDER_ID) {
        ReactGA.send({ hitType: 'pageview', page: '/', title: 'Landing Page' });
      }
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: COLORS.WHITE }}>
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
      <Header style={{ background: COLORS.WHITE, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000, padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: COLORS.PRIMARY, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text strong style={{ color: COLORS.WHITE, fontSize: TYPOGRAPHY.FONT_SIZE_LARGE }}>S</Text>
              </div>
              <Text strong style={{ fontSize: TYPOGRAPHY.FONT_SIZE_LARGE, color: '#000' }}>SmartERP</Text>
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.WHITE }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title level={TYPOGRAPHY.HEADING_LEVEL_2} style={{ textAlign: 'center', marginBottom: 60 }}>
            Khách hàng nói gì về chúng tôi
          </Title>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER}>
            {TESTIMONIALS.map((testimonial, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card hoverable style={{ height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarFilled key={i} style={{ color: COLORS.STAR_COLOR, fontSize: 20, marginRight: 4 }} />
                    ))}
                  </div>
                  <Paragraph style={{ fontSize: TYPOGRAPHY.FONT_SIZE_SMALL, marginBottom: 24, fontStyle: 'italic' }}>
                    "{testimonial.content}"
                  </Paragraph>
                  <div>
                    <Text strong style={{ display: 'block', fontSize: TYPOGRAPHY.FONT_SIZE_SMALL }}>
                      {testimonial.name}
                    </Text>
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.WHITE }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title level={TYPOGRAPHY.HEADING_LEVEL_2} style={{ textAlign: 'center', marginBottom: 60 }}>
            Câu hỏi thường gặp
          </Title>
          <Collapse accordion>
            {FAQ_ITEMS.map((item) => (
              <Panel header={item.label} key={item.key}>
                <Paragraph>{item.children}</Paragraph>
              </Panel>
            ))}
          </Collapse>
        </div>
      </div>

      {/* Contact Section */}
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.LIGHT_BG }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto', textAlign: 'center' }}>
          <Title level={TYPOGRAPHY.HEADING_LEVEL_2} style={{ marginBottom: 60 }}>
            Liên hệ với chúng tôi
          </Title>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER} justify="center">
            <Col xs={24} sm={8}>
              <PhoneOutlined style={{ fontSize: 48, color: COLORS.PRIMARY, marginBottom: 16 }} />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>Hotline</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.phone}</Text>
            </Col>
            <Col xs={24} sm={8}>
              <MailOutlined style={{ fontSize: 48, color: COLORS.PRIMARY, marginBottom: 16 }} />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>Email</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.email}</Text>
            </Col>
            <Col xs={24} sm={8}>
              <EnvironmentOutlined style={{ fontSize: 48, color: COLORS.PRIMARY, marginBottom: 16 }} />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>Địa chỉ</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.address}</Text>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <CTA />
      </Content>

      <Footer style={{ background: COLORS.DARK_BG, color: COLORS.WHITE, padding: LAYOUT_CONSTANTS.FOOTER_PADDING }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER}>
            <Col xs={24} sm={12} lg={8}>
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>SmartERP</Title>
              <Paragraph style={{ color: COLORS.TEXT_SECONDARY }}>
                Giải pháp quản lý toàn diện cho doanh nghiệp sản xuất và thương mại
              </Paragraph>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>Liên hệ</Title>
              <Space direction="vertical">
                <Text style={{ color: COLORS.TEXT_SECONDARY }}>
                  <PhoneOutlined /> {CONTACT_INFO.phone}
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY }}>
                  <MailOutlined /> {CONTACT_INFO.email}
                </Text>
                <Text style={{ color: COLORS.TEXT_SECONDARY }}>
                  <EnvironmentOutlined /> {CONTACT_INFO.address}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>Pháp lý</Title>
              <Space direction="vertical">
                <a href="/privacy" style={{ color: COLORS.TEXT_SECONDARY }}>Chính sách bảo mật</a>
                <a href="/terms" style={{ color: COLORS.TEXT_SECONDARY }}>Điều khoản sử dụng</a>
              </Space>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${COLORS.BORDER_LIGHT}` }}>
            <Text style={{ color: COLORS.TEXT_SECONDARY }}>
              © 2026 SmartERP. All rights reserved.
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
