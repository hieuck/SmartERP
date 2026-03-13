import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboard/dashboardService';
import dayjs from 'dayjs';
import { useResponsive } from '../hooks/useResponsive';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard() {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewData, chartData, productsData, customersData, categoryData] =
        await Promise.all([
          dashboardService.getOverview(),
          dashboardService.getSalesChart(30),
          dashboardService.getTopProducts(10),
          dashboardService.getTopCustomers(10),
          dashboardService.getRevenueByCategory(),
        ]);

      setOverview(overviewData);
      setSalesChart(chartData);
      setTopProducts(productsData);
      setTopCustomers(customersData);
      setRevenueByCategory(categoryData);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      message.error('Không thể tải dữ liệu dashboard: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Revenue KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh Thu Hôm Nay"
              value={overview?.revenue?.today || 0}
              prefix={<DollarOutlined />}
              suffix="₫"
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              {overview?.revenue?.growth && overview.revenue.growth > 0 ? (
                <span style={{ color: '#3f8600' }}>
                  <RiseOutlined /> +{overview.revenue.growth.toFixed(1)}% tăng trưởng
                </span>
              ) : (
                <span style={{ color: '#cf1322' }}>
                  <FallOutlined /> {overview?.revenue?.growth?.toFixed(1)}% giảm
                </span>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh Thu Tuần Này"
              value={overview?.revenue?.thisWeek || 0}
              prefix={<DollarOutlined />}
              suffix="₫"
              precision={0}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Tháng này: {new Intl.NumberFormat('vi-VN').format(overview?.revenue?.thisMonth || 0)}₫
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Đơn Hàng"
              value={overview?.orders?.total || 0}
              prefix={<ShoppingCartOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Hoàn thành: {overview?.orders?.completed || 0} | Chờ: {overview?.orders?.pending || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách Hàng"
              value={overview?.customers?.total || 0}
              prefix={<UserOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Hoạt động: {overview?.customers?.active || 0} | Mới: {overview?.customers?.new || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Inventory & Payment KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Sản Phẩm"
              value={overview?.inventory?.totalProducts || 0}
              prefix={<InboxOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Giá trị: {new Intl.NumberFormat('vi-VN').format(overview?.inventory?.totalValue || 0)}
              ₫
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sắp Hết Hàng"
              value={overview?.inventory?.lowStock || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Hết hàng: {overview?.inventory?.outOfStock || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Thanh Toán Chờ"
              value={overview?.payments?.pending || 0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Hoàn thành: {overview?.payments?.completed || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Thanh Toán"
              value={overview?.payments?.totalAmount || 0}
              prefix={<DollarOutlined />}
              suffix="₫"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Sales Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Biểu đồ doanh thu 30 ngày gần nhất">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('DD/MM')} />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('vi-VN', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(value)
                  }
                  labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Đơn hàng"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Doanh thu theo danh mục">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.category}: ${entry.percentage}%`}
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Products & Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top 10 sản phẩm bán chạy">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="category"
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis type="number" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'Doanh thu') {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(value);
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="quantity" name="Số lượng" fill="#52c41a" />
                <Bar dataKey="revenue" name="Doanh thu" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top 10 khách hàng">
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content', y: 300 }}
              dataSource={topCustomers}
              rowKey="id"
              columns={[
                {
                  title: 'Khách hàng',
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true,
                },
                {
                  title: 'Đơn hàng',
                  dataIndex: 'orderCount',
                  key: 'orderCount',
                  align: 'right',
                  width: 100,
                },
                {
                  title: 'Tổng chi tiêu',
                  dataIndex: 'totalSpent',
                  key: 'totalSpent',
                  align: 'right',
                  width: 150,
                  render: (val: number) =>
                    new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(val),
                },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
