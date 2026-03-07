/**
 * Piecework Tracking Page
 * Track worker production output and calculate piece-rate pay
 * Requirements: 34.4, 34.5
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
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
import productionService, { Worker } from '../../services/productionService';
import { productService } from '../../services/productService';
import dayjs, { Dayjs } from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, formatDate } from '../../constants/ui';
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

const PieceworkTracking = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
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
      message.success('Ghi nhận công khoán thành công');
      setModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['piecework'] });
      queryClient.invalidateQueries({ queryKey: ['piecework-stats'] });
    },
    onError: () => {
      message.error('Ghi nhận công khoán thất bại');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await productionService.piecework.deletePieceworkRecord(id);
    },
    onSuccess: () => {
      message.success('Xóa bản ghi thành công');
      queryClient.invalidateQueries({ queryKey: ['piecework'] });
      queryClient.invalidateQueries({ queryKey: ['piecework-stats'] });
    },
    onError: () => {
      message.error('Xóa bản ghi thất bại');
    },
  });

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const product = productsData?.find((p) => p.id === values.productId);
      const worker = workersData?.find((w) => w.id === values.workerId);

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
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: isMobile ? 80 : 100,
      render: (date: Date) => formatDate(date),
    },
    {
      title: 'Công nhân',
      dataIndex: ['worker', 'fullName'],
      key: 'workerName',
      width: isMobile ? 100 : 150,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: isMobile ? 70 : 100,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'pieceRate',
      key: 'pieceRate',
      width: isMobile ? 80 : 120,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPay',
      key: 'totalPay',
      width: isMobile ? 90 : 130,
      align: 'right' as const,
      render: (value: number) => <Tag color="green">{formatCurrency(value)}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: any, record: PieceworkRecord) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => {
            Modal.confirm({
              title: 'Xác nhận xóa',
              content: 'Bạn có chắc muốn xóa bản ghi này?',
              onOk: () => deleteMutation.mutate(record.id),
            });
          }}
        >
          Xóa
        </Button>
      ),
    },
  ];

  // Group by worker for summary
  const workerSummary = stats.workerSummary || [];

  const summaryColumns: ColumnsType<any> = [
    {
      title: 'Công nhân',
      dataIndex: 'workerName',
      key: 'workerName',
    },
    {
      title: 'Tổng sản lượng',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Tổng tiền',
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

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>Chấm công khoán</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Ghi nhận sản lượng
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng sản lượng"
              value={stats.totalQuantity}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng tiền công"
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
              title="Số công nhân"
              value={stats.totalWorkers}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="TB/công nhân"
              value={stats.avgPayPerWorker}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="DD/MM/YYYY"
          />
          <Select
            placeholder="Chọn công nhân"
            style={{ width: 200 }}
            allowClear
            value={selectedWorker}
            onChange={setSelectedWorker}
          >
            {workersData?.map((worker) => (
              <Option key={worker.id} value={worker.id}>
                {worker.fullName}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Worker Summary */}
      <Card title="Tổng hợp theo công nhân" style={{ marginBottom: 16 }}>
        <Table
          columns={summaryColumns}
          dataSource={workerSummary}
          rowKey="workerId"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Detailed Records */}
      <Card title="Chi tiết sản lượng">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title="Ghi nhận sản lượng"
        open={modalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="workerId"
            label="Công nhân"
            rules={[{ required: true, message: 'Vui lòng chọn công nhân' }]}
          >
            <Select placeholder="Chọn công nhân" showSearch optionFilterProp="children">
              {workersData?.map((worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} - {worker.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="productId"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select placeholder="Chọn sản phẩm" showSearch optionFilterProp="children">
              {productsData?.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} - {product.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="pieceRate"
            label="Đơn giá (VNĐ/sản phẩm)"
            rules={[
              { required: true, message: 'Vui lòng nhập đơn giá' },
              { type: 'number', min: 0, message: 'Đơn giá phải lớn hơn hoặc bằng 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PieceworkTracking;
