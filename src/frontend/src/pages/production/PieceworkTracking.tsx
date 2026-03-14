/**
 * Piecework Tracking Page
 * Track worker production output and calculate piece-rate pay
 * Requirements: 34.4, 34.5
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  DatePicker,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Tag,
  Input,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import StandardListPage from '../../components/common/StandardListPage';
import productionService, { Worker } from '../../services/production/productionService';
import { productService } from '../../services/inventory/productService';
import { formatCurrency, formatDate } from '../../utils/responsive';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface PieceworkRecord {
  id: string;
  workerId: string;
  workerName: string;
  productId: string;
  productName: string;
  quantity: number;
  pieceRate: number;
  totalPay: number;
  date: Date;
  notes?: string;
}

export default function PieceworkTracking() {
  const { t } = useTranslation(['production', 'common']);
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [selectedWorker, setSelectedWorker] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: async () => {
      const response = await productionService.worker.getWorkers({ status: 'active' });
      return response.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await productService.getProducts();
      return response.data;
    },
  });

  // Fetch piecework records
  const { data: recordsData, isLoading } = useQuery({
    queryKey: [
      'piecework',
      {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        workerId: selectedWorker,
      },
    ],
    queryFn: async () => {
      const response = await productionService.piecework.getPieceworkRecords({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        workerId: selectedWorker,
      });
      return response.data;
    },
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: [
      'piecework-stats',
      {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        workerId: selectedWorker,
      },
    ],
    queryFn: async () => {
      const response = await productionService.piecework.getPieceworkStatistics({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        workerId: selectedWorker,
      });
      return response.data;
    },
  });

  const records = recordsData || [];
  const stats = statsData || {
    totalQuantity: 0,
    totalPay: 0,
    totalWorkers: 0,
    avgPayPerWorker: 0,
    workerSummary: [],
  };

  // Add piecework record
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await productionService.piecework.createPieceworkRecord(data);
      return response.data;
    },
    onSuccess: () => {
      message.success(t('production:messages.saveSuccess'));
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['piecework'] });
      queryClient.invalidateQueries({ queryKey: ['piecework-stats'] });
    },
    onError: () => {
      message.error(t('production:messages.saveError'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await productionService.piecework.deletePieceworkRecord(id);
    },
    onSuccess: () => {
      message.success(t('production:messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['piecework'] });
      queryClient.invalidateQueries({ queryKey: ['piecework-stats'] });
    },
    onError: () => {
      message.error(t('production:messages.deleteError'));
    },
  });

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const product = productsData?.find((p: any) => p.id === values.productId);

      addMutation.mutate({
        workerId: values.workerId,
        productId: values.productId,
        productName: product?.name || '',
        quantity: values.quantity,
        pieceRate: values.pieceRate,
        date: values.date.format('YYYY-MM-DD'),
        notes: values.notes,
      });
    });
  };

  const columns: ColumnsType<PieceworkRecord> = [
    {
      title: t('production:piecework.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: Date) => formatDate(date),
    },
    {
      title: t('production:piecework.worker'),
      dataIndex: ['worker', 'fullName'],
      key: 'workerName',
      ellipsis: true,
    },
    {
      title: t('production:piecework.product'),
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: t('production:piecework.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:piecework.pieceRate'),
      dataIndex: 'pieceRate',
      key: 'pieceRate',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('production:piecework.totalPay'),
      dataIndex: 'totalPay',
      key: 'totalPay',
      width: 130,
      align: 'right' as const,
      render: (value: number) => <Tag color="green">{formatCurrency(value)}</Tag>,
    },
  ];

  const summaryColumns: ColumnsType<any> = [
    {
      title: t('production:piecework.worker'),
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: t('production:piecework.totalQuantity'),
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: t('production:piecework.totalPay'),
      dataIndex: 'totalPay',
      key: 'totalPay',
      align: 'right' as const,
      render: (value: number) => (
        <Tag color="green" style={{ fontSize: 14, fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </Tag>
      ),
    },
  ];

  const filterComponents = (
    <Space wrap>
      <RangePicker
        value={dateRange}
        onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
        format="DD/MM/YYYY"
      />
      <Select
        placeholder={t('production:piecework.selectWorker')}
        style={{ width: 200 }}
        allowClear
        value={selectedWorker}
        onChange={setSelectedWorker}
      >
        {workersData?.map((worker: Worker) => (
          <Option key={worker.id} value={worker.id}>
            {worker.fullName}
          </Option>
        ))}
      </Select>
    </Space>
  );

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:piecework.totalQuantity')}
              value={stats.totalQuantity}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:piecework.totalAmount')}
              value={stats.totalPay}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:piecework.totalWorkers')}
              value={stats.totalWorkers}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('production:piecework.avgPerWorker')}
              value={stats.avgPayPerWorker}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Worker Summary */}
      <Card title={t('production:piecework.workerSummary')} style={{ marginBottom: 16 }}>
        <StandardListPage
          columns={summaryColumns}
          dataSource={stats.workerSummary || []}
          pagination={false}
        />
      </Card>

      {/* Detailed Records */}
      <StandardListPage
        title={t('production:piecework.detailedRecords')}
        createButtonText={t('production:piecework.recordOutput')}
        onCreateClick={() => setModalVisible(true)}
        filters={filterComponents}
        columns={columns}
        dataSource={records}
        loading={isLoading || addMutation.isPending || deleteMutation.isPending}
        onDelete={(record) => deleteMutation.mutate(record.id)}
        deleteConfirmTitle={t('production:messages.deleteConfirm')}
        pagination={{
          current: 1,
          pageSize: 20,
          total: records.length,
          showTotal: (total: number) => t('production:messages.total', { total }),
          onChange: () => {},
        }}
      />

      {/* Add Modal */}
      <Modal
        title={t('production:piecework.recordOutput')}
        open={modalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText={t('production:actions.save')}
        cancelText={t('production:actions.cancel')}
        confirmLoading={addMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label={t('production:piecework.date')}
            rules={[{ required: true, message: t('production:validation.required') }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="workerId"
            label={t('production:piecework.worker')}
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select
              placeholder={t('production:piecework.selectWorker')}
              showSearch
              optionFilterProp="children"
            >
              {workersData?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} - {worker.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="productId"
            label={t('production:piecework.product')}
            rules={[{ required: true, message: t('production:validation.required') }]}
          >
            <Select
              placeholder={t('production:piecework.selectProduct')}
              showSearch
              optionFilterProp="children"
            >
              {productsData?.map((product: any) => (
                <Option key={product.id} value={product.id}>
                  {product.name} - {product.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t('production:piecework.quantity')}
            rules={[
              { required: true, message: t('production:validation.required') },
              { type: 'number', min: 1, message: t('production:validation.minQuantity') },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="pieceRate"
            label={t('production:piecework.ratePerUnit')}
            rules={[
              { required: true, message: t('production:validation.required') },
              { type: 'number', min: 0, message: t('production:validation.invalidAmount') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="notes" label={t('production:piecework.notes')}>
            <Input.TextArea rows={3} placeholder={t('production:piecework.notes')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
