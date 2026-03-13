/**
 * Production Reports Page
 * Displays production, material consumption, and cost analysis reports
 * Requirements: 42.1
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Table, DatePicker, Space, Tabs, Spin } from 'antd';
import {
  BarChartOutlined,
  DollarOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import productionService from '../../services/production/productionService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { RangePicker } = DatePicker;

const ProductionReports = () => {
  const { isMobile } = useResponsive();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const reportParams = {
    startDate: dateRange[0].toDate(),
    endDate: dateRange[1].toDate(),
  };

  // Fetch production report
  const { data: productionReport, isLoading: loadingProduction } = useQuery({
    queryKey: ['productionReport', reportParams],
    queryFn: () => productionService.report.getProductionReport(reportParams),
  });

  // Fetch material consumption report
  const { data: materialReport, isLoading: loadingMaterial } = useQuery({
    queryKey: ['materialConsumptionReport', reportParams],
    queryFn: () => productionService.report.getMaterialConsumptionReport(reportParams),
  });

  // Fetch cost analysis report
  const { data: costReport, isLoading: loadingCost } = useQuery({
    queryKey: ['costAnalysisReport', reportParams],
    queryFn: () => productionService.report.getCostAnalysisReport(reportParams),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodData: any = productionReport?.data?.data || productionReport?.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matData: any = materialReport?.data?.data || materialReport?.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const costData: any = costReport?.data?.data || costReport?.data;

  const productColumns = [
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || 0,
    },
    {
      title: 'Lỗi',
      dataIndex: 'defects',
      key: 'defects',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || 0,
    },
  ];

  const workerColumns = [
    { title: 'Nhân viên', dataIndex: 'workerName', key: 'workerName' },
    {
      title: 'Năng suất',
      dataIndex: 'productivity',
      key: 'productivity',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || 0,
    },
    {
      title: 'Tỷ lệ lỗi',
      dataIndex: 'defectRate',
      key: 'defectRate',
      align: 'right' as const,
      render: (v: number) => `${(v * 100)?.toFixed(1) || 0}%`,
    },
  ];

  const materialColumns = [
    { title: 'Nguyên liệu', dataIndex: 'materialName', key: 'materialName' },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (v: number) => v?.toLocaleString('vi-VN') || 0,
    },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (v: number) => `${v?.toLocaleString('vi-VN') || 0} đ`,
    },
  ];

  const costProductColumns = [
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Chi phí',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (v: number) => `${v?.toLocaleString('vi-VN') || 0} đ`,
    },
  ];

  const tabItems = [
    {
      key: 'production',
      label: (
        <span>
          <BarChartOutlined /> Sản xuất
        </span>
      ),
      children: (
        <Spin spinning={loadingProduction}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic
                  title="Tổng sản xuất"
                  value={prodData?.totalProduction || 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic
                  title="Tổng lỗi"
                  value={prodData?.totalDefects || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic
                  title="Tỷ lệ lỗi"
                  value={((prodData?.defectRate || 0) * 100).toFixed(1)}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic
                  title="Tỷ lệ hoàn thành"
                  value={((prodData?.completionRate || 0) * 100).toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Card title="Theo sản phẩm" size="small">
                <Table
                  columns={productColumns}
                  dataSource={prodData?.byProduct || []}
                  rowKey="productId"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Card title="Theo nhân viên" size="small" style={{ marginTop: isMobile ? 16 : 0 }}>
                <Table
                  columns={workerColumns}
                  dataSource={prodData?.byWorker || []}
                  rowKey="workerId"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      ),
    },
    {
      key: 'materials',
      label: (
        <span>
          <ExperimentOutlined /> Nguyên liệu
        </span>
      ),
      children: (
        <Spin spinning={loadingMaterial}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="Tổng tiêu thụ"
                  value={matData?.totalConsumption || 0}
                  prefix={<ExperimentOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Chi tiết nguyên liệu" size="small">
            <Table
              columns={materialColumns}
              dataSource={matData?.byMaterial || []}
              rowKey="materialId"
              pagination={false}
              size="small"
            />
          </Card>
        </Spin>
      ),
    },
    {
      key: 'costs',
      label: (
        <span>
          <DollarOutlined /> Chi phí
        </span>
      ),
      children: (
        <Spin spinning={loadingCost}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic
                  title="Tổng chi phí"
                  value={costData?.totalCost || 0}
                  suffix="đ"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic title="Nhân công" value={costData?.laborCost || 0} suffix="đ" />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic title="Nguyên liệu" value={costData?.materialCost || 0} suffix="đ" />
              </Card>
            </Col>
            <Col span={isMobile ? 12 : 6}>
              <Card>
                <Statistic title="Chi phí khác" value={costData?.overheadCost || 0} suffix="đ" />
              </Card>
            </Col>
          </Row>

          <Card title="Chi phí theo sản phẩm" size="small">
            <Table
              columns={costProductColumns}
              dataSource={costData?.byProduct || []}
              rowKey="productId"
              pagination={false}
              size="small"
            />
          </Card>
        </Spin>
      ),
    },
  ];

  return (
    <Card title="Báo cáo sản xuất">
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
          format="DD/MM/YYYY"
        />
      </Space>

      <Tabs items={tabItems} defaultActiveKey="production" />
    </Card>
  );
};

export default ProductionReports;
