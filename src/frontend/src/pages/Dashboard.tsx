import { useEffect, useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { dashboardService } from '@/services/dashboard/dashboardService';
import dayjs from 'dayjs';
import { useResponsive } from '@/hooks/useResponsive';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard() {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const { isMobile, isTablet } = useResponsive();
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
      message.error(
        t('common:messages.error') + ': ' + (error.message || t('common:messages.error')),
      );
    } finally {
      setLoading(false);
    }
  };

  // Memoize currency formatter
  const formatCurrency = useMemo(
    () => (value: number) => {
      return new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: i18n.language === 'vi' ? 'VND' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    },
    [i18n.language]
  );

  // Responsive values using design tokens
  const gutterSize: [number, number] = useMemo(
    () => (isMobile ? [SPACING.sm, SPACING.sm] : isTablet ? [SPACING.md, SPACING.md] : [SPACING.base, SPACING.base]),
    [isMobile, isTablet]
  );

  const containerPadding = useMemo(
    () => (isMobile ? SPACING.md : isTablet ? SPACING.base : 0),
    [isMobile, isTablet]
  );

  const titleFontSize = useMemo(
    () => (isMobile ? FONT_SIZES.xl : isTablet ? FONT_SIZES.xxl : FONT_SIZES.xxxl),
    [isMobile, isTablet]
  );

  const statisticFontSize = useMemo(
    () => (isMobile ? FONT_SIZES.lg : FONT_SIZES.xxl),
    [isMobile]
  );

  const chartHeight = useMemo(
    () => (isMobile ? 250 : isTablet ? 280 : 300),
    [isMobile, isTablet]
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: containerPadding }}>
      <h1 style={{ fontSize: titleFontSize, marginBottom: SPACING.base }}>
        {t('dashboard:title')}
      </h1>

      {/* Revenue KPI Cards */}
      <Row gutter={gutterSize} style={{ marginBottom: isMobile ? SPACING.md : SPACING.lg }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.revenueToday')}
              value={overview?.revenue?.today || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600', fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {overview?.revenue?.growth && overview.revenue.growth > 0 ? (
                <span style={{ color: '#3f8600' }}>
                  <RiseOutlined /> +{overview.revenue.growth.toFixed(1)}%
                </span>
              ) : (
                <span style={{ color: '#cf1322' }}>
                  <FallOutlined /> {overview?.revenue?.growth?.toFixed(1)}%
                </span>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.revenueWeek')}
              value={overview?.revenue?.thisWeek || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:kpi.revenueMonth')}: {formatCurrency(overview?.revenue?.thisMonth || 0)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.totalOrders')}
              value={overview?.orders?.total || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:status.completed')}: {overview?.orders?.completed || 0} |{' '}
              {t('dashboard:status.pending')}: {overview?.orders?.pending || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.totalCustomers')}
              value={overview?.customers?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:status.active')}: {overview?.customers?.active || 0} |{' '}
              {t('dashboard:status.new')}: {overview?.customers?.new || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Inventory & Payment KPI Cards */}
      <Row gutter={gutterSize} style={{ marginBottom: isMobile ? SPACING.md : SPACING.lg }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.totalProducts')}
              value={overview?.inventory?.totalProducts || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:kpi.inventoryValue')}: {formatCurrency(overview?.inventory?.totalValue || 0)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.lowStock')}
              value={overview?.inventory?.lowStock || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322', fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:kpi.outOfStock')}: {overview?.inventory?.outOfStock || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.pendingPayments')}
              value={overview?.payments?.pending || 0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#faad14', fontSize: statisticFontSize }}
            />
            <div style={{ marginTop: SPACING.sm, fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm, color: '#8c8c8c' }}>
              {t('dashboard:status.completed')}: {overview?.payments?.completed || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size={isMobile ? 'small' : 'default'}>
            <Statistic
              title={t('dashboard:kpi.totalPayments')}
              value={overview?.payments?.totalAmount || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ fontSize: statisticFontSize }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sales Chart */}
      <Row gutter={gutterSize} style={{ marginBottom: isMobile ? SPACING.md : SPACING.lg }}>
        <Col xs={24} lg={16}>
          <Card title={t('dashboard:charts.salesOverview')} size={isMobile ? 'small' : 'default'}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => dayjs(value).format('DD/MM')}
                  style={{ fontSize: isMobile ? FONT_SIZES.xs - 1 : FONT_SIZES.sm }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                  style={{ fontSize: isMobile ? FONT_SIZES.xs - 1 : FONT_SIZES.sm }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')}
                />
                <Legend wrapperStyle={{ fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name={t('dashboard:kpi.totalRevenue')}
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: isMobile ? 2 : 3 }}
                  activeDot={{ r: isMobile ? 4 : 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name={t('dashboard:kpi.totalOrders')}
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ r: isMobile ? 2 : 3 }}
                  activeDot={{ r: isMobile ? 4 : 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('dashboard:charts.revenueByCategory')} size={isMobile ? 'small' : 'default'}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : isTablet ? 70 : 80}
                  label={
                    isMobile
                      ? false
                      : (entry) => `${entry.category}: ${entry.percentage}%`
                  }
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                {isMobile && <Legend wrapperStyle={{ fontSize: FONT_SIZES.xs - 1 }} />}
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Top Products & Customers */}
      <Row gutter={gutterSize}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard:charts.topProducts')} size={isMobile ? 'small' : 'default'}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="category"
                  dataKey="name"
                  angle={isMobile ? -60 : -45}
                  textAnchor="end"
                  height={isMobile ? 80 : 100}
                  interval={0}
                  style={{ fontSize: isMobile ? FONT_SIZES.xs - 2 : FONT_SIZES.xs }}
                />
                <YAxis type="number" style={{ fontSize: isMobile ? FONT_SIZES.xs - 1 : FONT_SIZES.sm }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === t('dashboard:kpi.totalRevenue')) {
                      return formatCurrency(value);
                    }
                    return value;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: isMobile ? FONT_SIZES.xs : FONT_SIZES.sm }} />
                <Bar dataKey="quantity" name={t('common:labels.quantity')} fill="#52c41a" />
                <Bar dataKey="revenue" name={t('dashboard:kpi.totalRevenue')} fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('dashboard:charts.topCustomers')} size={isMobile ? 'small' : 'default'}>
            <Table
              size="small"
              scroll={{ x: 'max-content', y: chartHeight }}
              dataSource={topCustomers}
              rowKey="id"
              columns={[
                {
                  title: t('dashboard:tables.customer'),
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true,
                  width: isMobile ? 120 : undefined,
                },
                {
                  title: t('dashboard:kpi.totalOrders'),
                  dataIndex: 'orderCount',
                  key: 'orderCount',
                  align: 'right',
                  width: isMobile ? 80 : 100,
                },
                {
                  title: t('dashboard:tables.amount'),
                  dataIndex: 'totalSpent',
                  key: 'totalSpent',
                  align: 'right',
                  width: isMobile ? 100 : 150,
                  render: (val: number) => formatCurrency(val),
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
