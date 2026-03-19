import {
  useCashFlowReport,
  useCustomerReport,
  useDailySalesReport,
  useExportReportExcel,
  useExportReportPDF,
  useFinancialReport,
  useInventoryMovementsReport,
  useInventoryReport,
  useLowStockReport,
  useProductPerformanceReport,
  useProfitLossReport,
  useSalesReport,
  useTopCustomersReport,
} from '@/hooks/useReports';
import type { SalesReport } from '@/services/report/reportingService';
import { BarChartOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  message,
  Row,
  Space,
  Statistic,
  Tabs,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ReportsPage: React.FC = () => {
  const { t } = useTranslation(['reports', 'common']);

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const [reportData, setReportData] = useState<SalesReport | null>(null);
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

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates[1]) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    }
  };

  const fetchReport = async (reportType: string) => {
    setSelectedReport(reportType);
    try {
      let data: unknown;

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

      setReportData(reportType === 'sales' ? (data as SalesReport | null) : null);
      if (data) {
        message.success(t('reports:messages.loadSuccess'));
      }
    } catch {
      message.error(t('reports:messages.loadError'));
    }
  };

  const handleExportPDF = async (reportType: string) => {
    try {
      await exportPDF(reportType, {
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      message.success(t('reports:messages.exportPDFSuccess'));
    } catch {
      message.error(t('reports:messages.exportPDFError'));
    }
  };

  const handleExportExcel = async (reportType: string) => {
    try {
      await exportExcel(reportType, {
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
      message.success(t('reports:messages.exportExcelSuccess'));
    } catch {
      message.error(t('reports:messages.exportExcelError'));
    }
  };

  const isLoading = selectedReport === 'sales' ? salesReport.isLoading : false;

  const renderSalesReports = () => (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Card title={t('reports:sales.revenue')}>
        <Space orientation="vertical" style={{ width: '100%' }}>
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
              {t('reports:actions.viewReport')}
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('sales')}>
              {t('reports:actions.exportPDF')}
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('sales')}>
              {t('reports:actions.exportExcel')}
            </Button>
          </Space>
          {salesReport.error && (
            <div style={{ color: 'red' }}>
              {t('common:messages.error')}: {salesReport.error.message}
            </div>
          )}
          {reportData && (
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={t('reports:sales.totalRevenue')}
                  value={reportData.totalRevenue}
                  suffix="₫"
                />
              </Col>
              <Col span={8}>
                <Statistic title={t('reports:sales.totalOrders')} value={reportData.totalOrders} />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('reports:sales.averageOrderValue')}
                  value={reportData.averageOrderValue}
                  suffix="₫"
                />
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <Card title={t('reports:sales.dailySales')}>
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('daily-sales')}
            loading={dailySalesReport.isLoading}
          >
            {t('reports:actions.viewReport')}
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('daily-sales')}>
            {t('reports:actions.exportPDF')}
          </Button>
        </Space>
        {dailySalesReport.error && (
          <div style={{ color: 'red' }}>
            {t('common:messages.error')}: {dailySalesReport.error.message}
          </div>
        )}
      </Card>

      <Card title={t('reports:sales.productPerformance')}>
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('product-performance')}
            loading={productPerformanceReport.isLoading}
          >
            {t('reports:actions.viewReport')}
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExportExcel('product-performance')}
          >
            {t('reports:actions.exportExcel')}
          </Button>
        </Space>
        {productPerformanceReport.error && (
          <div style={{ color: 'red' }}>
            {t('common:messages.error')}: {productPerformanceReport.error.message}
          </div>
        )}
      </Card>
    </Space>
  );

  const renderInventoryReports = () => (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Card title={t('reports:inventory.stock')}>
        <Space>
          <Button type="primary" onClick={() => fetchReport('inventory')} loading={isLoading}>
            {t('reports:actions.viewReport')}
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('inventory')}>
            {t('reports:actions.exportPDF')}
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('inventory')}>
            {t('reports:actions.exportExcel')}
          </Button>
        </Space>
      </Card>

      <Card title={t('reports:inventory.lowStock')}>
        <Space>
          <Button
            type="primary"
            onClick={() => fetchReport('inventory-low-stock')}
            loading={isLoading}
          >
            {t('reports:actions.viewReport')}
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExportExcel('inventory-low-stock')}
          >
            {t('reports:actions.exportExcel')}
          </Button>
        </Space>
      </Card>

      <Card title={t('reports:inventory.movements')}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button
              type="primary"
              onClick={() => fetchReport('inventory-movements')}
              loading={isLoading}
            >
              {t('reports:actions.viewReport')}
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleExportExcel('inventory-movements')}
            >
              {t('reports:actions.exportExcel')}
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );

  const renderCustomerReports = () => (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Card title={t('reports:customers.report')}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button type="primary" onClick={() => fetchReport('customers')} loading={isLoading}>
              {t('reports:actions.viewReport')}
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('customers')}>
              {t('reports:actions.exportExcel')}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('reports:customers.topCustomers')}>
        <Space>
          <Button type="primary" onClick={() => fetchReport('top-customers')} loading={isLoading}>
            {t('reports:actions.viewReport')}
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('top-customers')}>
            {t('reports:actions.exportExcel')}
          </Button>
        </Space>
      </Card>
    </Space>
  );

  const renderFinancialReports = () => (
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Card title={t('reports:financial.report')}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
            />
            <Button type="primary" onClick={() => fetchReport('financial')} loading={isLoading}>
              {t('reports:actions.viewReport')}
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('financial')}>
              {t('reports:actions.exportPDF')}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title={t('reports:financial.profitLoss')}>
        <Space>
          <Button type="primary" onClick={() => fetchReport('profit-loss')} loading={isLoading}>
            {t('reports:actions.viewReport')}
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={() => handleExportPDF('profit-loss')}>
            {t('reports:actions.exportPDF')}
          </Button>
        </Space>
      </Card>

      <Card title={t('reports:financial.cashFlow')}>
        <Space>
          <Button type="primary" onClick={() => fetchReport('cash-flow')} loading={isLoading}>
            {t('reports:actions.viewReport')}
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel('cash-flow')}>
            {t('reports:actions.exportExcel')}
          </Button>
        </Space>
      </Card>
    </Space>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <BarChartOutlined /> {t('reports:title')}
        </Title>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={t('reports:tabs.sales')} key="sales">
            {renderSalesReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('reports:tabs.inventory')} key="inventory">
            {renderInventoryReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('reports:tabs.customers')} key="customers">
            {renderCustomerReports()}
          </Tabs.TabPane>
          <Tabs.TabPane tab={t('reports:tabs.financial')} key="financial">
            {renderFinancialReports()}
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportsPage;
