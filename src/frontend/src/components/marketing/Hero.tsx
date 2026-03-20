import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Grid, Space, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

export default function Hero() {
  const { t } = useTranslation('landing');
  const { token } = useToken();
  const screens = useBreakpoint();

  const isMobile = !screens.sm;
  const buttonHeight = isMobile ? 44 : 50;
  const buttonFontSize = isMobile ? 15 : 18;
  const buttonPadding = isMobile ? '0 20px' : '0 40px';
  const titleFontSize = isMobile ? 32 : 48;
  const paragraphFontSize = isMobile ? 16 : 20;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title style={{ color: token.colorWhite, fontSize: titleFontSize, marginBottom: 24 }}>
          {t('hero.title')}
        </Title>
        <Paragraph
          style={{
            color: token.colorWhite,
            fontSize: paragraphFontSize,
            marginBottom: 40,
            opacity: 0.9,
          }}
        >
          {t('hero.description')}
        </Paragraph>
        <Space
          size={isMobile ? 'middle' : 'large'}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          <Link to="/register" style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                height: buttonHeight,
                fontSize: buttonFontSize,
                padding: buttonPadding,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {t('hero.trialCta')}
            </Button>
          </Link>
          <Link to="/login" style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button
              size="large"
              style={{
                height: buttonHeight,
                fontSize: buttonFontSize,
                padding: buttonPadding,
                background: token.colorBgContainer,
                color: token.colorPrimary,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {t('hero.loginCta')}
            </Button>
          </Link>
        </Space>
      </div>
    </div>
  );
}
