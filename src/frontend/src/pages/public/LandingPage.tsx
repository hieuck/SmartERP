import { EnvironmentOutlined, MailOutlined, PhoneOutlined, StarFilled } from '@ant-design/icons';
import { Card, Col, Collapse, Layout, Row, Space, Typography } from 'antd';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import CTA from '@/components/marketing/CTA';
import Features from '@/components/marketing/Features';
import Hero from '@/components/marketing/Hero';
import Pricing from '@/components/marketing/Pricing';
import {
  COLORS,
  CONTACT_INFO,
  FAQ_ITEMS,
  GA_CONFIG,
  LAYOUT_CONSTANTS,
  TESTIMONIALS,
  TYPOGRAPHY,
} from '@/constants/landing-page';
import { logger } from '@/lib/logger/logger.service';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

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
    <Layout style={{ minHeight: '100vh', background: COLORS.WHITE }}>
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.WHITE }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title
            level={TYPOGRAPHY.HEADING_LEVEL_2}
            style={{ textAlign: 'center', marginBottom: 60 }}
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
                      fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
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
                        fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.WHITE }}>
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Title
            level={TYPOGRAPHY.HEADING_LEVEL_2}
            style={{ textAlign: 'center', marginBottom: 60 }}
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
      <div style={{ padding: LAYOUT_CONSTANTS.SECTION_PADDING, background: COLORS.LIGHT_BG }}>
        <div
          style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto', textAlign: 'center' }}
        >
          <Title level={TYPOGRAPHY.HEADING_LEVEL_2} style={{ marginBottom: 60 }}>
            {t('landing:sections.contact.title')}
          </Title>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER} justify="center">
            <Col xs={24} sm={8}>
              <PhoneOutlined
                style={{
                  fontSize: 48,
                  color: COLORS.PRIMARY,
                  marginBottom: 16,
                }}
              />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>{t('landing:sections.contact.hotline')}</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.phone}</Text>
            </Col>
            <Col xs={24} sm={8}>
              <MailOutlined
                style={{
                  fontSize: 48,
                  color: COLORS.PRIMARY,
                  marginBottom: 16,
                }}
              />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>{t('landing:sections.contact.email')}</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.email}</Text>
            </Col>
            <Col xs={24} sm={8}>
              <EnvironmentOutlined
                style={{
                  fontSize: 48,
                  color: COLORS.PRIMARY,
                  marginBottom: 16,
                }}
              />
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4}>{t('landing:sections.contact.address')}</Title>
              <Text style={{ fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM }}>{CONTACT_INFO.address}</Text>
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
          background: COLORS.DARK_BG,
          color: COLORS.WHITE,
          padding: LAYOUT_CONSTANTS.FOOTER_PADDING,
        }}
      >
        <div style={{ maxWidth: LAYOUT_CONSTANTS.MAX_WIDTH, margin: '0 auto' }}>
          <Row gutter={LAYOUT_CONSTANTS.GRID_GUTTER}>
            <Col xs={24} sm={12} lg={8}>
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>
                {t('landing:footer.title')}
              </Title>
              <Paragraph style={{ color: COLORS.TEXT_SECONDARY }}>
                {t('landing:footer.description')}
              </Paragraph>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>
                {t('landing:footer.contact')}
              </Title>
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
              <Title level={TYPOGRAPHY.HEADING_LEVEL_4} style={{ color: COLORS.WHITE }}>
                {t('landing:footer.legal')}
              </Title>
              <Space direction="vertical">
                <a href="/privacy" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {t('landing:footer.privacy')}
                </a>
                <a href="/terms" style={{ color: COLORS.TEXT_SECONDARY }}>
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
              borderTop: `1px solid ${COLORS.BORDER_LIGHT}`,
            }}
          >
            <Text style={{ color: COLORS.TEXT_SECONDARY }}>
              {t('landing:footer.copyright')}
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
