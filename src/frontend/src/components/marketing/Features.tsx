import { Row, Col, Card, Typography } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

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

export default function Features() {
  return (
    <div style={{ padding: '80px 24px', background: '#f5f5f5' }}>
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
  );
}
