import { Link } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function CTA() {
  return (
    <div style={{ padding: '80px 24px', background: '#1890ff', textAlign: 'center' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ color: '#fff', marginBottom: 24 }}>
          Sẵn sàng bắt đầu?
        </Title>
        <Paragraph style={{ color: '#fff', fontSize: 18, marginBottom: 40, opacity: 0.9 }}>
          Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng
        </Paragraph>
        <Link to="/register">
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            style={{
              height: 50,
              fontSize: 18,
              padding: '0 40px',
              background: '#fff',
              color: '#1890ff',
            }}
          >
            Đăng ký ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
