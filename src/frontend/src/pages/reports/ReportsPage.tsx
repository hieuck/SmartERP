import React, { useState } from 'react';
import {
  Card,
  Tabs,
  DatePicker,
  Button,
  Space,
  Table,
  message,
  Row,
  Col,
  Statistic,
  Typography,
} from 'antd';
import { FilePdfOutlined, FileExcelOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSalesReport,
  useDailySalesReport,
  useProductPerformanceReport,
  useInventoryReport,
  useLowStockReport,
  useInventoryMovementsReport,
  useCustomerReport,
  useTopCustomersReport,
  useFinancialReport,
  useProfitLossReport,
  useCashFlowReport,
  useExportReportPDF,
  useExportReportExcel,
} from '../../hooks/useReports';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedReport, setSelectedReport] = useState<string>('sales');

  // Hooks for different reports
  const salesReport = useSalesReport({ startDate: dateRange[0], endDate: dateRange[1] });
  const dailySalesReport = useDailySalesReport({ startDate: dateRange[0], endDate: dateRange[1] });
  const productPerformanceReport = useProductPerformanceReport({
    startDate: dateRange[0],
    endDate: dateRange[1],
  });
  const inventoryReport = useInventoryReport();
  const lowStockReport = useLowStockReport();
  const inventoryMovementsReport = useInventoryMovementsReport({
    startDate: dateRange[0],
    endDate: dateRange[1],
  });
  const customerReport = useCustomerReport({ startDate: dateRange[0], endDate: dateRange[1] });
  const topCustomersReport = useTopCustomersReport({
    startDate: dateRange[0],
    endDate: dateRange[1],
  });
  const financialReport = useFinancialReport({ startDate: dateRange[0], endDate: dateRange[1] });
  const profitLossReport = useProfitLossReport({ startDate: dateRange[0], endDate: dateRange[1] });
  const cashFlowReport = useCashFlowReport({ startDate: dateRange[0], endDate: dateRange[1] });

  const exportPDF = useExportReportPDF();
  const exportExcel = useExportReportExcel();

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    }
  };

  const fetchReport = async (reportType: string) => {
    setSelectedReport(reportType);
    try {
      let data;

      switch (reportType) {
        case 'sales':
          data = salesReport.data;
          break;
        case 'daily-sales':
          data = dailySalesReport.data;
          break;
        case 'product-performance':
          data = productPerformanceReport.data;
          break;
        case 'inventory':
          data = inventoryReport.data;
          break;
        case 'inventory-low-stock':
          data = lowStockReport.data;
          break;
        case 'inventory-movements':
          data = inventoryMovementsReport.data;
          break;
        case 'customers':
          data = customerReport.data;
          break;
        case 'top-customers':
          data = topCustomersReport.data;
          break;
        case 'financial':
          data = financialReport.data;
          break;
        case 'profit-loss':
          data = profitLossReport.data;
          break;
        case 'cash-flow':
          data = cashFlowReport.data;
          break;
        default:
          data = null;
      }

      setReportData(data);
      if (data) {
        message.success('Tải báo cáo thành công');
      }
    } catch (error) {
      message.error('Không thể tải báo cáo');
    }
  };

  const handleExportPDF = async (reportType: string) => {
    try {
      await exportPDF(reportType, {
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      message.success('Đã xuất báo cáo PDF');
    } catch (error) {
      message.error('Không thể xuất báo cáo PDF');
    }
  };

  const handleExportExcel = async (reportType: string) => {
    try {
      await exportExcel(reportType, {
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      message.success('Đã xuất báo cáo Excel');
    } catch (error) {
      message.error('Không thể xuất báo cáo Excel');
    }
  };

  const isLoading = selectedReport === 'sales' ? salesReport.isLoading : false;

  const renderSalesReports = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Báo cáo doanh thu">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button
              type="primary"
              onClick={() => fetchReport('sales')}
              loading={salesReport.isLoading}
            >
              Xem báo cáo
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('sales')}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('sales')}>
              Excel
            </Button>
          </Space>
          {salesReport.error && (
            <div style={{ color: 'red' }}>Lỗi: {salesReport.error.message}</div>
          )}
          {reportData && (
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tổng doanh thu" value={reportData.totalRevenue} suffix="₫" />
              </Col>
              <Col span={8}>
                <Statistic title="Số đơn hàng" value={reportData.totalOrders} />
              </Col>
              <Col span={8}>
                <Statistic title="Giá trị TB" value={reportData.averageOrderValue} suffix="₫" />
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <Card title="Doanh thu theo ngày">
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('daily-sales')}
            loading={dailySalesReport.isLoading}
          >
            Xem báo cáo
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('daily-sales')}>
            PDF
          </Button>
        </Space>
        {dailySalesReport.error && (
          <div style={{ color: 'red' }}>Lỗi: {dailySalesReport.error.message}</div>
        )}
      </Card>

      <Card title="Hiệu suất sản phẩm">
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('product-performance')}
            loading={productPerformanceReport.isLoading}
          >
            Xem báo cáo
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExportExcel('product-performance')}
          >
            Excel
          </Button>
        </Space>
        {productPerformanceReport.error && (
          <div style={{ color: 'red' }}>Lỗi: {productPerformanceReport.error.message}</div>
        )}
      </Card>
    </Space>
  );

  const renderInventoryReports = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Báo cáo tồn kho">
        <Space>
          <Button type="primary" onClick={() => fetchReport('inventory')} loading={loading}>
            Xem báo cáo
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('inventory')}>
            PDF
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('inventory')}>
            Excel
          </Button>
        </Space>
      </Card>

      <Card title="Cảnh báo tồn thấp">
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('inventory-low-stock')}
            loading={loading}
          >
            Xem báo cáo
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExportExcel('inventory-low-stock')}
          >
            Excel
          </Button>
        </Space>
      </Card>

      <Card title="Lịch sử xuất nhập">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button
              type="primary"
              onClick={() => fetchReport('inventory-movements')}
              loading={loading}
            >
              Xem báo cáo
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleExportExcel('inventory-movements')}
            >
              Excel
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );

  const renderCustomerReports = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Báo cáo khách hàng">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button type="primary" onClick={() => fetchReport('customers')} loading={loading}>
              Xem báo cáo
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('customers')}>
              Excel
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Top khách hàng">
        <Space>
          <Button type="primary" onClick={() => fetchReport('top-customers')} loading={loading}>
            Xem báo cáo
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('top-customers')}>
            Excel
          </Button>
        </Space>
      </Card>
    </Space>
  );

  const renderFinancialReports = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="Báo cáo tài chính">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button type="primary" onClick={() => fetchReport('financial')} loading={loading}>
              Xem báo cáo
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('financial')}>
              PDF
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Báo cáo lãi lỗ">
        <Space>
          <Button type="primary" onClick={() => fetchReport('profit-loss')} loading={loading}>
            Xem báo cáo
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('profit-loss')}>
            PDF
          </Button>
        </Space>
      </Card>

      <Card title="Báo cáo dòng tiền">
        <Space>
          <Button type="primary" onClick={() => fetchReport('cash-flow')} loading={loading}>
            Xem báo cáo
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('cash-flow')}>
            Excel
          </Button>
        </Space>
      </Card>
    </Space>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <BarChartOutlined /> Báo cáo
        </Title>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Bán hàng" key="sales">
            {renderSalesReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tồn kho" key="inventory">
            {renderInventoryReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Khách hàng" key="customers">
            {renderCustomerReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tài chính" key="financial">
            {renderFinancialReports()}
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportsPage;
