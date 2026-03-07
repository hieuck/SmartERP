import { Link } from 'react-router-dom';
import { Button, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Hero() {
  return (
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
            <Button 
              type="primary" 
              size="large" 
              icon={<ArrowRightOutlined />} 
              style={{ height: 50, fontSize: 18, padding: '0 40px' }}
            >
              Dùng thử miễn phí 14 ngày
            </Button>
          </Link>
          <Link to="/login">
            <Button 
              size="large" 
              style={{ height: 50, fontSize: 18, padding: '0 40px', background: '#fff', color: '#1890ff' }}
            >
              Đăng nhập
            </Button>
          </Link>
        </Space>
      </div>
    </div>
  );
}
