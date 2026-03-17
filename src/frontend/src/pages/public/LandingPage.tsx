import { EnvironmentOutlined, MailOutlined, PhoneOutlined, StarFilled } from '@ant-design/icons';
import { Card, Col, Collapse, Layout, Row, Space, Typography, theme } from 'antd';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import CTA from '@/components/marketing/CTA';
import Features from '@/components/marketing/Features';
import Hero from '@/components/marketing/Hero';
import Pricing from '@/components/marketing/Pricing';
import ThemeToggle from '@/components/common/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import {
  COLORS,
  CONTACT_INFO,
  FAQ_ITEMS,
  GA_CONFIG,
  LAYOUT_CONSTANTS,
  TESTIMONIALS,
} from '@/constants/landing-page';
import { logger } from '@/lib/logger/logger.service';

const { Header, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

/**
 * Initialize Google Analytics
 */
const initializeAnalytics = (): void => {
  try {
    if (GA_CONFIG.MEASUREMENT_ID !== GA_CONFIG.PLACEHOLDER_ID) {
      ReactGA.initialize(GA_CONFIG.MEASUREMENT_ID);
    }
  } catch (error) {
    logger.warn('LandingPage', 'Failed to initialize Google Analytics', error as Error);
  }
};

initializeAnalytics();

/**
 * Landing Page Component
 * Displays hero section, features, pricing, testimonials, FAQ, and contact information
 */
export default function LandingPage(): React.ReactElement {
  const { t } = useTranslation();
  const { token } = useToken();

  /**
   * Track page view on component mount
   */
  useEffect(() => {
    try {
      if (GA_CONFIG.MEASUREMENT_ID !== GA_CONFIG.PLACEHOLDER_ID) {
        ReactGA.send({ hitType: 'pageview', page: '/', title: 'Landing Page' });
      }
    } catch (error) {
      logger.warn('LandingPage', 'Failed to track page view', error as Error);
    }
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* Header with Theme and Language Switchers */}
      <Header
        style={{
          position: 'absolute',
          top: token.paddingLG,
          right: token.paddingLG,
          zIndex: 1000,
          background: 'transparent',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: token.marginSM,
          padding: 0,
          height: 'auto',
        }}
      >
        <LanguageSwitcher />
        <ThemeToggle />
      </Header>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{t('landing:seo.title')}</title>
        <meta name="description" content={t('landing:seo.description')} />
        <meta name="keywords" content={t('landing:seo.keywords')} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t('landing:seo.ogTitle')} />
        <meta property="og:description" content={t('landing:seo.ogDescription')} />
        <meta property="og:url" content="https://smarterp.vn" />
        <meta property="og:site_name" content="SmartERP" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('landing:seo.ogTitle')} />
        <meta name="twitter:description" content={t('landing:seo.ogDescription')} />

        <link rel="canonical" href="https://smarterp.vn" />
      </Helmet>

      {/* Main Content */}
      <main role="main">
        {/* Hero Section */}
        <Hero />

        {/* Features Section */}
        <div id="features">
          <Features />
        </div>

        {/* Testimonials Section */}
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: token.colorBgContainer }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title
            level={2}
            style={{ textAlign: 'center', marginBottom: 60, color: token.colorText }}
          >
            {t('landing:sections.testimonials.title')}
          </Title>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER}>
            {TESTIMONIALS.map((testimonial, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card hoverable style={{ height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarFilled
                        key={i}
                        style={{
                          color: COLORS.STAR_COLOR,
                          fontSize: 20,
                          marginRight: 4,
                        }}
                      />
                    ))}
                  </div>
                  <Paragraph
                    style={{
                      fontSize: 16,
                      marginBottom: 24,
                      fontStyle: 'italic',
                    }}
                  >
                    "{testimonial.content}"
                  </Paragraph>
                  <div>
                    <Text
                      strong
                      style={{
                        display: 'block',
                        fontSize: 16,
                      }}
                    >
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: token.colorBgContainer }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title
            level={2}
            style={{ textAlign: 'center', marginBottom: 60, color: token.colorText }}
          >
            {t('landing:sections.faq.title')}
          </Title>
          <Collapse
            accordion
            items={FAQ_ITEMS.map((item) => ({
              key: item.key,
              label: item.label,
              children: <Paragraph>{item.children}</Paragraph>,
            }))}
          />
        </div>
      </div>

      {/* Contact Section */}
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: token.colorBgElevated }}>
        <div
          style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto', textAlign: 'center' }}
        >
          <Title level={2} style={{ marginBottom: 60, color: token.colorText }}>
            {t('landing:sections.contact.title')}
          </Title>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER} justify="center">
            <Col xs={24} sm={8}>
              <PhoneOutlined
                style={{
                  fontSize: 48,
                  color: token.colorPrimary,
                  marginBottom: 16,
                }}
              />
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:sections.contact.hotline')}
              </Title>
              <Text style={{ fontSize: 18, color: token.colorText }}>
                {CONTACT_INFO.phone}
              </Text>
            </Col>
            <Col xs={24} sm={8}>
              <MailOutlined
                style={{
                  fontSize: 48,
                  color: token.colorPrimary,
                  marginBottom: 16,
                }}
              />
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:sections.contact.email')}
              </Title>
              <Text style={{ fontSize: 18, color: token.colorText }}>
                {CONTACT_INFO.email}
              </Text>
            </Col>
            <Col xs={24} sm={8}>
              <EnvironmentOutlined
                style={{
                  fontSize: 48,
                  color: token.colorPrimary,
                  marginBottom: 16,
                }}
              />
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:sections.contact.address')}
              </Title>
              <Text style={{ fontSize: 18, color: token.colorText }}>
                {CONTACT_INFO.address}
              </Text>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <CTA />
      </main>

      {/* Footer */}
      <Footer
        style={{
          background: token.colorBgContainer,
          color: token.colorText,
          padding: LAYOUT_CONSTANTS.FOOTER_PADDING,
          borderTop: `1px solid ${token.colorBorder}`,
        }}
      >
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER}>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:footer.title')}
              </Title>
              <Paragraph style={{ color: token.colorTextSecondary }}>
                {t('landing:footer.description')}
              </Paragraph>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:footer.contact')}
              </Title>
              <Space style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text style={{ color: token.colorTextSecondary }}>
                  <PhoneOutlined /> {CONTACT_INFO.phone}
                </Text>
                <Text style={{ color: token.colorTextSecondary }}>
                  <MailOutlined /> {CONTACT_INFO.email}
                </Text>
                <Text style={{ color: token.colorTextSecondary }}>
                  <EnvironmentOutlined /> {CONTACT_INFO.address}
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={4} style={{ color: token.colorText }}>
                {t('landing:footer.legal')}
              </Title>
              <Space style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <a href="/privacy" style={{ color: token.colorTextSecondary }}>
                  {t('landing:footer.privacy')}
                </a>
                <a href="/terms" style={{ color: token.colorTextSecondary }}>
                  {t('landing:footer.terms')}
                </a>
              </Space>
            </Col>
          </Row>
          <div
            style={{
              textAlign: 'center',
              marginTop: 40,
              paddingTop: 24,
              borderTop: `1px solid ${token.colorBorder}`,
            }}
          >
            <Text style={{ color: token.colorTextSecondary }}>
              {t('landing:footer.copyright')}
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
