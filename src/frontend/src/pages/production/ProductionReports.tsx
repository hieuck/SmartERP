/**
 * Production Reports Page
 * View production analytics and reports
 * Requirements: 38.1
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Table,
  Tag,
  Tabs,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import productionService from '@/services/production/productionService';
import { formatCurrency } from '@/utils/responsive';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export default function ProductionReports() {
  const { t } = useTranslation(['production', 'common']);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Fetch production report
  const { data: productionReport, isLoading: loadingProduction } = useQuery({
    queryKey: [
      'production-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: async () => {
      const response = await productionService.report.getProductionReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      return response.data;
    },
  });

  // Fetch material consumption report
  const { data: materialReport, isLoading: loadingMaterial } = useQuery({
    queryKey: [
      'material-consumption-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: async () => {
      const response = await productionService.report.getMaterialConsumptionReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      return response.data;
    },
  });

  // Fetch cost analysis report
  const { data: costReport, isLoading: loadingCost } = useQuery({
    queryKey: [
      'cost-analysis-report',
      {
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      },
    ],
    queryFn: async () => {
      const response = await productionService.report.getCostAnalysisReport({
        startDate: dateRange[0].toDate(),
        endDate: dateRange[1].toDate(),
      });
      return response.data;
    },
  });

  const productColumns: ColumnsType<any> = [
    {
      title: t('production:orders.product'),
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: t('production:orders.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:reports.defectRate'),
      key: 'defectRate',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const rate = record.quantity > 0 ? ((record.defects / record.quantity) * 100).toFixed(1) : 0;
        return (
          <Tag color={Number(rate) > 5 ? 'red' : 'green'}>
            {rate}%
          </Tag>
        );
      },
    },
  ];

  const workerColumns: ColumnsType<any> = [
    {
      title: t('production:workers.name'),
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: t('production:reports.productivity'),
      dataIndex: 'productivity',
      key: 'productivity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:reports.defectRate'),
      dataIndex: 'defectRate',
      key: 'defectRate',
      align: 'right' as const,
      render: (value: number) => (
        <Tag color={value > 5 ? 'red' : 'green'}>
          {value.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const materialColumns: ColumnsType<any> = [
    {
      title: t('production:materials.name'),
      dataIndex: 'materialName',
      key: 'materialName',
    },
    {
      title: t('production:piecework.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:molds.cost'),
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
  ];

  const costColumns: ColumnsType<any> = [
    {
      title: t('production:orders.product'),
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: t('production:molds.cost'),
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
  ];

  return (
    <div>
      <Card
        title={t('production:reports.title')}
        extra={
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
          />
        }
      >
        <Tabs defaultActiveKey="production">
          <TabPane tab={t('production:reports.productionReport')} key="production">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.totalProduction')}
                    value={productionReport?.totalProduction || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.totalDefects')}
                    value={productionReport?.totalDefects || 0}
                    prefix={<CloseCircleOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.defectRate')}
                    value={productionReport?.defectRate || 0}
                    suffix="%"
                    valueStyle={{
                      color: (productionReport?.defectRate || 0) > 5 ? '#cf1322' : '#3f8600',
                    }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.completionRate')}
                    value={productionReport?.completionRate || 0}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Card title={t('production:reports.byProduct')} style={{ marginBottom: 16 }}>
              <Table
                columns={productColumns}
                dataSource={productionReport?.byProduct || []}
                loading={loadingProduction}
                pagination={false}
                size="small"
              />
            </Card>

            <Card title={t('production:reports.byWorker')}>
              <Table
                columns={workerColumns}
                dataSource={productionReport?.byWorker || []}
                loading={loadingProduction}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab={t('production:reports.materialConsumption')} key="material">
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card>
                  <Statistic
                    title={t('production:reports.totalConsumption')}
                    value={materialReport?.totalConsumption || 0}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>
            </Row>

            <Card title={t('production:reports.byMaterial')}>
              <Table
                columns={materialColumns}
                dataSource={materialReport?.byMaterial || []}
                loading={loadingMaterial}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab={t('production:reports.costAnalysis')} key="cost">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.totalCost')}
                    value={costReport?.totalCost || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.laborCost')}
                    value={costReport?.laborCost || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.materialCost')}
                    value={costReport?.materialCost || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title={t('production:reports.overheadCost')}
                    value={costReport?.overheadCost || 0}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>
            </Row>

            <Card title={t('production:reports.byProduct')}>
              <Table
                columns={costColumns}
                dataSource={costReport?.byProduct || []}
                loading={loadingCost}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
