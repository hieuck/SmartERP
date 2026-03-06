/**
 * Production Order Detail Page
 * View and manage production order details with progress tracking and quality inspection
 * Requirements: 37.1, 38.1, 39.1
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  Steps,
  Progress,
  Tabs,
  Row,
  Col,
  Statistic,
  DatePicker,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import productionService, {
  ProductionProgress,
  QualityInspection,
  Worker,
} from '../../services/productionService';
import dayjs from 'dayjs';
import { useResponsive } from '../../hooks/useResponsive';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ProductionOrderDetail = () => {
  const { isMobile } = useResponsive();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [progressForm] = Form.useForm();
  const [inspectionForm] = Form.useForm();

  // Fetch production order
  const { data: orderData } = useQuery({
    queryKey: ['production-order', id],
    queryFn: () => productionService.productionOrder.getProductionOrder(id!),
  });

  // Fetch progress
  const { data: progressData } = useQuery({
    queryKey: ['production-progress', id],
    queryFn: () => productionService.productionOrder.getProductionProgress(id!),
  });

  // Fetch inspections
  const { data: inspectionsData } = useQuery({
    queryKey: ['quality-inspections', id],
    queryFn: () => productionService.productionOrder.getQualityInspections(id!),
  });

  // Fetch workers
  const { data: workersData } = useQuery({
    queryKey: ['workers', { status: 'active' }],
    queryFn: () => productionService.worker.getWorkers({ status: 'active' }),
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (data: any) =>
      productionService.productionOrder.updateProductionProgress(id!, data),
    onSuccess: () => {
      message.success('Cập nhật tiến độ thành công');
      queryClient.invalidateQueries({ queryKey: ['production-progress'] });
      queryClient.invalidateQueries({ queryKey: ['production-order', id] });
      setProgressModalVisible(false);
      progressForm.resetFields();
    },
    onError: () => {
      message.error('Cập nhật tiến độ thất bại');
    },
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: (data: any) => productionService.productionOrder.createQualityInspection(id!, data),
    onSuccess: () => {
      message.success('Tạo phiếu kiểm tra thành công');
      queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['production-order', id] });
      setInspectionModalVisible(false);
      inspectionForm.resetFields();
    },
    onError: () => {
      message.error('Tạo phiếu kiểm tra thất bại');
    },
  });

  const onProgressFinish = (values: any) => {
    updateProgressMutation.mutate(values);
  };

  const onInspectionFinish = (values: any) => {
    createInspectionMutation.mutate({
      ...values,
      inspectionDate: values.inspectionDate.toDate(),
    });
  };

  const order = orderData?.data;
  const completionRate = order ? Math.round((order.producedQuantity / order.quantity) * 100) : 0;

  const stageLabels: Record<string, string> = {
    molding: 'Đúc',
    base_paint: 'Sơn lót',
    color_paint: 'Sơn màu',
    finishing: 'Hoàn thiện',
    inspection: 'Kiểm tra',
  };

  const stageColors: Record<string, string> = {
    molding: 'blue',
    base_paint: 'cyan',
    color_paint: 'green',
    finishing: 'orange',
    inspection: 'purple',
  };

  const progressColumns = [
    {
      title: 'Công đoạn',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => <Tag color={stageColors[stage]}>{stageLabels[stage]}</Tag>,
    },
    {
      title: 'Số lượng hoàn thành',
      dataIndex: 'completedQuantity',
      key: 'completedQuantity',
      align: 'right' as const,
    },
    {
      title: 'Số lượng lỗi',
      dataIndex: 'defectQuantity',
      key: 'defectQuantity',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : undefined }}>{value}</span>
      ),
    },
    {
      title: 'Thợ thực hiện',
      dataIndex: ['worker', 'fullName'],
      key: 'worker',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const inspectionColumns = [
    {
      title: 'Ngày kiểm tra',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const colors: Record<string, string> = {
          pass: 'green',
          fail: 'red',
          needs_repair: 'orange',
        };
        const labels: Record<string, string> = {
          pass: 'Đạt',
          fail: 'Không đạt',
          needs_repair: 'Cần sửa chữa',
        };
        return <Tag color={colors[result]}>{labels[result]}</Tag>;
      },
    },
    {
      title: 'Số lượng đạt',
      dataIndex: 'passedQuantity',
      key: 'passedQuantity',
      align: 'right' as const,
    },
    {
      title: 'Số lượng lỗi',
      dataIndex: 'failedQuantity',
      key: 'failedQuantity',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : undefined }}>{value}</span>
      ),
    },
    {
      title: 'Loại lỗi',
      dataIndex: 'defectType',
      key: 'defectType',
    },
    {
      title: 'Mô tả lỗi',
      dataIndex: 'defectDescription',
      key: 'defectDescription',
    },
  ];

  return (
    <div>
      <Card
        title={`Lệnh sản xuất ${order?.code}`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/orders')}>
            Quay lại
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tiến độ"
                value={completionRate}
                suffix="%"
                prefix={<ClockCircleOutlined />}
              />
              <Progress
                percent={completionRate}
                status={order?.status === 'completed' ? 'success' : 'active'}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã sản xuất"
                value={order?.producedQuantity || 0}
                suffix={`/ ${order?.quantity || 0}`}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Lỗi"
                value={order?.defectQuantity || 0}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Phế phẩm"
                value={order?.wasteQuantity || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Mã lệnh">{order?.code}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={order?.status === 'completed' ? 'green' : 'blue'}>
              {order?.status === 'draft'
                ? 'Nháp'
                : order?.status === 'in_progress'
                  ? 'Đang thực hiện'
                  : order?.status === 'paused'
                    ? 'Tạm dừng'
                    : order?.status === 'completed'
                      ? 'Hoàn thành'
                      : 'Đã hủy'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Sản phẩm">{order?.product?.name}</Descriptions.Item>
          <Descriptions.Item label="Số lượng">{order?.quantity}</Descriptions.Item>
          <Descriptions.Item label="Ngày bắt đầu">
            {order?.startDate && dayjs(order.startDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày dự kiến hoàn thành">
            {order?.expectedEndDate && dayjs(order.expectedEndDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          {order?.actualEndDate && (
            <Descriptions.Item label="Ngày hoàn thành thực tế">
              {dayjs(order.actualEndDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Ghi chú" span={2}>
            {order?.notes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="progress">
          <TabPane tab="Tiến độ sản xuất" key="progress">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setProgressModalVisible(true)}
              style={{ marginBottom: 16 }}
            >
              Cập nhật tiến độ
            </Button>
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={progressColumns}
              dataSource={progressData?.data || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="Kiểm tra chất lượng" key="inspection">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setInspectionModalVisible(true)}
              style={{ marginBottom: 16 }}
            >
              Tạo phiếu kiểm tra
            </Button>
            <Table
              size={isMobile ? 'small' : 'middle'}
              scroll={{ x: 'max-content' }}
              columns={inspectionColumns}
              dataSource={inspectionsData?.data || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Progress Update Modal */}
      <Modal
        title="Cập nhật tiến độ sản xuất"
        open={progressModalVisible}
        onCancel={() => {
          setProgressModalVisible(false);
          progressForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={progressForm} layout="vertical" onFinish={onProgressFinish}>
          <Form.Item
            label="Công đoạn"
            name="stage"
            rules={[{ required: true, message: 'Vui lòng chọn công đoạn' }]}
          >
            <Select>
              <Option value="molding">Đúc</Option>
              <Option value="base_paint">Sơn lót</Option>
              <Option value="color_paint">Sơn màu</Option>
              <Option value="finishing">Hoàn thiện</Option>
              <Option value="inspection">Kiểm tra</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số lượng hoàn thành"
            name="completedQuantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng" />
          </Form.Item>

          <Form.Item label="Số lượng lỗi" name="defectQuantity" initialValue={0}>
            <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng lỗi" min={0} />
          </Form.Item>

          <Form.Item label="Thợ thực hiện" name="workerId">
            <Select placeholder="Chọn thợ" showSearch optionFilterProp="children">
              {workersData?.data?.map((worker: Worker) => (
                <Option key={worker.id} value={worker.id}>
                  {worker.fullName} ({worker.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <TextArea rows={3} placeholder="Nhập ghi chú" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateProgressMutation.isPending}>
                Cập nhật
              </Button>
              <Button
                onClick={() => {
                  setProgressModalVisible(false);
                  progressForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Quality Inspection Modal */}
      <Modal
        title="Tạo phiếu kiểm tra chất lượng"
        open={inspectionModalVisible}
        onCancel={() => {
          setInspectionModalVisible(false);
          inspectionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={inspectionForm}
          layout="vertical"
          onFinish={onInspectionFinish}
          initialValues={{
            inspectionDate: dayjs(),
            result: 'pass',
          }}
        >
          <Form.Item
            label="Ngày kiểm tra"
            name="inspectionDate"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Kết quả"
            name="result"
            rules={[{ required: true, message: 'Vui lòng chọn kết quả' }]}
          >
            <Select>
              <Option value="pass">Đạt</Option>
              <Option value="fail">Không đạt</Option>
              <Option value="needs_repair">Cần sửa chữa</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số lượng đạt"
            name="passedQuantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng đạt" />
          </Form.Item>

          <Form.Item label="Số lượng lỗi" name="failedQuantity" initialValue={0}>
            <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng lỗi" min={0} />
          </Form.Item>

          <Form.Item label="Loại lỗi" name="defectType">
            <Select placeholder="Chọn loại lỗi" allowClear>
              <Option value="molding_defect">Lỗi đúc</Option>
              <Option value="paint_defect">Lỗi sơn</Option>
              <Option value="finishing_defect">Lỗi hoàn thiện</Option>
              <Option value="other">Lỗi khác</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Mô tả lỗi" name="defectDescription">
            <TextArea rows={3} placeholder="Mô tả chi tiết lỗi" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createInspectionMutation.isPending}>
                Tạo phiếu
              </Button>
              <Button
                onClick={() => {
                  setInspectionModalVisible(false);
                  inspectionForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionOrderDetail;
