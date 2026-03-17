import { Link } from 'react-router-dom';
import { Button, Typography, theme, Grid } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { useToken } = theme;
const { useBreakpoint } = Grid;

export default function CTA() {
  const { token } = useToken();
  const screens = useBreakpoint();

  // Responsive styles
  const isMobile = !screens.sm;
  const buttonHeight = isMobile ? 44 : 50;
  const buttonFontSize = isMobile ? 15 : 18;
  const buttonPadding = isMobile ? '0 20px' : '0 40px';
  const paragraphFontSize = isMobile ? 16 : 18;

  return (
    <div style={{ padding: '80px 24px', background: token.colorPrimary, textAlign: 'center' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ color: token.colorWhite, marginBottom: 24 }}>
          Sẵn sàng bắt đầu?
        </Title>
        <Paragraph style={{ color: token.colorWhite, fontSize: paragraphFontSize, marginBottom: 40, opacity: 0.9 }}>
          Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng
        </Paragraph>
        <Link to="/register">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            style={{
              height: buttonHeight,
              fontSize: buttonFontSize,
              padding: buttonPadding,
              background: token.colorBgContainer,
              color: token.colorPrimary,
            }}
          >
            Đăng ký ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
