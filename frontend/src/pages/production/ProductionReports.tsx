// @ts-nocheck
/**
 * Production Reports Page
 * View production dashboard and various reports
 * Requirements: 41.1, 40.7
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, DatePicker, Space, Table, Tabs, Select, Button } from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import productionService from '../../services/productionService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

const ProductionReports = () => {
  const { isMobile } = useResponsive();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Fetch production report
  const { data: productionData, isLoading: productionLoading } = useQuery({
    queryKey: [
      'production-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: () =>
      productionService.report.getProductionReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      }),
  });

  // Fetch material consumption report
  const { data: materialData, isLoading: materialLoading } = useQuery({
    queryKey: [
      'material-consumption-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: () =>
      productionService.report.getMaterialConsumptionReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      }),
  });

  // Fetch cost analysis report
  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: [
      'cost-analysis-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: () =>
      productionService.report.getCostAnalysisReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      }),
  });

  const report = productionData?.data;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const productColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Lỗi',
      dataIndex: 'defects',
      key: 'defects',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : undefined }}>{value.toLocaleString()}</span>
      ),
    },
    {
      title: 'Tỷ lệ lỗi',
      key: 'defectRate',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const rate =
          record.quantity > 0 ? ((record.defects / record.quantity) * 100).toFixed(2) : 0;
        return `${rate}%`;
      },
    },
  ];

  const workerColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: 'Năng suất',
      dataIndex: 'productivity',
      key: 'productivity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Tỷ lệ lỗi',
      dataIndex: 'defectRate',
      key: 'defectRate',
      align: 'right' as const,
      render: (value: number) => `${value.toFixed(2)}%`,
    },
  ];

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
          />
          <Button type="primary" icon={<DownloadOutlined />}>
            Xuất báo cáo
          </Button>
        </Space>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng sản lượng"
                value={report?.totalProduction || 0}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng lỗi"
                value={report?.totalDefects || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ lỗi"
                value={report?.defectRate || 0}
                suffix="%"
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ hoàn thành"
                value={report?.completionRate || 0}
                suffix="%"
                precision={2}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="production">
          <TabPane tab="Sản lượng theo sản phẩm" key="production">
            <Row gutter={16}>
              <Col span={16}>
                <Card title="Biểu đồ sản lượng">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report?.byProduct || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="productName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" fill="#8884d8" name="Số lượng" />
                      <Bar dataKey="defects" fill="#ff4d4f" name="Lỗi" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Phân bố sản lượng">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={report?.byProduct || []}
                        dataKey="quantity"
                        nameKey="productName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {report?.byProduct?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
            <Card title="Chi tiết theo sản phẩm" style={{ marginTop: 16 }}>
              <Table
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: 'max-content' }}
                columns={productColumns}
                dataSource={report?.byProduct || []}
                rowKey="productId"
                pagination={false}
                loading={productionLoading}
              />
            </Card>
          </TabPane>

          <TabPane tab="Năng suất theo nhân viên" key="worker">
            <Row gutter={16}>
              <Col span={24}>
                <Card title="Biểu đồ năng suất">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report?.byWorker || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="workerName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="productivity" fill="#52c41a" name="Năng suất" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
            <Card title="Chi tiết theo nhân viên" style={{ marginTop: 16 }}>
              <Table
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: 'max-content' }}
                columns={workerColumns}
                dataSource={report?.byWorker || []}
                rowKey="workerId"
                pagination={false}
                loading={productionLoading}
              />
            </Card>
          </TabPane>

          <TabPane tab="Tiêu hao nguyên vật liệu" key="material">
            <Card title="Tiêu hao nguyên vật liệu">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={materialData?.data?.materials || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="materialName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consumed" fill="#1890ff" name="Tiêu hao" />
                  <Bar dataKey="cost" fill="#52c41a" name="Chi phí" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabPane>

          <TabPane tab="Phân tích chi phí" key="cost">
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Chi phí nguyên vật liệu"
                    value={costData?.data?.materialCost || 0}
                    suffix="đ"
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Chi phí nhân công"
                    value={costData?.data?.laborCost || 0}
                    suffix="đ"
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng chi phí"
                    value={costData?.data?.totalCost || 0}
                    suffix="đ"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
            <Card title="Biểu đồ chi phí" style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Nguyên vật liệu', value: costData?.data?.materialCost || 0 },
                      { name: 'Nhân công', value: costData?.data?.laborCost || 0 },
                      { name: 'Chi phí khác', value: costData?.data?.overheadCost || 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProductionReports;
